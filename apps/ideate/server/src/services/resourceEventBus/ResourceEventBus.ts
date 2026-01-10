import type { Delta, DeltaBuffer } from '@claude-flow/data-bus/delta';
import {
  createDelta,
  createDeltaBuffer,
  addToDeltaBuffer,
  getDeltasSince,
} from '@claude-flow/data-bus/delta';
import type {
  ResourceEvent,
  ResourceEventCallback,
  ResourceType,
} from './types.js';

/**
 * Server-side event bus for publishing resource updates.
 * Tracks versions, generates deltas, and maintains a buffer for reconnection sync.
 */
export class ResourceEventBus {
  /** Current version per resource. */
  private versions: Map<string, number> = new Map();

  /** Delta buffer per resource for reconnection sync. */
  private deltaBuffers: Map<string, DeltaBuffer> = new Map();

  /** Subscribers per resource. */
  private subscribers: Map<string, Set<ResourceEventCallback>> = new Map();

  /** Last known state per resource (for delta generation). */
  private lastState: Map<string, unknown> = new Map();

  /** Global event listeners (called for ALL events). */
  private globalListeners: Set<ResourceEventCallback> = new Set();

  /**
   * Creates a resource key from type and id.
   */
  private getResourceKey(resourceType: ResourceType, resourceId: string): string {
    return `${resourceType}:${resourceId}`;
  }

  /**
   * Gets the current version for a resource.
   */
  getVersion(resourceType: ResourceType, resourceId: string): number {
    const key = this.getResourceKey(resourceType, resourceId);

    return this.versions.get(key) ?? 0;
  }

  /**
   * Sets the state and increments version for a resource.
   * Generates a delta from the previous state.
   */
  setState(
    resourceType: ResourceType,
    resourceId: string,
    newState: unknown,
    ownerId: string,
    workspaceId?: string,
  ): Delta | null {
    const key = this.getResourceKey(resourceType, resourceId);
    const oldState = this.lastState.get(key);
    const oldVersion = this.versions.get(key) ?? 0;
    const newVersion = oldVersion + 1;

    // Generate delta
    const delta = createDelta(oldState, newState, newVersion, oldVersion);

    // Skip if no changes
    if (delta.operations.length === 0) {
      return null;
    }

    // Update state
    this.versions.set(key, newVersion);
    this.lastState.set(key, newState);

    // Add to buffer
    let buffer = this.deltaBuffers.get(key);

    if (!buffer) {
      buffer = createDeltaBuffer(100);
      this.deltaBuffers.set(key, buffer);
    }

    addToDeltaBuffer(buffer, delta);

    // Publish event
    this.publish({
      resourceType,
      resourceId,
      workspaceId,
      ownerId,
      event: 'delta',
      version: newVersion,
      data: delta,
      timestamp: delta.timestamp,
    });

    return delta;
  }

  /**
   * Publishes a snapshot event (full state).
   * Used for initial subscription or when deltas are unavailable.
   */
  publishSnapshot(
    resourceType: ResourceType,
    resourceId: string,
    state: unknown,
    ownerId: string,
    workspaceId?: string,
  ): void {
    const key = this.getResourceKey(resourceType, resourceId);
    const version = this.versions.get(key) ?? 0;

    this.lastState.set(key, state);

    this.publish({
      resourceType,
      resourceId,
      workspaceId,
      ownerId,
      event: 'snapshot',
      version,
      data: state,
      timestamp: Date.now(),
    });
  }

  /**
   * Publishes a deletion event.
   */
  publishDeleted(
    resourceType: ResourceType,
    resourceId: string,
    ownerId: string,
    workspaceId?: string,
  ): void {
    const key = this.getResourceKey(resourceType, resourceId);

    // Clean up
    this.versions.delete(key);
    this.lastState.delete(key);
    this.deltaBuffers.delete(key);

    this.publish({
      resourceType,
      resourceId,
      workspaceId,
      ownerId,
      event: 'deleted',
      version: 0,
      data: null,
      timestamp: Date.now(),
    });
  }

  /**
   * Gets deltas since a given version for reconnection sync.
   * Returns null if version is too old (requires full snapshot).
   */
  getDeltasSince(
    resourceType: ResourceType,
    resourceId: string,
    sinceVersion: number,
  ): Delta[] | null {
    const key = this.getResourceKey(resourceType, resourceId);
    const buffer = this.deltaBuffers.get(key);

    if (!buffer) {
      return null;
    }

    return getDeltasSince(buffer, sinceVersion);
  }

  /**
   * Gets the current state for a resource.
   */
  getState(resourceType: ResourceType, resourceId: string): unknown {
    const key = this.getResourceKey(resourceType, resourceId);

    return this.lastState.get(key);
  }

  /**
   * Subscribes to events for a specific resource.
   */
  subscribe(
    resourceType: ResourceType,
    resourceId: string,
    callback: ResourceEventCallback,
  ): () => void {
    const key = this.getResourceKey(resourceType, resourceId);
    let callbacks = this.subscribers.get(key);

    if (!callbacks) {
      callbacks = new Set();
      this.subscribers.set(key, callbacks);
    }

    callbacks.add(callback);

    return () => {
      callbacks?.delete(callback);

      if (callbacks?.size === 0) {
        this.subscribers.delete(key);
      }
    };
  }

  /**
   * Publishes an event to all subscribers (resource-specific and global).
   */
  private publish(event: ResourceEvent): void {
    const key = this.getResourceKey(event.resourceType, event.resourceId);
    const callbacks = this.subscribers.get(key);

    // Notify resource-specific subscribers
    if (callbacks) {
      for (const callback of callbacks) {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in resource event callback:', error);
        }
      }
    }

    // Notify global listeners
    for (const listener of this.globalListeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in global resource event listener:', error);
      }
    }
  }

  /**
   * Adds a global event listener that receives ALL events.
   * Returns an unsubscribe function.
   */
  addGlobalListener(listener: ResourceEventCallback): () => void {
    this.globalListeners.add(listener);

    return () => {
      this.globalListeners.delete(listener);
    };
  }

  /**
   * Clears all state (for testing).
   */
  clear(): void {
    this.versions.clear();
    this.deltaBuffers.clear();
    this.subscribers.clear();
    this.lastState.clear();
    this.globalListeners.clear();
  }
}
