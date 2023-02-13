import type { Network } from '../network';
import type { NetworkOptions } from './NetworkOptions';

export interface Connection {
  open(): Promise<void>;

  close(): Promise<void>;

  discoverNetwork(options?: NetworkOptions): Network;
}
