/**
 * Pure problem generation. No UI, no state — every function here takes a
 * category + mode and returns a displayable problem with a whole-number answer.
 */

export const CATEGORY_KEYS = ['add', 'sub', 'mul', 'div', 'pct', 'frac'] as const;

export type CategoryKey = (typeof CATEGORY_KEYS)[number];

export const MODES = ['easy', 'medium', 'hard'] as const;

export type Mode = (typeof MODES)[number];

export const DEFAULT_MODE: Mode = 'medium';

export const MODE_LABELS: Readonly<Record<Mode, string>> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

type ByMode<T> = Readonly<Record<Mode, T>>;

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
  /** A representative expression per mode, shown on the category tile. */
  readonly sample: ByMode<string>;
}

const MINUS = '−';
const TIMES = '×';
const DIVIDE = '÷';
const FRACTION_SLASH = '⁄';

export const CATEGORIES: readonly Category[] = [
  {
    key: 'add',
    name: 'Addition',
    symbol: '+',
    sample: { easy: '7 + 4', medium: '47 + 68', hard: '418 + 267' },
  },
  {
    key: 'sub',
    name: 'Subtraction',
    symbol: MINUS,
    sample: {
      easy: `9 ${MINUS} 5`,
      medium: `82 ${MINUS} 39`,
      hard: `731 ${MINUS} 458`,
    },
  },
  {
    key: 'mul',
    name: 'Multiplication',
    symbol: TIMES,
    sample: {
      easy: `7 ${TIMES} 6`,
      medium: `48 ${TIMES} 7`,
      hard: `312 ${TIMES} 8`,
    },
  },
  {
    key: 'div',
    name: 'Division',
    symbol: DIVIDE,
    sample: {
      easy: `56 ${DIVIDE} 8`,
      medium: `144 ${DIVIDE} 12`,
      hard: `608 ${DIVIDE} 16`,
    },
  },
  {
    key: 'pct',
    name: 'Percentages',
    symbol: '%',
    sample: { easy: '50% of 40', medium: '15% of 60', hard: '35% of 240' },
  },
  {
    key: 'frac',
    name: 'Fractions',
    symbol: FRACTION_SLASH,
    sample: {
      easy: `3${FRACTION_SLASH}4 of 12`,
      medium: `2${FRACTION_SLASH}5 of 45`,
      hard: `7${FRACTION_SLASH}12 of 180`,
    },
  },
];

/** `[aMin, aMax, bMin, bMax]` — meaning of the operands varies by category. */
type Range4 = readonly [number, number, number, number];

/** Single-digit, then two-digit, then three-digit operands. */
const ADD_SUB_RANGES: ByMode<Range4> = {
  easy: [2, 9, 2, 9],
  medium: [10, 99, 10, 99],
  hard: [100, 999, 100, 999],
};

/**
 * The larger operand carries the digit count. Three-digit by three-digit is not
 * a mental-math problem, so the second operand stays small as the first grows.
 */
const MUL_RANGES: ByMode<Range4> = {
  easy: [2, 9, 2, 9],
  medium: [10, 99, 2, 9],
  hard: [100, 999, 2, 12],
};

interface DivisionSpec {
  readonly divisorMin: number;
  readonly divisorMax: number;
  readonly quotientMin: number;
  readonly quotientMax: number;
  /**
   * The dividend is derived from divisor × quotient, so without a floor a small
   * draw of each would put `12 ÷ 3` in front of someone who chose Hard.
   */
  readonly minDividend: number;
}

const DIVISION_SPECS: ByMode<DivisionSpec> = {
  easy: { divisorMin: 2, divisorMax: 9, quotientMin: 2, quotientMax: 9, minDividend: 0 },
  medium: { divisorMin: 2, divisorMax: 12, quotientMin: 2, quotientMax: 20, minDividend: 20 },
  hard: { divisorMin: 3, divisorMax: 25, quotientMin: 4, quotientMax: 40, minDividend: 100 },
};

interface PercentSpec {
  /** Percentages that may be asked in this mode. */
  readonly percents: readonly number[];
  readonly nMin: number;
  readonly nMax: number;
  /** `n` is always a multiple of this. */
  readonly multiple: number;
}

/** Percentages scale by how awkward the percentage is, not by digit count. */
const PERCENT_SPECS: ByMode<PercentSpec> = {
  easy: { percents: [10, 50, 100], nMin: 10, nMax: 100, multiple: 10 },
  medium: { percents: [5, 10, 15, 20, 25, 50, 75], nMin: 20, nMax: 200, multiple: 2 },
  hard: {
    percents: [
      5, 10, 12, 15, 18, 20, 24, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95,
    ],
    nMin: 100,
    nMax: 500,
    multiple: 2,
  },
};

/**
 * `[dMin, dMax, yMin, yMax]` — the whole `Y` is `d` times a value in the y range.
 * Fractions scale by denominator size rather than digit count.
 */
const FRACTION_RANGES: ByMode<Range4> = {
  easy: [2, 4, 2, 10],
  medium: [2, 6, 4, 15],
  hard: [3, 12, 8, 30],
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

export function isMode(value: unknown): value is Mode {
  return typeof value === 'string' && (MODES as readonly string[]).includes(value);
}

function generateAddition(mode: Mode): Problem {
  const [aMin, aMax, bMin, bMax] = ADD_SUB_RANGES[mode];
  const a = randomInt(aMin, aMax);
  const b = randomInt(bMin, bMax);
  return { text: `${a} + ${b}`, answer: a + b };
}

function generateSubtraction(mode: Mode): Problem {
  const [aMin, aMax, bMin, bMax] = ADD_SUB_RANGES[mode];
  let a = randomInt(aMin, aMax);
  let b = randomInt(bMin, bMax);
  // Never show a negative result.
  if (b > a) [a, b] = [b, a];
  return { text: `${a} ${MINUS} ${b}`, answer: a - b };
}

function generateMultiplication(mode: Mode): Problem {
  const [aMin, aMax, bMin, bMax] = MUL_RANGES[mode];
  const a = randomInt(aMin, aMax);
  const b = randomInt(bMin, bMax);
  return { text: `${a} ${TIMES} ${b}`, answer: a * b };
}

function generateDivision(mode: Mode): Problem {
  const spec = DIVISION_SPECS[mode];
  const divisor = randomInt(spec.divisorMin, spec.divisorMax);
  // Lift the quotient floor to whatever keeps the dividend in the mode's band,
  // but never past the ceiling.
  const quotientMin = Math.min(
    Math.max(spec.quotientMin, Math.ceil(spec.minDividend / divisor)),
    spec.quotientMax,
  );
  const quotient = randomInt(quotientMin, spec.quotientMax);
  // Build the dividend from the answer so the division is always exact.
  return { text: `${divisor * quotient} ${DIVIDE} ${divisor}`, answer: quotient };
}

const PERCENT_MAX_TRIES = 200;

function generatePercentage(mode: Mode): Problem {
  const spec = PERCENT_SPECS[mode];
  const percent = pick(spec.percents);

  let n = 0;
  for (let attempt = 0; attempt < PERCENT_MAX_TRIES; attempt++) {
    n = randomMultiple(spec.nMin, spec.nMax, spec.multiple);
    if ((percent * n) % 100 === 0) break;
  }

  if ((percent * n) % 100 === 0) return { text: `${percent}% of ${n}`, answer: (percent * n) / 100 };

  // Rejection sampling got unlucky — construct a valid `n` directly. `n` must be
  // a multiple of both the mode's step and whatever makes `percent * n` land on 100.
  const step = lcm(spec.multiple, 100 / gcd(percent, 100));
  n = randomMultiple(spec.nMin, spec.nMax, step);
  return { text: `${percent}% of ${n}`, answer: (percent * n) / 100 };
}

function generateFraction(mode: Mode): Problem {
  const [dMin, dMax, yMin, yMax] = FRACTION_RANGES[mode];
  const denominator = randomInt(dMin, dMax);
  const numerator = randomInt(1, denominator - 1);
  // Whole is a multiple of the denominator, so the answer stays an integer.
  const whole = denominator * randomInt(yMin, yMax);
  return {
    text: `${numerator}${FRACTION_SLASH}${denominator} of ${whole}`,
    answer: (whole / denominator) * numerator,
  };
}

const GENERATORS: Readonly<Record<CategoryKey, (mode: Mode) => Problem>> = {
  add: generateAddition,
  sub: generateSubtraction,
  mul: generateMultiplication,
  div: generateDivision,
  pct: generatePercentage,
  frac: generateFraction,
};

export function generateProblem(category: CategoryKey, mode: Mode): Problem {
  return GENERATORS[category](mode);
}
