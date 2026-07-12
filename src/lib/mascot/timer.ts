export interface MascotTimerClock {
  now(): number;
  set(callback: () => void, delayMs: number): unknown;
  clear(handle: unknown): void;
}

const systemClock: MascotTimerClock = {
  now: Date.now,
  set: (callback, delayMs) => setTimeout(callback, delayMs),
  clear: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
};

export class MascotTimer {
  private readonly clock: MascotTimerClock;
  private handle: unknown = null;
  private callback: (() => void) | null = null;
  private remainingMs = 0;
  private startedAt = 0;

  constructor(clock: MascotTimerClock = systemClock) {
    this.clock = clock;
  }

  schedule(delayMs: number, callback: () => void): void {
    this.cancel();
    this.callback = callback;
    this.remainingMs = Math.max(0, delayMs);
    this.start();
  }

  pause(): void {
    if (this.handle === null) return;
    this.clock.clear(this.handle);
    this.handle = null;
    this.remainingMs = Math.max(
      0,
      this.remainingMs - (this.clock.now() - this.startedAt),
    );
  }

  resume(): void {
    if (this.handle !== null || !this.callback) return;
    this.start();
  }

  cancel(): void {
    if (this.handle !== null) this.clock.clear(this.handle);
    this.handle = null;
    this.callback = null;
    this.remainingMs = 0;
  }

  get pending(): boolean {
    return this.callback !== null;
  }

  private start(): void {
    if (!this.callback) return;
    this.startedAt = this.clock.now();
    this.handle = this.clock.set(() => {
      const callback = this.callback;
      this.handle = null;
      this.callback = null;
      this.remainingMs = 0;
      callback?.();
    }, this.remainingMs);
  }
}
