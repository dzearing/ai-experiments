import { execSync } from 'child_process';

import type { AgentQueryOptions } from '../types/index.js';

/**
 * Check if Claude CLI is available on the system.
 * Returns true if claude command is found, false otherwise.
 */
export function checkClaudeAvailable(): boolean {
  try {
    execSync('which claude', { encoding: 'utf8', stdio: 'pipe' });

    return true;
  } catch {
    return false;
  }
}

/**
 * Placeholder for Agent SDK query function.
 * Will be implemented in Plan 01-03 when SSE streaming is added.
 */
export async function* queryAgent(
  _options: AgentQueryOptions
): AsyncGenerator<unknown> {
  // Placeholder - actual implementation in Plan 01-03
  yield { type: 'placeholder', message: 'Agent SDK streaming not yet implemented' };
}
