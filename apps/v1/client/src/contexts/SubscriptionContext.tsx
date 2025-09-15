import { createContext, useContext, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { clientLogger } from '../utils/clientLogger';

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

        clientLogger.info('SubscriptionContext', 'SSE update received', {
          eventType: 'update',
          resourceId: key,
          payload: data.payload
        });

        // Call all registered callbacks for this resource
        const callbackSet = callbacks.current.get(key);
        if (callbackSet) {
          clientLogger.debug('SubscriptionContext', `Notifying ${callbackSet.size} subscribers for ${key}`);
          callbackSet.forEach((cb) => {
            try {
              cb(data.payload);
            } catch (err) {
              console.error('Error in subscription callback:', err);
              clientLogger.error('SubscriptionContext', 'Error in subscription callback', {
                error: err instanceof Error ? err.message : String(err)
              });
            }
          });
        } else {
          clientLogger.warn('SubscriptionContext', 'No subscribers found for update', { key });
        }
      } catch (err) {
        console.error('Error handling SSE update:', err);
        clientLogger.error('SubscriptionContext', 'Error handling SSE update', {
          error: err instanceof Error ? err.message : String(err)
        });
      }
    };

    const handleWorkspaceUpdate = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);

        clientLogger.info('SubscriptionContext', 'SSE workspace-update received', {
          eventType: 'workspace-update',
          data
        });

        // IMPORTANT: Invalidate cache IMMEDIATELY for workspace updates
        // This ensures data is fresh when components subscribe later
        if (data.action === 'work-item-updated' || data.action === 'work-item-discarded' || data.action === 'work-item-deleted') {
          import('../utils/cache').then(({ invalidateCache }) => {
            clientLogger.info('SubscriptionContext', 'Invalidating cache for workspace update', {
              action: data.action,
              workspacePath: data.workspacePath,
              workItemId: data.workItemId
            });

            // Invalidate all relevant caches
            if (data.workspacePath) {
              invalidateCache(`workspace-light:${data.workspacePath}`);
              invalidateCache(`workspace:${data.workspacePath}`);
            }
            if (data.projectPath) {
              invalidateCache(`project-details:${data.projectPath}`);
            }
            invalidateCache(/^work-items:/);
            invalidateCache(/^work-item:/);
          });
        }

        // Broadcast workspace update to all workspace subscribers
        const workspaceCallbacks = callbacks.current.get('workspace-update');
        if (workspaceCallbacks) {
          clientLogger.debug('SubscriptionContext', `Notifying ${workspaceCallbacks.size} workspace subscribers`);
          workspaceCallbacks.forEach((cb) => {
            try {
              cb(data);
            } catch (err) {
              console.error('Error in workspace update callback:', err);
              clientLogger.error('SubscriptionContext', 'Error in workspace update callback', {
                error: err instanceof Error ? err.message : String(err)
              });
            }
          });
        } else {
          clientLogger.warn('SubscriptionContext', 'No subscribers found for workspace update');
        }
      } catch (err) {
        console.error('Error handling workspace update:', err);
        clientLogger.error('SubscriptionContext', 'Error handling workspace update', {
          error: err instanceof Error ? err.message : String(err)
        });
      }
    };

    eventSource.addEventListener('update', handleUpdate);
    eventSource.addEventListener('workspace-update', handleWorkspaceUpdate);

    return () => {
      eventSource.removeEventListener('update', handleUpdate);
      eventSource.removeEventListener('workspace-update', handleWorkspaceUpdate);
    };
  }, [eventSource]);

  const subscribeToResource = useCallback(
    (type: string, id: string, callback: SubscriptionCallback) => {
      const key = `${type}:${id}`;

      // Add callback to the map
      if (!callbacks.current.has(key)) {
        callbacks.current.set(key, new Set());
      }
      callbacks.current.get(key)!.add(callback);

      // If this is the first subscription to this resource, tell the server
      if (!activeSubscriptions.current.has(key)) {
        clientLogger.info('SubscriptionContext', 'Subscribing to resource', { key });
        activeSubscriptions.current.add(key);
        subscribe([key]).catch((err) => {
          console.error('Failed to subscribe to resource:', err);
          clientLogger.error('SubscriptionContext', 'Failed to subscribe to resource', { key, error: err.message });
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
            unsubscribe([key]).catch((err) => {
              console.error('Failed to unsubscribe from resource:', err);
            });
          }
        }
      };
    },
    [subscribe, unsubscribe]
  );

  return (
    <SubscriptionContext.Provider
      value={{
        subscribe: subscribeToResource,
        isConnected,
      }}
    >
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
