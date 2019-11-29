import Protocol from 'devtools-protocol';

export interface ChromeEntry {
  isWebSocket: boolean;
  frames?: {
    type: 'request' | 'response';
    time: number;
    opcode: number;
    mask: boolean;
    data: string;
  }[];
  requestParams:
    | Protocol.Network.RequestWillBeSentEvent
    | Protocol.Network.WebSocketWillSendHandshakeRequestEvent;
  responseParams?:
    | { response: Protocol.Network.Response }
    | Protocol.Network.ResponseReceivedEvent
    | Protocol.Network.WebSocketHandshakeResponseReceivedEvent;
  responseLength: number;
  encodedResponseLength?: number;
  responseFinishedS?: number;
  responseFailedS?: number;
  responseBody?: string;
  responseBodyIsBase64?: boolean;
  newPriority?: Protocol.Network.ResourcePriority;
}
