import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import { API_URL } from '../config';

export interface ChatMessage {
  id: string;
  chatRoomId: string;
  senderId: string;
  senderName: string;
  senderColor: string;
  content: string;
  createdAt: string;
}

export interface ChatRoomMetadata {
  id: string;
  name: string;
  workspaceId: string;
  ownerId: string;
  participantIds: string[];
  createdAt: string;
  updatedAt: string;
}

interface ChatContextValue {
  chatRooms: ChatRoomMetadata[];
  isLoading: boolean;
  error: string | null;
  fetchChatRooms: (workspaceId: string) => Promise<void>;
  createChatRoom: (name: string, workspaceId: string) => Promise<ChatRoomMetadata>;
  getChatRoom: (id: string) => Promise<ChatRoomMetadata | null>;
  updateChatRoom: (id: string, updates: Partial<ChatRoomMetadata>) => Promise<ChatRoomMetadata | null>;
  deleteChatRoom: (id: string) => Promise<boolean>;
}

const ChatContext = createContext<ChatContextValue | null>(null);

interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const { user } = useAuth();
  const [chatRooms, setChatRooms] = useState<ChatRoomMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChatRooms = useCallback(async (workspaceId: string) => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const url = `${API_URL}/api/chatrooms?workspaceId=${workspaceId}`;

      const response = await fetch(url, {
        headers: {
          'x-user-id': user.id,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chat rooms');
      }

      const data = await response.json();
      setChatRooms(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch chat rooms');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const createChatRoom = useCallback(
    async (name: string, workspaceId: string): Promise<ChatRoomMetadata> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${API_URL}/api/chatrooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({ name, workspaceId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create chat room');
      }

      const chatRoom = await response.json();
      setChatRooms((prev) => [chatRoom, ...prev]);
      return chatRoom;
    },
    [user]
  );

  const getChatRoom = useCallback(
    async (id: string): Promise<ChatRoomMetadata | null> => {
      if (!user) return null;

      try {
        const response = await fetch(`${API_URL}/api/chatrooms/${id}`, {
          headers: {
            'x-user-id': user.id,
          },
        });

        if (!response.ok) {
          return null;
        }

        return await response.json();
      } catch {
        return null;
      }
    },
    [user]
  );

  const updateChatRoom = useCallback(
    async (id: string, updates: Partial<ChatRoomMetadata>): Promise<ChatRoomMetadata | null> => {
      if (!user) return null;

      try {
        const response = await fetch(`${API_URL}/api/chatrooms/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user.id,
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          return null;
        }

        const chatRoom = await response.json();
        setChatRooms((prev) =>
          prev.map((c) => (c.id === id ? chatRoom : c))
        );
        return chatRoom;
      } catch {
        return null;
      }
    },
    [user]
  );

  const deleteChatRoom = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user) return false;

      try {
        const response = await fetch(`${API_URL}/api/chatrooms/${id}`, {
          method: 'DELETE',
          headers: {
            'x-user-id': user.id,
          },
        });

        if (!response.ok) {
          return false;
        }

        setChatRooms((prev) => prev.filter((c) => c.id !== id));
        return true;
      } catch {
        return false;
      }
    },
    [user]
  );

  const value: ChatContextValue = {
    chatRooms,
    isLoading,
    error,
    fetchChatRooms,
    createChatRoom,
    getChatRoom,
    updateChatRoom,
    deleteChatRoom,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat(): ChatContextValue {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
