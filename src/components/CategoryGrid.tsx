import type { Category, CategoryKey } from '../generators';
import styles from './CategoryGrid.module.css';

interface CategoryGridProps {
  categories: readonly Category[];
  onSelect: (category: CategoryKey) => void;
}

export function CategoryGrid({ categories, onSelect }: CategoryGridProps) {
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
            <span className={styles.sample}>{category.sample}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
