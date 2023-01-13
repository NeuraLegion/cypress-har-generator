import { FileManager, Logger } from './utils';
import { Connection, ConnectionFactory, RetryStrategy } from './cdp';
import {
  EntryBuilder,
  HarBuilder,
  NetworkRequest,
  Observer,
  NetworkObserverOptions,
  ObserverFactory,
  NetworkIdleMonitor
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

    const browserFlags: string[] = this.ensureRdpAddrArgs(
      this.ensureTestingFlags(args)
    );

    return browserFlags.filter((x: string): boolean => !args.includes(x));
  }

  public async recordHar(options: RecordOptions): Promise<void> {
    await this.closeConnection();

    this.connection = this.connectionFactory.create({
      ...this.addr,
      retryStrategy: new RetryStrategy(20, 5, 100)
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
    this.networkObservable = this.observerFactory.createNetworkObserver(
      this.connection,
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

  private ensureTestingFlags(args: string[]): string[] {
    return [
      ...args,
      '--no-sandbox',
      '--disable-background-networking',
      '--reduce-security-for-testing',
      '--allow-insecure-localhost',
      '--ignore-certificate-errors'
    ];
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
