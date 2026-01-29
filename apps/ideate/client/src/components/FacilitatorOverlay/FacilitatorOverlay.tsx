import { useEffect, useCallback, useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from '@ui-kit/router';
import { Slide, Button, IconButton, Avatar } from '@ui-kit/react';
import { CloseIcon } from '@ui-kit/icons/CloseIcon';
import { GearIcon } from '@ui-kit/icons/GearIcon';
import { ChatLayout, OpenQuestionsResolver, type ChatInputSubmitData, type ChatInputRef, type TopicReference as ChatTopicReference, type ChatPanelMessage, type QueuedMessage } from '@ui-kit/react-chat';
import { AVATAR_IMAGES } from '../../constants/avatarImages';
import { useFacilitator } from '../../contexts/FacilitatorContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTopics } from '../../contexts/TopicsContext';
import { useFacilitatorSocket } from '../../hooks/useFacilitatorSocket';
import { useChatCommands } from '../../hooks/useChatCommands';
import { useClaudeCodeCommands } from '../../hooks/useClaudeCodeCommands';
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
  const { modelId, setModelId: _setModelId, modelInfo: _modelInfo } = useModelPreference();
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
  const [queuedMessages, setQueuedMessages] = useState<QueuedMessage[]>([]);
  const [inputContent, setInputContent] = useState('');
  const [facilitatorSettings, setFacilitatorSettings] = useState<FacilitatorSettings>({
    name: 'Facilitator',
    avatar: 'robot',
  });
  const panelRef = useRef<HTMLDivElement>(null);
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

  // Discover Claude Code plugin commands from the server
  const {
    commands: claudeCodeCommands,
    handleCommand: handleClaudeCodeCommand,
  } = useClaudeCodeCommands({
    enabled: true,
    onExecute: (command, content, args) => {
      // When a Claude Code command is executed, send it to the facilitator
      // The command content is the markdown/prompt from the plugin
      const messageText = args
        ? `Using /${command.pluginName ? `${command.pluginName}:` : ''}${command.name} ${args}\n\n${content}`
        : content;

      contextSendMessage(messageText);

      if (isConnected) {
        socketSendMessage(messageText);
      }
    },
  });

  // Chat commands - FacilitatorOverlay uses local handlers since it doesn't have server command support
  const { commands: builtInCommands, handleCommand: handleBuiltInCommand } = useChatCommands({
    availableCommands: [],
    executeCommand: () => {},
    clientOnlyCommands: [
      {
        name: 'clear',
        description: 'Clear chat history',
        usage: '/clear',
        handler: () => {
          clearMessages();
          socketClearHistory();

          return { handled: true, clearInput: true };
        },
      },
      {
        name: 'context',
        description: 'Show context window usage and session info',
        usage: '/context',
        handler: () => {
          // Build context display data for the facilitator
          const maxTokens = 200000;
          const systemPromptTokens = 2500;
          const messageTokens = messages.reduce((acc, m) => {
            const textParts = m.parts?.filter(p => p.type === 'text') || [];
            const textLength = textParts.reduce((sum, p) => sum + ((p as { text: string }).text?.length || 0), 0);

            return acc + Math.ceil(textLength / 4); // Rough token estimate
          }, 0);
          const usedTokens = systemPromptTokens + messageTokens;
          const bufferTokens = Math.round(maxTokens * 0.20);
          const freeTokens = maxTokens - usedTokens - bufferTokens;
          const usedPercent = (usedTokens / maxTokens) * 100;
          const bufferPercent = (bufferTokens / maxTokens) * 100;

          const contextData = {
            model: modelId || 'claude-sonnet-4',
            maxTokens,
            usedTokens,
            usedPercent,
            freeTokens,
            bufferTokens,
            bufferPercent,
            categories: [
              { name: 'System prompt', tokens: systemPromptTokens, percent: (systemPromptTokens / maxTokens) * 100, type: 'used' as const },
              { name: 'Messages (conversation)', tokens: messageTokens, percent: (messageTokens / maxTokens) * 100, type: 'used' as const },
              { name: 'Free space', tokens: freeTokens, percent: (freeTokens / maxTokens) * 100, type: 'free' as const },
              { name: 'Autocompact buffer', tokens: bufferTokens, percent: bufferPercent, type: 'buffer' as const },
            ],
            session: {
              sessionId: user?.id || 'unknown',
              model: modelId || 'claude-sonnet-4',
              messageCount: messages.length,
              inputTokens: 0,
              outputTokens: 0,
            },
          };

          addMessage({
            id: `context-${Date.now()}`,
            role: 'assistant',
            parts: [{
              type: 'component',
              componentType: 'context',
              data: contextData,
            }],
            timestamp: Date.now(),
          });

          return { handled: true, clearInput: true };
        },
      },
      {
        name: 'help',
        description: 'Show available commands',
        usage: '/help',
        handler: () => {
          // Build help text including Claude Code commands
          const claudeCodeSection = claudeCodeCommands.length > 0
            ? `\n\n## Claude Code Plugin Commands\n\n${claudeCodeCommands.map(c => `- **/${c.name}** - ${c.description}`).join('\n')}`
            : '';

          addMessage({
            id: `help-${Date.now()}`,
            role: 'assistant',
            parts: [{ type: 'text', text: `## Available Commands

- **/clear** - Clear chat history
- **/context** - Show context window usage
- **/help** - Show this help${claudeCodeSection}

## Features

- Ask questions about your workspaces and documents
- Press **Ctrl+.** (or **Cmd+.** on Mac) to toggle this overlay
- Press **Escape** to close` }],
            timestamp: Date.now(),
          });

          return { handled: true, clearInput: true };
        },
      },
    ],
  });

  // Merge built-in and Claude Code commands
  const commands = useMemo(() => {
    return [...builtInCommands, ...claudeCodeCommands];
  }, [builtInCommands, claudeCodeCommands]);

  // Combined command handler - tries built-in first, then Claude Code
  // Note: onCommand expects synchronous return, so we fire-and-forget async handlers
  const handleCommand = useCallback((commandName: string, args: string) => {
    // Try built-in commands first
    const builtInResult = handleBuiltInCommand(commandName, args);

    if (builtInResult.handled) {
      return builtInResult;
    }

    // Check if this is a Claude Code command
    const isClaudeCodeCmd = claudeCodeCommands.some(cmd => cmd.name === commandName);

    if (isClaudeCodeCmd) {
      // Fire-and-forget async execution
      handleClaudeCodeCommand(commandName, args).catch(err => {
        console.error('[FacilitatorOverlay] Claude Code command error:', err);
      });

      return { handled: true, clearInput: true };
    }

    return { handled: false };
  }, [handleBuiltInCommand, handleClaudeCodeCommand, claudeCodeCommands]);

  // Process queued messages when AI finishes thinking
  useEffect(() => {
    if (!isLoading && queuedMessages.length > 0 && !isProcessingQueueRef.current) {
      isProcessingQueueRef.current = true;

      // Combine all queued messages into one
      const contentToSend = queuedMessages.map(m => m.content).join('\n');
      setQueuedMessages([]);

      // Add to context and send
      contextSendMessage(contentToSend);
      if (isConnected) {
        socketSendMessage(contentToSend);
      }

      isProcessingQueueRef.current = false;
    }
  }, [isLoading, queuedMessages, contextSendMessage, socketSendMessage, isConnected]);

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

  // Handle Ctrl/Cmd+C to cancel operation when loading
  const handleCancelKeyboard = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'c' && (event.metaKey || event.ctrlKey)) {
        // Only intercept if loading - otherwise let normal copy work
        if (isLoading) {
          event.preventDefault();
          handleCancelOperation();
        }
      }
    },
    [isLoading, handleCancelOperation]
  );

  // Handle escape key - clear input first, then close if empty
  const handleEscapeKey = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // If there's input content, let the input handle Escape (clear input)
        if (inputContent.trim()) {
          return;
        }

        // If input is empty, close the overlay
        event.preventDefault();
        close();
      }
    },
    [inputContent, close]
  );

  // Add/remove keyboard listeners when open
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleCancelKeyboard);
      document.addEventListener('keydown', handleEscapeKey);

      return () => {
        document.removeEventListener('keydown', handleCancelKeyboard);
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [isOpen, handleCancelKeyboard, handleEscapeKey]);

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

  // Handle sending a message
  const handleSendMessage = useCallback(
    (data: ChatInputSubmitData) => {
      const { content, topicReferences } = data;
      if (!content.trim()) return;

      // Extract Topic IDs from references
      const topicIds = topicReferences?.map(ref => ref.id) || [];

      // If AI is busy, add to queued messages
      if (isLoading) {
        setQueuedMessages(prev => [...prev, {
          id: `queued-${Date.now()}`,
          content: content.trim(),
          timestamp: Date.now(),
        }]);
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

  // Remove a queued message
  const removeQueuedMessage = useCallback((id: string) => {
    setQueuedMessages(prev => prev.filter(m => m.id !== id));
  }, []);

  // Handle navigating to settings
  const handleOpenSettings = useCallback(() => {
    close();
    navigate('/settings/facilitator');
  }, [close, navigate]);

  // Convert messages to ChatPanel format
  const chatMessages: ChatPanelMessage[] = useMemo(() => {
    return messages.map((message) => {
      const isUser = message.role === 'user';
      const isSystem = message.role === 'system';

      // Extract text content from parts for the content field
      const textContent = message.parts
        ?.filter((part): part is { type: 'text'; text: string } => part.type === 'text')
        .map((part) => part.text)
        .join('\n') || '';

      return {
        id: message.id,
        content: textContent,
        parts: message.parts,
        timestamp: message.timestamp,
        senderName: isUser ? (user?.name || 'You') : (isSystem ? 'System' : facilitatorSettings.name),
        senderColor: isUser ? undefined : (isSystem ? '#888888' : '#6366f1'),
        isOwn: isUser,
        isStreaming: message.isStreaming,
        renderMarkdown: true,
      };
    });
  }, [messages, user?.name, facilitatorSettings.name]);

  // Render avatar for bot messages
  const renderAvatar = useCallback((message: ChatPanelMessage) => {
    if (message.isOwn || message.senderName === 'System') return undefined;

    const botAvatarSrc = AVATAR_IMAGES[facilitatorSettings.avatar] || AVATAR_IMAGES.robot;

    return (
      <Avatar
        type="bot"
        src={botAvatarSrc}
        alt={facilitatorSettings.name}
        size="md"
      />
    );
  }, [facilitatorSettings.avatar, facilitatorSettings.name]);

  // Empty state for chat
  const emptyState = useMemo(() => (
    <div className={styles.emptyState}>
      <h3 className={styles.emptyStateTitle}>
        How can I help you today?
      </h3>
      <p className={styles.emptyStateSubtitle}>
        Ask me anything about your workspaces, documents, or tasks.
      </p>
    </div>
  ), []);

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
          <ChatLayout
            messages={chatMessages}
            emptyState={emptyState}
            renderAvatar={renderAvatar}
            header={
              <>
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
              </>
            }
            isThinking={isLoading}
            thinkingIndicatorProps={{
              showEscapeHint: isLoading && !inputContent.trim(),
            }}
            queuedMessages={queuedMessages}
            onRemoveQueuedMessage={removeQueuedMessage}
            chatInputRef={chatInputRef}
            chatInputProps={{
              placeholder: isLoading ? "Type to queue message..." : "Ask the facilitator... (type / for commands, ^ for topics)",
              onSubmit: handleSendMessage,
              onChange: handleInputChange,
              disabled: connectionState === 'connecting',
              historyKey: "facilitator",
              fullWidth: true,
              commands,
              onCommand: handleCommand,
              topics: topicReferences as ChatTopicReference[],
            }}
          />

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
        </div>
      </Slide>
    </div>
  );

  return createPortal(overlay, document.body);
}

FacilitatorOverlay.displayName = 'FacilitatorOverlay';

export default FacilitatorOverlay;
