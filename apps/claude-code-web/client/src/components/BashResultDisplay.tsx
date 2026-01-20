/**
 * BashResultDisplay component
 *
 * Displays Bash tool output with terminal-style styling and streaming support.
 * Shows command with $ prefix, output in scrollable container, and execution state.
 */

import { useEffect, useMemo, useRef } from 'react';
import { ChevronDownIcon } from '@ui-kit/icons/ChevronDownIcon';
import { TerminalIcon } from '@ui-kit/icons/TerminalIcon';

import styles from './BashResultDisplay.module.css';

export interface BashResultDisplayProps {
  /** The command that was executed */
  command: string;
  /** Accumulated output (updates during streaming) */
  output: string;
  /** Whether the output section is expanded */
  isExpanded: boolean;
  /** Callback to toggle expand/collapse */
  onToggleExpand: () => void;
  /** Optional description of what the command does */
  description?: string;
  /** Whether this is a background task */
  isBackground?: boolean;
  /** Whether the command is still executing */
  isExecuting?: boolean;
  /** Optional timeout in milliseconds */
  timeout?: number;
}

/**
 * Truncates a command string for display in collapsed header.
 */
function truncateCommand(command: string, maxLength: number = 60): string {
  if (command.length <= maxLength) {
    return command;
  }

  return command.slice(0, maxLength - 3) + '...';
}

/**
 * Counts lines in output string.
 */
function countLines(output: string): number {
  if (!output) {
    return 0;
  }

  return output.split('\n').length;
}

/**
 * Displays Bash tool output with terminal styling.
 * Header shows command with $ prefix, line count, and execution state.
 * Content shows scrollable output with auto-scroll during streaming.
 */
export function BashResultDisplay({
  command,
  output,
  isExpanded,
  onToggleExpand,
  description,
  isBackground = false,
  isExecuting = false,
}: BashResultDisplayProps) {
  const outputRef = useRef<HTMLDivElement>(null);
  const wasScrolledToBottomRef = useRef(true);

  const lineCount = useMemo(() => countLines(output), [output]);
  const truncatedCommand = useMemo(() => truncateCommand(command), [command]);

  // Auto-scroll to bottom when new output arrives (if already at bottom)
  useEffect(() => {
    const container = outputRef.current;

    if (!container || !isExpanded || !isExecuting) {
      return;
    }

    // Check if we were scrolled to bottom before this update
    if (wasScrolledToBottomRef.current) {
      container.scrollTop = container.scrollHeight;
    }
  }, [output, isExpanded, isExecuting]);

  // Track scroll position to determine if we should auto-scroll
  const handleScroll = () => {
    const container = outputRef.current;

    if (!container) {
      return;
    }

    const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 5;

    wasScrolledToBottomRef.current = isAtBottom;
  };

  const handleHeaderClick = () => {
    onToggleExpand();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onToggleExpand();
    }
  };

  return (
    <div className={styles.bashResult}>
      <button
        type="button"
        className={styles.bashHeader}
        onClick={handleHeaderClick}
        onKeyDown={handleKeyDown}
        aria-expanded={isExpanded}
        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} bash output`}
      >
        <TerminalIcon size={16} className={styles.terminalIcon} />

        <span className={styles.commandText}>
          <span className={styles.commandPrompt}>$</span>
          {truncatedCommand}
        </span>

        <div className={styles.metaInfo}>
          {isExecuting && (
            <span className={`${styles.statusIndicator} ${styles.executingIndicator}`}>
              <span className={styles.spinner} aria-hidden="true" />
              Running
            </span>
          )}

          {isBackground && !isExecuting && (
            <span className={`${styles.statusIndicator} ${styles.backgroundIndicator}`}>
              <span className={styles.backgroundDot} aria-hidden="true" />
              Background
            </span>
          )}

          {lineCount > 0 && (
            <span className={styles.lineCount}>
              {lineCount} {lineCount === 1 ? 'line' : 'lines'}
            </span>
          )}

          <span
            className={`${styles.chevron} ${isExpanded ? styles.chevronExpanded : ''}`}
            aria-hidden="true"
          >
            <ChevronDownIcon size={16} />
          </span>
        </div>
      </button>

      {isExpanded && (
        <div
          ref={outputRef}
          className={styles.outputContainer}
          onScroll={handleScroll}
        >
          {description && (
            <div className={styles.description}>{description}</div>
          )}

          <pre className={styles.output}>
            {output || <span className={styles.emptyOutput}>(no output)</span>}
          </pre>
        </div>
      )}
    </div>
  );
}
