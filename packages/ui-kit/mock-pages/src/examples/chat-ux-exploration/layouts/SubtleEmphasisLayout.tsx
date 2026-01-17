import { useState, useRef, useEffect } from 'react';
import { Heading, IconButton } from '@ui-kit/react';
import { ChatInput, type ChatInputSubmitData } from '@ui-kit/react-chat';
import { MarkdownRenderer } from '@ui-kit/react-markdown';
import { GearIcon } from '@ui-kit/icons/GearIcon';
import { CloseIcon } from '@ui-kit/icons/CloseIcon';
import { CopyIcon } from '@ui-kit/icons/CopyIcon';
import { EditIcon } from '@ui-kit/icons/EditIcon';
import { type ChatMessage, type ChatLayoutProps, sampleMessages } from '../shared';
import styles from '../shared/styles.module.css';

/**
 * Subtle Emphasis Layout
 *
 * Design principles:
 * - User messages have a subtle primary background tint
 * - Assistant messages have no background (blends with page)
 * - Time appears on hover in top-right corner
 * - Both messages full-width, left-aligned text
 * - Clean reading flow, user input stands out subtly
 * - No avatars, no labels - context is clear from styling
 */

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

interface SubtleMessageProps {
  message: ChatMessage;
}

function SubtleMessage({ message }: SubtleMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`${styles.subtleMessage} ${isUser ? styles.subtleMessageUser : styles.subtleMessageAssistant}`}>
      <div className={styles.subtleContent}>
        {isUser ? (
          <span className={styles.userMarkdown}>{message.content}</span>
        ) : (
          <MarkdownRenderer content={message.content} />
        )}
      </div>
      <div className={`${styles.messageToolbar} ${isUser ? styles.messageToolbarUser : styles.messageToolbarAssistant}`}>
        <span className={`${styles.toolbarTime} ${isUser ? styles.toolbarTimeUser : styles.toolbarTimeAssistant}`}>
          {formatTime(message.timestamp)}
        </span>
        <button
          className={`${styles.toolbarButton} ${isUser ? styles.toolbarButtonUser : styles.toolbarButtonAssistant}`}
          aria-label="Copy message"
        >
          <CopyIcon className={styles.toolbarIcon} />
        </button>
        {isUser && (
          <button
            className={`${styles.toolbarButton} ${styles.toolbarButtonUser}`}
            aria-label="Edit message"
          >
            <EditIcon className={styles.toolbarIcon} />
          </button>
        )}
      </div>
    </div>
  );
}

export function SubtleEmphasisLayout({
  messages: initialMessages = sampleMessages,
  isLoading: initialLoading = false,
}: ChatLayoutProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(initialLoading);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;

      return;
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (data: ChatInputSubmitData) => {
    if (!data.content.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: data.content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I understand. Let me help you with that.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <Heading level={4} style={{ margin: 0 }}>Assistant</Heading>
          <div className={styles.onlineIndicator} />
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <IconButton variant="ghost" size="sm" icon={<GearIcon />} aria-label="Settings" />
          <IconButton variant="ghost" size="sm" icon={<CloseIcon />} aria-label="Close" />
        </div>
      </header>

      <div className={styles.messagesArea}>
        <div className={styles.messagesContainer}>
          {messages.map((message) => (
            <SubtleMessage key={message.id} message={message} />
          ))}

          {isLoading && (
            <div className={styles.subtleMessage}>
              <div className={styles.loadingIndicator}>
                <div className={styles.loadingDot} />
                <div className={styles.loadingDot} />
                <div className={styles.loadingDot} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className={styles.inputArea}>
        <div className={styles.inputContainer}>
          <ChatInput
            placeholder="Type a message..."
            onSubmit={handleSubmit}
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
