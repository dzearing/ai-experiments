/**
 * NotebookEditDisplay component
 *
 * Displays notebook edit results from the NotebookEdit tool.
 * Shows the notebook path, cell info, and cell content with syntax highlighting.
 */

import { CodeBlock } from '@ui-kit/react-markdown';
import { ChevronDownIcon } from '@ui-kit/icons/ChevronDownIcon';
import { FileIcon } from '@ui-kit/icons/FileIcon';

import { ClickablePath } from './ClickablePath';
import styles from './NotebookEditDisplay.module.css';

/**
 * Props for the NotebookEditDisplay component.
 */
export interface NotebookEditDisplayProps {
  /** Path to the notebook file */
  notebookPath: string;
  /** Cell ID that was edited */
  cellId?: string;
  /** Type of cell (code or markdown) */
  cellType?: 'code' | 'markdown';
  /** Edit operation type */
  editMode?: 'replace' | 'insert' | 'delete';
  /** New cell source content */
  newSource: string;
  /** Output from the tool execution */
  output: string;
  /** Whether the content is expanded */
  isExpanded: boolean;
  /** Callback to toggle expansion state */
  onToggleExpand: () => void;
  /** Callback when file path is clicked */
  onFileClick?: (path: string) => void;
}

/**
 * Gets a human-readable operation description.
 */
function getOperationDescription(
  editMode?: string,
  cellId?: string
): string {
  const cellRef = cellId ? `cell ${cellId}` : 'cell';

  switch (editMode) {
    case 'replace':
      return `Replaced ${cellRef}`;
    case 'insert':
      return `Inserted ${cellRef}`;
    case 'delete':
      return `Deleted ${cellRef}`;
    default:
      return `Modified ${cellRef}`;
  }
}

/**
 * Extracts the filename from a full path.
 */
function getFileName(path: string): string {
  const parts = path.split(/[/\\]/);

  return parts[parts.length - 1] || path;
}

/**
 * Renders notebook edit results with expandable content.
 *
 * Structure:
 * 1. Header showing notebook path (clickable) + expand/collapse
 * 2. Cell info showing operation type and cell ID
 * 3. When expanded: Cell content with syntax highlighting
 *    - Code cells use Python highlighting (most common for notebooks)
 *    - Markdown cells show as plaintext
 */
export function NotebookEditDisplay({
  notebookPath,
  cellId,
  cellType = 'code',
  editMode,
  newSource,
  output,
  isExpanded,
  onToggleExpand,
  onFileClick,
}: NotebookEditDisplayProps) {
  const fileName = getFileName(notebookPath);
  const operationDescription = getOperationDescription(editMode, cellId);
  const language = cellType === 'code' ? 'python' : 'plaintext';

  const handleFileClick = () => {
    onFileClick?.(notebookPath);
  };

  // Use newSource if available, otherwise show output
  const contentToShow = newSource || output;
  const lineCount = contentToShow ? contentToShow.split('\n').length : 0;

  return (
    <div className={styles.notebookEdit}>
      <button
        type="button"
        className={styles.header}
        onClick={onToggleExpand}
        aria-expanded={isExpanded}
      >
        <FileIcon size={16} className={styles.icon} />
        {onFileClick ? (
          <ClickablePath
            path={fileName}
            onClick={handleFileClick}
            className={styles.path}
          />
        ) : (
          <span className={styles.path} title={notebookPath}>
            {fileName}
          </span>
        )}
        <span
          className={`${styles.chevron} ${isExpanded ? styles.chevronExpanded : ''}`}
        >
          <ChevronDownIcon size={16} />
        </span>
      </button>

      <div className={styles.cellInfo}>
        <span className={styles.operation}>{operationDescription}</span>
        {cellType && (
          <span className={styles.cellType}>
            ({cellType})
          </span>
        )}
      </div>

      {isExpanded && contentToShow && (
        <div className={styles.contentArea}>
          <CodeBlock
            code={contentToShow}
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

export default NotebookEditDisplay;
