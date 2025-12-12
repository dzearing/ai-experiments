import { useCallback, type ReactNode } from 'react';
import styles from './Table.module.css';

/**
 * Table component - display tabular data
 *
 * Surfaces used:
 * - panel (table container)
 * - controlSubtle (row hover, sort header)
 * - controlPrimary (selected rows)
 *
 * Tokens used:
 * - --panel-bg, --panel-border
 * - --controlSubtle-bg-hover
 * - --controlPrimary-bg, --controlPrimary-text
 */

export type TableSize = 'sm' | 'md' | 'lg';
export type SortDirection = 'asc' | 'desc';

export interface TableColumn<T = unknown> {
  /** Unique column identifier */
  id: string;
  /** Column header */
  header: ReactNode;
  /** Accessor function or key */
  accessor: keyof T | ((row: T) => ReactNode);
  /** Column width */
  width?: number | string;
  /** Column is sortable */
  sortable?: boolean;
  /** Custom cell renderer */
  cell?: (value: unknown, row: T, index: number) => ReactNode;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
}

export interface TableSort {
  columnId: string;
  direction: SortDirection;
}

export interface TableProps<T = unknown> {
  /** Column definitions */
  columns: TableColumn<T>[];
  /** Data rows */
  data: T[];
  /** Get unique key for each row */
  getRowKey: (row: T, index: number) => string;
  /** Table size */
  size?: TableSize;
  /** Enable row selection */
  selectable?: boolean;
  /** Allow multiple row selection */
  multiSelect?: boolean;
  /** Selected row keys */
  selectedKeys?: string[];
  /** Callback when selection changes */
  onSelectionChange?: (keys: string[]) => void;
  /** Sort state */
  sort?: TableSort | null;
  /** Callback when sort changes */
  onSortChange?: (sort: TableSort | null) => void;
  /** Loading state */
  loading?: boolean;
  /** Empty state message */
  emptyMessage?: ReactNode;
  /** Show borders */
  bordered?: boolean;
  /** Striped rows */
  striped?: boolean;
  /** Additional class name */
  className?: string;
  /** Sticky header */
  stickyHeader?: boolean;
  /** Max height (enables scroll) */
  maxHeight?: string | number;
}

export function Table<T>({
  columns,
  data,
  getRowKey,
  size = 'md',
  selectable = false,
  multiSelect = false,
  selectedKeys = [],
  onSelectionChange,
  sort,
  onSortChange,
  loading = false,
  emptyMessage = 'No data to display',
  bordered = false,
  striped = false,
  className,
  stickyHeader = false,
  maxHeight,
}: TableProps<T>) {
  const handleSort = useCallback(
    (columnId: string) => {
      if (!onSortChange) return;

      if (sort?.columnId === columnId) {
        if (sort.direction === 'asc') {
          onSortChange({ columnId, direction: 'desc' });
        } else {
          onSortChange(null);
        }
      } else {
        onSortChange({ columnId, direction: 'asc' });
      }
    },
    [sort, onSortChange]
  );

  const handleRowSelect = useCallback(
    (key: string) => {
      if (!onSelectionChange) return;

      if (multiSelect) {
        if (selectedKeys.includes(key)) {
          onSelectionChange(selectedKeys.filter((k) => k !== key));
        } else {
          onSelectionChange([...selectedKeys, key]);
        }
      } else {
        if (selectedKeys.includes(key)) {
          onSelectionChange([]);
        } else {
          onSelectionChange([key]);
        }
      }
    },
    [multiSelect, selectedKeys, onSelectionChange]
  );

  const handleSelectAll = useCallback(() => {
    if (!onSelectionChange || !multiSelect) return;

    if (selectedKeys.length === data.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(data.map((row, i) => getRowKey(row, i)));
    }
  }, [data, getRowKey, multiSelect, selectedKeys, onSelectionChange]);

  const getCellValue = (column: TableColumn<T>, row: T): ReactNode => {
    if (typeof column.accessor === 'function') {
      return column.accessor(row);
    }
    return (row as Record<string, ReactNode>)[column.accessor as string];
  };

  const containerClassNames = [
    styles.container,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const tableClassNames = [
    styles.table,
    styles[size],
    bordered && styles.bordered,
    striped && styles.striped,
    stickyHeader && styles.stickyHeader,
  ]
    .filter(Boolean)
    .join(' ');

  const containerStyle = maxHeight
    ? { maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight }
    : undefined;

  return (
    <div className={containerClassNames} style={containerStyle}>
      <table className={tableClassNames}>
        <thead>
          <tr>
            {selectable && multiSelect && (
              <th className={`${styles.checkboxCell} ${styles.header}`}>
                <input
                  type="checkbox"
                  checked={data.length > 0 && selectedKeys.length === data.length}
                  onChange={handleSelectAll}
                  className={styles.checkbox}
                  aria-label="Select all rows"
                />
              </th>
            )}
            {selectable && !multiSelect && <th className={`${styles.checkboxCell} ${styles.header}`} />}
            {columns.map((column) => {
              const isSorted = sort?.columnId === column.id;
              const sortDirection = isSorted ? sort.direction : null;

              return (
                <th
                  key={column.id}
                  className={`${styles.header} ${column.sortable ? styles.sortable : ''} ${column.align ? styles[column.align] : ''}`}
                  style={{ width: column.width }}
                  onClick={column.sortable ? () => handleSort(column.id) : undefined}
                  aria-sort={
                    isSorted
                      ? sortDirection === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : undefined
                  }
                >
                  <span className={styles.headerContent}>
                    {column.header}
                    {column.sortable && (
                      <span className={`${styles.sortIcon} ${isSorted ? styles.active : ''}`}>
                        {sortDirection === 'asc' ? (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M6 3L10 7H2L6 3Z" fill="currentColor" />
                          </svg>
                        ) : sortDirection === 'desc' ? (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M6 9L10 5H2L6 9Z" fill="currentColor" />
                          </svg>
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M6 2L9 5H3L6 2Z" fill="currentColor" />
                            <path d="M6 10L9 7H3L6 10Z" fill="currentColor" />
                          </svg>
                        )}
                      </span>
                    )}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                className={styles.loading}
              >
                <div className={styles.loadingSpinner} />
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                className={styles.empty}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => {
              const key = getRowKey(row, rowIndex);
              const isSelected = selectedKeys.includes(key);

              return (
                <tr
                  key={key}
                  className={`${styles.row} ${isSelected ? styles.selected : ''}`}
                  onClick={selectable ? () => handleRowSelect(key) : undefined}
                  aria-selected={selectable ? isSelected : undefined}
                >
                  {selectable && (
                    <td className={styles.checkboxCell}>
                      <input
                        type={multiSelect ? 'checkbox' : 'radio'}
                        checked={isSelected}
                        onChange={() => handleRowSelect(key)}
                        onClick={(e) => e.stopPropagation()}
                        className={styles.checkbox}
                        aria-label={`Select row ${rowIndex + 1}`}
                      />
                    </td>
                  )}
                  {columns.map((column) => {
                    const value = getCellValue(column, row);
                    const cellContent = column.cell
                      ? column.cell(value, row, rowIndex)
                      : value;

                    return (
                      <td
                        key={column.id}
                        className={`${styles.cell} ${column.align ? styles[column.align] : ''}`}
                      >
                        {cellContent}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
