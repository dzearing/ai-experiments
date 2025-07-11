import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContextV2';
import { useLayout } from '../contexts/LayoutContext';
import { useApp } from '../contexts/AppContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useRealtimeSubscription } from '../contexts/SubscriptionContext';
import { ClaudeCodeProvider, useClaudeCode } from '../contexts/ClaudeCodeContext';
import { VirtualMessageList } from '../components/claude-code/VirtualMessageList';
import { ClaudeInput } from '../components/claude-code/ClaudeInput';
import { TodoList } from '../components/claude-code/TodoList';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ProgressIndicator } from '../components/chat/ProgressIndicator';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { DancingBubbles } from '../components/ui/DancingBubbles';
import { FeedbackDialog } from '../components/FeedbackDialog';
import { useFeedback } from '../hooks/useFeedback';
import { Button } from '../components/ui/Button';
import type { ClaudeMode } from '../contexts/ClaudeCodeContext';

interface RepoStatus {
  resourceId: string;
  repoPath: string;
  branch: string;
  isDirty: boolean;
  changes: {
    modified: number;
    added: number;
    deleted: number;
    untracked: number;
  };
  ahead: number;
  behind: number;
  lastCommit: {
    hash: string;
    subject: string;
    author: string;
    relativeTime: string;
  } | null;
  timestamp: string;
  error?: string;
}

export function ClaudeCode() {
  return (
    <ClaudeCodeProvider>
      <ClaudeCodeContent />
    </ClaudeCodeProvider>
  );
}

function ClaudeCodeContent() {
  const { projectId, repoName } = useParams<{ projectId: string; repoName: string }>();
  const navigate = useNavigate();
  const { currentStyles } = useTheme();
  const { setHeaderContent } = useLayout();
  const { projects } = useApp();
  const { projects: workspaceProjects } = useWorkspace();
  const { subscribe } = useRealtimeSubscription();
  const {
    messages,
    mode,
    contextUsage,
    isInitializing,
    isConnected,
    error,
    isProcessing,
    sessionId,
    reservedRepo,
    todos,
    sendMessage,
    setMode,
    initializeSession,
    cancelMessage,
    clearMessages
  } = useClaudeCode();
  
  // Debug logging
  console.log('ClaudeCode component render, messages:', messages.length);
  console.log('isInitializing:', isInitializing, 'isConnected:', isConnected, 'sessionId:', sessionId);
  
  const styles = currentStyles;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showTodos, setShowTodos] = useState(true);
  const [repoStatus, setRepoStatus] = useState<RepoStatus | null>(null);
  
  const project = projects.find(p => p.id === projectId);
  const workspaceProject = workspaceProjects.find(p => p.name === project?.name);
  
  // Subscribe to repo status updates
  useEffect(() => {
    if (!workspaceProject?.path || !repoName) return;
    
    const unsubscribe = subscribe('repo-status', `${workspaceProject.path}/${repoName}`, (status: RepoStatus) => {
      setRepoStatus(status);
    });
    
    return unsubscribe;
  }, [workspaceProject?.path, repoName, subscribe]);
  
  // Re-show todos when new todos arrive
  useEffect(() => {
    if (todos.length > 0) {
      setShowTodos(true);
    }
  }, [todos.length]);
  
  // Set up session-level feedback
  const {
    showDialog: showSessionFeedback,
    isSubmitting: isSubmittingFeedback,
    error: feedbackError,
    openFeedback: openSessionFeedback,
    closeFeedback: closeSessionFeedback,
    submitFeedback: submitSessionFeedback
  } = useFeedback({
    sessionId: sessionId || '',
    repoName: repoName || '',
    projectId: projectId || '',
    // No messageId for session-level feedback
  });
  
  // Set breadcrumb immediately when data is available
  useEffect(() => {
    console.log('ClaudeCode breadcrumb effect - repoName:', repoName, 'projectId:', projectId, 'project:', project);
    
    if (repoName && projectId && project) {
      console.log('Setting Claude Code breadcrumb with project:', project.name);
      const newBreadcrumb = [
        { label: project.name, path: `/projects/${projectId}` },
        { label: repoName },
        { label: 'Claude Code' }
      ];
      console.log('New breadcrumb:', newBreadcrumb);
      setHeaderContent(newBreadcrumb);
    }
    
    // No cleanup needed - let the next page set its own header
  }, [projectId, repoName, project, setHeaderContent]);
  
  // Initialize session
  useEffect(() => {
    console.log('ClaudeCode init session:', {
      projectId,
      projectName: project?.name,
      workspaceProjectPath: workspaceProject?.path,
      repoName
    });
    
    if (projectId && workspaceProject?.path && repoName) {
      initializeSession(projectId, workspaceProject.path, repoName);
    }
  }, [projectId, workspaceProject?.path, repoName]);
  
  const handleSubmit = useCallback(async (message: string) => {
    if (!message.trim() || isSubmitting || !isConnected) return;
    
    // Check if user is approving a plan
    if (mode === 'plan' && message.toLowerCase().includes('yes') && message.toLowerCase().includes('proceed')) {
      // Switch to execution mode
      setMode('default');
    }
    
    setIsSubmitting(true);
    
    try {
      await sendMessage(message);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, isConnected, sendMessage, mode, setMode]);
  
  const handleModeChange = useCallback((newMode: ClaudeMode) => {
    setMode(newMode);
  }, [setMode]);

  const handleCancel = useCallback(() => {
    setIsSubmitting(false);
    cancelMessage();
  }, [cancelMessage]);
  
  const handleCloseSession = useCallback(() => {
    setShowCloseConfirm(true);
  }, []);
  
  const handleConfirmClose = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      // End the Claude session
      const response = await fetch('http://localhost:3000/api/claude/code/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to close session:', response.status, errorData);
        // Still navigate away even if session cleanup failed
      }
      
      // Clear messages and navigate back
      clearMessages();
      navigate(`/projects/${projectId}`);
    } catch (error) {
      console.error('Failed to close session:', error);
      // Still navigate away even if request failed
      clearMessages();
      navigate(`/projects/${projectId}`);
    }
  }, [sessionId, projectId, navigate, clearMessages]);
  
  if (!project) {
    return (
      <div className={`flex items-center justify-center h-full ${styles.textColor}`}>
        <div className="text-center">
          <p className="text-lg mb-4">Project not found</p>
          <Button
            onClick={() => navigate('/projects')}
            variant="primary"
          >
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }
  
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className={`mt-4 ${styles.mutedText}`}>Initializing Claude Code session...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={`flex items-center justify-center h-full ${styles.textColor}`}>
        <div className="text-center max-w-md">
          <p className="text-lg mb-2 text-red-600 dark:text-red-400">Error</p>
          <p className={`${styles.mutedText} mb-4`}>{error}</p>
          <Button
            onClick={() => {
              if (projectId && workspaceProject?.path && repoName) {
                initializeSession(projectId, workspaceProject.path, repoName);
              }
            }}
            variant="primary"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      {/* Button Bar */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${styles.contentBorder} ${styles.cardBg}`}>
        <div className="flex items-center gap-6">
          {reservedRepo && (
            <>
              <div>
                <div className={`text-xs ${styles.mutedText} mb-0.5`}>Repo</div>
                <div className={`text-sm ${styles.textColor} font-mono`}>{reservedRepo}</div>
              </div>
              {repoStatus && !repoStatus.error && (
                <>
                  <div>
                    <div className={`text-xs ${styles.mutedText} mb-0.5`}>Branch</div>
                    <div className={`text-sm ${styles.textColor} font-mono`}>{repoStatus.branch}</div>
                  </div>
                  <div>
                    <div className={`text-xs ${styles.mutedText} mb-0.5`}>Changes</div>
                    <div className={`text-sm ${styles.textColor} font-mono`}>
                      {repoStatus.isDirty ? (
                        <>{repoStatus.changes.modified + repoStatus.changes.added + repoStatus.changes.deleted} Staged, {repoStatus.changes.untracked} Unstaged</>
                      ) : (
                        <>none</>
                      )}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={openSessionFeedback}
            variant="outline"
            size="sm"
          >
            Leave feedback
          </Button>
          <Button
            onClick={handleCloseSession}
            variant="danger"
            size="sm"
          >
            Close session
          </Button>
        </div>
      </div>
      
      {/* Content Area - Split when todos exist */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Todo List - Shows when todos exist and user hasn't dismissed */}
        {todos.length > 0 && showTodos && (
          <div className="p-4 overflow-auto scrollbar-gutter-stable" style={{ maxHeight: '30vh', scrollbarGutter: 'stable' }}>
            <TodoList 
              todos={todos} 
              onDismiss={() => setShowTodos(false)}
            />
          </div>
        )}
        
        {/* Messages Area */}
        <div 
          ref={scrollContainerRef}
          className={`flex-1 overflow-auto ${styles.contentBg}`}
          data-testid="message-list"
        >
          {messages.length === 0 && isConnected ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <DancingBubbles className="justify-center mb-4" />
                <p className={`${styles.mutedText}`}>Claude is preparing to greet you...</p>
              </div>
            </div>
          ) : (
            <VirtualMessageList 
              messages={messages}
              scrollContainerRef={scrollContainerRef as React.RefObject<HTMLDivElement>}
              onSuggestedResponse={(response) => {
                if (!isProcessing) {
                  handleSubmit(response);
                }
              }}
              sessionId={sessionId || ''}
            />
          )}
        </div>
      </div>
      
      {/* Input Area or Progress Indicator */}
      <div className={`border-t ${styles.contentBorder} ${styles.cardBg}`}>
        {isProcessing ? (
          <ProgressIndicator
            startTime={messages.find(m => m.isStreaming)?.startTime || new Date()}
            tokenCount={messages.find(m => m.isStreaming)?.tokenCount}
            status="Processing"
            onCancel={handleCancel}
          />
        ) : (
          <ClaudeInput
            onSubmit={handleSubmit}
            onModeChange={handleModeChange}
            mode={mode}
            contextUsage={contextUsage}
            isSubmitting={isSubmitting}
            isConnected={isConnected}
          />
        )}
      </div>
      
      {/* Confirm close dialog */}
      <ConfirmDialog
        isOpen={showCloseConfirm}
        onCancel={() => setShowCloseConfirm(false)}
        onConfirm={handleConfirmClose}
        title="Close Claude Code session"
        message="Are you sure you want to close this Claude Code session? This will clear the chat history and release the repository."
        confirmText="Close session"
        variant="danger"
      />
      
      {/* Session feedback dialog */}
      <FeedbackDialog
        isOpen={showSessionFeedback}
        onClose={closeSessionFeedback}
        onSubmit={submitSessionFeedback}
        isSubmitting={isSubmittingFeedback}
        error={feedbackError}
      />
    </div>
  );
}