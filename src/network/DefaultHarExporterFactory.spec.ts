import type { FileManager } from '../utils/FileManager';
import { DefaultHarExporterFactory } from './DefaultHarExporterFactory';
import { DefaultHarExporter } from './DefaultHarExporter';
import { Loader } from '../utils/Loader';
import type { Logger } from '../utils/Logger';
import { instance, mock, reset, spy, verify, when } from 'ts-mockito';
import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach
} from '@jest/globals';
import type { WriteStream } from 'fs';

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

describe('DefaultHarExporterFactory', () => {
  const fileManagerMock = mock<FileManager>();
  const writeStreamMock = mock<WriteStream>();
  const loggerMock = mock<Logger>();
  const loaderSpy = spy(Loader);
  const predicate = jest.fn();
  const transform = jest.fn();

  let factory!: DefaultHarExporterFactory;

  beforeEach(() => {
    factory = new DefaultHarExporterFactory(
      instance(fileManagerMock),
      instance(loggerMock)
    );
  });

  afterEach(() => {
    transform.mockReset();
    predicate.mockReset();
    reset<FileManager | WriteStream | Logger | typeof Loader>(
      fileManagerMock,
      writeStreamMock,
      loaderSpy,
      loggerMock
    );
  });

  describe('create', () => {
    it('should create a HarExporter instance', async () => {
      // arrange
      const options = {
        rootDir: '/root',
        filter: 'predicate.js',
        transform: 'transform.js'
      };
      when(fileManagerMock.createTmpWriteStream()).thenResolve(
        resolvableInstance(writeStreamMock)
      );
      when(loaderSpy.load('/root/predicate.js')).thenResolve(predicate);
      when(loaderSpy.load('/root/transform.js')).thenResolve(transform);

      // act
      const result = await factory.create(options);

      // assert
      expect(result).toBeInstanceOf(DefaultHarExporter);
      verify(loaderSpy.load('/root/predicate.js')).once();
      verify(loaderSpy.load('/root/transform.js')).once();
    });

    it('should create a HarExporter instance without pre and post processors', async () => {
      // arrange
      const options = { rootDir: '/root' };
      when(fileManagerMock.createTmpWriteStream()).thenResolve(
        resolvableInstance(writeStreamMock)
      );

      // act
      const result = await factory.create(options);

      // assert
      expect(result).toBeInstanceOf(DefaultHarExporter);
    });
  });
});
