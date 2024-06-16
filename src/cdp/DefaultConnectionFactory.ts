import type {
  ConnectionFactory,
  ConnectionOptions
} from './ConnectionFactory.js';
import { RetryStrategy } from './RetryStrategy.js';
import type { Connection } from './Connection.js';
import { CDPConnection } from './CDPConnection.js';
import { type Logger } from '../utils/Logger.js';

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
