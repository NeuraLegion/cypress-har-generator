import { NetworkRequest } from '../NetworkRequest';
import { HostFilter } from './HostFilter';
import { PathFilter } from './PathFilter';
import { MimeFilter } from './MimeFilter';
import { MinStatusCodeFilter } from './MinStatusCodeFilter';
import { BlobFilter } from './BlobFilter';
import { StatusCodeFilter } from './StatusCodeFilter';
import type { RequestFilter, RequestFilterOptions } from './RequestFilter';

export class CompositeFilter implements RequestFilter {
  constructor(
    private readonly children: RequestFilter[] = [
      new HostFilter(),
      new PathFilter(),
      new MimeFilter(),
      new BlobFilter(),
      new MinStatusCodeFilter(),
      new StatusCodeFilter()
    ]
  ) {}

  public apply(
    request: NetworkRequest,
    options: RequestFilterOptions
  ): boolean {
    return this.children
      .filter(x => x.wouldApply(options))
      .every(x => x.apply(request, options));
  }

  public wouldApply(options: RequestFilterOptions): boolean {
    return this.children.some(x => x.wouldApply(options));
  }
}
