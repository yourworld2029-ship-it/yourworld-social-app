/** One shared auxiliary decoder: a next-video preload OR a first-frame probe. */
export class AuxiliaryVideoSlot {
  private current: { owner: object; priority: number; revoke: () => void } | null = null;
  private listeners = new Set<() => void>();

  acquire(owner: object, priority: number, revoke: () => void) {
    if (this.current && this.current.owner !== owner) {
      if (this.current.priority >= priority) return null;
      const previous = this.current;
      this.current = null;
      previous.revoke();
    }
    this.current = { owner, priority, revoke };
    return () => {
      if (this.current?.owner !== owner) return;
      this.current = null;
      queueMicrotask(() => this.listeners.forEach((listener) => listener()));
    };
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }
}

export const auxiliaryVideoSlot = new AuxiliaryVideoSlot();