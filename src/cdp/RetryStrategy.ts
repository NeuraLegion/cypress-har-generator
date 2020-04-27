import Timeout = NodeJS.Timeout;

export class RetryStrategy {
  private _times: number;
  private backoffTime: number;
  private readonly maximumBackoff: number;
  private readonly maxRetries: number;

  constructor(
    maxRetries: number,
    initialBackoff: number,
    maximumBackoff: number
  ) {
    this._times = 0;
    this.maxRetries = maxRetries;
    this.backoffTime = initialBackoff;
    this.maximumBackoff = maximumBackoff;
  }

  // eslint-disable-next-line space-before-function-paren
  public async execute<T extends (...args: any[]) => unknown>(
    task: T
  ): Promise<number> {
    const timeout: number | undefined = this.nextTime();

    if (timeout) {
      await this.delay(timeout);

      await task();
    }

    return this.maxRetries - this._times;
  }

  private delay(timeout: number): Promise<void> {
    return new Promise<void>(
      (resolve): Timeout => setTimeout(resolve, timeout)
    );
  }

  private nextTime(): number | undefined {
    if (this._times < this.maxRetries) {
      return this.increaseBackoffTime();
    }
  }

  private increaseBackoffTime(): number {
    this.backoffTime *= Math.pow(2, ++this._times - 1);

    return Math.min(this.backoffTime, this.maximumBackoff);
  }
}
