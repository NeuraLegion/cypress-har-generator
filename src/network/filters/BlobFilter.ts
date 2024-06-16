import { type NetworkRequest } from '../NetworkRequest.js';
import type { RequestFilter, RequestFilterOptions } from './RequestFilter.js';

export class BlobFilter implements RequestFilter {
  public apply(request: NetworkRequest, _: RequestFilterOptions): boolean {
    return !request.isBlob();
  }

  public wouldApply(_: RequestFilterOptions): boolean {
    return true;
  }
}
