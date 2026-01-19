/**
 * Message types from the Agent SDK SSE stream.
 * This is a simplified version for Phase 1 - full types in Phase 2.
 */
export interface AgentMessage {
  type: 'connection' | 'assistant' | 'result' | 'error';
  subtype?: string;
  connectionId?: string;
  timestamp?: string;
  text?: string;
  is_error?: boolean;
  error?: string;
}

export interface UseAgentStreamReturn {
  messages: AgentMessage[];
  isStreaming: boolean;
  isConnected: boolean;
  error: string | null;
  startStream: (prompt: string) => void;
  stopStream: () => void;
  clearMessages: () => void;
}
