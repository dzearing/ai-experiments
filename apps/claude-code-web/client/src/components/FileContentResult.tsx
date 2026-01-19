/**
 * FileContentResult component
 *
 * Displays file content from a Read tool result with syntax highlighting.
 * Shows file path as a clickable header with line count and collapse/expand.
 */

import { useMemo } from 'react';
import { CodeBlock } from '@ui-kit/react-markdown';
import { ChevronDownIcon } from '@ui-kit/icons/ChevronDownIcon';
import { FileIcon } from '@ui-kit/icons/FileIcon';

import { detectLanguage } from '../utils/languageDetection';
import styles from './FileContentResult.module.css';

export interface FileContentResultProps {
  /** Full path to the file */
  filePath: string;
  /** File content to display */
  content: string;
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
 * Displays Read tool output with syntax highlighting.
 * Header shows file path (clickable) + line count + expand/collapse chevron.
 * Content uses CodeBlock with appropriate language detection.
 */
export function FileContentResult({
  filePath,
  content,
  isExpanded,
  onToggleExpand,
  onFileClick,
}: FileContentResultProps) {
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
    <div className={styles.fileContent}>
      <button
        type="button"
        className={styles.fileHeader}
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
        <span className={styles.lineCount}>
          {lineCount} {lineCount === 1 ? 'line' : 'lines'}
        </span>
        <span
          className={`${styles.chevron} ${isExpanded ? styles.chevronExpanded : ''}`}
          aria-hidden="true"
        >
          <ChevronDownIcon size={16} />
        </span>
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
