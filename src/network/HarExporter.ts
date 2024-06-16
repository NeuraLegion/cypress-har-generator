import type { NetworkRequest } from './NetworkRequest.js';

export interface HarExporter {
  readonly path: string;

  write(networkRequest: NetworkRequest): Promise<void>;

  end(): void;
}
