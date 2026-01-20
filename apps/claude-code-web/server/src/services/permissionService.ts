import { v4 as uuidv4 } from 'uuid';

import type { PermissionResponse } from '../types/index.js';

/**
 * Result type returned to the SDK canUseTool callback.
 * Matches the SDK's expected CanUseToolResult type.
 */
export interface PermissionResult {
  behavior: 'allow' | 'deny';
  message?: string;
  updatedInput?: Record<string, unknown>;
}

/**
 * Represents a pending permission request waiting for user response.
 */
export interface PendingPermission {
  resolve: (result: PermissionResult) => void;
  reject: (error: Error) => void;
  toolName: string;
  input: Record<string, unknown>;
  timestamp: number;
  timeoutId: NodeJS.Timeout;
}

/**
 * Map of pending permission requests by requestId.
 */
const pendingPermissions = new Map<string, PendingPermission>();

/**
 * Create a permission request and return a promise that resolves when the user responds.
 *
 * @param toolName - Name of the tool requesting permission
 * @param input - Tool input parameters
 * @param signal - Optional abort signal for cancellation
 * @returns Object containing requestId and a promise that resolves with the permission result
 */
export function createPermissionRequest(
  toolName: string,
  input: Record<string, unknown>,
  signal?: AbortSignal
): { requestId: string; promise: Promise<PermissionResult> } {
  const requestId = uuidv4();
  const timestamp = Date.now();

  const promise = new Promise<PermissionResult>((resolve, reject) => {
    // Set 55s timeout (before SDK's 60s timeout)
    const timeoutId = setTimeout(() => {
      const pending = pendingPermissions.get(requestId);

      if (pending) {
        pendingPermissions.delete(requestId);
        resolve({
          behavior: 'deny',
          message: 'Permission request timed out',
        });
      }
    }, 55000);

    // Store the pending permission
    pendingPermissions.set(requestId, {
      resolve,
      reject,
      toolName,
      input,
      timestamp,
      timeoutId,
    });

    // Handle abort signal
    if (signal) {
      signal.addEventListener('abort', () => {
        const pending = pendingPermissions.get(requestId);

        if (pending) {
          clearTimeout(pending.timeoutId);
          pendingPermissions.delete(requestId);
          reject(new Error('Permission request aborted'));
        }
      }, { once: true });
    }
  });

  return { requestId, promise };
}

/**
 * Resolve a pending permission request with the user's response.
 *
 * @param requestId - ID of the permission request to resolve
 * @param response - User's response (behavior, message, updatedInput)
 * @returns Success or error object
 */
export function resolvePermission(
  requestId: string,
  response: Omit<PermissionResponse, 'requestId'>
): { success: true } | { error: string } {
  const pending = pendingPermissions.get(requestId);

  if (!pending) {
    return { error: 'Permission request not found or expired' };
  }

  // Clear timeout
  clearTimeout(pending.timeoutId);

  // Remove from map
  pendingPermissions.delete(requestId);

  // Resolve the promise with the permission result
  pending.resolve({
    behavior: response.behavior,
    message: response.message,
    updatedInput: response.updatedInput,
  });

  return { success: true };
}

/**
 * Get the count of pending permission requests.
 * Useful for monitoring and debugging.
 */
export function getPendingCount(): number {
  return pendingPermissions.size;
}
