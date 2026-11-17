import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { parseLantern, LanternStore, LANTERN_KEY, type Storage_ } from '../../src/state/lanternStore';

/** Storage whose reads and/or writes may throw. */
function makeStorage(initial: string | null, throwRead: boolean, throwWrite: boolean): Storage_ {
  let value = initial;
  return {
    getItem() {
      if (throwRead) throw new Error('read denied');
      return value;
    },
    setItem(k, v) {
      if (throwWrite) throw new Error('write denied');
      expect(k).toBe(LANTERN_KEY);
      value = v;
    },
  };
}

describe('lanternStore', () => {
  /**
   * Property 23: Lantern setting parsing and persistence
   * **Validates: Requirements 19.1, 19.3, 19.4, 19.9**
   */
  it('Property 23: parseLantern returns a boolean only for "on" and "off"', () => {
    fc.assert(
      fc.property(fc.oneof(fc.string(), fc.constantFrom('on', 'off', 'ON', ' on', 'true', '')), (raw) => {
        const r = parseLantern(raw);
        if (raw === 'on') expect(r).toBe(true);
        else if (raw === 'off') expect(r).toBe(false);
        else expect(r).toBeNull();
      }),
    );
    expect(parseLantern(null)).toBeNull();
  });

  it('Property 23: get() returns the most recent set value, even if storage throws', () => {
    fc.assert(
      fc.property(
        fc.option(fc.string(), { nil: null }),
        fc.boolean(),
        fc.boolean(),
        fc.boolean(),
        fc.array(fc.boolean(), { minLength: 1, maxLength: 20 }),
        (initial, throwRead, throwWrite, reduced, sets) => {
          const store = new LanternStore(makeStorage(initial, throwRead, throwWrite), () => reduced);
          for (const v of sets) {
            store.set(v);
            expect(store.get()).toBe(v);
          }
          expect(store.get()).toBe(sets[sets.length - 1]);
        },
      ),
    );
  });

  it('Property 23: with no valid saved value, get() equals prefersReducedMotion', () => {
    const invalid = fc.string().filter((s) => s !== 'on' && s !== 'off');
    fc.assert(
      fc.property(
        fc.oneof(invalid, fc.constant(null)),
        fc.boolean(),
        fc.boolean(),
        (raw, throwRead, reduced) => {
          expect(new LanternStore(makeStorage(raw, throwRead, false), () => reduced).get()).toBe(reduced);
          expect(new LanternStore(null, () => reduced).get()).toBe(reduced);
        },
      ),
    );
  });

  it('Property 23: a valid saved value wins over prefersReducedMotion and persists across stores', () => {
    fc.assert(
      fc.property(fc.boolean(), fc.boolean(), (saved, reduced) => {
        const storage = makeStorage(null, false, false);
        new LanternStore(storage, () => reduced).set(saved);
        expect(new LanternStore(storage, () => reduced).get()).toBe(saved);
      }),
    );
  });
});
