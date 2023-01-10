import { NetworkObserverOptions } from '../NetworkObserverOptions';
import { NetworkRequest } from '../NetworkRequest';

export type RequestFilterOptions = Omit<NetworkObserverOptions, 'content'>;

export interface RequestFilter {
  wouldApply(options: RequestFilterOptions): boolean;
  apply(request: NetworkRequest, options: RequestFilterOptions): boolean;
}
