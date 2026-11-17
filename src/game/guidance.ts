// Guidance_Controller: pure selection of the guide banner text (Req 11).

export type GuideState =
  | 'none-solved'
  | 'some-solved'
  | 'last-remaining'
  | 'modal-open'
  | 'after-wrong'
  | 'after-correct'
  | 'all-solved';

export const GUIDE_TABLE: Readonly<Record<GuideState, string>> = {
  'none-solved': 'Inspect a cursed photograph to uncover its question...',
  'some-solved': 'One memory fewer. Keep inspecting the photographs...',
  'last-remaining': 'Only one memory remains. Face it...',
  'modal-open': 'Choose carefully. The dark is listening...',
  'after-wrong': 'Wrong. Read the hint, then try again...',
  'after-correct': 'Banished! Pick the next photograph...',
  'all-solved':
    'All memories banished. Find the way out through the corridor to the EXIT door...',
};

export interface GuideContext {
  solved: number;
  total: number;
  modalOpen: boolean;
  lastResult: 'wrong' | 'correct' | null;
}

export function deriveGuideState(ctx: GuideContext): GuideState {
  if (ctx.modalOpen) return 'modal-open';
  if (ctx.lastResult === 'wrong') return 'after-wrong';
  if (ctx.total > 0 && ctx.solved === ctx.total) return 'all-solved';
  if (ctx.lastResult === 'correct') return 'after-correct';
  if (ctx.solved === ctx.total - 1) return 'last-remaining';
  if (ctx.solved > 0) return 'some-solved';
  return 'none-solved';
}

/** Table text for a known state; otherwise the currently displayed text (never empty). */
export function guideText(state: unknown, current: string): string {
  if (typeof state === 'string' && Object.prototype.hasOwnProperty.call(GUIDE_TABLE, state)) {
    return GUIDE_TABLE[state as GuideState];
  }
  return current !== '' ? current : GUIDE_TABLE['none-solved'];
}
