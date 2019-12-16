import connect, {
  ChromeRemoteInterface,
  ChromeRemoteInterfaceOptions
} from 'chrome-remote-interface';
import { RetryStrategy } from './RetryStrategy';
import { Logger } from '../utils';
import Timeout = NodeJS.Timeout;
import * as CRIOutputMessages from './CRIOutputMessages';

export class CRIConnection {
  constructor(
    private readonly options: ChromeRemoteInterfaceOptions,
    private readonly logger: Logger,
    private readonly retryStrategy: RetryStrategy
  ) {}

  public async open(): Promise<ChromeRemoteInterface> {
    try {
      this.logger.debug(CRIOutputMessages.ATTEMPT_TO_CONNECT);

      const { host, port } = this.options;

      const chromeRemoteInterface: ChromeRemoteInterface = await connect({
        host,
        port
      });

      const { Security } = chromeRemoteInterface;

      await Security.enable();
      await Security.setOverrideCertificateErrors({ override: true });

      Security.certificateError(({ eventId }) =>
        Security.handleCertificateError({ eventId, action: 'continue' })
      );

      this.logger.debug(CRIOutputMessages.CONNECTED);

      chromeRemoteInterface.once('disconnect', () =>
        this.logger.debug(CRIOutputMessages.DISCONNECTED)
      );

      return chromeRemoteInterface;
    } catch (e) {
      this.logger.debug(
        `${CRIOutputMessages.FAILED_ATTEMPT_TO_CONNECT}: ${e.message}`
      );

      return this.scheduleReconnect();
    }
  }

  private async scheduleReconnect(): Promise<ChromeRemoteInterface> {
    const timeout: number | undefined = this.retryStrategy.getNextTime();

    if (!timeout) {
      throw new Error(CRIOutputMessages.FAILED_TO_CONNECT);
    }

    await this.delay(timeout);

    return this.open();
  }

  private delay(timeout: number): Promise<void> {
    return new Promise<void>(
      (resolve): Timeout => setTimeout(resolve, timeout)
    );
  }
}
