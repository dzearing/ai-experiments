#!/usr/bin/env node

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { PathResolver } from './tools/resolver.js';

interface AgentConfig {
  name: string;
  description?: string;
  initialization?: {
    cwd?: {
      type: 'reference' | 'path';
      value: string;
    };
  };
}

/**
 * Helper class for initializing agents with proper working directories
 */
export class AgentHelper {
  private pathResolver: PathResolver;

  constructor(workspacePath?: string) {
    this.pathResolver = new PathResolver(workspacePath);
  }

  /**
   * Initialize an agent with the configured working directory
   */
  async initializeAgent(configPath: string): Promise<void> {
    // Read agent configuration
    const configContent = await fs.readFile(configPath, 'utf-8');
    const config: AgentConfig = JSON.parse(configContent);

    console.log(`Initializing agent: ${config.name}`);

    // Determine initial working directory
    let initialCwd = process.cwd();

    if (config.initialization?.cwd) {
      const cwdConfig = config.initialization.cwd;

      if (cwdConfig.type === 'reference') {
        // Resolve the reference to a path
        const resolved = await this.pathResolver.resolveProjectPath(cwdConfig.value);

        if (resolved) {
          initialCwd = resolved.path;
          console.log(`Resolved CWD reference "${cwdConfig.value}" to: ${resolved.path}`);
        } else {
          console.warn(`Could not resolve CWD reference: ${cwdConfig.value}`);
          console.log('Using default CWD:', initialCwd);
        }
      } else if (cwdConfig.type === 'path') {
        // Use absolute path directly
        if (path.isAbsolute(cwdConfig.value)) {
          initialCwd = cwdConfig.value;
          console.log(`Using absolute CWD: ${initialCwd}`);
        } else {
          console.warn('CWD path must be absolute. Using default CWD:', initialCwd);
        }
      }
    }

    // Verify the directory exists
    try {
      await fs.access(initialCwd);
      process.chdir(initialCwd);
      console.log(`Changed working directory to: ${initialCwd}`);
    } catch (err) {
      console.error(`Could not change to directory: ${initialCwd}`);
      console.log('Using current directory:', process.cwd());
    }
  }

  /**
   * Launch an agent with MCP tools available
   */
  async launchAgent(configPath: string, command: string, args: string[] = []): Promise<void> {
    // Initialize the agent's working directory
    await this.initializeAgent(configPath);

    // Get the MCP server path
    const mcpServerPath = path.join(
      path.dirname(new URL(import.meta.url).pathname),
      'index.js'
    );

    // Set up environment with MCP server
    const env = {
      ...process.env,
      MCP_SERVERS: JSON.stringify({
        'workspace-tools': {
          command: 'node',
          args: [mcpServerPath],
          env: {
            WORKSPACE_PATH: process.env.WORKSPACE_PATH || path.join(process.env.HOME || '', 'workspace')
          }
        }
      })
    };

    // Launch the agent command
    console.log(`Launching: ${command} ${args.join(' ')}`);

    const child = spawn(command, args, {
      env,
      cwd: process.cwd(),
      stdio: 'inherit'
    });

    child.on('error', (error) => {
      console.error('Failed to launch agent:', error);
      process.exit(1);
    });

    child.on('exit', (code) => {
      process.exit(code || 0);
    });
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Usage: agent-helper <config.json> <command> [args...]');
    console.log('Example: agent-helper agent-config.json node agent.js');
    process.exit(1);
  }

  const [configPath, command, ...commandArgs] = args;
  const helper = new AgentHelper();

  helper.launchAgent(configPath, command, commandArgs).catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
}