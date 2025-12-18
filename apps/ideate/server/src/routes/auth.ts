import { Router, type Request, type Response } from 'express';
import { AuthService } from '../services/AuthService.js';

export const authRouter = Router();
const authService = new AuthService();

// Exchange Google token for session
authRouter.post('/google', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ error: 'Token is required' });
      return;
    }

    const session = await authService.validateGoogleToken(token);
    res.json(session);
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
});

// Get current user
authRouter.get('/me', async (req: Request, res: Response) => {
  try {
    const sessionId = req.headers.authorization?.replace('Bearer ', '');

    if (!sessionId) {
      res.status(401).json({ error: 'No session provided' });
      return;
    }

    const user = await authService.getUser(sessionId);

    if (!user) {
      res.status(401).json({ error: 'Invalid session' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Logout
authRouter.post('/logout', async (req: Request, res: Response) => {
  try {
    const sessionId = req.headers.authorization?.replace('Bearer ', '');

    if (sessionId) {
      await authService.invalidateSession(sessionId);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});
