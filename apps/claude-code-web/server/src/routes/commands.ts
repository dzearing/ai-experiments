/**
 * Commands API routes.
 * Provides endpoint for discovering slash commands and skills.
 */

import { Router } from 'express';

import { configService } from '../services/configService.js';
import { commandsService } from '../services/commandsService.js';
import type { CommandSummary } from '../types/commands.js';

const router = Router();

/**
 * GET /api/commands
 *
 * Query params:
 *   - cwd: Working directory (required) - used to find project root
 *
 * Returns:
 *   - commands: Array of command summaries (name, description, argumentHint, source, type)
 */
router.get('/', async (req, res) => {
  const { cwd } = req.query as { cwd?: string };

  if (!cwd) {
    res.status(400).json({ error: 'Missing required parameter: cwd' });

    return;
  }

  try {
    const projectRoot = await configService.findProjectRoot(cwd);
    const commands = await commandsService.loadCommands(projectRoot);

    // Filter to user-invocable commands only
    const invocableCommands = commands.filter((c) => c.userInvocable !== false);

    // Map to summary format (excludes full content)
    const summaries: CommandSummary[] = invocableCommands.map((c) => ({
      name: c.name,
      description: c.description,
      argumentHint: c.argumentHint,
      source: c.source,
      type: c.type,
    }));

    res.json({ commands: summaries });
  } catch (error) {
    console.error('[CommandsRouter] Error loading commands:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * POST /api/commands/execute
 *
 * Body params:
 *   - command: Command name to execute (required)
 *   - args: Arguments string (optional)
 *   - cwd: Working directory (required) - used to find project root
 *
 * Returns:
 *   - content: Processed command content
 *   - allowedTools: Optional array of allowed tools
 *   - model: Optional model override
 */
router.post('/execute', async (req, res) => {
  const { command, args, cwd } = req.body as {
    command?: string;
    args?: string;
    cwd?: string;
  };

  if (!command) {
    res.status(400).json({ error: 'Missing required parameter: command' });

    return;
  }

  if (!cwd) {
    res.status(400).json({ error: 'Missing required parameter: cwd' });

    return;
  }

  try {
    const projectRoot = await configService.findProjectRoot(cwd);
    const result = await commandsService.processCommand(command, args || '', projectRoot);

    if (!result) {
      res.status(404).json({ error: `Unknown command: ${command}` });

      return;
    }

    res.json(result);
  } catch (error) {
    console.error('[CommandsRouter] Error executing command:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export const commandsRouter = router;
