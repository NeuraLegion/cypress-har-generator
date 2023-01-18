import type { Network } from '../network';

export interface Connection {
  open(): Promise<void>;

  close(): Promise<void>;

  discoverNetwork(): Network;
}
