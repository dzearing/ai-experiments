import { useEffect, useCallback, useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from '@ui-kit/router';
import { Slide, Button, IconButton, Avatar } from '@ui-kit/react';
import { CloseIcon } from '@ui-kit/icons/CloseIcon';
import { TrashIcon } from '@ui-kit/icons/TrashIcon';
import { HelpIcon } from '@ui-kit/icons/HelpIcon';
import { GearIcon } from '@ui-kit/icons/GearIcon';
import { ChatInput, ChatMessage, type ChatInputSubmitData, type ChatInputRef, type SlashCommand } from '@ui-kit/react-chat';
import { AVATAR_IMAGES } from '../../constants/avatarImages';
import { useFacilitator } from '../../contexts/FacilitatorContext';
import { useAuth } from '../../contexts/AuthContext';
import { useFacilitatorSocket } from '../../hooks/useFacilitatorSocket';
import { ThinkingIndicator } from './ThinkingIndicator';
import { API_URL } from '../../config';
import styles from './FacilitatorOverlay.module.css';

interface FacilitatorSettings {
  name: string;
  avatar: string;
}

interface QueuedMessage {
  id: string;
  content: string;
  timestamp: number;
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
  } = useFacilitator();

  // Define slash commands
  const slashCommands: SlashCommand[] = useMemo(
    () => [
      {
        name: 'clear',
        description: 'Clear all chat history',
        icon: <TrashIcon />,
        usage: '/clear',
      },
      {
        name: 'help',
        description: 'Show available commands and features',
        icon: <HelpIcon />,
        usage: '/help',
      },
    ],
    []
  );

  const [isBackdropVisible, setIsBackdropVisible] = useState(isOpen);
  const [queuedMessages, setQueuedMessages] = useState<QueuedMessage[]>([]);
  const [inputContent, setInputContent] = useState('');
  const [facilitatorSettings, setFacilitatorSettings] = useState<FacilitatorSettings>({
    name: 'Facilitator',
    avatar: 'robot',
  });
  const panelRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
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
                content: `Hello! I'm ${facilitatorSettings.name}, your facilitator. My personality has been updated. How can I help you today?`,
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
  });

  // Process queued messages when AI finishes thinking
  useEffect(() => {
    if (!isLoading && queuedMessages.length > 0 && !isProcessingQueueRef.current) {
      isProcessingQueueRef.current = true;

      // Get the first queued message
      const [nextMessage, ...remaining] = queuedMessages;
      setQueuedMessages(remaining);

      // Add to context and send
      contextSendMessage(nextMessage.content);
      if (isConnected) {
        socketSendMessage(nextMessage.content);
      }

      isProcessingQueueRef.current = false;
    }
  }, [isLoading, queuedMessages, contextSendMessage, socketSendMessage, isConnected]);

  // Handle cancel operation
  const handleCancelOperation = useCallback(() => {
    cancelOperation();
    // Add a system message indicating the operation was stopped
    addMessage({
      id: `system-${Date.now()}`,
      role: 'assistant',
      content: '*Thinking stopped by user.*',
      timestamp: Date.now(),
    });
  }, [cancelOperation, addMessage]);

  // Handle escape key - cancel operation if busy and input empty, otherwise close
  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // If AI is busy and input is empty, cancel the operation
        if (isLoading && !inputContent.trim()) {
          event.preventDefault();
          handleCancelOperation();
        } else {
          close();
        }
      }
    },
    [close, isLoading, inputContent, handleCancelOperation]
  );

  // Add/remove escape key listener when open
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscape]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle sending a message
  const handleSendMessage = useCallback(
    (data: ChatInputSubmitData) => {
      const { content } = data;
      if (!content.trim()) return;

      // If AI is busy, queue the message
      if (isLoading) {
        const queuedMessage: QueuedMessage = {
          id: `queued-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          content: content.trim(),
          timestamp: Date.now(),
        };
        setQueuedMessages((prev) => [...prev, queuedMessage]);
        setInputContent('');
        return;
      }

      // Add user message to context
      contextSendMessage(content);

      // Send to server via WebSocket
      if (isConnected) {
        socketSendMessage(content);
      }

      setInputContent('');
    },
    [contextSendMessage, socketSendMessage, isConnected, isLoading]
  );

  // Track input content changes
  const handleInputChange = useCallback((_isEmpty: boolean, content: string) => {
    setInputContent(content);
  }, []);

  // Remove a queued message
  const removeQueuedMessage = useCallback((id: string) => {
    setQueuedMessages((prev) => prev.filter((msg) => msg.id !== id));
  }, []);

  // Handle slash commands
  const handleCommand = useCallback(
    (command: string, _args: string) => {
      switch (command) {
        case 'clear':
          clearMessages();
          // Also clear server-side history
          socketClearHistory();
          return { handled: true, clearInput: true };

        case 'help':
          // Add a system message explaining the features
          const helpMessage = `## Available Commands

- **/clear** - Clear all chat history
- **/help** - Show this help message

## Features

- Ask questions about your workspaces and documents
- Create, edit, and search documents
- Get summaries of your content
- Press **Ctrl+.** (or **Cmd+.** on Mac) to toggle this overlay
- Press **Escape** to close

Type a message to get started!`;

          // Add help as an assistant message
          addMessage({
            id: `help-${Date.now()}`,
            role: 'assistant',
            content: helpMessage,
            timestamp: Date.now(),
          });
          return { handled: true, clearInput: true };

        default:
          return { handled: false };
      }
    },
    [clearMessages, addMessage, socketClearHistory]
  );

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
              <span className={styles.shortcutKey}>Esc</span>
              <span>to close</span>
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
          <div className={styles.messagesContainer}>
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
              <>
                {messages.map((message, index) => {
                  const prevMessage = index > 0 ? messages[index - 1] : null;
                  const isConsecutive = prevMessage?.role === message.role;
                  const isUser = message.role === 'user';

                  // Get bot avatar image
                  const botAvatarSrc = AVATAR_IMAGES[facilitatorSettings.avatar] || AVATAR_IMAGES.robot;

                  return (
                    <ChatMessage
                      key={message.id}
                      id={message.id}
                      content={message.content}
                      timestamp={message.timestamp}
                      senderName={isUser ? (user?.name || 'You') : facilitatorSettings.name}
                      senderColor={isUser ? undefined : '#6366f1'}
                      isOwn={isUser}
                      isConsecutive={isConsecutive}
                      renderMarkdown={!isUser}
                      isStreaming={message.isStreaming}
                      toolCalls={message.toolCalls}
                      avatar={!isUser ? (
                        <Avatar
                          type="bot"
                          src={botAvatarSrc}
                          alt={facilitatorSettings.name}
                          size="md"
                        />
                      ) : undefined}
                    />
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Thinking indicator */}
          <ThinkingIndicator isActive={isLoading} />

          {/* Queued messages */}
          {queuedMessages.length > 0 && (
            <div className={styles.queueContainer}>
              <div className={styles.queueHeader}>
                <span className={styles.queueLabel}>Queued ({queuedMessages.length})</span>
              </div>
              <div className={styles.queueList}>
                {queuedMessages.map((msg) => (
                  <div key={msg.id} className={styles.queuedMessage}>
                    <span className={styles.queuedContent}>{msg.content}</span>
                    <IconButton
                      icon={<CloseIcon />}
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQueuedMessage(msg.id)}
                      aria-label="Remove from queue"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chat input - never disabled for loading, only for connection issues */}
          <div className={styles.inputContainer}>
            <ChatInput
              ref={chatInputRef}
              placeholder={isLoading ? "Type to queue message..." : "Ask the facilitator... (type / for commands)"}
              onSubmit={handleSendMessage}
              onChange={handleInputChange}
              disabled={connectionState === 'connecting'}
              historyKey="facilitator"
              fullWidth
              commands={slashCommands}
              onCommand={handleCommand}
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
