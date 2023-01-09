import { ChromeRemoteInterfaceEvent } from './CRIConnection';
import { Network, Security } from 'chrome-remote-interface';

export interface Connection {
  readonly network: Network;
  readonly security: Security;

  open(): Promise<void>;

  close(): Promise<void>;

  subscribe(
    callback: (event: ChromeRemoteInterfaceEvent) => void
  ): Promise<void>;
}
