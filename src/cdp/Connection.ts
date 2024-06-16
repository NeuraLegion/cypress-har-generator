import type { Network } from '../network/Network.js';
import type { NetworkOptions } from './NetworkOptions.js';

export interface Connection {
  open(): Promise<void>;

  close(): Promise<void>;

  discoverNetwork(options?: NetworkOptions): Network;
}
