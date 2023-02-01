import type { Entry } from 'har-format';

export type Predicate = (entry: Entry) => Promise<unknown> | unknown;
export type Transformer = (entry: Entry) => Promise<Entry> | Entry;

export interface DefaultHarExporterOptions {
  predicate?: Predicate;
  transform?: Transformer;
}
