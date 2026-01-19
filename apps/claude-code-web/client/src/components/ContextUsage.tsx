import type { UsageStats } from '../types/agent';
import styles from './ContextUsage.module.css';

interface ContextUsageProps {
  usage: UsageStats | null;
  maxTokens?: number;
  className?: string;
}

/**
 * ContextUsage displays token consumption as a progress bar with color states.
 * - Green: <50% usage
 * - Yellow: 50-80% usage
 * - Red: >80% usage
 */
export function ContextUsage({ usage, maxTokens = 200000, className }: ContextUsageProps) {
  const totalTokens = usage ? usage.input_tokens + usage.output_tokens : 0;
  const percentage = Math.min((totalTokens / maxTokens) * 100, 100);

  const formatTokenCount = (count: number): string => {
    if (count >= 1000) {
      return `${Math.round(count / 1000)}k`;
    }

    return count.toString();
  };

  const getUsageLevel = (): 'low' | 'medium' | 'high' => {
    if (percentage >= 80) return 'high';
    if (percentage >= 50) return 'medium';

    return 'low';
  };

  const usageLevel = getUsageLevel();
  const displayCount = usage ? formatTokenCount(totalTokens) : '--';
  const maxDisplay = formatTokenCount(maxTokens);

  const containerClass = [styles.container, className].filter(Boolean).join(' ');
  const fillClass = [styles.fill, styles[usageLevel]].join(' ');

  return (
    <div className={containerClass}>
      <span className={styles.text}>
        {displayCount} / {maxDisplay} tokens
      </span>
      <div className={styles.progressBar}>
        <div
          className={fillClass}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={totalTokens}
          aria-valuemin={0}
          aria-valuemax={maxTokens}
          aria-label={`Token usage: ${displayCount} of ${maxDisplay}`}
        />
      </div>
    </div>
  );
}
