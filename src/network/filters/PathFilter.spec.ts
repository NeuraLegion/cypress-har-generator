import { RequestFilterOptions } from './RequestFilter';
import { NetworkRequest } from '../NetworkRequest';
import { PathFilter } from './PathFilter';
import { describe, beforeEach, it, expect } from '@jest/globals';
import { instance, mock, reset, when } from 'ts-mockito';

describe('PathFilter', () => {
  const networkRequestMock = mock<NetworkRequest>();

  let sut!: PathFilter;

  beforeEach(() => {
    sut = new PathFilter();
  });

  afterEach(() => reset(networkRequestMock));

  describe('wouldApply', () => {
    it.each([
      {},
      { excludePaths: undefined },
      { excludePaths: null },
      { excludePaths: [] }
    ])(
      'should return false when the filter is not applicable (options: %j)',
      options => {
        // act
        const result = sut.wouldApply(
          options as unknown as RequestFilterOptions
        );
        // assert
        expect(result).toBe(false);
      }
    );

    it.each([
      { excludePaths: ['example.com'] },
      { excludePaths: ['example.com$'] },
      { excludePaths: ['example.com', 'sub.example.com'] }
    ])(
      'should return true when the filter is applicable (options: %j)',
      options => {
        // act
        const result = sut.wouldApply(
          options as unknown as RequestFilterOptions
        );
        // assert
        expect(result).toBe(true);
      }
    );
  });

  describe('apply', () => {
    it('should return true if the pathname is allowed', () => {
      // arrange
      const url = new URL('https://example.com');
      when(networkRequestMock.parsedURL).thenReturn(url);
      const options = { excludePaths: ['/login'] };
      // act
      const result = sut.apply(instance(networkRequestMock), options);
      // assert
      expect(result).toBe(true);
    });

    it('should return true if the pathname is allowed by regexp', () => {
      // arrange
      const url = new URL('https://example.com');
      when(networkRequestMock.parsedURL).thenReturn(url);
      const options = { excludePaths: ['/login$'] };
      // act
      const result = sut.apply(instance(networkRequestMock), options);
      // assert
      expect(result).toBe(true);
    });

    it('should return false if the pathname is not allowed', () => {
      // arrange
      const url = new URL('https://example.com/login');
      when(networkRequestMock.parsedURL).thenReturn(url);
      const options = { excludePaths: ['/login'] };
      // act
      const result = sut.apply(instance(networkRequestMock), options);
      // assert
      expect(result).toBe(false);
    });
  });
});
