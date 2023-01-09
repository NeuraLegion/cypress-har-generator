import { Logger } from '../utils';
import { Connection } from '../cdp';
import { NetworkObserver } from './NetworkObserver';
import { NetworkObserverOptions } from './NetworkObserverOptions';
import { beforeEach, jest, describe, it, expect } from '@jest/globals';
import {
  anyFunction,
  deepEqual,
  instance,
  mock,
  reset,
  spy,
  verify,
  when
} from 'ts-mockito';
import type { Network, Security } from 'chrome-remote-interface';

describe('NetworkObserver', () => {
  const networkMock = mock<Network>();
  const securityMock = mock<Security>();
  const loggerMock = mock<Logger>();
  const connectionMock = mock<Connection>();
  const callback = jest.fn();
  const timings = {
    requestTime: -1,
    proxyStart: -1,
    proxyEnd: -1,
    dnsStart: -1,
    dnsEnd: -1,
    connectStart: -1,
    connectEnd: -1,
    sslStart: -1,
    sslEnd: -1,
    workerStart: -1,
    workerReady: -1,
    workerFetchStart: -1,
    workerRespondWithSettled: -1,
    sendStart: -1,
    sendEnd: -1,
    pushStart: 0,
    pushEnd: 0,
    receiveHeadersEnd: -1
  };
  const response = {
    url: 'http://localhost:8080/',
    status: 200,
    statusText: 'OK',
    headers: {
      /* eslint-disable @typescript-eslint/naming-convention */
      'Content-Length': '1777',
      'Content-Type': 'text/html; charset=UTF-8'
      /* eslint-enable @typescript-eslint/naming-convention */
    },
    mimeType: 'text/html',
    connectionReused: false,
    connectionId: 0,
    remoteIPAddress: '',
    remotePort: 0,
    encodedDataLength: -1,
    responseTime: 1,
    protocol: 'http/1.1'
  };
  const requestWillBeSentEvent = {
    method: 'NetworkNetwork.requestWillBeSent',
    params: {
      requestId: '1',
      documentURL: 'http://localhost:8080/',
      request: {
        url: 'http://localhost:8080/',
        method: 'GET',
        headers: {
          /* eslint-disable @typescript-eslint/naming-convention */
          'Upgrade-Insecure-Requests': '1'
          /* eslint-enable @typescript-eslint/naming-convention */
        },
        initialPriority: 'VeryHigh'
      },
      timestamp: 1,
      wallTime: 1,
      redirectHasExtraInfo: false,
      type: 'Document'
    }
  };
  const responseReceivedEvent = {
    method: 'Network.responseReceived',
    params: {
      timings,
      response,
      requestId: '1',
      timestamp: 1,
      type: 'Document',
      hasExtraInfo: false
    }
  };
  const loadingFinishedEvent = {
    method: 'Network.loadingFinished',
    params: {
      requestId: '1',
      timestamp: 1,
      encodedDataLength: 0
    }
  };
  const requestWillBeSentExtraInfoEvent = {
    method: 'Network.requestWillBeSentExtraInfo',
    params: {
      requestId: '1',
      headers: {
        Cookie: 'foo=bar'
      },
      connectTiming: {
        requestTime: 1
      }
    }
  };
  const responseReceivedExtraInfoEvent = {
    method: 'Network.responseReceivedExtraInfo',
    params: {
      requestId: '1',
      headers: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'Transfer-Encoding': 'chunked'
      },
      resourceIPAddressSpace: 'Local',
      statusCode: 200
    }
  };
  const loadingFailedEvent = {
    method: 'Network.loadingFailed',
    params: {
      requestId: '1',
      timestamp: 1,
      type: 'Document',
      errorText: 'net::ERR_CONNECTION_REFUSED',
      canceled: false
    }
  };
  const dataReceivedEvent = {
    method: 'Network.dataReceived',
    params: {
      requestId: '1',
      timestamp: 1,
      dataLength: 1,
      encodedDataLength: 0
    }
  };

  let sut!: NetworkObserver;
  let options!: NetworkObserverOptions;
  let optionsSpy!: NetworkObserverOptions;

  beforeEach(() => {
    options = {};
    optionsSpy = spy(options);
    when(connectionMock.network).thenReturn(instance(networkMock));
    when(connectionMock.security).thenReturn(instance(securityMock));
    sut = new NetworkObserver(
      options,
      instance(connectionMock),
      instance(loggerMock)
    );
  });

  afterEach(() => {
    callback.mockReset();
    reset<Logger | Connection | Network | Security>(
      loggerMock,
      connectionMock,
      networkMock,
      securityMock
    );
  });

  describe('subscribe', () => {
    it('should subscribe to CDP events', async () => {
      // act
      await sut.subscribe(callback);
      // assert
      verify(connectionMock.subscribe(anyFunction())).once();
    });

    it('should enable the network and security domains', async () => {
      // act
      await sut.subscribe(callback);
      // assert
      verify(networkMock.enable()).once();
      verify(securityMock.enable()).once();
    });

    it('should handle the certificate errors', async () => {
      // arrange
      const eventId = 1;
      when(securityMock.certificateError(anyFunction())).thenCall(cb =>
        cb({ eventId })
      );
      // act
      await sut.subscribe(callback);
      // assert
      verify(
        securityMock.handleCertificateError(
          deepEqual({ eventId, action: 'continue' })
        )
      ).once();
    });

    it('should override the certificate errors', async () => {
      // act
      await sut.subscribe(callback);
      // assert
      verify(
        securityMock.setOverrideCertificateErrors(deepEqual({ override: true }))
      ).once();
    });

    it('should bypass the ServiceWorker', async () => {
      // act
      await sut.subscribe(callback);
      // assert
      verify(
        networkMock.setBypassServiceWorker(deepEqual({ bypass: true }))
      ).once();
    });

    it('should disable the network cache', async () => {
      // act
      await sut.subscribe(callback);
      // assert
      verify(
        networkMock.setCacheDisabled(deepEqual({ cacheDisabled: true }))
      ).once();
    });

    it('should handle a simple sequence of browser events', async () => {
      // arrange
      when(
        networkMock.getRequestPostData(deepEqual({ requestId: '1' }))
      ).thenResolve({
        postData: ''
      });
      when(connectionMock.subscribe(anyFunction())).thenCall(async cb => {
        await cb(requestWillBeSentEvent);
        await cb(responseReceivedEvent);
        await cb(loadingFinishedEvent);
      });
      // act
      await sut.subscribe(callback);
      // assert
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: '1'
        })
      );
    });

    it('should handle a SXG', async () => {
      // arrange
      when(
        networkMock.getRequestPostData(deepEqual({ requestId: '1' }))
      ).thenResolve({
        postData: ''
      });
      when(connectionMock.subscribe(anyFunction())).thenCall(async cb => {
        await cb(requestWillBeSentEvent);
        await cb({
          method: 'Network.signedExchangeReceived',
          params: {
            requestId: '1',
            info: {
              outerResponse: response
            }
          }
        });
        await cb(loadingFinishedEvent);
      });
      // act
      await sut.subscribe(callback);
      // assert
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: '1',
          resourceType: 'SignedExchange',
          statusCode: 200,
          statusText: 'OK'
        })
      );
    });

    it('should update a request headers which has been transferred via SXG', async () => {
      // arrange
      when(
        networkMock.getRequestPostData(deepEqual({ requestId: '1' }))
      ).thenResolve({
        postData: ''
      });
      when(connectionMock.subscribe(anyFunction())).thenCall(async cb => {
        await cb(requestWillBeSentEvent);
        await cb({
          method: 'Network.signedExchangeReceived',
          params: {
            requestId: '1',
            info: {
              outerResponse: {
                ...response,
                requestHeaders: { foo: 'bar' }
              }
            }
          }
        });
        await cb(loadingFinishedEvent);
      });
      // act
      await sut.subscribe(callback);
      // assert
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: '1',
          requestHeaders: expect.arrayContaining([
            {
              name: 'foo',
              value: 'bar'
            }
          ])
        })
      );
    });

    it('should change a resource priority', async () => {
      // arrange
      when(
        networkMock.getRequestPostData(deepEqual({ requestId: '1' }))
      ).thenResolve({
        postData: ''
      });
      when(connectionMock.subscribe(anyFunction())).thenCall(async cb => {
        await cb(requestWillBeSentEvent);
        await cb({
          method: 'Network.resourceChangedPriority',
          params: {
            requestId: '1',
            newPriority: 'VeryLow'
          }
        });
        await cb(responseReceivedEvent);
        await cb(loadingFinishedEvent);
      });
      // act
      await sut.subscribe(callback);
      // assert
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: 'VeryLow'
        })
      );
    });

    it('should increase the resource size while receiving new data chunk', async () => {
      // arrange
      when(
        networkMock.getRequestPostData(deepEqual({ requestId: '1' }))
      ).thenResolve({
        postData: ''
      });
      when(connectionMock.subscribe(anyFunction())).thenCall(async cb => {
        await cb(requestWillBeSentEvent);
        await cb(dataReceivedEvent);
        await cb(responseReceivedEvent);
        await cb(loadingFinishedEvent);
      });
      // act
      await sut.subscribe(callback);
      // assert
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          resourceSize: 1
        })
      );
    });

    it('should handle a loading failure', async () => {
      // arrange
      when(
        networkMock.getRequestPostData(deepEqual({ requestId: '1' }))
      ).thenResolve({
        postData: ''
      });
      when(connectionMock.subscribe(anyFunction())).thenCall(async cb => {
        await cb(requestWillBeSentEvent);
        await cb(loadingFailedEvent);
      });
      // act
      await sut.subscribe(callback);
      // assert
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: '1'
        })
      );
      verify(
        loggerMock.debug(
          `Failed request: 1. Reason: ${loadingFailedEvent.params.errorText}`
        )
      ).once();
    });

    it('should load a response body', async () => {
      // arrange
      when(optionsSpy.content).thenReturn(true);
      when(
        networkMock.getRequestPostData(deepEqual({ requestId: '1' }))
      ).thenResolve({
        postData: ''
      });
      when(
        networkMock.getResponseBody(deepEqual({ requestId: '1' }))
      ).thenResolve({ body: '<html></html>', base64Encoded: false });
      when(connectionMock.subscribe(anyFunction())).thenCall(async cb => {
        await cb(requestWillBeSentEvent);
        await cb(responseReceivedEvent);
        await cb(loadingFinishedEvent);
      });
      // act
      await sut.subscribe(callback);
      // assert
      verify(networkMock.getResponseBody(deepEqual({ requestId: '1' }))).once();
    });

    it('should not load a response body if content capturing is disabled', async () => {
      // arrange
      when(optionsSpy.content).thenReturn(true);
      when(
        networkMock.getRequestPostData(deepEqual({ requestId: '1' }))
      ).thenResolve({
        postData: ''
      });
      when(
        networkMock.getResponseBody(deepEqual({ requestId: '1' }))
      ).thenResolve({ body: '<html></html>', base64Encoded: false });
      when(connectionMock.subscribe(anyFunction())).thenCall(async cb => {
        await cb(requestWillBeSentEvent);
        await cb(responseReceivedEvent);
        await cb(loadingFinishedEvent);
      });
      // act
      await sut.subscribe(callback);
      // assert
      verify(networkMock.getResponseBody(deepEqual({ requestId: '1' }))).once();
    });

    it('should handle an error while loading a request body', async () => {
      // arrange
      when(
        networkMock.getRequestPostData(deepEqual({ requestId: '1' }))
      ).thenReject(new Error('something went wrong'));
      when(connectionMock.subscribe(anyFunction())).thenCall(async cb => {
        await cb(requestWillBeSentEvent);
        await cb(responseReceivedEvent);
        await cb(loadingFinishedEvent);
      });
      // act
      await sut.subscribe(callback);
      // assert
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: '1'
        })
      );
    });

    it('should exclude a request if host does not corresponds allowed', async () => {
      // arrange
      when(optionsSpy.includeHosts).thenReturn(['google.com']);
      when(
        networkMock.getRequestPostData(deepEqual({ requestId: '1' }))
      ).thenResolve({
        postData: ''
      });
      when(connectionMock.subscribe(anyFunction())).thenCall(async cb => {
        await cb(requestWillBeSentEvent);
        await cb(responseReceivedEvent);
        await cb(loadingFinishedEvent);
      });
      // act
      await sut.subscribe(callback);
      // assert
      expect(callback).not.toHaveBeenCalled();
    });

    it('should exclude a request if path is in exclusions', async () => {
      // arrange
      when(optionsSpy.excludePaths).thenReturn(['^/login']);
      when(
        networkMock.getRequestPostData(deepEqual({ requestId: '1' }))
      ).thenResolve({
        postData: ''
      });
      const url = 'http://localhost:8080/login';
      when(connectionMock.subscribe(anyFunction())).thenCall(async cb => {
        await cb({
          ...requestWillBeSentEvent,
          params: {
            ...requestWillBeSentEvent.params,
            documentURL: url,
            request: {
              ...requestWillBeSentEvent.params.request,
              url
            }
          }
        });
        await cb({
          ...responseReceivedEvent,
          params: {
            ...responseReceivedEvent.params,
            response: {
              ...responseReceivedEvent.params.response,
              url
            }
          }
        });
        await cb(loadingFinishedEvent);
      });
      // act
      await sut.subscribe(callback);
      // assert
      expect(callback).not.toHaveBeenCalled();
    });

    // ADHOC: there is a bug in ExtraInfoBuilder preventing us to handle this case
    it('should handle a request extra info coming before browser events', async () => {
      // arrange
      when(
        networkMock.getRequestPostData(deepEqual({ requestId: '1' }))
      ).thenResolve({
        postData: ''
      });
      when(connectionMock.subscribe(anyFunction())).thenCall(async cb => {
        await cb(requestWillBeSentExtraInfoEvent);
        await cb({
          ...requestWillBeSentEvent,
          params: {
            ...requestWillBeSentEvent.params,
            redirectHasExtraInfo: true
          }
        });
        await cb(responseReceivedEvent);
        await cb(loadingFinishedEvent);
      });
      // act
      await sut.subscribe(callback);
      // assert
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          requestCookies: expect.arrayContaining([
            expect.objectContaining({
              name: 'foo',
              value: 'bar'
            })
          ]),
          requestId: '1'
        })
      );
    });

    it('should handle a response extra info coming before browser events', async () => {
      // arrange
      when(
        networkMock.getRequestPostData(deepEqual({ requestId: '1' }))
      ).thenResolve({
        postData: ''
      });
      when(connectionMock.subscribe(anyFunction())).thenCall(async cb => {
        await cb(requestWillBeSentEvent);
        await cb(responseReceivedExtraInfoEvent);
        await cb({
          ...responseReceivedEvent,
          params: {
            ...responseReceivedEvent,
            hasExtraInfo: true
          }
        });
        await cb(loadingFinishedEvent);
      });
      // act
      await sut.subscribe(callback);
      // assert
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          responseHeaders: expect.arrayContaining([
            {
              name: 'Transfer-Encoding',
              value: 'chunked'
            }
          ]),
          requestId: '1'
        })
      );
    });

    it('should handle a redirected response', async () => {
      // arrange
      when(
        networkMock.getRequestPostData(deepEqual({ requestId: '1' }))
      ).thenResolve({
        postData: ''
      });
      when(connectionMock.subscribe(anyFunction())).thenCall(async cb => {
        await cb(requestWillBeSentEvent);
        await cb({
          ...requestWillBeSentEvent,
          params: {
            ...requestWillBeSentEvent.params,
            redirectResponse: {
              timings,
              url: 'http://localhost:8081/',
              status: 302,
              statusText: 'Found',
              headers: {
                Location: 'http://localhost:8080'
              },
              mimeType: '',
              connectionReused: false,
              connectionId: 1,
              remoteIPAddress: '[::1]',
              remotePort: 8081,
              encodedDataLength: 167,
              responseTime: 1,
              protocol: 'http/1.1'
            }
          }
        });
        await cb(responseReceivedEvent);
        await cb(loadingFinishedEvent);
      });
      // act
      await sut.subscribe(callback);
      // assert
      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          responseHeaders: [
            {
              name: 'Location',
              value: 'http://localhost:8080'
            }
          ],
          statusCode: 302,
          statusText: 'Found',
          requestId: '1:redirected.0'
        })
      );
    });
  });

  describe('unsubscribe', () => {
    it('should disable the network and security domains', async () => {
      // act
      await sut.unsubscribe();
      // assert
      verify(networkMock.disable()).once();
      verify(securityMock.disable()).once();
    });
  });
});
