import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContextV2';
import { useLayout } from '../contexts/LayoutContext';
import { useApp } from '../contexts/AppContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { ClaudeCodeProvider, useClaudeCode } from '../contexts/ClaudeCodeContext';
import { VirtualMessageList } from '../components/claude-code/VirtualMessageList';
import { ClaudeInput } from '../components/claude-code/ClaudeInput';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import type { ClaudeMode } from '../contexts/ClaudeCodeContext';

export function ClaudeCode() {
  return (
    <ClaudeCodeProvider>
      <ClaudeCodeContent />
    </ClaudeCodeProvider>
  );
}

function ClaudeCodeContent() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { currentStyles } = useTheme();
  const { setHeaderContent } = useLayout();
  const { projects } = useApp();
  const { projects: workspaceProjects } = useWorkspace();
  const {
    messages,
    mode,
    contextUsage,
    isInitializing,
    isConnected,
    error,
    sendMessage,
    setMode,
    initializeSession
  } = useClaudeCode();
  
  const styles = currentStyles;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const project = projects.find(p => p.id === projectId);
  const workspaceProject = workspaceProjects.find(p => p.name === project?.name);
  
  // Set breadcrumb
  useEffect(() => {
    if (project) {
      setHeaderContent([
        { label: 'Projects', path: '/projects' },
        { label: project.name, path: `/projects/${projectId}` },
        { label: 'Claude Code' }
      ]);
    }
    
    return () => {
      setHeaderContent(null);
    };
  }, [project, projectId, setHeaderContent]);
  
  // Initialize session
  useEffect(() => {
    if (projectId && workspaceProject?.path) {
      initializeSession(projectId, workspaceProject.path);
    }
  }, [projectId, workspaceProject?.path, initializeSession]);
  
  const handleSubmit = useCallback(async (message: string) => {
    if (!message.trim() || isSubmitting || !isConnected) return;
    
    setIsSubmitting(true);
    setInput('');
    
    try {
      await sendMessage(message);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, isConnected, sendMessage]);
  
  const handleModeChange = useCallback((newMode: ClaudeMode) => {
    setMode(newMode);
  }, [setMode]);
  
  if (!project) {
    return (
      <div className={`flex items-center justify-center h-full ${styles.textColor}`}>
        <div className="text-center">
          <p className="text-lg mb-4">Project not found</p>
          <button
            onClick={() => navigate('/projects')}
            className={`px-4 py-2 ${styles.primaryButton} ${styles.primaryButtonText} ${styles.buttonRadius}`}
          >
            Back to Projects
          </button>
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
          <button
            onClick={() => {
              if (projectId && workspaceProject?.path) {
                initializeSession(projectId, workspaceProject.path);
              }
            }}
            className={`px-4 py-2 ${styles.primaryButton} ${styles.primaryButtonText} ${styles.buttonRadius}`}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      {/* Messages Area */}
      <div 
        ref={scrollContainerRef}
        className={`flex-1 overflow-auto ${styles.contentBg}`}
      >
        <VirtualMessageList 
          messages={messages}
          scrollContainerRef={scrollContainerRef as React.RefObject<HTMLDivElement>}
        />
      </div>
      
      {/* Input Area */}
      <div className={`border-t ${styles.contentBorder} ${styles.cardBg}`}>
        <ClaudeInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          onModeChange={handleModeChange}
          mode={mode}
          contextUsage={contextUsage}
          isSubmitting={isSubmitting}
          isConnected={isConnected}
        />
      </div>
    </div>
  );
}