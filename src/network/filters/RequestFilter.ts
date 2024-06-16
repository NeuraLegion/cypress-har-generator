import { type NetworkRequest } from '../NetworkRequest.js';
import type { NetworkObserverOptions } from '../NetworkObserverOptions.js';

export type RequestFilterOptions = Omit<NetworkObserverOptions, 'content'>;

export interface RequestFilter {
  wouldApply(options: RequestFilterOptions): boolean;
  apply(request: NetworkRequest, options: RequestFilterOptions): boolean;
}
