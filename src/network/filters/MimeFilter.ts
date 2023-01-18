import { NetworkRequest } from '../NetworkRequest';
import type { RequestFilter, RequestFilterOptions } from './RequestFilter';

export class MimeFilter implements RequestFilter {
  public apply(
    request: NetworkRequest,
    { includeMimes }: RequestFilterOptions
  ): boolean {
    return !!(request.mimeType && includeMimes?.includes(request.mimeType));
  }

  public wouldApply(options: RequestFilterOptions): boolean {
    return (
      Array.isArray(options.includeMimes) && options.includeMimes.length > 0
    );
  }
}
