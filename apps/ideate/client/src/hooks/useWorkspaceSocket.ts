import { useEffect, useRef, useCallback, useState } from 'react';
import { WORKSPACE_WS_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';

export type ResourceType = 'document' | 'chatroom' | 'idea' | 'thing';

export interface ResourcePresence {
  resourceId: string;
  resourceType: ResourceType;
  userId: string;
  userName: string;
  userColor: string;
  joinedAt: string;
}

export interface WorkspaceMessage {
  type: string;
  workspaceId?: string;
  resourceId?: string;
  resourceType?: ResourceType;
  data?: unknown;
}

export interface UseWorkspaceSocketOptions {
  workspaceId: string | undefined;
  /** User's session color for presence display */
  sessionColor?: string;
  onResourceCreated?: (resourceId: string, resourceType: ResourceType, data: unknown) => void;
  onResourceUpdated?: (resourceId: string, resourceType: ResourceType, data: unknown) => void;
  onResourceDeleted?: (resourceId: string, resourceType: ResourceType) => void;
  onPresenceUpdate?: (presence: Map<string, ResourcePresence[]>) => void;
  /** Called when a new workspace is created (for this user) */
  onWorkspaceCreated?: (workspaceId: string, data: unknown) => void;
  /** Called when a workspace is updated */
  onWorkspaceUpdated?: (workspaceId: string, data: unknown) => void;
  /** Called when a workspace is deleted */
  onWorkspaceDeleted?: (workspaceId: string) => void;
  /** Called when the user's workspace list has changed (general refresh trigger) */
  onWorkspacesChanged?: (data?: unknown) => void;
}

export function useWorkspaceSocket({
  workspaceId,
  sessionColor = '#888888',
  onResourceCreated,
  onResourceUpdated,
  onResourceDeleted,
  onPresenceUpdate,
  onWorkspaceCreated,
  onWorkspaceUpdated,
  onWorkspaceDeleted,
  onWorkspacesChanged,
}: UseWorkspaceSocketOptions) {
  const { user } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  // Track if we're intentionally closing (cleanup) vs unexpected disconnect
  const isCleaningUpRef = useRef(false);
  // Track if we're in the process of connecting (to prevent duplicate attempts)
  const isConnectingRef = useRef(false);

  // Track presence per resource: resourceId -> array of presence info
  const presenceRef = useRef<Map<string, ResourcePresence[]>>(new Map());

  // Use refs for values that shouldn't trigger reconnection
  // This prevents the WebSocket from closing/reopening on every render
  const userRef = useRef(user);
  const sessionColorRef = useRef(sessionColor);
  const workspaceIdRef = useRef(workspaceId);

  // Update refs when values change (but don't trigger reconnection)
  useEffect(() => {
    userRef.current = user;
    sessionColorRef.current = sessionColor;
    workspaceIdRef.current = workspaceId;
  }, [user, sessionColor, workspaceId]);

  // Stable callback refs
  const onResourceCreatedRef = useRef(onResourceCreated);
  const onResourceUpdatedRef = useRef(onResourceUpdated);
  const onResourceDeletedRef = useRef(onResourceDeleted);
  const onPresenceUpdateRef = useRef(onPresenceUpdate);
  const onWorkspaceCreatedRef = useRef(onWorkspaceCreated);
  const onWorkspaceUpdatedRef = useRef(onWorkspaceUpdated);
  const onWorkspaceDeletedRef = useRef(onWorkspaceDeleted);
  const onWorkspacesChangedRef = useRef(onWorkspacesChanged);

  useEffect(() => {
    onResourceCreatedRef.current = onResourceCreated;
    onResourceUpdatedRef.current = onResourceUpdated;
    onResourceDeletedRef.current = onResourceDeleted;
    onPresenceUpdateRef.current = onPresenceUpdate;
    onWorkspaceCreatedRef.current = onWorkspaceCreated;
    onWorkspaceUpdatedRef.current = onWorkspaceUpdated;
    onWorkspaceDeletedRef.current = onWorkspaceDeleted;
    onWorkspacesChangedRef.current = onWorkspacesChanged;
  }, [onResourceCreated, onResourceUpdated, onResourceDeleted, onPresenceUpdate, onWorkspaceCreated, onWorkspaceUpdated, onWorkspaceDeleted, onWorkspacesChanged]);

  // Stable connect function that reads from refs
  const connect = useCallback(() => {
    const currentUser = userRef.current;
    const currentWorkspaceId = workspaceIdRef.current;
    const currentSessionColor = sessionColorRef.current;

    // Only require user - workspaceId is optional (for user-scoped broadcasts)
    if (!currentUser) return;

    // Prevent duplicate connection attempts
    if (isConnectingRef.current) {
      console.log('[WorkspaceWS] Already connecting, skipping');
      return;
    }

    // Prevent duplicate connections (important for React.StrictMode)
    if (wsRef.current && (wsRef.current.readyState === WebSocket.CONNECTING || wsRef.current.readyState === WebSocket.OPEN)) {
      console.log('[WorkspaceWS] Connection already exists, skipping');
      return;
    }

    // Reset cleanup flag and set connecting flag
    isCleaningUpRef.current = false;
    isConnectingRef.current = true;

    // Build WebSocket URL with user info
    const params = new URLSearchParams({
      userId: currentUser.id,
      userName: currentUser.name,
      userColor: currentSessionColor,
    });

    const wsUrl = `${WORKSPACE_WS_URL}?${params}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WorkspaceWS] Connected', currentWorkspaceId ? `to workspace: ${currentWorkspaceId}` : '(user-scoped only)');
      isConnectingRef.current = false;
      setIsConnected(true);

      // Subscribe to workspace if specified
      if (currentWorkspaceId) {
        ws.send(JSON.stringify({
          type: 'subscribe',
          workspaceId: currentWorkspaceId,
        }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WorkspaceMessage;
        handleMessage(message);
      } catch (error) {
        console.error('[WorkspaceWS] Failed to parse message:', error);
      }
    };

    ws.onclose = () => {
      // Only process if this is still the current WebSocket (not a stale one from StrictMode)
      if (wsRef.current !== ws) {
        console.log('[WorkspaceWS] Ignoring close from stale WebSocket');
        return;
      }

      console.log('[WorkspaceWS] Disconnected');
      isConnectingRef.current = false;
      setIsConnected(false);
      wsRef.current = null;

      // Only attempt to reconnect if this wasn't an intentional cleanup
      // Note: workspaceId is optional - we reconnect for user-scoped broadcasts
      if (!isCleaningUpRef.current && userRef.current) {
        reconnectTimeoutRef.current = window.setTimeout(() => {
          console.log('[WorkspaceWS] Attempting to reconnect...');
          connect();
        }, 3000);
      }
    };

    ws.onerror = (error) => {
      console.error('[WorkspaceWS] Error:', error);
    };
  }, []); // No dependencies - reads from refs

  const handleMessage = useCallback((message: WorkspaceMessage) => {
    switch (message.type) {
      case 'resource_created':
        if (message.resourceId && message.resourceType) {
          onResourceCreatedRef.current?.(message.resourceId, message.resourceType, message.data);
        }
        break;

      case 'resource_updated':
        if (message.resourceId && message.resourceType) {
          onResourceUpdatedRef.current?.(message.resourceId, message.resourceType, message.data);
        }
        break;

      case 'resource_deleted':
        if (message.resourceId && message.resourceType) {
          onResourceDeletedRef.current?.(message.resourceId, message.resourceType);
          // Also remove from presence tracking
          presenceRef.current.delete(message.resourceId);
          onPresenceUpdateRef.current?.(new Map(presenceRef.current));
        }
        break;

      case 'presence_sync': {
        // Full presence sync for a workspace
        const presenceData = message.data as ResourcePresence[];
        presenceRef.current.clear();

        for (const p of presenceData) {
          if (!presenceRef.current.has(p.resourceId)) {
            presenceRef.current.set(p.resourceId, []);
          }
          presenceRef.current.get(p.resourceId)!.push(p);
        }

        onPresenceUpdateRef.current?.(new Map(presenceRef.current));
        break;
      }

      case 'presence_join': {
        const presence = message.data as ResourcePresence;
        if (presence.resourceId) {
          if (!presenceRef.current.has(presence.resourceId)) {
            presenceRef.current.set(presence.resourceId, []);
          }
          // Avoid duplicates
          const existing = presenceRef.current.get(presence.resourceId)!;
          const alreadyExists = existing.some(p => p.userId === presence.userId);
          if (!alreadyExists) {
            existing.push(presence);
          }
          onPresenceUpdateRef.current?.(new Map(presenceRef.current));
        }
        break;
      }

      case 'presence_leave': {
        const leaveData = message.data as { userId: string };
        if (message.resourceId && leaveData.userId) {
          const existing = presenceRef.current.get(message.resourceId);
          if (existing) {
            const filtered = existing.filter(p => p.userId !== leaveData.userId);
            if (filtered.length === 0) {
              presenceRef.current.delete(message.resourceId);
            } else {
              presenceRef.current.set(message.resourceId, filtered);
            }
            onPresenceUpdateRef.current?.(new Map(presenceRef.current));
          }
        }
        break;
      }

      case 'workspace_created':
        if (message.workspaceId) {
          onWorkspaceCreatedRef.current?.(message.workspaceId, message.data);
        }
        break;

      case 'workspace_updated':
        if (message.workspaceId) {
          onWorkspaceUpdatedRef.current?.(message.workspaceId, message.data);
        }
        break;

      case 'workspace_deleted':
        if (message.workspaceId) {
          onWorkspaceDeletedRef.current?.(message.workspaceId);
        }
        break;

      case 'workspaces_changed':
        onWorkspacesChangedRef.current?.(message.data);
        break;
    }
  }, []);

  // Connect when workspaceId or userId changes (using primitives, not object references)
  // Note: workspaceId is optional - we connect for user-scoped broadcasts even without it
  const userId = user?.id;
  useEffect(() => {
    if (userId) {
      connect();
    }

    return () => {
      // Mark as intentional cleanup to prevent reconnection attempts
      isCleaningUpRef.current = true;
      isConnectingRef.current = false;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      presenceRef.current.clear();
    };
  }, [workspaceId, userId, connect]);

  // Method to join a resource (for presence tracking)
  const joinResource = useCallback((resourceId: string, resourceType: ResourceType) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'presence_join',
        resourceId,
        resourceType,
      }));
    }
  }, []);

  // Method to leave a resource
  const leaveResource = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'presence_leave',
      }));
    }
  }, []);

  // Get presence for a specific resource
  const getResourcePresence = useCallback((resourceId: string): ResourcePresence[] => {
    return presenceRef.current.get(resourceId) || [];
  }, []);

  return {
    isConnected,
    joinResource,
    leaveResource,
    getResourcePresence,
    presence: presenceRef.current,
  };
}
