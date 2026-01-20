/**
 * ToolExecutionIndicator component
 *
 * Displays an animated progress indicator while a tool is executing,
 * or an error state when a tool fails.
 */

import { XCircleIcon } from '@ui-kit/icons/XCircleIcon';

import styles from './ToolExecutionIndicator.module.css';

export interface ToolExecutionIndicatorProps {
  /** Name of the tool being executed */
  toolName: string;
  /** Whether the tool is currently executing */
  isExecuting: boolean;
  /** Whether the tool execution resulted in an error */
  isError?: boolean;
  /** Error message to display when isError is true */
  errorMessage?: string;
}

/**
 * Animated indicator shown while a tool is running,
 * or error state when a tool fails.
 */
export function ToolExecutionIndicator({
  toolName,
  isExecuting,
  isError = false,
  errorMessage,
}: ToolExecutionIndicatorProps) {
  if (isError) {
    return (
      <div className={styles.errorContainer}>
        <XCircleIcon className={styles.errorIcon} />
        <span className={styles.errorText}>
          {toolName} failed
          {errorMessage && `: ${errorMessage}`}
        </span>
      </div>
    );
  }

  if (!isExecuting) {
    return null;
  }

  return (
    <div className={styles.executionIndicator}>
      <span className={styles.spinner} aria-hidden="true" />
      <span className={styles.toolName}>Running {toolName}...</span>
    </div>
  );
}
