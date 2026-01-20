/**
 * EditResultDisplay component
 *
 * Displays the result of an Edit tool execution with file path,
 * change summary, and expandable diff preview.
 */

import { useMemo } from 'react';

import { FileDiff } from '@ui-kit/react';
import { ChevronDownIcon } from '@ui-kit/icons/ChevronDownIcon';
import { FileIcon } from '@ui-kit/icons/FileIcon';

import { generateInlineDiff } from '../utils/diffGenerator';
import styles from './EditResultDisplay.module.css';

export interface EditResultDisplayProps {
  /** Full path to the file that was edited */
  filePath: string;
  /** Original text that was replaced */
  oldString: string;
  /** New text that replaced the original */
  newString: string;
  /** Whether all occurrences were replaced */
  replaceAll?: boolean;
  /** Whether the diff section is expanded */
  isExpanded: boolean;
  /** Callback to toggle expand/collapse */
  onToggleExpand: () => void;
  /** Callback when file path is clicked */
  onFileClick?: (path: string) => void;
}

/**
 * Extracts the filename from a full path.
 */
function getFileName(path: string): string {
  const parts = path.split(/[/\\]/);

  return parts[parts.length - 1] || path;
}

/**
 * Displays Edit tool output with change summary and inline diff.
 * Header shows file path (clickable) + change summary + expand/collapse chevron.
 * Content uses FileDiff component to show colored diff.
 */
export function EditResultDisplay({
  filePath,
  oldString,
  newString,
  replaceAll = false,
  isExpanded,
  onToggleExpand,
  onFileClick,
}: EditResultDisplayProps) {
  const diffString = useMemo(
    () => generateInlineDiff(oldString, newString),
    [oldString, newString]
  );

  const fileName = useMemo(() => getFileName(filePath), [filePath]);

  const changeSummary = replaceAll ? 'All occurrences replaced' : '1 occurrence replaced';

  const handleFileClick = () => {
    onFileClick?.(filePath);
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
    <div className={styles.editResult}>
      <button
        type="button"
        className={styles.header}
        onClick={handleHeaderClick}
        onKeyDown={handleKeyDown}
        aria-expanded={isExpanded}
        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${fileName} diff`}
      >
        <FileIcon size={16} className={styles.fileIcon} />
        <span
          className={styles.filePath}
          onClick={(e) => {
            e.stopPropagation();
            handleFileClick();
          }}
          title={filePath}
          role="link"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.stopPropagation();
              handleFileClick();
            }
          }}
        >
          {fileName}
        </span>
        <span className={styles.changeSummary}>
          {changeSummary}
        </span>
        <span
          className={`${styles.chevron} ${isExpanded ? styles.chevronExpanded : ''}`}
          aria-hidden="true"
        >
          <ChevronDownIcon size={16} />
        </span>
      </button>

      {isExpanded && (
        <div className={styles.diffContainer}>
          <FileDiff
            path={filePath}
            changeType="modified"
            diff={diffString}
            showHeader={false}
            compact={true}
            maxHeight="400px"
          />
        </div>
      )}
    </div>
  );
}
