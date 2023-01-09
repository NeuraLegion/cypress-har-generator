import type { CRIConnection } from './CRIConnection';
import { Logger } from '../utils';
import { RetryStrategy } from './RetryStrategy';
import {
  CONNECTED,
  CONNECTION_IS_NOT_DEFINED,
  DISCONNECTED,
  FAILED_ATTEMPT_TO_CONNECT
} from './CRIOutputMessages';
import type {
  ChromeRemoteInterface,
  ChromeRemoteInterfaceOptions
} from 'chrome-remote-interface';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  anyFunction,
  instance,
  mock,
  resetCalls,
  verify,
  when
} from 'ts-mockito';

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

describe('CRIConnection', () => {
  let criConnection!: CRIConnection;
  let options!: ChromeRemoteInterfaceOptions;

  const loggerMock = mock<Logger>();
  const retryStrategyMock = mock<RetryStrategy>();
  const chromeRemoteInterfaceMock = mock<ChromeRemoteInterface>();
  const connect =
    jest.fn<(...args: unknown[]) => Promise<ChromeRemoteInterface>>();

  beforeEach(async () => {
    jest.mock('chrome-remote-interface', () => connect);
    options = { host: 'localhost', port: 9222 };
    criConnection = new (await import('./CRIConnection')).CRIConnection(
      options,
      instance(loggerMock),
      instance(retryStrategyMock)
    );
  });

  afterEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
    resetCalls<Logger | RetryStrategy | ChromeRemoteInterface>(
      loggerMock,
      retryStrategyMock,
      chromeRemoteInterfaceMock
    );
  });

  describe('open', () => {
    it('should attempt to connect to Chrome', async () => {
      // arrange
      connect.mockResolvedValue(resolvableInstance(chromeRemoteInterfaceMock));
      // act
      await criConnection.open();
      // assert
      expect(connect).toHaveBeenCalledWith(options);
    });

    it('should log a message if the connection is successful', async () => {
      // arrange
      connect.mockResolvedValue(resolvableInstance(chromeRemoteInterfaceMock));
      // act
      await criConnection.open();
      // assert
      verify(loggerMock.debug(CONNECTED)).once();
    });

    it('should log a message if the connection fails', async () => {
      // arrange
      const error = new Error('Connection failed');
      connect.mockRejectedValue(error);
      // act
      const act = () => criConnection.open();
      // assert
      await expect(act).rejects.toThrow();
      verify(
        loggerMock.debug(`${FAILED_ATTEMPT_TO_CONNECT}: ${error.message}`)
      ).once();
    });

    it('should retry the connection if it fails', async () => {
      // arrange
      const error = new Error('Connection failed');
      connect.mockRejectedValueOnce(error);
      when(retryStrategyMock.execute(anyFunction())).thenResolve(1);
      // act
      await criConnection.open();
      // assert
      verify(retryStrategyMock.execute(anyFunction())).once();
    });

    it('should throw an error if the connection fails after the maximum number of retries', async () => {
      // arrange
      const error = new Error('Connection failed');
      connect.mockRejectedValue(error);
      when(retryStrategyMock.execute(anyFunction())).thenResolve(0);
      // act
      const act = () => criConnection.open();
      // assert
      await expect(act).rejects.toThrow('Failed to connect');
    });
  });

  describe('close', () => {
    beforeEach(async () => {
      connect.mockResolvedValue(resolvableInstance(chromeRemoteInterfaceMock));
      await criConnection.open();
    });

    it('should close the connection', async () => {
      // act
      await criConnection.close();
      // assert
      verify(chromeRemoteInterfaceMock.close()).once();
    });

    it('should log a message if the connection is closed', async () => {
      // act
      await criConnection.close();
      // assert
      verify(loggerMock.debug(DISCONNECTED)).once();
    });

    it('should remove all listeners', async () => {
      // act
      await criConnection.close();
      // assert
      verify(chromeRemoteInterfaceMock.removeAllListeners()).once();
    });
  });

  describe('subscribe', () => {
    it('should register a listener for the "event" event', async () => {
      // arrange
      const callback = jest.fn();
      connect.mockResolvedValue(resolvableInstance(chromeRemoteInterfaceMock));
      await criConnection.open();
      // act
      await criConnection.subscribe(callback);
      // assert
      verify(chromeRemoteInterfaceMock.on('event', callback)).once();
    });

    it('should log a message if the connection is not defined', async () => {
      // act
      await criConnection.subscribe(jest.fn());
      // assert
      verify(loggerMock.debug(CONNECTION_IS_NOT_DEFINED)).once();
    });
  });
});
