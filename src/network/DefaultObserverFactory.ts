import { NetworkObserver } from './NetworkObserver';
import { Logger } from '../utils/Logger';
import { NetworkRequest } from './NetworkRequest';
import { CompositeFilter } from './filters';
import type { ObserverFactory } from './ObserverFactory';
import type { NetworkObserverOptions } from './NetworkObserverOptions';
import type { Observer } from './Observer';
import type { Network } from './Network';

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
