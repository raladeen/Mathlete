import { describe, expect, it } from 'vitest';
import {
  CATEGORIES,
  CATEGORY_KEYS,
  LEVELS,
  clampLevel,
  generateProblem,
  type CategoryKey,
  type Level,
} from './generators';

/** Enough draws that a rare bad branch is very unlikely to slip through. */
const SAMPLES = 2000;

function sample(category: CategoryKey, level: Level) {
  return Array.from({ length: SAMPLES }, () => generateProblem(category, level));
}

/** Ranges are restated from the spec here on purpose, as an independent check. */
const ADD_SUB_RANGES: Record<Level, [number, number, number, number]> = {
  1: [2, 9, 2, 9],
  2: [10, 40, 2, 9],
  3: [10, 99, 10, 99],
  4: [100, 500, 10, 99],
  5: [100, 999, 100, 999],
};

const MUL_RANGES: Record<Level, [number, number, number, number]> = {
  1: [2, 9, 2, 9],
  2: [2, 12, 2, 12],
  3: [3, 20, 2, 9],
  4: [11, 99, 2, 9],
  5: [11, 99, 11, 99],
};

const DIV_RANGES: Record<Level, [number, number, number, number]> = {
  1: [2, 9, 2, 9],
  2: [2, 12, 2, 9],
  3: [2, 12, 2, 20],
  4: [3, 12, 10, 40],
  5: [11, 30, 3, 30],
};

const FRACTION_RANGES: Record<Level, [number, number, number, number]> = {
  1: [2, 4, 2, 10],
  2: [2, 5, 2, 12],
  3: [2, 6, 3, 15],
  4: [3, 8, 4, 20],
  5: [3, 12, 5, 25],
};

function parseBinary(text: string, operator: string): [number, number] {
  const [left, right] = text.split(` ${operator} `);
  expect(right, `could not parse "${text}"`).toBeDefined();
  return [Number(left), Number(right)];
}

describe('generateProblem', () => {
  it.each(CATEGORY_KEYS)('always returns a whole-number answer for %s', (category) => {
    for (const level of LEVELS) {
      for (const problem of sample(category, level)) {
        expect(Number.isInteger(problem.answer), `${category} L${level}: ${problem.text}`).toBe(
          true,
        );
        expect(problem.answer).toBeGreaterThanOrEqual(0);
        expect(problem.text.length).toBeGreaterThan(0);
      }
    }
  });

  it('covers every category listed on the home screen', () => {
    expect(CATEGORIES.map((c) => c.key)).toEqual([...CATEGORY_KEYS]);
  });
});

describe('addition', () => {
  it('respects operand ranges and sums them', () => {
    for (const level of LEVELS) {
      const [aMin, aMax, bMin, bMax] = ADD_SUB_RANGES[level];
      for (const { text, answer } of sample('add', level)) {
        const [a, b] = parseBinary(text, '+');
        expect(a).toBeGreaterThanOrEqual(aMin);
        expect(a).toBeLessThanOrEqual(aMax);
        expect(b).toBeGreaterThanOrEqual(bMin);
        expect(b).toBeLessThanOrEqual(bMax);
        expect(answer).toBe(a + b);
      }
    }
  });
});

describe('subtraction', () => {
  it('never produces a negative result', () => {
    for (const level of LEVELS) {
      for (const { text, answer } of sample('sub', level)) {
        const [a, b] = parseBinary(text, '−');
        expect(a).toBeGreaterThanOrEqual(b);
        expect(answer).toBe(a - b);
        expect(answer).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('keeps both operands inside the level ranges after any swap', () => {
    for (const level of LEVELS) {
      const [aMin, aMax, bMin, bMax] = ADD_SUB_RANGES[level];
      const lo = Math.min(aMin, bMin);
      const hi = Math.max(aMax, bMax);
      for (const { text } of sample('sub', level)) {
        const [a, b] = parseBinary(text, '−');
        expect(a).toBeGreaterThanOrEqual(lo);
        expect(a).toBeLessThanOrEqual(hi);
        expect(b).toBeGreaterThanOrEqual(lo);
        expect(b).toBeLessThanOrEqual(hi);
      }
    }
  });
});

describe('multiplication', () => {
  it('respects operand ranges and multiplies them', () => {
    for (const level of LEVELS) {
      const [aMin, aMax, bMin, bMax] = MUL_RANGES[level];
      for (const { text, answer } of sample('mul', level)) {
        const [a, b] = parseBinary(text, '×');
        expect(a).toBeGreaterThanOrEqual(aMin);
        expect(a).toBeLessThanOrEqual(aMax);
        expect(b).toBeGreaterThanOrEqual(bMin);
        expect(b).toBeLessThanOrEqual(bMax);
        expect(answer).toBe(a * b);
      }
    }
  });
});

describe('division', () => {
  it('is always exact, with divisor and quotient inside the level ranges', () => {
    for (const level of LEVELS) {
      const [divisorMin, divisorMax, quotientMin, quotientMax] = DIV_RANGES[level];
      for (const { text, answer } of sample('div', level)) {
        const [dividend, divisor] = parseBinary(text, '÷');
        expect(dividend % divisor).toBe(0);
        expect(answer).toBe(dividend / divisor);
        expect(divisor).toBeGreaterThanOrEqual(divisorMin);
        expect(divisor).toBeLessThanOrEqual(divisorMax);
        expect(answer).toBeGreaterThanOrEqual(quotientMin);
        expect(answer).toBeLessThanOrEqual(quotientMax);
      }
    }
  });
});

describe('percentages', () => {
  const ALLOWED: Record<Level, number[]> = {
    1: [10, 50, 100],
    2: [10, 20, 25, 50, 75],
    3: [5, 10, 15, 20, 25, 50, 75],
    4: [12, 15, 18, 24, 35, 60],
    5: [5, 10, 15, 20, 25, 30, 35, 40, 45, 55, 65, 75, 85, 95],
  };
  const N_RANGES: Record<Level, [number, number, number]> = {
    1: [10, 100, 10],
    2: [8, 100, 4],
    3: [20, 200, 2],
    4: [20, 400, 2],
    5: [20, 500, 2],
  };

  it('asks allowed percentages of in-range multiples, with whole-number answers', () => {
    for (const level of LEVELS) {
      const [nMin, nMax, multiple] = N_RANGES[level];
      for (const { text, answer } of sample('pct', level)) {
        const match = /^(\d+)% of (\d+)$/.exec(text);
        expect(match, `unexpected format: "${text}"`).not.toBeNull();
        const percent = Number(match?.[1]);
        const n = Number(match?.[2]);

        expect(ALLOWED[level]).toContain(percent);
        expect(n % multiple).toBe(0);
        expect(n).toBeGreaterThanOrEqual(nMin);
        expect(n).toBeLessThanOrEqual(nMax);
        expect((percent * n) % 100).toBe(0);
        expect(answer).toBe((percent * n) / 100);
      }
    }
  });
});

describe('fractions', () => {
  it('keeps the numerator proper and the whole divisible by the denominator', () => {
    for (const level of LEVELS) {
      const [dMin, dMax, yMin, yMax] = FRACTION_RANGES[level];
      for (const { text, answer } of sample('frac', level)) {
        const match = /^(\d+)⁄(\d+) of (\d+)$/.exec(text);
        expect(match, `unexpected format: "${text}"`).not.toBeNull();
        const numerator = Number(match?.[1]);
        const denominator = Number(match?.[2]);
        const whole = Number(match?.[3]);

        expect(denominator).toBeGreaterThanOrEqual(dMin);
        expect(denominator).toBeLessThanOrEqual(dMax);
        expect(numerator).toBeGreaterThanOrEqual(1);
        expect(numerator).toBeLessThan(denominator);
        expect(whole % denominator).toBe(0);
        expect(whole / denominator).toBeGreaterThanOrEqual(yMin);
        expect(whole / denominator).toBeLessThanOrEqual(yMax);
        expect(answer).toBe((whole / denominator) * numerator);
      }
    }
  });
});

describe('clampLevel', () => {
  it('keeps levels inside 1–5', () => {
    expect(clampLevel(0)).toBe(1);
    expect(clampLevel(1)).toBe(1);
    expect(clampLevel(3)).toBe(3);
    expect(clampLevel(5)).toBe(5);
    expect(clampLevel(6)).toBe(5);
    expect(clampLevel(Number.NaN)).toBe(1);
  });
});
