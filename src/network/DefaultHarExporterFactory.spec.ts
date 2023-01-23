import type { FileManager } from '../utils/FileManager';
import { DefaultHarExporterFactory } from './DefaultHarExporterFactory';
import { DefaultHarExporter } from './DefaultHarExporter';
import { Loader } from '../utils/Loader';
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
  const loaderSpy = spy(Loader);
  const predicate = jest.fn();

  let factory!: DefaultHarExporterFactory;

  beforeEach(() => {
    factory = new DefaultHarExporterFactory(instance(fileManagerMock));
  });

  afterEach(() =>
    reset<FileManager | WriteStream | typeof Loader>(
      fileManagerMock,
      writeStreamMock,
      loaderSpy
    )
  );

  describe('create', () => {
    it('should create a HarExporter instance', async () => {
      // arrange
      const options = { rootDir: '/root', predicatePath: 'predicate.js' };
      when(fileManagerMock.createTmpWriteStream()).thenResolve(
        resolvableInstance(writeStreamMock)
      );
      when(loaderSpy.load('/root/predicate.js')).thenResolve(predicate);

      // act
      const result = await factory.create(options);

      // assert
      expect(result).toBeInstanceOf(DefaultHarExporter);
      verify(loaderSpy.load('/root/predicate.js')).once();
    });

    it('should create a HarExporter instance without predicate', async () => {
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
