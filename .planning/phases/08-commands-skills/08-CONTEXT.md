# Phase 8: Commands & Skills - Context

**Gathered:** 2026-01-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Slash commands and skills system — users type `/` to invoke built-in commands (/help, /clear) and custom commands/skills loaded from `.claude/commands/` and `.claude/skills/`. This phase delivers command palette integration, command loading from filesystem, skills system, and keyboard shortcuts matching Claude Code CLI. Vim mode is out of scope.

</domain>

<decisions>
## Implementation Decisions

### Existing UI Infrastructure (REUSE)

The slash command UI already exists in `packages/ui-kit/react-chat`:

- `SlashCommand` type — command definition (name, description, icon, usage, aliases, hidden)
- `SlashCommandResult` type — execution result (handled, clearInput, message)
- `SlashCommandPopover` — floating panel with filtering and arrow key navigation
- `ChatInput` integration — detects `/`, shows popover, executes via `onCommand`

The `apps/ideate` app has a reusable `useChatCommands` hook that provides:
- Built-in commands: /clear, /help, /model
- Extensibility via `additionalCommands` and `onCustomCommand` callbacks

**Decision:** Reuse these components directly. Do not rebuild.

### Command Execution Feedback

- All command output appears as system/assistant messages inline in the chat
- No toast notifications for command results
- Commands execute immediately without confirmation dialogs
- Unknown commands show inline error: "Unknown command: /foo"

### Custom Command Discovery

**Discovery paths (Claude Code compatible):**
- Project: `.claude/commands/` (checked into repo)
- User: `~/.claude/commands/` (personal)

**Command file format:**
```markdown
---
description: Brief description for autocomplete
argument-hint: [argument-type]
model: claude-3-5-sonnet-20240620  # optional
allowed-tools:                      # optional
  - bash
  - read
---

# Command instructions here
```

**Loading behavior:**
- Commands loaded on session start via server API
- Cached for session lifetime (no hot reload)
- Invalid command files show notification to user with error details

### Skills System

**Discovery paths (Claude Code compatible):**
- Project: `.claude/skills/`
- User: `~/.claude/skills/`

**Skill format:**
```
.claude/skills/my-skill/
├── SKILL.md           # Required: frontmatter + instructions
└── [supporting files] # Optional
```

**SKILL.md frontmatter:**
```yaml
---
name: my-skill
description: What this skill does and when Claude should use it
---
```

**Handling:** Skills are richer than commands — SKILL.md + supporting files injected as context. Claude determines invocation based on task relevance (not just explicit /skill-name).

### Architecture: Hook-Based Separation

**Pattern:**
- `useSlashCommands` hook — command coordination (registration, loading, execution)
- `ChatInput` — focused on input UX (already handles palette display)
- `ClaudeCodeChatPanel` (or derivative) — wires everything together for Claude Code context

This keeps ChatInput generic and reusable while allowing Claude Code-specific command behavior.

### Server-Side Command Loading

- Commands and skills loaded via dedicated API endpoint
- Server reads `.claude/commands/` and `.claude/skills/` directories
- Returns parsed command/skill definitions to client
- Bash pre-execution for commands runs on server

**Reusable endpoint pattern:**
- Create `packages/shared-server` for common middleware and route handlers
- Command loading endpoint should be reusable across V2 and Ideate apps

### Keyboard Shortcuts

- Match exact Claude Code CLI keyboard shortcuts
- Research required during planning to identify full shortcut list
- Shortcuts handled at appropriate level (input-specific vs app-level)
- Vim mode is **out of scope** for this phase

### Claude's Discretion

- Exact keyboard shortcut bindings (research Claude Code during planning)
- Error message formatting for invalid commands
- Skills auto-discovery implementation details
- Command precedence when names conflict between project/user

</decisions>

<specifics>
## Specific Ideas

- "We should prioritize using react-chat components and ChatPanel. If there are things we need to change about react-chat components to make parity with Claude Code, we should call those out specifically."
- The `useChatCommands` hook from ideate is the pattern to follow/extend
- Server endpoint code should be reusable so ideate can use it later

</specifics>

<deferred>
## Deferred Ideas

- Vim mode for input — explicitly out of scope per user direction
- Hot reload of commands when files change — load on session start only
- Command versioning or migration

</deferred>

---

*Phase: 08-commands-skills*
*Context gathered: 2026-01-25*
