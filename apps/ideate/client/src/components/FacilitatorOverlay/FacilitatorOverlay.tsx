import { useEffect, useCallback, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from '@ui-kit/router';
import { Slide, Button, IconButton, Avatar } from '@ui-kit/react';
import { CloseIcon } from '@ui-kit/icons/CloseIcon';
import { GearIcon } from '@ui-kit/icons/GearIcon';
import { ChatInput, ChatMessage, ThinkingIndicator, OpenQuestionsResolver, type ChatInputSubmitData, type ChatInputRef, type TopicReference as ChatTopicReference } from '@ui-kit/react-chat';
import { AVATAR_IMAGES } from '../../constants/avatarImages';
import { useFacilitator } from '../../contexts/FacilitatorContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTopics } from '../../contexts/TopicsContext';
import { useFacilitatorSocket } from '../../hooks/useFacilitatorSocket';
import { useChatCommands } from '../../hooks/useChatCommands';
import { useModelPreference } from '../../hooks/useModelPreference';
import { API_URL } from '../../config';
import styles from './FacilitatorOverlay.module.css';

interface FacilitatorSettings {
  name: string;
  avatar: string;
}


/**
 * FacilitatorOverlay component
 *
 * A global chat overlay for interacting with the AI facilitator.
 * Triggered by Ctrl/Cmd + ` keyboard shortcut.
 * Slides up from the bottom of the screen with a semi-transparent backdrop.
 */
export function FacilitatorOverlay() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getTopicReferences } = useTopics();
  const { modelId, setModelId, modelInfo } = useModelPreference();
  const {
    isOpen,
    messages,
    connectionState,
    isLoading,
    error,
    close,
    sendMessage: contextSendMessage,
    clearMessages,
    addMessage,
    pendingMessage,
    clearPendingMessage,
    openQuestions,
    showQuestionsResolver,
    setShowQuestionsResolver,
    resolveQuestions,
  } = useFacilitator();

  // Get topic references for chat autocomplete (from shared context)
  const topicReferences = getTopicReferences();

  const [isBackdropVisible, setIsBackdropVisible] = useState(isOpen);
  const [queuedContent, setQueuedContent] = useState('');
  const [inputContent, setInputContent] = useState('');
  const [facilitatorSettings, setFacilitatorSettings] = useState<FacilitatorSettings>({
    name: 'Facilitator',
    avatar: 'robot',
  });
  const panelRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<ChatInputRef>(null);
  const isProcessingQueueRef = useRef(false);

  // Fetch facilitator settings and check for persona reload when overlay opens
  useEffect(() => {
    const fetchSettingsAndCheckReload = async () => {
      try {
        // Fetch settings
        const settingsRes = await fetch(`${API_URL}/api/personas/settings`);
        if (settingsRes.ok) {
          const data = await settingsRes.json();
          setFacilitatorSettings(data);
        }

        // Check if persona was changed and needs reload
        if (isOpen) {
          const reloadRes = await fetch(`${API_URL}/api/personas/check-reload`);
          if (reloadRes.ok) {
            const { needsReload } = await reloadRes.json();
            if (needsReload) {
              // Clear messages and show greeting with new persona
              clearMessages();
              addMessage({
                id: `greeting-${Date.now()}`,
                role: 'assistant',
                parts: [{ type: 'text', text: `Hello! I'm ${facilitatorSettings.name}, your facilitator. My personality has been updated. How can I help you today?` }],
                timestamp: Date.now(),
              });
            }
          }
        }
      } catch (err) {
        console.error('[FacilitatorOverlay] Failed to fetch settings:', err);
      }
    };
    fetchSettingsAndCheckReload();
  }, [isOpen, clearMessages, addMessage, facilitatorSettings.name]);

  // Sync backdrop visibility with isOpen, but delay hiding for exit animation
  useEffect(() => {
    if (isOpen) {
      setIsBackdropVisible(true);
    } else {
      // Delay hiding backdrop until exit animation completes (250ms)
      const timerId = setTimeout(() => {
        setIsBackdropVisible(false);
      }, 250);
      return () => clearTimeout(timerId);
    }
  }, [isOpen]);

  // Focus the chat input when overlay opens
  useEffect(() => {
    if (isOpen) {
      // Wait for slide animation to complete (250ms) plus buffer for editor to initialize
      const timerId = setTimeout(() => {
        chatInputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timerId);
    }
  }, [isOpen]);

  // Connect to facilitator WebSocket
  const { sendMessage: socketSendMessage, clearHistory: socketClearHistory, cancelOperation, isConnected } = useFacilitatorSocket({
    userId: user?.id || '',
    userName: user?.name || 'Anonymous',
    onError: (err) => console.error('[Facilitator] Socket error:', err),
    modelId,
  });

  // Chat commands (/clear, /help, /model)
  const { commands, handleCommand } = useChatCommands({
    clearMessages,
    clearServerHistory: socketClearHistory,
    addMessage: (msg) => addMessage({
      id: msg.id,
      role: msg.role === 'system' ? 'assistant' : msg.role,
      parts: [{ type: 'text', text: msg.content }],
      timestamp: msg.timestamp,
    }),
    helpText: `## Available Commands

- **/clear** - Clear all chat history
- **/help** - Show this help message
- **/model** - View or change the AI model

## Features

- Ask questions about your workspaces and documents
- Create, edit, and search documents
- Get summaries of your content
- Press **Ctrl+.** (or **Cmd+.** on Mac) to toggle this overlay
- Press **Escape** to close

Type a message to get started!`,
    currentModelInfo: modelInfo,
    onModelChange: setModelId,
  });

  // Process queued content when AI finishes thinking
  useEffect(() => {
    if (!isLoading && queuedContent && !isProcessingQueueRef.current) {
      isProcessingQueueRef.current = true;

      // Send the entire queued content
      const contentToSend = queuedContent;
      setQueuedContent('');

      // Add to context and send
      contextSendMessage(contentToSend);
      if (isConnected) {
        socketSendMessage(contentToSend);
      }

      isProcessingQueueRef.current = false;
    }
  }, [isLoading, queuedContent, contextSendMessage, socketSendMessage, isConnected]);

  // Process pending message when connected (from openWithMessage)
  useEffect(() => {
    if (pendingMessage && isConnected && !isLoading) {
      // Add user message to context and send to server
      contextSendMessage(pendingMessage);
      socketSendMessage(pendingMessage);
      clearPendingMessage();
    }
  }, [pendingMessage, isConnected, isLoading, contextSendMessage, socketSendMessage, clearPendingMessage]);

  // Handle cancel operation
  const handleCancelOperation = useCallback(() => {
    cancelOperation();
    // Add a system message indicating the operation was stopped
    addMessage({
      id: `system-${Date.now()}`,
      role: 'system',
      parts: [{ type: 'text', text: 'Thinking stopped by user.' }],
      timestamp: Date.now(),
    });
  }, [cancelOperation, addMessage]);

  // Handle escape key for closing overlay or cancelling operation
  const handleEscapeKey = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // If loading and no input, cancel operation
        if (isLoading && !inputContent.trim()) {
          event.preventDefault();
          handleCancelOperation();
          return;
        }

        // If there's input content, let the input handle Escape (clear input)
        if (inputContent.trim()) {
          return;
        }

        // Otherwise close the overlay
        event.preventDefault();
        close();
      }
    },
    [isLoading, inputContent, handleCancelOperation, close]
  );

  // Add/remove escape key listener when open
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }
  }, [isOpen, handleEscapeKey]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  // Handle sending a message
  const handleSendMessage = useCallback(
    (data: ChatInputSubmitData) => {
      const { content, topicReferences } = data;
      if (!content.trim()) return;

      // Extract Topic IDs from references
      const topicIds = topicReferences?.map(ref => ref.id) || [];

      // If AI is busy, append to queued content
      if (isLoading) {
        setQueuedContent((prev) => prev ? `${prev}\n${content.trim()}` : content.trim());
        setInputContent('');
        return;
      }

      // Add user message to context
      contextSendMessage(content);

      // Send to server via WebSocket with Topic IDs
      if (isConnected) {
        socketSendMessage(content, topicIds);
      }

      setInputContent('');
    },
    [contextSendMessage, socketSendMessage, isConnected, isLoading]
  );

  // Track input content changes
  const handleInputChange = useCallback((_isEmpty: boolean, content: string) => {
    setInputContent(content);
  }, []);

  // Clear the queued content
  const clearQueuedContent = useCallback(() => {
    setQueuedContent('');
  }, []);

  // Handle editing queued content (when user presses Up at cursor position 0)
  const handleEditQueue = useCallback((_concatenatedContent: string) => {
    // Clear the queue - the content is already set in the input by ChatInput
    setQueuedContent('');
  }, []);

  // Handle navigating to settings
  const handleOpenSettings = useCallback(() => {
    close();
    navigate('/settings/facilitator');
  }, [close, navigate]);

  // Get status indicator class
  const getStatusClass = () => {
    switch (connectionState) {
      case 'connected':
        return styles.connected;
      case 'connecting':
        return styles.connecting;
      case 'error':
        return styles.error;
      default:
        return '';
    }
  };

  // Always render - just hidden when not open
  const overlay = (
    <div
      className={`${styles.backdrop} ${isBackdropVisible ? styles.open : ''}`}
      role="dialog"
      aria-modal={isOpen}
      aria-label="Facilitator chat"
      aria-hidden={!isOpen}
    >
      <Slide
        isVisible={isOpen}
        direction="up"
        duration={250}
        distance={30}
        fade
      >
        <div
          ref={panelRef}
          className={styles.panel}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <header className={styles.header}>
            <div className={styles.headerLeft}>
              <h2 className={styles.title}>{facilitatorSettings.name}</h2>
              <span
                className={`${styles.statusIndicator} ${getStatusClass()}`}
                title={`Connection: ${connectionState}`}
              />
            </div>
            <div className={styles.shortcutHint}>
              <IconButton
                icon={<GearIcon />}
                variant="ghost"
                size="sm"
                onClick={handleOpenSettings}
                aria-label="Facilitator settings"
              />
              <IconButton
                icon={<CloseIcon />}
                variant="ghost"
                size="sm"
                onClick={close}
                aria-label="Close facilitator"
              />
            </div>
          </header>

          {/* Error banner */}
          {error && (
            <div className={styles.errorBanner}>
              <span>{error}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
          )}

          {/* Messages */}
          <div ref={messagesContainerRef} className={styles.messagesContainer}>
            {messages.length === 0 ? (
              <div className={styles.emptyState}>
                <h3 className={styles.emptyStateTitle}>
                  How can I help you today?
                </h3>
                <p className={styles.emptyStateSubtitle}>
                  Ask me anything about your workspaces, documents, or tasks.
                </p>
              </div>
            ) : (
              messages.map((message, index) => {
                const prevMessage = index > 0 ? messages[index - 1] : null;
                const isConsecutive = prevMessage?.role === message.role;
                const isUser = message.role === 'user';
                const isSystem = message.role === 'system';

                // Get bot avatar image
                const botAvatarSrc = AVATAR_IMAGES[facilitatorSettings.avatar] || AVATAR_IMAGES.robot;

                return (
                  <ChatMessage
                    key={message.id}
                    id={message.id}
                    parts={message.parts}
                    timestamp={message.timestamp}
                    senderName={isUser ? (user?.name || 'You') : facilitatorSettings.name}
                    senderColor={isUser ? undefined : '#6366f1'}
                    isOwn={isUser}
                    isSystem={isSystem}
                    isConsecutive={isConsecutive && !isSystem}
                    renderMarkdown={true}
                    isStreaming={message.isStreaming}
                    avatar={!isUser && !isSystem ? (
                      <Avatar
                        type="bot"
                        src={botAvatarSrc}
                        alt={facilitatorSettings.name}
                        size="md"
                      />
                    ) : undefined}
                  />
                );
              })
            )}
          </div>

          {/* Thinking indicator */}
          <ThinkingIndicator isActive={isLoading} showEscapeHint={isLoading && !inputContent.trim()} />

          {/* Question resolver overlay */}
          {showQuestionsResolver && openQuestions && openQuestions.length > 0 && (
            <div className={styles.questionsResolverOverlay}>
              <OpenQuestionsResolver
                questions={openQuestions}
                onComplete={resolveQuestions}
                onDismiss={() => setShowQuestionsResolver(false)}
                variant="centered"
              />
            </div>
          )}

          {/* Queued content */}
          {queuedContent && (
            <div className={styles.queueContainer}>
              <div className={styles.queueHeader}>
                <span className={styles.queueLabel}>Queued</span>
              </div>
              <div className={styles.queueList}>
                <div className={styles.queuedMessage}>
                  <span className={styles.queuedContent}>{queuedContent}</span>
                  <IconButton
                    icon={<CloseIcon />}
                    variant="ghost"
                    size="sm"
                    onClick={clearQueuedContent}
                    aria-label="Clear queued message"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Chat input - never disabled for loading, only for connection issues */}
          <div className={styles.inputContainer}>
            <ChatInput
              ref={chatInputRef}
              placeholder={isLoading ? "Type to queue message..." : "Ask the facilitator... (type / for commands, ^ for topics)"}
              onSubmit={handleSendMessage}
              onChange={handleInputChange}
              disabled={connectionState === 'connecting'}
              historyKey="facilitator"
              fullWidth
              commands={commands}
              onCommand={handleCommand}
              topics={topicReferences as ChatTopicReference[]}
              queuedMessages={queuedContent ? [queuedContent] : []}
              onEditQueue={handleEditQueue}
            />
          </div>
        </div>
      </Slide>
    </div>
  );

  return createPortal(overlay, document.body);
}

FacilitatorOverlay.displayName = 'FacilitatorOverlay';

export default FacilitatorOverlay;
