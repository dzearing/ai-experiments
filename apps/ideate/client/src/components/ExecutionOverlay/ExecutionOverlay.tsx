import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Slide, Button, SplitPane, Spinner, Dialog } from '@ui-kit/react';
import { ListIcon } from '@ui-kit/icons/ListIcon';
import { PlayIcon } from '@ui-kit/icons/PlayIcon';
import { PauseIcon } from '@ui-kit/icons/PauseIcon';
import { StopIcon } from '@ui-kit/icons/StopIcon';
import { ChatInput, type ChatInputSubmitData, type ChatInputRef } from '@ui-kit/react-chat';
import { useAuth } from '../../contexts/AuthContext';
import { useExecutionAgent, type ExecutionIdeaContext, type ExecutionMessage } from '../../hooks/useExecutionAgent';
import { PlanView } from '../PlanView';
import type { Idea, IdeaPlan } from '../../types/idea';
import styles from './ExecutionOverlay.module.css';

type TabId = 'plan';

export interface ExecutionOverlayProps {
  /** Idea being executed */
  idea: Idea;
  /** Plan to execute */
  plan: IdeaPlan;
  /** Phase ID to execute (or first phase if not specified) */
  phaseId?: string;
  /** Whether the overlay is open */
  open: boolean;
  /** Callback when the overlay should close */
  onClose: () => void;
  /** Callback when execution completes */
  onExecutionComplete?: () => void;
  /** Callback when a task completes */
  onTaskComplete?: (taskId: string, phaseId: string) => void;
  /** Callback when a phase completes */
  onPhaseComplete?: (phaseId: string) => void;
}

/**
 * Format duration from start time to now
 */
function formatDuration(startTime: number): string {
  const seconds = Math.floor((Date.now() - startTime) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

/**
 * Update plan with task/phase completion status
 */
function updatePlanProgress(
  plan: IdeaPlan,
  currentTaskId?: string,
  completedTasks: Set<string> = new Set()
): IdeaPlan {
  return {
    ...plan,
    phases: plan.phases.map(phase => ({
      ...phase,
      tasks: phase.tasks.map(task => ({
        ...task,
        completed: completedTasks.has(task.id),
        inProgress: task.id === currentTaskId,
      })),
    })),
  };
}

/**
 * ExecutionOverlay component
 *
 * Shows Claude Code executing an implementation plan with:
 * - Left pane: Execution log (tool use, results, progress)
 * - Right pane: Plan view with real-time progress
 */
export function ExecutionOverlay({
  idea,
  plan,
  phaseId,
  open,
  onClose,
  onExecutionComplete,
  onTaskComplete,
  onPhaseComplete,
}: ExecutionOverlayProps) {
  const { user } = useAuth();

  const [activeTab] = useState<TabId>('plan');
  const [isBackdropVisible, setIsBackdropVisible] = useState(open);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [duration, setDuration] = useState('0s');
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [hasStarted, setHasStarted] = useState(false);

  const chatInputRef = useRef<ChatInputRef>(null);
  const messageListRef = useRef<HTMLDivElement>(null);

  // Determine which phase to execute
  const targetPhaseId = phaseId || plan.phases[0]?.id;

  // Build idea context for execution agent
  const ideaContext: ExecutionIdeaContext = useMemo(() => ({
    id: idea.id,
    title: idea.title,
    summary: idea.summary,
    description: idea.description,
  }), [idea]);

  // Execution agent hook
  const {
    messages,
    isConnected,
    isExecuting,
    isPaused,
    isBlocked,
    blockedEvent,
    error,
    tokenUsage,
    startExecution,
    sendFeedback,
    pauseExecution,
    resumeExecution,
    cancelExecution,
    clearMessages,
  } = useExecutionAgent({
    ideaId: idea.id,
    userId: user?.id || '',
    userName: user?.name || 'Anonymous',
    onTaskComplete: (event) => {
      setCompletedTasks(prev => new Set([...prev, event.taskId]));
      onTaskComplete?.(event.taskId, event.phaseId);
    },
    onPhaseComplete: (event) => {
      onPhaseComplete?.(event.phaseId);
    },
    onExecutionComplete: () => {
      onExecutionComplete?.();
    },
    onError: (err) => {
      console.error('[ExecutionOverlay] Error:', err);
    },
  });

  // Update plan with current progress
  const updatedPlan = useMemo(() => {
    // Find current task based on messages
    let currentTaskId: string | undefined;
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.type === 'task_complete' && msg.event) {
        // The next task after this completed one is current
        break;
      }
    }
    return updatePlanProgress(plan, currentTaskId, completedTasks);
  }, [plan, completedTasks, messages]);

  // Start execution when overlay opens (if connected and not started)
  useEffect(() => {
    if (open && isConnected && !hasStarted && targetPhaseId) {
      setHasStarted(true);
      setStartTime(Date.now());
      startExecution(ideaContext, plan, targetPhaseId);
    }
  }, [open, isConnected, hasStarted, targetPhaseId, ideaContext, plan, startExecution]);

  // Update duration timer
  useEffect(() => {
    if (!startTime || !isExecuting) return;

    const interval = setInterval(() => {
      setDuration(formatDuration(startTime));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, isExecuting]);

  // Auto-scroll message list
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  // Sync backdrop visibility with open state
  useEffect(() => {
    if (open) {
      setIsBackdropVisible(true);
    } else {
      const timerId = setTimeout(() => {
        setIsBackdropVisible(false);
      }, 250);
      return () => clearTimeout(timerId);
    }
  }, [open]);

  // Reset state when overlay closes
  useEffect(() => {
    if (!open) {
      setHasStarted(false);
      setStartTime(null);
      setCompletedTasks(new Set());
      clearMessages();
    }
  }, [open, clearMessages]);

  // Handle close request
  const handleCloseRequest = useCallback(() => {
    if (isExecuting) {
      setShowConfirmCancel(true);
    } else {
      onClose();
    }
  }, [isExecuting, onClose]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        handleCloseRequest();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleCloseRequest]);

  // Handle cancel confirmation
  const handleConfirmCancel = useCallback(() => {
    cancelExecution();
    setShowConfirmCancel(false);
    onClose();
  }, [cancelExecution, onClose]);

  // Handle feedback submission
  const handleFeedbackSubmit = useCallback((data: ChatInputSubmitData) => {
    const { content } = data;
    if (!content.trim()) return;
    sendFeedback(content.trim());
  }, [sendFeedback]);

  // Get execution status
  const getExecutionStatus = () => {
    if (isBlocked) return 'blocked';
    if (isPaused) return 'paused';
    if (isExecuting) return 'running';
    if (messages.some(m => m.type === 'phase_complete')) return 'completed';
    return 'running';
  };

  const status = getExecutionStatus();

  // Render a message
  const renderMessage = (msg: ExecutionMessage) => {
    const messageClass = styles[msg.type] || styles.text;

    return (
      <div key={msg.id} className={`${styles.message} ${messageClass}`}>
        {msg.toolName && (
          <div className={styles.messageHeader}>
            <span className={styles.toolName}>{msg.toolName}</span>
            {msg.type === 'tool_use' && <Spinner size="sm" />}
          </div>
        )}
        <div className={styles.messageContent}>
          {msg.content}
          {msg.isStreaming && <span className={styles.cursor}>|</span>}
        </div>
      </div>
    );
  };

  const overlay = (
    <div
      className={`${styles.backdrop} ${isBackdropVisible ? styles.open : ''}`}
      role="dialog"
      aria-modal={open}
      aria-label="Execution workspace"
      aria-hidden={!open}
    >
      <Slide
        isVisible={open}
        direction="up"
        duration={250}
        distance={30}
        fade
      >
        <div
          className={styles.overlay}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Main content */}
          <div className={styles.content}>
            <SplitPane
              orientation="horizontal"
              defaultSize="55%"
              minSize={400}
              first={
                <div className={styles.executionPane}>
                  <div className={styles.executionHeader}>
                    <span className={styles.executionTitle}>
                      Claude Code
                      <span className={`${styles.statusBadge} ${styles[status]}`}>
                        {status === 'running' && <Spinner size="sm" />}
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                    </span>
                    {duration && startTime && (
                      <span className={styles.duration}>{duration}</span>
                    )}
                    {tokenUsage && (
                      <span className={styles.tokenUsage}>
                        {tokenUsage.inputTokens + tokenUsage.outputTokens} tokens
                      </span>
                    )}
                  </div>

                  {/* Message list */}
                  <div className={styles.messageList} ref={messageListRef}>
                    {messages.length === 0 ? (
                      <div className={styles.emptyState}>
                        <h3>Starting Execution...</h3>
                        <p>Claude Code will begin executing the plan shortly.</p>
                        <Spinner size="lg" />
                      </div>
                    ) : (
                      messages.map(renderMessage)
                    )}
                  </div>

                  {/* Feedback input */}
                  <div className={styles.feedbackContainer}>
                    {isBlocked && blockedEvent && (
                      <div className={styles.blockedBanner}>
                        <span className={styles.blockedIcon}>!</span>
                        <div className={styles.blockedContent}>
                          <div className={styles.blockedTitle}>Execution Blocked</div>
                          <div className={styles.blockedMessage}>{blockedEvent.issue}</div>
                        </div>
                      </div>
                    )}
                    <ChatInput
                      ref={chatInputRef}
                      placeholder={isBlocked ? "Provide feedback to continue..." : "Send feedback or instructions..."}
                      onSubmit={handleFeedbackSubmit}
                      disabled={!isConnected || (!isExecuting && !isBlocked)}
                      fullWidth
                    />
                  </div>
                </div>
              }
              second={
                <div className={styles.resourcesPane}>
                  {/* Tab bar */}
                  <div className={styles.tabBar}>
                    <div
                      className={`${styles.tab} ${activeTab === 'plan' ? styles.active : ''}`}
                      role="tab"
                      aria-selected={activeTab === 'plan'}
                    >
                      <span className={styles.tabIcon}><ListIcon size={16} /></span>
                      Progress
                    </div>
                  </div>

                  {/* Tab content */}
                  <div className={styles.tabContent}>
                    <div className={styles.tabPanel}>
                      <PlanView
                        plan={updatedPlan}
                        currentPhaseId={targetPhaseId}
                        showWorkingDirectory={true}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <footer className={styles.footer}>
                    <div className={styles.footerLeft}>
                      {error && (
                        <span style={{ color: 'var(--danger-fg)', fontSize: 'var(--text-sm)' }}>
                          {error}
                        </span>
                      )}
                    </div>
                    <div className={styles.footerRight}>
                      {isExecuting && !isPaused && (
                        <Button
                          variant="default"
                          onClick={pauseExecution}
                          icon={<PauseIcon />}
                        >
                          Pause
                        </Button>
                      )}
                      {isExecuting && isPaused && (
                        <Button
                          variant="primary"
                          onClick={resumeExecution}
                          icon={<PlayIcon />}
                        >
                          Resume
                        </Button>
                      )}
                      {isExecuting && (
                        <Button
                          variant="danger"
                          onClick={() => setShowConfirmCancel(true)}
                          icon={<StopIcon />}
                        >
                          Cancel
                        </Button>
                      )}
                      {!isExecuting && (
                        <Button
                          variant="primary"
                          onClick={onClose}
                        >
                          Done
                        </Button>
                      )}
                    </div>
                  </footer>
                </div>
              }
            />
          </div>
        </div>
      </Slide>

      {/* Confirm cancel dialog */}
      <Dialog
        open={showConfirmCancel}
        onClose={() => setShowConfirmCancel(false)}
        title="Cancel Execution?"
        size="sm"
        footer={
          <div className={styles.dialogFooter}>
            <Button variant="ghost" onClick={() => setShowConfirmCancel(false)}>
              Continue Execution
            </Button>
            <Button
              variant="danger"
              autoFocus
              onClick={handleConfirmCancel}
            >
              Cancel Execution
            </Button>
          </div>
        }
      >
        <p>Are you sure you want to cancel the current execution? Progress will be lost.</p>
      </Dialog>
    </div>
  );

  return createPortal(overlay, document.body);
}

ExecutionOverlay.displayName = 'ExecutionOverlay';

export default ExecutionOverlay;
