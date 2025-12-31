import { Router, type Request, type Response } from 'express';
import type { YjsCollaborationHandler } from '../websocket/YjsCollaborationHandler.js';
import type { FacilitatorService } from '../services/FacilitatorService.js';
import {
  ClaudeDiagnosticsService,
  type SessionType,
} from '../services/ClaudeDiagnosticsService.js';

// Singleton instance for Claude diagnostics
let claudeDiagnosticsService: ClaudeDiagnosticsService | null = null;

/**
 * Get the Claude diagnostics service singleton
 */
export function getClaudeDiagnosticsService(): ClaudeDiagnosticsService {
  if (!claudeDiagnosticsService) {
    claudeDiagnosticsService = new ClaudeDiagnosticsService();
  }
  return claudeDiagnosticsService;
}

/**
 * Create diagnostics router with access to handlers.
 */
export function createDiagnosticsRouter(
  yjsHandler: YjsCollaborationHandler,
  facilitatorService?: FacilitatorService
): Router {
  const router = Router();

  // Initialize Claude diagnostics service with facilitator service reference
  const claudeService = getClaudeDiagnosticsService();
  if (facilitatorService) {
    claudeService.setFacilitatorService(facilitatorService);
  }

  /**
   * GET /api/diagnostics
   * Returns full diagnostic snapshot including rooms, clients, events, and stats.
   */
  router.get('/', (_req: Request, res: Response) => {
    try {
      const snapshot = yjsHandler.getDiagnosticSnapshot();
      res.json(snapshot);
    } catch (error) {
      console.error('Diagnostics error:', error);
      res.status(500).json({ error: 'Failed to get diagnostics' });
    }
  });

  /**
   * GET /api/diagnostics/rooms
   * Returns list of all active rooms with client counts.
   */
  router.get('/rooms', (_req: Request, res: Response) => {
    try {
      const rooms = yjsHandler.getRoomsData();
      res.json({
        count: rooms.length,
        rooms,
      });
    } catch (error) {
      console.error('Diagnostics rooms error:', error);
      res.status(500).json({ error: 'Failed to get rooms' });
    }
  });

  /**
   * GET /api/diagnostics/rooms/:roomId
   * Returns detailed information about a specific room.
   */
  router.get('/rooms/:roomId', (req: Request, res: Response) => {
    try {
      const { roomId } = req.params;
      const rooms = yjsHandler.getRoomsData();
      const room = rooms.find((r) => r.name === roomId);

      if (!room) {
        res.status(404).json({ error: 'Room not found' });
        return;
      }

      res.json(room);
    } catch (error) {
      console.error('Diagnostics room error:', error);
      res.status(500).json({ error: 'Failed to get room' });
    }
  });

  /**
   * GET /api/diagnostics/clients
   * Returns list of all connected clients.
   */
  router.get('/clients', (_req: Request, res: Response) => {
    try {
      const clients = yjsHandler.getClientsData();
      res.json({
        count: clients.length,
        clients,
      });
    } catch (error) {
      console.error('Diagnostics clients error:', error);
      res.status(500).json({ error: 'Failed to get clients' });
    }
  });

  /**
   * GET /api/diagnostics/events
   * Returns recent events, optionally filtered by type or room.
   * Query params:
   *   - type: Filter by event type (e.g., 'client_join', 'sync')
   *   - room: Filter by room name
   *   - limit: Max number of events (default: 200)
   */
  router.get('/events', (req: Request, res: Response) => {
    try {
      let events = yjsHandler.getEvents();
      const { type, room, limit } = req.query;

      // Filter by type
      if (typeof type === 'string') {
        events = events.filter((e) => e.type === type);
      }

      // Filter by room
      if (typeof room === 'string') {
        events = events.filter((e) => e.roomName === room);
      }

      // Limit results (default to all, max 200)
      const maxEvents = Math.min(parseInt(limit as string) || 200, 200);
      events = events.slice(-maxEvents);

      res.json({
        count: events.length,
        events,
      });
    } catch (error) {
      console.error('Diagnostics events error:', error);
      res.status(500).json({ error: 'Failed to get events' });
    }
  });

  /**
   * GET /api/diagnostics/stats
   * Returns quick stats (uptime, room count, client count, memory).
   */
  router.get('/stats', (_req: Request, res: Response) => {
    try {
      res.json({
        uptime: yjsHandler.getUptime(),
        roomCount: yjsHandler.getRoomCount(),
        clientCount: yjsHandler.getClientCount(),
        memoryUsage: process.memoryUsage(),
      });
    } catch (error) {
      console.error('Diagnostics stats error:', error);
      res.status(500).json({ error: 'Failed to get stats' });
    }
  });

  /**
   * GET /api/diagnostics/facilitator
   * Returns facilitator AI request history and diagnostics.
   */
  router.get('/facilitator', (_req: Request, res: Response) => {
    try {
      if (!facilitatorService) {
        res.status(501).json({ error: 'Facilitator service not available' });
        return;
      }
      const diagnostics = facilitatorService.getDiagnostics();
      res.json({
        count: diagnostics.length,
        entries: diagnostics,
      });
    } catch (error) {
      console.error('Diagnostics facilitator error:', error);
      res.status(500).json({ error: 'Failed to get facilitator diagnostics' });
    }
  });

  // ========== Claude Diagnostics Routes ==========

  /**
   * GET /api/diagnostics/claude/sessions
   * Returns all chat sessions from all 3 systems (facilitator, chatroom, ideaagent).
   */
  router.get('/claude/sessions', async (_req: Request, res: Response) => {
    try {
      const sessions = await claudeService.listAllSessions();
      res.json({
        count: sessions.length,
        sessions,
      });
    } catch (error) {
      console.error('Claude sessions error:', error);
      res.status(500).json({ error: 'Failed to get claude sessions' });
    }
  });

  /**
   * GET /api/diagnostics/claude/sessions/:type/:sessionId/messages
   * Returns messages for a specific session.
   * Query params:
   *   - limit: Max number of messages (default: 100)
   */
  router.get('/claude/sessions/:type/:sessionId/messages', async (req: Request, res: Response) => {
    try {
      const { type, sessionId } = req.params;
      const { limit } = req.query;

      // Validate session type
      const validTypes: SessionType[] = ['facilitator', 'chatroom', 'ideaagent'];
      if (!validTypes.includes(type as SessionType)) {
        res.status(400).json({ error: `Invalid session type. Must be one of: ${validTypes.join(', ')}` });
        return;
      }

      const maxMessages = Math.min(parseInt(limit as string) || 100, 500);
      const messages = await claudeService.getSessionMessages(type as SessionType, sessionId, maxMessages);

      res.json({
        count: messages.length,
        messages,
      });
    } catch (error) {
      console.error('Claude session messages error:', error);
      res.status(500).json({ error: 'Failed to get session messages' });
    }
  });

  /**
   * GET /api/diagnostics/claude/facilitator-diagnostics
   * Returns facilitator AI diagnostics (iterations, tool calls, durations).
   */
  router.get('/claude/facilitator-diagnostics', (_req: Request, res: Response) => {
    try {
      const diagnostics = claudeService.getFacilitatorDiagnostics();
      res.json({
        count: diagnostics.length,
        entries: diagnostics,
      });
    } catch (error) {
      console.error('Claude facilitator diagnostics error:', error);
      res.status(500).json({ error: 'Failed to get facilitator diagnostics' });
    }
  });

  return router;
}
