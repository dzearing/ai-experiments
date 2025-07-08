import { memo, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContextV2';

export interface ToolExecutionProps {
  name: string;
  args?: string;
  output?: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  error?: string;
  expandedByDefault?: boolean;
  executionTime?: number;
}

export const ToolExecution = memo(function ToolExecution({
  name,
  args,
  output,
  status,
  error,
  expandedByDefault = false,
  executionTime
}: ToolExecutionProps) {
  const { currentStyles } = useTheme();
  const styles = currentStyles;
  const [isExpanded, setIsExpanded] = useState(expandedByDefault);
  
  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return '○';
      case 'running':
        return '●';
      case 'complete':
        return '●';
      case 'error':
        return '●';
    }
  };
  
  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return styles.mutedText;
      case 'running':
        return 'text-blue-500';
      case 'complete':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
    }
  };
  
  const formatOutput = (text: string) => {
    const lines = text.split('\n');
    const maxLines = 5;
    const hasMore = lines.length > maxLines;
    
    if (!isExpanded && hasMore) {
      return {
        text: lines.slice(0, maxLines).join('\n'),
        hasMore: true,
        moreCount: lines.length - maxLines
      };
    }
    
    return {
      text,
      hasMore: false,
      moreCount: 0
    };
  };
  
  const outputInfo = output ? formatOutput(output) : null;
  
  return (
    <div className={`${styles.contentBg} ${styles.contentBorder} border ${styles.borderRadius} p-3 mb-2`}>
      <div className="flex items-start gap-2">
        <span className={`${getStatusColor()} text-sm mt-0.5`}>{getStatusIcon()}</span>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className={`font-medium ${styles.textColor}`}>{name}</span>
            {args && (
              <span className={`text-sm ${styles.mutedText}`}>
                ({typeof args === 'object' ? JSON.stringify(args) : args})
              </span>
            )}
            {executionTime && (
              <span className={`text-xs ${styles.mutedText}`}>
                {executionTime < 1000 ? `${executionTime}ms` : `${(executionTime / 1000).toFixed(1)}s`}
              </span>
            )}
          </div>
          
          {status === 'running' && (
            <div className={`text-sm ${styles.mutedText} mt-1`}>
              <span className="inline-flex items-center gap-1">
                <span className="animate-pulse">Running</span>
                <span className="inline-flex gap-0.5">
                  <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </span>
              </span>
            </div>
          )}
          
          {error && (
            <div className="mt-2">
              <div className={`text-sm font-medium text-red-600 dark:text-red-400 mb-1`}>Error:</div>
              <pre className={`text-xs ${styles.contentBg} ${styles.borderRadius} p-2 overflow-x-auto text-red-600 dark:text-red-400`}>
                {error}
              </pre>
            </div>
          )}
          
          {outputInfo && (
            <div className="mt-2">
              <div className={`text-sm ${styles.mutedText} mb-1`}>⎿</div>
              <pre className={`text-xs ${styles.contentBg} ${styles.borderRadius} p-2 overflow-x-auto ${styles.textColor} whitespace-pre-wrap`}>
                {outputInfo.text}
              </pre>
              {outputInfo.hasMore && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className={`text-xs ${styles.primaryText} hover:underline mt-1`}
                >
                  {isExpanded ? 'Show less' : `… +${outputInfo.moreCount} lines (ctrl+r to expand)`}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});