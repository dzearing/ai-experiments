import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useGlobalKeyboard } from '../hooks/useGlobalKeyboard';
import type { OpenQuestion, OpenQuestionsResult } from '@ui-kit/react-chat';

/**
 * A tool call within a message
 */
export interface ToolCall {
  name: string;
  input: Record<string, unknown>;
  output?: string;
  /** When the tool call started (for timing display) */
  startTime?: number;
}

/**
 * A text content part within a message
 */
export interface TextPart {
  type: 'text';
  text: string;
}

/**
 * A tool calls part within a message (groups tool calls together)
 */
export interface ToolCallsPart {
  type: 'tool_calls';
  calls: ToolCall[];
}

/**
 * A message part - either text or tool calls
 */
export type MessagePart = TextPart | ToolCallsPart;

/**
 * A message in the facilitator chat
 */
export interface FacilitatorMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  /** Message parts in order - text and tool calls can be interleaved */
  parts: MessagePart[];
  timestamp: number;
  /** For streaming responses, indicates if the message is still being generated */
  isStreaming?: boolean;
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
  /** Active Thing ID (if viewing/selected a Thing) */
  activeThingId?: string;
  /** Active Thing name */
  activeThingName?: string;
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
  /** Pending persona change request (presetId or '__custom__') */
  pendingPersonaChange: string | null;
  /** Pending message to send when facilitator opens (for automated actions) */
  pendingMessage: string | null;
  /** Current open questions from the facilitator */
  openQuestions: OpenQuestion[] | null;
  /** Whether to show the question resolver UI */
  showQuestionsResolver: boolean;

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
  /** Update a message by ID - supports callback-based updates for parts */
  updateMessage: (id: string, updates: Partial<FacilitatorMessage> | {
    parts?: MessagePart[] | ((prev: MessagePart[]) => MessagePart[]);
    isStreaming?: boolean;
  }) => void;
  /** Update navigation context */
  setNavigationContext: (context: NavigationContext) => void;
  /** Request a persona change (will be processed by WebSocket when connected) */
  requestPersonaChange: (presetId: string) => void;
  /** Clear pending persona change (called after WebSocket processes it) */
  clearPendingPersonaChange: () => void;
  /** Open facilitator and queue a message to send (useful for automated actions like Import) */
  openWithMessage: (content: string) => void;
  /** Clear pending message (called after WebSocket processes it) */
  clearPendingMessage: () => void;
  /** Set open questions (from WebSocket) */
  setOpenQuestions: (questions: OpenQuestion[] | null) => void;
  /** Set whether to show the question resolver UI */
  setShowQuestionsResolver: (show: boolean) => void;
  /** Resolve open questions (send answers back) */
  resolveQuestions: (result: OpenQuestionsResult) => void;
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
  const [pendingPersonaChange, setPendingPersonaChange] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [openQuestions, setOpenQuestions] = useState<OpenQuestion[] | null>(null);
  const [showQuestionsResolver, setShowQuestionsResolver] = useState(false);

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

  // Update a message - supports callback-based updates for parts
  const updateMessage = useCallback((id: string, updates: Partial<FacilitatorMessage> | { parts?: MessagePart[] | ((prev: MessagePart[]) => MessagePart[]); isStreaming?: boolean }) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== id) return msg;

        const newMsg = { ...msg };

        // Handle callback-based parts update
        if (typeof updates.parts === 'function') {
          newMsg.parts = updates.parts(msg.parts);
        } else if (updates.parts !== undefined) {
          newMsg.parts = updates.parts;
        }

        // Handle other updates (like isStreaming)
        if ('isStreaming' in updates) {
          newMsg.isStreaming = updates.isStreaming;
        }

        return newMsg;
      })
    );
  }, []);

  // Send a message (stub - will be connected to WebSocket in useFacilitatorSocket)
  const sendMessage = useCallback((content: string) => {
    const userMessage: FacilitatorMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      role: 'user',
      parts: [{ type: 'text', text: content }],
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

  // Request a persona change
  const requestPersonaChange = useCallback((presetId: string) => {
    setPendingPersonaChange(presetId);
  }, []);

  // Clear pending persona change
  const clearPendingPersonaChange = useCallback(() => {
    setPendingPersonaChange(null);
  }, []);

  // Open facilitator and queue a message to send (useful for automated actions like Import)
  const openWithMessage = useCallback((content: string) => {
    setPendingMessage(content);
    setIsOpen(true);
  }, []);

  // Clear pending message (called after WebSocket processes it)
  const clearPendingMessage = useCallback(() => {
    setPendingMessage(null);
  }, []);

  // Resolve open questions - format answers and send as message
  const resolveQuestions = useCallback((result: OpenQuestionsResult) => {
    setShowQuestionsResolver(false);

    if (result.completed && openQuestions) {
      // Build human-readable summary of answers
      const summaryLines = ['Here are my answers to the questions:'];

      for (const answer of result.answers) {
        const question = openQuestions.find(q => q.id === answer.questionId);
        if (!question) continue;

        // Get readable labels for selected options
        const selectedLabels = answer.selectedOptionIds
          .map(optId => {
            if (optId === 'custom') return answer.customText;
            const opt = question.options.find(o => o.id === optId);
            return opt?.label;
          })
          .filter(Boolean);

        // Truncate question for display
        const shortQuestion = question.question.length > 50
          ? question.question.slice(0, 50) + '...'
          : question.question;

        summaryLines.push(`- **${shortQuestion}**: ${selectedLabels.join(', ')}`);
      }

      const summary = summaryLines.join('\n');
      sendMessage(summary);
      setOpenQuestions(null);
    } else if (result.dismissed) {
      // User dismissed without completing
      setOpenQuestions(null);
    }
  }, [openQuestions, sendMessage]);

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
    pendingPersonaChange,
    pendingMessage,
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
    requestPersonaChange,
    clearPendingPersonaChange,
    openWithMessage,
    clearPendingMessage,
    openQuestions,
    showQuestionsResolver,
    setOpenQuestions,
    setShowQuestionsResolver,
    resolveQuestions,
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
