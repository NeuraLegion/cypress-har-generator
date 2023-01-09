import { RetryStrategy } from './RetryStrategy';
import { Logger } from '../utils';
import {
  ATTEMPT_TO_CONNECT,
  CONNECTED,
  CONNECTION_IS_NOT_DEFINED,
  DISCONNECTED,
  FAILED_ATTEMPT_TO_CONNECT,
  FAILED_TO_CONNECT
} from './CRIOutputMessages';
import { Connection } from './Connection';
import connect, {
  ChromeRemoteInterface,
  ChromeRemoteInterfaceOptions,
  Network,
  Security
} from 'chrome-remote-interface';
import type ProtocolMapping from 'devtools-protocol/types/protocol-mapping';

export type ChromeRemoteInterfaceMethod = keyof ProtocolMapping.Events;

export type ChromeRemoteInterfaceEvent = {
  method: ChromeRemoteInterfaceMethod;
  params?: ProtocolMapping.Events[ChromeRemoteInterfaceMethod][0];
};

export class CRIConnection implements Connection {
  private chromeRemoteInterface?: ChromeRemoteInterface;

  get network(): Network | undefined {
    return this.chromeRemoteInterface?.Network;
  }

  get security(): Security | undefined {
    return this.chromeRemoteInterface?.Security;
  }

  constructor(
    private readonly options: ChromeRemoteInterfaceOptions,
    private readonly logger: Logger,
    private readonly retryStrategy: RetryStrategy
  ) {}

  public async open(): Promise<void> {
    try {
      this.logger.debug(ATTEMPT_TO_CONNECT);

      const { host, port } = this.options;

      const chromeRemoteInterface: ChromeRemoteInterface = await connect({
        host,
        port
      });

      this.logger.debug(CONNECTED);

      chromeRemoteInterface.once('disconnect', (): void =>
        this.logger.debug(DISCONNECTED)
      );

      this.chromeRemoteInterface = chromeRemoteInterface;
    } catch (e) {
      this.logger.debug(`${FAILED_ATTEMPT_TO_CONNECT}: ${e.message}`);

      if (
        !(await this.retryStrategy.execute((): Promise<void> => this.open()))
      ) {
        throw new Error(FAILED_TO_CONNECT);
      }
    }
  }

  public async close(): Promise<void> {
    if (this.chromeRemoteInterface) {
      await this.chromeRemoteInterface.close();
      this.chromeRemoteInterface.removeAllListeners();
      delete this.chromeRemoteInterface;
      this.logger.debug(DISCONNECTED);
    }
  }

  public async subscribe(
    callback: (event: ChromeRemoteInterfaceEvent) => void
  ): Promise<void> {
    if (!this.chromeRemoteInterface) {
      this.logger.debug(CONNECTION_IS_NOT_DEFINED);

      return;
    }

    this.chromeRemoteInterface.on('event', callback);
  }
}
