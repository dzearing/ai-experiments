/**
 * Generates and stores a unique client ID per browser tab/window.
 * Uses sessionStorage so each tab gets its own ID that persists
 * for the lifetime of that tab only.
 */

const CLIENT_ID_KEY = 'claude-code-web-client-id';

/**
 * Get the unique client ID for this browser tab/window.
 * Creates one if it doesn't exist.
 */
export function getClientId(): string {
  let clientId = sessionStorage.getItem(CLIENT_ID_KEY);

  if (!clientId) {
    clientId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    sessionStorage.setItem(CLIENT_ID_KEY, clientId);
  }

  return clientId;
}

/**
 * Clear the client ID (useful for testing or forced reset).
 */
export function clearClientId(): void {
  sessionStorage.removeItem(CLIENT_ID_KEY);
}
