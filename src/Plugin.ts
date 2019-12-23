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

const access = promisify(accessCb);
const unlink = promisify(unlinkCb);
const writeFile = promisify(writeFileCb);

export class Plugin {
  private rdpPort?: number;
  private entries: Entry[] = [];
  private connection?: CRIConnection;

  constructor(private readonly logger: Logger) {}

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

  public async saveHar(fileName: string): Promise<void> {
    this.fileIsDefined(fileName);

    await this.removeHar(fileName);

    try {
      const har: string = this.buildHar();
      await writeFile(fileName, har);
    } catch (e) {
      this.logger.err(`Failed to save HAR: ${e.message}`);
    } finally {
      this.entries = [];
    }

    return null;
  }

  private buildHar(): string {
    const har: Har = new HarBuilder(this.entries).build();

    return JSON.stringify(har, null, 2);
  }

  private async removeHar(fileName: string): Promise<void> {
    try {
      await access(fileName, constants.F_OK);
      await unlink(fileName);
    } catch (e) {}

    return null;
  }

  private async subscribeToRequests(): Promise<void> {
    const networkObservable: NetworkObserver = new NetworkObserver(
      this.connection,
      this.logger
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
