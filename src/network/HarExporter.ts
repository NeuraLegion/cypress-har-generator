import type { NetworkRequest } from './NetworkRequest';

export interface HarExporter {
  readonly path: string;

  write(networkRequest: NetworkRequest): Promise<void>;

  end(): void;
}
