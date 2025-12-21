/**
 * Application configuration
 * Uses environment variables when available, falls back to dynamic hostname detection
 */

const SERVER_PORT = 3002;

// Get the base URL for API requests
// In development, this allows connecting from other devices on the network
function getBaseUrl(): string {
  // Check for Vite environment variable first
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Use current hostname (works for localhost and LAN access)
  const hostname = window.location.hostname;
  return `http://${hostname}:${SERVER_PORT}`;
}

// Get the WebSocket URL
function getWsUrl(): string {
  // Check for Vite environment variable first
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }

  // Use current hostname with ws:// protocol
  const hostname = window.location.hostname;
  return `ws://${hostname}:${SERVER_PORT}`;
}

export const API_URL = getBaseUrl();
export const WS_URL = getWsUrl();

// Specific WebSocket endpoints
export const YJS_WS_URL = `${WS_URL}/yjs`;
export const DIAGNOSTICS_WS_URL = `${WS_URL}/diagnostics-ws`;
export const CHAT_WS_URL = `${WS_URL}/chat-ws`;
