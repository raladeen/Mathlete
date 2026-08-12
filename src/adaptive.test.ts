import { describe, expect, it } from 'vitest';
import { advance, initialProgress, type Progress } from './adaptive';
import { CATEGORY_KEYS } from './generators';

const at = (level: Progress['level'], streak: number): Progress => ({ level, streak });

describe('initialProgress', () => {
  it('starts every category at level 1 with no streak', () => {
    const progress = initialProgress();
    expect(Object.keys(progress).sort()).toEqual([...CATEGORY_KEYS].sort());
    for (const key of CATEGORY_KEYS) {
      expect(progress[key]).toEqual({ level: 1, streak: 0 });
    }
  });
});

describe('advance', () => {
  it('levels up after three correct in a row and resets the streak', () => {
    expect(advance(at(1, 0), true)).toEqual({ level: 1, streak: 1 });
    expect(advance(at(1, 1), true)).toEqual({ level: 1, streak: 2 });
    expect(advance(at(1, 2), true)).toEqual({ level: 2, streak: 0 });
  });

  it('levels down on any wrong answer and clears the streak', () => {
    expect(advance(at(3, 2), false)).toEqual({ level: 2, streak: 0 });
    expect(advance(at(5, 0), false)).toEqual({ level: 4, streak: 0 });
  });

  it('clamps at the top and bottom levels', () => {
    expect(advance(at(5, 2), true)).toEqual({ level: 5, streak: 3 });
    expect(advance(at(1, 0), false)).toEqual({ level: 1, streak: 0 });
  });

  it('needs a fresh run of three after a miss', () => {
    let progress = at(2, 2);
    progress = advance(progress, false);
    expect(progress).toEqual({ level: 1, streak: 0 });
    progress = advance(progress, true);
    progress = advance(progress, true);
    expect(progress.level).toBe(1);
    progress = advance(progress, true);
    expect(progress).toEqual({ level: 2, streak: 0 });
  });
});
