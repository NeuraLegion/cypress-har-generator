import { Logger } from './utils';
import { CRIConnection, RetryStrategy } from './cdp';
import {
  access as accessCb,
  constants,
  unlink as unlinkCb,
  writeFile as writeFileCb
} from 'fs';
import { promisify } from 'util';
import {
  EntryBuilder,
  HarBuilder,
  NetworkObserver,
  NetworkRequest
} from './network';
import { Entry, Har } from 'har-format';
import { PluginOptions } from './PluginOptions';

const access = promisify(accessCb);
const unlink = promisify(unlinkCb);
const writeFile = promisify(writeFileCb);

export class Plugin {
  private rdpPort?: number;
  private readonly entries: Entry[] = [];
  private connection?: CRIConnection;

  constructor(private readonly logger: Logger, private options: PluginOptions) {
    this.validatePluginOptions(options);
  }

  public configure(options: PluginOptions): void {
    this.validatePluginOptions(options);
    this.options = options;
  }

  public ensureRequiredBrowserFlags(
    browser: Cypress.Browser,
    args: string[]
  ): string[] {
    if (!this.isChromeFamily(browser)) {
      throw new Error(
        `An unsupported browser family was used: ${browser.name}`
      );
    }

    args = this.ensureTestingFlags(args);
    args = this.ensureRdpPort(args);

    return args;
  }

  public async removeHar(): Promise<void> {
    try {
      await access(this.options.file, constants.F_OK);
      await unlink(this.options.file);
    } catch (e) {}

    return null;
  }

  public async recordHar(): Promise<void> {
    await this.closeConnection();

    this.connection = new CRIConnection(
      { port: this.rdpPort },
      this.logger,
      new RetryStrategy(20, 5, 100)
    );

    await this.connection.open();

    await this.subscribeToRequests();

    return null;
  }

  public async saveHar(): Promise<void> {
    try {
      const har: Har = new HarBuilder(this.entries).build();
      await writeFile(this.options.file, JSON.stringify(har, null, 2));
    } catch (e) {
      this.logger.err(`Failed to save HAR: ${e.message}`);
    }

    return null;
  }

  private async subscribeToRequests(): Promise<void> {
    const networkObservable: NetworkObserver = new NetworkObserver(
      this.connection,
      this.logger,
      this.options
    );

    await networkObservable.subscribe(async (request: NetworkRequest) =>
      this.entries.push(await new EntryBuilder(request).build())
    );
  }

  private async closeConnection(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
      delete this.connection;
    }
  }

  private validatePluginOptions(options: PluginOptions): void | never {
    this.stubPathIsDefined(options.stubPath);
    this.fileIsDefined(options.file);
  }

  private stubPathIsDefined(
    stubPath: string | undefined
  ): asserts stubPath is string {
    if (typeof stubPath !== 'string') {
      throw new Error('Stub path path must be a string.');
    }
  }

  private fileIsDefined(file: string | undefined): asserts file is string {
    if (typeof file !== 'string') {
      throw new Error('File path must be a string.');
    }
  }

  private isChromeFamily(browser: Cypress.Browser): boolean {
    return ['chrome', 'chromium', 'canary'].includes(browser?.name);
  }

  private ensureTestingFlags(args: string[]): string[] {
    return [
      ...new Set([
        ...args,
        '--no-sandbox',
        '--disable-background-networking',
        '--disable-web-security',
        '--reduce-security-for-testing',
        '--allow-insecure-localhost',
        '--ignore-certificate-errors',
        '--disable-gpu'
      ])
    ];
  }

  private ensureRdpPort(args: string[]): string[] {
    this.rdpPort = this.getRdpPortFromArgs(args);

    if (this.rdpPort) {
      return args;
    }

    this.rdpPort = 40000 + Math.round(Math.random() * 25000);

    return [...args, `--remote-debugging-port=${this.rdpPort}`];
  }

  private getRdpPortFromArgs(args: string[]): number | undefined {
    const existing: string = args.find((arg) =>
      arg.startsWith('--remote-debugging-port=')
    );

    if (existing) {
      return +existing.split('=')[1];
    }
  }
}
