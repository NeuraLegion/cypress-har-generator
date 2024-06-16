import { type NetworkRequest } from '../NetworkRequest.js';
import type { RequestFilter, RequestFilterOptions } from './RequestFilter.js';
import { StringUtils } from '../../utils/StringUtils.js';

export class HostFilter implements RequestFilter {
  public apply(
    request: NetworkRequest,
    { includeHosts }: RequestFilterOptions
  ): boolean {
    const { host } = request.parsedURL;

    return !!includeHosts?.some(pattern =>
      StringUtils.toRegex(pattern).test(host)
    );
  }

  public wouldApply(options: RequestFilterOptions): boolean {
    return (
      Array.isArray(options.includeHosts) && options.includeHosts.length > 0
    );
  }
}
