import React from 'react';
import { FileIcon, FolderIcon, CodeIcon } from '@claude-flow/ui-kit-icons';
import styles from './ContextView.module.css';

export const ContextView: React.FC = () => {
  return (
    <div className={styles.contextView}>
      <div className={styles.header}>
        <h3>Context Files</h3>
        <span className={styles.count}>12 files</span>
      </div>
      <div className={styles.fileList}>
        <div className={styles.fileItem}>
          <FolderIcon size={16} />
          <span>src/components</span>
          <span className={styles.fileSize}>4 files</span>
        </div>
        <div className={styles.fileItem}>
          <FileIcon size={16} />
          <span>package.json</span>
          <span className={styles.fileSize}>2.4 KB</span>
        </div>
        <div className={styles.fileItem}>
          <CodeIcon size={16} />
          <span>tsconfig.json</span>
          <span className={styles.fileSize}>1.1 KB</span>
        </div>
        <div className={styles.fileItem}>
          <FileIcon size={16} />
          <span>README.md</span>
          <span className={styles.fileSize}>5.2 KB</span>
        </div>
      </div>
    </div>
  );
};