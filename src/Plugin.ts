import { type Logger } from './utils/Logger.js';
import { type FileManager } from './utils/FileManager.js';
import type {
  HarExporterFactory,
  HarExporterOptions
} from './network/HarExporterFactory.js';
import { ErrorUtils } from './utils/ErrorUtils.js';
import {
  ADDRESS_OPTION_NAME,
  MAX_NETWORK_IDLE_THRESHOLD,
  MAX_NETWORK_IDLE_DURATION,
  PORT_OPTION_NAME,
  SUPPORTED_BROWSERS
} from './constants.js';
import { type ConnectionFactory } from './cdp/ConnectionFactory.js';
import { type NetworkObserverOptions } from './network/NetworkObserverOptions.js';
import { type NetworkOptions } from './cdp/NetworkOptions.js';
import { type HarExporter } from './network/HarExporter.js';
import { type Observer } from './network/Observer.js';
import { type NetworkRequest } from './network/NetworkRequest.js';
import { type Connection } from './cdp/Connection.js';
import { type ObserverFactory } from './network/ObserverFactory.js';
import { HarBuilder } from './network/HarBuilder.js';
import { NetworkIdleMonitor } from './network/NetworkIdleMonitor.js';
import { promisify } from 'node:util';
import { EOL } from 'node:os';
import { join } from 'node:path';

export interface SaveOptions {
  fileName: string;
  outDir: string;
  waitForIdle?: boolean;
  minIdleDuration?: number;
  maxWaitDuration?: number;
}

export type RecordOptions = NetworkObserverOptions &
  HarExporterOptions &
  NetworkOptions;

interface Addr {
  port: number;
  host: string;
}

export class Plugin {
  private exporter?: HarExporter;
  private networkObservable?: Observer<NetworkRequest>;
  private addr?: Addr;
  private _connection?: Connection;

  constructor(
    private readonly logger: Logger,
    private readonly fileManager: FileManager,
    private readonly connectionFactory: ConnectionFactory,
    private readonly observerFactory: ObserverFactory,
    private readonly exporterFactory: HarExporterFactory
  ) {}

  public ensureBrowserFlags(
    browser: Cypress.Browser,
    args: string[]
  ): string[] {
    if (!this.isSupportedBrowser(browser)) {
      throw new Error(
        `An unsupported browser family was used: ${browser.name}`
      );
    }

    const electronUsed = browser.name === 'electron';

    if (electronUsed) {
      args = this.parseElectronSwitches(browser);
    }

    const browserFlags: string[] = this.ensureRdpAddrArgs(args);

    return electronUsed
      ? []
      : browserFlags.filter((x: string): boolean => !args.includes(x));
  }

  public async recordHar(options: RecordOptions): Promise<void> {
    await this.closeConnection();

    if (!this.addr) {
      throw new Error(
        `Please call the 'ensureBrowserFlags' before attempting to start the recording.`
      );
    }

    this.exporter = await this.exporterFactory.create(options);
    this._connection = this.connectionFactory.create({
      ...this.addr,
      maxRetries: 20,
      maximumBackoff: 100,
      initialBackoff: 5
    });

    await this._connection.open();

    await this.listenNetworkEvents(options);
  }

  public async saveHar(options: SaveOptions): Promise<void> {
    const filePath = join(options.outDir, options.fileName);

    if (!this._connection) {
      this.logger.err(`Failed to save HAR. First you should start recording.`);

      return;
    }

    try {
      await this.fileManager.createFolder(options.outDir);

      if (options.waitForIdle) {
        await this.waitForNetworkIdle(options);
      }

      const har: string | undefined = await this.buildHar();

      if (har) {
        await this.fileManager.writeFile(filePath, har);
      }
    } catch (e) {
      const message = ErrorUtils.isError(e) ? e.message : e;
      this.logger.err(
        `An error occurred while attempting to save the HAR file. Error details: ${message}`
      );
    } finally {
      await this.disposeOfHar();
    }
  }

  public async disposeOfHar(): Promise<void> {
    await this.networkObservable?.unsubscribe();
    delete this.networkObservable;

    if (this.exporter) {
      this.exporter.end();
      await this.fileManager.removeFile(this.exporter.path);
      delete this.exporter;
    }
  }

  private parseElectronSwitches(browser: Cypress.Browser): string[] {
    if (!process.env.ELECTRON_EXTRA_LAUNCH_ARGS?.includes(PORT_OPTION_NAME)) {
      this.logger
        .err(`The '${browser.name}' browser was detected, however, the required '${PORT_OPTION_NAME}' command line switch was not provided. 
This switch is necessary to enable remote debugging over HTTP on the specified port. 

Please refer to the documentation:
  - https://www.electronjs.org/docs/latest/api/command-line-switches#--remote-debugging-portport
  - https://docs.cypress.io/api/plugins/browser-launch-api#Modify-Electron-app-switches`);
      throw new Error(
        `Missing '${PORT_OPTION_NAME}' command line switch for Electron browser`
      );
    }

    return process.env.ELECTRON_EXTRA_LAUNCH_ARGS.split(' ');
  }

  private async buildHar(): Promise<string | undefined> {
    if (this.exporter) {
      const content = await this.fileManager.readFile(this.exporter.path);

      if (content) {
        const entries = content
          .split(EOL)
          .filter(Boolean)
          .map(x => JSON.parse(x));

        const har = new HarBuilder(entries).build();

        return JSON.stringify(har, null, 2);
      }
    }

    return undefined;
  }

  private async waitForNetworkIdle(
    options: Pick<SaveOptions, 'minIdleDuration' | 'maxWaitDuration'>
  ): Promise<void> {
    const {
      minIdleDuration = MAX_NETWORK_IDLE_THRESHOLD,
      maxWaitDuration = MAX_NETWORK_IDLE_DURATION
    } = options;
    const cancellation = promisify(setTimeout)(maxWaitDuration);

    return Promise.race([
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      new NetworkIdleMonitor(this.networkObservable!).waitForIdle(
        minIdleDuration
      ),
      cancellation
    ]);
  }

  private async listenNetworkEvents(options: RecordOptions): Promise<void> {
    const network = this._connection?.discoverNetwork(options);

    this.networkObservable = this.observerFactory.createNetworkObserver(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      network!,
      options
    );

    return this.networkObservable.subscribe((request: NetworkRequest) =>
      this.exporter?.write(request)
    );
  }

  private async closeConnection(): Promise<void> {
    if (this._connection) {
      await this._connection.close();
      delete this._connection;
    }
  }

  private isSupportedBrowser(browser: Cypress.Browser): boolean {
    return SUPPORTED_BROWSERS.includes(browser.family);
  }

  private ensureRdpAddrArgs(args: string[]): string[] {
    const {
      host = 'localhost',
      port = 40000 + Math.round(Math.random() * 25000)
    } = this.extractAddrFromArgs(args);

    this.addr = { host, port };

    return [
      ...args,
      `${PORT_OPTION_NAME}=${port}`,
      `${ADDRESS_OPTION_NAME}=${host}`
    ];
  }

  private extractAddrFromArgs(args: string[]): Partial<Addr> {
    const port: string | undefined = this.findAndParseIfPossible(
      args,
      PORT_OPTION_NAME
    );
    const host: string | undefined = this.findAndParseIfPossible(
      args,
      ADDRESS_OPTION_NAME
    );

    let addr: { port?: number; host?: string } = {};

    if (port && !isNaN(+port)) {
      addr = { port: +port };
    }

    if (host) {
      addr = { ...addr, host };
    }

    return addr;
  }

  private findAndParseIfPossible(
    args: string[],
    optionName: string
  ): string | undefined {
    const arg: string | undefined = args.find((x: string): boolean =>
      x.startsWith(optionName)
    );
    const [, value]: string[] = arg?.split('=', 2) ?? [];

    return value;
  }
}
