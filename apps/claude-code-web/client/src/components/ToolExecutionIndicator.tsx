/**
 * ToolExecutionIndicator component
 *
 * Displays an animated progress indicator while a tool is executing.
 * Shows the tool name with a pulsing animation.
 */

import styles from './ToolExecutionIndicator.module.css';

export interface ToolExecutionIndicatorProps {
  /** Name of the tool being executed */
  toolName: string;
  /** Whether the tool is currently executing */
  isExecuting: boolean;
}

/**
 * Animated indicator shown while a tool is running.
 * Only renders when isExecuting is true.
 */
export function ToolExecutionIndicator({
  toolName,
  isExecuting,
}: ToolExecutionIndicatorProps) {
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
