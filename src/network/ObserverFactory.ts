import type { NetworkObserverOptions } from './NetworkObserverOptions.js';
import type { Observer } from './Observer.js';
import { type NetworkRequest } from './NetworkRequest.js';
import type { Network } from './Network.js';

export interface ObserverFactory {
  createNetworkObserver(
    network: Network,
    options: NetworkObserverOptions
  ): Observer<NetworkRequest>;
}
