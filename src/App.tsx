import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './App.module.css';
import { CategoryGrid } from './components/CategoryGrid';
import { ModeToggle } from './components/ModeToggle';
import { PlayView, type Feedback } from './components/PlayView';
import {
  CATEGORIES,
  DEFAULT_MODE,
  generateProblem,
  type CategoryKey,
  type Mode,
  type Problem,
} from './generators';

/** How long the result stays on screen before the next problem appears. */
const CORRECT_PAUSE_MS = 520;
const WRONG_PAUSE_MS = 1150;

const MAX_ENTRY_LENGTH = 9;

interface Round {
  problem: Problem;
  problemId: number;
  entry: string;
  feedback: Feedback | null;
}

export default function App() {
  const [mode, setMode] = useState<Mode>(DEFAULT_MODE);
  const [category, setCategory] = useState<CategoryKey | null>(null);
  const [round, setRound] = useState<Round | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  const start = useCallback(
    (next: CategoryKey) => {
      clearTimer();
      setCategory(next);
      setRound({
        problem: generateProblem(next, mode),
        problemId: 0,
        entry: '',
        feedback: null,
      });
    },
    [clearTimer, mode],
  );

  const quit = useCallback(() => {
    clearTimer();
    setCategory(null);
    setRound(null);
  }, [clearTimer]);

  /** Switching mode mid-session swaps in a fresh problem at the new difficulty. */
  const changeMode = useCallback(
    (next: Mode) => {
      setMode(next);
      if (!category) return;
      clearTimer();
      setRound((current) =>
        current
          ? {
              problem: generateProblem(category, next),
              problemId: current.problemId + 1,
              entry: '',
              feedback: null,
            }
          : current,
      );
    },
    [category, clearTimer],
  );

  const pressDigit = useCallback((digit: string) => {
    setRound((current) => {
      if (!current || current.feedback) return current;
      if (current.entry.length >= MAX_ENTRY_LENGTH) return current;
      // Behave like a calculator: a leading zero is replaced, not extended.
      const entry = current.entry === '0' ? digit : current.entry + digit;
      return { ...current, entry };
    });
  }, []);

  const deleteDigit = useCallback(() => {
    setRound((current) => {
      if (!current || current.feedback) return current;
      return { ...current, entry: current.entry.slice(0, -1) };
    });
  }, []);

  const submit = useCallback(() => {
    if (!category || !round || round.feedback || round.entry === '') return;

    const correct = Number.parseInt(round.entry, 10) === round.problem.answer;

    setRound((current) =>
      current
        ? {
            ...current,
            feedback: correct
              ? { status: 'correct' }
              : { status: 'wrong', correctAnswer: current.problem.answer },
          }
        : current,
    );

    clearTimer();
    timerRef.current = setTimeout(
      () => {
        timerRef.current = null;
        setRound((current) =>
          current
            ? {
                problem: generateProblem(category, mode),
                problemId: current.problemId + 1,
                entry: '',
                feedback: null,
              }
            : current,
        );
      },
      correct ? CORRECT_PAUSE_MS : WRONG_PAUSE_MS,
    );
  }, [category, clearTimer, mode, round]);

  // Physical keyboard mirrors the on-screen keypad.
  const handlers = useRef({ pressDigit, deleteDigit, submit, quit, playing: false });
  handlers.current = { pressDigit, deleteDigit, submit, quit, playing: category !== null };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!handlers.current.playing) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      // Enter on a focused control (mode toggle, back) should activate it. Only
      // the keypad treats Enter as "submit" no matter what holds focus.
      if (event.key === 'Enter') {
        const active = document.activeElement;
        if (active instanceof HTMLButtonElement && !active.closest('[data-keypad]')) return;
      }

      if (event.key >= '0' && event.key <= '9' && event.key.length === 1) {
        handlers.current.pressDigit(event.key);
      } else if (event.key === 'Backspace') {
        handlers.current.deleteDigit();
      } else if (event.key === 'Enter' || event.key === '=') {
        handlers.current.submit();
      } else if (event.key === 'Escape') {
        handlers.current.quit();
      } else {
        return;
      }
      event.preventDefault();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const activeCategory = CATEGORIES.find((entry) => entry.key === category) ?? null;

  return (
    <>
      <header className={styles.header}>
        <span className={styles.wordmark}>Mental&nbsp;Math</span>
        {activeCategory && (
          <button type="button" className={styles.back} onClick={quit}>
            ←&nbsp;&nbsp;categories
          </button>
        )}
      </header>

      <main className={styles.main}>
        {activeCategory && round ? (
          <PlayView
            category={activeCategory}
            mode={mode}
            problem={round.problem}
            problemId={round.problemId}
            entry={round.entry}
            feedback={round.feedback}
            onModeChange={changeMode}
            onDigit={pressDigit}
            onDelete={deleteDigit}
            onSubmit={submit}
          />
        ) : (
          <>
            <div className={styles.modeRow}>
              <ModeToggle mode={mode} onChange={changeMode} />
            </div>
            <CategoryGrid categories={CATEGORIES} mode={mode} onSelect={start} />
          </>
        )}
      </main>
    </>
  );
}
