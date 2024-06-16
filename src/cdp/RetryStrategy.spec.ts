import { RetryStrategy } from './RetryStrategy.js';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';

describe('RetryStrategy', () => {
  let task!: jest.Mock;

  beforeEach(() => {
    task = jest.fn();
    jest.useFakeTimers();
  });

  afterEach(() => {
    task.mockRestore();
    jest.useRealTimers();
  });

  describe('execute', () => {
    it('should execute the task', async () => {
      // arrange
      const retryStrategy = new RetryStrategy(3, 10, 1000);
      // act
      await retryStrategy.execute(task);
      // assert
      expect(task).toHaveBeenCalledTimes(1);
    });

    it('should execute the task the specified number of times', async () => {
      // arrange
      const retryStrategy = new RetryStrategy(3, 10, 1000);
      // act
      for (let i = 0; i < 4; i++) {
        process.nextTick(() => jest.runAllTimers());
        await retryStrategy.execute(task);
      }
      // assert
      expect(task).toHaveBeenCalledTimes(3);
    });

    it('should delay execution between retries', async () => {
      // arrange
      const initialBackoff = 10;
      const maximumBackoff = 1000;
      const retryStrategy = new RetryStrategy(
        3,
        initialBackoff,
        maximumBackoff
      );

      // act
      process.nextTick(() => jest.runAllTimers());
      await retryStrategy.execute(task);

      // assert
      expect(setTimeout).toHaveBeenCalledWith(
        expect.anything(),
        initialBackoff
      );
    });

    it('should return the number of retries remaining', async () => {
      // arrange
      const retryStrategy = new RetryStrategy(3, 10, 1000);
      // act
      process.nextTick(() => jest.runAllTimers());
      const retriesRemaining = await retryStrategy.execute(task);
      // assert
      expect(retriesRemaining).toBe(2);
    });

    it('should do nothing when number of retries is reached', async () => {
      // arrange
      const retryStrategy = new RetryStrategy(0, 10, 1000);
      // act
      process.nextTick(() => jest.runAllTimers());
      await retryStrategy.execute(task);
      // assert
      expect(task).not.toHaveBeenCalled();
    });
  });
});
