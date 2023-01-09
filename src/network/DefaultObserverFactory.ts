import { ObserverFactory } from './ObserverFactory';
import { NetworkObserver } from './NetworkObserver';
import { Logger } from '../utils';
import { Connection } from '../cdp';
import { NetworkObserverOptions } from './NetworkObserverOptions';
import { Observer } from './Observer';
import { NetworkRequest } from './NetworkRequest';

export class DefaultObserverFactory implements ObserverFactory {
  constructor(private readonly logger: Logger) {}

  public createNetworkObserver(
    connection: Connection,
    options: NetworkObserverOptions
  ): Observer<NetworkRequest> {
    return new NetworkObserver(options, connection, this.logger);
  }
}
