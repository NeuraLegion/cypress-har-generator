import { Logger } from '../utils';
import { NetworkRequest } from './NetworkRequest';
import { ChromeRemoteInterfaceEvent, CRIConnection } from '../cdp';
import { ExtraInfoBuilder } from './ExtraInfoBuilder';
import { RecordOptions } from '../Plugin';
import { Header } from 'har-format';
import { Network, Security } from 'chrome-remote-interface';
import Protocol from 'devtools-protocol';

export class NetworkObserver {
  private readonly _entries: Map<Protocol.Network.RequestId, NetworkRequest>;
  private readonly _extraInfoBuilders: Map<
    Protocol.Network.RequestId,
    ExtraInfoBuilder
  >;
  private readonly network: Network;
  private destination: (chromeEntry: NetworkRequest) => void;
  private readonly security: Security;

  constructor(
    private readonly options: RecordOptions,
    private readonly connection: CRIConnection,
    private readonly logger: Logger
  ) {
    this._entries = new Map<Protocol.Network.RequestId, NetworkRequest>();
    this._extraInfoBuilders = new Map<
      Protocol.Network.RequestId,
      ExtraInfoBuilder
    >();
    const { network: network, security: security } = this.connection;
    this.network = network;
    this.security = security;
  }

  public async subscribe(
    callback: (chromeEntry: NetworkRequest) => void
  ): Promise<void> {
    this.destination = (entry: NetworkRequest): void => callback(entry);

    await this.connection.subscribe((event: ChromeRemoteInterfaceEvent): void =>
      this.handleEvent(event)
    );

    this.security.certificateError(
      ({ eventId }): Promise<void> =>
        this.security.handleCertificateError({
          eventId,
          action: 'continue'
        })
    );

    await Promise.all([
      this.security.setOverrideCertificateErrors({ override: true }),
      this.network.setCacheDisabled({ cacheDisabled: true }),
      this.network.setBypassServiceWorker({ bypass: true })
    ]);
  }

  public signedExchangeReceived(
    params: Protocol.Network.SignedExchangeReceivedEvent
  ): void {
    const entry: NetworkRequest | undefined = this._entries.get(
      params.requestId
    );
    if (!entry) {
      return;
    }

    entry.signedExchangeInfo = params.info;
    entry.resourceType = 'SignedExchange';

    this.updateNetworkRequestWithResponse(entry, params.info.outerResponse);
  }

  public requestWillBeSent({
    type,
    loaderId,
    initiator,
    redirectResponse,
    documentURL,
    frameId,
    timestamp,
    requestId,
    request,
    wallTime
  }: Protocol.Network.RequestWillBeSentEvent): void {
    let entry: NetworkRequest | undefined = this._entries.get(requestId);

    if (entry) {
      if (!redirectResponse) {
        return;
      }

      if (!entry.signedExchangeInfo) {
        this.responseReceived({
          requestId,
          loaderId,
          timestamp,
          type: 'Other',
          response: redirectResponse,
          frameId
        });
      }
      entry = this._appendRedirect(requestId, timestamp, request.url);
    } else {
      entry = this.createRequest(
        requestId,
        frameId,
        loaderId,
        request.url,
        documentURL,
        initiator
      );
    }

    this.updateNetworkRequestWithRequest(entry, request);

    entry.setIssueTime(timestamp, wallTime);
    entry.resourceType = type ?? 'Other';

    this.getExtraInfoBuilder(requestId).addRequest(entry);

    this.startRequest(entry);
  }

  public dataReceived({
    requestId,
    dataLength,
    encodedDataLength,
    timestamp
  }: Protocol.Network.DataReceivedEvent): void {
    const entry: NetworkRequest | undefined = this._entries.get(requestId);
    if (!entry) {
      return;
    }
    entry.resourceSize += dataLength;
    if (encodedDataLength !== -1) {
      entry.increaseTransferSize(encodedDataLength);
    }
    entry.endTime = timestamp;
  }

  public responseReceived({
    requestId,
    response,
    timestamp,
    type
  }: Protocol.Network.ResponseReceivedEvent): void {
    const entry: NetworkRequest | undefined = this._entries.get(requestId);

    if (!entry) {
      return;
    }

    entry.responseReceivedTime = timestamp;
    entry.resourceType = type;

    this.updateNetworkRequestWithResponse(entry, response);
  }

  public resourceChangedPriority({
    requestId,
    newPriority
  }: Protocol.Network.ResourceChangedPriorityEvent): void {
    const entry: NetworkRequest | undefined = this._entries.get(requestId);

    if (!entry) {
      return;
    }

    entry.priority = newPriority;
  }

  public async loadingFinished({
    requestId,
    timestamp,
    encodedDataLength
  }: Protocol.Network.LoadingFinishedEvent): Promise<void> {
    const entry: NetworkRequest | undefined = this._entries.get(requestId);

    if (!entry) {
      return;
    }

    this.finishRequest(entry, timestamp, encodedDataLength);
  }

  public loadingFailed({
    requestId,
    errorText,
    canceled,
    type,
    timestamp
  }: Protocol.Network.LoadingFailedEvent): void {
    const entry: NetworkRequest | undefined = this._entries.get(requestId);
    if (!entry) {
      return;
    }

    entry.resourceType = type;

    this.finishRequest(entry, timestamp, -1);

    const message: string = errorText || (canceled && 'Canceled');
    this.logger.debug(`Failed request: ${requestId}. Reason: ${message}`);
  }

  public webSocketCreated({
    initiator,
    requestId,
    url
  }: Protocol.Network.WebSocketCreatedEvent): void {
    const entry: NetworkRequest = this.createRequest(
      requestId,
      '',
      '',
      url,
      '',
      initiator
    );
    this.startRequest(entry);
  }

  public webSocketWillSendHandshakeRequest({
    request,
    requestId,
    timestamp,
    wallTime
  }: Protocol.Network.WebSocketWillSendHandshakeRequestEvent): void {
    const entry: NetworkRequest | undefined = this._entries.get(requestId);
    if (!entry) {
      return;
    }
    entry.requestMethod = 'GET';
    entry.requestHeaders = this.headersMapToHeadersArray(request.headers);
    entry.setIssueTime(timestamp, wallTime);
  }

  public webSocketHandshakeResponseReceived({
    timestamp,
    response,
    requestId
  }: Protocol.Network.WebSocketHandshakeResponseReceivedEvent): void {
    const entry: NetworkRequest | undefined = this._entries.get(requestId);

    if (!entry) {
      return;
    }

    entry.statusCode = response.status;
    entry.statusText = response.statusText;
    entry.responseHeaders = this.headersMapToHeadersArray(response.headers);
    entry.responseHeadersText = response.headersText || '';

    if (response.requestHeaders) {
      entry.requestHeaders = this.headersMapToHeadersArray(
        response.requestHeaders
      );
    }

    if (response.requestHeadersText) {
      entry.requestHeadersText = response.requestHeadersText;
    }

    entry.responseReceivedTime = timestamp;
    entry.protocol = 'websocket';
  }

  public webSocketFrameSent({
    requestId,
    timestamp,
    response
  }: Protocol.Network.WebSocketFrameSentEvent): void {
    const entry: NetworkRequest | undefined = this._entries.get(requestId);

    if (!entry) {
      return;
    }

    entry.addProtocolFrame(response, timestamp, true);
    entry.responseReceivedTime = timestamp;
  }

  public webSocketFrameReceived({
    requestId,
    timestamp,
    response
  }: Protocol.Network.WebSocketFrameReceivedEvent): void {
    const entry: NetworkRequest | undefined = this._entries.get(requestId);

    if (!entry) {
      return;
    }

    entry.addProtocolFrame(response, timestamp, false);
    entry.responseReceivedTime = timestamp;
  }

  public webSocketFrameError({
    errorMessage,
    requestId,
    timestamp
  }: Protocol.Network.WebSocketFrameErrorEvent): void {
    const entry: NetworkRequest | undefined = this._entries.get(requestId);

    if (!entry) {
      return;
    }

    entry.addProtocolFrameError(errorMessage, timestamp);
    entry.responseReceivedTime = timestamp;
  }

  public webSocketClosed({
    requestId,
    timestamp
  }: Protocol.Network.WebSocketClosedEvent): void {
    const entry: NetworkRequest | undefined = this._entries.get(requestId);

    if (!entry) {
      return;
    }

    this.finishRequest(entry, timestamp, -1);
  }

  public requestWillBeSentExtraInfo({
    requestId,
    headers
  }: Protocol.Network.RequestWillBeSentExtraInfoEvent): void {
    this.getExtraInfoBuilder(requestId).addRequestExtraInfo({
      requestHeaders: this.headersMapToHeadersArray(headers)
    });
  }

  public responseReceivedExtraInfo({
    requestId,
    headers,
    headersText
  }: Protocol.Network.ResponseReceivedExtraInfoEvent): void {
    this.getExtraInfoBuilder(requestId).addResponseExtraInfo({
      responseHeaders: this.headersMapToHeadersArray(headers),
      responseHeadersText: headersText
    });
  }

  private getExtraInfoBuilder(
    requestId: Protocol.Network.RequestId
  ): ExtraInfoBuilder {
    if (!this._extraInfoBuilders.has(requestId)) {
      this._extraInfoBuilders.set(
        requestId,
        new ExtraInfoBuilder((): void => {
          this._extraInfoBuilders.delete(requestId);
        })
      );
    }

    return this._extraInfoBuilders.get(requestId);
  }

  private _appendRedirect(
    requestId: Protocol.Network.RequestId,
    time: Protocol.Network.MonotonicTime,
    redirectURL: string
  ): NetworkRequest {
    const originalNetworkRequest: NetworkRequest = this._entries.get(
      requestId
    ) as NetworkRequest;

    let redirectCount = 0;
    let redirect: NetworkRequest | undefined =
      originalNetworkRequest.redirectSource;

    while (redirect) {
      redirectCount++;
      redirect = redirect.redirectSource;
    }

    originalNetworkRequest.markAsRedirect(redirectCount);

    this.finishRequest(originalNetworkRequest, time, -1);

    const newNetworkRequest: NetworkRequest = this.createRequest(
      requestId,
      originalNetworkRequest.frameId,
      originalNetworkRequest.loaderId,
      redirectURL,
      originalNetworkRequest.documentURL,
      originalNetworkRequest.initiator
    );

    newNetworkRequest.redirectSource = originalNetworkRequest;

    return newNetworkRequest;
  }

  private finishRequest(
    networkRequest: NetworkRequest,
    finishTime: Protocol.Network.MonotonicTime,
    encodedDataLength: number
  ): void {
    networkRequest.endTime = finishTime;

    if (encodedDataLength >= 0) {
      const redirectSource: NetworkRequest | undefined =
        networkRequest.redirectSource;

      if (redirectSource?.signedExchangeInfo) {
        networkRequest.transferSize = 0;
        redirectSource.transferSize = encodedDataLength;
      } else {
        networkRequest.transferSize = encodedDataLength;
      }
    }

    if (this.options.content) {
      networkRequest.setContentData(
        this.network.getResponseBody({
          requestId: networkRequest.requestId
        })
      );
    }

    this._entries.delete(networkRequest.requestId);
    this.getExtraInfoBuilder(networkRequest.requestId).finished();

    if (!this.excludeRequest(networkRequest)) {
      this.destination(networkRequest);
    }
  }

  private startRequest(networkRequest: NetworkRequest): void {
    this._entries.set(networkRequest.requestId, networkRequest);
  }

  private updateNetworkRequestWithRequest(
    chromeRequest: NetworkRequest,
    request: Protocol.Network.Request
  ): void {
    chromeRequest.requestMethod = request.method;
    chromeRequest.requestHeaders = this.headersMapToHeadersArray(
      request.headers
    );
    chromeRequest.setRequestFormData(
      this.getRequestPostData(chromeRequest.requestId, request)
    );
    chromeRequest.initialPriority = request.initialPriority;
  }

  private getRequestPostData(
    requestId: Protocol.Network.RequestId,
    request: Protocol.Network.Request
  ): string | Promise<string | undefined> {
    return request.hasPostData && !!request.postData
      ? request.postData
      : this.network
          .getRequestPostData({ requestId })
          .then(
            ({
              postData
            }: Protocol.Network.GetRequestPostDataResponse): string => postData
          )
          .catch((): string => undefined);
  }

  private createRequest(
    requestId: Protocol.Network.RequestId,
    frameId: string | undefined,
    loaderId: Protocol.Network.LoaderId,
    url: string,
    documentURL: string,
    initiator?: Protocol.Network.Initiator
  ): NetworkRequest {
    return new NetworkRequest(
      requestId,
      url,
      documentURL,
      frameId,
      loaderId,
      initiator
    );
  }

  // eslint-disable-next-line complexity
  private updateNetworkRequestWithResponse(
    networkRequest: NetworkRequest,
    response: Protocol.Network.Response
  ): void {
    if (response.url && networkRequest.url !== response.url) {
      networkRequest.setUrl(response.url);
    }
    networkRequest.mimeType = response.mimeType;
    networkRequest.statusCode = response.status;
    networkRequest.statusText = response.statusText;

    if (!networkRequest.hasExtraResponseInfo) {
      networkRequest.responseHeaders = this.headersMapToHeadersArray(
        response.headers
      );
    }

    if (response.encodedDataLength >= 0) {
      networkRequest.transferSize = response.encodedDataLength;
    }

    if (response.requestHeaders && !networkRequest.hasExtraRequestInfo) {
      networkRequest.requestHeaders = this.headersMapToHeadersArray(
        response.requestHeaders
      );
      networkRequest.requestHeadersText = response.requestHeadersText ?? '';
    }

    networkRequest.connectionReused = response.connectionReused;
    networkRequest.connectionId = String(response.connectionId);

    if (response.remoteIPAddress) {
      networkRequest.setRemoteAddress(
        response.remoteIPAddress,
        response.remotePort || -1
      );
    }

    networkRequest.timing = response.timing;

    networkRequest.protocol = response.protocol ?? '';
  }

  private headersMapToHeadersArray(
    headersMap: Protocol.Network.Headers
  ): Header[] {
    return Object.keys(headersMap).reduce(
      (acc: Header[], name: string): Header[] => {
        const values: string[] = headersMap[name].split('\n');

        acc.push(...values.map((value: string): Header => ({ name, value })));

        return acc;
      },
      []
    );
  }

  private excludeRequest(request: NetworkRequest): boolean {
    const { path = '/' } = request.parsedURL;

    return !!this.options.excludePaths?.some((excludedPath: string): boolean =>
      new RegExp(excludedPath).test(path)
    );
  }

  private handleEvent({ method, params }: ChromeRemoteInterfaceEvent): void {
    const methodName: string = method.substring(method.indexOf('.') + 1);

    const handler: (...args: unknown[]) => unknown | undefined = this[
      methodName
    ];

    if (handler) {
      handler.call(this, params);
    }
  }
}
