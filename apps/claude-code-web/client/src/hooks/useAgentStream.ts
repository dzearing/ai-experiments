import { useState, useCallback, useRef } from 'react';

import type { ChatPanelMessage } from '@ui-kit/react-chat';

import type {
  SDKMessage,
  SDKPartialAssistantMessage,
  UsageStats,
  UseAgentStreamReturn,
} from '../types/agent';

import {
  type StreamingState,
  createInitialStreamingState,
  transformSDKMessage,
  accumulatePartialMessage,
  createStreamingMessage,
  isThinkingDelta,
} from '../utils/messageTransformer';

/**
 * React hook for consuming SSE streams from the agent endpoint.
 * Handles SDK message parsing, streaming state, and conversation management.
 */
export function useAgentStream(): UseAgentStreamReturn {
  const [messages, setMessages] = useState<ChatPanelMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingContent, setThinkingContent] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [contextUsage, setContextUsage] = useState<UsageStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const streamingStateRef = useRef<StreamingState>(createInitialStreamingState());

  const stopStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setIsStreaming(false);
    setIsConnected(false);
    setIsThinking(false);
  }, []);

  const startStream = useCallback((prompt: string, existingSessionId?: string) => {
    // Close any existing connection
    stopStream();

    // Reset streaming state
    streamingStateRef.current = createInitialStreamingState();
    setIsStreaming(true);
    setIsThinking(false);
    setThinkingContent('');
    setError(null);

    // Build URL with optional session ID for multi-turn
    const urlSessionId = existingSessionId || sessionId || '';
    const url = `/api/agent/stream?prompt=${encodeURIComponent(prompt)}&sessionId=${encodeURIComponent(urlSessionId)}`;
    const eventSource = new EventSource(url);

    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as SDKMessage;

        handleSDKMessage(message);
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
        setIsThinking(false);

        setError(prev => prev || 'Connection lost');
      }
    };
  }, [stopStream, sessionId]);

  /**
   * Handles incoming SDK messages and updates state accordingly.
   */
  const handleSDKMessage = useCallback((message: SDKMessage) => {
    switch (message.type) {
      case 'system':
        if (message.subtype === 'init') {
          // Capture session ID for multi-turn conversations
          setSessionId(message.session_id);
        }
        break;

      case 'assistant':
        if ('subtype' in message && message.subtype === 'partial') {
          // Partial message - accumulate streaming content
          const partial = message as SDKPartialAssistantMessage;

          streamingStateRef.current = accumulatePartialMessage(
            streamingStateRef.current,
            partial
          );

          // Update thinking state
          if (isThinkingDelta(partial)) {
            setIsThinking(true);
            setThinkingContent(streamingStateRef.current.currentThinking);
          } else {
            setIsThinking(false);
          }

          // Update or add streaming message
          const streamingMsg = createStreamingMessage(streamingStateRef.current);

          setMessages(prev => {
            const existingIndex = prev.findIndex(m => m.id === streamingMsg.id);

            if (existingIndex >= 0) {
              // Update existing streaming message
              const updated = [...prev];

              updated[existingIndex] = streamingMsg;

              return updated;
            }

            // Add new streaming message
            return [...prev, streamingMsg];
          });
        } else {
          // Complete assistant message - transform and add
          const chatMessage = transformSDKMessage(message);

          setMessages(prev => {
            // Replace any streaming message with same ID
            const existingIndex = prev.findIndex(m => m.id === chatMessage.id);

            if (existingIndex >= 0) {
              const updated = [...prev];

              updated[existingIndex] = chatMessage;

              return updated;
            }

            return [...prev, chatMessage];
          });

          // Clear streaming state
          streamingStateRef.current = createInitialStreamingState();
          setIsThinking(false);
          setThinkingContent('');
        }
        break;

      case 'result':
        // Extract usage stats
        if (message.usage) {
          setContextUsage(message.usage);
        }

        // Mark streaming complete
        setIsStreaming(false);
        setIsThinking(false);
        setThinkingContent('');

        // Finalize any remaining streaming message
        setMessages(prev => {
          return prev.map(m => {
            if (m.isStreaming) {
              return { ...m, isStreaming: false };
            }

            return m;
          });
        });
        break;

      case 'error':
        setError(message.error);
        setIsStreaming(false);
        setIsThinking(false);
        break;
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    setContextUsage(null);
    setIsThinking(false);
    setThinkingContent('');
    setError(null);
    streamingStateRef.current = createInitialStreamingState();
  }, []);

  return {
    messages,
    isStreaming,
    isConnected,
    isThinking,
    thinkingContent,
    sessionId,
    contextUsage,
    error,
    startStream,
    stopStream,
    clearMessages,
  };
}
