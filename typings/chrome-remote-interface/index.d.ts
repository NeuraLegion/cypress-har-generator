declare module 'chrome-remote-interface' {
  import Protocol from 'devtools-protocol';
  import { EventEmitter } from 'events';

  declare namespace chromeRemoteInterfaceFactory {
    export interface Network {
      /**
       * Tells whether clearing browser cache is supported.
       */
      canClearBrowserCache(): Promise<
        Protocol.Network.CanClearBrowserCacheResponse
      >;

      /**
       * Tells whether clearing browser cookies is supported.
       */
      canClearBrowserCookies(): Promise<
        Protocol.Network.CanClearBrowserCookiesResponse
      >;

      /**
       * Tells whether emulation of network conditions is supported.
       */
      canEmulateNetworkConditions(): Promise<
        Protocol.Network.CanEmulateNetworkConditionsResponse
      >;

      /**
       * Clears browser cache.
       */
      clearBrowserCache(): Promise<void>;

      /**
       * Clears browser cookies.
       */
      clearBrowserCookies(): Promise<void>;

      /**
       * Response to Network.requestIntercepted which either modifies the request to continue with any
       * modifications, or blocks it, or completes it with the provided response bytes. If a network
       * fetch occurs as a result which encounters a redirect an additional Network.requestIntercepted
       * event will be sent with the same InterceptionId.
       * Deprecated, use Fetch.continueRequest, Fetch.fulfillRequest and Fetch.failRequest instead.
       */
      continueInterceptedRequest(
        params: Protocol.Network.ContinueInterceptedRequestRequest
      ): Promise<void>;

      /**
       * Deletes browser cookies with matching name and url or domain/path pair.
       */
      deleteCookies(
        params: Protocol.Network.DeleteCookiesRequest
      ): Promise<void>;

      /**
       * Disables network tracking, prevents network events from being sent to the client.
       */
      disable(): Promise<void>;

      /**
       * Activates emulation of network conditions.
       */
      emulateNetworkConditions(
        params: Protocol.Network.EmulateNetworkConditionsRequest
      ): Promise<void>;

      /**
       * Enables network tracking, network events will now be delivered to the client.
       */
      enable(params?: Protocol.Network.EnableRequest): Promise<void>;

      /**
       * Returns all browser cookies. Depending on the backend support, will return detailed cookie
       * information in the `cookies` field.
       */
      getAllCookies(): Promise<Protocol.Network.GetAllCookiesResponse>;

      /**
       * Returns the DER-encoded certificate.
       */
      getCertificate(
        params: Protocol.Network.GetCertificateRequest
      ): Promise<Protocol.Network.GetCertificateResponse>;

      /**
       * Returns all browser cookies for the current URL. Depending on the backend support, will return
       * detailed cookie information in the `cookies` field.
       */
      getCookies(
        params: Protocol.Network.GetCookiesRequest
      ): Promise<Protocol.Network.GetCookiesResponse>;

      /**
       * Returns content served for the given request.
       */
      getResponseBody(
        params: Protocol.Network.GetResponseBodyRequest
      ): Promise<Protocol.Network.GetResponseBodyResponse>;

      /**
       * Returns post data sent with the request. Returns an error when no data was sent with the request.
       */
      getRequestPostData(
        params: Protocol.Network.GetRequestPostDataRequest
      ): Promise<Protocol.Network.GetRequestPostDataResponse>;

      /**
       * Returns content served for the given currently intercepted request.
       */
      getResponseBodyForInterception(
        params: Protocol.Network.GetResponseBodyForInterceptionRequest
      ): Promise<Protocol.Network.GetResponseBodyForInterceptionResponse>;

      /**
       * Returns a handle to the stream representing the response body. Note that after this command,
       * the intercepted request can't be continued as is -- you either need to cancel it or to provide
       * the response body. The stream only supports sequential read, IO.read will fail if the position
       * is specified.
       */
      takeResponseBodyForInterceptionAsStream(
        params: Protocol.Network.TakeResponseBodyForInterceptionAsStreamRequest
      ): Promise<
        Protocol.Network.TakeResponseBodyForInterceptionAsStreamResponse
      >;

      /**
       * This method sends a new XMLHttpRequest which is identical to the original one. The following
       * parameters should be identical: method, url, async, request body, extra headers, withCredentials
       * attribute, user, password.
       */
      replayXHR(params: Protocol.Network.ReplayXHRRequest): Promise<void>;

      /**
       * Searches for given string in response content.
       */
      searchInResponseBody(
        params: Protocol.Network.SearchInResponseBodyRequest
      ): Promise<Protocol.Network.SearchInResponseBodyResponse>;

      /**
       * Blocks URLs from loading.
       */
      setBlockedURLs(
        params: Protocol.Network.SetBlockedURLsRequest
      ): Promise<void>;

      /**
       * Toggles ignoring of service worker for each request.
       */
      setBypassServiceWorker(
        params: Protocol.Network.SetBypassServiceWorkerRequest
      ): Promise<void>;

      /**
       * Toggles ignoring cache for each request. If `true`, cache will not be used.
       */
      setCacheDisabled(
        params: Protocol.Network.SetCacheDisabledRequest
      ): Promise<void>;

      /**
       * Sets a cookie with the given cookie data; may overwrite equivalent cookies if they exist.
       */
      setCookie(
        params: Protocol.Network.SetCookieRequest
      ): Promise<Protocol.Network.SetCookieResponse>;

      /**
       * Sets given cookies.
       */
      setCookies(params: Protocol.Network.SetCookiesRequest): Promise<void>;

      /**
       * For testing.
       */
      setDataSizeLimitsForTest(
        params: Protocol.Network.SetDataSizeLimitsForTestRequest
      ): Promise<void>;

      /**
       * Specifies whether to always send extra HTTP headers with the requests from this page.
       */
      setExtraHTTPHeaders(
        params: Protocol.Network.SetExtraHTTPHeadersRequest
      ): Promise<void>;

      /**
       * Sets the requests to intercept that match the provided patterns and optionally resource types.
       * Deprecated, please use Fetch.enable instead.
       */
      setRequestInterception(
        params: Protocol.Network.SetRequestInterceptionRequest
      ): Promise<void>;

      /**
       * Allows overriding user agent with the given string.
       */
      setUserAgentOverride(
        params: Protocol.Network.SetUserAgentOverrideRequest
      ): Promise<void>;

      /**
       * Fired when data chunk was received over the network.
       */
      dataReceived(
        listener: (params: Protocol.Network.DataReceivedEvent) => void
      ): void;

      /**
       * Fired when EventSource message is received.
       */
      eventSourceMessageReceived(
        listener: (
          params: Protocol.Network.EventSourceMessageReceivedEvent
        ) => void
      ): void;

      /**
       * Fired when HTTP request has failed to load.
       */
      loadingFailed(
        listener: (params: Protocol.Network.LoadingFailedEvent) => void
      ): void;

      /**
       * Fired when HTTP request has finished loading.
       */
      loadingFinished(
        listener: (params: Protocol.Network.LoadingFinishedEvent) => void
      ): void;

      /**
       * Details of an intercepted HTTP request, which must be either allowed, blocked, modified or
       * mocked.
       * Deprecated, use Fetch.requestPaused instead.
       */
      requestIntercepted(
        listener: (params: Protocol.Network.RequestInterceptedEvent) => void
      ): void;

      /**
       * Fired if request ended up loading from cache.
       */
      requestServedFromCache(
        listener: (params: Protocol.Network.RequestServedFromCacheEvent) => void
      ): void;

      /**
       * Fired when page is about to send HTTP request.
       */
      requestWillBeSent(
        listener: (params: Protocol.Network.RequestWillBeSentEvent) => void
      ): void;

      /**
       * Fired when resource loading priority is changed
       */
      resourceChangedPriority(
        listener: (
          params: Protocol.Network.ResourceChangedPriorityEvent
        ) => void
      ): void;

      /**
       * Fired when a signed exchange was received over the network
       */
      signedExchangeReceived(
        listener: (params: Protocol.Network.SignedExchangeReceivedEvent) => void
      ): void;

      /**
       * Fired when HTTP response is available.
       */
      responseReceived(
        listener: (params: Protocol.Network.ResponseReceivedEvent) => void
      ): void;

      /**
       * Fired when WebSocket is closed.
       */
      webSocketClosed(
        listener: (params: Protocol.Network.WebSocketClosedEvent) => void
      ): void;

      /**
       * Fired upon WebSocket creation.
       */
      webSocketCreated(
        listener: (params: Protocol.Network.WebSocketCreatedEvent) => void
      ): void;

      /**
       * Fired when WebSocket message error occurs.
       */
      webSocketFrameError(
        listener: (params: Protocol.Network.WebSocketFrameErrorEvent) => void
      ): void;

      /**
       * Fired when WebSocket message is received.
       */
      webSocketFrameReceived(
        listener: (params: Protocol.Network.WebSocketFrameReceivedEvent) => void
      ): void;

      /**
       * Fired when WebSocket message is sent.
       */
      webSocketFrameSent(
        listener: (params: Protocol.Network.WebSocketFrameSentEvent) => void
      ): void;

      /**
       * Fired when WebSocket handshake response becomes available.
       */
      webSocketHandshakeResponseReceived(
        listener: (
          params: Protocol.Network.WebSocketHandshakeResponseReceivedEvent
        ) => void
      ): void;

      /**
       * Fired when WebSocket is about to initiate handshake.
       */
      webSocketWillSendHandshakeRequest(
        listener: (
          params: Protocol.Network.WebSocketWillSendHandshakeRequestEvent
        ) => void
      ): void;

      /**
       * Fired when additional information about a requestWillBeSent event is available from the
       * network stack. Not every requestWillBeSent event will have an additional
       * requestWillBeSentExtraInfo fired for it, and there is no guarantee whether requestWillBeSent
       * or requestWillBeSentExtraInfo will be fired first for the same request.
       */
      requestWillBeSentExtraInfo(
        listener: (
          params: Protocol.Network.RequestWillBeSentExtraInfoEvent
        ) => void
      ): void;

      /**
       * Fired when additional information about a responseReceived event is available from the network
       * stack. Not every responseReceived event will have an additional responseReceivedExtraInfo for
       * it, and responseReceivedExtraInfo may be fired before or after responseReceived.
       */
      responseReceivedExtraInfo(
        listener: (
          params: Protocol.Network.ResponseReceivedExtraInfoEvent
        ) => void
      ): void;
    }

    export interface Security {
      /**
       * Disables tracking security state changes.
       */
      disable(): Promise<void>;

      /**
       * Enables tracking security state changes.
       */
      enable(): Promise<void>;

      /**
       * Enable/disable whether all certificate errors should be ignored.
       */
      setIgnoreCertificateErrors(
        params: Protocol.Security.SetIgnoreCertificateErrorsRequest
      ): Promise<void>;

      /**
       * Handles a certificate error that fired a certificateError event.
       */
      handleCertificateError(
        params: Protocol.Security.HandleCertificateErrorRequest
      ): Promise<void>;

      /**
       * Enable/disable overriding certificate errors. If enabled, all certificate error events need to
       * be handled by the DevTools client and should be answered with `handleCertificateError` commands.
       */
      setOverrideCertificateErrors(
        params: Protocol.Security.SetOverrideCertificateErrorsRequest
      ): Promise<void>;

      /**
       * There is a certificate error. If overriding certificate errors is enabled, then it should be
       * handled with the `handleCertificateError` command. Note: this event does not fire if the
       * certificate error has been allowed internally. Only one client per target should override
       * certificate errors at the same time.
       */
      certificateError(
        listener: (params: Protocol.Security.CertificateErrorEvent) => void
      ): void;

      /**
       * The security state of the page changed.
       */
      visibleSecurityStateChanged(
        listener: (
          params: Protocol.Security.VisibleSecurityStateChangedEvent
        ) => void
      ): void;

      /**
       * The security state of the page changed.
       */
      securityStateChanged(
        listener: (params: Protocol.Security.SecurityStateChangedEvent) => void
      ): void;
    }

    export interface ChromeRemoteInterface extends EventEmitter {
      readonly Network: Network;
      readonly Security: Security;
    }

    export interface ChromeRemoteInterfaceOptions {
      host?: string;
      port?: number;
      secure?: boolean;
      useHostName?: boolean;
      alterPath?: string;
      protocol?: string;
      local?: boolean;
      target?: string;
    }

    function Version(
      options: ChromeRemoteInterfaceOptions,
      callback: (
        err: Error | undefined,
        version?: { webSocketDebuggerUrl: string }
      ) => void
    ): {};

    function Version(
      options: ChromeRemoteInterfaceOptions
    ): Promise<{ webSocketDebuggerUrl: string }>;
  }

  declare function chromeRemoteInterfaceFactory(
    options: chromeRemoteInterfaceFactory.ChromeRemoteInterfaceOptions,
    callback: (
      err: Error | undefined,
      chrome?: chromeRemoteInterfaceFactory.ChromeRemoteInterface
    ) => void
  ): void;

  declare function chromeRemoteInterfaceFactory(
    options: chromeRemoteInterfaceFactory.ChromeRemoteInterfaceOptions
  ): Promise<chromeRemoteInterfaceFactory.ChromeRemoteInterface>;

  export = chromeRemoteInterfaceFactory;
}
