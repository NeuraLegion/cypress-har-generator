import { Connection } from '../cdp';
import { NetworkObserverOptions } from './NetworkObserverOptions';
import { DefaultObserverFactory } from './DefaultObserverFactory';
import { Logger } from '../utils';
import { NetworkObserver } from './NetworkObserver';
import { describe, beforeEach, it, expect } from '@jest/globals';
import { instance, mock } from 'ts-mockito';

describe('DefaultObserverFactory', () => {
  const connectionMock = mock<Connection>();
  const loggerMock = mock<Logger>();
  const options: NetworkObserverOptions = {};

  let factory!: DefaultObserverFactory;

  beforeEach(() => {
    factory = new DefaultObserverFactory(instance(loggerMock));
  });

  describe('createNetworkObserver', () => {
    it('should create a NetworkObserver', () => {
      // act
      const observer = factory.createNetworkObserver(
        instance(connectionMock),
        options
      );
      // assert
      expect(observer).toBeInstanceOf(NetworkObserver);
    });
  });
});
