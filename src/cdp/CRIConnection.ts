import chromeRemoteInterfaceFactory, {
  ChromeRemoteInterface,
  ChromeRemoteInterfaceOptions
} from 'chrome-remote-interface';
import { RetryStrategy } from './RetryStrategy';
import { Logger } from '../utils';
import Timeout = NodeJS.Timeout;

export class CRIConnection {
  constructor(
    private readonly options: ChromeRemoteInterfaceOptions,
    private readonly logger: Logger,
    private readonly retryStrategy: RetryStrategy
  ) {}

  public async open(): Promise<ChromeRemoteInterface> {
    try {
      this.logger.info('Attempting to connect to Chrome Debugging Protocol');

      const { host, port } = this.options;

      const cdp: ChromeRemoteInterface = await chromeRemoteInterfaceFactory({
        host,
        port
      });

      const { Security } = cdp;

      await Security.enable();
      await Security.setOverrideCertificateErrors({ override: true });

      Security.certificateError(({ eventId }) =>
        Security.handleCertificateError({ eventId, action: 'continue' })
      );

      this.logger.info('Connected to Chrome Debugging Protocol');

      cdp.once('disconnect', () =>
        this.logger.info('Chrome Debugging Protocol disconnected')
      );

      return cdp;
    } catch (e) {
      this.logger.err(
        `Failed to connect to Chrome Debugging Protocol: ${e.message}`
      );

      return this.scheduleReconnect();
    }
  }

  private async scheduleReconnect(): Promise<ChromeRemoteInterface> {
    const timeout: number | undefined = this.retryStrategy.getNextTime();

    if (!timeout) {
      throw new Error(`Failed to connect to Chrome Debugging Protocol.`);
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
