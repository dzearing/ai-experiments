import { useState, useRef, useEffect, useMemo } from 'react';
import { Heading, IconButton } from '@ui-kit/react';
import { ChatInput, type ChatInputSubmitData } from '@ui-kit/react-chat';
import { MarkdownRenderer } from '@ui-kit/react-markdown';
import { GearIcon } from '@ui-kit/icons/GearIcon';
import { CloseIcon } from '@ui-kit/icons/CloseIcon';
import { CopyIcon } from '@ui-kit/icons/CopyIcon';
import { EditIcon } from '@ui-kit/icons/EditIcon';
import {
  type GroupChatMessage,
  type GroupChatLayoutProps,
  type Participant,
  sampleParticipants,
  sampleGroupMessages,
} from '../shared';
import styles from '../shared/styles.module.css';

/**
 * Group Subtle Emphasis Layout
 *
 * Design principles:
 * - Similar to Subtle Emphasis but for multiple participants
 * - Small colored avatar indicator for each participant
 * - Sender name shown above message (hidden for consecutive messages)
 * - User messages have primary background, others have no background
 * - Time appears on hover
 * - Consecutive messages from same sender are compacted
 */

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

interface GroupMessageProps {
  message: GroupChatMessage;
  participant: Participant;
  previousMessage?: GroupChatMessage;
}

function GroupMessage({ message, participant, previousMessage }: GroupMessageProps) {
  const isUser = participant.isCurrentUser;
  const isConsecutive = previousMessage?.senderId === message.senderId;

  return (
    <div
      className={`${styles.groupMessage} ${isUser ? styles.groupMessageUser : styles.groupMessageOther}`}
      data-consecutive={isConsecutive ? 'true' : 'false'}
    >
      <div
        className={styles.groupSenderIndicator}
        style={{ background: participant.color }}
      >
        {participant.initials}
      </div>

      <div className={styles.groupMessageBody}>
        <div className={`${styles.groupSenderName} ${isUser ? styles.groupSenderNameUser : styles.groupSenderNameOther}`}>
          {participant.name}
        </div>
        <div className={styles.groupContent}>
          {isUser ? (
            <span className={styles.userMarkdown}>{message.content}</span>
          ) : (
            <MarkdownRenderer content={message.content} />
          )}
        </div>
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

export function GroupSubtleLayout({
  messages: initialMessages = sampleGroupMessages,
  participants: initialParticipants = sampleParticipants,
  isLoading: initialLoading = false,
}: GroupChatLayoutProps) {
  const [messages, setMessages] = useState<GroupChatMessage[]>(initialMessages);
  const [participants] = useState<Participant[]>(initialParticipants);
  const [isLoading, setIsLoading] = useState(initialLoading);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  const participantMap = useMemo(() => {
    const map = new Map<string, Participant>();
    participants.forEach(p => map.set(p.id, p));

    return map;
  }, [participants]);

  const currentUser = useMemo(() => {
    return participants.find(p => p.isCurrentUser);
  }, [participants]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;

      return;
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (data: ChatInputSubmitData) => {
    if (!data.content.trim() || !currentUser) return;

    const userMessage: GroupChatMessage = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      content: data.content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Simulate another participant responding
    setTimeout(() => {
      const responder = participants.find(p => !p.isCurrentUser);
      if (responder) {
        const responseMessage: GroupChatMessage = {
          id: (Date.now() + 1).toString(),
          senderId: responder.id,
          content: 'Got it, thanks for the update!',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, responseMessage]);
      }
      setIsLoading(false);
    }, 1500);
  };

  // Get non-current-user participants for the header
  const otherParticipants = participants.filter(p => !p.isCurrentUser);

  return (
    <div className={styles.container}>
      <header className={styles.groupHeader}>
        <div className={styles.groupHeaderLeft}>
          <div className={styles.groupAvatars}>
            {otherParticipants.slice(0, 3).map((p) => (
              <div
                key={p.id}
                className={styles.groupAvatar}
                style={{ background: p.color }}
                title={p.name}
              >
                {p.initials}
              </div>
            ))}
          </div>
          <div>
            <Heading level={4} style={{ margin: 0 }}>
              {otherParticipants.length === 1
                ? otherParticipants[0].name
                : `${otherParticipants[0]?.name} + ${otherParticipants.length - 1} others`}
            </Heading>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <IconButton variant="ghost" size="sm" icon={<GearIcon />} aria-label="Settings" />
          <IconButton variant="ghost" size="sm" icon={<CloseIcon />} aria-label="Close" />
        </div>
      </header>

      <div className={styles.messagesArea}>
        <div className={styles.messagesContainer}>
          {messages.map((message, index) => {
            const participant = participantMap.get(message.senderId);
            if (!participant) return null;

            return (
              <GroupMessage
                key={message.id}
                message={message}
                participant={participant}
                previousMessage={index > 0 ? messages[index - 1] : undefined}
              />
            );
          })}

          {isLoading && (
            <div className={styles.groupMessage}>
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
