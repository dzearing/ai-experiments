import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useGlobalKeyboard } from '../hooks/useGlobalKeyboard';

/**
 * A message in the facilitator chat
 */
export interface FacilitatorMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  /** For streaming responses, indicates if the message is still being generated */
  isStreaming?: boolean;
  /** Tool calls made during this response */
  toolCalls?: Array<{
    name: string;
    input: Record<string, unknown>;
    output?: string;
  }>;
}

/**
 * Connection state for the facilitator WebSocket
 */
export type FacilitatorConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * Navigation context - where the user currently is in the app
 */
export interface NavigationContext {
  /** Current workspace ID (if viewing a workspace) */
  workspaceId?: string;
  /** Current workspace name */
  workspaceName?: string;
  /** Current document ID (if viewing a document) */
  documentId?: string;
  /** Current document title */
  documentTitle?: string;
  /** Current chat room ID (if in a chat room) */
  chatRoomId?: string;
  /** Current chat room name */
  chatRoomName?: string;
  /** Current page/route name */
  currentPage?: string;
}

/**
 * Context value for the facilitator chat
 */
interface FacilitatorContextValue {
  /** Whether the facilitator overlay is open */
  isOpen: boolean;
  /** Chat messages */
  messages: FacilitatorMessage[];
  /** Current connection state */
  connectionState: FacilitatorConnectionState;
  /** Whether the assistant is currently generating a response */
  isLoading: boolean;
  /** Error message if connection failed */
  error: string | null;
  /** Current navigation context (where the user is in the app) */
  navigationContext: NavigationContext;

  /** Toggle the facilitator overlay */
  toggle: () => void;
  /** Open the facilitator overlay */
  open: () => void;
  /** Close the facilitator overlay */
  close: () => void;
  /** Send a message to the facilitator */
  sendMessage: (content: string) => void;
  /** Clear all messages */
  clearMessages: () => void;
  /** Set messages (used for loading from history) */
  setMessages: (messages: FacilitatorMessage[]) => void;
  /** Set connection state */
  setConnectionState: (state: FacilitatorConnectionState) => void;
  /** Set loading state */
  setIsLoading: (isLoading: boolean) => void;
  /** Set error */
  setError: (error: string | null) => void;
  /** Add a message */
  addMessage: (message: FacilitatorMessage) => void;
  /** Update a message by ID */
  updateMessage: (id: string, updates: Partial<FacilitatorMessage>) => void;
  /** Update navigation context */
  setNavigationContext: (context: NavigationContext) => void;
}

const FacilitatorContext = createContext<FacilitatorContextValue | null>(null);

interface FacilitatorProviderProps {
  children: ReactNode;
}

/**
 * Provider for the facilitator chat context.
 * Manages the global state for the AI facilitator overlay.
 */
export function FacilitatorProvider({ children }: FacilitatorProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<FacilitatorMessage[]>([]);
  const [connectionState, setConnectionState] = useState<FacilitatorConnectionState>('disconnected');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [navigationContext, setNavigationContext] = useState<NavigationContext>({});

  // Toggle overlay
  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // Open overlay
  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  // Close overlay
  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Add a message
  const addMessage = useCallback((message: FacilitatorMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  // Update a message
  const updateMessage = useCallback((id: string, updates: Partial<FacilitatorMessage>) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, ...updates } : msg))
    );
  }, []);

  // Send a message (stub - will be connected to WebSocket in useFacilitatorSocket)
  const sendMessage = useCallback((content: string) => {
    const userMessage: FacilitatorMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    addMessage(userMessage);

    // Note: The actual sending to WebSocket will be handled by useFacilitatorSocket
    // which will use the addMessage and updateMessage functions
  }, [addMessage]);

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Global keyboard shortcut: Ctrl/Cmd + .
  useGlobalKeyboard({
    key: '.',
    ctrlOrMeta: true,
    onTrigger: toggle,
  });

  const value: FacilitatorContextValue = {
    isOpen,
    messages,
    connectionState,
    isLoading,
    error,
    navigationContext,
    toggle,
    open,
    close,
    sendMessage,
    clearMessages,
    setMessages,
    setConnectionState,
    setIsLoading,
    setError,
    addMessage,
    updateMessage,
    setNavigationContext,
  };

  return (
    <FacilitatorContext.Provider value={value}>
      {children}
    </FacilitatorContext.Provider>
  );
}

/**
 * Hook to access the facilitator context.
 * Must be used within a FacilitatorProvider.
 */
export function useFacilitator(): FacilitatorContextValue {
  const context = useContext(FacilitatorContext);
  if (!context) {
    throw new Error('useFacilitator must be used within a FacilitatorProvider');
  }
  return context;
}

export default FacilitatorProvider;
