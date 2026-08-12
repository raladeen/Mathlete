import { MODES, MODE_LABELS, type Mode } from '../generators';
import styles from './ModeToggle.module.css';

interface ModeToggleProps {
  mode: Mode;
  onChange: (mode: Mode) => void;
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className={styles.toggle} role="group" aria-label="Difficulty">
      {MODES.map((option) => (
        <button
          key={option}
          type="button"
          className={`${styles.option} ${option === mode ? styles.selected : ''}`}
          aria-pressed={option === mode}
          onClick={() => onChange(option)}
        >
          {MODE_LABELS[option]}
        </button>
      ))}
    </div>
  );
}
