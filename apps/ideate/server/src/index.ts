import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { config } from 'dotenv';
import { join } from 'path';

import { authRouter } from './routes/auth.js';
import { documentsRouter } from './routes/documents.js';
import { workspacesRouter } from './routes/workspaces.js';
import { chatroomsRouter } from './routes/chatrooms.js';
import { createDiagnosticsRouter } from './routes/diagnostics.js';
import { CollaborationHandler } from './websocket/CollaborationHandler.js';
import { YjsCollaborationHandler } from './websocket/YjsCollaborationHandler.js';
import { DiagnosticsHandler } from './websocket/DiagnosticsHandler.js';
import { ChatWebSocketHandler } from './websocket/ChatWebSocketHandler.js';
import { DiscoveryService } from './services/DiscoveryService.js';
import { DocumentService } from './services/DocumentService.js';

// Load environment variables
config();

const PORT = process.env.PORT || 3002;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5190';

// Create Express app
const app = express();

// Middleware
// Allow CORS from any origin in development (for LAN access)
app.use(cors({
  origin: true, // Reflect the request origin
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/workspaces', workspacesRouter);
app.use('/api/chatrooms', chatroomsRouter);

// Create HTTP server
const server = createServer(app);

// Create WebSocket server for legacy collaboration (JSON-based protocol)
const wss = new WebSocketServer({ noServer: true });
const collaborationHandler = new CollaborationHandler();

wss.on('connection', (ws, req) => {
  collaborationHandler.handleConnection(ws, req);
});

// Document service for reading markdown files
const documentService = new DocumentService();

// Create WebSocket server for Yjs collaboration (binary protocol)
// y-websocket client connects here with room name in path: /yjs/room-name
const yjsWss = new WebSocketServer({ noServer: true });
const yjsHandler = new YjsCollaborationHandler({
  persistDir: join(process.cwd(), 'data', 'yjs-docs'),
  persistDebounceMs: 2000,
  onRoomCreated: (roomName) => {
    console.log(`[Yjs] Room created: ${roomName}`);
  },
  onRoomDestroyed: (roomName) => {
    console.log(`[Yjs] Room destroyed: ${roomName}`);
  },
  // Initialize new documents from their markdown content
  // This prevents duplication when multiple clients connect simultaneously
  getInitialContent: async (documentId: string) => {
    try {
      return await documentService.getDocumentContent(documentId);
    } catch {
      return null;
    }
  },
});

yjsWss.on('connection', (ws, req) => {
  yjsHandler.handleConnection(ws, req);
});

// Create WebSocket server for diagnostics (JSON-based protocol)
const diagnosticsWss = new WebSocketServer({ noServer: true });
const diagnosticsHandler = new DiagnosticsHandler(yjsHandler);

diagnosticsWss.on('connection', (ws, req) => {
  diagnosticsHandler.handleConnection(ws, req);
});

// Create WebSocket server for chat (JSON-based protocol)
const chatWss = new WebSocketServer({ noServer: true });
const chatHandler = new ChatWebSocketHandler();

chatWss.on('connection', (ws, req) => {
  chatHandler.handleConnection(ws, req);
});

// Mount diagnostics router (no auth required)
app.use('/api/diagnostics', createDiagnosticsRouter(yjsHandler));

// Session management endpoint - get or create a session with assigned color
app.post('/api/session', (req, res) => {
  const { sessionId } = req.body || {};
  const session = yjsHandler.getOrCreateSession(sessionId);
  res.json(session);
});

// Manual WebSocket upgrade handling to route to correct handler
server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url || '/', `http://${request.headers.host}`).pathname;

  if (pathname === '/ws') {
    // Legacy collaboration WebSocket
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else if (pathname.startsWith('/yjs')) {
    // Yjs collaboration WebSocket (supports /yjs or /yjs/room-name)
    yjsWss.handleUpgrade(request, socket, head, (ws) => {
      yjsWss.emit('connection', ws, request);
    });
  } else if (pathname === '/diagnostics-ws') {
    // Diagnostics WebSocket for real-time monitoring
    diagnosticsWss.handleUpgrade(request, socket, head, (ws) => {
      diagnosticsWss.emit('connection', ws, request);
    });
  } else if (pathname.startsWith('/chat-ws')) {
    // Chat WebSocket (supports /chat-ws/room-id)
    chatWss.handleUpgrade(request, socket, head, (ws) => {
      chatWss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

// Initialize discovery service
const discoveryService = new DiscoveryService();

// Start server
server.listen(PORT, () => {
  console.log(`Ideate server running on http://localhost:${PORT}`);
  console.log(`WebSocket (legacy) available at ws://localhost:${PORT}/ws`);
  console.log(`WebSocket (Yjs) available at ws://localhost:${PORT}/yjs`);
  console.log(`WebSocket (Chat) available at ws://localhost:${PORT}/chat-ws`);
  console.log(`Diagnostics API at http://localhost:${PORT}/api/diagnostics`);
  console.log(`Diagnostics WebSocket at ws://localhost:${PORT}/diagnostics-ws`);

  // Start mDNS discovery
  discoveryService.start();
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  console.log(`${signal} received. Shutting down gracefully...`);

  // Stop mDNS discovery
  discoveryService.stop();

  // Persist and cleanup Yjs handler
  await yjsHandler.destroy();

  // Close server
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
