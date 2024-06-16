import { type NetworkRequest } from '../NetworkRequest.js';
import { BlobFilter } from './BlobFilter.js';
import { describe, beforeEach, it, expect } from '@jest/globals';
import { instance, mock, reset, when } from 'ts-mockito';

describe('BlobFilter', () => {
  const networkRequestMock = mock<NetworkRequest>();

  let sut!: BlobFilter;

  beforeEach(() => {
    sut = new BlobFilter();
  });

  afterEach(() => reset(networkRequestMock));

  describe('wouldApply', () => {
    it('should return true when the filter is applicable', () => {
      // act
      const result = sut.wouldApply({});
      // assert
      expect(result).toBe(true);
    });
  });

  describe('apply', () => {
    it('should return false if the request is blob', () => {
      // arrange
      when(networkRequestMock.isBlob()).thenReturn(true);
      // act
      const result = sut.apply(instance(networkRequestMock), {});
      // assert
      expect(result).toBe(false);
    });

    it('should return true if the request is not blob', () => {
      // arrange
      when(networkRequestMock.isBlob()).thenReturn(false);
      // act
      const result = sut.apply(instance(networkRequestMock), {});
      // assert
      expect(result).toBe(true);
    });
  });
});
