import { memo, useState, useEffect, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContextV2';

export interface ToolExecutionProps {
  name: string;
  args?: string;
  output?: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  error?: string;
  expandedByDefault?: boolean;
  executionTime?: number;
  'data-testid'?: string;
}

export const ToolExecution = memo(function ToolExecution({
  name,
  args,
  output,
  status,
  error,
  expandedByDefault = false,
  executionTime,
  'data-testid': dataTestId
}: ToolExecutionProps) {
  const { currentStyles } = useTheme();
  const styles = currentStyles;
  const [isExpanded, setIsExpanded] = useState(expandedByDefault);
  const [runningDuration, setRunningDuration] = useState<number>(0);
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track running duration
  useEffect(() => {
    if (status === 'running') {
      // Start tracking time
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
      }
      
      // Update duration every 100ms
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          setRunningDuration(Date.now() - startTimeRef.current);
        }
      }, 100); // Update every 100ms for smoother display
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      // Stop tracking when not running
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // If we were tracking time and now complete, use the tracked duration if no executionTime
      if (status === 'complete' && startTimeRef.current && !executionTime) {
        setRunningDuration(Date.now() - startTimeRef.current);
      }
    }
  }, [status, executionTime]);
  
  // Format duration for display
  const formatDuration = (ms: number) => {
    if (ms < 1000) {
      return `${ms}ms`;
    } else {
      return `${(ms / 1000).toFixed(1)}s`;
    }
  };
  
  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return (
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          </svg>
        );
      case 'running':
        return (
          <svg className="w-4 h-4 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        );
      case 'complete':
        return (
          <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
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
    <div 
      className={`${styles.contentBg} ${styles.contentBorder} border ${styles.borderRadius} p-3 mb-2`}
      data-testid={dataTestId}
    >
      <div className="flex items-center gap-4">
        <div className={`flex items-center gap-2 ${getStatusColor()} text-sm`} data-testid="tool-status">
          {getStatusIcon()}
          <span>
            {status === 'pending' && 'Pending'}
            {status === 'running' && 'Running'}
            {status === 'complete' && 'Complete'}
            {status === 'error' && 'Error'}
          </span>
        </div>
        <div className="flex-1">
          <div className="flex items-baseline">
            <div className="flex items-baseline gap-4">
              <span className={`font-medium ${styles.textColor}`} data-testid="tool-name">{name}</span>
              {args && (
                <span className={`text-sm ${styles.mutedText}`}>
                  {args}
                </span>
              )}
            </div>
            {(status === 'running' || status === 'complete' || executionTime) && (
              <span className={`text-xs ${styles.mutedText} ml-auto`}>
                {status === 'running' 
                  ? formatDuration(runningDuration)
                  : formatDuration(executionTime || runningDuration || 0)
                }
              </span>
            )}
          </div>
          
          
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