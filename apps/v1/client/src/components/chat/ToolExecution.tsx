import { memo, useState, useEffect, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContextV2';
import { FeedbackLink } from '../FeedbackLink';
import { FeedbackDialog } from '../FeedbackDialog';
import { useFeedback } from '../../hooks/useFeedback';
import { useParams } from 'react-router-dom';
import { DiffView } from './DiffView';

export interface ToolExecutionProps {
  name: string;
  args?: string;
  output?: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  error?: string;
  expandedByDefault?: boolean;
  executionTime?: number;
  'data-testid'?: string;
  sessionId?: string;
  messageId?: string;
  hideFeedbackLink?: boolean;
}

export const ToolExecution = memo(function ToolExecution({
  name,
  args,
  output,
  status,
  error,
  expandedByDefault = false,
  executionTime,
  'data-testid': dataTestId,
  sessionId,
  messageId,
  hideFeedbackLink = false,
}: ToolExecutionProps) {
  const { currentStyles } = useTheme();
  const styles = currentStyles;

  // Function to render file paths as clickable VS Code links
  const renderFilePathOrText = (text: string) => {
    // Check if the entire text is a file path
    const trimmedText = text.trim();
    const singlePathMatch = trimmedText.match(
      /^((?:\/[\w.-]+)+(?:\/[\w.-]+)*|(?:\.\/)?[\w.-]+(?:\/[\w.-]+)+)(?:\:(\d+))?$/
    );

    if (singlePathMatch) {
      const [, path, lineNumber] = singlePathMatch;
      const vscodeUrl = lineNumber
        ? `vscode://file${path}:${lineNumber}:1`
        : `vscode://file${path}`;

      return (
        <a
          href={vscodeUrl}
          className="hover:underline text-blue-500 dark:text-blue-400"
          onClick={(e) => {
            e.preventDefault();
            window.location.href = vscodeUrl;
          }}
          title={`Open in VS Code: ${path}${lineNumber ? `:${lineNumber}` : ''}`}
        >
          {trimmedText}
        </a>
      );
    }

    // For other text, show truncated version
    return text.length > 80 ? text.substring(0, 80) + '...' : text;
  };

  // Helper function to create VS Code link
  const createVSCodeLink = (filePath: string, key: string, workingDir?: string) => {
    // Ensure the path is absolute
    let absolutePath = filePath;
    if (!filePath.startsWith('/')) {
      // If we have a working directory context, prepend it
      if (workingDir) {
        absolutePath = `${workingDir}/${filePath}`;
      } else {
        // Otherwise, just prepend a slash to make it absolute from root
        absolutePath = `/${filePath}`;
      }
    }

    const vscodeUrl = `vscode://file${absolutePath}`;
    return (
      <a
        key={key}
        href={vscodeUrl}
        className="hover:underline text-blue-500 dark:text-blue-400"
        onClick={(e) => {
          e.preventDefault();
          window.location.href = vscodeUrl;
        }}
        title={`Open in VS Code: ${absolutePath}`}
      >
        {filePath}
      </a>
    );
  };

  // Helper function to parse a line and extract file paths
  const parseLineForFilePaths = (line: string, lineIndex: number, workingDir?: string) => {
    // Check if line contains a file path (common patterns in git status output)
    // This pattern captures paths like "packages/apisurf/src/analyzers/analyzeNpmPackageVersions.ts"
    const filePathPattern =
      /(?:modified:|new file:|deleted:|renamed:|copied:|updated:|typechange:|added:|untracked:)?\s*((?:[\w\-]+\/)*[\w\-]+\.[\w]+)/g;

    let lastIndex = 0;
    const parts: React.ReactNode[] = [];
    let match;

    while ((match = filePathPattern.exec(line)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lineIndex}-${lastIndex}`}>
            {line.substring(lastIndex, match.index)}
          </span>
        );
      }

      // Add the file path as a link
      const filePath = match[1];
      parts.push(createVSCodeLink(filePath, `link-${lineIndex}-${match.index}`, workingDir));

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text after the last match
    if (lastIndex < line.length) {
      parts.push(<span key={`text-${lineIndex}-end`}>{line.substring(lastIndex)}</span>);
    }

    // If no matches, return the entire line
    if (parts.length === 0) {
      return line || '\u00A0';
    }

    return parts;
  };

  // Function to get working directory from context
  const getWorkingDirectory = () => {
    // Try to get the working directory from the URL params
    // The repoName in params gives us a clue about the project structure
    if (repoName && projectId) {
      // Construct the likely working directory based on the project structure
      // This follows the pattern: /home/{user}/workspace/projects/{project-name}/repos/{repo-name}
      const projectName = projectId.replace('project--home-dzearing-workspace-projects-', '');
      return `/home/dzearing/workspace/projects/${projectName}/repos/${repoName}`;
    }
    return undefined;
  };

  // Function to render bash output with clickable file paths
  const renderBashOutput = (text: string) => {
    const lines = text.split('\n');
    const workingDir = getWorkingDirectory();

    return (
      <div className="space-y-0.5">
        {lines.map((line, index) => (
          <div key={index}>{parseLineForFilePaths(line, index, workingDir)}</div>
        ))}
      </div>
    );
  };

  // Format tool name to be more user-friendly
  const formatToolName = (toolName: string): string => {
    const nameMap: Record<string, string> = {
      TodoWrite: '📝 Update todo list',
      Edit: '✏️ Edit file',
      MultiEdit: '✏️ Edit multiple sections',
      Read: '📖 Read file',
      Write: '📄 Write file',
      Bash: '💻 Run command',
      Grep: '🔍 Search files',
      Glob: '📁 Find files',
      LS: '📋 List directory',
      NotebookRead: '📓 Read notebook',
      NotebookEdit: '📓 Edit notebook',
      WebFetch: '🌐 Fetch web content',
      WebSearch: '🔎 Search web',
      Task: '🤖 Launch agent',
      exit_plan_mode: '✅ Exit plan mode',
    };
    return nameMap[toolName] || toolName;
  };
  const [isExpanded, setIsExpanded] = useState(expandedByDefault);
  const [runningDuration, setRunningDuration] = useState<number>(0);
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { projectId, repoName } = useParams<{ projectId: string; repoName: string }>();

  // Set up feedback for this tool execution (only if sessionId is provided)
  const {
    showDialog,
    isSubmitting,
    error: feedbackError,
    openFeedback,
    closeFeedback,
    submitFeedback,
  } = useFeedback({
    sessionId: sessionId || '',
    repoName: repoName || '',
    projectId: projectId || '',
    messageId,
  });

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
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        );
      case 'complete':
        return (
          <svg
            className="w-4 h-4 text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="3"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg
            className="w-4 h-4 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
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
        moreCount: lines.length - maxLines,
      };
    }

    return {
      text,
      hasMore: false,
      moreCount: 0,
    };
  };

  const outputInfo = output ? formatOutput(output) : null;

  return (
    <div className="py-2" data-testid={dataTestId}>
      <div className="flex items-start gap-3">
        <div
          className={`flex items-center gap-1.5 ${getStatusColor()} text-xs mt-0.5`}
          data-testid="tool-status"
        >
          {getStatusIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-4">
            <div className="flex items-baseline gap-2 min-w-0 flex-1">
              <span
                className={`font-medium ${styles.textColor} flex-shrink-0`}
                data-testid="tool-name"
              >
                {formatToolName(name)}
              </span>
              {args &&
                name !== 'TodoWrite' &&
                name !== 'Edit' &&
                name !== 'MultiEdit' &&
                name !== 'Grep' &&
                name !== 'Glob' &&
                name !== 'LS' &&
                name !== 'Task' &&
                name !== 'Read' &&
                name !== 'Write' && (
                  <span className={`text-sm ${styles.mutedText} truncate font-mono`} title={args}>
                    {renderFilePathOrText(args)}
                  </span>
                )}
              {args && name === 'TodoWrite' && (
                <span className={`text-sm ${styles.mutedText}`}>
                  {(() => {
                    try {
                      const argsData = typeof args === 'string' ? JSON.parse(args) : args;
                      const todoCount = argsData.todos?.length || 0;
                      return `${todoCount} task${todoCount === 1 ? '' : 's'}`;
                    } catch {
                      return 'tasks updated';
                    }
                  })()}
                </span>
              )}
              {args && (name === 'Edit' || name === 'MultiEdit') && (
                <span className={`text-sm ${styles.mutedText} font-mono`}>
                  {(() => {
                    try {
                      const argsData = typeof args === 'string' ? JSON.parse(args) : args;
                      const filePath = argsData.file_path || '';

                      if (filePath) {
                        const vscodeUrl = `vscode://file${filePath}`;
                        const fileName = filePath.split('/').pop() || filePath;
                        const displayText =
                          name === 'MultiEdit' && argsData.edits?.length
                            ? `${fileName} (${argsData.edits.length} edit${argsData.edits.length === 1 ? '' : 's'})`
                            : fileName;

                        return (
                          <a
                            href={vscodeUrl}
                            className="hover:underline text-blue-500 dark:text-blue-400"
                            onClick={(e) => {
                              e.preventDefault();
                              window.location.href = vscodeUrl;
                            }}
                            title={`Open in VS Code: ${filePath}`}
                          >
                            {displayText}
                          </a>
                        );
                      }

                      return args.length > 80 ? args.substring(0, 80) + '...' : args;
                    } catch {
                      return args.length > 80 ? args.substring(0, 80) + '...' : args;
                    }
                  })()}
                </span>
              )}
              {args && (name === 'Read' || name === 'Write') && (
                <span className={`text-sm ${styles.mutedText} font-mono`}>
                  {(() => {
                    try {
                      const argsData = typeof args === 'string' ? JSON.parse(args) : args;
                      const filePath = argsData.file_path || '';

                      if (filePath) {
                        const vscodeUrl = `vscode://file${filePath}`;
                        const fileName = filePath.split('/').pop() || filePath;

                        return (
                          <a
                            href={vscodeUrl}
                            className="hover:underline text-blue-500 dark:text-blue-400"
                            onClick={(e) => {
                              e.preventDefault();
                              window.location.href = vscodeUrl;
                            }}
                            title={`Open in VS Code: ${filePath}`}
                          >
                            {fileName}
                          </a>
                        );
                      }

                      return args.length > 80 ? args.substring(0, 80) + '...' : args;
                    } catch {
                      return args.length > 80 ? args.substring(0, 80) + '...' : args;
                    }
                  })()}
                </span>
              )}
              {args &&
                name === 'Grep' &&
                (() => {
                  try {
                    const argsData = typeof args === 'string' ? JSON.parse(args) : args;
                    const path = argsData.path || '.';
                    const displayPath = path === '.' ? 'current directory' : path;
                    return (
                      <span className={`text-sm ${styles.mutedText} font-mono`}>{displayPath}</span>
                    );
                  } catch {
                    return (
                      <span className={`text-sm ${styles.mutedText} font-mono`}>
                        {args.length > 80 ? args.substring(0, 80) + '...' : args}
                      </span>
                    );
                  }
                })()}
              {args &&
                name === 'Glob' &&
                (() => {
                  try {
                    const argsData = typeof args === 'string' ? JSON.parse(args) : args;
                    const path = argsData.path || '.';
                    const displayPath = path === '.' ? 'current directory' : path;
                    return (
                      <span className={`text-sm ${styles.mutedText} font-mono`}>{displayPath}</span>
                    );
                  } catch {
                    return (
                      <span className={`text-sm ${styles.mutedText} font-mono`}>
                        {args.length > 80 ? args.substring(0, 80) + '...' : args}
                      </span>
                    );
                  }
                })()}
              {args &&
                name === 'LS' &&
                (() => {
                  try {
                    const argsData = typeof args === 'string' ? JSON.parse(args) : args;
                    const path = argsData.path || '.';
                    const displayPath =
                      path === '.' ? 'current directory' : path.split('/').pop() || path;
                    return (
                      <span className={`text-sm ${styles.mutedText} font-mono`}>{displayPath}</span>
                    );
                  } catch {
                    return (
                      <span className={`text-sm ${styles.mutedText} font-mono`}>
                        {args.length > 80 ? args.substring(0, 80) + '...' : args}
                      </span>
                    );
                  }
                })()}
              {args &&
                name === 'Task' &&
                (() => {
                  try {
                    const argsData = typeof args === 'string' ? JSON.parse(args) : args;
                    const description = argsData.description || 'Running task';
                    return <span className={`text-sm ${styles.mutedText}`}>{description}</span>;
                  } catch {
                    return (
                      <span className={`text-sm ${styles.mutedText}`}>
                        {args.length > 80 ? args.substring(0, 80) + '...' : args}
                      </span>
                    );
                  }
                })()}
            </div>
            {(status === 'running' || status === 'complete' || executionTime) && (
              <span className={`text-xs ${styles.mutedText} flex-shrink-0`}>
                {status === 'running'
                  ? formatDuration(runningDuration)
                  : formatDuration(executionTime || runningDuration || 0)}
              </span>
            )}
          </div>

          {/* Grep tool details - show pattern */}
          {args && name === 'Grep' && (
            <div className="mt-1">
              {(() => {
                try {
                  const argsData = typeof args === 'string' ? JSON.parse(args) : args;
                  const pattern = argsData.pattern || '';
                  return (
                    <div className={`text-xs ${styles.mutedText} pl-9`}>
                      Pattern: <span className="font-mono">"{pattern}"</span>
                    </div>
                  );
                } catch {
                  return null;
                }
              })()}
            </div>
          )}

          {/* Glob tool details - show pattern */}
          {args && name === 'Glob' && (
            <div className="mt-1">
              {(() => {
                try {
                  const argsData = typeof args === 'string' ? JSON.parse(args) : args;
                  const pattern = argsData.pattern || '';
                  return (
                    <div className={`text-xs ${styles.mutedText} pl-9`}>
                      Pattern: <span className="font-mono">"{pattern}"</span>
                    </div>
                  );
                } catch {
                  return null;
                }
              })()}
            </div>
          )}

          {/* Task tool details - show prompt */}
          {args && name === 'Task' && (
            <div className="mt-1">
              {(() => {
                try {
                  const argsData = typeof args === 'string' ? JSON.parse(args) : args;
                  const prompt = argsData.prompt || '';
                  // Show first line or first 200 chars of prompt
                  const firstLine = prompt.split('\n')[0];
                  const displayPrompt =
                    firstLine.length > 200 ? firstLine.substring(0, 200) + '...' : firstLine;
                  return (
                    <div className={`text-xs ${styles.mutedText} pl-9`}>Task: {displayPrompt}</div>
                  );
                } catch {
                  return null;
                }
              })()}
            </div>
          )}

          {/* Edit tool details - show before/after */}
          {args && (name === 'Edit' || name === 'MultiEdit') && status === 'complete' && (
            <div className="mt-2">
              {(() => {
                try {
                  const argsData = typeof args === 'string' ? JSON.parse(args) : args;

                  if (name === 'Edit') {
                    // Single edit
                    return (
                      <div className="space-y-2">
                        <div className={`text-xs font-medium ${styles.mutedText} mb-1`}>
                          Changes:
                        </div>
                        <DiffView
                          oldText={argsData.old_string || ''}
                          newText={argsData.new_string || ''}
                        />
                      </div>
                    );
                  } else {
                    // MultiEdit - show first edit only with count
                    const edits = argsData.edits || [];
                    if (edits.length === 0) return null;

                    const firstEdit = edits[0];
                    const showCount = edits.length > 1;

                    return (
                      <div className="space-y-2">
                        <div className={`text-xs font-medium ${styles.mutedText} mb-1`}>
                          Changes{showCount ? ` (edit 1 of ${edits.length})` : ''}:
                        </div>
                        <DiffView
                          oldText={firstEdit.old_string || ''}
                          newText={firstEdit.new_string || ''}
                        />
                        {showCount && (
                          <div className={`text-xs ${styles.mutedText} italic`}>
                            ... and {edits.length - 1} more edit{edits.length - 1 === 1 ? '' : 's'}
                          </div>
                        )}
                      </div>
                    );
                  }
                } catch {
                  return null;
                }
              })()}
            </div>
          )}

          {error && (
            <div className="mt-2">
              <div className={`text-sm font-medium text-red-600 dark:text-red-400 mb-1`}>
                Error:
              </div>
              <pre
                className={`text-xs ${styles.contentBg} ${styles.borderRadius} p-2 overflow-x-auto text-red-600 dark:text-red-400`}
              >
                {error}
              </pre>
            </div>
          )}

          {outputInfo && (
            <div className="mt-2">
              <div className={`text-sm ${styles.mutedText} mb-1`}>⎿</div>
              {name === 'LS' && output ? (
                <div
                  className={`text-xs ${styles.contentBg} ${styles.borderRadius} p-2 overflow-x-auto ${styles.textColor}`}
                >
                  {(() => {
                    try {
                      // Try to parse as JSON array
                      const items = JSON.parse(output);
                      if (Array.isArray(items)) {
                        const displayItems = isExpanded ? items : items.slice(0, 10);
                        return (
                          <>
                            <div className="space-y-1 font-mono">
                              {displayItems.map((item, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <span
                                    className={
                                      item.type === 'directory' ? 'text-blue-500' : styles.textColor
                                    }
                                  >
                                    {item.type === 'directory' ? '📁' : '📄'}
                                  </span>
                                  <span>{item.name}</span>
                                </div>
                              ))}
                            </div>
                            {!isExpanded && items.length > 10 && (
                              <button
                                onClick={() => setIsExpanded(true)}
                                className={`text-xs ${styles.primaryText} hover:underline mt-2`}
                              >
                                … +{items.length - 10} more items
                              </button>
                            )}
                            {isExpanded && items.length > 10 && (
                              <button
                                onClick={() => setIsExpanded(false)}
                                className={`text-xs ${styles.primaryText || 'text-blue-600 dark:text-blue-400'} hover:underline mt-2`}
                              >
                                Show less
                              </button>
                            )}
                          </>
                        );
                      } else {
                        // Not an array, show as plain text
                        return (
                          <pre className="whitespace-pre-wrap font-mono">{outputInfo.text}</pre>
                        );
                      }
                    } catch {
                      // Failed to parse as JSON, show as plain text
                      return <pre className="whitespace-pre-wrap font-mono">{outputInfo.text}</pre>;
                    }
                  })()}
                </div>
              ) : name === 'Bash' ? (
                <div
                  className={`text-xs ${styles.contentBg} ${styles.borderRadius} p-2 overflow-x-auto ${styles.textColor} font-mono`}
                >
                  {renderBashOutput(outputInfo.text)}
                </div>
              ) : (
                <pre
                  className={`text-xs ${styles.contentBg} ${styles.borderRadius} p-2 overflow-x-auto ${styles.textColor} whitespace-pre-wrap font-mono`}
                >
                  {outputInfo.text}
                </pre>
              )}
              {outputInfo.hasMore && name !== 'LS' && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className={`text-xs ${styles.primaryText || 'text-blue-600 dark:text-blue-400'} hover:underline mt-1`}
                >
                  {isExpanded ? 'Show less' : `… +${outputInfo.moreCount} lines (ctrl+r to expand)`}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Feedback link - only show if we have session context and not hidden */}
      {sessionId && status === 'complete' && !hideFeedbackLink && (
        <div className="mt-2 px-3">
          <FeedbackLink onClick={openFeedback} />
        </div>
      )}

      {/* Feedback dialogs */}
      {sessionId && (
        <>
          <FeedbackDialog
            isOpen={showDialog}
            onClose={closeFeedback}
            onSubmit={submitFeedback}
            isSubmitting={isSubmitting}
            error={feedbackError}
          />
        </>
      )}
    </div>
  );
});
