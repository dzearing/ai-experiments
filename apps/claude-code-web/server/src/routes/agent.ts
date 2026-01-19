import { Router, type Request, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

import { streamAgentQuery } from '../services/agentService.js';

export const router = Router();

// Track active connections for cleanup
const activeConnections = new Map<string, { res: Response; heartbeat: NodeJS.Timeout }>();

/**
 * SSE streaming endpoint for agent messages.
 * Streams real Agent SDK messages to the client via Server-Sent Events.
 */
router.get('/stream', async (req: Request, res: Response) => {
  const connectionId = uuidv4();
  const { prompt, sessionId } = req.query as { prompt?: string; sessionId?: string };

  // Validate required prompt parameter before starting SSE
  if (!prompt) {
    res.status(400).json({
      error: 'Missing required parameter: prompt',
      code: 'MISSING_PROMPT',
    });

    return;
  }

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

  // Track connection
  activeConnections.set(connectionId, { res, heartbeat });

  // Stream SDK messages
  try {
    for await (const message of streamAgentQuery({ prompt, sessionId })) {
      try {
        res.write(`data: ${JSON.stringify(message)}\n\n`);

        // End stream on result message
        if (message.type === 'result') {
          cleanup(connectionId);
          res.end();

          return;
        }
      } catch {
        // Connection closed during streaming
        cleanup(connectionId);

        return;
      }
    }

    // Stream ended without result message (shouldn't happen normally)
    cleanup(connectionId);
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

    cleanup(connectionId);
    res.end();
  }

  // Cleanup on connection close
  req.on('close', () => {
    cleanup(connectionId);
    console.log(`SSE connection closed: ${connectionId}`);
  });
});

/**
 * Cleanup connection resources.
 */
function cleanup(connectionId: string): void {
  const connection = activeConnections.get(connectionId);

  if (connection) {
    clearInterval(connection.heartbeat);
    activeConnections.delete(connectionId);
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
