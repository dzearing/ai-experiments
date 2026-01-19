export interface AgentQueryOptions {
  prompt: string;
  sessionId?: string;
  cwd?: string;
}

export interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  version: string;
  claudeAvailable?: boolean;
}
