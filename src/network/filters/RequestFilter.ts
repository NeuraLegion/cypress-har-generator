import { NetworkRequest } from '../NetworkRequest';
import type { NetworkObserverOptions } from '../NetworkObserverOptions';

export type RequestFilterOptions = Omit<NetworkObserverOptions, 'content'>;

export interface RequestFilter {
  wouldApply(options: RequestFilterOptions): boolean;
  apply(request: NetworkRequest, options: RequestFilterOptions): boolean;
}
