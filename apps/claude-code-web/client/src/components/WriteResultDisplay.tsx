/**
 * WriteResultDisplay component
 *
 * Displays the result of a Write tool execution with file path,
 * success indicator, and expandable content preview.
 */

import { useMemo } from 'react';

import { CodeBlock } from '@ui-kit/react-markdown';
import { ChevronDownIcon } from '@ui-kit/icons/ChevronDownIcon';
import { FileIcon } from '@ui-kit/icons/FileIcon';
import { CheckCircleIcon } from '@ui-kit/icons/CheckCircleIcon';

import { detectLanguage } from '../utils/languageDetection';
import styles from './WriteResultDisplay.module.css';

export interface WriteResultDisplayProps {
  /** Full path to the file that was written */
  filePath: string;
  /** Content that was written to the file */
  content?: string;
  /** Whether the content section is expanded */
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
 * Displays Write tool output with success indicator and expandable content.
 * Header shows file path (clickable) + success indicator + expand/collapse chevron.
 * Content uses CodeBlock with appropriate language detection.
 */
export function WriteResultDisplay({
  filePath,
  content,
  isExpanded,
  onToggleExpand,
  onFileClick,
}: WriteResultDisplayProps) {
  const lineCount = useMemo(() => {
    if (!content) return 0;

    return content.split('\n').length;
  }, [content]);

  const language = useMemo(() => detectLanguage(filePath), [filePath]);

  const fileName = useMemo(() => getFileName(filePath), [filePath]);

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
    <div className={styles.writeResult}>
      <button
        type="button"
        className={styles.header}
        onClick={handleHeaderClick}
        onKeyDown={handleKeyDown}
        aria-expanded={isExpanded}
        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${fileName}`}
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
        <span className={styles.successIndicator}>
          <CheckCircleIcon size={14} />
          <span className={styles.successText}>File written</span>
        </span>
        {content && (
          <>
            <span className={styles.lineCount}>
              {lineCount} {lineCount === 1 ? 'line' : 'lines'}
            </span>
            <span
              className={`${styles.chevron} ${isExpanded ? styles.chevronExpanded : ''}`}
              aria-hidden="true"
            >
              <ChevronDownIcon size={16} />
            </span>
          </>
        )}
      </button>

      {isExpanded && content && (
        <div className={styles.codeContainer}>
          <CodeBlock
            code={content}
            language={language}
            showLineNumbers={true}
            collapsible={lineCount > 50}
            defaultCollapsed={lineCount > 100}
            maxHeight={400}
          />
        </div>
      )}
    </div>
  );
}
