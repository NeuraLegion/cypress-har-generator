import Protocol from 'devtools-protocol';
import ProtocolMapping from 'devtools-protocol/types/protocol-mapping';
import { ChromeRemoteInterface, Network } from 'chrome-remote-interface';
import { Logger } from '../utils';
import { Header } from 'har-format';
import { NetworkRequest } from './NetworkRequest';

export type ChromeRemoteInterfaceMethod = keyof ProtocolMapping.Events;

export type ChromeRemoteInterfaceEvent = {
  method: ChromeRemoteInterfaceMethod;
  params?: ProtocolMapping.Events[ChromeRemoteInterfaceMethod][0];
};

export class NetworkObserver {
  private readonly _entries: Map<Protocol.Network.RequestId, NetworkRequest>;
  private readonly network: Network;
  private destination: (chromeEntry: NetworkRequest) => void;

  constructor(
    private readonly chromeRemoteInterface: ChromeRemoteInterface,
    private readonly logger: Logger,
    private readonly options: {
      stubPath: string;
    }
  ) {
    this._entries = new Map<Protocol.Network.RequestId, NetworkRequest>();
    const { Network: network } = this.chromeRemoteInterface;
    this.network = network;
  }

  public async subscribe(
    callback: (chromeEntry: NetworkRequest) => void
  ): Promise<void> {
    this.destination = (entry: NetworkRequest): void => callback(entry);

    this.chromeRemoteInterface.on(
      'event',
      (event: ChromeRemoteInterfaceEvent) => this.handleEvent(event)
    );

    await this.network.enable();
    await this.network.setCacheDisabled({ cacheDisabled: true });
    await this.network.setBypassServiceWorker({ bypass: true });
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
    const entry: NetworkRequest | undefined = this.createRequest(
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
    const entry: NetworkRequest | undefined = this._entries.get(requestId);

    if (!entry) {
      return;
    }

    entry.addExtraRequestInfo({
      requestHeaders: this.headersMapToHeadersArray(headers)
    });
  }

  public responseReceivedExtraInfo({
    requestId,
    headers,
    headersText
  }: Protocol.Network.ResponseReceivedExtraInfoEvent): void {
    const entry: NetworkRequest | undefined = this._entries.get(requestId);

    if (!entry) {
      return;
    }

    entry.addExtraResponseInfo({
      responseHeaders: this.headersMapToHeadersArray(headers),
      responseHeadersText: headersText
    });
  }

  private _appendRedirect(
    requestId: Protocol.Network.RequestId,
    time: Protocol.Network.MonotonicTime,
    redirectURL: string
  ): NetworkRequest {
    const originalNetworkRequest:
      | NetworkRequest
      | undefined = this._entries.get(requestId);

    let redirectCount: number = 0;
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

    this._entries.delete(networkRequest.requestId);
    this.destination(networkRequest);
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
      !!request.hasPostData,
      request.postData ?? null
    );
    chromeRequest.initialPriority = request.initialPriority;
  }

  private createRequest(
    requestId: Protocol.Network.RequestId,
    frameId: string | undefined,
    loaderId: Protocol.Network.LoaderId,
    url: string,
    documentURL: string,
    initiator: Protocol.Network.Initiator
  ): NetworkRequest {
    return new NetworkRequest(
      requestId,
      this.stripStubPathFromUrl(url),
      documentURL,
      frameId,
      loaderId,
      initiator,
      this.network
    );
  }

  private stripStubPathFromUrl(url: string): string {
    const indexOfStubPath: number = url.indexOf(this.options.stubPath);

    return indexOfStubPath !== -1 ? url.substring(indexOfStubPath) : url;
  }

  private updateNetworkRequestWithResponse(
    networkRequest: NetworkRequest,
    response: Protocol.Network.Response
  ): void {
    if (response.url && networkRequest.url !== response.url) {
      networkRequest.setUrl(this.stripStubPathFromUrl(response.url));
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
    return Object.keys(headersMap).reduce((acc: Header[], name: string) => {
      const values: string[] = headersMap[name].split('\n');

      acc.push(...values.map((value: string) => ({ name, value })));

      return acc;
    }, []);
  }

  private handleEvent({ method, params }: ChromeRemoteInterfaceEvent): void {
    const methodName: string = method.substring(method.indexOf('.') + 1);
    const handler: Function | undefined = this[methodName];

    if (handler) {
      handler.call(this, params);
    }
  }
}
