import { RequestFilter, RequestFilterOptions } from './RequestFilter';
import { NetworkRequest } from '../NetworkRequest';
import { HostFilter } from './HostFilter';
import { PathFilter } from './PathFilter';
import { MimeFilter } from './MimeFilter';
import { StatusCodeFilter } from './StatusCodeFilter';
import { BlobFilter } from './BlobFilter';

export class CompositeFilter implements RequestFilter {
  constructor(
    private readonly children: RequestFilter[] = [
      new HostFilter(),
      new PathFilter(),
      new MimeFilter(),
      new StatusCodeFilter(),
      new BlobFilter()
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
