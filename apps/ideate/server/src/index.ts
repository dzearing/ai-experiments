import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { config } from 'dotenv';
import { join } from 'path';

import { authRouter } from './routes/auth.js';
import { documentsRouter, setWorkspaceHandler as setDocumentsWorkspaceHandler } from './routes/documents.js';
import { workspacesRouter, setWorkspaceHandler as setWorkspacesWsHandler } from './routes/workspaces.js';
import { chatroomsRouter, setWorkspaceHandler as setChatroomsWorkspaceHandler } from './routes/chatrooms.js';
import { personasRouter } from './routes/personas.js';
import { ideasRouter, setIdeasWorkspaceHandler, setIdeasAgentHandler } from './routes/ideas.js';
import { topicsRouter, setTopicsWorkspaceHandler } from './routes/topics.js';
import { fsRouter } from './routes/fs.js';
import { factsRouter } from './routes/facts.js';
import { setWorkspaceHandler as setMCPToolsWorkspaceHandler } from './services/MCPToolsService.js';
import { createDiagnosticsRouter } from './routes/diagnostics.js';
import { YjsCollaborationHandler } from './websocket/YjsCollaborationHandler.js';
import { DiagnosticsHandler } from './websocket/DiagnosticsHandler.js';
import { ClaudeDiagnosticsHandler } from './websocket/ClaudeDiagnosticsHandler.js';
import { ChatWebSocketHandler } from './websocket/ChatWebSocketHandler.js';
import { WorkspaceWebSocketHandler } from './websocket/WorkspaceWebSocketHandler.js';
import { FacilitatorWebSocketHandler } from './websocket/FacilitatorWebSocketHandler.js';
import { IdeaAgentWebSocketHandler } from './websocket/IdeaAgentWebSocketHandler.js';
import { PlanAgentWebSocketHandler } from './websocket/PlanAgentWebSocketHandler.js';
import { ExecutionAgentWebSocketHandler } from './websocket/ExecutionAgentWebSocketHandler.js';
import { ImportWebSocketHandler } from './websocket/ImportWebSocketHandler.js';
import { DiscoveryService } from './services/DiscoveryService.js';
import { DocumentService } from './services/DocumentService.js';
import { IdeaService } from './services/IdeaService.js';
import { ResourceEventBus } from './services/resourceEventBus/ResourceEventBus.js';
import { registerBuiltInCommands } from './commands/index.js';

// Load environment variables
config();

// Register slash commands
registerBuiltInCommands();

const PORT = process.env.PORT || 3002;

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
app.use('/api/personas', personasRouter);
app.use('/api/ideas', ideasRouter);
app.use('/api/topics', topicsRouter);
app.use('/api/fs', fsRouter);
app.use('/api/facts', factsRouter);

// Create HTTP server
const server = createServer(app);

// Document service for reading markdown files
const documentService = new DocumentService();
// Idea service for reading ideas (including description for Yjs initialization)
const ideaService = new IdeaService();

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
      // Handle idea documents: idea-doc-{ideaId}
      if (documentId.startsWith('idea-doc-') && !documentId.startsWith('idea-doc-new-')) {
        const ideaId = documentId.replace('idea-doc-', '');
        // Use internal method to get idea without auth check (server-side initialization)
        const idea = await ideaService.getIdeaInternal(ideaId);
        if (idea) {
          // Also get the description
          const fullIdea = await ideaService.getIdeaByIdNoAuth(ideaId);
          if (fullIdea) {
            // Build markdown from idea data
            const parts: string[] = [];
            parts.push(`# ${fullIdea.title || 'Untitled Idea'}`);
            parts.push('');
            parts.push('## Summary');
            parts.push(fullIdea.summary || '_Add a brief summary of your idea..._');
            parts.push('');
            if (fullIdea.tags && fullIdea.tags.length > 0) {
              parts.push(`Tags: ${fullIdea.tags.join(', ')}`);
            } else {
              parts.push('Tags: _none_');
            }
            parts.push('');
            parts.push('---');
            parts.push('');
            parts.push(fullIdea.description || '_Describe your idea in detail..._');
            return parts.join('\n');
          }
        }
        return null;
      }

      // Fall back to document service for regular documents
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

// Create WebSocket server for Claude diagnostics (JSON-based protocol)
const claudeDiagnosticsWss = new WebSocketServer({ noServer: true });
const claudeDiagnosticsHandler = new ClaudeDiagnosticsHandler();

claudeDiagnosticsWss.on('connection', (ws, req) => {
  claudeDiagnosticsHandler.handleConnection(ws, req);
});

// Create WebSocket server for chat (JSON-based protocol)
const chatWss = new WebSocketServer({ noServer: true });
const chatHandler = new ChatWebSocketHandler();

chatWss.on('connection', (ws, req) => {
  chatHandler.handleConnection(ws, req);
});

// Create ResourceEventBus for real-time resource updates
const resourceEventBus = new ResourceEventBus();

// Create WebSocket server for workspace updates (JSON-based protocol)
const workspaceWss = new WebSocketServer({ noServer: true });
const workspaceHandler = new WorkspaceWebSocketHandler();

// Wire up ResourceEventBus to WorkspaceWebSocketHandler
// This allows metadata updates to be broadcast to subscribed clients
resourceEventBus.addGlobalListener((event) => {
  workspaceHandler.handleResourceEvent(event);
});

workspaceWss.on('connection', (ws, req) => {
  workspaceHandler.handleConnection(ws, req);
});

// Create WebSocket server for facilitator chat (JSON-based protocol)
const facilitatorWss = new WebSocketServer({ noServer: true });
const facilitatorHandler = new FacilitatorWebSocketHandler();

facilitatorWss.on('connection', (ws, req) => {
  facilitatorHandler.handleConnection(ws, req);
});

// Create WebSocket server for idea agent chat (JSON-based protocol)
const ideaAgentWss = new WebSocketServer({ noServer: true });
const ideaAgentHandler = new IdeaAgentWebSocketHandler(yjsHandler, workspaceHandler, resourceEventBus, ideaService);

ideaAgentWss.on('connection', (ws, req) => {
  ideaAgentHandler.handleConnection(ws, req);
});

// Create WebSocket server for import agent (JSON-based protocol)
const importWss = new WebSocketServer({ noServer: true });
const importHandler = new ImportWebSocketHandler();

importWss.on('connection', (ws, req) => {
  importHandler.handleConnection(ws, req);
});

// Create WebSocket server for plan agent chat (JSON-based protocol)
const planAgentWss = new WebSocketServer({ noServer: true });
const planAgentHandler = new PlanAgentWebSocketHandler(yjsHandler, workspaceHandler);

planAgentWss.on('connection', (ws, req) => {
  planAgentHandler.handleConnection(ws, req);
});

// Create WebSocket server for execution agent (JSON-based protocol)
const executionAgentWss = new WebSocketServer({ noServer: true });
const executionAgentHandler = new ExecutionAgentWebSocketHandler(ideaService, workspaceHandler);

executionAgentWss.on('connection', (ws, req) => {
  executionAgentHandler.handleConnection(ws, req);
});

// Export workspace handler for use in routes
export { workspaceHandler };

// Wire up workspace handler to routes and services for real-time notifications
setDocumentsWorkspaceHandler(workspaceHandler);
setChatroomsWorkspaceHandler(workspaceHandler);
setMCPToolsWorkspaceHandler(workspaceHandler);
setWorkspacesWsHandler(workspaceHandler);
setIdeasWorkspaceHandler(workspaceHandler);
setIdeasAgentHandler(ideaAgentHandler);
setTopicsWorkspaceHandler(workspaceHandler);

// Mount diagnostics router (no auth required)
app.use('/api/diagnostics', createDiagnosticsRouter(yjsHandler, facilitatorHandler.getService()));

// Session management endpoint - get or create a session with assigned color
app.post('/api/session', (req, res) => {
  const { sessionId } = req.body || {};
  const session = yjsHandler.getOrCreateSession(sessionId);
  res.json(session);
});

// Client logging endpoint - merges client logs into server console for unified debugging
app.post('/api/log', (req, res) => {
  const { logs } = req.body || {};

  if (Array.isArray(logs)) {
    for (const entry of logs) {
      const { level, tag, message, data, timestamp } = entry;
      const time = timestamp ? new Date(timestamp).toISOString().slice(11, 23) : '';
      const dataStr = data ? ` ${JSON.stringify(data)}` : '';
      const logLine = `[Client ${time}] [${tag}] ${message}${dataStr}`;

      switch (level) {
        case 'error':
          console.error(logLine);
          break;
        case 'warn':
          console.warn(logLine);
          break;
        default:
          console.log(logLine);
      }
    }
  }

  res.status(204).send();
});

// Manual WebSocket upgrade handling to route to correct handler
server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url || '/', `http://${request.headers.host}`).pathname;

  if (pathname.startsWith('/yjs')) {
    // Yjs collaboration WebSocket (supports /yjs or /yjs/room-name)
    yjsWss.handleUpgrade(request, socket, head, (ws) => {
      yjsWss.emit('connection', ws, request);
    });
  } else if (pathname === '/diagnostics-ws') {
    // Diagnostics WebSocket for real-time monitoring
    diagnosticsWss.handleUpgrade(request, socket, head, (ws) => {
      diagnosticsWss.emit('connection', ws, request);
    });
  } else if (pathname === '/claude-diagnostics-ws') {
    // Claude diagnostics WebSocket for chat session monitoring
    claudeDiagnosticsWss.handleUpgrade(request, socket, head, (ws) => {
      claudeDiagnosticsWss.emit('connection', ws, request);
    });
  } else if (pathname.startsWith('/chat-ws')) {
    // Chat WebSocket (supports /chat-ws/room-id)
    chatWss.handleUpgrade(request, socket, head, (ws) => {
      chatWss.emit('connection', ws, request);
    });
  } else if (pathname === '/workspace-ws') {
    // Workspace updates WebSocket
    workspaceWss.handleUpgrade(request, socket, head, (ws) => {
      workspaceWss.emit('connection', ws, request);
    });
  } else if (pathname === '/facilitator-ws') {
    // Facilitator chat WebSocket
    facilitatorWss.handleUpgrade(request, socket, head, (ws) => {
      facilitatorWss.emit('connection', ws, request);
    });
  } else if (pathname === '/idea-agent-ws') {
    // Idea agent chat WebSocket
    ideaAgentWss.handleUpgrade(request, socket, head, (ws) => {
      ideaAgentWss.emit('connection', ws, request);
    });
  } else if (pathname === '/import-ws') {
    // Import agent WebSocket
    importWss.handleUpgrade(request, socket, head, (ws) => {
      importWss.emit('connection', ws, request);
    });
  } else if (pathname === '/plan-agent-ws') {
    // Plan agent chat WebSocket
    planAgentWss.handleUpgrade(request, socket, head, (ws) => {
      planAgentWss.emit('connection', ws, request);
    });
  } else if (pathname === '/execution-agent-ws') {
    // Execution agent WebSocket
    executionAgentWss.handleUpgrade(request, socket, head, (ws) => {
      executionAgentWss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

// Initialize discovery service
const discoveryService = new DiscoveryService();

// Start server
server.listen(PORT, async () => {
  console.log(`Ideate server running on http://localhost:${PORT}`);
  console.log(`WebSocket (Yjs) available at ws://localhost:${PORT}/yjs`);
  console.log(`WebSocket (Chat) available at ws://localhost:${PORT}/chat-ws`);
  console.log(`WebSocket (Workspace) available at ws://localhost:${PORT}/workspace-ws`);
  console.log(`WebSocket (Facilitator) available at ws://localhost:${PORT}/facilitator-ws`);
  console.log(`WebSocket (IdeaAgent) available at ws://localhost:${PORT}/idea-agent-ws`);
  console.log(`WebSocket (Import) available at ws://localhost:${PORT}/import-ws`);
  console.log(`WebSocket (PlanAgent) available at ws://localhost:${PORT}/plan-agent-ws`);
  console.log(`WebSocket (ExecutionAgent) available at ws://localhost:${PORT}/execution-agent-ws`);
  console.log(`Diagnostics API at http://localhost:${PORT}/api/diagnostics`);
  console.log(`Diagnostics WebSocket at ws://localhost:${PORT}/diagnostics-ws`);
  console.log(`Claude Diagnostics WebSocket at ws://localhost:${PORT}/claude-diagnostics-ws`);

  // Start mDNS discovery
  discoveryService.start();

  // Initialize idea agent (pre-generate greetings for instant response)
  console.log('[Startup] Initializing Idea Agent greeting cache...');
  try {
    await ideaAgentHandler.initialize();
    console.log('[Startup] Idea Agent greeting cache ready');
  } catch (error) {
    console.error('[Startup] Failed to initialize Idea Agent greetings:', error);
  }
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
