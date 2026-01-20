import { useState, useCallback, useRef } from 'react';

import type { ChatPanelMessage } from '@ui-kit/react-chat';

import type {
  SDKMessage,
  SDKPartialAssistantMessage,
  SDKStreamEventMessage,
  UsageStats,
  UseAgentStreamReturn,
  PermissionRequestEvent,
  QuestionRequestEvent,
  PermissionMode,
  DeniedPermission,
} from '../types/agent';

import {
  type StreamingState,
  createInitialStreamingState,
  transformSDKMessage,
  accumulatePartialMessage,
  createStreamingMessage,
  isThinkingDelta,
  extractToolResults,
  extractToolUseIds,
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
  const [permissionRequest, setPermissionRequest] = useState<PermissionRequestEvent | null>(null);
  const [questionRequest, setQuestionRequest] = useState<QuestionRequestEvent | null>(null);
  const [permissionMode, setPermissionMode] = useState<PermissionMode>('default');
  const [deniedPermissions, setDeniedPermissions] = useState<DeniedPermission[]>([]);

  const eventSourceRef = useRef<EventSource | null>(null);
  const streamingStateRef = useRef<StreamingState>(createInitialStreamingState());
  const processedMessageIdsRef = useRef<Set<string>>(new Set());
  const activeStreamingIdRef = useRef<string | null>(null);

  const stopStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setIsStreaming(false);
    setIsConnected(false);
    setIsThinking(false);
  }, []);

  const startStream = useCallback((prompt: string, existingSessionId?: string, mode?: PermissionMode) => {
    // Close any existing connection
    stopStream();

    // Reset streaming state
    streamingStateRef.current = createInitialStreamingState();
    processedMessageIdsRef.current.clear();
    activeStreamingIdRef.current = null;
    setIsStreaming(true);
    setIsThinking(false);
    setThinkingContent('');
    setError(null);
    setPermissionRequest(null);
    setQuestionRequest(null);

    // Build URL with optional session ID for multi-turn and permission mode
    const urlSessionId = existingSessionId || sessionId || '';
    const urlMode = mode || permissionMode;
    const url = `/api/agent/stream?prompt=${encodeURIComponent(prompt)}&sessionId=${encodeURIComponent(urlSessionId)}&permissionMode=${encodeURIComponent(urlMode)}`;
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
  }, [stopStream, sessionId, permissionMode]);

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

      case 'stream_event': {
        // Real SDK streaming event - accumulate streaming content
        const streamEvent = message as SDKStreamEventMessage;

        // Convert to partial format for accumulator
        const partialFromStream: SDKPartialAssistantMessage = {
          type: 'assistant',
          subtype: 'partial',
          uuid: streamEvent.uuid,
          event: streamEvent.event,
        };

        streamingStateRef.current = accumulatePartialMessage(
          streamingStateRef.current,
          partialFromStream
        );

        // Update thinking state
        if (isThinkingDelta(partialFromStream)) {
          setIsThinking(true);
          setThinkingContent(streamingStateRef.current.currentThinking);
        } else {
          setIsThinking(false);
        }

        // Update or add streaming message
        const streamingMsgFromEvent = createStreamingMessage(streamingStateRef.current);

        // Track the active streaming message ID for replacement later
        activeStreamingIdRef.current = streamingMsgFromEvent.id;

        setMessages(prev => {
          const existingIndex = prev.findIndex(m => m.id === streamingMsgFromEvent.id);

          if (existingIndex >= 0) {
            const updated = [...prev];

            updated[existingIndex] = streamingMsgFromEvent;

            return updated;
          }

          return [...prev, streamingMsgFromEvent];
        });
        break;
      }

      case 'assistant':
        if ('subtype' in message && message.subtype === 'partial') {
          // Partial message (mock mode) - accumulate streaming content
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

          // Skip if we've already processed this message (prevent duplicates)
          if (processedMessageIdsRef.current.has(chatMessage.id)) {
            break;
          }

          processedMessageIdsRef.current.add(chatMessage.id);

          // Extract tool results and tool_use IDs from the message content
          const toolResults = extractToolResults(message.message.content);
          const toolUseIds = extractToolUseIds(message.message.content);

          // Mark tool calls as completed based on tool_result blocks
          if (toolResults.length > 0 && chatMessage.parts) {
            for (const part of chatMessage.parts) {
              if (part.type === 'tool_calls') {
                for (let i = 0; i < part.calls.length; i++) {
                  const call = part.calls[i];

                  // Get the tool_use_id for this call by matching position
                  const toolUseId = toolUseIds[i];

                  // Find matching result by tool_use_id
                  const result = toolResults.find(r => r.tool_use_id === toolUseId);

                  if (result) {
                    call.completed = true;
                    call.output = result.content;
                    call.endTime = Date.now();

                    // Track error state - permission timeouts and tool failures
                    if (result.is_error) {
                      call.cancelled = true;
                    }
                  }
                }
              }
            }
          }

          // Get the tracked streaming message ID before clearing state
          const trackedStreamingId = activeStreamingIdRef.current;
          const currentStreamingId = streamingStateRef.current.currentMessageId;

          setMessages(prev => {
            // First try to replace by the actively tracked streaming message ID
            if (trackedStreamingId) {
              const trackedIndex = prev.findIndex(m => m.id === trackedStreamingId);

              if (trackedIndex >= 0) {
                const updated = [...prev];

                updated[trackedIndex] = chatMessage;

                return updated;
              }
            }

            // Try to replace message with same ID as the complete message
            const existingIndex = prev.findIndex(m => m.id === chatMessage.id);

            if (existingIndex >= 0) {
              const updated = [...prev];

              updated[existingIndex] = chatMessage;

              return updated;
            }

            // Try to match by the streaming state message ID
            if (currentStreamingId) {
              const streamingIdIndex = prev.findIndex(m => m.id === currentStreamingId);

              if (streamingIdIndex >= 0) {
                const updated = [...prev];

                updated[streamingIdIndex] = chatMessage;

                return updated;
              }
            }

            // Fallback: replace any streaming message (from current turn)
            const streamingIndex = prev.findIndex(m => m.isStreaming);

            if (streamingIndex >= 0) {
              const updated = [...prev];

              updated[streamingIndex] = chatMessage;

              return updated;
            }

            // No matching message found - only add if it has meaningful content
            // This prevents adding empty duplicate messages when multiple assistant messages arrive
            const hasContent = chatMessage.parts && chatMessage.parts.length > 0 &&
              chatMessage.parts.some(p => {
                if (p.type === 'text') return p.text && p.text.trim().length > 0;
                if (p.type === 'tool_calls') return p.calls && p.calls.length > 0;

                return false;
              });

            if (hasContent) {
              return [...prev, chatMessage];
            }

            // Skip empty messages that couldn't find a streaming message to replace
            return prev;
          });

          // Clear streaming state and tracked ID
          streamingStateRef.current = createInitialStreamingState();
          activeStreamingIdRef.current = null;
          setIsThinking(false);
          setThinkingContent('');
        }
        break;

      case 'result':
        // IMPORTANT: Close the EventSource immediately to prevent auto-reconnect
        // The server closes the connection after sending result, and EventSource
        // will try to reconnect automatically, causing duplicate queries
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }

        // Extract usage stats
        if (message.usage) {
          setContextUsage(message.usage);
        }

        // Mark streaming complete and clear tracked streaming ID
        activeStreamingIdRef.current = null;
        setIsStreaming(false);
        setIsConnected(false);
        setIsThinking(false);
        setThinkingContent('');

        // Finalize any remaining streaming messages and filter out empty ones
        setMessages(prev => {
          return prev
            .map(m => {
              if (m.isStreaming) {
                return { ...m, isStreaming: false };
              }

              return m;
            })
            .filter(m => {
              // Keep messages that have meaningful content
              if (!m.parts || m.parts.length === 0) return false;

              return m.parts.some(p => {
                if (p.type === 'text') return p.text && p.text.trim().length > 0;
                if (p.type === 'tool_calls') return p.calls && p.calls.length > 0;

                return false;
              });
            });
        });
        break;

      case 'error':
        setError(message.error);
        setIsStreaming(false);
        setIsThinking(false);
        break;

      case 'permission_request':
        setPermissionRequest(message);
        break;

      case 'question_request':
        setQuestionRequest(message);
        break;

      case 'mode_changed':
        setPermissionMode(message.mode);
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
    setPermissionRequest(null);
    setQuestionRequest(null);
    setDeniedPermissions([]);
    streamingStateRef.current = createInitialStreamingState();
    activeStreamingIdRef.current = null;
  }, []);

  /**
   * Responds to a permission request from the server.
   */
  const respondToPermission = useCallback(async (requestId: string, behavior: 'allow' | 'deny', message?: string) => {
    // Track denial before sending response
    if (behavior === 'deny' && permissionRequest) {
      setDeniedPermissions(prev => [...prev, {
        toolName: permissionRequest.toolName,
        input: permissionRequest.input,
        reason: message || 'User denied this action',
        timestamp: Date.now(),
      }]);
    }

    await fetch('/api/agent/permission-response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, behavior, message }),
    });

    setPermissionRequest(null);
  }, [permissionRequest]);

  /**
   * Responds to a question request from the server.
   */
  const respondToQuestion = useCallback(async (requestId: string, answers: Record<string, string>) => {
    await fetch('/api/agent/question-response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, answers }),
    });

    setQuestionRequest(null);
  }, []);

  /**
   * Clears tracked denied permissions (for session reset).
   */
  const clearDeniedPermissions = useCallback(() => {
    setDeniedPermissions([]);
  }, []);

  /**
   * Changes the permission mode for subsequent tool calls.
   * Updates local state and notifies server if session exists.
   */
  const changePermissionMode = useCallback(async (newMode: PermissionMode) => {
    setPermissionMode(newMode);

    // If we have an active session, notify the server of the mode change
    if (sessionId) {
      try {
        await fetch('/api/agent/mode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, mode: newMode }),
        });
      } catch (err) {
        console.error('Failed to change permission mode:', err);
      }
    }
  }, [sessionId]);

  return {
    messages,
    isStreaming,
    isConnected,
    isThinking,
    thinkingContent,
    sessionId,
    contextUsage,
    error,
    permissionRequest,
    questionRequest,
    permissionMode,
    deniedPermissions,
    startStream,
    stopStream,
    clearMessages,
    respondToPermission,
    respondToQuestion,
    clearDeniedPermissions,
    changePermissionMode,
  };
}
