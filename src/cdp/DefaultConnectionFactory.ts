import type { ConnectionFactory } from './ConnectionFactory';
import { RetryStrategy } from './RetryStrategy';
import type { Connection } from './Connection';
import { CDPConnection } from './CDPConnection';
import { Logger } from '../utils';
import { ConnectionOptions } from './ConnectionFactory';

export class DefaultConnectionFactory implements ConnectionFactory {
  constructor(private readonly logger: Logger) {}

  public create({
    maxRetries,
    initialBackoff,
    maximumBackoff,
    ...addr
  }: ConnectionOptions): Connection {
    const retryStrategy = new RetryStrategy(
      maxRetries,
      initialBackoff,
      maximumBackoff
    );

    return new CDPConnection(addr, this.logger, retryStrategy);
  }
}
