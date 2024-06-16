import type { NetworkObserverOptions } from './NetworkObserverOptions.js';
import { DefaultObserverFactory } from './DefaultObserverFactory.js';
import { type Logger } from '../utils/Logger.js';
import { NetworkObserver } from './NetworkObserver.js';
import type { Network } from './Network.js';
import { describe, beforeEach, it, expect } from '@jest/globals';
import { instance, mock } from 'ts-mockito';

describe('DefaultObserverFactory', () => {
  const networkMock = mock<Network>();
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
        instance(networkMock),
        options
      );
      // assert
      expect(observer).toBeInstanceOf(NetworkObserver);
    });
  });
});
