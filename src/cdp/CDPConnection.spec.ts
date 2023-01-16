import type { CDPConnection } from './CDPConnection';
import { Logger } from '../utils';
import { RetryStrategy } from './RetryStrategy';
import {
  CONNECTED,
  CONNECTION_IS_NOT_DEFINED,
  DISCONNECTED,
  FAILED_ATTEMPT_TO_CONNECT
} from './messages';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { anyFunction, instance, mock, reset, verify, when } from 'ts-mockito';
import type { Client, Options } from 'chrome-remote-interface';

const resolvableInstance = <T extends object>(m: T): T =>
  new Proxy<T>(instance(m), {
    get(target, prop, receiver) {
      if (
        ['Symbol(Symbol.toPrimitive)', 'then', 'catch'].includes(
          prop.toString()
        )
      ) {
        return undefined;
      }

      return Reflect.get(target, prop, receiver);
    }
  });

describe('CDPConnection', () => {
  const loggerMock = mock<Logger>();
  const retryStrategyMock = mock<RetryStrategy>();
  const clientMock = mock<Client>();
  const connect = jest.fn<(...args: unknown[]) => Promise<Client>>();
  const options: Options = { host: 'localhost', port: 9222 };

  let sut!: CDPConnection;

  beforeEach(async () => {
    jest.mock('chrome-remote-interface', () => connect);
    sut = new (await import('./CDPConnection')).CDPConnection(
      options,
      instance(loggerMock),
      instance(retryStrategyMock)
    );
  });

  afterEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
    reset<Logger | RetryStrategy | Client>(
      loggerMock,
      retryStrategyMock,
      clientMock
    );
  });

  describe('open', () => {
    it('should attempt to connect to Chrome', async () => {
      // arrange
      connect.mockResolvedValue(resolvableInstance(clientMock));
      // act
      await sut.open();
      // assert
      expect(connect).toHaveBeenCalledWith(options);
    });

    it('should log a message if the connection is successful', async () => {
      // arrange
      connect.mockResolvedValue(resolvableInstance(clientMock));
      // act
      await sut.open();
      // assert
      verify(loggerMock.debug(CONNECTED)).once();
    });

    it('should log a message if the connection fails', async () => {
      // arrange
      const error = new Error('Connection failed');
      connect.mockRejectedValue(error);
      // act
      const act = () => sut.open();
      // assert
      await expect(act).rejects.toThrow();
      verify(
        loggerMock.debug(`${FAILED_ATTEMPT_TO_CONNECT}: ${error.message}`)
      ).once();
    });

    it('should retry the connection if it fails', async () => {
      // arrange
      const error = new Error('Connection failed');
      connect
        .mockRejectedValueOnce(error)
        .mockResolvedValue(resolvableInstance(clientMock));
      when(retryStrategyMock.execute(anyFunction())).thenCall(
        async callback => {
          await callback();

          return 1;
        }
      );
      // act
      await sut.open();
      // assert
      verify(retryStrategyMock.execute(anyFunction())).once();
      expect(connect).toHaveBeenCalledTimes(2);
    });

    it('should throw an error if the connection fails after the maximum number of retries', async () => {
      // arrange
      const error = new Error('Connection failed');
      connect.mockRejectedValue(error);
      when(retryStrategyMock.execute(anyFunction())).thenResolve(0);
      // act
      const act = () => sut.open();
      // assert
      await expect(act).rejects.toThrow('Failed to connect');
    });
  });

  describe('close', () => {
    beforeEach(async () => {
      connect.mockResolvedValue(resolvableInstance(clientMock));
      await sut.open();
    });

    it('should close the connection', async () => {
      // act
      await sut.close();
      // assert
      verify(clientMock.close()).once();
    });

    it('should log a message if the connection is closed', async () => {
      // act
      await sut.close();
      // assert
      verify(loggerMock.debug(DISCONNECTED)).once();
    });

    it('should remove all listeners', async () => {
      // act
      await sut.close();
      // assert
      verify(clientMock.removeAllListeners()).once();
    });
  });

  describe('discoverNetwork', () => {
    it('should log an message when connection is not established yet', async () => {
      // act
      sut.discoverNetwork();
      // assert
      verify(loggerMock.debug(CONNECTION_IS_NOT_DEFINED)).once();
    });

    it('should return an undefined when connection is not established yet', async () => {
      // act
      const result = sut.discoverNetwork();
      // assert
      expect(result).toBeUndefined();
    });

    it('should create a new network monitor', async () => {
      // arrange
      connect.mockResolvedValue(resolvableInstance(clientMock));
      await sut.open();
      // act
      const result = sut.discoverNetwork();
      // assert
      expect(result).not.toBeUndefined();
    });

    it('should return an existing network monitor', async () => {
      // arrange
      connect.mockResolvedValue(resolvableInstance(clientMock));
      await sut.open();
      const expected = sut.discoverNetwork();
      // act
      const result = sut.discoverNetwork();
      // assert
      expect(result).toBe(expected);
    });
  });
});