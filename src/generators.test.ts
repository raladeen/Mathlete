import { describe, expect, it } from 'vitest';
import {
  CATEGORIES,
  CATEGORY_KEYS,
  MODES,
  generateProblem,
  isMode,
  type CategoryKey,
  type Mode,
} from './generators';

/** Enough draws that a rare bad branch is very unlikely to slip through. */
const SAMPLES = 2000;

function sample(category: CategoryKey, mode: Mode) {
  return Array.from({ length: SAMPLES }, () => generateProblem(category, mode));
}

/** Ranges are restated from the spec here on purpose, as an independent check. */
const ADD_SUB_RANGES: Record<Mode, [number, number, number, number]> = {
  easy: [2, 9, 2, 9],
  medium: [10, 99, 10, 99],
  hard: [100, 999, 100, 999],
};

const MUL_RANGES: Record<Mode, [number, number, number, number]> = {
  easy: [2, 9, 2, 9],
  medium: [10, 99, 2, 9],
  hard: [100, 999, 2, 12],
};

const DIV_RANGES: Record<Mode, [number, number, number, number]> = {
  easy: [2, 9, 2, 9],
  medium: [2, 12, 2, 20],
  hard: [3, 25, 4, 40],
};

/** Floors that stop a small divisor and quotient from colliding into a trivial problem. */
const MIN_DIVIDEND: Record<Mode, number> = { easy: 4, medium: 20, hard: 100 };

const FRACTION_RANGES: Record<Mode, [number, number, number, number]> = {
  easy: [2, 4, 2, 10],
  medium: [2, 6, 4, 15],
  hard: [3, 12, 8, 30],
};

/** How many digits the mode is meant to put in front of the user. */
const DIGITS: Record<Mode, number> = { easy: 1, medium: 2, hard: 3 };

function parseBinary(text: string, operator: string): [number, number] {
  const [left, right] = text.split(` ${operator} `);
  expect(right, `could not parse "${text}"`).toBeDefined();
  return [Number(left), Number(right)];
}

function digitCount(value: number): number {
  return String(value).length;
}

describe('generateProblem', () => {
  it.each(CATEGORY_KEYS)('always returns a whole-number answer for %s', (category) => {
    for (const mode of MODES) {
      for (const problem of sample(category, mode)) {
        expect(Number.isInteger(problem.answer), `${category}/${mode}: ${problem.text}`).toBe(true);
        expect(problem.answer).toBeGreaterThanOrEqual(0);
        expect(problem.text.length).toBeGreaterThan(0);
      }
    }
  });

  it('covers every category listed on the home screen, with a sample per mode', () => {
    expect(CATEGORIES.map((c) => c.key)).toEqual([...CATEGORY_KEYS]);
    for (const category of CATEGORIES) {
      for (const mode of MODES) {
        expect(category.sample[mode].length).toBeGreaterThan(0);
      }
    }
  });

  // The tile samples are hand-written, so they can drift away from the ranges
  // they advertise. At minimum they must be real problems.
  it('shows tile samples that are solvable whole-number problems', () => {
    for (const category of CATEGORIES) {
      for (const mode of MODES) {
        const text = category.sample[mode];
        const answer = solveSample(text);
        expect(Number.isInteger(answer), `${category.key}/${mode}: ${text}`).toBe(true);
        expect(answer, `${category.key}/${mode}: ${text}`).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

function solveSample(text: string): number {
  let match;
  if ((match = /^(\d+) \+ (\d+)$/.exec(text))) return Number(match[1]) + Number(match[2]);
  if ((match = /^(\d+) − (\d+)$/.exec(text))) return Number(match[1]) - Number(match[2]);
  if ((match = /^(\d+) × (\d+)$/.exec(text))) return Number(match[1]) * Number(match[2]);
  if ((match = /^(\d+) ÷ (\d+)$/.exec(text))) return Number(match[1]) / Number(match[2]);
  if ((match = /^(\d+)% of (\d+)$/.exec(text))) return (Number(match[1]) * Number(match[2])) / 100;
  if ((match = /^(\d+)⁄(\d+) of (\d+)$/.exec(text))) {
    return (Number(match[3]) / Number(match[2])) * Number(match[1]);
  }
  throw new Error(`sample does not match any prompt format: "${text}"`);
}

describe('isMode', () => {
  it('accepts the three modes and nothing else', () => {
    for (const mode of MODES) expect(isMode(mode)).toBe(true);
    expect(isMode('impossible')).toBe(false);
    expect(isMode(2)).toBe(false);
    expect(isMode(undefined)).toBe(false);
  });
});

describe('addition', () => {
  it('respects operand ranges and sums them', () => {
    for (const mode of MODES) {
      const [aMin, aMax, bMin, bMax] = ADD_SUB_RANGES[mode];
      for (const { text, answer } of sample('add', mode)) {
        const [a, b] = parseBinary(text, '+');
        expect(a).toBeGreaterThanOrEqual(aMin);
        expect(a).toBeLessThanOrEqual(aMax);
        expect(b).toBeGreaterThanOrEqual(bMin);
        expect(b).toBeLessThanOrEqual(bMax);
        expect(answer).toBe(a + b);
      }
    }
  });

  it('uses operands of the mode’s digit width', () => {
    for (const mode of MODES) {
      for (const { text } of sample('add', mode)) {
        const [a, b] = parseBinary(text, '+');
        expect(digitCount(a)).toBe(DIGITS[mode]);
        expect(digitCount(b)).toBe(DIGITS[mode]);
      }
    }
  });
});

describe('subtraction', () => {
  it('never produces a negative result', () => {
    for (const mode of MODES) {
      for (const { text, answer } of sample('sub', mode)) {
        const [a, b] = parseBinary(text, '−');
        expect(a).toBeGreaterThanOrEqual(b);
        expect(answer).toBe(a - b);
        expect(answer).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('uses operands of the mode’s digit width, even after a swap', () => {
    for (const mode of MODES) {
      const [aMin, aMax] = ADD_SUB_RANGES[mode];
      for (const { text } of sample('sub', mode)) {
        const [a, b] = parseBinary(text, '−');
        expect(digitCount(a)).toBe(DIGITS[mode]);
        expect(digitCount(b)).toBe(DIGITS[mode]);
        expect(a).toBeGreaterThanOrEqual(aMin);
        expect(a).toBeLessThanOrEqual(aMax);
      }
    }
  });
});

describe('multiplication', () => {
  it('respects operand ranges and multiplies them', () => {
    for (const mode of MODES) {
      const [aMin, aMax, bMin, bMax] = MUL_RANGES[mode];
      for (const { text, answer } of sample('mul', mode)) {
        const [a, b] = parseBinary(text, '×');
        expect(a).toBeGreaterThanOrEqual(aMin);
        expect(a).toBeLessThanOrEqual(aMax);
        expect(b).toBeGreaterThanOrEqual(bMin);
        expect(b).toBeLessThanOrEqual(bMax);
        expect(answer).toBe(a * b);
      }
    }
  });

  it('scales the leading operand to the mode’s digit width', () => {
    for (const mode of MODES) {
      for (const { text } of sample('mul', mode)) {
        const [a] = parseBinary(text, '×');
        expect(digitCount(a)).toBe(DIGITS[mode]);
      }
    }
  });
});

describe('division', () => {
  it('is always exact, with divisor and quotient inside the mode ranges', () => {
    for (const mode of MODES) {
      const [divisorMin, divisorMax, quotientMin, quotientMax] = DIV_RANGES[mode];
      for (const { text, answer } of sample('div', mode)) {
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

  it('never drops the dividend below the mode’s floor', () => {
    for (const mode of MODES) {
      for (const { text } of sample('div', mode)) {
        const [dividend] = parseBinary(text, '÷');
        expect(dividend, `${mode}: ${text}`).toBeGreaterThanOrEqual(MIN_DIVIDEND[mode]);
      }
    }
  });

  it('grows the dividend with the mode', () => {
    const maxDividend: Record<Mode, number> = { easy: 0, medium: 0, hard: 0 };
    for (const mode of MODES) {
      for (const { text } of sample('div', mode)) {
        const [dividend] = parseBinary(text, '÷');
        maxDividend[mode] = Math.max(maxDividend[mode], dividend);
      }
    }
    expect(maxDividend.easy).toBeLessThan(maxDividend.medium);
    expect(maxDividend.medium).toBeLessThan(maxDividend.hard);
    expect(maxDividend.hard).toBeGreaterThan(99);
  });
});

describe('percentages', () => {
  const ALLOWED: Record<Mode, number[]> = {
    easy: [10, 50, 100],
    medium: [5, 10, 15, 20, 25, 50, 75],
    hard: [
      5, 10, 12, 15, 18, 20, 24, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95,
    ],
  };
  const N_RANGES: Record<Mode, [number, number, number]> = {
    easy: [10, 100, 10],
    medium: [20, 200, 2],
    hard: [100, 500, 2],
  };

  it('asks allowed percentages of in-range multiples, with whole-number answers', () => {
    for (const mode of MODES) {
      const [nMin, nMax, multiple] = N_RANGES[mode];
      for (const { text, answer } of sample('pct', mode)) {
        const match = /^(\d+)% of (\d+)$/.exec(text);
        expect(match, `unexpected format: "${text}"`).not.toBeNull();
        const percent = Number(match?.[1]);
        const n = Number(match?.[2]);

        expect(ALLOWED[mode]).toContain(percent);
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
    for (const mode of MODES) {
      const [dMin, dMax, yMin, yMax] = FRACTION_RANGES[mode];
      for (const { text, answer } of sample('frac', mode)) {
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
