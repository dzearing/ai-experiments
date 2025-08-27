import React from 'react';
import styles from './DiffView.module.css';

export const DiffView: React.FC = () => {
  return (
    <div className={styles.diffView}>
      <div className={styles.header}>
        <h3>Code Diff</h3>
        <div className={styles.fileInfo}>
          src/components/Button.tsx
        </div>
      </div>
      <div className={styles.diffContent}>
        <div className={styles.diffLine}>
          <span className={styles.lineNumber}>42</span>
          <span className={styles.unchanged}>  const handleClick = (e: MouseEvent) {`=> {`}</span>
        </div>
        <div className={`${styles.diffLine} ${styles.removed}`}>
          <span className={styles.lineNumber}>43</span>
          <span className={styles.removedText}>-   console.log('Button clicked');</span>
        </div>
        <div className={`${styles.diffLine} ${styles.added}`}>
          <span className={styles.lineNumber}>43</span>
          <span className={styles.addedText}>+   e.preventDefault();</span>
        </div>
        <div className={`${styles.diffLine} ${styles.added}`}>
          <span className={styles.lineNumber}>44</span>
          <span className={styles.addedText}>+   e.stopPropagation();</span>
        </div>
        <div className={`${styles.diffLine} ${styles.added}`}>
          <span className={styles.lineNumber}>45</span>
          <span className={styles.addedText}>+   if (!disabled) {"{"}</span>
        </div>
        <div className={`${styles.diffLine} ${styles.added}`}>
          <span className={styles.lineNumber}>46</span>
          <span className={styles.addedText}>+     onClick?.(e);</span>
        </div>
        <div className={`${styles.diffLine} ${styles.added}`}>
          <span className={styles.lineNumber}>47</span>
          <span className={styles.addedText}>+   {"}"}</span>
        </div>
        <div className={styles.diffLine}>
          <span className={styles.lineNumber}>48</span>
          <span className={styles.unchanged}>  {"}"};</span>
        </div>
      </div>
      <div className={styles.summary}>
        <span className={styles.additions}>+5</span>
        <span className={styles.deletions}>-1</span>
        <span className={styles.fileName}>Button.tsx</span>
      </div>
    </div>
  );
};