import { useEffect, useState, useCallback, useRef } from 'react';
import { sseUrl, apiUrl } from '../config/api';

interface UseSubscriptionReturn {
  eventSource: EventSource | null;
  clientId: string | null;
  isConnected: boolean;
  subscribe: (resources: string[]) => Promise<void>;
  unsubscribe: (resources: string[]) => Promise<void>;
}

export function useSubscription(): UseSubscriptionReturn {
  const [eventSource, setEventSource] = useState<EventSource | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  useEffect(() => {
    let es: EventSource | null = null;
    let isMounted = true;

    const connect = () => {
      console.log('Connecting to SSE...');
      es = new EventSource(sseUrl('/api/sse/subscribe'));
      
      es.onopen = () => {
        console.log('SSE connection opened');
        reconnectAttemptsRef.current = 0;
      };
      
      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'connected' && data.clientId) {
            console.log('SSE connected with client ID:', data.clientId);
            if (isMounted) {
              setClientId(data.clientId);
              setIsConnected(true);
            }
          }
        } catch (err) {
          console.error('Error parsing SSE message:', err);
        }
      };

      es.onerror = (error) => {
        console.error('SSE error:', error);
        if (isMounted) {
          setIsConnected(false);
          setClientId(null);
        }
        
        // Reconnect with exponential backoff
        const attempts = reconnectAttemptsRef.current;
        const delay = Math.min(5000 * Math.pow(2, attempts), 60000); // Max 60 seconds
        
        console.log(`Reconnecting in ${delay}ms (attempt ${attempts + 1})`);
        reconnectAttemptsRef.current++;
        
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isMounted && es?.readyState === EventSource.CLOSED) {
            connect();
          }
        }, delay);
      };

      if (isMounted) {
        setEventSource(es);
      }
    };

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (es) {
        es.close();
      }
    };
  }, []);

  const subscribe = useCallback(async (resources: string[]) => {
    if (!clientId) {
      console.warn('Cannot subscribe: no client ID');
      return;
    }
    
    try {
      const response = await fetch(apiUrl('/api/subscriptions'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, resources })
      });
      
      if (!response.ok) {
        throw new Error('Failed to subscribe');
      }
      
      const result = await response.json();
      if (result.success) {
        console.log('Subscribed to resources:', resources);
      }
    } catch (error) {
      console.error('Error subscribing:', error);
    }
  }, [clientId]);

  const unsubscribe = useCallback(async (resources: string[]) => {
    if (!clientId) {
      console.warn('Cannot unsubscribe: no client ID');
      return;
    }
    
    try {
      const response = await fetch(apiUrl('/api/subscriptions'), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, resources })
      });
      
      if (!response.ok) {
        throw new Error('Failed to unsubscribe');
      }
      
      const result = await response.json();
      if (result.success) {
        console.log('Unsubscribed from resources:', resources);
      }
    } catch (error) {
      console.error('Error unsubscribing:', error);
    }
  }, [clientId]);

  return {
    eventSource,
    clientId,
    isConnected,
    subscribe,
    unsubscribe
  };
}