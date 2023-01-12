import { RequestFilter, RequestFilterOptions } from './RequestFilter';
import { NetworkRequest } from '../NetworkRequest';

export class BlobFilter implements RequestFilter {
  public apply(request: NetworkRequest, _: RequestFilterOptions): boolean {
    return !request.isBlob();
  }

  public wouldApply({ includeBlobs }: RequestFilterOptions): boolean {
    return !(includeBlobs ?? true);
  }
}
