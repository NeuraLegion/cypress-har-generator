import { Logger } from './utils';
import { CRIConnection, RetryStrategy } from './cdp';
import {
  access as accessCb,
  constants,
  unlink as unlinkCb,
  writeFile as writeFileCb
} from 'fs';
import { promisify } from 'util';
import { ChromeRemoteInterface } from 'chrome-remote-interface';
import { NetworkRequest, HarBuilder, NetworkObserver } from './network';
import { Har } from 'har-format';
import { PluginOptions } from './PluginOptions';

const access = promisify(accessCb);
const unlink = promisify(unlinkCb);
const writeFile = promisify(writeFileCb);

export class Plugin {
  private rdpPort?: number;
  private readonly requests: NetworkRequest[] = [];

  constructor(
    private readonly logger: Logger,
    private readonly options: PluginOptions
  ) {
    this.stubPathIsDefined(this.options.stubPath);
    this.fileIsDefined(this.options.file);
  }

  public install(browser: Cypress.Browser, args: string[]): string[] {
    if (!this.isChromeFamily(browser)) {
      throw new Error(
        `An unsupported browser family was used: ${browser.name}`
      );
    }

    args = this.ensureHeadless(args);
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
    const factory: CRIConnection = new CRIConnection(
      { port: this.rdpPort },
      this.logger,
      new RetryStrategy(20, 5, 100)
    );

    const chromeRemoteInterface: ChromeRemoteInterface = await factory.open();

    const networkObservable: NetworkObserver = new NetworkObserver(
      chromeRemoteInterface,
      this.logger,
      this.options
    );

    await networkObservable.subscribe((request: NetworkRequest) =>
      this.requests.push(request)
    );

    return null;
  }

  public async saveHar(): Promise<void> {
    try {
      const har: Har = await new HarBuilder(this.requests).build();
      await writeFile(this.options.file, JSON.stringify(har, null, 2));
    } catch (e) {}

    return null;
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

  private ensureHeadless(args: string[]): string[] {
    return [
      ...new Set([
        ...args,
        '--disable-background-networking',
        '--headless',
        '--no-sandbox',
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
