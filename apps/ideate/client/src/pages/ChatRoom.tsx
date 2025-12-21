import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from '@ui-kit/router';
import { Avatar, Button, IconButton, Input, Spinner } from '@ui-kit/react';
import { ArrowLeftIcon } from '@ui-kit/icons/ArrowLeftIcon';
import { SendIcon } from '@ui-kit/icons/SendIcon';
import { useAuth } from '../contexts/AuthContext';
import { useSession } from '../contexts/SessionContext';
import { useChat, type ChatRoomMetadata, type ChatMessage } from '../contexts/ChatContext';
import { useChatSocket } from '../hooks/useChatSocket';
import styles from './ChatRoom.module.css';

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
  }
}

interface MessageGroup {
  date: string;
  messages: ChatMessage[];
}

function groupMessagesByDate(messages: ChatMessage[]): MessageGroup[] {
  const groups: MessageGroup[] = [];
  let currentGroup: MessageGroup | null = null;

  for (const message of messages) {
    const dateKey = new Date(message.createdAt).toDateString();

    if (!currentGroup || currentGroup.date !== dateKey) {
      currentGroup = { date: dateKey, messages: [] };
      groups.push(currentGroup);
    }

    currentGroup.messages.push(message);
  }

  return groups;
}

export function ChatRoom() {
  const { chatRoomId } = useParams<{ chatRoomId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { session } = useSession();
  const { getChatRoom } = useChat();

  const [chatRoom, setChatRoom] = useState<ChatRoomMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthLoading, isAuthenticated, navigate]);

  // Load chat room metadata
  useEffect(() => {
    async function loadChatRoom() {
      if (!chatRoomId || !user) return;

      setIsLoading(true);
      try {
        const room = await getChatRoom(chatRoomId);
        setChatRoom(room);
      } finally {
        setIsLoading(false);
      }
    }

    loadChatRoom();
  }, [chatRoomId, user, getChatRoom]);

  // Handle typing indicator
  const handleTyping = useCallback((userId: string, userName: string) => {
    if (userId === user?.id) return; // Don't show own typing
    setTypingUsers((prev) => new Map(prev).set(userId, userName));
  }, [user?.id]);

  const handleStopTyping = useCallback((userId: string) => {
    setTypingUsers((prev) => {
      const newMap = new Map(prev);
      newMap.delete(userId);
      return newMap;
    });
  }, []);

  // WebSocket connection
  const {
    messages,
    isConnected,
    isConnecting,
    sendMessage,
    sendTyping,
    sendStopTyping,
  } = useChatSocket({
    roomId: chatRoomId || '',
    userId: user?.id || '',
    userName: user?.name || 'Anonymous',
    userColor: session?.color || '#888888',
    onTyping: handleTyping,
    onStopTyping: handleStopTyping,
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle input change with typing indicator
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);

    // Send typing indicator
    sendTyping();

    // Clear previous timeout and set new one for stop typing
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      sendStopTyping();
    }, 2000);
  }, [sendTyping, sendStopTyping]);

  // Handle send message
  const handleSendMessage = useCallback(() => {
    const content = messageInput.trim();
    if (!content) return;

    sendMessage(content);
    setMessageInput('');
    sendStopTyping();

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Focus input
    inputRef.current?.focus();
  }, [messageInput, sendMessage, sendStopTyping]);

  // Handle enter key
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Group messages by date
  const messageGroups = useMemo(() => groupMessagesByDate(messages), [messages]);

  // Typing indicator text
  const typingText = useMemo(() => {
    const names = Array.from(typingUsers.values());
    if (names.length === 0) return null;
    if (names.length === 1) return `${names[0]} is typing...`;
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing...`;
    return `${names.slice(0, 2).join(', ')} and ${names.length - 2} others are typing...`;
  }, [typingUsers]);

  // Connection status
  const connectionStatus = useMemo(() => {
    if (isConnecting) return 'connecting';
    if (isConnected) return 'connected';
    return 'disconnected';
  }, [isConnected, isConnecting]);

  // Show loading while auth is being checked
  if (isAuthLoading || !user) {
    return (
      <div className={styles.loading}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <Spinner size="lg" />
        <p>Loading chat room...</p>
      </div>
    );
  }

  if (!chatRoom) {
    return (
      <div className={styles.notFound}>
        <h2>Chat room not found</h2>
        <p>The chat room you're looking for doesn't exist or you don't have access.</p>
        <Button onClick={() => navigate('/workspaces')}>Back to Workspaces</Button>
      </div>
    );
  }

  return (
    <div className={styles.chatRoom}>
      {/* Header */}
      <header className={styles.header}>
        <IconButton
          icon={<ArrowLeftIcon />}
          variant="ghost"
          onClick={() => navigate(`/workspace/${chatRoom.workspaceId}`)}
          aria-label="Back to workspace"
        />
        <span className={styles.connectionDot} data-status={connectionStatus} />
        <h1 className={styles.roomName}>{chatRoom.name}</h1>
      </header>

      {/* Messages */}
      <div className={styles.messagesContainer}>
        {messageGroups.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messageGroups.map((group) => (
            <div key={group.date} className={styles.dateGroup}>
              <div className={styles.dateDivider}>
                <span className={styles.dateLabel}>{formatDate(group.messages[0].createdAt)}</span>
              </div>
              {group.messages.map((message, index) => {
                // Check if previous message is from same sender (to hide avatar)
                const prevMessage = index > 0 ? group.messages[index - 1] : null;
                const showAvatar = !prevMessage || prevMessage.senderId !== message.senderId;
                const showName = showAvatar && message.senderId !== user.id;
                const isOwnMessage = message.senderId === user.id;

                return (
                  <div key={message.id} className={`${styles.message} ${isOwnMessage ? styles.ownMessage : ''}`}>
                    <div className={`${styles.avatar} ${!showAvatar ? styles.hidden : ''}`}>
                      <Avatar
                        size="sm"
                        fallback={message.senderName}
                        color={message.senderColor}
                      />
                    </div>
                    <div className={styles.messageContent}>
                      {showName && (
                        <span className={styles.senderName}>{message.senderName}</span>
                      )}
                      <p className={styles.messageText}>{message.content}</p>
                      <span className={styles.messageTime}>{formatTime(message.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator */}
      {typingText && (
        <div className={styles.typingIndicator}>
          <span className={styles.typingDots}>
            <span />
            <span />
            <span />
          </span>
          <span className={styles.typingText}>{typingText}</span>
        </div>
      )}

      {/* Input */}
      <div className={styles.inputContainer}>
        <Input
          ref={inputRef}
          className={styles.messageInput}
          placeholder="Type a message..."
          value={messageInput}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={!isConnected}
        />
        <Button
          variant="primary"
          icon={<SendIcon />}
          onClick={handleSendMessage}
          disabled={!messageInput.trim() || !isConnected}
          aria-label="Send message"
        />
      </div>
    </div>
  );
}
