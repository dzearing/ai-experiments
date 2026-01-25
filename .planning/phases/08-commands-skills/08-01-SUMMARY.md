---
phase: 08-commands-skills
plan: 01
subsystem: commands
tags: [commands, skills, discovery, api]
dependency-graph:
  requires: [05-configuration-system]
  provides: [command-discovery, skill-discovery, commands-api]
  affects: [08-02, 08-03, 08-04]
tech-stack:
  added: []
  patterns: [filesystem-discovery, frontmatter-parsing, scope-precedence]
key-files:
  created:
    - apps/claude-code-web/server/src/types/commands.ts
    - apps/claude-code-web/server/src/services/commandsService.ts
    - apps/claude-code-web/server/src/routes/commands.ts
  modified:
    - apps/claude-code-web/server/src/index.ts
decisions:
  - id: CMD-01
    choice: "Map-based deduplication for scope precedence"
    rationale: "Project commands override user commands by loading user first then project"
  - id: CMD-02
    choice: "CommandSummary type for API responses"
    rationale: "Excludes full content to reduce payload size for autocomplete"
metrics:
  duration: "2.5 min"
  completed: 2026-01-25
---

# Phase 8 Plan 1: Server-Side Command Discovery Summary

Server-side CommandsService that discovers commands from `.claude/commands/` and skills from `.claude/skills/` with full frontmatter parsing and scope precedence.

## What Was Built

### Types (commands.ts)
- `CommandSource` union type: 'builtin' | 'project' | 'user'
- `CommandDefinition` interface with all frontmatter fields (description, argumentHint, model, allowedTools, disableModelInvocation, userInvocable, context)
- `CommandSummary` for lightweight API responses

### CommandsService (commandsService.ts)
- `loadCommands(projectRoot)` - Main entry point discovering all commands/skills
- `loadFromDirectory()` - Parses `**/*.md` files with gray-matter
- `loadSkillsFromDirectory()` - Handles `*/SKILL.md` pattern
- `extractFirstParagraph()` - Fallback description from content
- `parseAllowedTools()` - Handles comma-separated string or array
- Scope precedence: user loaded first, project overrides via Map

### API Route (commands.ts)
- `GET /api/commands?cwd={path}` - Returns discovered commands
- Uses configService.findProjectRoot() for project detection
- Filters to userInvocable !== false
- Returns CommandSummary array (excludes full content)

## Verification Performed

1. TypeScript compiles without errors
2. Server starts and /api/commands endpoint responds
3. Created test command in `.claude/commands/test-cmd.md` - appeared in response
4. Created test skill in `.claude/skills/test-skill/SKILL.md` - appeared in response
5. Both user-scope (from `~/.claude/`) and project-scope commands returned

## Decisions Made

| ID | Decision | Rationale |
|----|----------|-----------|
| CMD-01 | Map-based deduplication | Simple and correct - user loads first, project overwrites |
| CMD-02 | CommandSummary for API | Full content not needed for autocomplete display |

## Deviations from Plan

None - plan executed exactly as written.

## Artifacts

| File | Purpose |
|------|---------|
| `types/commands.ts` | Type definitions for commands and skills |
| `services/commandsService.ts` | Filesystem discovery and parsing logic |
| `routes/commands.ts` | Express router for /api/commands |

## Next Phase Readiness

Ready for 08-02 (Client-Side Integration). The API provides:
- Command list with name, description, argumentHint, source, type
- Correct scope precedence (project overrides user)
- Filtering for userInvocable commands

Client will need to:
- Fetch commands on session start
- Map to SlashCommand format for existing popover
- Handle command execution
