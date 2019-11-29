import chromeRemoteInterfaceFactory, {
  ChromeRemoteInterface,
  ChromeRemoteInterfaceOptions
} from 'chrome-remote-interface';
import { RetryStrategy } from './RetryStrategy';
import { Logger } from '../utils';
import Timeout = NodeJS.Timeout;

export class CDPFactory {
  private readonly BROWSER_TARGET = '/devtools/browser';

  constructor(
    private readonly options: ChromeRemoteInterfaceOptions,
    private readonly logger: Logger,
    private readonly retryStrategy: RetryStrategy
  ) {}

  public async Create(): Promise<ChromeRemoteInterface> {
    try {
      this.logger.info('Attempting to connect to Chrome Debugging Protocol');

      const { host, port } = this.options;
      const { Version } = chromeRemoteInterfaceFactory;
      const { webSocketDebuggerUrl } = await Version({
        host,
        port
      });

      const cdp: ChromeRemoteInterface = await chromeRemoteInterfaceFactory({
        host,
        port,
        target: webSocketDebuggerUrl ?? this.BROWSER_TARGET
      });

      this.logger.info('Connected to Chrome Debugging Protocol');

      const { Security } = cdp;

      await Security.enable();
      await Security.setOverrideCertificateErrors({ override: true });

      Security.certificateError(({ eventId }) =>
        Security.handleCertificateError({ eventId, action: 'continue' })
      );

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

    return this.Create();
  }

  private delay(timeout: number): Promise<void> {
    return new Promise<void>(
      (resolve): Timeout => setTimeout(resolve, timeout)
    );
  }
}
