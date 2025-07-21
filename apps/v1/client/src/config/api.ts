// API configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Helper function to construct API URLs
export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

// Helper function for SSE endpoints (which need full URL)
export function sseUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

// Helper function to make API calls with standard options
export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  return fetch(apiUrl(path), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
}
