import type { NetworkObserverOptions } from './NetworkObserverOptions';
import type { Observer } from './Observer';
import { NetworkRequest } from './NetworkRequest';
import type { Network } from './Network';

export interface ObserverFactory {
  createNetworkObserver(
    network: Network,
    options: NetworkObserverOptions
  ): Observer<NetworkRequest>;
}
