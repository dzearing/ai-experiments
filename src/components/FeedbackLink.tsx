import { useTheme } from '../contexts/ThemeContextV2';

interface FeedbackLinkProps {
  onClick: () => void;
  className?: string;
}

export function FeedbackLink({ onClick, className = '' }: FeedbackLinkProps) {
  const { currentStyles } = useTheme();
  const styles = currentStyles;

  return (
    <button
      onClick={onClick}
      className={`
        text-sm ${styles.mutedText} hover:${styles.primaryText} 
        transition-colors duration-150 underline-offset-2 hover:underline
        ${className}
      `}
    >
      Leave feedback
    </button>
  );
}