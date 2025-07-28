import { memo, useMemo } from 'react';
import * as Diff from 'diff';
import { useTheme } from '../../contexts/ThemeContextV2';

interface DiffViewProps {
  oldText: string;
  newText: string;
  className?: string;
}

export const DiffView = memo(function DiffView({
  oldText,
  newText,
  className = '',
}: DiffViewProps) {
  const { currentStyles } = useTheme();
  const styles = currentStyles;

  const diffParts = useMemo(() => {
    return Diff.diffWords(oldText, newText, { ignoreCase: false });
  }, [oldText, newText]);

  return (
    <div className={`text-xs font-mono ${className}`}>
      <pre className={`${styles.borderRadius} p-2 overflow-x-auto whitespace-pre-wrap`}>
        {diffParts.map((part, index) => {
          if (part.added) {
            return (
              <span
                key={index}
                className="bg-green-200 dark:bg-green-900/50 text-green-900 dark:text-green-100"
              >
                {part.value}
              </span>
            );
          } else if (part.removed) {
            return (
              <span
                key={index}
                className="bg-red-200 dark:bg-red-900/50 text-red-900 dark:text-red-100 line-through"
              >
                {part.value}
              </span>
            );
          } else {
            return (
              <span key={index} className={styles.textColor}>
                {part.value}
              </span>
            );
          }
        })}
      </pre>
    </div>
  );
});
