import React, { memo } from 'react';
import { useTheme } from '../../contexts/ThemeContextV2';
import { Spinner } from '../ui/Spinner';
import type { Todo } from '../../contexts/ClaudeCodeContext';

interface TodoListProps {
  todos: Todo[];
  onDismiss?: () => void;
}

export const TodoList = memo(function TodoList({ todos, onDismiss }: TodoListProps) {
  const { currentStyles } = useTheme();
  const styles = currentStyles;
  
  // Build hierarchy
  const buildHierarchy = (todos: Todo[]): Todo[] => {
    const todoMap = new Map<string, Todo>();
    const rootTodos: Todo[] = [];
    
    // First pass: create map
    todos.forEach(todo => {
      todoMap.set(todo.id, { ...todo, children: [] });
    });
    
    // Second pass: build hierarchy
    todos.forEach(todo => {
      const todoWithChildren = todoMap.get(todo.id)!;
      if (todo.parentId && todoMap.has(todo.parentId)) {
        const parent = todoMap.get(todo.parentId)!;
        parent.children = parent.children || [];
        parent.children.push(todoWithChildren);
      } else {
        rootTodos.push(todoWithChildren);
      }
    });
    
    return rootTodos;
  };
  
  const hierarchicalTodos = buildHierarchy(todos);
  
  // Group todos by status (considering only root level for grouping)
  const todosByStatus = hierarchicalTodos.reduce((acc, todo) => {
    if (!acc[todo.status]) {
      acc[todo.status] = [];
    }
    acc[todo.status].push(todo);
    return acc;
  }, {} as Record<string, Todo[]>);
  
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'in_progress':
        return (
          <Spinner size="small" className="text-blue-500 flex-shrink-0" />
        );
      case 'pending':
        return (
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth="2">
            <circle cx="10" cy="10" r="7" />
          </svg>
        );
      default:
        return null;
    }
  };
  
  const renderTodoItem = (todo: Todo, indent: number = 0): React.ReactNode => {
    const isCompleted = todo.status === 'completed';
    
    return (
      <React.Fragment key={todo.id}>
        <div
          className={`flex items-center gap-4 py-1.5 px-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-default`}
          style={{ paddingLeft: `${16 + indent * 20}px` }}
        >
          {getStatusIcon(todo.status)}
          <p className={`text-sm ${styles.textColor} ${isCompleted ? 'line-through opacity-60' : ''} truncate flex-1`}>
            {todo.content}
          </p>
        </div>
        {todo.children && todo.children.length > 0 && (
          <>
            {todo.children.map(child => renderTodoItem(child, indent + 1))}
          </>
        )}
      </React.Fragment>
    );
  };
  
  if (todos.length === 0) {
    return (
      <div 
        className={`bg-gray-50 dark:bg-gray-800/50 ${styles.contentBorder} border ${styles.borderRadius} p-4`}
      >
        <p className={`text-center ${styles.mutedText} text-sm`}>
          No tasks yet. Claude will add tasks as needed.
        </p>
      </div>
    );
  }
  
  return (
    <div 
      className={`bg-gray-50 dark:bg-gray-800/50 ${styles.contentBorder} border ${styles.borderRadius}`}
    >
      <div className={`px-4 py-3 border-b ${styles.contentBorder} sticky top-0 ${styles.contentBg} rounded-t-xl`}>
        <div className="flex items-center justify-between">
          <h3 className={`font-semibold ${styles.textColor} text-sm`}>
            Task list
          </h3>
          <div className="flex items-center gap-3">
            <span className={`${styles.mutedText} text-xs`}>
              {todosByStatus.completed?.length || 0}/{todos.length} completed
            </span>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                title="Dismiss task list"
              >
                <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="py-2">
        {/* Show completed items first - they bubble to the top */}
        {todosByStatus.completed?.map(todo => renderTodoItem(todo))}
        
        {/* Then in-progress items */}
        {todosByStatus.in_progress?.map(todo => renderTodoItem(todo))}
        
        {/* Finally pending items */}
        {todosByStatus.pending?.map(todo => renderTodoItem(todo))}
      </div>
    </div>
  );
});