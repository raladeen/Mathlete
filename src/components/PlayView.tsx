import type { Category, Mode, Problem } from '../generators';
import { Keypad } from './Keypad';
import { ModeToggle } from './ModeToggle';
import styles from './PlayView.module.css';

export type Feedback = { status: 'correct' } | { status: 'wrong'; correctAnswer: number };

interface PlayViewProps {
  category: Category;
  mode: Mode;
  problem: Problem;
  /** Changes with every new problem so the entrance animation replays. */
  problemId: number;
  entry: string;
  feedback: Feedback | null;
  onModeChange: (mode: Mode) => void;
  onDigit: (digit: string) => void;
  onDelete: () => void;
  onSubmit: () => void;
}

const EN_DASH = '–';

export function PlayView({
  category,
  mode,
  problem,
  problemId,
  entry,
  feedback,
  onModeChange,
  onDigit,
  onDelete,
  onSubmit,
}: PlayViewProps) {
  const entryClass = [
    styles.entry,
    entry === '' && !feedback ? styles.entryEmpty : '',
    feedback?.status === 'correct' ? styles.entryCorrect : '',
    feedback?.status === 'wrong' ? styles.entryWrong : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.play}>
      <div className={styles.status}>
        <span className={styles.category}>
          <span className={styles.categorySymbol} aria-hidden="true">
            {category.symbol}
          </span>
          <span className={styles.categoryName}>{category.name}</span>
        </span>
        <ModeToggle mode={mode} onChange={onModeChange} />
      </div>

      <div className={styles.board}>
        <div key={problemId} className={styles.problem} aria-live="polite">
          {problem.text}
        </div>
        <div className={entryClass} aria-label="Your answer">
          {entry === '' ? EN_DASH : entry}
        </div>
        <div
          className={`${styles.note} ${feedback?.status === 'correct' ? styles.noteCorrect : ''}`}
          role="status"
        >
          {feedback?.status === 'correct' && '✓ correct'}
          {feedback?.status === 'wrong' && `answer: ${feedback.correctAnswer}`}
        </div>
      </div>

      <Keypad onDigit={onDigit} onDelete={onDelete} onSubmit={onSubmit} />
    </div>
  );
}
