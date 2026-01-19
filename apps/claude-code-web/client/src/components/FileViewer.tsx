/**
 * FileViewer component - displays file content with syntax highlighting.
 * Renders as a panel/modal overlay when a file is selected.
 */

import { useEffect } from 'react';
import { IconButton } from '@ui-kit/react';
import { CloseIcon } from '@ui-kit/icons/CloseIcon';
import { CodeBlock } from '@ui-kit/react-markdown';
import { useFileContent } from '../hooks/useFileContent';
import { detectLanguage } from '../utils/languageDetection';
import styles from './FileViewer.module.css';

export interface FileViewerProps {
  /** Path of the file to display, or null to hide the viewer */
  filePath: string | null;
  /** Callback when the viewer is closed */
  onClose: () => void;
}

/**
 * Extracts the filename from a path.
 *
 * @param path - Full file path
 * @returns Just the filename portion
 */
function getFilename(path: string): string {
  const lastSlash = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));

  return lastSlash >= 0 ? path.slice(lastSlash + 1) : path;
}

/**
 * FileViewer displays file content with syntax highlighting.
 * Shows when filePath is provided, hidden when null.
 *
 * @example
 * ```tsx
 * <FileViewer
 *   filePath={selectedFile}
 *   onClose={() => setSelectedFile(null)}
 * />
 * ```
 */
export function FileViewer({ filePath, onClose }: FileViewerProps) {
  const { fileContent, isLoading, error, loadFile, clearFile } = useFileContent();

  // Load file when path changes
  useEffect(() => {
    if (filePath) {
      loadFile(filePath);
    } else {
      clearFile();
    }
  }, [filePath, loadFile, clearFile]);

  // Handle escape key to close
  useEffect(() => {
    if (!filePath) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [filePath, onClose]);

  // Don't render if no file is selected
  if (!filePath) {
    return null;
  }

  const language = detectLanguage(filePath);
  const filename = getFilename(filePath);

  return (
    <div className={styles.fileViewer} role="dialog" aria-label={`Viewing ${filename}`}>
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />

      <div className={styles.panel}>
        <header className={styles.header}>
          <div className={styles.headerInfo}>
            <span className={styles.filename}>{filename}</span>
            <span className={styles.filepath}>{filePath}</span>
            {fileContent && (
              <span className={styles.meta}>
                {fileContent.lines} lines
              </span>
            )}
          </div>

          <IconButton
            icon={<CloseIcon />}
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close file viewer"
          />
        </header>

        <div className={styles.content}>
          {isLoading && (
            <div className={styles.loadingState}>
              Loading file...
            </div>
          )}

          {error && (
            <div className={styles.errorState}>
              {error}
            </div>
          )}

          {!isLoading && !error && fileContent && (
            <CodeBlock
              code={fileContent.content}
              language={language}
              showLineNumbers={true}
              maxHeight={600}
            />
          )}
        </div>
      </div>
    </div>
  );
}
