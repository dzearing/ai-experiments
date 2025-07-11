import { memo } from 'react';
import { useTheme } from '../../contexts/ThemeContextV2';
import { ToolExecution } from './ToolExecution';
import type { ClaudeMessage } from '../../contexts/ClaudeCodeContext';

interface ToolExecutionGroupProps {
  tools: ClaudeMessage[];
  sessionId: string;
}

export const ToolExecutionGroup = memo(function ToolExecutionGroup({
  tools,
  sessionId
}: ToolExecutionGroupProps) {
  const { currentStyles } = useTheme();
  const styles = currentStyles;
  
  if (tools.length === 0) return null;
  
  return (
    <div className={`mx-4 my-2 ${styles.contentBg} ${styles.contentBorder} border ${styles.borderRadius} overflow-hidden`}>
      <div className={`px-3 py-2 ${styles.mutedText} text-xs font-medium border-b ${styles.contentBorder}`}>
        {tools.length} tool execution{tools.length === 1 ? '' : 's'}
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700 p-4">
        {tools.map((tool) => {
          // Extract tool name from message ID if name is not provided
          let toolName = tool.name;
          if (!toolName && tool.id?.includes('-')) {
            // Try to extract from ID pattern like "tool-1752121277934-drvpkpw31"
            const parts = tool.id.split('-');
            if (parts[0] === 'tool' && parts.length > 2) {
              toolName = 'Tool execution';
            }
          }
          
          return (
            <div key={tool.id}>
              <ToolExecution
                name={toolName || 'Tool execution'}
                args={tool.args || tool.content || ''}
                output=""
                status={tool.status || 'complete'}
                expandedByDefault={false}
                executionTime={tool.executionTime}
                data-testid="tool-execution"
                sessionId={sessionId}
                messageId={tool.id}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
});