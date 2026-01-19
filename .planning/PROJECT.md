# Claude Code Web

## What This Is

A web-based clone of Claude Code with 100% feature parity. This local development tool brings Claude Code's full power to a visual web interface while retaining all CLI capabilities. Users run a local backend server that uses the Agent SDK, with a React SPA frontend for rich visual feedback of agent execution, tool calls, subagent spawning, and more.

## Core Value

Everything you can do in Claude Code CLI, you can do in this web app — same configuration files, same behavior, better visualization.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Streaming responses with thinking blocks displayed
- [ ] All built-in tool execution (Read, Write, Edit, Bash, Glob, Grep, WebFetch, WebSearch)
- [ ] Tool execution visualization with progress indicators
- [ ] CLAUDE.md file hierarchy loading (enterprise → project → user → local)
- [ ] Settings hierarchy with proper precedence
- [ ] Modular rules support (.claude/rules/*.md)
- [ ] Hooks system (PreToolUse, PostToolUse, PermissionRequest, UserPromptSubmit, SessionStart/End)
- [ ] Built-in slash commands
- [ ] Custom slash commands (.claude/commands/)
- [ ] Skills system (.claude/skills/)
- [ ] Execution modes (default, plan, acceptEdits, bypassPermissions)
- [ ] Permission dialogs (questionnaire-style web UI)
- [ ] Subagent spawning via Task tool
- [ ] Built-in agent types (Explore, Plan, general-purpose)
- [ ] Custom agent definitions
- [ ] Subagent progress visualization
- [ ] MCP server connections (stdio and HTTP/SSE)
- [ ] MCP tool discovery and registration
- [ ] Session persistence and resumption
- [ ] Context auto-compaction (summarization)
- [ ] Vim mode keyboard shortcuts
- [ ] Slash command palette (/ trigger)
- [ ] AskUserQuestion dialog component
- [ ] TodoWrite visualization
- [ ] File diff visualization
- [ ] Context usage indicator
- [ ] Agent spawning animations

### Out of Scope

- IDE integrations (VS Code, JetBrains) — web app serves a different purpose
- Native CLI executable — this IS the web alternative
- Multi-user hosted deployment — local dev tool only (for now)
- Mobile app — desktop browser focus
- Ideate app integration — future milestone, parity first

## Context

**Technical Environment:**
- Monorepo with pnpm workspaces
- Existing UI kit packages: ui-kit, react, react-markdown, react-chat, icons
- V1 has Claude Code integration (reference patterns, not reusing code)
- Agent SDK (`@anthropic-ai/claude-agent-sdk`) is the foundation

**Architecture Principle:**
Server architecture must mirror Claude Code's own structure to enable easy parity updates when Claude Code evolves. When Claude Code gets new features, this web app should be straightforward to update.

**User's Vision:**
- See agents spawn, tool calls churn, same keyboard shortcuts
- Slash commands, questionnaires, all features — just in web UX format
- Long-term: combine with Ideate app concept (but parity first)

**Research Insights:**
- Claude Code is built on Agent SDK — same foundation we'll use
- Agent SDK handles tool execution loop automatically
- Hooks, sessions, MCP, subagents all supported by SDK
- Web needs to proxy filesystem/bash through backend

## Constraints

- **Tech stack**: React 19, TypeScript, Vite, ui-kit packages, Express v5, Agent SDK
- **Architecture**: Must mirror Claude Code server structure for update parity
- **Deployment**: Local only — runs on user's machine with full filesystem access
- **Dependencies**: Leverage existing ui-kit packages, extend as needed
- **UI patterns**: Follow ui-kit design tokens and component patterns

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Agent SDK as foundation | Same tech as Claude Code = same capabilities | — Pending |
| Fresh start (not V1 extraction) | Cleaner architecture, no legacy patterns | — Pending |
| WebSocket + SSE for streaming | Real-time tool execution feedback | — Pending |
| File-based session storage | Matches Claude Code, portable sessions | — Pending |
| Mirror CC server architecture | Easy parity updates as CC evolves | — Pending |

---
*Last updated: 2026-01-19 after initialization*
