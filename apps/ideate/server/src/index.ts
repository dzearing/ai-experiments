import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { config } from 'dotenv';

import { authRouter } from './routes/auth.js';
import { documentsRouter } from './routes/documents.js';
import { workspacesRouter } from './routes/workspaces.js';
import { CollaborationHandler } from './websocket/CollaborationHandler.js';
import { DiscoveryService } from './services/DiscoveryService.js';

// Load environment variables
config();

const PORT = process.env.PORT || 3002;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5190';

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: CLIENT_URL,
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

// Create HTTP server
const server = createServer(app);

// Create WebSocket server for collaboration
const wss = new WebSocketServer({ server, path: '/ws' });
const collaborationHandler = new CollaborationHandler();

wss.on('connection', (ws, req) => {
  collaborationHandler.handleConnection(ws, req);
});

// Initialize discovery service
const discoveryService = new DiscoveryService();

// Start server
server.listen(PORT, () => {
  console.log(`Ideate server running on http://localhost:${PORT}`);
  console.log(`WebSocket available at ws://localhost:${PORT}/ws`);

  // Start mDNS discovery
  discoveryService.start();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  discoveryService.stop();
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  discoveryService.stop();
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});
