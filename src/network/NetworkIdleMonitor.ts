import { Observer } from './Observer';
import { NetworkRequest } from './NetworkRequest';
import { promisify } from 'util';

export class NetworkIdleMonitor {
  private startIdleTime: number;

  constructor(private readonly networkObservable: Observer<NetworkRequest>) {}

  public async waitForIdle(idleTime: number) {
    for (;;) {
      this.startIdleTime = this.networkObservable.empty
        ? this.startIdleTimer()
        : undefined;

      if (this.shouldResolve(idleTime)) {
        return;
      }

      await promisify(setTimeout)(idleTime);
    }
  }

  private startIdleTimer(): number {
    if (!this.startIdleTime) {
      this.startIdleTime = Date.now();
    }

    return this.startIdleTime;
  }

  private shouldResolve(idleTime: number): boolean {
    return this.startIdleTime && Date.now() - this.startIdleTime >= idleTime;
  }
}
