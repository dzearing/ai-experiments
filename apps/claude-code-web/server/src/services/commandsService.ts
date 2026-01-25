/**
 * CommandsService - Discovers and loads slash commands and skills from filesystem.
 *
 * Discovery paths:
 *   - Commands: ~/.claude/commands/ and {projectRoot}/.claude/commands/
 *   - Skills: ~/.claude/skills/ and {projectRoot}/.claude/skills/
 *
 * Precedence: Project scope overrides user scope for same-named commands (closer wins).
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import matter from 'gray-matter';
import { glob } from 'glob';

import type { CommandDefinition, CommandSource } from '../types/commands.js';

/**
 * Service for discovering and loading slash commands and skills.
 */
export class CommandsService {
  /**
   * Check if a file or directory exists.
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Extract first paragraph from markdown content as description fallback.
   * Truncates to 100 characters if longer.
   */
  private extractFirstParagraph(content: string): string {
    const lines = content.split('\n');
    const paragraphLines: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines at the start
      if (paragraphLines.length === 0 && trimmed === '') {
        continue;
      }

      // Skip heading lines
      if (trimmed.startsWith('#')) {
        continue;
      }

      // End of paragraph on empty line
      if (trimmed === '' && paragraphLines.length > 0) {
        break;
      }

      if (trimmed !== '') {
        paragraphLines.push(trimmed);
      }
    }

    const paragraph = paragraphLines.join(' ');

    if (paragraph.length > 100) {
      return paragraph.slice(0, 97) + '...';
    }

    return paragraph || 'No description available';
  }

  /**
   * Substitute argument placeholders in command content.
   *
   * - $1, $2, etc. are replaced with positional arguments
   * - $ARGUMENTS is replaced with the full arguments string
   * - If $ARGUMENTS wasn't in content and args is non-empty, appends "\n\nARGUMENTS: {args}"
   *
   * @param content - The command content with placeholders
   * @param args - The arguments string (space-separated)
   * @returns Content with placeholders substituted
   */
  substituteArguments(content: string, args: string): string {
    if (!args || args.trim() === '') {
      // No arguments - remove any $N placeholders, leave content otherwise unchanged
      return content.replace(/\$\d+/g, '');
    }

    const argParts = args.trim().split(/\s+/);
    let result = content;

    // Track if $ARGUMENTS was in the original content
    const hadArgumentsPlaceholder = content.includes('$ARGUMENTS');

    // Replace positional arguments $1, $2, etc.
    result = result.replace(/\$(\d+)/g, (_match, numStr) => {
      const index = parseInt(numStr, 10) - 1;

      if (index >= 0 && index < argParts.length) {
        return argParts[index];
      }

      // Missing positional arg - replace with empty string
      return '';
    });

    // Replace $ARGUMENTS with full args string
    result = result.replace(/\$ARGUMENTS/g, args.trim());

    // If $ARGUMENTS wasn't in the content, append ARGUMENTS section
    if (!hadArgumentsPlaceholder) {
      result += `\n\nARGUMENTS: ${args.trim()}`;
    }

    return result;
  }

  /**
   * Parse allowed-tools from frontmatter.
   * Can be a comma-separated string or an array.
   */
  private parseAllowedTools(value: unknown): string[] | undefined {
    if (!value) {
      return undefined;
    }

    if (Array.isArray(value)) {
      return value.map((v) => String(v).trim());
    }

    if (typeof value === 'string') {
      return value.split(/,\s*/).map((v) => v.trim());
    }

    return undefined;
  }

  /**
   * Load commands from a directory.
   * Each .md file becomes a command with the filename (sans .md) as the name.
   */
  private async loadFromDirectory(
    dir: string,
    source: CommandSource,
    type: 'command' | 'skill'
  ): Promise<CommandDefinition[]> {
    if (!(await this.fileExists(dir))) {
      return [];
    }

    const commands: CommandDefinition[] = [];

    try {
      const files = await glob('**/*.md', { cwd: dir });

      for (const file of files) {
        const filePath = path.join(dir, file);

        try {
          const rawContent = await fs.readFile(filePath, 'utf-8');
          const { data, content } = matter(rawContent);

          const name = path.basename(file, '.md');
          const description = data.description || this.extractFirstParagraph(content);

          commands.push({
            name,
            description,
            argumentHint: data['argument-hint'],
            model: data.model,
            allowedTools: this.parseAllowedTools(data['allowed-tools']),
            content: content.trim(),
            source,
            type,
            disableModelInvocation: data['disable-model-invocation'],
            userInvocable: data['user-invocable'] ?? true,
          });
        } catch (error) {
          console.warn(`[CommandsService] Failed to parse command file ${filePath}:`, error);
        }
      }
    } catch (error) {
      console.warn(`[CommandsService] Failed to load commands from ${dir}:`, error);
    }

    return commands;
  }

  /**
   * Load skills from a directory.
   * Each subdirectory with a SKILL.md becomes a skill with the directory name as the name.
   */
  private async loadSkillsFromDirectory(dir: string, source: CommandSource): Promise<CommandDefinition[]> {
    if (!(await this.fileExists(dir))) {
      return [];
    }

    const skills: CommandDefinition[] = [];

    try {
      // Look for */SKILL.md pattern
      const skillFiles = await glob('*/SKILL.md', { cwd: dir });

      for (const skillFile of skillFiles) {
        const filePath = path.join(dir, skillFile);
        const dirName = path.dirname(skillFile);

        try {
          const rawContent = await fs.readFile(filePath, 'utf-8');
          const { data, content } = matter(rawContent);

          // Name from frontmatter or directory name
          const name = data.name || dirName;
          const description = data.description || this.extractFirstParagraph(content);

          skills.push({
            name,
            description,
            argumentHint: data['argument-hint'],
            model: data.model,
            allowedTools: this.parseAllowedTools(data['allowed-tools']),
            content: content.trim(),
            source,
            type: 'skill',
            disableModelInvocation: data['disable-model-invocation'],
            userInvocable: data['user-invocable'] ?? true,
            context: data.context === 'fork' ? 'fork' : undefined,
          });
        } catch (error) {
          console.warn(`[CommandsService] Failed to parse skill file ${filePath}:`, error);
        }
      }
    } catch (error) {
      console.warn(`[CommandsService] Failed to load skills from ${dir}:`, error);
    }

    return skills;
  }

  /**
   * Load all commands and skills from filesystem.
   * Merges user and project scopes with project taking precedence.
   *
   * @param projectRoot - The project root directory
   * @returns Array of command definitions (project commands override user commands)
   */
  async loadCommands(projectRoot: string): Promise<CommandDefinition[]> {
    const commandMap = new Map<string, CommandDefinition>();

    // 1. Load from ~/.claude/commands/ (user scope - loaded first, can be overridden)
    const userCommandsDir = path.join(os.homedir(), '.claude', 'commands');
    const userCommands = await this.loadFromDirectory(userCommandsDir, 'user', 'command');

    for (const cmd of userCommands) {
      commandMap.set(cmd.name, cmd);
    }

    // 2. Load from {projectRoot}/.claude/commands/ (project scope - overrides user)
    const projectCommandsDir = path.join(projectRoot, '.claude', 'commands');
    const projectCommands = await this.loadFromDirectory(projectCommandsDir, 'project', 'command');

    for (const cmd of projectCommands) {
      commandMap.set(cmd.name, cmd);
    }

    // 3. Load from ~/.claude/skills/ (user scope - loaded first, can be overridden)
    const userSkillsDir = path.join(os.homedir(), '.claude', 'skills');
    const userSkills = await this.loadSkillsFromDirectory(userSkillsDir, 'user');

    for (const skill of userSkills) {
      commandMap.set(skill.name, skill);
    }

    // 4. Load from {projectRoot}/.claude/skills/ (project scope - overrides user)
    const projectSkillsDir = path.join(projectRoot, '.claude', 'skills');
    const projectSkills = await this.loadSkillsFromDirectory(projectSkillsDir, 'project');

    for (const skill of projectSkills) {
      commandMap.set(skill.name, skill);
    }

    return Array.from(commandMap.values());
  }
}

/**
 * Singleton instance of CommandsService.
 */
export const commandsService = new CommandsService();
