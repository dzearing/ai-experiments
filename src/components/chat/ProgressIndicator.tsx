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
  onCancel
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
        <span className="text-2xl animate-pulse">✶</span>
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