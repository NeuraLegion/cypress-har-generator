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
import { ChromeRequest, HarBuilder, NetworkObserver } from './network';

const access = promisify(accessCb);
const unlink = promisify(unlinkCb);
const writeFile = promisify(writeFileCb);

export class Plugin {
  private rdpPort?: number;
  private readonly requests: ChromeRequest[] = [];

  constructor(private readonly logger: Logger) {}

  public async install(
    browser: Cypress.Browser,
    args: string[]
  ): Promise<string[]> {
    if (!this.isChromeFamily(browser)) {
      throw new Error(
        `An unsupported browser family was used, output will not be logged to console: ${browser.name}`
      );
    }

    args = this.ensureHeadless(args);
    args = this.ensureRdpPort(args);

    return args;
  }

  public async removeHar(options: { harFile: string }): Promise<void> {
    try {
      await access(options.harFile, constants.F_OK);
      await unlink(options.harFile);
    } catch (e) {}

    return null;
  }

  public async recordHar(): Promise<void> {
    const factory: CRIConnection = new CRIConnection(
      { port: this.rdpPort },
      this.logger,
      new RetryStrategy(20, 5, 100)
    );

    const cri: ChromeRemoteInterface = await factory.open();

    const networkObservable: NetworkObserver = new NetworkObserver(
      cri,
      this.logger
    );

    await networkObservable.subscribe((request: ChromeRequest) =>
      this.requests.push(request)
    );

    return null;
  }

  public async saveHar(options: { harFile: string }): Promise<void> {
    try {
      await writeFile(
        options.harFile,
        JSON.stringify(await new HarBuilder(this.requests).build(), null, 2)
      );
    } catch (e) {}

    return null;
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
