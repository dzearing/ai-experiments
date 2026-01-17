import { type ReactNode } from 'react';
import { useTheme } from '../../contexts/ThemeContextV2';

export interface ListItem {
  id: string;
  label: string;
  sublabel?: string;
  icon?: ReactNode;
  disabled?: boolean;
}

interface ListSelectorProps {
  items: ListItem[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  emptyMessage?: string;
  className?: string;
  itemClassName?: string;
}

export function ListSelector({
  items,
  selectedId,
  onSelect,
  emptyMessage = 'No items available',
  className = '',
  itemClassName = '',
}: ListSelectorProps) {
  const { currentStyles } = useTheme();
  const styles = currentStyles;

  if (items.length === 0) {
    return (
      <div className={`p-4 text-center ${styles.mutedText} ${className}`}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => !item.disabled && onSelect(item.id)}
          disabled={item.disabled}
          className={`
            w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all
            ${styles.contentBg} ${styles.contentBorder} border
            ${
              selectedId === item.id
                ? `ring-2 ring-blue-500 dark:ring-blue-400 ${styles.cardBg}`
                : `hover:${styles.cardBg}`
            }
            ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            ${itemClassName}
          `}
        >
          {item.icon && (
            <div className="flex-shrink-0">
              {item.icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className={`font-medium ${styles.headingColor} truncate`}>
              {item.label}
            </div>
            {item.sublabel && (
              <div className={`text-sm ${styles.mutedText} truncate`}>
                {item.sublabel}
              </div>
            )}
          </div>
          {selectedId === item.id && (
            <div className="flex-shrink-0">
              <svg
                className="w-5 h-5 text-blue-500 dark:text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}