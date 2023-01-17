import { RetryStrategy } from './RetryStrategy';
import { Logger } from '../utils';
import {
  ATTEMPT_TO_CONNECT,
  CONNECTED,
  CONNECTION_IS_NOT_DEFINED,
  DISCONNECTED,
  FAILED_ATTEMPT_TO_CONNECT,
  FAILED_TO_CONNECT
} from './messages';
import type { Connection } from './Connection';
import type { Network } from '../network';
import { DefaultNetwork } from './DefaultNetwork';
import CDP, { Version, Client, Options } from 'chrome-remote-interface';

export class CDPConnection implements Connection {
  private _network?: Network;
  private _cdp?: Client;

  get cdp() {
    return this._cdp;
  }

  constructor(
    private readonly options: Options,
    private readonly logger: Logger,
    private readonly retryStrategy: RetryStrategy
  ) {}

  public async open(): Promise<void> {
    try {
      this.logger.debug(ATTEMPT_TO_CONNECT);

      const target = await this.populateBrowserTarget();

      const cdp = await CDP({
        target
      });

      this.logger.debug(CONNECTED);

      cdp.once('disconnect', (): void => this.logger.debug(DISCONNECTED));

      this._cdp = cdp;
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
    if (this._cdp) {
      await this._cdp.close();
      this._cdp.removeAllListeners();
      delete this._cdp;
      this.logger.debug(DISCONNECTED);
    }
  }

  public discoverNetwork(): Network {
    if (!this.cdp) {
      this.logger.debug(CONNECTION_IS_NOT_DEFINED);

      return;
    }

    if (!this._network) {
      this._network = new DefaultNetwork(this.cdp);
    }

    return this._network;
  }

  private async populateBrowserTarget(): Promise<string> {
    const { port, host } = this.options;
    const { webSocketDebuggerUrl } = await Version({
      host,
      port
    });

    return webSocketDebuggerUrl ?? `ws://${host}:${port}/devtools/browser`;
  }
}
