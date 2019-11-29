import { Logger } from './utils';
import { CDPFactory, RetryStrategy } from './cdp';
import {
  access as accessCb,
  constants,
  unlink as unlinkCb,
  writeFile as writeFileCb
} from 'fs';
import { promisify } from 'util';
import { EntryFactory } from './network';
import { Entry } from 'har-format';
import { ChromeEntry, NetworkObservable } from './network';
import { HarFactory } from './network';
import { ChromeRemoteInterface } from 'chrome-remote-interface';

const access = promisify(accessCb);
const unlink = promisify(unlinkCb);
const writeFile = promisify(writeFileCb);

export class Plugin {
  private rdpPort?: number;
  private readonly entries: Entry[] = [];

  constructor(private readonly logger: Logger) {}

  public install(browser: Cypress.Browser, args: string[]): string[] {
    if (!this.isChromeFamily(browser)) {
      throw new Error(
        `An unsupported browser family was used, output will not be logged to console: ${browser.name}`
      );
    }

    args = this.ensureHeadless(args);
    args = this.ensureRdpPort(args);

    return args;
  }

  public async removeHarFile(options: { harFile: string }): Promise<void> {
    try {
      await access(options.harFile, constants.F_OK);
      await unlink(options.harFile);
    } catch (e) {}

    return null;
  }

  public async recordHar(): Promise<void> {
    const cdpFactory: CDPFactory = new CDPFactory(
      { port: this.rdpPort },
      this.logger,
      new RetryStrategy(10, 30, 1000)
    );

    const cdpCreateTask: ChromeRemoteInterface = await cdpFactory.Create();

    const networkObservable: NetworkObservable = new NetworkObservable(
      cdpCreateTask,
      this.logger
    );

    await networkObservable.subscribe((entry: ChromeEntry) =>
      this.entries.push(new EntryFactory().Create(entry))
    );

    return null;
  }

  public async saveHar(options: { harFile: string }): Promise<void> {
    try {
      const entries: Entry[] = this.entries.filter(
        (entry: Entry | undefined) => entry
      );

      await writeFile(
        options.harFile,
        JSON.stringify(new HarFactory().Create(entries), null, 2)
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
