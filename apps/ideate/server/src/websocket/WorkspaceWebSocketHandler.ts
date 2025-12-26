import { WebSocket, type RawData } from 'ws';
import type { IncomingMessage } from 'http';

// Resource types supported by the workspace handler
export type ResourceType = 'document' | 'chatroom' | 'idea';

// Presence info for a user viewing a resource
export interface ResourcePresence {
  resourceId: string;
  resourceType: ResourceType;
  userId: string;
  userName: string;
  userColor: string;
  joinedAt: string;
}

// Message types for workspace WebSocket
export type WorkspaceMessageType =
  | 'subscribe'
  | 'unsubscribe'
  | 'resource_created'
  | 'resource_updated'
  | 'resource_deleted'
  | 'workspace_created'
  | 'workspace_updated'
  | 'workspace_deleted'
  | 'workspaces_changed'
  | 'presence_join'
  | 'presence_leave'
  | 'presence_sync';

export interface WorkspaceMessage {
  type: WorkspaceMessageType;
  workspaceId?: string;
  resourceId?: string;
  resourceType?: ResourceType;
  data?: unknown;
}

interface ClientInfo {
  ws: WebSocket;
  userId: string;
  userName: string;
  userColor: string;
  subscribedWorkspaces: Set<string>;
  // Track what resource the client is currently viewing
  currentResource?: {
    id: string;
    type: ResourceType;
  };
}

/**
 * WebSocket handler for real-time workspace updates.
 * Handles:
 * - Resource CRUD notifications (documents, chat rooms)
 * - Presence tracking for who is viewing what
 */
export class WorkspaceWebSocketHandler {
  // Map of client ID to client info
  private clients = new Map<string, ClientInfo>();
  // Map of workspaceId to set of subscribed client IDs
  private workspaceSubscribers = new Map<string, Set<string>>();
  // Map of resourceId to set of client IDs viewing it
  private resourcePresence = new Map<string, Set<string>>();
  // Map of userId to pending leave timeout (for grace period handling)
  private pendingLeaves = new Map<string, { timeout: NodeJS.Timeout; resourceId: string; resourceType: ResourceType }>();

  private clientIdCounter = 0;

  // Grace period before broadcasting presence_leave (allows for StrictMode reconnects)
  private readonly LEAVE_GRACE_PERIOD_MS = 1000;

  handleConnection(ws: WebSocket, req: IncomingMessage): void {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const userId = url.searchParams.get('userId') || `anon-${Date.now()}`;
    const userName = url.searchParams.get('userName') || 'Anonymous';
    const userColor = url.searchParams.get('userColor') || '#808080';

    const clientId = `client-${++this.clientIdCounter}`;

    const clientInfo: ClientInfo = {
      ws,
      userId,
      userName,
      userColor,
      subscribedWorkspaces: new Set(),
    };

    this.clients.set(clientId, clientInfo);
    console.log(`[WorkspaceWS] Client connected: ${clientId} (${userName})`);

    ws.on('message', (data: RawData) => {
      this.handleMessage(clientId, data);
    });

    ws.on('close', () => {
      this.handleDisconnect(clientId);
    });

    ws.on('error', (error) => {
      console.error(`[WorkspaceWS] Client error ${clientId}:`, error);
      this.handleDisconnect(clientId);
    });
  }

  private handleMessage(clientId: string, data: RawData): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    try {
      const message = JSON.parse(data.toString()) as WorkspaceMessage;

      switch (message.type) {
        case 'subscribe':
          if (message.workspaceId) {
            this.subscribeToWorkspace(clientId, message.workspaceId);
          }
          break;

        case 'unsubscribe':
          if (message.workspaceId) {
            this.unsubscribeFromWorkspace(clientId, message.workspaceId);
          }
          break;

        case 'presence_join':
          if (message.resourceId && message.resourceType) {
            this.joinResource(clientId, message.resourceId, message.resourceType);
          }
          break;

        case 'presence_leave':
          this.leaveCurrentResource(clientId);
          break;
      }
    } catch (error) {
      console.error(`[WorkspaceWS] Failed to parse message from ${clientId}:`, error);
    }
  }

  private subscribeToWorkspace(clientId: string, workspaceId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.subscribedWorkspaces.add(workspaceId);

    if (!this.workspaceSubscribers.has(workspaceId)) {
      this.workspaceSubscribers.set(workspaceId, new Set());
    }
    this.workspaceSubscribers.get(workspaceId)!.add(clientId);

    console.log(`[WorkspaceWS] Client ${clientId} subscribed to workspace ${workspaceId}`);

    // Send current presence state for this workspace
    this.sendPresenceSync(clientId, workspaceId);
  }

  private unsubscribeFromWorkspace(clientId: string, workspaceId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.subscribedWorkspaces.delete(workspaceId);
    this.workspaceSubscribers.get(workspaceId)?.delete(clientId);

    // If client was viewing a resource, leave it
    this.leaveCurrentResource(clientId);

    console.log(`[WorkspaceWS] Client ${clientId} unsubscribed from workspace ${workspaceId}`);
  }

  private joinResource(
    clientId: string,
    resourceId: string,
    resourceType: ResourceType
  ): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Check if there's a pending leave for this user on this same resource
    // If so, cancel it (user reconnected before grace period expired)
    const pendingLeave = this.pendingLeaves.get(client.userId);
    if (pendingLeave && pendingLeave.resourceId === resourceId) {
      clearTimeout(pendingLeave.timeout);
      this.pendingLeaves.delete(client.userId);
      console.log(`[WorkspaceWS] Cancelled pending leave for ${client.userId} on ${resourceType} ${resourceId} (reconnected within grace period)`);

      // Update the client's current resource and presence tracking
      client.currentResource = { id: resourceId, type: resourceType };
      if (!this.resourcePresence.has(resourceId)) {
        this.resourcePresence.set(resourceId, new Set());
      }
      this.resourcePresence.get(resourceId)!.add(clientId);
      return; // Don't broadcast another join - user was never seen as leaving
    }

    // If already viewing this exact resource, don't re-join (prevents duplicate issues)
    if (client.currentResource?.id === resourceId && client.currentResource?.type === resourceType) {
      console.log(`[WorkspaceWS] Client ${clientId} already viewing ${resourceType} ${resourceId}, skipping duplicate join`);
      return;
    }

    // Leave any previous resource (only if it's a DIFFERENT resource) - immediate since switching
    this.leaveCurrentResource(clientId, true);

    // Join new resource
    client.currentResource = { id: resourceId, type: resourceType };

    if (!this.resourcePresence.has(resourceId)) {
      this.resourcePresence.set(resourceId, new Set());
    }
    this.resourcePresence.get(resourceId)!.add(clientId);

    // Broadcast presence_join to all workspace subscribers
    const presence: ResourcePresence = {
      resourceId,
      resourceType,
      userId: client.userId,
      userName: client.userName,
      userColor: client.userColor,
      joinedAt: new Date().toISOString(),
    };

    // Find which workspaces this client is subscribed to and broadcast
    client.subscribedWorkspaces.forEach((workspaceId) => {
      this.broadcastToWorkspace(workspaceId, {
        type: 'presence_join',
        resourceId,
        resourceType,
        data: presence,
      });
    });

    console.log(`[WorkspaceWS] Client ${clientId} joined ${resourceType} ${resourceId}`);
  }

  private leaveCurrentResource(clientId: string, immediate = false): void {
    const client = this.clients.get(clientId);
    if (!client || !client.currentResource) return;

    const { id: resourceId, type: resourceType } = client.currentResource;
    const userId = client.userId;
    const userName = client.userName;
    const subscribedWorkspaces = new Set(client.subscribedWorkspaces);

    // Remove from presence tracking immediately
    this.resourcePresence.get(resourceId)?.delete(clientId);
    if (this.resourcePresence.get(resourceId)?.size === 0) {
      this.resourcePresence.delete(resourceId);
    }
    client.currentResource = undefined;

    // If immediate (e.g., switching to a different resource), broadcast right away
    if (immediate) {
      this.broadcastPresenceLeave(subscribedWorkspaces, resourceId, resourceType, userId, userName);
      console.log(`[WorkspaceWS] Client ${clientId} left ${resourceType} ${resourceId} (immediate)`);
      return;
    }

    // Otherwise, schedule a delayed leave to allow for reconnection
    // Cancel any existing pending leave for this user
    const existingPending = this.pendingLeaves.get(userId);
    if (existingPending) {
      clearTimeout(existingPending.timeout);
    }

    const timeout = setTimeout(() => {
      this.pendingLeaves.delete(userId);

      // Before broadcasting leave, check if user still has another client viewing this resource
      const stillViewing = this.isUserViewingResource(userId, resourceId);

      if (stillViewing) {
        // User reconnected with another client - don't broadcast leave
        return;
      }

      this.broadcastPresenceLeave(subscribedWorkspaces, resourceId, resourceType, userId, userName);
      console.log(`[WorkspaceWS] Client ${clientId} left ${resourceType} ${resourceId}`);
    }, this.LEAVE_GRACE_PERIOD_MS);

    this.pendingLeaves.set(userId, { timeout, resourceId, resourceType });
  }

  /**
   * Check if a user has any client currently viewing a specific resource
   */
  private isUserViewingResource(userId: string, resourceId: string): boolean {
    const clientIds = this.resourcePresence.get(resourceId);
    if (!clientIds) return false;

    for (const clientId of clientIds) {
      const client = this.clients.get(clientId);
      if (client && client.userId === userId && client.currentResource?.id === resourceId) {
        return true;
      }
    }
    return false;
  }

  private broadcastPresenceLeave(
    workspaceIds: Set<string>,
    resourceId: string,
    resourceType: ResourceType,
    userId: string,
    userName: string
  ): void {
    workspaceIds.forEach((workspaceId) => {
      this.broadcastToWorkspace(workspaceId, {
        type: 'presence_leave',
        resourceId,
        resourceType,
        data: {
          userId,
          userName,
        },
      });
    });
  }

  private sendPresenceSync(clientId: string, workspaceId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Collect all presence info for resources in this workspace
    const presenceData: ResourcePresence[] = [];

    this.resourcePresence.forEach((clientIds, resourceId) => {
      clientIds.forEach((cid) => {
        const c = this.clients.get(cid);
        if (c && c.currentResource && c.subscribedWorkspaces.has(workspaceId)) {
          presenceData.push({
            resourceId,
            resourceType: c.currentResource.type,
            userId: c.userId,
            userName: c.userName,
            userColor: c.userColor,
            joinedAt: new Date().toISOString(),
          });
        }
      });
    });

    this.sendToClient(client.ws, {
      type: 'presence_sync',
      workspaceId,
      data: presenceData,
    });
  }

  private handleDisconnect(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Leave current resource
    this.leaveCurrentResource(clientId);

    // Unsubscribe from all workspaces
    client.subscribedWorkspaces.forEach((workspaceId) => {
      this.workspaceSubscribers.get(workspaceId)?.delete(clientId);
    });

    this.clients.delete(clientId);
    console.log(`[WorkspaceWS] Client disconnected: ${clientId}`);
  }

  private broadcastToWorkspace(workspaceId: string, message: WorkspaceMessage): void {
    const subscribers = this.workspaceSubscribers.get(workspaceId);
    if (!subscribers) return;

    subscribers.forEach((clientId) => {
      const client = this.clients.get(clientId);
      if (client) {
        this.sendToClient(client.ws, message);
      }
    });
  }

  private sendToClient(ws: WebSocket, message: WorkspaceMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Called by API routes when a resource is created
   */
  notifyResourceCreated(
    workspaceId: string,
    resourceId: string,
    resourceType: ResourceType,
    data: unknown
  ): void {
    this.broadcastToWorkspace(workspaceId, {
      type: 'resource_created',
      workspaceId,
      resourceId,
      resourceType,
      data,
    });
    console.log(`[WorkspaceWS] Notified workspace ${workspaceId} of new ${resourceType}`);
  }

  /**
   * Called by API routes when a resource is updated
   */
  notifyResourceUpdated(
    workspaceId: string,
    resourceId: string,
    resourceType: ResourceType,
    data: unknown
  ): void {
    this.broadcastToWorkspace(workspaceId, {
      type: 'resource_updated',
      workspaceId,
      resourceId,
      resourceType,
      data,
    });
    console.log(`[WorkspaceWS] Notified workspace ${workspaceId} of updated ${resourceType}`);
  }

  /**
   * Called by API routes when a resource is deleted
   */
  notifyResourceDeleted(
    workspaceId: string,
    resourceId: string,
    resourceType: ResourceType
  ): void {
    this.broadcastToWorkspace(workspaceId, {
      type: 'resource_deleted',
      workspaceId,
      resourceId,
      resourceType,
    });
    console.log(`[WorkspaceWS] Notified workspace ${workspaceId} of deleted ${resourceType}`);
  }

  /**
   * Get current presence for a specific resource
   */
  getResourcePresence(resourceId: string): ResourcePresence[] {
    const clientIds = this.resourcePresence.get(resourceId);
    if (!clientIds) return [];

    const presence: ResourcePresence[] = [];
    clientIds.forEach((clientId) => {
      const client = this.clients.get(clientId);
      if (client && client.currentResource) {
        presence.push({
          resourceId,
          resourceType: client.currentResource.type,
          userId: client.userId,
          userName: client.userName,
          userColor: client.userColor,
          joinedAt: new Date().toISOString(),
        });
      }
    });
    return presence;
  }

  /**
   * Notify a specific user that their workspace list has changed.
   * Called when a workspace is created, updated, or deleted.
   */
  notifyUserWorkspacesChanged(userId: string, data?: unknown): void {
    this.clients.forEach((client) => {
      if (client.userId === userId) {
        this.sendToClient(client.ws, {
          type: 'workspaces_changed',
          data,
        });
      }
    });
    console.log(`[WorkspaceWS] Notified user ${userId} of workspace list change`);
  }

  /**
   * Notify a user that a workspace was created
   */
  notifyWorkspaceCreated(userId: string, workspaceId: string, data: unknown): void {
    this.clients.forEach((client) => {
      if (client.userId === userId) {
        this.sendToClient(client.ws, {
          type: 'workspace_created',
          workspaceId,
          data,
        });
      }
    });
    console.log(`[WorkspaceWS] Notified user ${userId} of workspace created: ${workspaceId}`);
  }

  /**
   * Notify subscribers that a workspace was updated
   */
  notifyWorkspaceUpdated(workspaceId: string, data: unknown): void {
    this.broadcastToWorkspace(workspaceId, {
      type: 'workspace_updated',
      workspaceId,
      data,
    });
    console.log(`[WorkspaceWS] Notified subscribers of workspace updated: ${workspaceId}`);
  }

  /**
   * Notify subscribers that a workspace was deleted
   */
  notifyWorkspaceDeleted(workspaceId: string): void {
    this.broadcastToWorkspace(workspaceId, {
      type: 'workspace_deleted',
      workspaceId,
    });
    console.log(`[WorkspaceWS] Notified subscribers of workspace deleted: ${workspaceId}`);
  }
}
