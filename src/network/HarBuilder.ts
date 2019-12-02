import { Entry, Har } from 'har-format';
import { NetworkRequest } from './NetworkRequest';
import { EntryBuilder } from './EntryBuilder';

export class HarBuilder {
  constructor(private readonly chromeRequests: NetworkRequest[]) {}

  public async build(): Promise<Har> {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { name, version, homepage: comment } = require('../../package.json');

    const entries: Entry[] = await Promise.all(
      this.chromeRequests.map((request: NetworkRequest) =>
        new EntryBuilder(request).build()
      )
    );

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
