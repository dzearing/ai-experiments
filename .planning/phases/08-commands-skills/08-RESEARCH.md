# Phase 8: Commands & Skills - Research

**Researched:** 2026-01-25
**Domain:** Slash commands, custom commands, skills system, keyboard shortcuts
**Confidence:** HIGH

## Summary

This phase implements Claude Code CLI parity for slash commands and skills. The research reveals a well-defined standard for both commands and skills that Claude Code follows, including the Agent Skills open standard. The codebase already has strong foundations in the `react-chat` package with `SlashCommand` types, `SlashCommandPopover`, and the `useChatCommands` hook pattern from the ideate app.

The key insight is that **custom commands have been merged into skills** in Claude Code. Files at `.claude/commands/review.md` and `.claude/skills/review/SKILL.md` both create `/review` and work the same way. Existing `.claude/commands/` files continue to work. Skills add optional features: directory for supporting files, frontmatter for invocation control, and automatic model-invoked loading.

**Primary recommendation:** Reuse existing `react-chat` slash command infrastructure. Add server-side command/skill loading service following the established `configService` and `hooksService` patterns. Support both `.claude/commands/` (simple) and `.claude/skills/` (full) formats for parity.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| gray-matter | ^4.0.3 | YAML frontmatter parsing | Already used in configService for rules |
| glob | ^10.x | File discovery | Already used in configService for rules |
| minimatch | ^9.x | Glob pattern matching | Already used in hooksService |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (existing) @ui-kit/react-chat | workspace | SlashCommand types, popover | UI layer |
| (existing) configService | workspace | Pattern for file loading | Server layer |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| gray-matter | js-yaml + manual parsing | gray-matter handles frontmatter extraction automatically |
| Custom popover | existing SlashCommandPopover | Existing component already handles filtering, keyboard nav |

**Installation:**
No new packages required. All dependencies already present.

## Architecture Patterns

### Recommended Project Structure

```
apps/claude-code-web/server/src/
├── services/
│   └── commandsService.ts    # Command/skill loading and parsing
├── routes/
│   └── commands.ts           # API endpoints for commands/skills
├── types/
│   └── commands.ts           # CommandDefinition, SkillDefinition types

apps/claude-code-web/client/src/
├── hooks/
│   └── useSlashCommands.ts   # Command coordination hook
├── components/
│   └── (uses existing ChatInput with commands prop)
```

### Pattern 1: Command/Skill Service (Server-Side)

**What:** Single service that discovers and loads commands and skills from filesystem
**When to use:** Server startup and session initialization
**Example:**
```typescript
// Source: Following configService.ts and hooksService.ts patterns

export interface CommandDefinition {
  name: string;
  description: string;
  argumentHint?: string;
  model?: string;
  allowedTools?: string[];
  content: string;
  source: 'builtin' | 'project' | 'user';
  type: 'command' | 'skill';
  // Skill-specific fields
  disableModelInvocation?: boolean;
  userInvocable?: boolean;
  context?: 'fork';
}

export class CommandsService {
  async loadCommands(projectRoot: string): Promise<CommandDefinition[]> {
    const commands: CommandDefinition[] = [];

    // 1. Load from ~/.claude/commands/ (user scope)
    const userCommandsDir = path.join(os.homedir(), '.claude', 'commands');
    commands.push(...await this.loadFromDirectory(userCommandsDir, 'user', 'command'));

    // 2. Load from {projectRoot}/.claude/commands/ (project scope)
    const projectCommandsDir = path.join(projectRoot, '.claude', 'commands');
    commands.push(...await this.loadFromDirectory(projectCommandsDir, 'project', 'command'));

    // 3. Load from ~/.claude/skills/ (user scope)
    const userSkillsDir = path.join(os.homedir(), '.claude', 'skills');
    commands.push(...await this.loadSkillsFromDirectory(userSkillsDir, 'user'));

    // 4. Load from {projectRoot}/.claude/skills/ (project scope)
    const projectSkillsDir = path.join(projectRoot, '.claude', 'skills');
    commands.push(...await this.loadSkillsFromDirectory(projectSkillsDir, 'project'));

    return commands;
  }

  private async loadFromDirectory(dir: string, source: 'user' | 'project', type: 'command' | 'skill'): Promise<CommandDefinition[]> {
    if (!(await this.fileExists(dir))) return [];

    const files = await glob('**/*.md', { cwd: dir });
    const commands: CommandDefinition[] = [];

    for (const file of files) {
      const content = await fs.readFile(path.join(dir, file), 'utf-8');
      const { data, content: body } = matter(content);

      commands.push({
        name: path.basename(file, '.md'),
        description: data.description || this.extractFirstParagraph(body),
        argumentHint: data['argument-hint'],
        model: data.model,
        allowedTools: data['allowed-tools']?.split(/,\s*/),
        content: body,
        source,
        type,
        disableModelInvocation: data['disable-model-invocation'],
        userInvocable: data['user-invocable'] ?? true,
      });
    }

    return commands;
  }
}
```

### Pattern 2: Argument Substitution

**What:** Replace $1, $2, $ARGUMENTS placeholders in command content
**When to use:** When executing a command with arguments
**Example:**
```typescript
// Source: Claude Code documentation on argument handling

function substituteArguments(content: string, args: string): string {
  const argParts = args.trim().split(/\s+/);

  let result = content;

  // Replace positional arguments $1, $2, etc.
  argParts.forEach((arg, index) => {
    result = result.replace(new RegExp(`\\$${index + 1}`, 'g'), arg);
  });

  // Replace $ARGUMENTS with all arguments
  result = result.replace(/\$ARGUMENTS/g, args);

  // If $ARGUMENTS wasn't in the content, append it
  if (!content.includes('$ARGUMENTS') && args.trim()) {
    result += `\n\nARGUMENTS: ${args}`;
  }

  return result;
}
```

### Pattern 3: Bash Pre-Execution (`!` Prefix)

**What:** Execute shell commands and inject output before sending to Claude
**When to use:** Commands that need dynamic context (git status, gh pr diff, etc.)
**Example:**
```typescript
// Source: Claude Code documentation on dynamic context injection

async function preprocessCommandContent(content: string, cwd: string): Promise<string> {
  // Match !`command` patterns
  const bashPattern = /!`([^`]+)`/g;
  let result = content;

  for (const match of content.matchAll(bashPattern)) {
    const command = match[1];
    try {
      const { stdout } = await execAsync(command, { cwd });
      result = result.replace(match[0], stdout.trim());
    } catch (error) {
      result = result.replace(match[0], `[Error running ${command}: ${error.message}]`);
    }
  }

  return result;
}
```

### Pattern 4: Hook-Based UI Separation

**What:** `useSlashCommands` hook for coordination, ChatInput for display
**When to use:** Keeping generic ChatInput reusable across contexts
**Example:**
```typescript
// Source: Following useChatCommands pattern from ideate app

export function useSlashCommands({
  projectRoot,
  onMessage,
}: UseSlashCommandsOptions) {
  const [commands, setCommands] = useState<SlashCommand[]>([]);

  // Load commands on mount
  useEffect(() => {
    fetch(`/api/commands?cwd=${encodeURIComponent(projectRoot)}`)
      .then(res => res.json())
      .then(data => {
        const slashCommands: SlashCommand[] = data.commands.map(cmd => ({
          name: cmd.name,
          description: cmd.description,
          usage: cmd.argumentHint ? `/${cmd.name} ${cmd.argumentHint}` : `/${cmd.name}`,
          hidden: !cmd.userInvocable,
        }));
        setCommands([...BUILTIN_COMMANDS, ...slashCommands]);
      });
  }, [projectRoot]);

  const handleCommand = useCallback((command: string, args: string) => {
    // Handle built-in commands locally
    if (command === 'clear') {
      // ...
    }

    // Send custom commands to server for processing
    // Server does argument substitution, bash pre-execution, then returns prompt
    // ...
  }, []);

  return { commands, handleCommand };
}
```

### Anti-Patterns to Avoid

- **Loading commands in every render:** Cache commands at session start
- **Parsing frontmatter on client:** Server should do all parsing, client receives clean definitions
- **Mixing command execution with UI:** Keep execution logic in hooks, not components
- **Custom popover implementation:** Use existing SlashCommandPopover from react-chat

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML frontmatter parsing | Custom regex | gray-matter | Edge cases with multiline values, nested YAML |
| Glob pattern matching | Custom matching | minimatch | Battle-tested, same as Claude Code uses |
| Command popover UI | New component | SlashCommandPopover | Already handles filtering, keyboard nav, accessibility |
| Command filtering | Custom filter | filterCommands from react-chat | Already handles name and alias matching |

**Key insight:** The existing codebase has most building blocks. This phase is integration work, not greenfield.

## Common Pitfalls

### Pitfall 1: Command Precedence Confusion
**What goes wrong:** User has command with same name in project and user scope, unclear which runs
**Why it happens:** No clear precedence rules implemented
**How to avoid:** Follow Claude Code precedence: project commands override user commands (closer scope wins)
**Warning signs:** User reports "my command changed" after pulling repo changes

### Pitfall 2: Argument Escaping Issues
**What goes wrong:** Arguments with spaces break positional substitution
**Why it happens:** Naive string split on whitespace
**How to avoid:** Consider shell-style quoting for complex arguments, or just use $ARGUMENTS for simplicity
**Warning signs:** Commands fail with paths containing spaces

### Pitfall 3: Skills vs Commands Confusion
**What goes wrong:** Implementing two separate systems that don't interoperate
**Why it happens:** Treating skills and commands as distinct concepts
**How to avoid:** Remember: a command IS a simple skill. Both create the same `/name` invocation
**Warning signs:** Duplicate code paths, inconsistent behavior between commands and skills

### Pitfall 4: Bash Pre-Execution Security
**What goes wrong:** Arbitrary command execution vulnerabilities
**Why it happens:** Not validating or sandboxing bash commands
**How to avoid:** Only execute bash for commands that declare `allowed-tools: Bash(...)` in frontmatter
**Warning signs:** Any bash execution without explicit allowlist

### Pitfall 5: Large Skill Files in Context
**What goes wrong:** Skill content bloats context window
**Why it happens:** Loading full SKILL.md + supporting files eagerly
**How to avoid:** Claude Code only loads description by default; full content loads on invocation
**Warning signs:** Context window warnings with many skills installed

## Code Examples

### Built-in Commands Implementation

```typescript
// Source: Claude Code documentation + ideate useChatCommands pattern

export const BUILTIN_COMMANDS: SlashCommand[] = [
  {
    name: 'clear',
    description: 'Clear conversation history',
    icon: <TrashIcon />,
    usage: '/clear',
  },
  {
    name: 'help',
    description: 'Show available commands and features',
    icon: <HelpIcon />,
    usage: '/help',
  },
  {
    name: 'compact',
    description: 'Compact conversation with optional focus instructions',
    icon: <CompressIcon />,
    usage: '/compact [instructions]',
  },
  {
    name: 'model',
    description: 'View or change the AI model',
    icon: <GearIcon />,
    usage: '/model [name]',
  },
  {
    name: 'config',
    description: 'Open settings interface',
    icon: <SettingsIcon />,
    usage: '/config',
  },
  {
    name: 'cost',
    description: 'Show token usage statistics',
    icon: <DollarIcon />,
    usage: '/cost',
  },
];
```

### SKILL.md Frontmatter Format

```yaml
# Source: https://code.claude.com/docs/en/skills

---
name: my-skill              # Optional, defaults to directory name
description: What this skill does and when to use it
argument-hint: [issue-number] # Optional hint for autocomplete
disable-model-invocation: true # Prevent Claude auto-loading
user-invocable: true        # Show in / menu (default true)
allowed-tools: Read, Grep   # Tools Claude can use without permission
model: claude-sonnet-4-5-20250929 # Model override
context: fork               # Run in subagent
agent: Explore              # Subagent type when context: fork
---

Skill instructions here...
```

### Command File Format (Simple)

```markdown
# Source: https://platform.claude.com/docs/en/agent-sdk/slash-commands

---
description: Fix a GitHub issue
argument-hint: [issue-number]
allowed-tools: Bash(gh:*)
---

Fix issue #$1 following our coding standards.

1. Read the issue details
2. Analyze the codebase
3. Implement the fix
```

### Server API Endpoint

```typescript
// Source: Following configService pattern

router.get('/commands', async (req, res) => {
  const { cwd } = req.query as { cwd?: string };

  if (!cwd) {
    return res.status(400).json({ error: 'Missing cwd parameter' });
  }

  try {
    const projectRoot = await configService.findProjectRoot(cwd);
    const commands = await commandsService.loadCommands(projectRoot);

    // Filter to user-invocable commands only
    const invocableCommands = commands.filter(c => c.userInvocable !== false);

    res.json({
      commands: invocableCommands.map(c => ({
        name: c.name,
        description: c.description,
        argumentHint: c.argumentHint,
        source: c.source,
        type: c.type,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Keyboard Shortcuts Reference

### Claude Code CLI Shortcuts (from official docs)

| Shortcut | Action | Web Equivalent |
|----------|--------|----------------|
| Ctrl+C | Cancel current operation | Ctrl+C or Escape |
| Ctrl+D | Exit session | N/A (web session) |
| Ctrl+L | Clear terminal screen | N/A (or /clear) |
| Up/Down | Navigate command history | Up/Down in input |
| Shift+Enter | Insert newline | Shift+Enter |
| Ctrl+Enter | Submit in multiline | Ctrl+Enter |
| Esc+Esc | Clear input / rewind | Double Escape |
| Shift+Tab | Cycle permission modes | Shift+Tab |
| / | Command/skill trigger | / (existing) |
| ! | Bash mode | Not in web scope |
| @ | File path mention | @ (if implemented) |

### Already Implemented in ChatInput

- Shift+Enter for newline
- Enter to submit (single-line mode)
- Ctrl/Cmd+Enter to submit (multiline mode)
- Up/Down for history navigation
- Escape+Escape to clear
- / for command popover

### To Add for Parity

| Shortcut | Action | Priority |
|----------|--------|----------|
| Ctrl+L | Clear conversation | HIGH |
| Shift+Tab | Cycle modes | MEDIUM |
| Ctrl+R | History search | LOW |

## Vim Mode - Out of Scope

Per CONTEXT.md, vim mode is explicitly deferred. However, for future reference:

**Library options if ever needed:**
- vim.js (toplan/Vim.js) - 19kb, no dependencies, simple vim for textarea
- vim-in-textarea - Single module, no jQuery
- react-vim-wasm - Full vim via WebAssembly (heavy)

**Recommendation for future:** vim.js for minimal footprint, or custom implementation of basic vim motions (hjkl, w/b, i/a/o modes) which is more maintainable than full vim emulation.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate commands and skills | Unified (commands ARE simple skills) | 2025 | Simpler mental model |
| Eager skill loading | Lazy loading (description only) | 2025 | Better context management |
| Single scope | Enterprise > Personal > Project precedence | 2025 | Enterprise control |

**Deprecated/outdated:**
- None specifically for commands/skills - this is relatively new functionality in Claude Code

## Open Questions

1. **Skill supporting files access**
   - What we know: Skills can have supporting files (templates, examples, scripts)
   - What's unclear: How does Claude access these files at runtime in a web context?
   - Recommendation: For MVP, support SKILL.md content only. Supporting files can be added later.

2. **Model-invoked skills**
   - What we know: Skills without `disable-model-invocation` can be auto-loaded by Claude
   - What's unclear: How does this integrate with the SDK streaming?
   - Recommendation: Start with user-invoked only. Model invocation requires SDK integration research.

3. **Nested skills discovery**
   - What we know: Claude Code discovers skills from nested `.claude/skills/` in monorepos
   - What's unclear: Full algorithm for discovery based on current working file
   - Recommendation: Start with project root only. Nested discovery is edge case.

## Sources

### Primary (HIGH confidence)
- [Claude Code Skills Documentation](https://code.claude.com/docs/en/skills) - Full SKILL.md format, frontmatter fields, invocation control
- [Claude Code Slash Commands in SDK](https://platform.claude.com/docs/en/agent-sdk/slash-commands) - SDK integration, custom commands format
- [Claude Code Interactive Mode](https://code.claude.com/docs/en/interactive-mode) - Built-in commands list, keyboard shortcuts
- [Claude Code Keybindings](https://code.claude.com/docs/en/keybindings) - Full keybindings configuration

### Secondary (MEDIUM confidence)
- Existing codebase patterns:
  - `/apps/ideate/client/src/hooks/useChatCommands.tsx` - Hook pattern for command handling
  - `/packages/ui-kit/react-chat/src/components/ChatInput/SlashCommand.types.ts` - Type definitions
  - `/packages/ui-kit/react-chat/src/components/ChatInput/SlashCommandPopover.tsx` - UI component
  - `/apps/claude-code-web/server/src/services/configService.ts` - Pattern for file loading
  - `/apps/claude-code-web/server/src/services/hooksService.ts` - Pattern for action mapping

### Tertiary (LOW confidence)
- Community cheatsheets and blog posts for keyboard shortcut lists (verified against official docs)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use in codebase
- Architecture: HIGH - Following established patterns from configService, hooksService, useChatCommands
- Pitfalls: MEDIUM - Based on documentation, some practical experience may reveal more
- Keyboard shortcuts: HIGH - Verified against official documentation

**Research date:** 2026-01-25
**Valid until:** 2026-02-25 (30 days - commands/skills system is stable)
