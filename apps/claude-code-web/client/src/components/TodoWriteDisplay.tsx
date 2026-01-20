/**
 * TodoWriteDisplay component
 *
 * Displays the result of a TodoWrite tool execution with a task list
 * showing status indicators for each todo item (pending/in_progress/completed).
 */

import { useMemo } from 'react';

import { ChevronDownIcon } from '@ui-kit/icons/ChevronDownIcon';
import { CheckCircleIcon } from '@ui-kit/icons/CheckCircleIcon';
import { SpinnerIcon } from '@ui-kit/icons/SpinnerIcon';
import { ListTaskIcon } from '@ui-kit/icons/ListTaskIcon';

import styles from './TodoWriteDisplay.module.css';

/** Status of a todo item */
export type TodoStatus = 'pending' | 'in_progress' | 'completed';

/** A single todo item from the TodoWrite tool */
export interface TodoItem {
  content: string;
  status: TodoStatus;
  activeForm?: string;
}

export interface TodoWriteDisplayProps {
  /** List of todo items */
  todos: TodoItem[];
  /** Whether the content section is expanded */
  isExpanded: boolean;
  /** Callback to toggle expand/collapse */
  onToggleExpand: () => void;
}

/**
 * Status icon component for a todo item.
 */
function StatusIcon({ status }: { status: TodoStatus }) {
  switch (status) {
    case 'completed':
      return <CheckCircleIcon size={14} className={styles.completedIcon} />;
    case 'in_progress':
      return <SpinnerIcon size={14} className={styles.inProgressIcon} />;
    case 'pending':
    default:
      return <span className={styles.pendingIcon} aria-hidden="true" />;
  }
}

/**
 * Displays TodoWrite tool output with task list and status indicators.
 * Header shows summary count. Expanded state shows full list with status.
 */
export function TodoWriteDisplay({
  todos,
  isExpanded,
  onToggleExpand,
}: TodoWriteDisplayProps) {
  const { total, completed, inProgress } = useMemo(() => {
    let completedCount = 0;
    let inProgressCount = 0;

    for (const todo of todos) {
      if (todo.status === 'completed') {
        completedCount++;
      } else if (todo.status === 'in_progress') {
        inProgressCount++;
      }
    }

    return {
      total: todos.length,
      completed: completedCount,
      inProgress: inProgressCount,
    };
  }, [todos]);

  const summaryText = useMemo(() => {
    const parts: string[] = [];

    parts.push(`${total} task${total === 1 ? '' : 's'}`);

    if (completed > 0) {
      parts.push(`${completed} completed`);
    }

    if (inProgress > 0) {
      parts.push(`${inProgress} in progress`);
    }

    return parts.join(' \u2022 ');
  }, [total, completed, inProgress]);

  const handleHeaderClick = () => {
    onToggleExpand();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onToggleExpand();
    }
  };

  if (todos.length === 0) {
    return (
      <div className={styles.todoResult}>
        <div className={styles.emptyState}>
          <ListTaskIcon size={16} className={styles.emptyIcon} />
          <span>No tasks</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.todoResult}>
      <button
        type="button"
        className={styles.header}
        onClick={handleHeaderClick}
        onKeyDown={handleKeyDown}
        aria-expanded={isExpanded}
        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} task list`}
      >
        <ListTaskIcon size={16} className={styles.taskIcon} />
        <span className={styles.title}>Tasks</span>
        <span className={styles.summary}>{summaryText}</span>
        <span
          className={`${styles.chevron} ${isExpanded ? styles.chevronExpanded : ''}`}
          aria-hidden="true"
        >
          <ChevronDownIcon size={16} />
        </span>
      </button>

      {isExpanded && (
        <ul className={styles.taskList} role="list">
          {todos.map((todo, index) => (
            <li
              key={index}
              className={`${styles.taskItem} ${todo.status === 'completed' ? styles.taskCompleted : ''} ${todo.status === 'in_progress' ? styles.taskInProgress : ''}`}
            >
              <StatusIcon status={todo.status} />
              <span className={styles.taskContent}>{todo.content}</span>
              {todo.activeForm && (
                <span className={styles.activeForm}>{todo.activeForm}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
