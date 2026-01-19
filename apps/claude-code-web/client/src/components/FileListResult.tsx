/**
 * FileListResult component - displays Glob tool results as a clickable file list.
 */

import { ChevronDownIcon } from '@ui-kit/icons/ChevronDownIcon';
import { parseGlobOutput } from '../utils/toolResultTransformers';
import { ClickablePath } from './ClickablePath';
import styles from './FileListResult.module.css';

/**
 * Props for the FileListResult component.
 */
export interface FileListResultProps {
  /** Glob pattern that was executed */
  pattern: string;
  /** Raw output from the Glob tool */
  output: string;
  /** Whether the file list is expanded */
  isExpanded: boolean;
  /** Callback to toggle expansion state */
  onToggleExpand: () => void;
  /** Callback when a file path is clicked */
  onFileClick?: (path: string) => void;
}

/**
 * Renders Glob tool results as a collapsible, clickable file list.
 *
 * Structure:
 * 1. Header showing pattern + file count + expand/collapse chevron
 * 2. When expanded: List of ClickablePath components for each file
 * 3. If truncated: Show indicator "... and N more files"
 */
export function FileListResult({
  pattern,
  output,
  isExpanded,
  onToggleExpand,
  onFileClick,
}: FileListResultProps) {
  const { files, truncated, totalCount } = parseGlobOutput(output);

  const handleFileClick = (path: string) => {
    onFileClick?.(path);
  };

  const displayedCount = files.length;
  const remainingCount = totalCount - displayedCount;

  return (
    <div className={styles.fileList}>
      <button
        type="button"
        className={styles.fileListHeader}
        onClick={onToggleExpand}
        aria-expanded={isExpanded}
      >
        <span className={styles.headerPattern}>{pattern}</span>
        <span className={styles.headerCount}>
          ({totalCount} file{totalCount !== 1 ? 's' : ''})
        </span>
        <span
          className={`${styles.headerChevron} ${isExpanded ? styles.headerChevronExpanded : ''}`}
        >
          <ChevronDownIcon />
        </span>
      </button>

      {isExpanded && (
        <div className={styles.fileListItems}>
          {files.map((filePath, index) => (
            <div key={index} className={styles.fileItem}>
              <ClickablePath path={filePath} onClick={handleFileClick} />
            </div>
          ))}

          {truncated && remainingCount > 0 && (
            <div className={styles.truncationIndicator}>
              ... and {remainingCount} more file{remainingCount !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FileListResult;
