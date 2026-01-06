import { useMemo, type ReactNode } from 'react';
import styles from './FileDiff.module.css';

/** Types of file changes */
export type FileChangeType = 'added' | 'modified' | 'deleted' | 'renamed';

/** A parsed diff line */
export interface DiffLine {
  /** Line type */
  type: 'context' | 'addition' | 'deletion' | 'hunk';
  /** Old line number (null for additions) */
  oldLineNum: number | null;
  /** New line number (null for deletions) */
  newLineNum: number | null;
  /** Line content (including +/-/space prefix) */
  content: string;
}

export interface FileDiffProps {
  /** File path */
  path: string;
  /** Old path (for renamed files) */
  oldPath?: string;
  /** Type of change */
  changeType?: FileChangeType;
  /** Unified diff content */
  diff: string;
  /** Number of additions */
  additions?: number;
  /** Number of deletions */
  deletions?: number;
  /** Whether to show header */
  showHeader?: boolean;
  /** Whether to show line numbers */
  showLineNumbers?: boolean;
  /** Whether to use compact styling */
  compact?: boolean;
  /** Maximum height (CSS value) */
  maxHeight?: string;
  /** Custom file icon */
  icon?: ReactNode;
  /** Additional CSS class */
  className?: string;
}

/**
 * Parse unified diff content into structured lines
 */
function parseDiff(diff: string): DiffLine[] {
  const lines = diff.split('\n');
  const result: DiffLine[] = [];
  let oldLineNum = 0;
  let newLineNum = 0;

  for (const line of lines) {
    // Skip file headers (---/+++)
    if (line.startsWith('---') || line.startsWith('+++')) {
      continue;
    }

    // Hunk header
    if (line.startsWith('@@')) {
      const match = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/);
      if (match) {
        oldLineNum = parseInt(match[1], 10);
        newLineNum = parseInt(match[2], 10);
      }
      result.push({
        type: 'hunk',
        oldLineNum: null,
        newLineNum: null,
        content: line,
      });
      continue;
    }

    // Skip "No newline at end of file" messages
    if (line.startsWith('\\')) {
      continue;
    }

    // Addition
    if (line.startsWith('+')) {
      result.push({
        type: 'addition',
        oldLineNum: null,
        newLineNum: newLineNum++,
        content: line,
      });
      continue;
    }

    // Deletion
    if (line.startsWith('-')) {
      result.push({
        type: 'deletion',
        oldLineNum: oldLineNum++,
        newLineNum: null,
        content: line,
      });
      continue;
    }

    // Context line (starts with space or is empty)
    if (line.startsWith(' ') || line === '') {
      result.push({
        type: 'context',
        oldLineNum: oldLineNum++,
        newLineNum: newLineNum++,
        content: line,
      });
    }
  }

  return result;
}

/** File change icon SVGs */
const FileChangeIcons = {
  added: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 4v8M4 8h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  modified: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M12 4L6 10 4 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  deleted: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 8h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  renamed: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 8h8M10 5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

/**
 * FileDiff component
 *
 * Displays a unified diff with syntax highlighting, line numbers,
 * and visual indicators for additions and deletions.
 *
 * Tokens used:
 * - --base-bg, --soft-bg
 * - --success-bg-soft, --success-fg
 * - --danger-bg-soft, --danger-fg
 * - --info-bg-soft, --info-fg
 */
export function FileDiff({
  path,
  oldPath,
  changeType = 'modified',
  diff,
  additions,
  deletions,
  showHeader = true,
  showLineNumbers = true,
  compact = false,
  maxHeight,
  icon,
  className,
}: FileDiffProps) {
  // Parse diff into structured lines
  const diffLines = useMemo(() => parseDiff(diff), [diff]);

  // Calculate additions/deletions if not provided
  const stats = useMemo(() => {
    if (additions !== undefined && deletions !== undefined) {
      return { additions, deletions };
    }
    let add = 0;
    let del = 0;
    for (const line of diffLines) {
      if (line.type === 'addition') add++;
      if (line.type === 'deletion') del++;
    }
    return { additions: add, deletions: del };
  }, [diffLines, additions, deletions]);

  // Empty state
  if (!diff || diffLines.length === 0) {
    return (
      <div className={`${styles.fileDiff} ${compact ? styles.compact : ''} ${className || ''}`}>
        {showHeader && (
          <div className={styles.header}>
            <span className={`${styles.fileIcon} ${styles[changeType]}`}>
              {icon || FileChangeIcons[changeType]}
            </span>
            <span className={styles.filePath}>
              {oldPath ? `${oldPath} → ` : ''}{path}
            </span>
          </div>
        )}
        <div className={styles.empty}>No changes</div>
      </div>
    );
  }

  return (
    <div
      className={`${styles.fileDiff} ${compact ? styles.compact : ''} ${className || ''}`}
      style={maxHeight ? { '--diff-max-height': maxHeight } as React.CSSProperties : undefined}
    >
      {showHeader && (
        <div className={styles.header}>
          <span className={`${styles.fileIcon} ${styles[changeType]}`}>
            {icon || FileChangeIcons[changeType]}
          </span>
          <span className={styles.filePath}>
            {oldPath ? `${oldPath} → ` : ''}{path}
          </span>
          <div className={styles.stats}>
            <span className={styles.additions}>+{stats.additions}</span>
            <span className={styles.deletions}>-{stats.deletions}</span>
          </div>
        </div>
      )}

      <div className={styles.content}>
        <table className={styles.diffTable}>
          <tbody>
            {diffLines.map((line, index) => (
              <tr key={index} className={`${styles.row} ${styles[line.type]}`}>
                {showLineNumbers && (
                  <td className={styles.lineNumbers}>
                    {line.type === 'hunk' ? (
                      '...'
                    ) : (
                      <>
                        <span className={styles.lineOld}>
                          {line.oldLineNum ?? ''}
                        </span>
                        <span className={styles.lineNew}>
                          {line.newLineNum ?? ''}
                        </span>
                      </>
                    )}
                  </td>
                )}
                <td className={styles.codeCell}>
                  {line.content}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

FileDiff.displayName = 'FileDiff';
