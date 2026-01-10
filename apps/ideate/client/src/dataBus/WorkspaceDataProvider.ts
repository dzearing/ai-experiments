import type { DataBus, DataBusProvider } from '@claude-flow/data-bus';
import { applyDelta, type Delta } from '@claude-flow/data-bus/delta';
import { WORKSPACE_WS_URL } from '../config';
import { createLogger } from '../utils/clientLogger';

const log = createLogger('WorkspaceDataProvider');

/**
 * Options for creating a workspace data provider.
 */
export interface WorkspaceDataProviderOptions {
  workspaceId: string;
  userId: string;
  sessionColor?: string;
}

/**
 * Resource subscription message sent to the server.
 */
interface ResourceSubscription {
  resourceType: string;
  resourceId: string;
  fromVersion?: number;
}

/**
 * Server message types for the delta protocol.
 */
interface ServerMessage {
  type: string;
  resourceType?: string;
  resourceId?: string;
  data?: unknown;
  version?: number;
  delta?: Delta;
}

/**
 * Track state for subscribed resources.
 */
interface ResourceState {
  version: number;
  data: unknown;
}

/**
 * Creates a data bus provider that connects to the workspace WebSocket
 * and handles real-time resource updates via the delta protocol.
 */
export function createWorkspaceDataProvider(
  options: WorkspaceDataProviderOptions,
): DataBusProvider {
  const { workspaceId, userId, sessionColor = '#888888' } = options;

  let ws: WebSocket | null = null;
  let bus: DataBus | null = null;
  let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  let isActive = false;

  // Track subscribed resources and their state
  const subscriptions = new Map<string, ResourceSubscription>();
  const resourceStates = new Map<string, ResourceState>();

  /**
   * Generate a key for resource tracking.
   */
  function getResourceKey(resourceType: string, resourceId: string): string {
    return `${resourceType}:${resourceId}`;
  }

  /**
   * Get the data bus path for a resource.
   */
  function getResourcePath(resourceType: string, resourceId: string): string[] {
    return [resourceType + 's', resourceId]; // e.g., ['ideas', 'idea-123']
  }

  /**
   * Connect to the WebSocket server.
   */
  function connect(): void {
    if (!isActive || ws) return;

    const params = new URLSearchParams({
      userId,
      userName: 'User', // Could be enhanced to get real user name
      userColor: sessionColor,
    });

    ws = new WebSocket(`${WORKSPACE_WS_URL}?${params}`);

    ws.onopen = () => {
      log.log('Connected', { workspaceId });

      // Subscribe to workspace
      if (ws && workspaceId) {
        ws.send(JSON.stringify({
          type: 'subscribe',
          workspaceId,
        }));
      }

      // Re-subscribe to all tracked resources
      for (const sub of subscriptions.values()) {
        const state = resourceStates.get(getResourceKey(sub.resourceType, sub.resourceId));

        if (ws) {
          ws.send(JSON.stringify({
            type: 'subscribe_resource',
            resourceType: sub.resourceType,
            resourceId: sub.resourceId,
            fromVersion: state?.version,
          }));
        }
      }
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as ServerMessage;

        handleMessage(message);
      } catch (error) {
        log.error('Failed to parse message', { error });
      }
    };

    ws.onclose = () => {
      log.log('Disconnected');
      ws = null;

      // Attempt to reconnect if still active
      if (isActive) {
        reconnectTimeout = setTimeout(() => {
          log.log('Attempting to reconnect...');
          connect();
        }, 3000);
      }
    };

    ws.onerror = (error) => {
      log.error('WebSocket error', { error });
    };
  }

  /**
   * Handle incoming server messages.
   */
  function handleMessage(message: ServerMessage): void {
    switch (message.type) {
      case 'resource_snapshot':
        handleSnapshot(message);
        break;

      case 'resource_delta':
        handleDelta(message);
        break;

      case 'resource_updated':
        // Partial update message - MERGE with existing state
        if (message.resourceType && message.resourceId && message.data) {
          const key = getResourceKey(message.resourceType, message.resourceId);
          const path = getResourcePath(message.resourceType, message.resourceId);

          // Get existing state and merge with new data
          const existingState = resourceStates.get(key);
          const existingData = existingState?.data as Record<string, unknown> | undefined;
          const newData = message.data as Record<string, unknown>;
          const mergedData = existingData ? { ...existingData, ...newData } : newData;

          log.log(`resource_updated for ${key}`, {
            existing: existingData,
            incoming: newData,
            merged: mergedData,
          });

          resourceStates.set(key, {
            version: Date.now(),
            data: mergedData,
          });

          bus?.publish(path, mergedData);
        }
        break;
    }
  }

  /**
   * Handle a snapshot message from the server.
   */
  function handleSnapshot(message: ServerMessage): void {
    if (!message.resourceType || !message.resourceId) return;

    const key = getResourceKey(message.resourceType, message.resourceId);
    const path = getResourcePath(message.resourceType, message.resourceId);

    resourceStates.set(key, {
      version: message.version ?? 0,
      data: message.data,
    });

    log.log(`Snapshot for ${key}`, { version: message.version });
    bus?.publish(path, message.data);
  }

  /**
   * Handle a delta message from the server.
   */
  function handleDelta(message: ServerMessage): void {
    if (!message.resourceType || !message.resourceId || !message.delta) return;

    const key = getResourceKey(message.resourceType, message.resourceId);
    const path = getResourcePath(message.resourceType, message.resourceId);

    const state = resourceStates.get(key);

    if (!state) {
      // No local state - request a full snapshot
      log.log(`No local state for ${key}, requesting snapshot`);
      requestSnapshot(message.resourceType, message.resourceId);

      return;
    }

    // Check version continuity
    if (message.delta.baseVersion !== state.version) {
      // Version mismatch - request full snapshot
      log.log(`Version mismatch for ${key}`, { localVersion: state.version, baseVersion: message.delta.baseVersion });
      requestSnapshot(message.resourceType, message.resourceId);

      return;
    }

    // Apply the delta
    const newData = applyDelta(state.data, message.delta);

    resourceStates.set(key, {
      version: message.delta.version,
      data: newData,
    });

    log.log(`Applied delta for ${key}`, { version: message.delta.version });
    bus?.publish(path, newData);
  }

  /**
   * Request a full snapshot for a resource.
   */
  function requestSnapshot(resourceType: string, resourceId: string): void {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    ws.send(JSON.stringify({
      type: 'subscribe_resource',
      resourceType,
      resourceId,
      // No fromVersion - request full snapshot
    }));
  }

  /**
   * Subscribe to a resource.
   */
  function subscribeResource(resourceType: string, resourceId: string): void {
    const key = getResourceKey(resourceType, resourceId);

    if (subscriptions.has(key)) return;

    const sub: ResourceSubscription = {
      resourceType,
      resourceId,
    };

    subscriptions.set(key, sub);

    // Send subscription if connected
    if (ws?.readyState === WebSocket.OPEN) {
      const state = resourceStates.get(key);

      ws.send(JSON.stringify({
        type: 'subscribe_resource',
        resourceType,
        resourceId,
        fromVersion: state?.version,
      }));
    }
  }

  /**
   * Unsubscribe from a resource.
   */
  function unsubscribeResource(resourceType: string, resourceId: string): void {
    const key = getResourceKey(resourceType, resourceId);

    subscriptions.delete(key);
    resourceStates.delete(key);

    // Send unsubscription if connected
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'unsubscribe_resource',
        resourceType,
        resourceId,
      }));
    }
  }

  /**
   * Disconnect from the WebSocket server.
   */
  function disconnect(): void {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }

    if (ws) {
      ws.close();
      ws = null;
    }
  }

  return {
    path: [], // Root provider

    onActivate: (opts) => {
      log.log('Activated', { workspaceId });
      bus = opts.bus;
      isActive = true;

      connect();
    },

    onDeactivate: () => {
      log.log('Deactivated');
      isActive = false;
      bus = null;

      disconnect();
      subscriptions.clear();
      resourceStates.clear();
    },

    // Allow external code to subscribe/unsubscribe
    // These are exposed via the provider instance
    subscribeResource,
    unsubscribeResource,
  } as DataBusProvider & {
    subscribeResource: (resourceType: string, resourceId: string) => void;
    unsubscribeResource: (resourceType: string, resourceId: string) => void;
  };
}
