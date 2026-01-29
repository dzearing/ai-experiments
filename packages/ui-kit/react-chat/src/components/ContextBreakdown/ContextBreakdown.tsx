import { useMemo } from 'react';

import styles from './ContextBreakdown.module.css';

/**
 * Token usage statistics for context breakdown.
 */
export interface ContextUsageStats {
  /** Input tokens consumed */
  input_tokens: number;
  /** Output tokens generated */
  output_tokens: number;
  /** Cache read tokens (optional) */
  cache_read_tokens?: number;
  /** Cache write tokens (optional) */
  cache_write_tokens?: number;
}

/**
 * Props for the ContextBreakdown component.
 */
export interface ContextBreakdownProps {
  /** Token usage statistics */
  usage: ContextUsageStats | null;
  /** Maximum context window size (default: 200000) */
  maxTokens?: number;
  /** Session ID to display */
  sessionId?: string | null;
  /** Current permission mode */
  permissionMode?: string;
  /** Model name */
  model?: string;
  /** Whether to show cost estimate (default: true) */
  showCost?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * Pricing for Claude models (per million tokens).
 */
const PRICING = {
  'claude-sonnet-4': { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
  'claude-opus-4': { input: 15, output: 75, cacheRead: 1.5, cacheWrite: 18.75 },
  'default': { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
};

/**
 * Format a number with locale-specific thousands separators.
 */
function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Format token count with k/M suffixes for compact display.
 */
function formatTokens(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }

  if (count >= 1000) {
    return `${Math.round(count / 1000)}k`;
  }

  return count.toString();
}

/**
 * ContextBreakdown displays a detailed visual breakdown of Claude's context usage.
 * Shows token consumption, cost estimates, and session information.
 */
export function ContextBreakdown({
  usage,
  maxTokens = 200000,
  sessionId,
  permissionMode,
  model,
  showCost = true,
  className,
}: ContextBreakdownProps) {
  const stats = useMemo(() => {
    if (!usage) return null;

    const { input_tokens, output_tokens, cache_read_tokens = 0, cache_write_tokens = 0 } = usage;
    const totalTokens = input_tokens + output_tokens;
    const percentage = Math.min((totalTokens / maxTokens) * 100, 100);

    // Determine pricing based on model
    const pricing = model?.includes('opus')
      ? PRICING['claude-opus-4']
      : PRICING['default'];

    // Calculate costs
    const inputCost = (input_tokens / 1_000_000) * pricing.input;
    const outputCost = (output_tokens / 1_000_000) * pricing.output;
    const cacheReadCost = (cache_read_tokens / 1_000_000) * pricing.cacheRead;
    const cacheWriteCost = (cache_write_tokens / 1_000_000) * pricing.cacheWrite;
    const totalCost = inputCost + outputCost + cacheReadCost + cacheWriteCost;

    return {
      input_tokens,
      output_tokens,
      cache_read_tokens,
      cache_write_tokens,
      totalTokens,
      percentage,
      inputCost,
      outputCost,
      cacheReadCost,
      cacheWriteCost,
      totalCost,
    };
  }, [usage, maxTokens, model]);

  const getUsageLevel = (percentage: number): 'low' | 'medium' | 'high' => {
    if (percentage >= 80) return 'high';
    if (percentage >= 50) return 'medium';

    return 'low';
  };

  if (!stats) {
    return (
      <div className={`${styles.container} ${className ?? ''}`}>
        <div className={styles.header}>
          <span className={styles.title}>Context Usage</span>
        </div>
        <div className={styles.empty}>No context data available</div>
      </div>
    );
  }

  const usageLevel = getUsageLevel(stats.percentage);

  return (
    <div className={`${styles.container} ${className ?? ''}`}>
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.title}>Context Usage</span>
        <span className={styles.total}>
          {formatTokens(stats.totalTokens)} / {formatTokens(maxTokens)}
        </span>
      </div>

      {/* Progress Bar */}
      <div className={styles.progressContainer}>
        <div className={styles.progressBar}>
          <div
            className={`${styles.progressFill} ${styles[usageLevel]}`}
            style={{ width: `${stats.percentage}%` }}
            role="progressbar"
            aria-valuenow={stats.totalTokens}
            aria-valuemin={0}
            aria-valuemax={maxTokens}
            aria-label={`Token usage: ${stats.percentage.toFixed(1)}%`}
          />
        </div>
        <span className={`${styles.percentage} ${styles[usageLevel]}`}>
          {stats.percentage.toFixed(1)}%
        </span>
      </div>

      {/* Token Breakdown */}
      <div className={styles.breakdown}>
        <div className={styles.breakdownRow}>
          <span className={styles.label}>
            <span className={`${styles.dot} ${styles.input}`} />
            Input
          </span>
          <span className={styles.value}>{formatNumber(stats.input_tokens)}</span>
          {showCost && <span className={styles.cost}>${stats.inputCost.toFixed(4)}</span>}
        </div>

        <div className={styles.breakdownRow}>
          <span className={styles.label}>
            <span className={`${styles.dot} ${styles.output}`} />
            Output
          </span>
          <span className={styles.value}>{formatNumber(stats.output_tokens)}</span>
          {showCost && <span className={styles.cost}>${stats.outputCost.toFixed(4)}</span>}
        </div>

        {stats.cache_read_tokens > 0 && (
          <div className={styles.breakdownRow}>
            <span className={styles.label}>
              <span className={`${styles.dot} ${styles.cache}`} />
              Cache Read
            </span>
            <span className={styles.value}>{formatNumber(stats.cache_read_tokens)}</span>
            {showCost && <span className={styles.cost}>${stats.cacheReadCost.toFixed(4)}</span>}
          </div>
        )}

        {stats.cache_write_tokens > 0 && (
          <div className={styles.breakdownRow}>
            <span className={styles.label}>
              <span className={`${styles.dot} ${styles.cacheWrite}`} />
              Cache Write
            </span>
            <span className={styles.value}>{formatNumber(stats.cache_write_tokens)}</span>
            {showCost && <span className={styles.cost}>${stats.cacheWriteCost.toFixed(4)}</span>}
          </div>
        )}

        {showCost && (
          <div className={`${styles.breakdownRow} ${styles.totalRow}`}>
            <span className={styles.label}>Total Cost</span>
            <span className={styles.totalCost}>${stats.totalCost.toFixed(4)}</span>
          </div>
        )}
      </div>

      {/* Session Info */}
      {(sessionId || permissionMode || model) && (
        <div className={styles.sessionInfo}>
          {model && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Model</span>
              <span className={styles.infoValue}>{model}</span>
            </div>
          )}
          {permissionMode && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Mode</span>
              <span className={styles.infoValue}>{permissionMode}</span>
            </div>
          )}
          {sessionId && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Session</span>
              <span className={`${styles.infoValue} ${styles.mono}`}>
                {sessionId.length > 20 ? `${sessionId.slice(0, 20)}...` : sessionId}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
