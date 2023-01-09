import { Connection } from '../cdp';
import { NetworkObserverOptions } from './NetworkObserverOptions';
import { Observer } from './Observer';
import { NetworkRequest } from './NetworkRequest';

export interface ObserverFactory {
  createNetworkObserver(
    connection: Connection,
    options: NetworkObserverOptions
  ): Observer<NetworkRequest>;
}
