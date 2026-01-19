import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { router as healthRouter } from './routes/health.js';
import { router as agentRouter } from './routes/agent.js';
import { checkClaudeAvailable } from './services/agentService.js';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/health', healthRouter);
app.use('/api/agent', agentRouter);

// Error handling middleware (Express 5 supports async errors natively)
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Startup
const claudeAvailable = checkClaudeAvailable();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Claude CLI available: ${claudeAvailable}`);
  if (!claudeAvailable) {
    console.warn('Warning: Claude CLI not found. Install with: npm install -g @anthropic-ai/claude-code');
  }
});
