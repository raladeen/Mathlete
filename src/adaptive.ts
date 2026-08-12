import { CATEGORY_KEYS, MAX_LEVEL, MIN_LEVEL, type CategoryKey, type Level } from './generators';

/** Correct answers in a row needed to move up a level. */
export const STREAK_TO_LEVEL_UP = 3;

export interface Progress {
  readonly level: Level;
  /** Correct answers in a row at the current level; resets on level change. */
  readonly streak: number;
}

export type ProgressByCategory = Readonly<Record<CategoryKey, Progress>>;

export function initialProgress(): ProgressByCategory {
  return Object.fromEntries(
    CATEGORY_KEYS.map((key) => [key, { level: MIN_LEVEL, streak: 0 }]),
  ) as unknown as ProgressByCategory;
}

/**
 * Silent difficulty adaptation: three in a row moves up, a single miss moves
 * down. Levels are clamped to 1–5 and the streak resets whenever the level moves.
 */
export function advance(progress: Progress, correct: boolean): Progress {
  if (!correct) {
    if (progress.level === MIN_LEVEL) return { level: MIN_LEVEL, streak: 0 };
    return { level: (progress.level - 1) as Level, streak: 0 };
  }

  const streak = progress.streak + 1;
  if (streak >= STREAK_TO_LEVEL_UP && progress.level < MAX_LEVEL) {
    return { level: (progress.level + 1) as Level, streak: 0 };
  }
  return { level: progress.level, streak };
}
