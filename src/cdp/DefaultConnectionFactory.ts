import { ConnectionFactory } from './ConnectionFactory';
import { RetryStrategy } from './RetryStrategy';
import { Connection } from './Connection';
import { CRIConnection } from './CRIConnection';
import { Logger } from '../utils';

export class DefaultConnectionFactory implements ConnectionFactory {
  constructor(private readonly logger: Logger) {}

  public create({
    retryStrategy,
    ...addr
  }: {
    port: number;
    host: string;
    retryStrategy: RetryStrategy;
  }): Connection {
    return new CRIConnection(addr, this.logger, retryStrategy);
  }
}
