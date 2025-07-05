import { useTheme } from '../../contexts/ThemeContextV2';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  showContainer?: boolean;
  className?: string;
}

export function LoadingSpinner({ 
  size = 'medium', 
  text, 
  showContainer = false,
  className = ''
}: LoadingSpinnerProps) {
  const { currentStyles } = useTheme();
  const styles = currentStyles;

  // Size configurations
  const sizeClasses = {
    small: {
      spinner: 'h-4 w-4 border-2',
      container: 'p-4',
      textSize: 'text-sm'
    },
    medium: {
      spinner: 'h-8 w-8 border-2',
      container: 'p-8',
      textSize: 'text-base'
    },
    large: {
      spinner: 'h-12 w-12 border-b-2',
      container: 'p-12',
      textSize: 'text-lg'
    }
  };

  const spinnerElement = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`animate-spin rounded-full ${sizeClasses[size].spinner} border-current border-t-transparent`} />
      {text && (
        <p className={`mt-2 ${styles.mutedText} ${sizeClasses[size].textSize}`}>
          {text}
        </p>
      )}
    </div>
  );

  if (showContainer) {
    return (
      <div className={`
        ${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius}
        ${styles.cardShadow} ${sizeClasses[size].container} text-center
      `}>
        {spinnerElement}
      </div>
    );
  }

  return spinnerElement;
}

// Convenience components for common use cases
export function PageLoadingSpinner({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[400px]">
      <LoadingSpinner size="large" text={text} />
    </div>
  );
}

export function InlineLoadingSpinner({ className = "" }: { className?: string }) {
  return <LoadingSpinner size="small" className={className} />;
}