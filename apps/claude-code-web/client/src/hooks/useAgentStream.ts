import { useState, useCallback, useRef } from 'react';

import type { AgentMessage, UseAgentStreamReturn } from '../types/agent';

/**
 * React hook for consuming SSE streams from the agent endpoint.
 * Handles connection lifecycle, message parsing, and cleanup.
 */
export function useAgentStream(): UseAgentStreamReturn {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);

  const stopStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsStreaming(false);
    setIsConnected(false);
  }, []);

  const startStream = useCallback((prompt: string) => {
    // Close any existing connection
    stopStream();

    setIsStreaming(true);
    setError(null);

    const url = `/api/agent/stream?prompt=${encodeURIComponent(prompt)}`;
    const eventSource = new EventSource(url);

    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      console.log('SSE connection opened');
    };

    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as AgentMessage;

        setMessages(prev => [...prev, message]);

        // Check for stream end
        if (message.type === 'result') {
          setIsStreaming(false);
          // Keep connection open for potential follow-up messages
        }

        if (message.type === 'error') {
          setError(message.error || 'Unknown error');
          setIsStreaming(false);
        }
      } catch (parseError) {
        console.error('Failed to parse SSE message:', parseError);
      }
    };

    eventSource.onerror = (event) => {
      console.error('SSE connection error:', event);

      // EventSource will try to reconnect automatically
      // We set error state only if we were not expecting a close
      if (eventSource.readyState === EventSource.CLOSED) {
        setIsConnected(false);
        setIsStreaming(false);

        if (!error) {
          setError('Connection lost');
        }
      }
    };
  }, [stopStream, error]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isStreaming,
    isConnected,
    error,
    startStream,
    stopStream,
    clearMessages
  };
}
