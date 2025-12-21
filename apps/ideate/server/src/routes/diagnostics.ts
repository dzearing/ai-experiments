import { Router, type Request, type Response } from 'express';
import type { YjsCollaborationHandler } from '../websocket/YjsCollaborationHandler.js';

/**
 * Create diagnostics router with access to the Yjs handler.
 */
export function createDiagnosticsRouter(yjsHandler: YjsCollaborationHandler): Router {
  const router = Router();

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

  return router;
}
