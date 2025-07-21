import { memo, useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContextV2';

export interface ProgressIndicatorProps {
  startTime: Date;
  tokenCount?: number;
  status?: string;
  onCancel?: () => void;
}

export const ProgressIndicator = memo(function ProgressIndicator({
  startTime,
  tokenCount,
  status = 'Thinking',
  onCancel,
}: ProgressIndicatorProps) {
  const { currentStyles } = useTheme();
  const styles = currentStyles;
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
      setElapsedSeconds(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onCancel) {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const formatElapsedTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatTokenCount = (count: number) => {
    if (count < 1000) return `${count} tokens`;
    return `${(count / 1000).toFixed(1)}k tokens`;
  };

  return (
    <div className={`flex items-center justify-center py-4 ${styles.textColor}`}>
      <div className="flex items-center gap-3">
        <svg className="w-5 h-5 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <div className="flex items-center gap-2 text-sm">
          <span className={styles.textColor}>{status}…</span>
          <span className={styles.mutedText}>
            ({formatElapsedTime(elapsedSeconds)}
            {tokenCount && tokenCount > 0 && ` · ↓ ${formatTokenCount(tokenCount)}`}
            {onCancel && ' · esc to interrupt'})
          </span>
        </div>
      </div>
    </div>
  );
});
