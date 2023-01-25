import { NetworkRequest } from '../NetworkRequest';
import type { RequestFilter, RequestFilterOptions } from './RequestFilter';
import { StringUtils } from '../../utils/StringUtils';

export class PathFilter implements RequestFilter {
  public apply(
    request: NetworkRequest,
    { excludePaths }: RequestFilterOptions
  ): boolean {
    const { pathname = '/' } = request.parsedURL;

    return !excludePaths?.some(pattern =>
      StringUtils.toRegex(pattern).test(pathname)
    );
  }

  public wouldApply(options: RequestFilterOptions): boolean {
    return (
      Array.isArray(options.excludePaths) && options.excludePaths.length > 0
    );
  }
}
