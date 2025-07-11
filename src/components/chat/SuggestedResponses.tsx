import { memo } from 'react';
import { useTheme } from '../../contexts/ThemeContextV2';

interface SuggestedResponsesProps {
  responses: string[];
  onSelect: (response: string) => void;
  disabled?: boolean;
}

export const SuggestedResponses = memo(function SuggestedResponses({
  responses,
  onSelect,
  disabled = false
}: SuggestedResponsesProps) {
  const { currentStyles } = useTheme();
  const styles = currentStyles;
  
  if (!responses || responses.length === 0) return null;
  
  return (
    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
      {responses.map((response, index) => (
        <button
          key={index}
          onClick={() => onSelect(response)}
          disabled={disabled}
          className={`
            px-3 py-1.5 text-sm whitespace-nowrap select-none
            ${styles.contentBg} ${styles.contentBorder} border
            ${styles.textColor} ${styles.buttonRadius}
            hover:bg-gray-100 dark:hover:bg-gray-700
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors duration-150
          `}
        >
          {response}
        </button>
      ))}
    </div>
  );
});