import Protocol from 'devtools-protocol';
import ProtocolMapping from 'devtools-protocol/types/protocol-mapping';
import { ChromeRemoteInterface, Network } from 'chrome-remote-interface';
import { Logger } from '../utils';
import { Header } from 'har-format';
import { ChromeRequest } from './ChromeRequest';

export type ChromeRemoteInterfaceMethod = keyof ProtocolMapping.Events;

export type ChromeRemoteInterfaceEvent = {
  method: ChromeRemoteInterfaceMethod;
  params?: ProtocolMapping.Events[ChromeRemoteInterfaceMethod][0];
};

export class NetworkObserver {
  private readonly _entries: Map<Protocol.Network.RequestId, ChromeRequest>;
  private readonly network: Network;
  private destination: (chromeEntry: ChromeRequest) => void;

  constructor(
    private readonly chromeRemoteInterface: ChromeRemoteInterface,
    private readonly logger: Logger
  ) {
    this._entries = new Map<Protocol.Network.RequestId, ChromeRequest>();
    const { Network: network } = this.chromeRemoteInterface;
    this.network = network;
  }

  public async subscribe(
    callback: (chromeEntry: ChromeRequest) => void
  ): Promise<void> {
    this.destination = (entry: ChromeRequest): void => callback(entry);

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
    const entry: ChromeRequest | undefined = this._entries.get(
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
    let entry: ChromeRequest | undefined = this._entries.get(requestId);

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
    const entry: ChromeRequest | undefined = this._entries.get(requestId);
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
    const entry: ChromeRequest = this._entries.get(requestId);

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
    const entry: ChromeRequest = this._entries.get(requestId);

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
    const entry: ChromeRequest = this._entries.get(requestId);

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
    const entry: ChromeRequest = this._entries.get(requestId);
    if (!entry) {
      return;
    }

    entry.resourceType = type;

    this.finishRequest(entry, timestamp, -1);

    const message: string = errorText || (canceled && 'Canceled');
    this.logger.err(message);
  }

  public webSocketCreated({
    initiator,
    requestId,
    url
  }: Protocol.Network.WebSocketCreatedEvent): void {
    const entry: ChromeRequest = this.createRequest(
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
    const entry: ChromeRequest | undefined = this._entries.get(requestId);
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
    const entry: ChromeRequest | undefined = this._entries.get(requestId);
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
    const entry: ChromeRequest | undefined = this._entries.get(requestId);

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
    const entry: ChromeRequest | undefined = this._entries.get(requestId);

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
    const entry: ChromeRequest | undefined = this._entries.get(requestId);
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
    const entry: ChromeRequest | undefined = this._entries.get(requestId);
    if (!entry) {
      return;
    }
    this.finishRequest(entry, timestamp, -1);
  }

  public eventSourceMessageReceived({
    data,
    eventId,
    eventName,
    requestId,
    timestamp
  }: Protocol.Network.EventSourceMessageReceivedEvent): void {
    const entry: ChromeRequest | undefined = this._entries.get(requestId);
    if (!entry) {
      return;
    }
    entry.addEventSourceMessage(timestamp, eventName, eventId, data);
  }

  public requestWillBeSentExtraInfo({
    requestId,
    headers
  }: Protocol.Network.RequestWillBeSentExtraInfoEvent): void {
    const entry: ChromeRequest | undefined = this._entries.get(requestId);
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
    const entry: ChromeRequest | undefined = this._entries.get(requestId);
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
  ): ChromeRequest {
    const originalNetworkRequest: ChromeRequest | undefined = this._entries.get(
      requestId
    );
    let redirectCount: number = 0;

    for (
      let redirect: ChromeRequest | undefined =
        originalNetworkRequest.redirectSource;
      redirect;
      redirect = redirect.redirectSource
    ) {
      redirectCount++;
    }

    originalNetworkRequest.markAsRedirect(redirectCount);

    this.finishRequest(originalNetworkRequest, time, -1);

    const newNetworkRequest: ChromeRequest = this.createRequest(
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
    networkRequest: ChromeRequest,
    finishTime: Protocol.Network.MonotonicTime,
    encodedDataLength: number
  ): void {
    networkRequest.endTime = finishTime;

    if (encodedDataLength >= 0) {
      const redirectSource = networkRequest.redirectSource;
      if (redirectSource && redirectSource.signedExchangeInfo) {
        networkRequest.transferSize = 0;
        redirectSource.transferSize = encodedDataLength;
      } else {
        networkRequest.transferSize = encodedDataLength;
      }
    }

    this._entries.delete(networkRequest.requestId);
    this.destination(networkRequest);
  }

  private startRequest(networkRequest: ChromeRequest): void {
    this._entries.set(networkRequest.requestId, networkRequest);
  }

  private updateNetworkRequestWithRequest(
    chromeRequest: ChromeRequest,
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
    chromeRequest.mixedContentType = request.mixedContentType ?? 'none';
    chromeRequest.referrerPolicy = request.referrerPolicy;
  }

  private createRequest(
    requestId: Protocol.Network.RequestId,
    frameId: string | undefined,
    loaderId: Protocol.Network.LoaderId,
    url: string,
    documentURL: string,
    initiator: Protocol.Network.Initiator
  ): ChromeRequest {
    return new ChromeRequest(
      requestId,
      url,
      documentURL,
      frameId,
      loaderId,
      initiator,
      this.network
    );
  }

  private updateNetworkRequestWithResponse(
    networkRequest: ChromeRequest,
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

    networkRequest.protocol = response.protocol || '';

    networkRequest.securityState = response.securityState;

    if (response.securityDetails) {
      networkRequest.securityDetails = response.securityDetails;
    }
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
