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
  verify,
  when
} from 'ts-mockito';
import { beforeEach, describe, expect, it } from '@jest/globals';
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

  let plugin!: Plugin;

  beforeEach(() => {
    plugin = new Plugin(
      instance(loggerMock),
      instance(fileManagerMock),
      instance(connectionFactoryMock),
      instance(observerFactoryMock)
    );
  });

  afterEach(() =>
    reset<
      | Logger
      | FileManager
      | Connection
      | WriteStream
      | ConnectionFactory
      | ObserverFactory
      | Observer<NetworkRequest>
    >(
      loggerMock,
      fileManagerMock,
      connectionMock,
      connectionFactoryMock,
      observerFactoryMock,
      networkObserverMock,
      writableStreamMock
    )
  );

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
  });

  describe('saveHar', () => {
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
});
