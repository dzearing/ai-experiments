/**
 * SearchResultsDisplay component - displays Grep tool results with file:line links.
 */

import { ChevronDownIcon } from '@ui-kit/icons/ChevronDownIcon';
import { parseGrepOutput } from '../utils/toolResultTransformers';
import { ClickablePath } from './ClickablePath';
import styles from './SearchResultsDisplay.module.css';

/**
 * Maximum length for content preview before truncation.
 */
const MAX_CONTENT_LENGTH = 200;

/**
 * Truncate content to max length with ellipsis if needed.
 */
function truncateContent(content: string): string {
  if (content.length <= MAX_CONTENT_LENGTH) {
    return content;
  }

  return content.slice(0, MAX_CONTENT_LENGTH) + '...';
}

/**
 * Props for the SearchResultsDisplay component.
 */
export interface SearchResultsDisplayProps {
  /** Search pattern that was executed */
  pattern: string;
  /** Raw output from the Grep tool */
  output: string;
  /** Whether the results are expanded */
  isExpanded: boolean;
  /** Callback to toggle expansion state */
  onToggleExpand: () => void;
  /** Callback when a file path is clicked */
  onFileClick?: (path: string, line?: number) => void;
}

/**
 * Renders Grep tool results as a collapsible list of matches.
 *
 * Structure:
 * 1. Header showing search pattern + match count + expand/collapse
 * 2. When expanded: List of matches with file:line links and content preview
 * 3. If truncated: Show indicator
 */
export function SearchResultsDisplay({
  pattern,
  output,
  isExpanded,
  onToggleExpand,
  onFileClick,
}: SearchResultsDisplayProps) {
  const { matches, truncated, totalMatches } = parseGrepOutput(output);

  const handleFileClick = (path: string, line?: number) => {
    onFileClick?.(path, line);
  };

  return (
    <div className={styles.searchResults}>
      <button
        type="button"
        className={styles.searchHeader}
        onClick={onToggleExpand}
        aria-expanded={isExpanded}
      >
        <span className={styles.headerPattern}>{pattern}</span>
        <span className={styles.headerCount}>
          ({totalMatches} match{totalMatches !== 1 ? 'es' : ''})
        </span>
        <span
          className={`${styles.headerChevron} ${isExpanded ? styles.headerChevronExpanded : ''}`}
        >
          <ChevronDownIcon />
        </span>
      </button>

      {isExpanded && (
        <div className={styles.matchList}>
          {matches.map((match, index) => (
            <div key={index} className={styles.matchItem}>
              <div className={styles.matchPath}>
                <ClickablePath
                  path={match.file}
                  lineNumber={match.line}
                  onClick={handleFileClick}
                />
              </div>
              <div className={styles.matchContent}>
                {truncateContent(match.content)}
              </div>
            </div>
          ))}

          {truncated && (
            <div className={styles.truncationIndicator}>
              Results may be truncated (100+ matches)
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchResultsDisplay;
