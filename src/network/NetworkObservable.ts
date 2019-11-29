import Protocol from 'devtools-protocol';
import ProtocolMapping from 'devtools-protocol/types/protocol-mapping';
import { ChromeRemoteInterface, Network } from 'chrome-remote-interface';
import { Logger } from '../utils';
import { ChromeEntry } from './ChromeEntry';

export type ChromeRemoteInterfaceMethod = keyof ProtocolMapping.Events;

export type ChromeRemoteInterfaceEvent = {
  method: ChromeRemoteInterfaceMethod;
  params?: ProtocolMapping.Events[ChromeRemoteInterfaceMethod][0];
};

export class NetworkObservable {
  private readonly _entries: Map<Protocol.Network.RequestId, ChromeEntry>;
  private readonly network: Network;
  private destination: (chromeEntry: ChromeEntry) => void;

  constructor(
    private readonly chromeRemoteInterface: ChromeRemoteInterface,
    private readonly logger: Logger
  ) {
    this._entries = new Map<Protocol.Network.RequestId, ChromeEntry>();
    const { Network: network } = this.chromeRemoteInterface;
    this.network = network;
  }

  public async subscribe(
    callback: (chromeEntry: ChromeEntry) => void
  ): Promise<void> {
    await this.network.enable();
    await this.network.setCacheDisabled({ cacheDisabled: true });
    await this.network.setBypassServiceWorker({ bypass: true });

    this.chromeRemoteInterface.on(
      'event',
      (event: ChromeRemoteInterfaceEvent) => this.handleEvent(event)
    );

    this.destination = callback;
  }

  public async requestWillBeSent(
    params: Protocol.Network.RequestWillBeSentEvent
  ): Promise<void> {
    const { requestId, timestamp, redirectResponse } = params;

    if (params.request.url.match('^data:')) {
      return;
    }

    if (params.request.hasPostData) {
      try {
        const { postData } = await this.network.getRequestPostData({
          requestId
        });
        params.request.postData = postData;
      } catch (e) {
        this.logger.err(e.message);
      }
    }

    if (redirectResponse) {
      const redirectEntry: ChromeEntry = this._entries.get(requestId);

      redirectEntry.responseParams = {
        response: redirectResponse
      };

      redirectEntry.responseFinishedS = timestamp;
      redirectEntry.encodedResponseLength = redirectResponse.encodedDataLength;

      const newId: string = `${requestId}_redirect_${timestamp}`;

      this._entries.set(newId, redirectEntry);
      this._entries.delete(requestId);
    }

    this._entries.set(requestId, {
      isWebSocket: false,
      requestParams: params,
      responseLength: 0
    });
  }

  public dataReceived(params: Protocol.Network.DataReceivedEvent): void {
    const { requestId, dataLength } = params;
    const entry: ChromeEntry = this._entries.get(requestId);
    if (!entry) {
      return;
    }
    entry.responseLength += dataLength;
  }

  public responseReceived(
    params: Protocol.Network.ResponseReceivedEvent
  ): void {
    const entry: ChromeEntry = this._entries.get(params.requestId);
    if (!entry) {
      return;
    }
    entry.responseParams = params;
  }

  public resourceChangedPriority(
    params: Protocol.Network.ResourceChangedPriorityEvent
  ): void {
    const { requestId, newPriority } = params;
    const entry: ChromeEntry = this._entries.get(requestId);
    if (!entry) {
      return;
    }
    entry.newPriority = newPriority;
  }

  public async loadingFinished(
    params: Protocol.Network.LoadingFinishedEvent
  ): Promise<void> {
    const { requestId, timestamp, encodedDataLength } = params;
    const entry = this._entries.get(requestId);
    if (!entry) {
      return;
    }
    entry.encodedResponseLength = encodedDataLength;
    entry.responseFinishedS = timestamp;

    try {
      const bodyResponse: Protocol.Network.GetResponseBodyResponse = await this.network.getResponseBody(
        { requestId }
      );

      const { body, base64Encoded } = bodyResponse;

      this.responseBody({
        requestId,
        body,
        base64Encoded
      });

      this.destination.call(Object.create(this.destination), entry);
    } catch (err) {
      this.logger.err(err.message);
    }
  }

  public loadingFailed(params: Protocol.Network.LoadingFailedEvent): void {
    const { requestId, errorText, canceled, timestamp } = params;
    const entry: ChromeEntry = this._entries.get(requestId);
    if (!entry) {
      return;
    }
    entry.responseFailedS = timestamp;

    const message: string = errorText || (canceled && 'Canceled');
    this.logger.err(message);
  }

  public responseBody(
    params: Protocol.Network.GetResponseBodyResponse & {
      requestId: Protocol.Network.RequestId;
    }
  ): void {
    const { requestId, body, base64Encoded } = params;
    const entry: ChromeEntry = this._entries.get(requestId);
    if (!entry) {
      return;
    }
    entry.responseBody = body;
    entry.responseBodyIsBase64 = base64Encoded;
  }

  public webSocketWillSendHandshakeRequest(
    params: Protocol.Network.WebSocketWillSendHandshakeRequestEvent
  ): void {
    this._entries.set(params.requestId, {
      isWebSocket: true,
      frames: [],
      requestParams: params,
      responseLength: 0
    });
  }

  public webSocketHandshakeResponseReceived(
    params: Protocol.Network.WebSocketHandshakeResponseReceivedEvent
  ): void {
    this.responseReceived(params as Protocol.Network.ResponseReceivedEvent);
  }

  public webSocketClosed(params: Protocol.Network.WebSocketClosedEvent): void {
    const { requestId, timestamp } = params;
    const entry: ChromeEntry = this._entries.get(requestId);
    if (!entry) {
      return;
    }

    entry.responseFinishedS = timestamp;
  }

  public webSocketFrameSent(
    params: Protocol.Network.WebSocketFrameSentEvent
  ): void {
    const { requestId, timestamp, response } = params;
    const entry: ChromeEntry = this._entries.get(requestId);
    if (!entry) {
      return;
    }
    entry.frames.push({
      type: 'request',
      time: timestamp,
      opcode: response.opcode,
      mask: response.mask,
      data: response.payloadData
    });
  }

  public webSocketFrameReceived(
    params: Protocol.Network.WebSocketFrameReceivedEvent
  ): void {
    const { requestId, timestamp, response } = params;
    const entry: ChromeEntry = this._entries.get(requestId);
    if (!entry) {
      return;
    }
    entry.frames.push({
      type: 'response',
      time: timestamp,
      mask: response.mask,
      opcode: response.opcode,
      data: response.payloadData
    });
  }

  private handleEvent({ method, params }: ChromeRemoteInterfaceEvent): void {
    const methodName: string = method.substring(method.indexOf('.') + 1);
    const handler: Function | undefined = this[methodName];

    if (handler) {
      handler.call(this, params);
    }
  }
}
