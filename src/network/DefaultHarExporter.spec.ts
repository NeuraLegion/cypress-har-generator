import { NetworkRequest } from './NetworkRequest';
import { DefaultHarExporter } from './DefaultHarExporter';
import type { Logger } from '../utils/Logger';
import type { DefaultHarExporterOptions } from './DefaultHarExporterOptions';
import {
  anyString,
  instance,
  match,
  mock,
  reset,
  spy,
  verify,
  when
} from 'ts-mockito';
import type { Entry } from 'har-format';
import { beforeEach, describe, it, jest, expect } from '@jest/globals';
import type { WriteStream } from 'fs';
import { EOL } from 'os';

describe('DefaultHarExporter', () => {
  const streamMock = mock<WriteStream>();
  const loggerMock = mock<Logger>();
  const networkRequest = new NetworkRequest(
    '1',
    'https://example.com',
    'https://example.com',
    '1'
  );
  const predicate = jest.fn<(entry: Entry) => Promise<unknown> | unknown>();
  const transform = jest.fn<(entry: Entry) => Promise<Entry> | Entry>();

  let harExporter!: DefaultHarExporter;
  let options!: DefaultHarExporterOptions;
  let optionsSpy!: DefaultHarExporterOptions;

  beforeEach(() => {
    options = {};
    optionsSpy = spy(options);

    harExporter = new DefaultHarExporter(
      instance(loggerMock),
      instance(streamMock),
      options
    );
  });

  afterEach(() => {
    predicate.mockRestore();
    transform.mockRestore();
    reset<DefaultHarExporterOptions | WriteStream | Logger>(
      streamMock,
      optionsSpy,
      loggerMock
    );
  });

  describe('path', () => {
    it('should return the path serializing buffer', () => {
      // arrange
      const expected = '/path/file';
      when(streamMock.path).thenReturn(Buffer.from(expected));

      // act
      const result = harExporter.path;

      // assert
      expect(result).toBe(expected);
    });

    it('should return the path', () => {
      // arrange
      const expected = '/path/file';
      when(streamMock.path).thenReturn(expected);

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
      verify(streamMock.end()).once();
    });
  });

  describe('write', () => {
    it('should write the entry to the buffer', async () => {
      // arrange
      // @ts-expect-error type mismatch
      when(streamMock.closed).thenReturn(false);
      when(optionsSpy.predicate).thenReturn(predicate);
      predicate.mockReturnValue(false);

      // act
      await harExporter.write(networkRequest);

      // assert
      verify(streamMock.write(match(`${EOL}`))).once();
    });

    it('should write the entry to the buffer if the predicate returns throws an error', async () => {
      // arrange
      // @ts-expect-error type mismatch
      when(streamMock.closed).thenReturn(false);
      when(optionsSpy.predicate).thenReturn(predicate);
      predicate.mockReturnValue(
        Promise.reject(new Error('something went wrong'))
      );

      // act
      await harExporter.write(networkRequest);

      // assert
      verify(streamMock.write(match(`${EOL}`))).once();
    });

    it('should transform the entry before writing to the buffer', async () => {
      // arrange
      const entry = { foo: 'bar' } as unknown as Entry;
      const entryString = JSON.stringify(entry);
      // @ts-expect-error type mismatch
      when(streamMock.closed).thenReturn(false);
      when(optionsSpy.transform).thenReturn(transform);
      transform.mockReturnValue(Promise.resolve(entry));

      // act
      await harExporter.write(networkRequest);

      // assert
      verify(streamMock.write(match(`${entryString}${EOL}`))).once();
    });

    it('should skip the entry when the transformation is failed with an error', async () => {
      // arrange
      // @ts-expect-error type mismatch
      when(streamMock.closed).thenReturn(false);
      when(optionsSpy.transform).thenReturn(transform);
      transform.mockReturnValue(
        Promise.reject(new Error('Something went wrong.'))
      );

      // act
      await harExporter.write(networkRequest);

      // assert
      verify(streamMock.write(anyString())).never();
    });

    it('should not write the entry to the buffer if the predicate returns true', async () => {
      // arrange
      // @ts-expect-error type mismatch
      when(streamMock.closed).thenReturn(false);
      when(optionsSpy.predicate).thenReturn(predicate);
      predicate.mockReturnValue(true);

      // act
      await harExporter.write(networkRequest);

      // assert
      verify(streamMock.write(anyString())).never();
    });

    it('should not write the entry to the buffer if the buffer is closed', async () => {
      // arrange
      // @ts-expect-error type mismatch
      when(streamMock.closed).thenReturn(true);
      when(optionsSpy.predicate).thenReturn(predicate);
      predicate.mockReturnValue(false);

      // act
      await harExporter.write(networkRequest);

      // assert
      verify(streamMock.write(anyString())).never();
    });
  });
});
