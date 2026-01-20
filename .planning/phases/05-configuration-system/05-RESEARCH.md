# Phase 5: Configuration System - Research

**Researched:** 2026-01-19
**Domain:** Claude configuration hierarchy, CLAUDE.md loading, settings.json, modular rules, environment passthrough
**Confidence:** HIGH

## Summary

Phase 5 implements the configuration system that mirrors Claude Code's hierarchical configuration loading. This enables project-specific instructions via CLAUDE.md files, team-wide settings via settings.json, modular rules via .claude/rules/, and environment variable passthrough to tool execution.

The key technical challenges are:

1. **CLAUDE.md Hierarchy Loading** - Load markdown files from global (~/.claude/CLAUDE.md), project root (CLAUDE.md), and subdirectories, merging them with cascading priority.
2. **Settings.json Hierarchy** - Load JSON settings from user (~/.claude/settings.json), project (.claude/settings.json), and local (.claude/settings.local.json) with correct precedence.
3. **Modular Rules** - Discover and load all .md files from .claude/rules/ recursively, supporting path-specific targeting via YAML frontmatter.
4. **Working Directory Configuration** - Allow sessions to specify a different cwd than the server's default, affecting file operations and tool execution.
5. **Environment Passthrough** - Configure environment variables per session that get passed to Bash tool execution.

**Primary recommendation:** Create a `ConfigService` that loads and merges configuration from all sources at session initialization, passing the merged system prompt and settings to the SDK's `query()` options. Environment variables pass via the SDK's `env` option.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@anthropic-ai/claude-agent-sdk` | 0.2.12+ | Configuration via options | SDK accepts systemPrompt, env, cwd, settingSources |
| Node.js fs/promises | built-in | File system operations | Reading CLAUDE.md, settings.json, rules files |
| `gray-matter` | ^4.0.3 | YAML frontmatter parsing | Parse path-specific rules from .claude/rules/*.md |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `glob` | ^11.0.0 | File pattern matching | Discovering .claude/rules/**/*.md files |
| `minimatch` | ^10.0.0 | Glob pattern matching | Evaluating paths field in rules frontmatter |
| `deep-merge` | native | Object merging | Merging settings hierarchies (use spread or lodash.merge) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| gray-matter | Manual YAML parsing | gray-matter handles frontmatter edge cases, widely used |
| glob | fast-glob | fast-glob is faster but glob is more widely used, simpler API |
| File-based config | Database | File-based matches Claude Code behavior, simpler architecture |

**Installation:**
```bash
# Server dependencies
cd apps/claude-code-web/server
pnpm add gray-matter glob

# minimatch already installed in Phase 4
```

## Architecture Patterns

### Recommended Project Structure
```
apps/claude-code-web/
├── server/src/
│   ├── services/
│   │   ├── configService.ts      # NEW: Configuration loading and merging
│   │   ├── claudemdService.ts    # NEW: CLAUDE.md hierarchy loading
│   │   ├── settingsService.ts    # NEW: settings.json hierarchy loading
│   │   ├── rulesService.ts       # NEW: Modular rules loading
│   │   └── agentService.ts       # Enhanced with config integration
│   ├── routes/
│   │   └── agent.ts              # Enhanced with working directory
│   └── types/
│       └── config.ts             # NEW: Configuration type definitions
└── client/src/
    ├── types/
    │   └── config.ts             # Configuration types for API
    └── (UI changes minimal - config is server-side)
```

### Pattern 1: CLAUDE.md Hierarchy Loading
**What:** Load and merge CLAUDE.md files from all levels
**When to use:** At session initialization
**Example:**
```typescript
// Source: Claude Code docs - CLAUDE.md loading hierarchy
interface ClaudeMdContent {
  path: string;
  content: string;
  level: 'global' | 'project' | 'subdirectory' | 'local';
}

async function loadClaudeMdHierarchy(cwd: string): Promise<string> {
  const contents: ClaudeMdContent[] = [];

  // 1. Global (~/.claude/CLAUDE.md)
  const globalPath = path.join(os.homedir(), '.claude', 'CLAUDE.md');
  if (await fileExists(globalPath)) {
    contents.push({
      path: globalPath,
      content: await fs.readFile(globalPath, 'utf-8'),
      level: 'global',
    });
  }

  // 2. Project root (traverse up to find git root or CLAUDE.md)
  const projectRoot = await findProjectRoot(cwd);
  const projectPath = path.join(projectRoot, 'CLAUDE.md');
  if (await fileExists(projectPath)) {
    contents.push({
      path: projectPath,
      content: await fs.readFile(projectPath, 'utf-8'),
      level: 'project',
    });
  }

  // 3. Project local (gitignored personal preferences)
  const localPath = path.join(projectRoot, 'CLAUDE.local.md');
  if (await fileExists(localPath)) {
    contents.push({
      path: localPath,
      content: await fs.readFile(localPath, 'utf-8'),
      level: 'local',
    });
  }

  // 4. Subdirectory CLAUDE.md (from cwd upward to project root)
  let currentDir = cwd;
  while (currentDir !== projectRoot && currentDir !== path.dirname(currentDir)) {
    const subPath = path.join(currentDir, 'CLAUDE.md');
    if (await fileExists(subPath)) {
      contents.push({
        path: subPath,
        content: await fs.readFile(subPath, 'utf-8'),
        level: 'subdirectory',
      });
    }
    currentDir = path.dirname(currentDir);
  }

  // Merge: all content applies, later overrides conflicts
  return contents
    .map(c => `<!-- ${c.level}: ${c.path} -->\n${c.content}`)
    .join('\n\n');
}
```

### Pattern 2: Settings.json Hierarchy Loading
**What:** Load and merge settings.json files with correct precedence
**When to use:** At session initialization
**Example:**
```typescript
// Source: Claude Code docs - settings precedence
interface Settings {
  permissions?: PermissionRule[];
  env?: Record<string, string>;
  hooks?: Record<string, HookConfig[]>;
  model?: string;
  // ... other settings
}

async function loadSettingsHierarchy(cwd: string): Promise<Settings> {
  const projectRoot = await findProjectRoot(cwd);

  // Load in order: user < project < local (higher priority last)
  const sources: { path: string; priority: number }[] = [
    { path: path.join(os.homedir(), '.claude', 'settings.json'), priority: 1 },
    { path: path.join(projectRoot, '.claude', 'settings.json'), priority: 2 },
    { path: path.join(projectRoot, '.claude', 'settings.local.json'), priority: 3 },
  ];

  let merged: Settings = {};

  for (const source of sources) {
    if (await fileExists(source.path)) {
      const content = await fs.readFile(source.path, 'utf-8');
      const settings = JSON.parse(content) as Settings;

      // Deep merge: later sources override earlier
      merged = deepMerge(merged, settings);
    }
  }

  return merged;
}

// Deep merge helper (or use lodash.merge)
function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key of Object.keys(source) as (keyof T)[]) {
    const sourceValue = source[key];
    const targetValue = target[key];

    if (isObject(sourceValue) && isObject(targetValue)) {
      result[key] = deepMerge(targetValue, sourceValue) as T[keyof T];
    } else if (sourceValue !== undefined) {
      result[key] = sourceValue as T[keyof T];
    }
  }

  return result;
}
```

### Pattern 3: Modular Rules Loading from .claude/rules/
**What:** Discover and load all .md files recursively, with path-specific targeting
**When to use:** At session initialization
**Example:**
```typescript
// Source: Claude Code docs - modular rules
import matter from 'gray-matter';
import { glob } from 'glob';
import { minimatch } from 'minimatch';

interface RuleFile {
  path: string;
  content: string;
  frontmatter: {
    paths?: string;  // Glob pattern for path-specific rules
    [key: string]: unknown;
  };
}

async function loadModularRules(projectRoot: string): Promise<RuleFile[]> {
  const rulesDir = path.join(projectRoot, '.claude', 'rules');

  if (!await fileExists(rulesDir)) {
    return [];
  }

  // Discover all .md files recursively
  const files = await glob('**/*.md', {
    cwd: rulesDir,
    absolute: true,
    follow: true,  // Follow symlinks
  });

  const rules: RuleFile[] = [];

  for (const filePath of files) {
    const content = await fs.readFile(filePath, 'utf-8');
    const { data: frontmatter, content: body } = matter(content);

    rules.push({
      path: filePath,
      content: body,
      frontmatter: frontmatter as RuleFile['frontmatter'],
    });
  }

  return rules;
}

// Filter rules applicable to current working file
function getApplicableRules(rules: RuleFile[], workingFilePath: string): string[] {
  return rules
    .filter(rule => {
      if (!rule.frontmatter.paths) {
        return true;  // No path restriction, always applies
      }

      // Support comma-separated patterns
      const patterns = rule.frontmatter.paths.split(',').map(p => p.trim());
      return patterns.some(pattern => minimatch(workingFilePath, pattern));
    })
    .map(rule => rule.content);
}

// Merge rules into system prompt
function buildSystemPrompt(
  claudeMdContent: string,
  rules: RuleFile[],
  currentFile?: string
): string {
  const applicableRules = currentFile
    ? getApplicableRules(rules, currentFile)
    : rules.map(r => r.content);

  const parts = [claudeMdContent];

  if (applicableRules.length > 0) {
    parts.push('## Project Rules\n\n' + applicableRules.join('\n\n'));
  }

  return parts.join('\n\n');
}
```

### Pattern 4: Working Directory Configuration
**What:** Allow sessions to specify a different cwd than server default
**When to use:** When starting a session or switching projects
**Example:**
```typescript
// Server: accept cwd in session options
interface SessionOptions {
  cwd: string;
  sessionId?: string;
  permissionMode?: PermissionMode;
  env?: Record<string, string>;
}

async function initializeSession(options: SessionOptions): Promise<SessionConfig> {
  const { cwd, env = {} } = options;

  // Validate cwd is accessible
  try {
    await fs.access(cwd, fs.constants.R_OK);
  } catch {
    throw new Error(`Working directory not accessible: ${cwd}`);
  }

  // Load configuration from this cwd
  const claudeMd = await loadClaudeMdHierarchy(cwd);
  const settings = await loadSettingsHierarchy(cwd);
  const rules = await loadModularRules(await findProjectRoot(cwd));

  // Build merged system prompt
  const systemPrompt = buildSystemPrompt(claudeMd, rules);

  // Merge environment variables: settings.env < session.env
  const mergedEnv = {
    ...settings.env,
    ...env,
    // Always include cwd in env for tool context
    PWD: cwd,
  };

  return {
    cwd,
    systemPrompt,
    settings,
    rules,
    env: mergedEnv,
  };
}

// Enhanced streamAgentQuery
export async function* streamAgentQuery(
  options: StreamAgentOptions
): AsyncGenerator<SDKMessage> {
  const { prompt, sessionId, cwd, permissionMode, env } = options;

  // Initialize or load session config
  const sessionConfig = await initializeSession({ cwd, env });

  const queryOptions = {
    resume: sessionId,
    cwd: sessionConfig.cwd,
    env: sessionConfig.env,
    includePartialMessages: true,
    permissionMode,
    systemPrompt: {
      type: 'preset' as const,
      preset: 'claude_code' as const,
      append: sessionConfig.systemPrompt,  // Append CLAUDE.md + rules
    },
    settingSources: ['project', 'user'] as const,
  };

  // ... rest of query logic
}
```

### Pattern 5: Environment Variable Passthrough
**What:** Configure environment variables that get passed to Bash tool execution
**When to use:** When session needs specific env vars (API keys, paths, etc.)
**Example:**
```typescript
// Client API: start session with env vars
interface StartSessionRequest {
  prompt: string;
  cwd: string;
  env?: Record<string, string>;  // Session-specific env vars
}

// Server: merge env sources
function mergeEnvironmentVariables(
  settingsEnv: Record<string, string> = {},
  sessionEnv: Record<string, string> = {},
  cwd: string
): Record<string, string> {
  // Priority: sessionEnv > settingsEnv > process.env (filtered)
  // Only pass through safe vars, not secrets like ANTHROPIC_API_KEY

  const safeProcessEnv = filterSafeEnvVars(process.env);

  return {
    ...safeProcessEnv,
    ...settingsEnv,
    ...sessionEnv,
    // Always set these
    HOME: process.env.HOME || '',
    PATH: process.env.PATH || '',
    SHELL: process.env.SHELL || '/bin/bash',
    PWD: cwd,
    TERM: 'xterm-256color',
  };
}

// Filter out sensitive variables
function filterSafeEnvVars(env: NodeJS.ProcessEnv): Record<string, string> {
  const sensitivePatterns = [
    /^ANTHROPIC_/,
    /^AWS_/,
    /^GOOGLE_/,
    /^OPENAI_/,
    /SECRET/i,
    /TOKEN/i,
    /KEY/i,
    /PASSWORD/i,
  ];

  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(env)) {
    if (value && !sensitivePatterns.some(p => p.test(key))) {
      result[key] = value;
    }
  }

  return result;
}
```

### Anti-Patterns to Avoid
- **Loading config on every message:** Load once at session start, cache for session lifetime
- **Ignoring settings.local.json:** This is for personal preferences that shouldn't be committed
- **Exposing sensitive env vars:** Filter out API keys and secrets before passing to SDK
- **Blocking on missing files:** Gracefully handle missing CLAUDE.md or settings.json
- **Hard-coding paths:** Use os.homedir() and path.join() for cross-platform compatibility

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML frontmatter parsing | Regex extraction | gray-matter | Handles edge cases, multi-line YAML, content separation |
| File discovery | Manual recursion | glob | Handles symlinks, ignore patterns, cross-platform |
| Glob matching | String comparison | minimatch | Handles brace expansion, star patterns, negation |
| Deep object merging | Shallow spread | lodash.merge or recursive helper | Handles nested objects, arrays |
| Finding git root | Manual .git search | SDK's cwd handling | SDK already finds project root |

**Key insight:** The SDK already handles most configuration loading when `settingSources` is set. Phase 5 focuses on building the server-side configuration service that prepares system prompts and environment variables before calling query().

## Common Pitfalls

### Pitfall 1: Configuration Not Updating on File Change
**What goes wrong:** User edits CLAUDE.md but changes don't apply
**Why it happens:** Configuration cached for session lifetime
**How to avoid:** Document that config loads at session start; add endpoint to reload config
**Warning signs:** User reports changes not taking effect

### Pitfall 2: Path Resolution Issues
**What goes wrong:** CLAUDE.md not found when expected
**Why it happens:** Relative paths or inconsistent cwd
**How to avoid:** Always use absolute paths, resolve relative to cwd
**Warning signs:** "File not found" errors for existing files

### Pitfall 3: Circular Symlinks in rules/
**What goes wrong:** Infinite loop during rule discovery
**Why it happens:** Symlinks pointing to parent directories
**How to avoid:** Use glob's `follow: true` which handles circular refs
**Warning signs:** Timeout or memory issues during startup

### Pitfall 4: Settings Schema Validation
**What goes wrong:** Invalid settings.json causes crash
**Why it happens:** User edits settings with invalid JSON or unknown properties
**How to avoid:** Validate with JSON schema, use try/catch, provide defaults
**Warning signs:** Server crash on startup with certain projects

### Pitfall 5: Environment Variable Leakage
**What goes wrong:** API keys exposed to Bash tool
**Why it happens:** Passing all process.env to SDK
**How to avoid:** Filter sensitive variables before passing env option
**Warning signs:** Secrets visible in command output or logs

### Pitfall 6: Rules Path Pattern Mismatch
**What goes wrong:** Path-specific rules never apply
**Why it happens:** Pattern doesn't match file paths (e.g., Windows vs Unix paths)
**How to avoid:** Normalize paths before matching, use forward slashes
**Warning signs:** Rules in .claude/rules/ have no effect

## Code Examples

Verified patterns from official documentation and existing implementations:

### Configuration Service Implementation
```typescript
// Source: Claude Code configuration hierarchy
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import matter from 'gray-matter';
import { glob } from 'glob';
import { minimatch } from 'minimatch';

export interface SessionConfig {
  cwd: string;
  projectRoot: string;
  systemPrompt: string;
  settings: Settings;
  rules: RuleFile[];
  env: Record<string, string>;
}

export interface Settings {
  permissions?: PermissionRule[];
  env?: Record<string, string>;
  hooks?: Record<string, HookConfig[]>;
  model?: string;
}

export interface RuleFile {
  path: string;
  content: string;
  paths?: string;
}

export class ConfigService {
  private cache = new Map<string, SessionConfig>();

  async loadConfig(cwd: string, sessionEnv: Record<string, string> = {}): Promise<SessionConfig> {
    // Check cache first (keyed by cwd)
    const cached = this.cache.get(cwd);
    if (cached) {
      return {
        ...cached,
        env: { ...cached.env, ...sessionEnv },
      };
    }

    const projectRoot = await this.findProjectRoot(cwd);

    // Load all configuration sources in parallel
    const [claudeMd, settings, rules] = await Promise.all([
      this.loadClaudeMdHierarchy(cwd, projectRoot),
      this.loadSettingsHierarchy(projectRoot),
      this.loadModularRules(projectRoot),
    ]);

    const systemPrompt = this.buildSystemPrompt(claudeMd, rules);
    const env = this.mergeEnv(settings.env, sessionEnv, cwd);

    const config: SessionConfig = {
      cwd,
      projectRoot,
      systemPrompt,
      settings,
      rules,
      env,
    };

    this.cache.set(cwd, config);
    return config;
  }

  async findProjectRoot(startDir: string): Promise<string> {
    let dir = path.resolve(startDir);

    while (dir !== path.dirname(dir)) {
      // Check for common project root indicators
      const indicators = ['.git', 'package.json', 'CLAUDE.md', '.claude'];

      for (const indicator of indicators) {
        if (await this.fileExists(path.join(dir, indicator))) {
          return dir;
        }
      }

      dir = path.dirname(dir);
    }

    // Fallback to start directory
    return startDir;
  }

  private async loadClaudeMdHierarchy(cwd: string, projectRoot: string): Promise<string> {
    const parts: string[] = [];

    // Global
    const globalPath = path.join(os.homedir(), '.claude', 'CLAUDE.md');
    if (await this.fileExists(globalPath)) {
      parts.push(await fs.readFile(globalPath, 'utf-8'));
    }

    // Project root
    const projectPath = path.join(projectRoot, 'CLAUDE.md');
    if (await this.fileExists(projectPath)) {
      parts.push(await fs.readFile(projectPath, 'utf-8'));
    }

    // Local (gitignored)
    const localPath = path.join(projectRoot, 'CLAUDE.local.md');
    if (await this.fileExists(localPath)) {
      parts.push(await fs.readFile(localPath, 'utf-8'));
    }

    // Subdirectory CLAUDE.md files (cwd to project root)
    let currentDir = cwd;
    const subdirParts: string[] = [];

    while (currentDir !== projectRoot && currentDir !== path.dirname(currentDir)) {
      const subPath = path.join(currentDir, 'CLAUDE.md');
      if (await this.fileExists(subPath)) {
        subdirParts.unshift(await fs.readFile(subPath, 'utf-8'));
      }
      currentDir = path.dirname(currentDir);
    }

    parts.push(...subdirParts);

    return parts.join('\n\n');
  }

  private async loadSettingsHierarchy(projectRoot: string): Promise<Settings> {
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
          const settings = JSON.parse(content);
          merged = this.deepMerge(merged, settings);
        } catch (error) {
          console.warn(`[ConfigService] Failed to parse ${source}:`, error);
        }
      }
    }

    return merged;
  }

  private async loadModularRules(projectRoot: string): Promise<RuleFile[]> {
    const rulesDir = path.join(projectRoot, '.claude', 'rules');

    if (!await this.fileExists(rulesDir)) {
      return [];
    }

    const files = await glob('**/*.md', {
      cwd: rulesDir,
      absolute: true,
      follow: true,
    });

    const rules: RuleFile[] = [];

    for (const filePath of files) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const { data, content: body } = matter(content);

        rules.push({
          path: filePath,
          content: body.trim(),
          paths: data.paths as string | undefined,
        });
      } catch (error) {
        console.warn(`[ConfigService] Failed to load rule ${filePath}:`, error);
      }
    }

    return rules;
  }

  private buildSystemPrompt(claudeMd: string, rules: RuleFile[]): string {
    const parts = [claudeMd];

    // Add unconditional rules
    const unconditionalRules = rules.filter(r => !r.paths);
    if (unconditionalRules.length > 0) {
      parts.push('\n## Project Rules\n');
      parts.push(unconditionalRules.map(r => r.content).join('\n\n'));
    }

    return parts.join('\n');
  }

  getApplicableRules(rules: RuleFile[], filePath: string): string[] {
    return rules
      .filter(rule => {
        if (!rule.paths) return true;
        const patterns = rule.paths.split(',').map(p => p.trim());
        return patterns.some(p => minimatch(filePath, p));
      })
      .map(r => r.content);
  }

  private mergeEnv(
    settingsEnv: Record<string, string> = {},
    sessionEnv: Record<string, string>,
    cwd: string
  ): Record<string, string> {
    return {
      HOME: process.env.HOME || '',
      PATH: process.env.PATH || '',
      SHELL: process.env.SHELL || '/bin/bash',
      TERM: 'xterm-256color',
      ...settingsEnv,
      ...sessionEnv,
      PWD: cwd,
    };
  }

  private deepMerge<T extends object>(target: T, source: Partial<T>): T {
    const result = { ...target };

    for (const key of Object.keys(source) as (keyof T)[]) {
      const sv = source[key];
      const tv = target[key];

      if (this.isObject(sv) && this.isObject(tv)) {
        result[key] = this.deepMerge(tv, sv) as T[keyof T];
      } else if (sv !== undefined) {
        result[key] = sv as T[keyof T];
      }
    }

    return result;
  }

  private isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  clearCache(cwd?: string): void {
    if (cwd) {
      this.cache.delete(cwd);
    } else {
      this.cache.clear();
    }
  }
}

export const configService = new ConfigService();
```

### Integration with Agent Service
```typescript
// Source: Updated agentService.ts
import { configService } from './configService.js';

export async function* streamAgentQuery(
  options: StreamAgentOptions
): AsyncGenerator<SDKMessage> {
  const { prompt, sessionId, cwd = process.cwd(), permissionMode, env = {} } = options;

  // Load configuration for working directory
  const config = await configService.loadConfig(cwd, env);

  if (query) {
    const queryOptions: Record<string, unknown> = {
      resume: sessionId,
      cwd: config.cwd,
      env: config.env,
      includePartialMessages: true,
      permissionMode,
      // Append CLAUDE.md content to system prompt
      systemPrompt: config.systemPrompt
        ? {
            type: 'preset' as const,
            preset: 'claude_code' as const,
            append: config.systemPrompt,
          }
        : { type: 'preset' as const, preset: 'claude_code' as const },
    };

    // ... rest of query logic
  }
}
```

### API Types for Client
```typescript
// Source: types/config.ts
export interface SessionInitOptions {
  cwd: string;
  env?: Record<string, string>;
}

export interface ConfigEndpointResponse {
  projectRoot: string;
  hasClaudeMd: boolean;
  hasSettings: boolean;
  rulesCount: number;
}

// Client can query config info via GET /api/agent/config?cwd=/path
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single CLAUDE.md | Hierarchical CLAUDE.md loading | Claude Code 2024 | Better organization |
| Monolithic settings | settings.json hierarchy | Claude Code 2024 | User/project separation |
| All rules in CLAUDE.md | .claude/rules/ modular files | Claude Code v2.0.64 | Easier collaboration |
| Fixed working directory | Configurable cwd per session | SDK feature | Multi-project support |

**Deprecated/outdated:**
- `.claude.json` for settings - migrate to settings.json hierarchy
- `allowedTools` in .claude.json - migrate to permission rules in settings.json

## Open Questions

Things that couldn't be fully resolved:

1. **Config Change Detection**
   - What we know: Config loads at session start
   - What's unclear: Should we watch files and notify on changes?
   - Recommendation: Start with manual reload endpoint, consider file watching later

2. **PERM-05: Permission Rules from Config**
   - What we know: settings.json supports permissions array with wildcard patterns
   - What's unclear: How to integrate with Phase 4's session-scoped rules
   - Recommendation: Load permission rules from settings at session start, merge with session rules

3. **Global Rules Directory**
   - What we know: Claude Code supports ~/.claude/rules/ for user-level rules
   - What's unclear: Priority relative to project rules
   - Recommendation: Load global rules, apply same as global CLAUDE.md (lowest priority)

4. **Symlink Security**
   - What we know: .claude/rules/ supports symlinks for sharing rules
   - What's unclear: Should we restrict symlinks pointing outside project?
   - Recommendation: Follow symlinks but log warnings for external links

## Sources

### Primary (HIGH confidence)
- [Claude Code Settings](https://code.claude.com/docs/en/settings) - Settings hierarchy, precedence
- [Claude Code Memory](https://code.claude.com/docs/en/memory) - CLAUDE.md loading, rules directory
- [Modular Rules Blog](https://claude-blog.setec.rs/blog/claude-code-rules-directory) - .claude/rules/ detailed behavior
- `.planning/research/AGENT_SDK.md` - SDK options including settingSources, env, cwd

### Secondary (MEDIUM confidence)
- [Settings Hierarchy Guide](https://m.academy/lessons/settings-configuration-fallback-hierarchy-claude-code/) - Precedence details
- [DeepWiki Settings Hierarchy](https://deepwiki.com/zebbern/claude-code-guide/4.1-settings-hierarchy) - Configuration examples

### Tertiary (LOW confidence)
- None - all findings verified against official documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using standard Node.js file APIs and well-known npm packages
- Architecture: HIGH - Patterns derived from official Claude Code documentation
- Pitfalls: MEDIUM - Based on common file system and configuration issues

**Research date:** 2026-01-19
**Valid until:** 2026-02-19 (30 days - configuration system is stable)

---

## Implementation Checklist Summary

For the planner, key implementation areas:

1. **ConfigService**
   - [ ] Create configService.ts with loadConfig method
   - [ ] Implement findProjectRoot (git, package.json, CLAUDE.md detection)
   - [ ] Implement loadClaudeMdHierarchy (global, project, local, subdirectory)
   - [ ] Implement loadSettingsHierarchy (user, project, local)
   - [ ] Implement loadModularRules (glob discovery, gray-matter parsing)
   - [ ] Implement buildSystemPrompt (merge CLAUDE.md + rules)
   - [ ] Implement mergeEnv (settings.env + session.env + safe defaults)
   - [ ] Add config caching per cwd

2. **Agent Service Integration**
   - [ ] Update streamAgentQuery to use configService
   - [ ] Pass systemPrompt.append with CLAUDE.md content
   - [ ] Pass env option with merged environment
   - [ ] Pass cwd option from session config

3. **API Endpoints**
   - [ ] Accept cwd and env in stream/query requests
   - [ ] Add GET /api/agent/config endpoint for config info
   - [ ] Add POST /api/agent/config/reload endpoint

4. **Types**
   - [ ] SessionConfig interface
   - [ ] Settings interface (permissions, env, hooks)
   - [ ] RuleFile interface (path, content, paths frontmatter)

5. **Testing**
   - [ ] Verify CLAUDE.md loads from all hierarchy levels
   - [ ] Verify settings merge with correct precedence
   - [ ] Verify rules load from .claude/rules/ recursively
   - [ ] Verify path-specific rules filter correctly
   - [ ] Verify env vars pass through to Bash tool
