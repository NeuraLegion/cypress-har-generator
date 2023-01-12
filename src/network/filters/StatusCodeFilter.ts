import { RequestFilter, RequestFilterOptions } from './RequestFilter';
import { NetworkRequest } from '../NetworkRequest';

export class StatusCodeFilter implements RequestFilter {
  public apply(
    request: NetworkRequest,
    { excludeStatusCodes }: RequestFilterOptions
  ): boolean {
    return !excludeStatusCodes?.includes(request.statusCode);
  }

  public wouldApply(options: RequestFilterOptions): boolean {
    return options.excludeStatusCodes?.length > 0;
  }
}
