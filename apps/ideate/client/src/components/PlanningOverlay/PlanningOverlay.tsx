import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Slide, Button, IconButton, SplitPane, Spinner, Dialog } from '@ui-kit/react';
import { TrashIcon } from '@ui-kit/icons/TrashIcon';
import { FileIcon } from '@ui-kit/icons/FileIcon';
import { ListIcon } from '@ui-kit/icons/ListIcon';
import { PlayIcon } from '@ui-kit/icons/PlayIcon';
import { ChatPanel, ChatInput, ThinkingIndicator, MessageQueue, type ChatInputSubmitData, type ChatInputRef, type ChatPanelMessage, type QueuedMessage } from '@ui-kit/react-chat';
import { useAuth } from '../../contexts/AuthContext';
import { usePlanAgent, type PlanIdeaContext } from '../../hooks/usePlanAgent';
import { useChatCommands } from '../../hooks/useChatCommands';
import { useModelPreference } from '../../hooks/useModelPreference';
import { PlanView } from '../PlanView';
import type { Idea, IdeaPlan } from '../../types/idea';
import styles from './PlanningOverlay.module.css';

type TabId = 'idea' | 'plan';

export interface PlanningOverlayProps {
  /** Idea to create a plan for */
  idea: Idea;
  /** Whether the overlay is open */
  open: boolean;
  /** Callback when the overlay should close */
  onClose: () => void;
  /** Callback when plan is ready and user wants to start execution */
  onStartExecution?: (plan: IdeaPlan) => void;
  /** Callback when plan is updated */
  onPlanUpdate?: (plan: Partial<IdeaPlan>) => void;
}

/**
 * Convert a partial plan to a full IdeaPlan with defaults
 */
function toFullPlan(partial: Partial<IdeaPlan> | null): IdeaPlan | null {
  if (!partial || !partial.phases || partial.phases.length === 0) {
    return null;
  }
  return {
    phases: partial.phases,
    workingDirectory: partial.workingDirectory || process.cwd?.() || '.',
    repositoryUrl: partial.repositoryUrl,
    branch: partial.branch,
    isClone: partial.isClone,
    workspaceId: partial.workspaceId,
    createdAt: partial.createdAt || new Date().toISOString(),
    updatedAt: partial.updatedAt || new Date().toISOString(),
  };
}

/**
 * PlanningOverlay component
 *
 * A large overlay for creating implementation plans with:
 * - Left pane: Chat with the Plan Agent for planning
 * - Right pane: Tabbed view showing idea details and plan
 */
export function PlanningOverlay({
  idea,
  open,
  onClose,
  onStartExecution,
  onPlanUpdate,
}: PlanningOverlayProps) {
  const { user } = useAuth();
  const { modelId, setModelId, modelInfo } = useModelPreference();

  const [activeTab, setActiveTab] = useState<TabId>('plan');
  const [isBackdropVisible, setIsBackdropVisible] = useState(open);
  const [queuedMessages, setQueuedMessages] = useState<QueuedMessage[]>([]);
  const [inputContent, setInputContent] = useState('');
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const isProcessingQueueRef = useRef(false);
  const chatInputRef = useRef<ChatInputRef>(null);

  // Build idea context for the plan agent
  const ideaContext: PlanIdeaContext = useMemo(() => ({
    id: idea.id,
    title: idea.title,
    summary: idea.summary,
    description: idea.description,
    tags: idea.tags,
    status: idea.status,
  }), [idea]);

  // Stable error handler
  const handleAgentError = useCallback((err: string) => {
    console.error('[PlanningOverlay] Agent error:', err);
  }, []);

  // Plan agent hook
  const {
    messages: agentMessages,
    isConnected,
    isLoading: isAgentThinking,
    plan,
    tokenUsage,
    sendMessage: sendAgentMessage,
    addLocalMessage,
    clearHistory,
    cancelRequest,
  } = usePlanAgent({
    ideaId: idea.id,
    userId: user?.id || '',
    userName: user?.name || 'Anonymous',
    ideaContext,
    initialPlan: idea.plan,
    onError: handleAgentError,
    onPlanUpdate: onPlanUpdate,
    modelId,
  });

  // Chat commands (/clear, /help, /model)
  const { commands, handleCommand } = useChatCommands({
    clearMessages: clearHistory,
    addMessage: (msg) => addLocalMessage({
      id: msg.id,
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
      timestamp: msg.timestamp,
    }),
    helpText: `## Available Commands

- **/clear** - Clear all chat history
- **/help** - Show this help message
- **/model** - View or change the AI model

## Tips

- Describe what you want to accomplish
- Ask the agent to break it down into phases and tasks
- Review and refine the plan before starting execution
- The agent can see your idea's title, summary, and description`,
    currentModelInfo: modelInfo,
    onModelChange: setModelId,
  });

  // Convert agent messages to ChatPanel format
  const chatMessages: ChatPanelMessage[] = useMemo(() => {
    return agentMessages.map(msg => ({
      id: msg.id,
      content: msg.content,
      timestamp: msg.timestamp,
      senderName: msg.role === 'user' ? (user?.name || 'You') : 'Plan Agent',
      senderColor: msg.role === 'user' ? undefined : '#3b82f6',
      isOwn: msg.role === 'user',
      isStreaming: msg.isStreaming,
      renderMarkdown: msg.role === 'assistant',
    }));
  }, [agentMessages, user?.name]);

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

  // Focus chat input when overlay opens
  useEffect(() => {
    if (open) {
      const timerId = setTimeout(() => {
        chatInputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timerId);
    }
  }, [open]);

  // Handle cancel operation
  const handleCancelOperation = useCallback(() => {
    cancelRequest();
    addLocalMessage({
      id: `system-${Date.now()}`,
      role: 'assistant',
      content: '*User interrupted.*',
      timestamp: Date.now(),
    });
  }, [cancelRequest, addLocalMessage]);

  // Handle close with unsaved changes check
  const handleCloseRequest = useCallback(() => {
    // If there's a plan, warn about losing it
    if (plan && plan.phases && plan.phases.length > 0) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  }, [onClose, plan]);

  // Handle escape key
  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isAgentThinking && !inputContent.trim()) {
          event.preventDefault();
          handleCancelOperation();
          return;
        }

        if (inputContent.trim()) {
          return;
        }

        event.preventDefault();
        handleCloseRequest();
      }
    },
    [isAgentThinking, inputContent, handleCancelOperation, handleCloseRequest]
  );

  // Add/remove escape key listener when open
  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, handleEscape]);

  // Process queued messages when AI finishes thinking
  useEffect(() => {
    if (!isAgentThinking && queuedMessages.length > 0 && !isProcessingQueueRef.current) {
      isProcessingQueueRef.current = true;

      const combinedContent = queuedMessages.map(msg => msg.content).join('\n');
      setQueuedMessages([]);

      sendAgentMessage(combinedContent);

      isProcessingQueueRef.current = false;
    }
  }, [isAgentThinking, queuedMessages, sendAgentMessage]);

  const handleChatSubmit = useCallback((data: ChatInputSubmitData) => {
    const { content } = data;
    if (!content.trim()) return;

    if (isAgentThinking) {
      const queuedMessage: QueuedMessage = {
        id: `queued-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        content: content.trim(),
        timestamp: Date.now(),
      };
      setQueuedMessages((prev) => [...prev, queuedMessage]);
      setInputContent('');
      return;
    }

    sendAgentMessage(content.trim());
    setInputContent('');
  }, [sendAgentMessage, isAgentThinking]);

  const handleInputChange = useCallback((_isEmpty: boolean, content: string) => {
    setInputContent(content);
  }, []);

  const removeQueuedMessage = useCallback((id: string) => {
    setQueuedMessages((prev) => prev.filter((msg) => msg.id !== id));
  }, []);

  const handleClearChat = useCallback(() => {
    clearHistory();
  }, [clearHistory]);

  const handleStartExecution = useCallback(() => {
    const fullPlan = toFullPlan(plan);
    if (fullPlan) {
      onStartExecution?.(fullPlan);
    }
  }, [plan, onStartExecution]);

  // Convert partial plan to full plan for display
  const fullPlan = useMemo(() => toFullPlan(plan), [plan]);

  // Check if plan is ready for execution
  const isPlanReady = fullPlan && fullPlan.phases.length > 0 && fullPlan.phases.some(p => p.tasks.length > 0);

  // Empty state for chat panel
  const chatEmptyState = (
    <div className={styles.chatEmptyState}>
      <h3>Plan Your Implementation</h3>
      <p>
        Chat with the Plan Agent to create a detailed implementation plan for "{idea.title}".
      </p>
    </div>
  );

  const overlay = (
    <div
      className={`${styles.backdrop} ${isBackdropVisible ? styles.open : ''}`}
      role="dialog"
      aria-modal={open}
      aria-label="Planning workspace"
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
              defaultSize="40%"
              minSize={300}
              first={
                <div className={styles.chatPane}>
                  <div className={styles.chatHeader}>
                    <span className={styles.chatTitle}>Plan Agent</span>
                    <span className={`${styles.connectionStatus} ${isConnected ? styles.connected : ''}`}>
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                    {tokenUsage && (
                      <span className={styles.tokenUsage}>
                        {tokenUsage.inputTokens + tokenUsage.outputTokens} tokens
                      </span>
                    )}
                    <IconButton
                      icon={<TrashIcon />}
                      variant="ghost"
                      size="sm"
                      onClick={handleClearChat}
                      aria-label="Clear chat"
                      disabled={!isConnected}
                    />
                  </div>

                  <ChatPanel
                    messages={chatMessages}
                    emptyState={chatEmptyState}
                    className={styles.chatPanel}
                  />

                  <ThinkingIndicator isActive={isAgentThinking} showEscapeHint={isAgentThinking && !inputContent.trim()} />

                  <MessageQueue
                    messages={queuedMessages}
                    onRemove={removeQueuedMessage}
                  />

                  <div className={styles.chatInputContainer}>
                    <ChatInput
                      ref={chatInputRef}
                      placeholder={!isConnected ? "Connecting..." : isAgentThinking ? "Type to queue message..." : "Describe what you want to build... (type / for commands)"}
                      onSubmit={handleChatSubmit}
                      onChange={handleInputChange}
                      historyKey={`plan-agent-${idea.id}`}
                      fullWidth
                      commands={commands}
                      onCommand={handleCommand}
                    />
                  </div>
                </div>
              }
              second={
                <div className={styles.resourcesPane}>
                  {/* Tab bar */}
                  <div className={styles.tabBar}>
                    <div
                      className={`${styles.tab} ${activeTab === 'idea' ? styles.active : ''}`}
                      onClick={() => setActiveTab('idea')}
                      role="tab"
                      tabIndex={0}
                      aria-selected={activeTab === 'idea'}
                    >
                      <span className={styles.tabIcon}><FileIcon size={16} /></span>
                      Idea
                    </div>
                    <div
                      className={`${styles.tab} ${activeTab === 'plan' ? styles.active : ''}`}
                      onClick={() => setActiveTab('plan')}
                      role="tab"
                      tabIndex={0}
                      aria-selected={activeTab === 'plan'}
                    >
                      <span className={styles.tabIcon}><ListIcon size={16} /></span>
                      Plan
                      {fullPlan && fullPlan.phases.length > 0 && (
                        <span style={{ marginLeft: 4, opacity: 0.7 }}>
                          ({fullPlan.phases.length})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tab content */}
                  <div className={styles.tabContent}>
                    {activeTab === 'idea' && (
                      <div className={styles.tabPanel}>
                        <div className={styles.ideaSummary}>
                          <h2 className={styles.ideaTitle}>{idea.title}</h2>
                          <p className={styles.ideaSummaryText}>{idea.summary}</p>
                          {idea.tags.length > 0 && (
                            <div className={styles.ideaTags}>
                              {idea.tags.map(tag => (
                                <span key={tag} className={styles.ideaTag}>{tag}</span>
                              ))}
                            </div>
                          )}
                          {idea.description && (
                            <div className={styles.ideaDescription}>
                              <div className={styles.ideaDescriptionLabel}>Description</div>
                              <div className={styles.ideaDescriptionText}>{idea.description}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {activeTab === 'plan' && (
                      <div className={styles.tabPanel}>
                        <PlanView
                          plan={fullPlan}
                          showWorkingDirectory={true}
                        />
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <footer className={styles.footer}>
                    <div className={styles.footerLeft}>
                      <Button variant="ghost" onClick={handleCloseRequest}>
                        Cancel
                      </Button>
                    </div>
                    <div className={styles.footerRight}>
                      <Button
                        variant="primary"
                        onClick={handleStartExecution}
                        disabled={!isPlanReady || isAgentThinking}
                        icon={isAgentThinking ? <Spinner size="sm" /> : <PlayIcon />}
                      >
                        Start Execution
                      </Button>
                    </div>
                  </footer>
                </div>
              }
            />
          </div>
        </div>
      </Slide>

      {/* Confirm close dialog */}
      <Dialog
        open={showConfirmClose}
        onClose={() => setShowConfirmClose(false)}
        title="Discard plan?"
        size="sm"
        footer={
          <div className={styles.dialogFooter}>
            <Button variant="ghost" onClick={() => setShowConfirmClose(false)}>
              Keep Planning
            </Button>
            <Button
              variant="danger"
              autoFocus
              onClick={() => {
                setShowConfirmClose(false);
                onClose();
              }}
            >
              Discard
            </Button>
          </div>
        }
      >
        <p>You have an unsaved plan. Are you sure you want to close without starting execution?</p>
      </Dialog>
    </div>
  );

  return createPortal(overlay, document.body);
}

PlanningOverlay.displayName = 'PlanningOverlay';

export default PlanningOverlay;
