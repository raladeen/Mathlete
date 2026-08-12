import styles from './Keypad.module.css';

interface KeypadProps {
  onDigit: (digit: string) => void;
  onDelete: () => void;
  onSubmit: () => void;
}

const DIGIT_ROWS = ['789', '456', '123'] as const;

export function Keypad({ onDigit, onDelete, onSubmit }: KeypadProps) {
  return (
    <div className={styles.keypad}>
      {DIGIT_ROWS.join('')
        .split('')
        .map((digit) => (
          <button key={digit} type="button" className={styles.key} onClick={() => onDigit(digit)}>
            {digit}
          </button>
        ))}
      <button type="button" className={styles.key} onClick={onDelete} aria-label="Delete">
        {/* Drawn rather than typed: ⌫ has no glyph in JetBrains Mono. */}
        <svg
          className={styles.icon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M9 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-6-7 6-7Z" />
          <path d="M14.5 9.5l-4 5M10.5 9.5l4 5" />
        </svg>
      </button>
      <button type="button" className={styles.key} onClick={() => onDigit('0')}>
        0
      </button>
      <button
        type="button"
        className={`${styles.key} ${styles.submit}`}
        onClick={onSubmit}
        aria-label="Check"
      >
        <span aria-hidden="true">✓</span>
      </button>
    </div>
  );
}
