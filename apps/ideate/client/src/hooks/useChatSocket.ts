import { useEffect, useRef, useState, useCallback } from 'react';
import { CHAT_WS_URL } from '../config';
import type { ChatMessage } from '../contexts/ChatContext';

interface ServerMessage {
  type: 'message' | 'join' | 'leave' | 'typing' | 'stop_typing' | 'error' | 'history';
  message?: ChatMessage;
  messages?: ChatMessage[];
  userId?: string;
  userName?: string;
  error?: string;
}

interface UseChatSocketOptions {
  roomId: string;
  userId: string;
  userName: string;
  userColor: string;
  onMessage?: (message: ChatMessage) => void;
  onUserJoin?: (userId: string, userName: string) => void;
  onUserLeave?: (userId: string, userName: string) => void;
  onTyping?: (userId: string, userName: string) => void;
  onStopTyping?: (userId: string) => void;
  onError?: (error: string) => void;
}

interface UseChatSocketReturn {
  messages: ChatMessage[];
  isConnected: boolean;
  isConnecting: boolean;
  sendMessage: (content: string) => void;
  sendTyping: () => void;
  sendStopTyping: () => void;
}

export function useChatSocket({
  roomId,
  userId,
  userName,
  userColor,
  onMessage,
  onUserJoin,
  onUserLeave,
  onTyping,
  onStopTyping,
  onError,
}: UseChatSocketOptions): UseChatSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    if (!roomId || !userId) return;

    setIsConnecting(true);

    const wsUrl = `${CHAT_WS_URL}/${roomId}?userId=${encodeURIComponent(userId)}&userName=${encodeURIComponent(userName)}&userColor=${encodeURIComponent(userColor)}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setIsConnecting(false);
      console.log('[Chat] WebSocket connected');
    };

    ws.onclose = () => {
      setIsConnected(false);
      setIsConnecting(false);
      console.log('[Chat] WebSocket disconnected');

      // Attempt to reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error('[Chat] WebSocket error:', error);
      setIsConnecting(false);
    };

    ws.onmessage = (event) => {
      try {
        const data: ServerMessage = JSON.parse(event.data);

        switch (data.type) {
          case 'history':
            if (data.messages) {
              setMessages(data.messages);
            }
            break;
          case 'message':
            if (data.message) {
              setMessages((prev) => [...prev, data.message!]);
              onMessage?.(data.message);
            }
            break;
          case 'join':
            if (data.userId && data.userName) {
              onUserJoin?.(data.userId, data.userName);
            }
            break;
          case 'leave':
            if (data.userId && data.userName) {
              onUserLeave?.(data.userId, data.userName);
            }
            break;
          case 'typing':
            if (data.userId && data.userName) {
              onTyping?.(data.userId, data.userName);
            }
            break;
          case 'stop_typing':
            if (data.userId) {
              onStopTyping?.(data.userId);
            }
            break;
          case 'error':
            if (data.error) {
              onError?.(data.error);
            }
            break;
        }
      } catch (error) {
        console.error('[Chat] Failed to parse message:', error);
      }
    };
  }, [roomId, userId, userName, userColor, onMessage, onUserJoin, onUserLeave, onTyping, onStopTyping, onError]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  const sendMessage = useCallback((content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'message',
        content,
      }));
    }
  }, []);

  const sendTyping = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'typing',
      }));
    }
  }, []);

  const sendStopTyping = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'stop_typing',
      }));
    }
  }, []);

  return {
    messages,
    isConnected,
    isConnecting,
    sendMessage,
    sendTyping,
    sendStopTyping,
  };
}
