import { type NetworkRequest } from '../NetworkRequest.js';
import { HostFilter } from './HostFilter.js';
import { PathFilter } from './PathFilter.js';
import { MimeFilter } from './MimeFilter.js';
import { BlobFilter } from './BlobFilter.js';
import { StatusCodeFilter } from './StatusCodeFilter.js';
import type { RequestFilter, RequestFilterOptions } from './RequestFilter.js';

export class CompositeFilter implements RequestFilter {
  constructor(
    private readonly children: RequestFilter[] = [
      new HostFilter(),
      new PathFilter(),
      new MimeFilter(),
      new BlobFilter(),
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
