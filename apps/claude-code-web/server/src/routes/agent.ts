import { Router, type Request, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

import { streamAgentQuery, registerConnection, unregisterConnection } from '../services/agentService.js';
import { resolvePermission } from '../services/permissionService.js';
import { configService } from '../services/configService.js';
import type { PermissionMode, PermissionResponse, QuestionResponse } from '../types/index.js';

export const router = Router();

// Track active connections for cleanup
const activeConnections = new Map<string, { res: Response; heartbeat: NodeJS.Timeout }>();

// Track session permission modes
const sessionModes = new Map<string, PermissionMode>();

/**
 * Get the permission mode for a session.
 * Returns 'default' if no mode has been set.
 */
export function getSessionMode(sessionId: string): PermissionMode {
  return sessionModes.get(sessionId) ?? 'default';
}

/**
 * Set the permission mode for a session.
 */
export function setSessionMode(sessionId: string, mode: PermissionMode): void {
  sessionModes.set(sessionId, mode);
}

/**
 * SSE streaming endpoint for agent messages.
 * Streams real Agent SDK messages to the client via Server-Sent Events.
 */
router.get('/stream', async (req: Request, res: Response) => {
  const connectionId = uuidv4();
  const { prompt, sessionId, permissionMode: modeParam, cwd } = req.query as {
    prompt?: string;
    sessionId?: string;
    permissionMode?: string;
    cwd?: string;
  };

  // Validate required prompt parameter before starting SSE
  if (!prompt) {
    res.status(400).json({
      error: 'Missing required parameter: prompt',
      code: 'MISSING_PROMPT',
    });

    return;
  }

  // Validate cwd if provided - must be an absolute path
  let workingDirectory = cwd;

  if (cwd) {
    if (!path.isAbsolute(cwd)) {
      res.status(400).json({
        error: 'cwd must be an absolute path',
        code: 'INVALID_CWD',
      });

      return;
    }
  }

  // Validate and parse permission mode
  const validModes = ['default', 'plan', 'acceptEdits', 'bypassPermissions'];
  const permissionMode: PermissionMode = (modeParam && validModes.includes(modeParam))
    ? modeParam as PermissionMode
    : 'default';

  // Connection tracking ID - use provided sessionId if valid, otherwise use connectionId
  // This is for SSE event routing, not SDK resume
  const connectionTrackingId = sessionId || connectionId;

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  // Send connection established message
  res.write(`data: ${JSON.stringify({
    type: 'connection',
    connectionId,
    sessionId: connectionTrackingId,
    permissionMode,
    timestamp: new Date().toISOString(),
  })}\n\n`);

  // Set up heartbeat to keep connection alive
  const heartbeat = setInterval(() => {
    try {
      res.write(':heartbeat\n\n');
    } catch {
      // Connection closed, cleanup will happen in close handler
      clearInterval(heartbeat);
    }
  }, 30000);

  // Track connection for both local cleanup and permission events
  activeConnections.set(connectionId, { res, heartbeat });
  registerConnection(connectionTrackingId, res);

  // Stream SDK messages
  // Pass original sessionId for SDK resume (may be empty for new conversations)
  // Use connectionTrackingId for permission event routing
  try {
    for await (const message of streamAgentQuery({
      prompt,
      sessionId: sessionId || undefined,  // Only pass if client provided one
      connectionId: connectionTrackingId,  // For permission event routing
      permissionMode,
      cwd: workingDirectory,  // Pass working directory for configuration loading
    })) {
      try {
        res.write(`data: ${JSON.stringify(message)}\n\n`);

        // End stream on result message
        if (message.type === 'result') {
          cleanup(connectionId, connectionTrackingId);
          res.end();

          return;
        }
      } catch {
        // Connection closed during streaming
        cleanup(connectionId, connectionTrackingId);

        return;
      }
    }

    // Stream ended without result message (shouldn't happen normally)
    cleanup(connectionId, connectionTrackingId);
    res.end();
  } catch (error) {
    // Error during streaming
    try {
      res.write(`data: ${JSON.stringify({
        type: 'error',
        error: error instanceof Error ? error.message : String(error),
      })}\n\n`);
    } catch {
      // Connection already closed
    }

    cleanup(connectionId, connectionTrackingId);
    res.end();
  }

  // Cleanup on connection close
  req.on('close', () => {
    cleanup(connectionId, connectionTrackingId);
    console.log(`SSE connection closed: ${connectionId}`);
  });
});

/**
 * Cleanup connection resources.
 */
function cleanup(connectionId: string, sessionId?: string): void {
  const connection = activeConnections.get(connectionId);

  if (connection) {
    clearInterval(connection.heartbeat);
    activeConnections.delete(connectionId);
  }

  if (sessionId) {
    unregisterConnection(sessionId);
    sessionModes.delete(sessionId);
  }
}

/**
 * Endpoint to get active connection count (for monitoring).
 */
router.get('/connections', (_req: Request, res: Response) => {
  res.json({
    activeConnections: activeConnections.size,
    connectionIds: Array.from(activeConnections.keys())
  });
});

/**
 * Permission response endpoint.
 * Called by client when user approves or denies a permission request.
 */
router.post('/permission-response', (req: Request, res: Response) => {
  const { requestId, behavior, message, updatedInput } = req.body as Partial<PermissionResponse>;

  console.log('[permission-response] Received:', { requestId, behavior, message, updatedInput });

  if (!requestId) {
    res.status(400).json({
      error: 'Missing required field: requestId',
      code: 'MISSING_REQUEST_ID',
    });

    return;
  }

  if (!behavior || !['allow', 'deny'].includes(behavior)) {
    res.status(400).json({
      error: 'Invalid or missing behavior field. Must be "allow" or "deny"',
      code: 'INVALID_BEHAVIOR',
    });

    return;
  }

  const result = resolvePermission(requestId, { behavior, message, updatedInput });

  if ('error' in result) {
    res.status(404).json({
      error: result.error,
      code: 'PERMISSION_NOT_FOUND',
    });

    return;
  }

  res.json({ success: true });
});

/**
 * Question response endpoint.
 * Called by client when user answers an AskUserQuestion prompt.
 */
router.post('/question-response', (req: Request, res: Response) => {
  const { requestId, answers } = req.body as Partial<QuestionResponse>;

  if (!requestId) {
    res.status(400).json({
      error: 'Missing required field: requestId',
      code: 'MISSING_REQUEST_ID',
    });

    return;
  }

  if (!answers || typeof answers !== 'object') {
    res.status(400).json({
      error: 'Invalid or missing answers field. Must be an object',
      code: 'INVALID_ANSWERS',
    });

    return;
  }

  // Question responses are treated as allow with the answers as updated input
  const result = resolvePermission(requestId, {
    behavior: 'allow',
    updatedInput: { answers },
  });

  if ('error' in result) {
    res.status(404).json({
      error: result.error,
      code: 'QUESTION_NOT_FOUND',
    });

    return;
  }

  res.json({ success: true });
});

/**
 * Mode change endpoint.
 * Called by client to change the permission mode mid-session.
 */
router.post('/mode', (req: Request, res: Response) => {
  const { sessionId, mode } = req.body as { sessionId?: string; mode?: string };

  if (!sessionId) {
    res.status(400).json({
      error: 'Missing required field: sessionId',
      code: 'MISSING_SESSION_ID',
    });

    return;
  }

  const validModes: PermissionMode[] = ['default', 'plan', 'acceptEdits', 'bypassPermissions'];

  if (!mode || !validModes.includes(mode as PermissionMode)) {
    res.status(400).json({
      error: 'Invalid or missing mode field',
      code: 'INVALID_MODE',
      validModes,
    });

    return;
  }

  setSessionMode(sessionId, mode as PermissionMode);

  res.json({ success: true, mode });
});

/**
 * Configuration debug endpoint.
 * Returns information about the loaded configuration for a working directory.
 */
router.get('/config', async (req: Request, res: Response) => {
  const { cwd } = req.query as { cwd?: string };

  if (!cwd) {
    res.status(400).json({
      error: 'Missing required parameter: cwd',
      code: 'MISSING_CWD',
    });

    return;
  }

  try {
    const config = await configService.loadConfig(cwd);

    res.json({
      projectRoot: config.projectRoot,
      cwd: config.cwd,
      hasSystemPrompt: config.systemPrompt.length > 0,
      systemPromptLength: config.systemPrompt.length,
      settingsKeys: Object.keys(config.settings),
      rulesCount: config.rules.length,
      envKeys: Object.keys(config.env),
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
      code: 'CONFIG_LOAD_ERROR',
    });
  }
});
