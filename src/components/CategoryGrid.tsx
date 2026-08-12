import type { Category, CategoryKey, Mode } from '../generators';
import styles from './CategoryGrid.module.css';

interface CategoryGridProps {
  categories: readonly Category[];
  /** Decides which sample expression each tile previews. */
  mode: Mode;
  onSelect: (category: CategoryKey) => void;
}

export function CategoryGrid({ categories, mode, onSelect }: CategoryGridProps) {
  return (
    <div className={styles.grid}>
      {categories.map((category) => (
        <button
          key={category.key}
          type="button"
          className={styles.tile}
          onClick={() => onSelect(category.key)}
        >
          <span className={styles.symbol} aria-hidden="true">
            {category.symbol}
          </span>
          <span className={styles.label}>
            <span className={styles.name}>{category.name}</span>
            <span className={styles.sample}>{category.sample[mode]}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
