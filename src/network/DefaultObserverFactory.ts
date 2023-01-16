import { ObserverFactory } from './ObserverFactory';
import { NetworkObserver } from './NetworkObserver';
import { Logger } from '../utils';
import { Connection } from '../cdp';
import { NetworkObserverOptions } from './NetworkObserverOptions';
import { Observer } from './Observer';
import { NetworkRequest } from './NetworkRequest';
import { CompositeFilter } from './filters';

export class DefaultObserverFactory implements ObserverFactory {
  private readonly defaultRequestFilter = new CompositeFilter();

  constructor(private readonly logger: Logger) {}

  public createNetworkObserver(
    connection: Connection,
    options: NetworkObserverOptions
  ): Observer<NetworkRequest> {
    return new NetworkObserver(
      options,
      connection.discoverNetwork(),
      this.logger,
      this.defaultRequestFilter
    );
  }
}
