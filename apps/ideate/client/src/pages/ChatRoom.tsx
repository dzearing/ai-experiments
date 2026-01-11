import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from '@ui-kit/router';
import { Avatar, AvatarGroup, Button, IconButton, Spinner, Modal } from '@ui-kit/react';
import { ChatInput, VirtualizedChatPanel, type ChatInputSubmitData, type VirtualizedChatPanelMessage } from '@ui-kit/react-chat';
import { ArrowLeftIcon } from '@ui-kit/icons/ArrowLeftIcon';
import { EditIcon } from '@ui-kit/icons/EditIcon';
import { TrashIcon } from '@ui-kit/icons/TrashIcon';
import { useAuth } from '../contexts/AuthContext';
import { useSession } from '../contexts/SessionContext';
import { useChat, type ChatRoomMetadata, type ChatMessage as ChatMessageData } from '../contexts/ChatContext';
import { useChatSocket } from '../hooks/useChatSocket';
import { useWorkspaceSocket, type ResourcePresence } from '../hooks/useWorkspaceSocket';
import styles from './ChatRoom.module.css';

export function ChatRoom() {
  const { chatRoomId } = useParams<{ chatRoomId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { session } = useSession();
  const { getChatRoom } = useChat();

  const [chatRoom, setChatRoom] = useState<ChatRoomMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const [editingMessage, setEditingMessage] = useState<ChatMessageData | null>(null);
  const [escapeCount, setEscapeCount] = useState(0);
  const escapeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);


  // Track active users in this chat room
  const [activeUsers, setActiveUsers] = useState<ResourcePresence[]>([]);

  // Handle presence updates from workspace socket
  const handlePresenceUpdate = useCallback((presence: Map<string, ResourcePresence[]>) => {
    if (chatRoomId) {
      const chatRoomPresence = presence.get(chatRoomId) || [];
      setActiveUsers(chatRoomPresence);
    }
  }, [chatRoomId]);

  // Workspace presence tracking - notify other users that we're viewing this chat room
  const { isConnected: isWorkspaceConnected, joinResource, leaveResource } = useWorkspaceSocket({
    workspaceId: chatRoom?.workspaceId,
    sessionColor: session?.color,
    onPresenceUpdate: handlePresenceUpdate,
  });

  // Join chat room presence when WebSocket is connected
  // Server handles deduplication and grace period cancellation for reconnects
  useEffect(() => {
    if (isWorkspaceConnected && chatRoom?.workspaceId && chatRoomId) {
      joinResource(chatRoomId, 'chatroom');
    }
  }, [isWorkspaceConnected, chatRoom?.workspaceId, chatRoomId, joinResource]);

  // Leave resource on unmount
  useEffect(() => {
    return () => {
      leaveResource();
    };
  }, [leaveResource]);

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
    updateMessage,
    deleteMessage,
    sendStopTyping,
  } = useChatSocket({
    roomId: chatRoomId || '',
    userId: user?.id || '',
    userName: user?.name || 'Anonymous',
    userColor: session?.color || '#888888',
    onTyping: handleTyping,
    onStopTyping: handleStopTyping,
  });

  // Handle chat input submit
  const handleChatSubmit = useCallback((data: ChatInputSubmitData) => {
    if (!data.content.trim()) return;

    sendMessage(data.content);
    sendStopTyping();
  }, [sendMessage, sendStopTyping]);

  // Handle menu actions
  const handleMessageMenuSelect = useCallback((value: string, messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    if (value === 'edit') {
      setEditingMessage(message);
      setEscapeCount(0);
    } else if (value === 'delete') {
      deleteMessage(messageId);
    }
  }, [deleteMessage, messages]);

  // Handle edit overlay submit
  const handleEditSubmit = useCallback((data: ChatInputSubmitData) => {
    if (!editingMessage || !data.content.trim()) return;

    updateMessage(editingMessage.id, data.content);
    setEditingMessage(null);
    setEscapeCount(0);
  }, [editingMessage, updateMessage]);

  // Handle edit overlay escape (press twice to close)
  const handleEditKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();

      // Clear any existing timeout
      if (escapeTimeoutRef.current) {
        clearTimeout(escapeTimeoutRef.current);
      }

      if (escapeCount === 0) {
        setEscapeCount(1);
        // Reset after 1.5 seconds
        escapeTimeoutRef.current = setTimeout(() => {
          setEscapeCount(0);
        }, 1500);
      } else {
        // Second escape press - close the overlay
        setEditingMessage(null);
        setEscapeCount(0);
      }
    }
  }, [escapeCount]);

  // Cleanup escape timeout on unmount
  useEffect(() => {
    return () => {
      if (escapeTimeoutRef.current) {
        clearTimeout(escapeTimeoutRef.current);
      }
    };
  }, []);

  // Menu items for message actions (only shown for own messages)
  const messageMenuItems = useMemo(() => [
    { value: 'edit', label: 'Edit', icon: <EditIcon /> },
    { value: 'delete', label: 'Delete', icon: <TrashIcon />, danger: true },
  ], []);

  // Convert messages to VirtualizedChatPanel format
  const chatMessages: VirtualizedChatPanelMessage[] = useMemo(() => {
    return messages.map((message) => {
      const isOwnMessage = message.senderId === user?.id;

      return {
        id: message.id,
        content: message.content,
        timestamp: message.createdAt,
        senderName: message.senderName,
        senderColor: message.senderColor,
        isOwn: isOwnMessage,
        renderMarkdown: true,
      };
    });
  }, [messages, user?.id]);

  // Empty state for chat
  const emptyState = useMemo(() => (
    <div className={styles.emptyState}>
      <p>No messages yet. Start the conversation!</p>
    </div>
  ), []);

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
        <div className={styles.headerLeft}>
          <IconButton
            icon={<ArrowLeftIcon />}
            variant="ghost"
            onClick={() => navigate(`/workspace/${chatRoom.workspaceId}`)}
            aria-label="Back to workspace"
          />
          <span className={styles.connectionDot} data-status={connectionStatus} />
          <h1 className={styles.roomName}>{chatRoom.name}</h1>
        </div>
        {activeUsers.length > 0 && (
          <div className={styles.headerRight}>
            <AvatarGroup max={5} size="sm">
              {activeUsers.map((presence) => (
                <Avatar
                  key={presence.userId}
                  fallback={presence.userName}
                  color={presence.userColor}
                />
              ))}
            </AvatarGroup>
          </div>
        )}
      </header>

      {/* Messages */}
      <VirtualizedChatPanel
        messages={chatMessages}
        emptyState={emptyState}
        messageMenuItems={messageMenuItems}
        onMessageMenuSelect={handleMessageMenuSelect}
        typingUsers={Array.from(typingUsers.values())}
        className={styles.messagesContainer}
      />

      {/* Input */}
      <div className={styles.inputContainer}>
        <ChatInput
          placeholder="Type a message..."
          onSubmit={handleChatSubmit}
          disabled={!isConnected}
          historyKey={`chatroom-${chatRoomId}`}
          fullWidth
        />
      </div>

      {/* Edit Message Modal */}
      <Modal
        open={editingMessage !== null}
        onClose={() => setEditingMessage(null)}
        closeOnEscape={false}
        size="lg"
      >
        {editingMessage && (
          <div
            className={styles.editOverlay}
            onKeyDown={handleEditKeyDown}
          >
            <div className={styles.editOverlayHeader}>
              <h3>Edit message</h3>
              <span className={styles.editOverlayHint}>
                {escapeCount > 0 ? 'Press Escape again to cancel' : 'Press Escape twice to cancel'}
              </span>
            </div>
            <ChatInput
              placeholder="Edit your message..."
              onSubmit={handleEditSubmit}
              initialContent={editingMessage.content}
              historyKey={`edit-${editingMessage.id}`}
              fullWidth
              autoFocus
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
