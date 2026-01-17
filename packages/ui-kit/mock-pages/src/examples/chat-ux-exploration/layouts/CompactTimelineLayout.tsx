import { useState, useRef, useEffect } from 'react';
import { Heading, Text, IconButton } from '@ui-kit/react';
import { ChatInput, type ChatInputSubmitData } from '@ui-kit/react-chat';
import { MarkdownRenderer } from '@ui-kit/react-markdown';
import { GearIcon } from '@ui-kit/icons/GearIcon';
import { CloseIcon } from '@ui-kit/icons/CloseIcon';
import { type ChatMessage, type ChatLayoutProps, sampleMessages } from '../shared';
import styles from '../shared/styles.module.css';

/**
 * Compact Timeline Layout
 *
 * Design principles:
 * - Time appears inline after sender name, very subtle
 * - Speaker changes marked with subtle divider line
 * - No avatars - relies on name differentiation
 * - User messages distinguished by colored name
 * - Clean, dense layout for efficient scanning
 */

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

interface CompactMessageProps {
  message: ChatMessage;
  previousMessage?: ChatMessage;
}

function CompactMessage({ message, previousMessage }: CompactMessageProps) {
  const isSameSpeaker = previousMessage?.role === message.role;
  const senderName = message.role === 'user' ? 'You' : 'Assistant';

  return (
    <div
      className={styles.compactMessage}
      data-same-speaker={isSameSpeaker ? 'true' : 'false'}
    >
      <div className={styles.compactHeader}>
        <span className={`${styles.compactSender} ${message.role === 'user' ? styles.compactSenderUser : ''}`}>
          {senderName}
        </span>
        <span className={styles.compactTime}>{formatTime(message.timestamp)}</span>
      </div>
      <div className={styles.compactContent}>
        <MarkdownRenderer content={message.content} />
      </div>
    </div>
  );
}

export function CompactTimelineLayout({
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
          {messages.map((message, index) => (
            <CompactMessage
              key={message.id}
              message={message}
              previousMessage={index > 0 ? messages[index - 1] : undefined}
            />
          ))}

          {isLoading && (
            <div className={styles.loadingIndicator}>
              <div className={styles.loadingDot} />
              <div className={styles.loadingDot} />
              <div className={styles.loadingDot} />
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
