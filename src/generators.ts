/**
 * Pure problem generation. No UI, no state — every function here takes a
 * category + level and returns a displayable problem with a whole-number answer.
 */

export const CATEGORY_KEYS = ['add', 'sub', 'mul', 'div', 'pct', 'frac'] as const;

export type CategoryKey = (typeof CATEGORY_KEYS)[number];

export type Level = 1 | 2 | 3 | 4 | 5;

export const LEVELS: readonly Level[] = [1, 2, 3, 4, 5];

export const MIN_LEVEL: Level = 1;
export const MAX_LEVEL: Level = 5;

export interface Problem {
  /** The prompt as shown to the user, e.g. `47 + 68`. */
  readonly text: string;
  /** Always a whole number. */
  readonly answer: number;
}

export interface Category {
  readonly key: CategoryKey;
  readonly name: string;
  readonly symbol: string;
  /** A representative expression shown on the category tile. */
  readonly sample: string;
}

const MINUS = '−';
const TIMES = '×';
const DIVIDE = '÷';
const FRACTION_SLASH = '⁄';

export const CATEGORIES: readonly Category[] = [
  { key: 'add', name: 'Addition', symbol: '+', sample: '47 + 68' },
  { key: 'sub', name: 'Subtraction', symbol: MINUS, sample: `82 ${MINUS} 39` },
  { key: 'mul', name: 'Multiplication', symbol: TIMES, sample: `12 ${TIMES} 7` },
  { key: 'div', name: 'Division', symbol: DIVIDE, sample: `96 ${DIVIDE} 8` },
  { key: 'pct', name: 'Percentages', symbol: '%', sample: '25% of 80' },
  { key: 'frac', name: 'Fractions', symbol: FRACTION_SLASH, sample: `2${FRACTION_SLASH}3 of 18` },
];

/** `[aMin, aMax, bMin, bMax]` — meaning of the operands varies by category. */
type Range4 = readonly [number, number, number, number];

type ByLevel<T> = Readonly<Record<Level, T>>;

const ADD_SUB_RANGES: ByLevel<Range4> = {
  1: [2, 9, 2, 9],
  2: [10, 40, 2, 9],
  3: [10, 99, 10, 99],
  4: [100, 500, 10, 99],
  5: [100, 999, 100, 999],
};

const MUL_RANGES: ByLevel<Range4> = {
  1: [2, 9, 2, 9],
  2: [2, 12, 2, 12],
  3: [3, 20, 2, 9],
  4: [11, 99, 2, 9],
  5: [11, 99, 11, 99],
};

/** `[divisorMin, divisorMax, quotientMin, quotientMax]` — the dividend is derived. */
const DIV_RANGES: ByLevel<Range4> = {
  1: [2, 9, 2, 9],
  2: [2, 12, 2, 9],
  3: [2, 12, 2, 20],
  4: [3, 12, 10, 40],
  5: [11, 30, 3, 30],
};

interface PercentSpec {
  /** Percentages that may be asked at this level. */
  readonly percents: readonly number[];
  readonly nMin: number;
  readonly nMax: number;
  /** `n` is always a multiple of this. */
  readonly multiple: number;
}

const PERCENT_SPECS: ByLevel<PercentSpec> = {
  1: { percents: [10, 50, 100], nMin: 10, nMax: 100, multiple: 10 },
  2: { percents: [10, 20, 25, 50, 75], nMin: 8, nMax: 100, multiple: 4 },
  3: { percents: [5, 10, 15, 20, 25, 50, 75], nMin: 20, nMax: 200, multiple: 2 },
  4: { percents: [12, 15, 18, 24, 35, 60], nMin: 20, nMax: 400, multiple: 2 },
  5: {
    percents: [5, 10, 15, 20, 25, 30, 35, 40, 45, 55, 65, 75, 85, 95],
    nMin: 20,
    nMax: 500,
    multiple: 2,
  },
};

/** `[dMin, dMax, yMin, yMax]` — the whole `Y` is `d` times a value in the y range. */
const FRACTION_RANGES: ByLevel<Range4> = {
  1: [2, 4, 2, 10],
  2: [2, 5, 2, 12],
  3: [2, 6, 3, 15],
  4: [3, 8, 4, 20],
  5: [3, 12, 5, 25],
};

/** Inclusive on both ends. */
function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pick<T>(items: readonly T[]): T {
  const item = items[Math.floor(Math.random() * items.length)];
  if (item === undefined) throw new Error('pick() called with an empty list');
  return item;
}

/** A multiple of `step` drawn uniformly from `[min, max]`. */
function randomMultiple(min: number, max: number, step: number): number {
  return randomInt(Math.ceil(min / step), Math.floor(max / step)) * step;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function lcm(a: number, b: number): number {
  return (a / gcd(a, b)) * b;
}

export function clampLevel(level: number): Level {
  const rounded = Math.round(level);
  if (!Number.isFinite(rounded) || rounded < MIN_LEVEL) return MIN_LEVEL;
  if (rounded > MAX_LEVEL) return MAX_LEVEL;
  return rounded as Level;
}

function generateAddition(level: Level): Problem {
  const [aMin, aMax, bMin, bMax] = ADD_SUB_RANGES[level];
  const a = randomInt(aMin, aMax);
  const b = randomInt(bMin, bMax);
  return { text: `${a} + ${b}`, answer: a + b };
}

function generateSubtraction(level: Level): Problem {
  const [aMin, aMax, bMin, bMax] = ADD_SUB_RANGES[level];
  let a = randomInt(aMin, aMax);
  let b = randomInt(bMin, bMax);
  // Never show a negative result.
  if (b > a) [a, b] = [b, a];
  return { text: `${a} ${MINUS} ${b}`, answer: a - b };
}

function generateMultiplication(level: Level): Problem {
  const [aMin, aMax, bMin, bMax] = MUL_RANGES[level];
  const a = randomInt(aMin, aMax);
  const b = randomInt(bMin, bMax);
  return { text: `${a} ${TIMES} ${b}`, answer: a * b };
}

function generateDivision(level: Level): Problem {
  const [divisorMin, divisorMax, quotientMin, quotientMax] = DIV_RANGES[level];
  const divisor = randomInt(divisorMin, divisorMax);
  const quotient = randomInt(quotientMin, quotientMax);
  // Build the dividend from the answer so the division is always exact.
  return { text: `${divisor * quotient} ${DIVIDE} ${divisor}`, answer: quotient };
}

const PERCENT_MAX_TRIES = 200;

function generatePercentage(level: Level): Problem {
  const spec = PERCENT_SPECS[level];
  const percent = pick(spec.percents);

  let n = 0;
  for (let attempt = 0; attempt < PERCENT_MAX_TRIES; attempt++) {
    n = randomMultiple(spec.nMin, spec.nMax, spec.multiple);
    if ((percent * n) % 100 === 0) break;
  }

  if ((percent * n) % 100 === 0) return { text: `${percent}% of ${n}`, answer: (percent * n) / 100 };

  // Rejection sampling got unlucky — construct a valid `n` directly. `n` must be
  // a multiple of both the level's step and whatever makes `percent * n` land on 100.
  const step = lcm(spec.multiple, 100 / gcd(percent, 100));
  n = randomMultiple(spec.nMin, spec.nMax, step);
  return { text: `${percent}% of ${n}`, answer: (percent * n) / 100 };
}

function generateFraction(level: Level): Problem {
  const [dMin, dMax, yMin, yMax] = FRACTION_RANGES[level];
  const denominator = randomInt(dMin, dMax);
  const numerator = randomInt(1, denominator - 1);
  // Whole is a multiple of the denominator, so the answer stays an integer.
  const whole = denominator * randomInt(yMin, yMax);
  return {
    text: `${numerator}${FRACTION_SLASH}${denominator} of ${whole}`,
    answer: (whole / denominator) * numerator,
  };
}

const GENERATORS: Readonly<Record<CategoryKey, (level: Level) => Problem>> = {
  add: generateAddition,
  sub: generateSubtraction,
  mul: generateMultiplication,
  div: generateDivision,
  pct: generatePercentage,
  frac: generateFraction,
};

export function generateProblem(category: CategoryKey, level: Level): Problem {
  return GENERATORS[category](level);
}
