import { Router, type Request, type Response } from 'express';
import { factsService } from '../services/FactsService.js';

export const factsRouter = Router();

/**
 * GET /api/facts
 * List all remembered facts for the current user
 */
factsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    const facts = await factsService.getFacts(userId);
    res.json(facts);
  } catch (error) {
    console.error('[Facts] Error listing facts:', error);
    res.status(500).json({ error: 'Failed to list facts' });
  }
});

/**
 * PUT /api/facts/:id
 * Update a remembered fact
 */
factsRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;
    const { subject, detail } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    // Validate at least one field to update
    if (subject === undefined && detail === undefined) {
      res.status(400).json({ error: 'Must provide subject or detail to update' });
      return;
    }

    const updates: { subject?: string; detail?: string } = {};

    if (subject !== undefined) updates.subject = subject;
    if (detail !== undefined) updates.detail = detail;

    const updated = await factsService.updateFact(userId, id, updates);

    if (!updated) {
      res.status(404).json({ error: 'Fact not found' });
      return;
    }

    res.json(updated);
  } catch (error) {
    console.error('[Facts] Error updating fact:', error);
    res.status(500).json({ error: 'Failed to update fact' });
  }
});

/**
 * DELETE /api/facts/:id
 * Delete a remembered fact
 */
factsRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    const deleted = await factsService.deleteFact(userId, id);

    if (!deleted) {
      res.status(404).json({ error: 'Fact not found' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[Facts] Error deleting fact:', error);
    res.status(500).json({ error: 'Failed to delete fact' });
  }
});
