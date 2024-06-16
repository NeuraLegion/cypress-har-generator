import type { Entry, Har } from 'har-format';
import { createRequire } from 'module';

export class HarBuilder {
  constructor(private readonly entries: Entry[]) {}

  public build(): Har {
    const require = createRequire(import.meta.url);
    const { name, version, homepage: comment } = require('../../package.json');

    return {
      log: {
        version: '1.2',
        pages: [],
        creator: {
          name,
          version,
          comment
        },
        entries: this.entries
      }
    };
  }
}
