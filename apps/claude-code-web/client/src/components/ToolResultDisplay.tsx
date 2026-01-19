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
 * Shows ToolExecutionIndicator while tool is running.
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

    default:
      return (
        <DefaultToolResult output={output} isExpanded={isExpanded} />
      );
  }
}
