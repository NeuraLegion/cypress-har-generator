import { FileManager, Logger } from './utils';
import { CRIConnection, RetryStrategy } from './cdp';
import {
  EntryBuilder,
  HarBuilder,
  NetworkObserver,
  NetworkRequest
} from './network';
import { Entry, Har } from 'har-format';
import { join } from 'path';

export interface SaveOptions {
  fileName: string;
  outDir: string;
}

export interface RecordOptions {
  content: boolean;
  excludePaths: string[];
  includeHosts: string[];
}

interface Addr {
  port?: number;
  host?: string;
}

export class Plugin {
  private addr?: Addr;
  private entries: Entry[] = [];
  private connection?: CRIConnection;
  private readonly PORT_OPTION_NAME = '--remote-debugging-port';
  private readonly ADDRESS_OPTION_NAME = '--remote-debugging-address';

  constructor(
    private readonly logger: Logger,
    private readonly fileManager: FileManager
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

    const browserFlags: string[] = this.ensureRdpPort(
      this.ensureTestingFlags(args)
    );

    return browserFlags.filter((x: string): boolean => !args.includes(x));
  }

  public async recordHar(options: RecordOptions): Promise<void> {
    await this.closeConnection();

    this.connection = new CRIConnection(
      this.addr,
      this.logger,
      new RetryStrategy(20, 5, 100)
    );

    this.entries = [];

    await this.connection.open();

    await this.listenNetworkEvents(options);

    return null;
  }

  public async saveHar(options: SaveOptions): Promise<void> {
    const filePath: string = join(options.outDir, options.fileName);

    this.assertFilePath(filePath);

    if (!this.connection) {
      this.logger.err(`Failed to save HAR. First you should start recording.`);

      return null;
    }

    try {
      await this.fileManager.createFolder(options.outDir);
      const har: string | undefined = this.buildHar();

      if (har) {
        await this.fileManager.writeFile(filePath, har);
      }
    } catch (e) {
      this.logger.err(`Failed to save HAR: ${e.message}`);
    } finally {
      this.entries = [];
    }

    return null;
  }

  private buildHar(): string | undefined {
    if (this.entries.length) {
      const har: Har = new HarBuilder(this.entries).build();

      return JSON.stringify(har, null, 2);
    }
  }

  private async listenNetworkEvents(options: RecordOptions): Promise<void> {
    const networkObservable: NetworkObserver = new NetworkObserver(
      options,
      this.connection,
      this.logger
    );

    await networkObservable.subscribe(
      async (request: NetworkRequest): Promise<number> =>
        this.entries.push(await new EntryBuilder(request).build())
    );
  }

  private async closeConnection(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
      delete this.connection;
    }
  }

  private assertFilePath(path: string | undefined): asserts path is string {
    if (typeof path !== 'string') {
      throw new Error('File path must be a string.');
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

  private ensureRdpPort(args: string[]): string[] {
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

  private extractAddrFromArgs(args: string[]): Addr {
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
