/**
 * ConfigService - Loads and merges configuration from hierarchical sources.
 *
 * CLAUDE.md hierarchy:
 *   1. Global: ~/.claude/CLAUDE.md
 *   2. Project: {projectRoot}/CLAUDE.md
 *   3. Local: {projectRoot}/CLAUDE.local.md (gitignored)
 *   4. Subdirectory: CLAUDE.md files between cwd and projectRoot
 *
 * Settings.json hierarchy:
 *   1. User: ~/.claude/settings.json (lowest priority)
 *   2. Project: {projectRoot}/.claude/settings.json
 *   3. Local: {projectRoot}/.claude/settings.local.json (highest priority)
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import matter from 'gray-matter';
import { glob } from 'glob';
import { minimatch } from 'minimatch';

import type { SessionConfig, Settings, RuleFile } from '../types/config.js';

/**
 * Service for loading and merging Claude configuration from multiple sources.
 */
export class ConfigService {
  /**
   * Check if a file or directory exists.
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Find the project root by walking up from startDir.
   * Looks for .git, package.json, or CLAUDE.md to identify the project root.
   * Returns startDir if no indicators found.
   */
  async findProjectRoot(startDir: string): Promise<string> {
    let dir = path.resolve(startDir);
    const rootDir = path.parse(dir).root;

    while (dir !== rootDir) {
      const indicators = ['.git', 'package.json', 'CLAUDE.md', '.claude'];

      for (const indicator of indicators) {
        const indicatorPath = path.join(dir, indicator);

        if (await this.fileExists(indicatorPath)) {
          return dir;
        }
      }

      const parentDir = path.dirname(dir);

      // Prevent infinite loop
      if (parentDir === dir) {
        break;
      }

      dir = parentDir;
    }

    // Fallback to start directory if no project root found
    return path.resolve(startDir);
  }

  /**
   * Load and concatenate CLAUDE.md files from the hierarchy.
   *
   * Order (all content included, later sources can override):
   *   1. Global: ~/.claude/CLAUDE.md
   *   2. Project: {projectRoot}/CLAUDE.md
   *   3. Local: {projectRoot}/CLAUDE.local.md
   *   4. Subdirectory: CLAUDE.md files from projectRoot to cwd
   */
  async loadClaudeMdHierarchy(cwd: string, projectRoot: string): Promise<string> {
    const parts: string[] = [];

    // 1. Global CLAUDE.md
    const globalPath = path.join(os.homedir(), '.claude', 'CLAUDE.md');

    if (await this.fileExists(globalPath)) {
      const content = await fs.readFile(globalPath, 'utf-8');

      parts.push(content.trim());
    }

    // 2. Project root CLAUDE.md
    const projectPath = path.join(projectRoot, 'CLAUDE.md');

    if (await this.fileExists(projectPath)) {
      const content = await fs.readFile(projectPath, 'utf-8');

      parts.push(content.trim());
    }

    // 3. Project local CLAUDE.md (gitignored personal preferences)
    const localPath = path.join(projectRoot, 'CLAUDE.local.md');

    if (await this.fileExists(localPath)) {
      const content = await fs.readFile(localPath, 'utf-8');

      parts.push(content.trim());
    }

    // 4. Subdirectory CLAUDE.md files (from cwd upward to project root)
    // Collect in order from project root to cwd (parent dirs first)
    const subdirParts: string[] = [];
    let currentDir = path.resolve(cwd);
    const resolvedProjectRoot = path.resolve(projectRoot);

    while (currentDir !== resolvedProjectRoot && currentDir !== path.dirname(currentDir)) {
      const subPath = path.join(currentDir, 'CLAUDE.md');

      if (await this.fileExists(subPath)) {
        const content = await fs.readFile(subPath, 'utf-8');

        // Add to front so parent dirs come first
        subdirParts.unshift(content.trim());
      }

      currentDir = path.dirname(currentDir);
    }

    parts.push(...subdirParts);

    // Join with double newlines
    return parts.filter((p) => p.length > 0).join('\n\n');
  }

  /**
   * Load and deep-merge settings from the settings.json hierarchy.
   *
   * Priority (higher number overrides lower):
   *   1. User: ~/.claude/settings.json
   *   2. Project: {projectRoot}/.claude/settings.json
   *   3. Local: {projectRoot}/.claude/settings.local.json
   */
  async loadSettingsHierarchy(projectRoot: string): Promise<Settings> {
    const sources = [
      path.join(os.homedir(), '.claude', 'settings.json'),
      path.join(projectRoot, '.claude', 'settings.json'),
      path.join(projectRoot, '.claude', 'settings.local.json'),
    ];

    let merged: Settings = {};

    for (const source of sources) {
      if (await this.fileExists(source)) {
        try {
          const content = await fs.readFile(source, 'utf-8');
          const settings = JSON.parse(content) as Settings;

          merged = this.deepMerge(merged, settings);
        } catch (error) {
          console.warn(`[ConfigService] Failed to parse ${source}:`, error);
        }
      }
    }

    return merged;
  }

  /**
   * Deep merge two objects. Arrays replace (not concat). Later sources override earlier.
   */
  deepMerge<T extends object>(target: T, source: Partial<T>): T {
    const result = { ...target } as T;

    for (const key of Object.keys(source) as (keyof T)[]) {
      const sourceValue = source[key];
      const targetValue = target[key];

      if (this.isObject(sourceValue) && this.isObject(targetValue)) {
        result[key] = this.deepMerge(targetValue, sourceValue as Partial<typeof targetValue>) as T[keyof T];
      } else if (sourceValue !== undefined) {
        result[key] = sourceValue as T[keyof T];
      }
    }

    return result;
  }

  /**
   * Check if a value is a plain object (not array, not null).
   */
  private isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  /**
   * Load all rule files from .claude/rules/ directory recursively.
   * Each rule file is parsed for YAML frontmatter to extract optional paths field.
   *
   * @param projectRoot - The project root directory
   * @returns Array of RuleFile objects with path, content, and optional paths glob
   */
  async loadModularRules(projectRoot: string): Promise<RuleFile[]> {
    const rulesDir = path.join(projectRoot, '.claude', 'rules');

    if (!(await this.fileExists(rulesDir))) {
      return [];
    }

    const ruleFiles: RuleFile[] = [];

    try {
      const files = await glob('**/*.md', {
        cwd: rulesDir,
        absolute: false,
      });

      for (const file of files) {
        const filePath = path.join(rulesDir, file);

        try {
          const rawContent = await fs.readFile(filePath, 'utf-8');
          const parsed = matter(rawContent);

          const ruleFile: RuleFile = {
            path: filePath,
            content: parsed.content.trim(),
          };

          // Extract paths field from frontmatter if present
          if (parsed.data && typeof parsed.data.paths === 'string') {
            ruleFile.paths = parsed.data.paths;
          }

          ruleFiles.push(ruleFile);
        } catch (error) {
          console.warn(`[ConfigService] Failed to parse rule file ${filePath}:`, error);
        }
      }
    } catch (error) {
      console.warn(`[ConfigService] Failed to load rules from ${rulesDir}:`, error);
    }

    return ruleFiles;
  }

  /**
   * Filter rules to those applicable for a specific file path.
   * Rules without a paths field are unconditional and always apply.
   * Rules with a paths field only apply if the file path matches the glob pattern.
   *
   * @param rules - Array of loaded rule files
   * @param filePath - Optional file path to filter rules for (if omitted, returns unconditional rules only)
   * @returns Array of rule content strings that apply
   */
  getApplicableRules(rules: RuleFile[], filePath?: string): string[] {
    return rules
      .filter((rule) => {
        // If no paths field, rule always applies
        if (!rule.paths) {
          return true;
        }

        // If no filePath provided, only return unconditional rules
        if (!filePath) {
          return false;
        }

        // Check if filePath matches the glob pattern
        return minimatch(filePath, rule.paths);
      })
      .map((rule) => rule.content);
  }

  /**
   * Build the system prompt by combining CLAUDE.md content and unconditional rules.
   *
   * @param claudeMd - Merged CLAUDE.md content
   * @param rules - Array of loaded rule files
   * @returns Combined system prompt string
   */
  buildSystemPrompt(claudeMd: string, rules: RuleFile[]): string {
    const parts: string[] = [];

    // Add CLAUDE.md content first
    if (claudeMd.length > 0) {
      parts.push(claudeMd);
    }

    // Get unconditional rules (no paths field)
    const unconditionalRules = rules.filter((rule) => !rule.paths);

    if (unconditionalRules.length > 0) {
      parts.push('## Project Rules');

      for (const rule of unconditionalRules) {
        parts.push(rule.content);
      }
    }

    return parts.join('\n\n');
  }

  /**
   * Load full session configuration from all sources.
   *
   * @param cwd - Working directory for the session
   * @param sessionEnv - Additional environment variables for this session
   * @returns Complete SessionConfig
   */
  async loadConfig(cwd: string, sessionEnv: Record<string, string> = {}): Promise<SessionConfig> {
    const resolvedCwd = path.resolve(cwd);
    const projectRoot = await this.findProjectRoot(resolvedCwd);

    // Load CLAUDE.md hierarchy
    const claudeMd = await this.loadClaudeMdHierarchy(resolvedCwd, projectRoot);

    // Load settings hierarchy
    const settings = await this.loadSettingsHierarchy(projectRoot);

    // Load modular rules from .claude/rules/
    const rules = await this.loadModularRules(projectRoot);

    // Build system prompt from CLAUDE.md and unconditional rules
    const systemPrompt = this.buildSystemPrompt(claudeMd, rules);

    // Merge environment variables: defaults < settings.env < sessionEnv < PWD override
    // IMPORTANT: Include ANTHROPIC_API_KEY for SDK authentication
    const env: Record<string, string> = {
      HOME: process.env.HOME || '',
      PATH: process.env.PATH || '',
      SHELL: process.env.SHELL || '/bin/bash',
      TERM: 'xterm-256color',
      ...(process.env.ANTHROPIC_API_KEY ? { ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY } : {}),
      ...(settings.env || {}),
      ...sessionEnv,
      PWD: resolvedCwd,
    };

    return {
      cwd: resolvedCwd,
      projectRoot,
      systemPrompt,
      settings,
      rules,
      env,
    };
  }
}

/**
 * Singleton instance of ConfigService.
 */
export const configService = new ConfigService();
