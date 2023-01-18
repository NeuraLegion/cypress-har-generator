import type { ConnectionFactory, ConnectionOptions } from './ConnectionFactory';
import { RetryStrategy } from './RetryStrategy';
import type { Connection } from './Connection';
import { CDPConnection } from './CDPConnection';
import { Logger } from '../utils/Logger';

export class DefaultConnectionFactory implements ConnectionFactory {
  constructor(private readonly logger: Logger) {}

  public create({
    maxRetries,
    initialBackoff,
    maximumBackoff,
    ...options
  }: ConnectionOptions): Connection {
    const retryStrategy = new RetryStrategy(
      maxRetries,
      initialBackoff,
      maximumBackoff
    );

    return new CDPConnection(options, this.logger, retryStrategy);
  }
}
