import connect, {
  ChromeRemoteInterface,
  ChromeRemoteInterfaceOptions,
  Network,
  Security
} from 'chrome-remote-interface';
import { RetryStrategy } from './RetryStrategy';
import { Logger } from '../utils';
import * as CRIOutputMessages from './CRIOutputMessages';
import ProtocolMapping from 'devtools-protocol/types/protocol-mapping';

export type ChromeRemoteInterfaceMethod = keyof ProtocolMapping.Events;

export type ChromeRemoteInterfaceEvent = {
  method: ChromeRemoteInterfaceMethod;
  params?: ProtocolMapping.Events[ChromeRemoteInterfaceMethod][0];
};

export class CRIConnection {
  private chromeRemoteInterface?: ChromeRemoteInterface;

  constructor(
    private readonly options: ChromeRemoteInterfaceOptions,
    private readonly logger: Logger,
    private readonly retryStrategy: RetryStrategy
  ) {}

  get network(): Network | undefined {
    return this.chromeRemoteInterface?.Network;
  }

  get security(): Security | undefined {
    return this.chromeRemoteInterface?.Security;
  }

  public async open(): Promise<void> {
    try {
      this.logger.debug(CRIOutputMessages.ATTEMPT_TO_CONNECT);

      const { host, port } = this.options;

      const chromeRemoteInterface: ChromeRemoteInterface = await connect({
        host,
        port
      });

      this.logger.debug(CRIOutputMessages.CONNECTED);

      chromeRemoteInterface.once('disconnect', (): void =>
        this.logger.debug(CRIOutputMessages.DISCONNECTED)
      );

      this.chromeRemoteInterface = chromeRemoteInterface;
    } catch (e) {
      this.logger.debug(
        `${CRIOutputMessages.FAILED_ATTEMPT_TO_CONNECT}: ${e.message}`
      );

      if (
        !(await this.retryStrategy.execute((): Promise<void> => this.open()))
      ) {
        throw new Error(CRIOutputMessages.FAILED_TO_CONNECT);
      }
    }
  }

  public async close(): Promise<void> {
    if (this.chromeRemoteInterface) {
      await this.chromeRemoteInterface.close();
      this.chromeRemoteInterface.removeAllListeners();
      delete this.chromeRemoteInterface;
      this.logger.debug(CRIOutputMessages.DISCONNECTED);
    }
  }

  public async subscribe(
    callback: (event: ChromeRemoteInterfaceEvent) => void
  ): Promise<void> {
    if (!this.chromeRemoteInterface) {
      this.logger.debug(CRIOutputMessages.CONNECTION_IS_NOT_DEFINED);

      return;
    }

    this.chromeRemoteInterface.on('event', callback);

    await Promise.all([this.security?.enable(), this.network?.enable()]);
  }
}
