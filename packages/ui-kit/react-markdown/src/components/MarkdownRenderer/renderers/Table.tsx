/**
 * Table renderer component
 *
 * Renders markdown tables with responsive styling.
 */

import type { ReactNode } from 'react';
import styles from '../MarkdownRenderer.module.css';

export interface TableProps {
  /** Table content (thead, tbody) */
  children: ReactNode;
}

export function Table({ children }: TableProps) {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>{children}</table>
    </div>
  );
}

export interface TableHeadProps {
  children: ReactNode;
}

export function TableHead({ children }: TableHeadProps) {
  return <thead className={styles.tableHead}>{children}</thead>;
}

export interface TableBodyProps {
  children: ReactNode;
}

export function TableBody({ children }: TableBodyProps) {
  return <tbody className={styles.tableBody}>{children}</tbody>;
}

export interface TableRowProps {
  children: ReactNode;
}

export function TableRow({ children }: TableRowProps) {
  return <tr className={styles.tableRow}>{children}</tr>;
}

export interface TableCellProps {
  children: ReactNode;
  isHeader?: boolean;
  align?: 'left' | 'center' | 'right';
}

export function TableCell({ children, isHeader, align }: TableCellProps) {
  const Tag = isHeader ? 'th' : 'td';
  return (
    <Tag
      className={isHeader ? styles.tableHeaderCell : styles.tableCell}
      style={{ textAlign: align }}
    >
      {children}
    </Tag>
  );
}

export default Table;
