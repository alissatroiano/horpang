import type { Quiz } from '../engine/model';
import type { Rng } from '../game/rng';
import type { StageId } from '../game/stageMachine';
import type { GameStore } from '../state/store';
import type { LanternStore } from '../state/lanternStore';
import { clear, el } from './dom';

export interface Stage {
  mount(root: HTMLElement): void;
  /** Must remove DOM listeners, timers and animation frames. */
  destroy(): void;
}

export interface StageHostDeps {
  store: GameStore;
  lantern: LanternStore;
  /** Audio engine is wired in a later task; stages receive it opaquely. */
  audio: unknown;
  quiz: Quiz;
  rng: Rng;
}

export type StageFactory = (id: StageId, deps: StageHostDeps) => Stage | null;

export class StageHost {
  private current: Stage | null = null;
  private currentId: StageId | null = null;

  constructor(
    private readonly root: HTMLElement,
    private readonly deps: StageHostDeps,
    private readonly factory: StageFactory,
  ) {}

  get stageId(): StageId | null {
    return this.currentId;
  }

  /** Destroys the current stage, then mounts `next`. A mount error shows a themed message. */
  go(next: StageId): void {
    if (this.current) {
      try {
        this.current.destroy();
      } catch {
        /* a failing destroy must not block navigation */
      }
      this.current = null;
    }
    clear(this.root);
    this.currentId = next;

    const stage = this.factory(next, this.deps);
    if (!stage) return;
    try {
      stage.mount(this.root);
      this.current = stage;
    } catch {
      try {
        stage.destroy();
      } catch {
        /* ignore */
      }
      this.showError();
    }
  }

  destroy(): void {
    try {
      this.current?.destroy();
    } catch {
      /* ignore */
    }
    this.current = null;
    clear(this.root);
  }

  private showError(): void {
    clear(this.root);
    const reload = el('button', {
      className: 'px-4 py-2 border border-[#990000] text-[#e8e4d8] bg-black focus-visible:outline focus-visible:outline-2',
      text: 'Reload',
      attrs: { type: 'button' },
    });
    reload.addEventListener('click', () => window.location.reload());
    const box = el('div', {
      className: 'min-h-screen flex flex-col items-center justify-center gap-4 bg-black text-[#e8e4d8] p-6 text-center',
      attrs: { role: 'alert' },
      children: [
        el('p', { text: 'Something went wrong in the dark. The scene could not be shown.' }),
        reload,
      ],
    });
    this.root.appendChild(box);
    reload.focus();
  }
}
