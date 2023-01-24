import { EntryBuilder } from './EntryBuilder';
import type { NetworkRequest } from './NetworkRequest';
import type { HarExporter } from './HarExporter';
import type { Entry } from 'har-format';
import type { WriteStream } from 'fs';
import { EOL } from 'os';

export class DefaultHarExporter implements HarExporter {
  get path(): string {
    const { path } = this.buffer;

    return Buffer.isBuffer(path) ? path.toString('utf-8') : path;
  }

  constructor(
    private readonly buffer: WriteStream,
    private readonly predicate?: (entry: Entry) => Promise<unknown> | unknown
  ) {}

  public async write(networkRequest: NetworkRequest): Promise<void> {
    const entry = await new EntryBuilder(networkRequest).build();

    if (await this.applyPredicate(entry)) {
      return;
    }

    const json = JSON.stringify(entry);

    // @ts-expect-error type mismatch
    if (!this.buffer.closed) {
      this.buffer.write(`${json}${EOL}`);
    }
  }

  public end(): void {
    this.buffer.end();
  }

  private async applyPredicate(entry: Entry) {
    try {
      return (
        typeof this.predicate === 'function' && (await this.predicate?.(entry))
      );
    } catch {
      return false;
    }
  }
}
