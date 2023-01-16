import type { Network, NetworkEvent } from '../network';
import type { Client, EventMessage } from 'chrome-remote-interface';
import type Protocol from 'devtools-protocol';

export class DefaultNetwork implements Network {
  private readonly domain = 'Network';
  private listener?: (event: NetworkEvent) => unknown;
  private readonly sessions = new Map<string, string>();

  constructor(private readonly cdp: Client) {}

  public async attachToTargets(
    listener: (event: NetworkEvent) => unknown
  ): Promise<void> {
    this.listener = listener;

    this.cdp.on('event', this.networkEventListener);

    await this.ignoreCertificateError();
    await this.trackSessions();
  }

  public async detachFromTargets(): Promise<void> {
    if (this.listener) {
      this.cdp.off('event', this.networkEventListener);
      this.cdp.off('Security.certificateError', this.certificateErrorListener);
      this.cdp.off('Target.attachedToTarget', this.attachedToTargetListener);
      this.cdp.off('Network.requestWillBeSent', this.sessionListener);
      this.cdp.off('Network.webSocketCreated', this.sessionListener);
      delete this.listener;
    }

    await Promise.all([
      this.cdp.send('Security.disable'),
      this.enableAutoAttach(false)
    ]);

    this.sessions.clear();
  }

  public getRequestBody(
    requestId: string
  ): Promise<Protocol.Network.GetRequestPostDataResponse> {
    return this.cdp.send(
      'Network.getRequestPostData',
      {
        requestId
      },
      this.sessions.get(requestId)
    );
  }

  public getResponseBody(
    requestId: string
  ): Promise<Protocol.Network.GetResponseBodyResponse> {
    return this.cdp.send(
      'Network.getResponseBody',
      {
        requestId
      },
      this.sessions.get(requestId)
    );
  }

  private async trackSessions(): Promise<void> {
    this.cdp.on('Network.requestWillBeSent', this.sessionListener);
    this.cdp.on('Network.webSocketCreated', this.sessionListener);
    await this.discoverTargets();
    await this.recursivelyAttachToTargets();
  }

  private async ignoreCertificateError(): Promise<void> {
    await this.cdp.send('Security.enable');
    this.cdp.on('Security.certificateError', this.certificateErrorListener);
    await this.cdp.send('Security.setOverrideCertificateErrors', {
      override: true
    });
  }

  private networkEventListener = (eventMessage: EventMessage) => {
    if (this.matchNetworkEvents(eventMessage)) {
      this.listener(eventMessage);
    }
  };

  private certificateErrorListener = ({
    eventId
  }: Protocol.Security.CertificateErrorEvent) =>
    this.cdp.send('Security.handleCertificateError', {
      eventId,
      action: 'continue'
    });

  private matchNetworkEvents(message: EventMessage): message is NetworkEvent {
    const [domain]: string[] = message.method.split('.');

    return domain === this.domain;
  }

  private async recursivelyAttachToTargets(sessionId?: string): Promise<void> {
    await this.enableAutoAttach(true, sessionId);
    await this.trackNetworkEvents();
    this.cdp.on('Target.attachedToTarget', this.attachedToTargetListener);
  }

  private enableAutoAttach(autoAttach: boolean, sessionId?: string) {
    this.cdp.send(
      'Target.setAutoAttach',
      {
        autoAttach,
        flatten: true,
        waitForDebuggerOnStart: true
      },
      sessionId
    );
  }

  private sessionListener = (
    {
      requestId
    }:
      | Protocol.Network.RequestWillBeSentEvent
      | Protocol.Network.WebSocketCreatedEvent,
    sessionId: string
  ) => this.sessions.set(requestId, sessionId);

  private attachedToTargetListener = async ({
    sessionId
  }: Protocol.Target.AttachedToTargetEvent): Promise<void> => {
    await this.trackNetworkEvents(sessionId);
    await this.recursivelyAttachToTargets(sessionId);
    await this.cdp.send(
      'Runtime.runIfWaitingForDebugger',
      undefined,
      sessionId
    );
  };

  private async trackNetworkEvents(sessionId?: string): Promise<void> {
    await Promise.all([
      this.cdp.send('Network.enable', {}, sessionId),
      this.cdp.send(
        'Network.setCacheDisabled',
        {
          cacheDisabled: true
        },
        sessionId
      )
    ]);
  }

  private discoverTargets(): Promise<void> {
    return this.cdp.send('Target.setDiscoverTargets', {
      discover: true
    });
  }
}