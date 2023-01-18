import { ObserverFactory } from './ObserverFactory';
import { NetworkObserver } from './NetworkObserver';
import { Logger } from '../utils/Logger';
import { NetworkObserverOptions } from './NetworkObserverOptions';
import { Observer } from './Observer';
import { NetworkRequest } from './NetworkRequest';
import { CompositeFilter } from './filters';
import { Network } from './Network';

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
