export const LANTERN_KEY = 'horpang.lantern';

export interface Storage_ {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
}

/** 'on' | 'off' -> boolean; anything else -> null (not saved). */
export function parseLantern(raw: string | null): boolean | null {
  if (raw === 'on') return true;
  if (raw === 'off') return false;
  return null;
}

export class LanternStore {
  private value: boolean;
  private listeners = new Set<(on: boolean) => void>();

  constructor(
    private storage: Storage_ | null,
    prefersReducedMotion: () => boolean,
  ) {
    let saved: boolean | null = null;
    try {
      saved = storage ? parseLantern(storage.getItem(LANTERN_KEY)) : null;
    } catch {
      saved = null;
    }
    if (saved !== null) {
      this.value = saved;
    } else {
      let reduced = false;
      try {
        reduced = prefersReducedMotion();
      } catch {
        reduced = false;
      }
      this.value = reduced;
    }
  }

  get(): boolean {
    return this.value;
  }

  set(on: boolean): void {
    this.value = on;
    try {
      this.storage?.setItem(LANTERN_KEY, on ? 'on' : 'off');
    } catch {
      // keep in-memory value, no error shown
    }
    for (const fn of [...this.listeners]) fn(on);
  }

  subscribe(fn: (on: boolean) => void): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }
}
