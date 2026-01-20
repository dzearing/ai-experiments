/**
 * WebSearchResultDisplay component
 *
 * Displays web search results from the WebSearch tool.
 * Shows the search query and expandable results content.
 */

import { ChevronDownIcon } from '@ui-kit/icons/ChevronDownIcon';
import { SearchIcon } from '@ui-kit/icons/SearchIcon';

import styles from './WebSearchResultDisplay.module.css';

/**
 * Props for the WebSearchResultDisplay component.
 */
export interface WebSearchResultDisplayProps {
  /** The search query that was executed */
  query: string;
  /** SDK returns search results as text */
  output: string;
  /** Optional list of allowed domains for the search */
  allowedDomains?: string[];
  /** Optional list of blocked domains for the search */
  blockedDomains?: string[];
  /** Whether the results are expanded */
  isExpanded: boolean;
  /** Callback to toggle expansion state */
  onToggleExpand: () => void;
}

/**
 * Parses URLs from text and wraps them in anchor tags.
 * Returns an array of text and link elements for rendering.
 */
function parseUrlsFromText(text: string): Array<{ type: 'text' | 'link'; content: string }> {
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
  const parts: Array<{ type: 'text' | 'link'; content: string }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = urlRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }

    parts.push({ type: 'link', content: match[0] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return parts;
}

/**
 * Renders web search results with expandable content.
 *
 * Structure:
 * 1. Header showing search query with search icon + expand/collapse
 * 2. Optional domain filter info
 * 3. When expanded: Results content with clickable URLs
 */
export function WebSearchResultDisplay({
  query,
  output,
  allowedDomains,
  blockedDomains,
  isExpanded,
  onToggleExpand,
}: WebSearchResultDisplayProps) {
  const hasFilters = (allowedDomains && allowedDomains.length > 0) ||
    (blockedDomains && blockedDomains.length > 0);

  const parsedOutput = parseUrlsFromText(output);

  return (
    <div className={styles.webSearch}>
      <button
        type="button"
        className={styles.header}
        onClick={onToggleExpand}
        aria-expanded={isExpanded}
      >
        <SearchIcon size={16} className={styles.icon} />
        <span className={styles.query}>{query}</span>
        <span
          className={`${styles.chevron} ${isExpanded ? styles.chevronExpanded : ''}`}
        >
          <ChevronDownIcon size={16} />
        </span>
      </button>

      {hasFilters && (
        <div className={styles.filters}>
          {allowedDomains && allowedDomains.length > 0 && (
            <span className={styles.filterItem}>
              Allowed: {allowedDomains.join(', ')}
            </span>
          )}
          {blockedDomains && blockedDomains.length > 0 && (
            <span className={styles.filterItem}>
              Blocked: {blockedDomains.join(', ')}
            </span>
          )}
        </div>
      )}

      {isExpanded && output && (
        <div className={styles.results}>
          <div className={styles.content}>
            {parsedOutput.map((part, index) =>
              part.type === 'link' ? (
                <a
                  key={index}
                  href={part.content}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.link}
                >
                  {part.content}
                </a>
              ) : (
                <span key={index}>{part.content}</span>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default WebSearchResultDisplay;
