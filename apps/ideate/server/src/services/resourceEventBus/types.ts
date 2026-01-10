/**
 * Types for the resource event bus system.
 */

export type ResourceType = 'idea' | 'thing' | 'document';

export type EventType = 'snapshot' | 'delta' | 'deleted';

/**
 * A resource event that can be published to subscribers.
 */
export interface ResourceEvent {
  /** Type of resource (idea, thing, document). */
  resourceType: ResourceType;

  /** Unique identifier of the resource. */
  resourceId: string;

  /** Workspace the resource belongs to (optional for user-scoped). */
  workspaceId?: string;

  /** Owner of the resource. */
  ownerId: string;

  /** Type of event. */
  event: EventType;

  /** Version number after this event. */
  version: number;

  /** Event payload (snapshot data or delta operations). */
  data: unknown;

  /** When the event was created. */
  timestamp: number;
}

/**
 * Callback for resource event subscribers.
 */
export type ResourceEventCallback = (event: ResourceEvent) => void;

/**
 * Subscription info for cleanup.
 */
export interface ResourceSubscription {
  resourceType: ResourceType;
  resourceId: string;
  callback: ResourceEventCallback;
}
