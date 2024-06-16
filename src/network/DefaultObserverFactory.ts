import { NetworkObserver } from './NetworkObserver.js';
import { type Logger } from '../utils/Logger.js';
import { type NetworkRequest } from './NetworkRequest.js';
import { CompositeFilter } from './filters/CompositeFilter.js';
import type { ObserverFactory } from './ObserverFactory.js';
import type { NetworkObserverOptions } from './NetworkObserverOptions.js';
import type { Observer } from './Observer.js';
import type { Network } from './Network.js';

export class DefaultObserverFactory implements ObserverFactory {
  private readonly defaultRequestFilter = new CompositeFilter();

  constructor(private readonly logger: Logger) {}

  public createNetworkObserver(
    network: Network,
    options: NetworkObserverOptions
  ): Observer<NetworkRequest> {
    return new NetworkObserver(
      options,
      network,
      this.logger,
      this.defaultRequestFilter
    );
  }
}
