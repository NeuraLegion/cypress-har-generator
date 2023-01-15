import { Plugin, RecordOptions, SaveOptions } from './Plugin';
import { FileManager, Logger } from './utils';
import { Connection, ConnectionFactory } from './cdp';
import { NetworkRequest, Observer, ObserverFactory } from './network';
import {
  anyFunction,
  anyString,
  anything,
  deepEqual,
  instance,
  match,
  mock,
  reset,
  spy,
  verify,
  when
} from 'ts-mockito';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { Entry } from 'har-format';
import { WriteStream } from 'fs';
import { EOL, tmpdir } from 'os';

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

const findArg = <R>(
  args: [unknown, unknown],
  expected: 'function' | 'number'
): R => (typeof args[0] === expected ? args[0] : args[1]) as R;

const useFakeTimers = () => {
  jest.useFakeTimers();

  const mockedImplementation = jest
    .spyOn(global, 'setTimeout')
    .getMockImplementation();

  jest
    .spyOn(global, 'setTimeout')
    .mockImplementation((...args: [unknown, unknown]) => {
      // ADHOC: depending on implementation (promisify vs raw), the method signature will be different
      const callback = findArg<(..._: unknown[]) => void>(args, 'function');
      const ms = findArg<number>(args, 'number');
      const timer = mockedImplementation?.(callback, ms);

      jest.runAllTimers();

      return timer;
    });
};

const entry = {
  startedDateTime: '2022-04-18T09:09:35.585Z',
  time: -1,
  request: {
    method: 'GET',
    url: 'https://example.com/',
    httpVersion: 'HTTP/0.9',
    headers: [],
    queryString: [],
    cookies: [],
    headersSize: -1,
    bodySize: -1
  },
  response: {
    status: 200,
    statusText: 'OK',
    httpVersion: 'HTTP/0.9',
    headers: [],
    cookies: [],
    content: {
      size: -1,
      mimeType: 'text/plain'
    },
    redirectURL: '',
    headersSize: -1,
    bodySize: -1
  },
  cache: {},
  timings: { send: 0, receive: 0, wait: 0 }
} as Entry;

describe('Plugin', () => {
  const loggerMock = mock<Logger>();
  const fileManagerMock = mock<FileManager>();
  const observerFactoryMock = mock<ObserverFactory>();
  const networkObserverMock = mock<Observer<NetworkRequest>>();
  const connectionFactoryMock = mock<ConnectionFactory>();
  const connectionMock = mock<Connection>();
  const writableStreamMock = mock<WriteStream>();
  const processEnv = process.env;

  let plugin!: Plugin;
  let processSpy!: NodeJS.Process;

  beforeEach(() => {
    processSpy = spy(process);

    when(processSpy.env).thenReturn({
      ...processEnv,
      ELECTRON_EXTRA_LAUNCH_ARGS: ''
    });

    useFakeTimers();

    plugin = new Plugin(
      instance(loggerMock),
      instance(fileManagerMock),
      instance(connectionFactoryMock),
      instance(observerFactoryMock)
    );
  });

  afterEach(() => {
    jest.useRealTimers();
    reset<
      | NodeJS.Process
      | Logger
      | FileManager
      | Connection
      | WriteStream
      | ConnectionFactory
      | ObserverFactory
      | Observer<NetworkRequest>
    >(
      processSpy,
      loggerMock,
      fileManagerMock,
      connectionMock,
      connectionFactoryMock,
      observerFactoryMock,
      networkObserverMock,
      writableStreamMock
    );
  });

  describe('ensureBrowserFlags', () => {
    it('should add --remote-debugging-port and --remote-debugging-address flags if not present', () => {
      // arrange
      const browser = { family: 'chromium' } as Cypress.Browser;
      const args = ['--flag1', '--flag2'];
      const expectedArgs = [
        '--remote-debugging-address=localhost',
        expect.stringMatching(/^--remote-debugging-port/)
      ];
      // act
      const result = plugin.ensureBrowserFlags(browser, args);
      // assert
      expect(result).toEqual(expect.arrayContaining(expectedArgs));
    });

    it('should not add --remote-debugging-port and --remote-debugging-address flags if present', () => {
      // arrange
      const browser = { family: 'chromium' } as Cypress.Browser;
      const expectedArgs = [
        '--remote-debugging-port=9090',
        '--remote-debugging-address=localhost'
      ];
      const args = ['--flag1', '--flag2', ...expectedArgs];
      // act
      const result = plugin.ensureBrowserFlags(browser, args);
      // assert
      expect(result).not.toContain(expectedArgs);
    });

    it('should throw an error if an unsupported browser family is used', () => {
      // arrange
      const browser = { family: 'firefox' } as Cypress.Browser;
      const args = ['--flag1', '--flag2'];
      // act
      const act = () => plugin.ensureBrowserFlags(browser, args);
      // assert
      expect(act).toThrowError(
        `An unsupported browser family was used: ${browser.name}`
      );
    });

    it('should throw an error when Electron is used and switches are missed', () => {
      // arrange
      const browser = {
        family: 'chromium',
        name: 'electron'
      } as Cypress.Browser;
      const args: string[] = [];
      // act
      const act = () => plugin.ensureBrowserFlags(browser, args);
      // assert
      expect(act).toThrowError(
        `Missing '--remote-debugging-port' command line switch for Electron browser`
      );
    });

    it('should extract --remote-debugging-port from ELECTRON_EXTRA_LAUNCH_ARGS env variable', () => {
      // arrange
      const browser = {
        family: 'chromium',
        name: 'electron'
      } as Cypress.Browser;
      const args: string[] = [];
      when(processSpy.env).thenReturn({
        ...processEnv,
        ELECTRON_EXTRA_LAUNCH_ARGS: '--remote-debugging-port=9090'
      });
      // act
      const result = plugin.ensureBrowserFlags(browser, args);
      // assert
      expect(result).toEqual([]);
    });
  });

  describe('saveHar', () => {
    it(`should return null to satisfy Cypress's contract when connection is not established yet`, async () => {
      // arrange
      const options = {
        fileName: 'file.har',
        outDir: tmpdir()
      } as SaveOptions;
      // act
      const result = await plugin.saveHar(options);
      // assert
      expect(result).toBe(null);
    });

    it(`should return null to satisfy Cypress's contract by default`, async () => {
      // arrange
      when(connectionFactoryMock.create(anything())).thenReturn(
        instance(connectionMock)
      );
      when(
        observerFactoryMock.createNetworkObserver(anything(), anything())
      ).thenReturn(instance(networkObserverMock));
      await plugin.recordHar({});
      const options = {
        fileName: 'file.har',
        outDir: tmpdir()
      } as SaveOptions;
      // act
      const result = await plugin.saveHar(options);
      // assert
      expect(result).toBe(null);
    });

    it('should log an error message when the connection is corrupted', async () => {
      // arrange
      const options = {
        fileName: 'file.har',
        outDir: tmpdir()
      } as SaveOptions;
      // act
      await plugin.saveHar(options);
      // assert
      verify(
        loggerMock.err('Failed to save HAR. First you should start recording.')
      ).once();
    });

    it('should create an output folder', async () => {
      // arrange
      when(connectionFactoryMock.create(anything())).thenReturn(
        instance(connectionMock)
      );
      when(
        observerFactoryMock.createNetworkObserver(anything(), anything())
      ).thenReturn(instance(networkObserverMock));
      await plugin.recordHar({});

      const outDir = tmpdir();
      const options = {
        outDir,
        fileName: 'file.har'
      } as SaveOptions;
      // act
      await plugin.saveHar(options);
      // assert
      verify(fileManagerMock.createFolder(outDir)).once();
    });

    it('should wait for completing all pending requests before saving a HAR', async () => {
      // arrange
      when(connectionFactoryMock.create(anything())).thenReturn(
        instance(connectionMock)
      );
      when(
        observerFactoryMock.createNetworkObserver(anything(), anything())
      ).thenReturn(instance(networkObserverMock));
      when(networkObserverMock.empty).thenReturn(false, false, true);
      when(fileManagerMock.createTmpWriteStream()).thenResolve(
        resolvableInstance(writableStreamMock)
      );
      // @ts-expect-error type mismatch
      when(writableStreamMock.closed).thenReturn(true);
      when(writableStreamMock.path).thenReturn('temp-file.txt');
      await plugin.recordHar({});

      const outDir = tmpdir();
      const fileName = 'file.har';

      when(fileManagerMock.readFile(anyString())).thenResolve(
        JSON.stringify(entry)
      );
      // act
      await plugin.saveHar({
        outDir,
        fileName,
        waitForIdle: true
      });
      // assert
      verify(networkObserverMock.empty).times(4);
    });

    it('should build and save a resulting HAR file', async () => {
      // arrange
      when(connectionFactoryMock.create(anything())).thenReturn(
        instance(connectionMock)
      );
      when(
        observerFactoryMock.createNetworkObserver(anything(), anything())
      ).thenReturn(instance(networkObserverMock));
      when(fileManagerMock.createTmpWriteStream()).thenResolve(
        resolvableInstance(writableStreamMock)
      );
      // @ts-expect-error type mismatch
      when(writableStreamMock.closed).thenReturn(true);
      when(writableStreamMock.path).thenReturn('temp-file.txt');
      await plugin.recordHar({});

      const outDir = tmpdir();
      const fileName = 'file.har';

      when(fileManagerMock.readFile(anyString())).thenResolve(
        JSON.stringify(entry)
      );
      // act
      await plugin.saveHar({
        outDir,
        fileName
      });
      // assert
      verify(
        fileManagerMock.writeFile(match(fileName), match(`"version": "1.2"`))
      ).once();
    });

    it('should log an error message when failing to build a HAR file', async () => {
      // arrange
      when(connectionFactoryMock.create(anything())).thenReturn(
        instance(connectionMock)
      );
      when(
        observerFactoryMock.createNetworkObserver(anything(), anything())
      ).thenReturn(instance(networkObserverMock));
      when(fileManagerMock.createTmpWriteStream()).thenResolve(
        resolvableInstance(writableStreamMock)
      );
      // @ts-expect-error type mismatch
      when(writableStreamMock.closed).thenReturn(true);
      when(writableStreamMock.path).thenReturn('temp-file.txt');
      await plugin.recordHar({});

      const outDir = tmpdir();
      const fileName = 'file.har';

      when(fileManagerMock.readFile(anyString())).thenThrow(
        new Error('something went wrong')
      );
      // act
      await plugin.saveHar({
        outDir,
        fileName
      });
      // assert
      verify(loggerMock.err(match(/^Failed to save HAR/))).once();
    });

    it('should unsubscribe from the network events', async () => {
      // arrange
      when(connectionFactoryMock.create(anything())).thenReturn(
        instance(connectionMock)
      );
      when(
        observerFactoryMock.createNetworkObserver(anything(), anything())
      ).thenReturn(instance(networkObserverMock));
      await plugin.recordHar({});

      const outDir = tmpdir();
      const fileName = 'file.har';

      // act
      await plugin.saveHar({
        outDir,
        fileName
      });
      // assert
      verify(networkObserverMock.unsubscribe()).once();
    });

    it('should dispose a stream', async () => {
      // arrange
      when(connectionFactoryMock.create(anything())).thenReturn(
        instance(connectionMock)
      );
      when(
        observerFactoryMock.createNetworkObserver(anything(), anything())
      ).thenReturn(instance(networkObserverMock));
      when(fileManagerMock.createTmpWriteStream()).thenResolve(
        resolvableInstance(writableStreamMock)
      );
      const tempFilePath = 'temp-file.txt';
      // @ts-expect-error type mismatch
      when(writableStreamMock.closed).thenReturn(true);
      when(writableStreamMock.path).thenReturn(tempFilePath);
      await plugin.recordHar({});

      const outDir = tmpdir();
      const fileName = 'file.har';

      when(fileManagerMock.readFile(anyString())).thenResolve(
        JSON.stringify(entry)
      );
      // act
      await plugin.saveHar({
        outDir,
        fileName
      });
      // assert
      verify(writableStreamMock.end()).once();
      verify(fileManagerMock.removeFile(tempFilePath)).once();
    });
  });

  describe('recordHar', () => {
    beforeEach(() => {
      when(connectionFactoryMock.create(anything())).thenReturn(
        instance(connectionMock)
      );
      when(
        observerFactoryMock.createNetworkObserver(anything(), anything())
      ).thenReturn(instance(networkObserverMock));
    });

    it(`should return null to satisfy Cypress's contract`, async () => {
      // arrange
      const options = {
        content: true,
        excludePaths: [],
        includeHosts: []
      } as RecordOptions;
      // act
      const result = await plugin.recordHar(options);
      // assert
      expect(result).toBe(null);
    });

    it('should open connection and listen to network events', async () => {
      // arrange
      const options = {
        content: true,
        excludePaths: [],
        includeHosts: []
      } as RecordOptions;
      // act
      await plugin.recordHar(options);
      // assert
      verify(
        observerFactoryMock.createNetworkObserver(
          anything(),
          deepEqual(options)
        )
      ).once();
      verify(connectionMock.open()).once();
      verify(networkObserverMock.subscribe(anyFunction())).once();
    });

    it('should close connection when it is already opened', async () => {
      // arrange
      const options = {
        content: true,
        excludePaths: [],
        includeHosts: []
      } as RecordOptions;
      await plugin.recordHar(options);
      // act
      await plugin.recordHar(options);
      // assert
      verify(connectionMock.close()).once();
      verify(connectionMock.open()).twice();
    });

    it('should write an entry to a stream', async () => {
      // arrange
      const options = {} as RecordOptions;
      when(fileManagerMock.createTmpWriteStream()).thenResolve(
        resolvableInstance(writableStreamMock)
      );
      // @ts-expect-error type mismatch
      when(writableStreamMock.closed).thenReturn(false);
      when(networkObserverMock.subscribe(anyFunction())).thenCall(callback =>
        callback(
          new NetworkRequest(
            '1',
            'https://example.com',
            'https://example.com',
            '1'
          )
        )
      );
      // act
      await plugin.recordHar(options);
      // assert
      verify(writableStreamMock.write(match(`${EOL}`))).once();
    });

    it('should do nothing when a stream is closed', async () => {
      // arrange
      const options = {} as RecordOptions;
      when(fileManagerMock.createTmpWriteStream()).thenResolve(
        resolvableInstance(writableStreamMock)
      );
      // @ts-expect-error type mismatch
      when(writableStreamMock.closed).thenReturn(true);
      when(networkObserverMock.subscribe(anyFunction())).thenCall(callback =>
        callback(
          new NetworkRequest(
            '1',
            'https://example.com',
            'https://example.com',
            '1'
          )
        )
      );
      // act
      await plugin.recordHar(options);
      // assert
      verify(writableStreamMock.write(match(`${EOL}`))).never();
    });
  });

  describe('disposeOfHar', () => {
    beforeEach(() => {
      when(connectionFactoryMock.create(anything())).thenReturn(
        instance(connectionMock)
      );
      when(
        observerFactoryMock.createNetworkObserver(anything(), anything())
      ).thenReturn(instance(networkObserverMock));
      when(fileManagerMock.createTmpWriteStream()).thenResolve(
        resolvableInstance(writableStreamMock)
      );
      // @ts-expect-error type mismatch
      when(writableStreamMock.closed).thenReturn(true);
      when(writableStreamMock.path).thenReturn('temp-file.txt');
    });

    it(`should return null to satisfy Cypress's contract`, async () => {
      // act
      const result = await plugin.disposeOfHar();
      // assert
      expect(result).toBe(null);
    });

    it('should dispose of a stream', async () => {
      // arrange
      await plugin.recordHar({});
      // act
      await plugin.disposeOfHar();
      // assert
      verify(writableStreamMock.end()).once();
    });

    it('should unsubscribe from the network events', async () => {
      // arrange
      await plugin.recordHar({});
      // act
      await plugin.disposeOfHar();
      // assert
      verify(networkObserverMock.unsubscribe()).once();
    });

    it('should do nothing when the recording is not started yet', async () => {
      // act
      await plugin.disposeOfHar();
      // assert
      verify(networkObserverMock.unsubscribe()).never();
    });
  });
});
