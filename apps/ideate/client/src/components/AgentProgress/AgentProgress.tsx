/**
 * Shared component for displaying agent progress events.
 * Shows current operation and recent completed operations.
 * Styled like Claude Code's progress display.
 */

import { useState } from 'react';
import type { AgentProgressEvent } from '../../hooks/useAgentProgress';
import styles from './AgentProgress.module.css';

interface AgentProgressProps {
  /** Current active event (tool in progress, thinking, etc.) */
  currentEvent: AgentProgressEvent | null;
  /** Recent completed events for context */
  recentEvents: AgentProgressEvent[];
  /** Whether there's an active operation */
  isProcessing: boolean;
  /** Maximum number of recent events to show */
  maxRecent?: number;
}

/**
 * Single progress item display
 */
function AgentProgressItem({
  event,
  isActive,
}: {
  event: AgentProgressEvent;
  isActive: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails =
    event.codePreview ||
    event.matchedFiles?.length ||
    event.stdout ||
    (event.linesAdded && event.linesAdded > 0) ||
    (event.linesRemoved && event.linesRemoved > 0);

  return (
    <div className={`${styles.item} ${isActive ? styles.active : ''}`}>
      <div
        className={styles.header}
        onClick={() => hasDetails && setExpanded(!expanded)}
        style={{ cursor: hasDetails ? 'pointer' : 'default' }}
      >
        <span className={styles.icon}>
          {isActive ? (
            <span className={styles.spinner} />
          ) : (
            <span className={styles.checkmark}>&#x2713;</span>
          )}
        </span>
        <span className={styles.displayText}>{event.displayText}</span>

        {/* Line change badges */}
        {event.linesAdded !== undefined && event.linesAdded > 0 && (
          <span className={styles.linesAdded}>+{event.linesAdded}</span>
        )}
        {event.linesRemoved !== undefined && event.linesRemoved > 0 && (
          <span className={styles.linesRemoved}>-{event.linesRemoved}</span>
        )}

        {/* Search result count */}
        {event.resultCount !== undefined && (
          <span className={styles.resultCount}>{event.resultCount} matches</span>
        )}

        {/* Expand indicator */}
        {hasDetails && (
          <span className={`${styles.chevron} ${expanded ? styles.expanded : ''}`}>
            &#x25BC;
          </span>
        )}
      </div>

      {/* Expandable details */}
      {expanded && hasDetails && (
        <div className={styles.details}>
          {/* Code preview */}
          {event.codePreview && (
            <pre className={styles.codePreview}>
              <code>{event.codePreview}</code>
            </pre>
          )}

          {/* Matched files */}
          {event.matchedFiles && event.matchedFiles.length > 0 && (
            <div className={styles.fileList}>
              {event.matchedFiles.map((file, i) => (
                <span key={i} className={styles.fileName}>
                  {file}
                </span>
              ))}
            </div>
          )}

          {/* Command output */}
          {event.stdout && (
            <pre className={styles.stdout}>
              <code>{event.stdout}</code>
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Agent progress display component
 */
export function AgentProgress({
  currentEvent,
  recentEvents,
  isProcessing,
  maxRecent = 3,
}: AgentProgressProps) {
  // Show current event + recent events
  const eventsToShow = currentEvent
    ? [currentEvent, ...recentEvents.slice(0, maxRecent - 1)]
    : recentEvents.slice(0, maxRecent);

  // Don't render if nothing to show
  if (eventsToShow.length === 0 && !isProcessing) {
    return null;
  }

  return (
    <div className={styles.container}>
      {eventsToShow.map((event, index) => (
        <AgentProgressItem
          key={event.timestamp}
          event={event}
          isActive={index === 0 && currentEvent !== null}
        />
      ))}
    </div>
  );
}

export default AgentProgress;
