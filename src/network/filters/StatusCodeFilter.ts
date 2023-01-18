import { NetworkRequest } from '../NetworkRequest';
import type { RequestFilter, RequestFilterOptions } from './RequestFilter';

export class StatusCodeFilter implements RequestFilter {
  public apply(
    request: NetworkRequest,
    { excludeStatusCodes }: RequestFilterOptions
  ): boolean {
    return !excludeStatusCodes?.includes(request.statusCode);
  }

  public wouldApply(options: RequestFilterOptions): boolean {
    return (
      Array.isArray(options.excludeStatusCodes) &&
      options.excludeStatusCodes.length > 0
    );
  }
}
