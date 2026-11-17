export type StageId = 'boot' | 'bootError' | 'title' | 'gallery' | 'corridor' | 'summary';

export type StageEvent =
  | { type: 'QUIZ_READY' }
  | { type: 'QUIZ_UNAVAILABLE' }
  | { type: 'ENTER_GALLERY'; grimoireOpen: boolean }
  | { type: 'SCORE_UPDATED'; solved: number; total: number }
  | { type: 'EXIT_ACTIVATED' }
  | { type: 'PLAY_AGAIN' };

/** Pure stage transition. Any pair not listed returns `current`. */
export function nextStage(current: StageId, ev: StageEvent): StageId {
  switch (ev.type) {
    case 'QUIZ_READY':
      return current === 'boot' ? 'title' : current;
    case 'QUIZ_UNAVAILABLE':
      return current === 'boot' ? 'bootError' : current;
    case 'ENTER_GALLERY':
      return current === 'title' && !ev.grimoireOpen ? 'gallery' : current;
    case 'SCORE_UPDATED':
      return current === 'gallery' && ev.total > 0 && ev.solved === ev.total ? 'corridor' : current;
    case 'EXIT_ACTIVATED':
      return current === 'corridor' ? 'summary' : current;
    case 'PLAY_AGAIN':
      return current === 'summary' ? 'gallery' : current;
    default:
      return current;
  }
}
