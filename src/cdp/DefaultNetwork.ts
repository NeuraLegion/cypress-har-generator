import type { Network, NetworkEvent } from '../network';
import { ErrorUtils } from '../utils/ErrorUtils';
import { Logger } from '../utils/Logger';
import {
  TARGET_OR_BROWSER_CLOSED,
  UNABLE_TO_ATTACH_TO_TARGET
} from './messages';
import type { Client, EventMessage } from 'chrome-remote-interface';
import type Protocol from 'devtools-protocol';

export class DefaultNetwork implements Network {
  private readonly DOMAIN = 'Network';
  private readonly ALLOWED_TARGETS = new Set([
    'service_worker',
    'page',
    'worker',
    'background_page',
    'webview',
    'shared_worker'
  ]);

  private listener?: (event: NetworkEvent) => unknown;
  private readonly sessions = new Map<string, string | undefined>();

  constructor(private readonly cdp: Client, private readonly logger: Logger) {}

  public async attachToTargets(
    listener: (event: NetworkEvent) => unknown
  ): Promise<void> {
    this.listener = listener;

    this.cdp.on('event', this.networkEventListener);
    this.cdp.on('Target.attachedToTarget', this.attachedToTargetListener);

    await this.ignoreCertificateError();
    await this.trackSessions();
    await this.recursivelyAttachToTargets({ type: 'browser' });
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

    try {
      await Promise.all([
        this.cdp.send('Security.disable'),
        this.enableAutoAttach(false)
      ]);
    } catch (e) {
      // ADHOC: handle any unforeseen issues while detaching from targets.
    }

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
  }

  private async ignoreCertificateError(): Promise<void> {
    this.cdp.on('Security.certificateError', this.certificateErrorListener);
    try {
      await this.cdp.send('Security.enable');
      await this.cdp.send('Security.setOverrideCertificateErrors', {
        override: true
      });
    } catch (e) {
      // ADHOC: The CDP protocol may not support the Security domain.
      this.logger.debug(
        ErrorUtils.isError(e) ? e.message : `Something went wrong: ${e}`
      );
    }
  }

  private networkEventListener = async (eventMessage: EventMessage) => {
    if (
      this.matchNetworkEvents(eventMessage) &&
      typeof this.listener === 'function'
    ) {
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

    return domain === this.DOMAIN;
  }

  private async recursivelyAttachToTargets(options: {
    sessionId?: string;
    type: string;
  }): Promise<void> {
    await this.enableAutoAttach(true, options.sessionId);

    if (this.ALLOWED_TARGETS.has(options.type)) {
      await this.trackNetworkEvents(options.sessionId);
    }
  }

  private enableAutoAttach(
    autoAttach: boolean,
    sessionId?: string
  ): Promise<void> {
    return this.cdp.send(
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
    sessionId?: string
  ) => this.sessions.set(requestId, sessionId);

  private attachedToTargetListener = async ({
    sessionId,
    targetInfo,
    waitingForDebugger
  }: Protocol.Target.AttachedToTargetEvent): Promise<void> => {
    try {
      await this.recursivelyAttachToTargets({
        sessionId,
        type: targetInfo.type
      });

      if (waitingForDebugger) {
        await this.cdp.send(
          'Runtime.runIfWaitingForDebugger',
          undefined,
          sessionId
        );
      }
    } catch (e) {
      this.logger.err(UNABLE_TO_ATTACH_TO_TARGET);
      throw e;
    }
  };

  private async trackNetworkEvents(sessionId?: string): Promise<void> {
    try {
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
    } catch (e) {
      if (this.targetClosedError(e)) {
        this.logger.debug(TARGET_OR_BROWSER_CLOSED);

        return;
      }

      throw e;
    }
  }

  private targetClosedError(e: unknown): boolean {
    return (
      ErrorUtils.isError(e) &&
      (e.message.includes('Target closed') ||
        e.message.includes('Session closed'))
    );
  }
}
