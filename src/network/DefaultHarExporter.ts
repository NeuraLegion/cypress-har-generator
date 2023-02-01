import { EntryBuilder } from './EntryBuilder';
import type { NetworkRequest } from './NetworkRequest';
import type { HarExporter } from './HarExporter';
import type { Logger } from '../utils/Logger';
import { ErrorUtils } from '../utils/ErrorUtils';
import type {
  DefaultHarExporterOptions,
  Predicate,
  Transformer
} from './DefaultHarExporterOptions';
import type { Entry } from 'har-format';
import type { WriteStream } from 'fs';
import { EOL } from 'os';
import { format } from 'util';

export class DefaultHarExporter implements HarExporter {
  get path(): string {
    const { path } = this.buffer;

    return Buffer.isBuffer(path) ? path.toString('utf-8') : path;
  }

  private get predicate(): Predicate | undefined {
    return this.options?.predicate;
  }

  private get transform(): Transformer | undefined {
    return this.options?.transform;
  }

  constructor(
    private readonly logger: Logger,
    private readonly buffer: WriteStream,
    private readonly options?: DefaultHarExporterOptions
  ) {}

  public async write(networkRequest: NetworkRequest): Promise<void> {
    const entry = await new EntryBuilder(networkRequest).build();

    if (await this.applyPredicate(entry)) {
      return;
    }

    const json = await this.serializeEntry(entry);

    // @ts-expect-error type mismatch
    if (!this.buffer.closed && json) {
      this.buffer.write(`${json}${EOL}`);
    }
  }

  public async serializeEntry(entry: Entry): Promise<string | undefined> {
    try {
      const result =
        typeof this.transform === 'function'
          ? await this.transform(entry)
          : entry;

      return JSON.stringify(result);
    } catch (e) {
      const stack = ErrorUtils.isError(e) ? e.stack : e;
      const formattedEntry = format('%j', entry);

      this.logger.err(
        `The entry is missing as a result of an error in the 'transform' function.

The passed entry:
${formattedEntry}

The stack trace for this error is: 
${stack}`
      );

      return undefined;
    }
  }

  public end(): void {
    this.buffer.end();
  }

  private async applyPredicate(entry: Entry): Promise<unknown> {
    try {
      return (
        typeof this.predicate === 'function' && (await this.predicate?.(entry))
      );
    } catch (e) {
      const message = ErrorUtils.isError(e) ? e.message : e;

      this.logger.debug(
        `The operation has encountered an error while processing the entry. ${message}`
      );

      return false;
    }
  }
}
