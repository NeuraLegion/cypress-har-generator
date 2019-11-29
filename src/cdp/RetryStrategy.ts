export class RetryStrategy {
  private _times: number;
  private initialBackoff: number;
  private readonly maximumBackoff: number;
  private readonly maxRetries: number;

  constructor(
    maxRetries: number,
    initialBackoff: number,
    maximumBackoff: number
  ) {
    this._times = 0;
    this.maxRetries = maxRetries;
    this.initialBackoff = initialBackoff;
    this.maximumBackoff = maximumBackoff;
  }

  public getNextTime(): number | undefined {
    if (this._times >= this.maxRetries) {
      return;
    }

    return this.getIncreaseBackoffTime();
  }

  private getIncreaseBackoffTime(): number {
    this.initialBackoff *= Math.pow(2, ++this._times - 1);

    return Math.min(this.initialBackoff, this.maximumBackoff);
  }
}
