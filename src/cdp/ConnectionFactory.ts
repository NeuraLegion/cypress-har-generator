import { Connection } from './Connection';
import { RetryStrategy } from './RetryStrategy';

export interface ConnectionFactory {
  create(options: {
    port: number;
    host: string;
    retryStrategy: RetryStrategy;
  }): Connection;
}
