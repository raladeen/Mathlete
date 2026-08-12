import { MAX_LEVEL, type Category, type Level, type Problem } from '../generators';
import { Keypad } from './Keypad';
import styles from './PlayView.module.css';

export type Feedback = { status: 'correct' } | { status: 'wrong'; correctAnswer: number };

interface PlayViewProps {
  category: Category;
  level: Level;
  problem: Problem;
  /** Changes with every new problem so the entrance animation replays. */
  problemId: number;
  entry: string;
  feedback: Feedback | null;
  onDigit: (digit: string) => void;
  onDelete: () => void;
  onSubmit: () => void;
}

const EN_DASH = '–';

export function PlayView({
  category,
  level,
  problem,
  problemId,
  entry,
  feedback,
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
        <span className={styles.level}>
          <span className={styles.levelLabel} aria-hidden="true">
            Level
          </span>
          <span className={styles.dots} role="img" aria-label={`Level ${level} of ${MAX_LEVEL}`}>
            {Array.from({ length: MAX_LEVEL }, (_, index) => (
              <span
                key={index}
                className={`${styles.dot} ${index < level ? styles.dotFilled : ''}`}
              />
            ))}
          </span>
        </span>
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
