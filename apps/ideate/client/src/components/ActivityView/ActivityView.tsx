import { useState, useMemo, useCallback, useEffect } from 'react';
import { Spinner, FileDiff, type FileChangeType as FileDiffChangeType } from '@ui-kit/react';
import { FileIcon } from '@ui-kit/icons/FileIcon';
import { AddIcon } from '@ui-kit/icons/AddIcon';
import { EditIcon } from '@ui-kit/icons/EditIcon';
import { TrashIcon } from '@ui-kit/icons/TrashIcon';
import { ArrowRightIcon } from '@ui-kit/icons/ArrowRightIcon';
import { ClockIcon } from '@ui-kit/icons/ClockIcon';
import { CodeIcon } from '@ui-kit/icons/CodeIcon';
import type { Revision, FileChangeType } from './types';
import styles from './ActivityView.module.css';

export interface ActivityViewProps {
  /** List of revisions to display */
  revisions: Revision[];
  /** Whether data is loading */
  isLoading?: boolean;
  /** Error message if any */
  error?: string | null;
  /** Initially selected revision ID */
  initialRevisionId?: string;
  /** Initially selected file path */
  initialFilePath?: string;
  /** Callback when revision is selected */
  onRevisionSelect?: (revisionId: string) => void;
  /** Callback when file is selected */
  onFileSelect?: (revisionId: string, filePath: string) => void;
  /** Callback to fetch diff for a file (async) */
  fetchDiff?: (commitHash: string, filePath: string) => Promise<string | null>;
  /** Additional CSS class */
  className?: string;
}

/**
 * Format timestamp to relative time (e.g., "2 hours ago")
 */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

/**
 * Get the directory and filename from a path
 */
function splitPath(path: string): { dir: string; name: string } {
  const lastSlash = path.lastIndexOf('/');
  if (lastSlash === -1) {
    return { dir: '', name: path };
  }
  return {
    dir: path.substring(0, lastSlash),
    name: path.substring(lastSlash + 1),
  };
}

/**
 * Get icon for file change type
 */
function FileChangeIcon({ type }: { type: FileChangeType }) {
  switch (type) {
    case 'added':
      return <AddIcon size={14} className={`${styles.fileIcon} ${styles.added}`} />;
    case 'modified':
      return <EditIcon size={14} className={`${styles.fileIcon} ${styles.modified}`} />;
    case 'deleted':
      return <TrashIcon size={14} className={`${styles.fileIcon} ${styles.deleted}`} />;
    case 'renamed':
      return <ArrowRightIcon size={14} className={`${styles.fileIcon} ${styles.renamed}`} />;
    default:
      return <FileIcon size={14} className={styles.fileIcon} />;
  }
}

/**
 * ActivityView component
 *
 * Three-column layout for viewing execution activity:
 * 1. Revisions list (left) - Shows commits/checkpoints made during execution
 * 2. Files list (middle) - Shows files changed in the selected revision
 * 3. Diff view (right) - Shows the diff for the selected file
 */
export function ActivityView({
  revisions,
  isLoading = false,
  error = null,
  initialRevisionId,
  initialFilePath,
  onRevisionSelect,
  onFileSelect,
  fetchDiff,
  className,
}: ActivityViewProps) {
  // Selected revision and file
  const [selectedRevisionId, setSelectedRevisionId] = useState<string | null>(
    initialRevisionId || (revisions.length > 0 ? revisions[0].id : null)
  );
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(initialFilePath || null);

  // Diff state
  const [loadedDiff, setLoadedDiff] = useState<string | null>(null);
  const [isDiffLoading, setIsDiffLoading] = useState(false);

  // Get selected revision
  const selectedRevision = useMemo(() => {
    if (!selectedRevisionId) return null;
    return revisions.find(r => r.id === selectedRevisionId) || null;
  }, [revisions, selectedRevisionId]);

  // Get selected file (with loaded diff if available)
  const selectedFile = useMemo(() => {
    if (!selectedRevision || !selectedFilePath) return null;
    const file = selectedRevision.files.find(f => f.path === selectedFilePath);
    if (!file) return null;
    // Return file with loaded diff if available
    return loadedDiff !== null ? { ...file, diff: loadedDiff } : file;
  }, [selectedRevision, selectedFilePath, loadedDiff]);

  // Fetch diff when file is selected
  useEffect(() => {
    if (!selectedRevisionId || !selectedFilePath || !fetchDiff) {
      setLoadedDiff(null);
      return;
    }

    setIsDiffLoading(true);
    setLoadedDiff(null);

    fetchDiff(selectedRevisionId, selectedFilePath)
      .then((diff) => {
        setLoadedDiff(diff);
      })
      .catch((err) => {
        console.error('[ActivityView] Error fetching diff:', err);
        setLoadedDiff(null);
      })
      .finally(() => {
        setIsDiffLoading(false);
      });
  }, [selectedRevisionId, selectedFilePath, fetchDiff]);

  // Handle revision selection
  const handleRevisionClick = useCallback((revisionId: string) => {
    setSelectedRevisionId(revisionId);
    setSelectedFilePath(null); // Reset file selection
    setLoadedDiff(null);
    onRevisionSelect?.(revisionId);
  }, [onRevisionSelect]);

  // Handle file selection
  const handleFileClick = useCallback((filePath: string) => {
    setSelectedFilePath(filePath);
    if (selectedRevisionId) {
      onFileSelect?.(selectedRevisionId, filePath);
    }
  }, [selectedRevisionId, onFileSelect]);

  // Loading state
  if (isLoading) {
    return (
      <div className={`${styles.activityView} ${className || ''}`}>
        <div className={styles.loading}>
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`${styles.activityView} ${className || ''}`}>
        <div className={styles.emptyState}>
          <h3>Error Loading Activity</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (revisions.length === 0) {
    return (
      <div className={`${styles.activityView} ${className || ''}`}>
        <div className={styles.emptyState}>
          <h3>No Activity Yet</h3>
          <p>File changes will appear here as the execution agent makes progress.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.activityView} ${className || ''}`}>
      {/* Revisions column */}
      <div className={styles.revisionsColumn}>
        <div className={styles.columnHeader}>
          <ClockIcon size={16} />
          <span className={styles.columnTitle}>Revisions</span>
          <span className={styles.columnCount}>{revisions.length}</span>
        </div>
        <div className={styles.columnContent}>
          <ul className={styles.revisionList}>
            {revisions.map((revision) => (
              <li
                key={revision.id}
                className={`${styles.revisionItem} ${
                  selectedRevisionId === revision.id ? styles.selected : ''
                }`}
                onClick={() => handleRevisionClick(revision.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleRevisionClick(revision.id);
                  }
                }}
              >
                <div className={styles.revisionHeader}>
                  <span className={styles.revisionId}>{revision.shortId}</span>
                  <span className={styles.revisionTime}>
                    {formatRelativeTime(revision.timestamp)}
                  </span>
                </div>
                <div className={styles.revisionMessage}>{revision.message}</div>
                <div className={styles.revisionStats}>
                  <span className={styles.statAdditions}>+{revision.totalAdditions}</span>
                  <span className={styles.statDeletions}>-{revision.totalDeletions}</span>
                  <span className={styles.statFiles}>
                    {revision.files.length} {revision.files.length === 1 ? 'file' : 'files'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Files column */}
      <div className={styles.filesColumn}>
        <div className={styles.columnHeader}>
          <FileIcon size={16} />
          <span className={styles.columnTitle}>Files Changed</span>
          {selectedRevision && (
            <span className={styles.columnCount}>{selectedRevision.files.length}</span>
          )}
        </div>
        <div className={styles.columnContent}>
          {selectedRevision ? (
            <ul className={styles.fileList}>
              {selectedRevision.files.map((file) => {
                const { dir, name } = splitPath(file.path);
                return (
                  <li
                    key={file.id}
                    className={`${styles.fileItem} ${
                      selectedFilePath === file.path ? styles.selected : ''
                    }`}
                    onClick={() => handleFileClick(file.path)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleFileClick(file.path);
                      }
                    }}
                  >
                    <FileChangeIcon type={file.type} />
                    <div className={styles.fileInfo}>
                      <div className={styles.fileName}>{name}</div>
                      {dir && <div className={styles.filePath}>{dir}</div>}
                    </div>
                    <div className={styles.fileStats}>
                      <span className={styles.statAdditions}>+{file.additions}</span>
                      <span className={styles.statDeletions}>-{file.deletions}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className={styles.placeholder}>
              <FileIcon size={32} className={styles.placeholderIcon} />
              <span className={styles.placeholderText}>Select a revision to view files</span>
            </div>
          )}
        </div>
      </div>

      {/* Diff column */}
      <div className={styles.diffColumn}>
        <div className={styles.columnHeader}>
          <CodeIcon size={16} />
          <span className={styles.columnTitle}>Diff</span>
        </div>
        <div className={styles.diffContent}>
          {isDiffLoading ? (
            <div className={styles.placeholder}>
              <Spinner size="lg" />
              <span className={styles.placeholderText}>Loading diff...</span>
            </div>
          ) : selectedFile && selectedFile.diff ? (
            <FileDiff
              path={selectedFile.path}
              oldPath={selectedFile.oldPath}
              changeType={selectedFile.type as FileDiffChangeType}
              diff={selectedFile.diff}
              additions={selectedFile.additions}
              deletions={selectedFile.deletions}
              showHeader={true}
              className={styles.fileDiff}
            />
          ) : selectedFile ? (
            <div className={styles.placeholder}>
              <CodeIcon size={32} className={styles.placeholderIcon} />
              <span className={styles.placeholderText}>No diff available for this file</span>
            </div>
          ) : (
            <div className={styles.placeholder}>
              <CodeIcon size={32} className={styles.placeholderIcon} />
              <span className={styles.placeholderText}>Select a file to view diff</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

ActivityView.displayName = 'ActivityView';

export default ActivityView;
