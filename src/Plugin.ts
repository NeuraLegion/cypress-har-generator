import { FileManager, Logger } from './utils';
import { Connection, ConnectionFactory } from './cdp';
import {
  EntryBuilder,
  HarBuilder,
  NetworkIdleMonitor,
  NetworkObserverOptions,
  NetworkRequest,
  Observer,
  ObserverFactory
} from './network';
import { join } from 'path';
import { WriteStream } from 'fs';
import { EOL } from 'os';
import { promisify } from 'util';

export interface SaveOptions {
  fileName: string;
  outDir: string;
  waitForIdle?: boolean;
}

export type RecordOptions = NetworkObserverOptions;

interface Addr {
  port: number;
  host: string;
}

export class Plugin {
  private buffer?: WriteStream;

  private get tmpPath() {
    if (this.buffer) {
      const { path } = this.buffer;

      return Buffer.isBuffer(path) ? path.toString('utf-8') : path;
    }
  }

  private networkObservable?: Observer<NetworkRequest>;
  private addr?: Addr;
  private connection?: Connection;
  private readonly PORT_OPTION_NAME = '--remote-debugging-port';
  private readonly ADDRESS_OPTION_NAME = '--remote-debugging-address';

  constructor(
    private readonly logger: Logger,
    private readonly fileManager: FileManager,
    private readonly connectionFactory: ConnectionFactory,
    private readonly observerFactory: ObserverFactory
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

    this.connection = this.connectionFactory.create({
      ...this.addr,
      maxRetries: 20,
      maximumBackoff: 100,
      initialBackoff: 5
    });

    await this.connection.open();

    await this.listenNetworkEvents(options);

    return null;
  }

  public async saveHar(options: SaveOptions): Promise<void> {
    const filePath = join(options.outDir, options.fileName);

    if (!this.connection) {
      this.logger.err(`Failed to save HAR. First you should start recording.`);

      return null;
    }

    try {
      await this.fileManager.createFolder(options.outDir);

      if (options.waitForIdle) {
        await this.waitForNetworkIdle();
      }

      const har: string | undefined = await this.buildHar();

      if (har) {
        await this.fileManager.writeFile(filePath, har);
      }
    } catch (e) {
      this.logger.err(`Failed to save HAR: ${e.message}`);
    } finally {
      await this.disposeOfHar();
    }

    return null;
  }

  public async disposeOfHar(): Promise<void> {
    await this.networkObservable?.unsubscribe();
    delete this.networkObservable;

    if (this.buffer) {
      this.buffer.end();
    }

    if (this.tmpPath) {
      await this.fileManager.removeFile(this.tmpPath);
    }

    delete this.buffer;

    return null;
  }

  private parseElectronSwitches(browser: Cypress.Browser): string[] {
    if (
      !process.env.ELECTRON_EXTRA_LAUNCH_ARGS?.includes(this.PORT_OPTION_NAME)
    ) {
      this.logger
        .err(`The '${browser.name}' browser was detected, however, the required '${this.PORT_OPTION_NAME}' command line switch was not provided. 
          This switch is necessary to enable remote debugging over HTTP on the specified port. 
          
          Please refer to the documentation:
            - https://www.electronjs.org/docs/latest/api/command-line-switches#--remote-debugging-portport
            - https://docs.cypress.io/api/plugins/browser-launch-api#Modify-Electron-app-switches`);
      throw new Error(
        `Missing '${this.PORT_OPTION_NAME}' command line switch for Electron browser`
      );
    }

    return process.env.ELECTRON_EXTRA_LAUNCH_ARGS.split(' ');
  }

  private async buildHar(): Promise<string | undefined> {
    if (this.tmpPath) {
      const content = await this.fileManager.readFile(this.tmpPath);

      if (content) {
        const entries = content
          .split(EOL)
          .filter(Boolean)
          .map(x => JSON.parse(x));

        const har = new HarBuilder(entries).build();

        return JSON.stringify(har, null, 2);
      }
    }
  }

  private async waitForNetworkIdle(
    options: { idleTime?: number; timeout?: number } = {}
  ): Promise<void> {
    const { idleTime = 100, timeout = 5000 } = options;
    const cancellation = promisify(setTimeout)(timeout);

    return Promise.race([
      new NetworkIdleMonitor(this.networkObservable).waitForIdle(idleTime),
      cancellation
    ]);
  }

  private async listenNetworkEvents(options: RecordOptions): Promise<void> {
    this.buffer = await this.fileManager.createTmpWriteStream();

    const network = this.connection.discoverNetwork();
    this.networkObservable = this.observerFactory.createNetworkObserver(
      network,
      options
    );

    return this.networkObservable.subscribe(async (request: NetworkRequest) => {
      const entry = await new EntryBuilder(request).build();
      const entryStr = JSON.stringify(entry);
      // @ts-expect-error type mismatch
      if (this.buffer && !this.buffer.closed) {
        this.buffer.write(`${entryStr}${EOL}`);
      }
    });
  }

  private async closeConnection(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
      delete this.connection;
    }
  }

  private isSupportedBrowser(browser: Cypress.Browser): boolean {
    return ['chromium'].includes(browser?.family);
  }

  private ensureRdpAddrArgs(args: string[]): string[] {
    const {
      host = 'localhost',
      port = 40000 + Math.round(Math.random() * 25000)
    } = this.extractAddrFromArgs(args);

    this.addr = { host, port };

    return [
      ...args,
      `${this.PORT_OPTION_NAME}=${port}`,
      `${this.ADDRESS_OPTION_NAME}=${host}`
    ];
  }

  private extractAddrFromArgs(args: string[]): Partial<Addr> {
    const port: number | undefined = +this.findAndParseIfPossible(
      args,
      this.PORT_OPTION_NAME
    );
    const host: string | undefined = this.findAndParseIfPossible(
      args,
      this.ADDRESS_OPTION_NAME
    );

    let addr: { port?: number; host?: string } = {};

    if (!isNaN(port) && isFinite(port)) {
      addr = { port };
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
