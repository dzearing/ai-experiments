import { Router, type Request, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const router = Router();

// Track active connections for cleanup
const activeConnections = new Map<string, { res: Response; heartbeat: NodeJS.Timeout }>();

/**
 * SSE streaming endpoint for agent messages.
 * For Phase 1, this returns test messages to verify the connection works.
 * Actual Agent SDK integration will be added in Phase 2.
 */
router.get('/stream', (req: Request, res: Response) => {
  const connectionId = uuidv4();
  const { prompt } = req.query as { prompt?: string };

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  // Send connection established message
  res.write(`data: ${JSON.stringify({
    type: 'connection',
    connectionId,
    timestamp: new Date().toISOString()
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

  // Send test messages if prompt provided (Phase 1 test behavior)
  if (prompt) {
    // Simulate streaming response with delays
    const messages = [
      { type: 'assistant', subtype: 'thinking', text: 'Processing your request...' },
      { type: 'assistant', subtype: 'text', text: `You said: "${prompt}"` },
      { type: 'assistant', subtype: 'text', text: 'This is a test response from the SSE endpoint.' },
      { type: 'result', subtype: 'success', is_error: false }
    ];

    let index = 0;

    const sendNextMessage = () => {
      if (index < messages.length) {
        try {
          res.write(`data: ${JSON.stringify(messages[index])}\n\n`);
          index++;

          if (index < messages.length) {
            setTimeout(sendNextMessage, 500);
          }
        } catch {
          // Connection closed
        }
      }
    };

    setTimeout(sendNextMessage, 100);
  }

  // Cleanup on connection close
  req.on('close', () => {
    const connection = activeConnections.get(connectionId);

    if (connection) {
      clearInterval(connection.heartbeat);
      activeConnections.delete(connectionId);
    }
    console.log(`SSE connection closed: ${connectionId}`);
  });
});

/**
 * Endpoint to get active connection count (for monitoring).
 */
router.get('/connections', (_req: Request, res: Response) => {
  res.json({
    activeConnections: activeConnections.size,
    connectionIds: Array.from(activeConnections.keys())
  });
});
