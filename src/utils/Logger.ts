import chalk from 'chalk';

export class Logger {
  private static _instance: Logger;

  static get Instance(): Logger {
    if (!this._instance) {
      this._instance = new Logger();
    }

    return this._instance;
  }

  public info(msg: string): void {
    this.log(chalk.blue(`🛈 ${msg}`));
  }

  public err(msg: string): void {
    this.log(chalk.red(`🍑 ${msg}`));
  }

  public warn(msg: string): void {
    this.log(chalk.yellow(`⚠ ${msg}`));
  }

  private log(msg: string): void {
    // eslint-disable-next-line no-console
    console.log(msg);
  }
}
