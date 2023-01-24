import { NetworkRequest } from './NetworkRequest';
import { DefaultHarExporter } from './DefaultHarExporter';
import {
  anyString,
  instance,
  match,
  mock,
  reset,
  verify,
  when
} from 'ts-mockito';
import type { Entry } from 'har-format';
import { beforeEach, describe, it, jest, expect } from '@jest/globals';
import type { WriteStream } from 'fs';
import { EOL } from 'os';

describe('DefaultHarExporter', () => {
  const buffer = mock<WriteStream>();
  const networkRequest = new NetworkRequest(
    '1',
    'https://example.com',
    'https://example.com',
    '1'
  );
  const predicate: jest.Mock<(entry: Entry) => Promise<unknown> | unknown> =
    jest.fn<(entry: Entry) => Promise<unknown> | unknown>();
  let harExporter!: DefaultHarExporter;

  beforeEach(() => {
    harExporter = new DefaultHarExporter(instance(buffer), predicate);
  });

  afterEach(() => {
    predicate.mockRestore();
    reset(buffer);
  });

  describe('path', () => {
    it('should return the path serializing buffer', () => {
      // arrange
      const expected = '/path/file';
      when(buffer.path).thenReturn(Buffer.from(expected));

      // act
      const result = harExporter.path;

      // assert
      expect(result).toBe(expected);
    });

    it('should return the path', () => {
      // arrange
      const expected = '/path/file';
      when(buffer.path).thenReturn(expected);

      // act
      const result = harExporter.path;

      // assert
      expect(result).toBe(expected);
    });
  });

  describe('end', () => {
    it('should close the stream', () => {
      // act
      harExporter.end();

      // assert
      verify(buffer.end()).once();
    });
  });

  describe('write', () => {
    it('should write the entry to the buffer', async () => {
      // arrange
      // @ts-expect-error type mismatch
      when(buffer.closed).thenReturn(false);
      predicate.mockReturnValue(false);

      // act
      await harExporter.write(networkRequest);

      // assert
      verify(buffer.write(match(`${EOL}`))).once();
    });

    it('should write the entry to the buffer if the predicate returns throws an error', async () => {
      // arrange
      // @ts-expect-error type mismatch
      when(buffer.closed).thenReturn(false);
      predicate.mockReturnValue(
        Promise.reject(new Error('something went wrong'))
      );

      // act
      await harExporter.write(networkRequest);

      // assert
      verify(buffer.write(match(`${EOL}`))).once();
    });

    it('should not write the entry to the buffer if the predicate returns true', async () => {
      // arrange
      // @ts-expect-error type mismatch
      when(buffer.closed).thenReturn(false);
      predicate.mockReturnValue(true);

      // act
      await harExporter.write(networkRequest);

      // assert
      verify(buffer.write(anyString())).never();
    });

    it('should not write the entry to the buffer if the buffer is closed', async () => {
      // arrange
      // @ts-expect-error type mismatch
      when(buffer.closed).thenReturn(true);
      predicate.mockReturnValue(false);

      // act
      await harExporter.write(networkRequest);

      // assert
      verify(buffer.write(anyString())).never();
    });
  });
});
