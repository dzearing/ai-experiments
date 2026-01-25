import * as fs from 'fs/promises';
import * as path from 'path';

import type { CommandFrontmatter, DiscoveredCommand } from './types';

/**
 * Parse YAML frontmatter from markdown content
 */
function parseFrontmatter(content: string): {
  frontmatter: CommandFrontmatter;
  body: string;
} {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);

  if (!frontmatterMatch) {
    return { frontmatter: {}, body: content };
  }

  const [, yamlContent, body] = frontmatterMatch;
  const frontmatter: CommandFrontmatter = {};

  // Simple YAML parsing for common fields
  const lines = yamlContent.split('\n');

  for (const line of lines) {
    const match = line.match(/^(\S+):\s*(.*)$/);

    if (match) {
      const [, key, value] = match;

      (frontmatter as Record<string, string>)[key] = value.trim();
    }
  }

  return { frontmatter, body: body.trim() };
}

/**
 * Extract description from command content
 * Falls back to first line or paragraph if no frontmatter description
 */
function extractDescription(content: string, frontmatter: CommandFrontmatter): string {
  if (frontmatter.description) {
    return frontmatter.description;
  }

  // Remove frontmatter and get first meaningful line
  const { body } = parseFrontmatter(content);
  const firstLine = body.split('\n').find(line =>
    line.trim() && !line.startsWith('#') && !line.startsWith('!')
  );

  if (firstLine) {
    // Truncate to reasonable length
    return firstLine.length > 100 ? firstLine.slice(0, 97) + '...' : firstLine;
  }

  return 'No description available';
}

/**
 * Parse a command markdown file
 */
export async function parseCommandFile(
  filePath: string,
  source: DiscoveredCommand['source'],
  pluginName?: string
): Promise<DiscoveredCommand | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const { frontmatter } = parseFrontmatter(content);

    const fileName = path.basename(filePath, '.md');
    const description = extractDescription(content, frontmatter);

    return {
      name: fileName,
      description,
      source,
      pluginName,
      filePath,
      usage: frontmatter['argument-hint']
        ? `/${fileName} ${frontmatter['argument-hint']}`
        : undefined,
      isSkill: false,
    };
  } catch {
    return null;
  }
}

/**
 * Parse a skill directory (contains SKILL.md)
 */
export async function parseSkillDirectory(
  skillDir: string,
  source: DiscoveredCommand['source'],
  pluginName?: string
): Promise<DiscoveredCommand | null> {
  const skillFile = path.join(skillDir, 'SKILL.md');

  try {
    const content = await fs.readFile(skillFile, 'utf-8');
    const { frontmatter } = parseFrontmatter(content);

    const skillName = path.basename(skillDir);
    const description = extractDescription(content, frontmatter);

    return {
      name: skillName,
      description,
      source,
      pluginName,
      filePath: skillFile,
      usage: frontmatter['argument-hint']
        ? `/${skillName} ${frontmatter['argument-hint']}`
        : undefined,
      isSkill: true,
    };
  } catch {
    return null;
  }
}
