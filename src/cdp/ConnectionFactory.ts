import type { Connection } from './Connection';

export interface ConnectionOptions {
  port: number;
  host: string;
  maxRetries?: number;
  initialBackoff?: number;
  maximumBackoff?: number;
}

export interface ConnectionFactory {
  create(options: ConnectionOptions): Connection;
}
