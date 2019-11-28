declare module 'chrome-remote-interface' {
  import Protocol from 'devtools-protocol';

  declare namespace ChromeRemoteInterface {
    export interface Page {
      /**
       * Deprecated, please use addScriptToEvaluateOnNewDocument instead.
       */
      addScriptToEvaluateOnLoad(
        params: Protocol.Page.AddScriptToEvaluateOnLoadRequest
      ): Promise<Protocol.Page.AddScriptToEvaluateOnLoadResponse>;

      /**
       * Evaluates given script in every frame upon creation (before loading frame's scripts).
       */
      addScriptToEvaluateOnNewDocument(
        params: Protocol.Page.AddScriptToEvaluateOnNewDocumentRequest
      ): Promise<Protocol.Page.AddScriptToEvaluateOnNewDocumentResponse>;

      /**
       * Brings page to front (activates tab).
       */
      bringToFront(): Promise<void>;

      /**
       * Capture page screenshot.
       */
      captureScreenshot(
        params: Protocol.Page.CaptureScreenshotRequest
      ): Promise<Protocol.Page.CaptureScreenshotResponse>;

      /**
       * Returns a snapshot of the page as a string. For MHTML format, the serialization includes
       * iframes, shadow DOM, external resources, and element-inline styles.
       */
      captureSnapshot(
        params: Protocol.Page.CaptureSnapshotRequest
      ): Promise<Protocol.Page.CaptureSnapshotResponse>;

      /**
       * Clears the overriden device metrics.
       */
      clearDeviceMetricsOverride(): Promise<void>;

      /**
       * Clears the overridden Device Orientation.
       */
      clearDeviceOrientationOverride(): Promise<void>;

      /**
       * Clears the overriden Geolocation Position and Error.
       */
      clearGeolocationOverride(): Promise<void>;

      /**
       * Creates an isolated world for the given frame.
       */
      createIsolatedWorld(
        params: Protocol.Page.CreateIsolatedWorldRequest
      ): Promise<Protocol.Page.CreateIsolatedWorldResponse>;

      /**
       * Deletes browser cookie with given name, domain and path.
       */
      deleteCookie(params: Protocol.Page.DeleteCookieRequest): Promise<void>;

      /**
       * Disables page domain notifications.
       */
      disable(): Promise<void>;

      /**
       * Enables page domain notifications.
       */
      enable(): Promise<void>;

      getAppManifest(): Promise<Protocol.Page.GetAppManifestResponse>;

      getInstallabilityErrors(): Promise<
        Protocol.Page.GetInstallabilityErrorsResponse
      >;

      /**
       * Returns all browser cookies. Depending on the backend support, will return detailed cookie
       * information in the `cookies` field.
       */
      getCookies(): Promise<Protocol.Page.GetCookiesResponse>;

      /**
       * Returns present frame tree structure.
       */
      getFrameTree(): Promise<Protocol.Page.GetFrameTreeResponse>;

      /**
       * Returns metrics relating to the layouting of the page, such as viewport bounds/scale.
       */
      getLayoutMetrics(): Promise<Protocol.Page.GetLayoutMetricsResponse>;

      /**
       * Returns navigation history for the current page.
       */
      getNavigationHistory(): Promise<
        Protocol.Page.GetNavigationHistoryResponse
      >;

      /**
       * Resets navigation history for the current page.
       */
      resetNavigationHistory(): Promise<void>;

      /**
       * Returns content of the given resource.
       */
      getResourceContent(
        params: Protocol.Page.GetResourceContentRequest
      ): Promise<Protocol.Page.GetResourceContentResponse>;

      /**
       * Returns present frame / resource tree structure.
       */
      getResourceTree(): Promise<Protocol.Page.GetResourceTreeResponse>;

      /**
       * Accepts or dismisses a JavaScript initiated dialog (alert, confirm, prompt, or onbeforeunload).
       */
      handleJavaScriptDialog(
        params: Protocol.Page.HandleJavaScriptDialogRequest
      ): Promise<void>;

      /**
       * Navigates current page to the given URL.
       */
      navigate(
        params: Protocol.Page.NavigateRequest
      ): Promise<Protocol.Page.NavigateResponse>;

      /**
       * Navigates current page to the given history entry.
       */
      navigateToHistoryEntry(
        params: Protocol.Page.NavigateToHistoryEntryRequest
      ): Promise<void>;

      /**
       * Print page as PDF.
       */
      printToPDF(
        params: Protocol.Page.PrintToPDFRequest
      ): Promise<Protocol.Page.PrintToPDFResponse>;

      /**
       * Reloads given page optionally ignoring the cache.
       */
      reload(params: Protocol.Page.ReloadRequest): Promise<void>;

      /**
       * Deprecated, please use removeScriptToEvaluateOnNewDocument instead.
       */
      removeScriptToEvaluateOnLoad(
        params: Protocol.Page.RemoveScriptToEvaluateOnLoadRequest
      ): Promise<void>;

      /**
       * Removes given script from the list.
       */
      removeScriptToEvaluateOnNewDocument(
        params: Protocol.Page.RemoveScriptToEvaluateOnNewDocumentRequest
      ): Promise<void>;

      /**
       * Acknowledges that a screencast frame has been received by the frontend.
       */
      screencastFrameAck(
        params: Protocol.Page.ScreencastFrameAckRequest
      ): Promise<void>;

      /**
       * Searches for given string in resource content.
       */
      searchInResource(
        params: Protocol.Page.SearchInResourceRequest
      ): Promise<Protocol.Page.SearchInResourceResponse>;

      /**
       * Enable Chrome's experimental ad filter on all sites.
       */
      setAdBlockingEnabled(
        params: Protocol.Page.SetAdBlockingEnabledRequest
      ): Promise<void>;

      /**
       * Enable page Content Security Policy by-passing.
       */
      setBypassCSP(params: Protocol.Page.SetBypassCSPRequest): Promise<void>;

      /**
       * Overrides the values of device screen dimensions (window.screen.width, window.screen.height,
       * window.innerWidth, window.innerHeight, and "device-width"/"device-height"-related CSS media
       * query results).
       */
      setDeviceMetricsOverride(
        params: Protocol.Page.SetDeviceMetricsOverrideRequest
      ): Promise<void>;

      /**
       * Overrides the Device Orientation.
       */
      setDeviceOrientationOverride(
        params: Protocol.Page.SetDeviceOrientationOverrideRequest
      ): Promise<void>;

      /**
       * Set generic font families.
       */
      setFontFamilies(
        params: Protocol.Page.SetFontFamiliesRequest
      ): Promise<void>;

      /**
       * Set default font sizes.
       */
      setFontSizes(params: Protocol.Page.SetFontSizesRequest): Promise<void>;

      /**
       * Sets given markup as the document's HTML.
       */
      setDocumentContent(
        params: Protocol.Page.SetDocumentContentRequest
      ): Promise<void>;

      /**
       * Set the behavior when downloading a file.
       */
      setDownloadBehavior(
        params: Protocol.Page.SetDownloadBehaviorRequest
      ): Promise<void>;

      /**
       * Overrides the Geolocation Position or Error. Omitting any of the parameters emulates position
       * unavailable.
       */
      setGeolocationOverride(
        params: Protocol.Page.SetGeolocationOverrideRequest
      ): Promise<void>;

      /**
       * Controls whether page will emit lifecycle events.
       */
      setLifecycleEventsEnabled(
        params: Protocol.Page.SetLifecycleEventsEnabledRequest
      ): Promise<void>;

      /**
       * Toggles mouse event-based touch event emulation.
       */
      setTouchEmulationEnabled(
        params: Protocol.Page.SetTouchEmulationEnabledRequest
      ): Promise<void>;

      /**
       * Starts sending each frame using the `screencastFrame` event.
       */
      startScreencast(
        params: Protocol.Page.StartScreencastRequest
      ): Promise<void>;

      /**
       * Force the page stop all navigations and pending resource fetches.
       */
      stopLoading(): Promise<void>;

      /**
       * Crashes renderer on the IO thread, generates minidumps.
       */
      crash(): Promise<void>;

      /**
       * Tries to close page, running its beforeunload hooks, if any.
       */
      close(): Promise<void>;

      /**
       * Tries to update the web lifecycle state of the page.
       * It will transition the page to the given state according to:
       * https://github.com/WICG/web-lifecycle/
       */
      setWebLifecycleState(
        params: Protocol.Page.SetWebLifecycleStateRequest
      ): Promise<void>;

      /**
       * Stops sending each frame in the `screencastFrame`.
       */
      stopScreencast(): Promise<void>;

      /**
       * Forces compilation cache to be generated for every subresource script.
       */
      setProduceCompilationCache(
        params: Protocol.Page.SetProduceCompilationCacheRequest
      ): Promise<void>;

      /**
       * Seeds compilation cache for given url. Compilation cache does not survive
       * cross-process navigation.
       */
      addCompilationCache(
        params: Protocol.Page.AddCompilationCacheRequest
      ): Promise<void>;

      /**
       * Clears seeded compilation cache.
       */
      clearCompilationCache(): Promise<void>;

      /**
       * Generates a report for testing.
       */
      generateTestReport(
        params: Protocol.Page.GenerateTestReportRequest
      ): Promise<void>;

      /**
       * Pauses page execution. Can be resumed using generic Runtime.runIfWaitingForDebugger.
       */
      waitForDebugger(): Promise<void>;

      /**
       * Intercept file chooser requests and transfer control to protocol clients.
       * When file chooser interception is enabled, native file chooser dialog is not shown.
       * Instead, a protocol event `Page.fileChooserOpened` is emitted.
       */
      setInterceptFileChooserDialog(
        params: Protocol.Page.SetInterceptFileChooserDialogRequest
      ): Promise<void>;

      domContentEventFired(
        listener: (params: Protocol.Page.DomContentEventFiredEvent) => void
      ): void;

      /**
       * Emitted only when `page.interceptFileChooser` is enabled.
       */
      fileChooserOpened(
        listener: (params: Protocol.Page.FileChooserOpenedEvent) => void
      ): void;

      /**
       * Fired when frame has been attached to its parent.
       */
      frameAttached(
        listener: (params: Protocol.Page.FrameAttachedEvent) => void
      ): void;

      /**
       * Fired when frame no longer has a scheduled navigation.
       */
      frameClearedScheduledNavigation(
        listener: (
          params: Protocol.Page.FrameClearedScheduledNavigationEvent
        ) => void
      ): void;

      /**
       * Fired when frame has been detached from its parent.
       */
      frameDetached(
        listener: (params: Protocol.Page.FrameDetachedEvent) => void
      ): void;

      /**
       * Fired once navigation of the frame has completed. Frame is now associated with the new loader.
       */
      frameNavigated(
        listener: (params: Protocol.Page.FrameNavigatedEvent) => void
      ): void;

      frameResized(listener: () => void): void;

      /**
       * Fired when a renderer-initiated navigation is requested.
       * Navigation may still be cancelled after the event is issued.
       */
      frameRequestedNavigation(
        listener: (params: Protocol.Page.FrameRequestedNavigationEvent) => void
      ): void;

      /**
       * Fired when frame schedules a potential navigation.
       */
      frameScheduledNavigation(
        listener: (params: Protocol.Page.FrameScheduledNavigationEvent) => void
      ): void;

      /**
       * Fired when frame has started loading.
       */
      frameStartedLoading(
        listener: (params: Protocol.Page.FrameStartedLoadingEvent) => void
      ): void;

      /**
       * Fired when frame has stopped loading.
       */
      frameStoppedLoading(
        listener: (params: Protocol.Page.FrameStoppedLoadingEvent) => void
      ): void;

      /**
       * Fired when page is about to start a download.
       */
      downloadWillBegin(
        listener: (params: Protocol.Page.DownloadWillBeginEvent) => void
      ): void;

      /**
       * Fired when interstitial page was hidden
       */
      interstitialHidden(listener: () => void): void;

      /**
       * Fired when interstitial page was shown
       */
      interstitialShown(listener: () => void): void;

      /**
       * Fired when a JavaScript initiated dialog (alert, confirm, prompt, or onbeforeunload) has been
       * closed.
       */
      javascriptDialogClosed(
        listener: (params: Protocol.Page.JavascriptDialogClosedEvent) => void
      ): void;

      /**
       * Fired when a JavaScript initiated dialog (alert, confirm, prompt, or onbeforeunload) is about to
       * open.
       */
      javascriptDialogOpening(
        listener: (params: Protocol.Page.JavascriptDialogOpeningEvent) => void
      ): void;

      /**
       * Fired for top level page lifecycle events such as navigation, load, paint, etc.
       */
      lifecycleEvent(
        listener: (params: Protocol.Page.LifecycleEventEvent) => void
      ): void;

      loadEventFired(
        listener: (params: Protocol.Page.LoadEventFiredEvent) => void
      ): void;

      /**
       * Fired when same-document navigation happens, e.g. due to history API usage or anchor navigation.
       */
      navigatedWithinDocument(
        listener: (params: Protocol.Page.NavigatedWithinDocumentEvent) => void
      ): void;

      /**
       * Compressed image data requested by the `startScreencast`.
       */
      screencastFrame(
        listener: (params: Protocol.Page.ScreencastFrameEvent) => void
      ): void;

      /**
       * Fired when the page with currently enabled screencast was shown or hidden `.
       */
      screencastVisibilityChanged(
        listener: (
          params: Protocol.Page.ScreencastVisibilityChangedEvent
        ) => void
      ): void;

      /**
       * Fired when a new window is going to be opened, via window.open(), link click, form submission,
       * etc.
       */
      windowOpen(
        listener: (params: Protocol.Page.WindowOpenEvent) => void
      ): void;

      /**
       * Issued for every compilation cache generated. Is only available
       * if Page.setGenerateCompilationCache is enabled.
       */
      compilationCacheProduced(
        listener: (params: Protocol.Page.CompilationCacheProducedEvent) => void
      ): void;
    }

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
      ): Promise<GetResponseBodyResponse>;

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
  }

  declare class ChromeRemoteInterface {
    readonly Page: ChromeRemoteInterface.Page;
    readonly Network: ChromeRemoteInterface.Network;
  }

  declare interface ChromeOptions {
    host?: string;
    port?: number;
    secure?: boolean;
    useHostName?: boolean;
    alterPath?: string;
    protocol?: string;
    local?: boolean;
    target?: string;
  }

  declare function chromeRemoteInterfaceFactory(
    options: ChromeOptions,
    callback: (err: Error | undefined, chrome?: ChromeRemoteInterface) => void
  ): void;

  declare function chromeRemoteInterfaceFactory(
    options: ChromeOptions
  ): Promise<ChromeRemoteInterface>;

  export = chromeRemoteInterfaceFactory;
}
