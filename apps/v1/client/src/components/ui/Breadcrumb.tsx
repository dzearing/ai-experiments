import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContextV2';
import type { BreadcrumbItem } from '../../contexts/LayoutContext';

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  const { currentStyles } = useTheme();
  const styles = currentStyles;

  if (items.length === 0) return null;

  return (
    <nav className="flex items-center gap-2" aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={index} className="flex items-center gap-2">
            {item.path && !isLast ? (
              <Link
                to={item.path}
                className={`${styles.linkText || 'text-blue-600 dark:text-blue-400'} hover:underline transition-colors`}
              >
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? styles.headingColor : styles.textColor}>{item.label}</span>
            )}

            {!isLast && (
              <svg
                className={`w-4 h-4 ${styles.mutedText}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
          </div>
        );
      })}
    </nav>
  );
}
