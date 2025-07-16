import { createContext, useContext, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { useSubscription } from '../hooks/useSubscription';

type SubscriptionCallback = (data: any) => void;

interface SubscriptionContextType {
  subscribe: (type: string, id: string, callback: SubscriptionCallback) => () => void;
  isConnected: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { eventSource, subscribe, unsubscribe, isConnected } = useSubscription();
  const callbacks = useRef<Map<string, Set<SubscriptionCallback>>>(new Map());
  const activeSubscriptions = useRef<Set<string>>(new Set());

  // Listen for updates from the event source
  useEffect(() => {
    if (!eventSource) return;

    const handleUpdate = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        const key = data.id; // Resource ID like "repo-status:project1/repo-1"
        
        // Call all registered callbacks for this resource
        const callbackSet = callbacks.current.get(key);
        if (callbackSet) {
          callbackSet.forEach(cb => {
            try {
              cb(data.payload);
            } catch (err) {
              console.error('Error in subscription callback:', err);
            }
          });
        }
      } catch (err) {
        console.error('Error handling SSE update:', err);
      }
    };

    eventSource.addEventListener('update', handleUpdate);

    return () => {
      eventSource.removeEventListener('update', handleUpdate);
    };
  }, [eventSource]);

  const subscribeToResource = useCallback((type: string, id: string, callback: SubscriptionCallback) => {
    const key = `${type}:${id}`;
    
    // Add callback to the map
    if (!callbacks.current.has(key)) {
      callbacks.current.set(key, new Set());
    }
    callbacks.current.get(key)!.add(callback);
    
    // If this is the first subscription to this resource, tell the server
    if (!activeSubscriptions.current.has(key)) {
      activeSubscriptions.current.add(key);
      subscribe([key]).catch(err => {
        console.error('Failed to subscribe to resource:', err);
      });
    }

    // Return unsubscribe function
    return () => {
      const callbackSet = callbacks.current.get(key);
      if (callbackSet) {
        callbackSet.delete(callback);
        
        // If no more callbacks for this resource, unsubscribe from server
        if (callbackSet.size === 0) {
          callbacks.current.delete(key);
          activeSubscriptions.current.delete(key);
          unsubscribe([key]).catch(err => {
            console.error('Failed to unsubscribe from resource:', err);
          });
        }
      }
    };
  }, [subscribe, unsubscribe]);

  return (
    <SubscriptionContext.Provider value={{ 
      subscribe: subscribeToResource, 
      isConnected 
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useRealtimeSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useRealtimeSubscription must be used within SubscriptionProvider');
  }
  return context;
}