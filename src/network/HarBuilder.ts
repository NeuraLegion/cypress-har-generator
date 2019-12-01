import { Entry, Har } from 'har-format';
import { ChromeRequest } from './ChromeRequest';
import { EntryBuilder } from './EntryBuilder';

export class HarBuilder {
  constructor(private readonly chromeRequests: ChromeRequest[]) {}

  public async build(): Promise<Har> {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { name, version, homepage: comment } = require('../../package.json');

    const entries: Entry[] = await Promise.all(
      this.chromeRequests.map((request: ChromeRequest) =>
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
