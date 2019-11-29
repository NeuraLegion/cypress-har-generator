import { Entry, Har } from 'har-format';

export class HarFactory {
  public Create(entries: Entry[]): Har {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
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
        entries
      }
    };
  }
}
