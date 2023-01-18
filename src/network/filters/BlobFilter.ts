import { NetworkRequest } from '../NetworkRequest';
import type { RequestFilter, RequestFilterOptions } from './RequestFilter';

export class BlobFilter implements RequestFilter {
  public apply(request: NetworkRequest, _: RequestFilterOptions): boolean {
    return !request.isBlob();
  }

  public wouldApply({ includeBlobs }: RequestFilterOptions): boolean {
    return !(includeBlobs ?? true);
  }
}
