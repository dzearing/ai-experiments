import { Router } from 'express';
import type { DiscoveredCommand } from '@ui-kit/react-chat';
import {
  discoverAllCommands,
  readCommandContent,
} from '@ui-kit/react-chat/services/claudeCode';

const router = Router();

/**
 * GET /api/claude-code/commands
 * Discover all Claude Code plugin commands available on the server
 */
router.get('/commands', async (req, res) => {
  try {
    const workingDir = req.query.workingDir as string | undefined;
    const commands = await discoverAllCommands(workingDir);

    res.json({ commands });
  } catch (error) {
    console.error('[Claude Code] Failed to discover commands:', error);
    res.status(500).json({
      error: 'Failed to discover commands',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/claude-code/commands/:name/content
 * Get the content of a specific command
 */
router.get('/commands/:name/content', async (req, res) => {
  try {
    const { name } = req.params;
    const workingDir = req.query.workingDir as string | undefined;

    // First discover to find the command
    const commands = await discoverAllCommands(workingDir);
    const command = commands.find(cmd => {
      const prefixedName = cmd.pluginName ? `${cmd.pluginName}:${cmd.name}` : cmd.name;

      return prefixedName === name || cmd.name === name;
    });

    if (!command) {
      res.status(404).json({ error: 'Command not found' });

      return;
    }

    const content = await readCommandContent(command);

    if (!content) {
      res.status(404).json({ error: 'Command content not found' });

      return;
    }

    res.json({ command, content });
  } catch (error) {
    console.error('[Claude Code] Failed to read command content:', error);
    res.status(500).json({
      error: 'Failed to read command content',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Response type for commands endpoint
 */
export interface DiscoverCommandsResponse {
  commands: DiscoveredCommand[];
}

/**
 * Response type for command content endpoint
 */
export interface CommandContentResponse {
  command: DiscoveredCommand;
  content: string;
}

export { router as claudeCodeRouter };
