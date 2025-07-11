import { memo } from 'react';
import { useTheme } from '../../contexts/ThemeContextV2';
import { ToolExecution } from './ToolExecution';
import { FeedbackLink } from '../FeedbackLink';
import { FeedbackDialog } from '../FeedbackDialog';
import { useFeedback } from '../../hooks/useFeedback';
import { useParams } from 'react-router-dom';
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
  const { projectId, repoName } = useParams<{ projectId: string; repoName: string }>();
  
  // Set up feedback for this tool group (use first tool's ID as the messageId)
  const {
    showDialog,
    isSubmitting,
    error: feedbackError,
    openFeedback,
    closeFeedback,
    submitFeedback
  } = useFeedback({
    sessionId: sessionId || '',
    repoName: repoName || '',
    projectId: projectId || '',
    messageId: tools[0]?.id
  });
  
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
                hideFeedbackLink={true}
              />
            </div>
          );
        })}
      </div>
      
      {/* Single feedback link for the entire group */}
      <div className={`px-3 py-2 border-t ${styles.contentBorder}`}>
        <FeedbackLink onClick={openFeedback} />
      </div>
      
      {/* Feedback dialog */}
      <FeedbackDialog
        isOpen={showDialog}
        onClose={closeFeedback}
        onSubmit={submitFeedback}
        isSubmitting={isSubmitting}
        error={feedbackError}
      />
    </div>
  );
});