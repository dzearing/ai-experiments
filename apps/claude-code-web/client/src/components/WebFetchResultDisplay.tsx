/**
 * WebFetchResultDisplay component
 *
 * Displays fetched web content from the WebFetch tool.
 * Shows the URL, extraction prompt, and AI-processed content.
 */

import { ChevronDownIcon } from '@ui-kit/icons/ChevronDownIcon';
import { GlobeIcon } from '@ui-kit/icons/GlobeIcon';

import styles from './WebFetchResultDisplay.module.css';

/**
 * Props for the WebFetchResultDisplay component.
 */
export interface WebFetchResultDisplayProps {
  /** The URL that was fetched */
  url: string;
  /** The prompt used to extract content */
  prompt: string;
  /** AI-processed content (safe markdown/text) */
  output: string;
  /** Whether the content is expanded */
  isExpanded: boolean;
  /** Callback to toggle expansion state */
  onToggleExpand: () => void;
}

/**
 * Extracts the hostname from a URL for display.
 */
function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/**
 * Renders fetched web content with expandable content area.
 *
 * Structure:
 * 1. Header showing URL hostname as external link + expand/collapse
 * 2. Prompt label showing what was extracted
 * 3. When expanded: AI-processed content
 */
export function WebFetchResultDisplay({
  url,
  prompt,
  output,
  isExpanded,
  onToggleExpand,
}: WebFetchResultDisplayProps) {
  const hostname = getHostname(url);

  return (
    <div className={styles.webFetch}>
      <button
        type="button"
        className={styles.header}
        onClick={onToggleExpand}
        aria-expanded={isExpanded}
      >
        <GlobeIcon size={16} className={styles.icon} />
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.url}
          onClick={(e) => e.stopPropagation()}
          title={url}
        >
          {hostname}
        </a>
        <span
          className={`${styles.chevron} ${isExpanded ? styles.chevronExpanded : ''}`}
        >
          <ChevronDownIcon size={16} />
        </span>
      </button>

      {prompt && (
        <div className={styles.promptLabel}>
          <span className={styles.promptText}>Prompt: {prompt}</span>
        </div>
      )}

      {isExpanded && output && (
        <div className={styles.contentArea}>
          <div className={styles.content}>
            {output}
          </div>
        </div>
      )}
    </div>
  );
}

export default WebFetchResultDisplay;
