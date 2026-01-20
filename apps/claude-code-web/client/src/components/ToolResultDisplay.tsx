/**
 * ToolResultDisplay component
 *
 * Router component that dispatches tool results to the appropriate
 * renderer based on tool name. Provides a default fallback for
 * unknown tools.
 */

import type { ReactNode } from 'react';

import { ToolExecutionIndicator } from './ToolExecutionIndicator';
import { FileContentResult } from './FileContentResult';
import { FileListResult } from './FileListResult';
import { SearchResultsDisplay } from './SearchResultsDisplay';
import { BashResultDisplay } from './BashResultDisplay';
import { WriteResultDisplay } from './WriteResultDisplay';
import { EditResultDisplay } from './EditResultDisplay';
import { WebSearchResultDisplay } from './WebSearchResultDisplay';
import { WebFetchResultDisplay } from './WebFetchResultDisplay';
import { NotebookEditDisplay } from './NotebookEditDisplay';
import { TodoWriteDisplay, type TodoItem } from './TodoWriteDisplay';
import styles from './ToolResultDisplay.module.css';

export interface ToolResultDisplayProps {
  /** Name of the tool that was executed */
  toolName: string;
  /** Input parameters passed to the tool */
  input: Record<string, unknown>;
  /** Output from the tool execution */
  output: string;
  /** Whether the output is currently expanded */
  isExpanded: boolean;
  /** Whether the tool is currently executing */
  isExecuting?: boolean;
  /** Callback to toggle expand/collapse state */
  onToggleExpand: () => void;
  /** Callback when a file path is clicked */
  onFileClick?: (path: string, line?: number) => void;
}

/**
 * Default tool result renderer.
 * Displays raw output in a collapsible pre block.
 */
function DefaultToolResult({
  output,
  isExpanded,
}: {
  output: string;
  isExpanded: boolean;
}) {
  if (!isExpanded || !output) {
    return null;
  }

  return (
    <div className={styles.defaultResult}>
      <pre className={styles.defaultResultPre}>{output}</pre>
    </div>
  );
}

/**
 * Routes tool results to appropriate renderer based on tool name.
 * Shows ToolExecutionIndicator while tool is running (except for tools with streaming output).
 */
export function ToolResultDisplay({
  toolName,
  input,
  output,
  isExpanded,
  isExecuting = false,
  onToggleExpand,
  onFileClick,
}: ToolResultDisplayProps): ReactNode {
  // Bash and TaskOutput show streaming output during execution, so handle them before the generic indicator
  if (toolName === 'Bash' || toolName === 'TaskOutput') {
    const command = typeof input.command === 'string' ? input.command : '';
    const description = typeof input.description === 'string' ? input.description : undefined;
    const isBackground = typeof input.run_in_background === 'boolean' ? input.run_in_background : false;
    const timeout = typeof input.timeout === 'number' ? input.timeout : undefined;

    // For TaskOutput, show the task ID as the command
    const displayCommand = toolName === 'TaskOutput'
      ? `TaskOutput: ${typeof input.task_id === 'string' ? input.task_id : 'unknown'}`
      : command;

    return (
      <BashResultDisplay
        command={displayCommand}
        output={output}
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
        description={description}
        isBackground={isBackground}
        isExecuting={isExecuting}
        timeout={timeout}
      />
    );
  }

  // Show execution indicator if tool is still running
  if (isExecuting) {
    return <ToolExecutionIndicator toolName={toolName} isExecuting={true} />;
  }

  // Route to appropriate renderer based on tool name
  switch (toolName) {
    case 'Read': {
      const filePath = typeof input.file_path === 'string' ? input.file_path : '';

      return (
        <FileContentResult
          filePath={filePath}
          content={output}
          isExpanded={isExpanded}
          onToggleExpand={onToggleExpand}
          onFileClick={onFileClick}
        />
      );
    }

    case 'Glob': {
      const pattern = typeof input.pattern === 'string' ? input.pattern : '*';

      return (
        <FileListResult
          pattern={pattern}
          output={output}
          isExpanded={isExpanded}
          onToggleExpand={onToggleExpand}
          onFileClick={onFileClick}
        />
      );
    }

    case 'Grep': {
      const pattern = typeof input.pattern === 'string' ? input.pattern : '';

      return (
        <SearchResultsDisplay
          pattern={pattern}
          output={output}
          isExpanded={isExpanded}
          onToggleExpand={onToggleExpand}
          onFileClick={onFileClick}
        />
      );
    }

    case 'Write': {
      const filePath = typeof input.file_path === 'string' ? input.file_path : '';
      const content = typeof input.content === 'string' ? input.content : undefined;

      return (
        <WriteResultDisplay
          filePath={filePath}
          content={content}
          isExpanded={isExpanded}
          onToggleExpand={onToggleExpand}
          onFileClick={onFileClick}
        />
      );
    }

    case 'Edit': {
      const filePath = typeof input.file_path === 'string' ? input.file_path : '';
      const oldString = typeof input.old_string === 'string' ? input.old_string : '';
      const newString = typeof input.new_string === 'string' ? input.new_string : '';
      const replaceAll = typeof input.replace_all === 'boolean' ? input.replace_all : false;

      return (
        <EditResultDisplay
          filePath={filePath}
          oldString={oldString}
          newString={newString}
          replaceAll={replaceAll}
          isExpanded={isExpanded}
          onToggleExpand={onToggleExpand}
          onFileClick={onFileClick}
        />
      );
    }

    case 'WebSearch': {
      const query = typeof input.query === 'string' ? input.query : '';
      const allowedDomains = Array.isArray(input.allowed_domains)
        ? (input.allowed_domains as string[])
        : undefined;
      const blockedDomains = Array.isArray(input.blocked_domains)
        ? (input.blocked_domains as string[])
        : undefined;

      return (
        <WebSearchResultDisplay
          query={query}
          output={output}
          allowedDomains={allowedDomains}
          blockedDomains={blockedDomains}
          isExpanded={isExpanded}
          onToggleExpand={onToggleExpand}
        />
      );
    }

    case 'WebFetch': {
      const url = typeof input.url === 'string' ? input.url : '';
      const prompt = typeof input.prompt === 'string' ? input.prompt : '';

      return (
        <WebFetchResultDisplay
          url={url}
          prompt={prompt}
          output={output}
          isExpanded={isExpanded}
          onToggleExpand={onToggleExpand}
        />
      );
    }

    case 'NotebookEdit': {
      const notebookPath = typeof input.notebook_path === 'string' ? input.notebook_path : '';
      const cellId = typeof input.cell_id === 'string' ? input.cell_id : undefined;
      const cellType = input.cell_type === 'code' || input.cell_type === 'markdown'
        ? input.cell_type
        : undefined;
      const editMode = input.edit_mode === 'replace' || input.edit_mode === 'insert' || input.edit_mode === 'delete'
        ? input.edit_mode
        : undefined;
      const newSource = typeof input.new_source === 'string' ? input.new_source : '';

      return (
        <NotebookEditDisplay
          notebookPath={notebookPath}
          cellId={cellId}
          cellType={cellType}
          editMode={editMode}
          newSource={newSource}
          output={output}
          isExpanded={isExpanded}
          onToggleExpand={onToggleExpand}
          onFileClick={onFileClick}
        />
      );
    }

    case 'TodoWrite': {
      const rawTodos = Array.isArray(input.todos) ? input.todos : [];
      const todos: TodoItem[] = rawTodos
        .filter((item): item is Record<string, unknown> => item !== null && typeof item === 'object')
        .map((item) => ({
          content: typeof item.content === 'string' ? item.content : '',
          status: item.status === 'pending' || item.status === 'in_progress' || item.status === 'completed'
            ? item.status
            : 'pending',
          activeForm: typeof item.activeForm === 'string' ? item.activeForm : undefined,
        }));

      return (
        <TodoWriteDisplay
          todos={todos}
          isExpanded={isExpanded}
          onToggleExpand={onToggleExpand}
        />
      );
    }

    default:
      return (
        <DefaultToolResult output={output} isExpanded={isExpanded} />
      );
  }
}
