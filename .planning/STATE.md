# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-19)

**Core value:** Everything you can do in Claude Code CLI, you can do in this web app
**Current focus:** Phase 8 - Commands & Skills (NEXT)

## Current Position

Phase: 8 of 10 (Commands & Skills)
Plan: 3 of 4 in current phase
Status: In progress
Last activity: 2026-01-25 - Completed 08-05-PLAN.md

Progress: [██████████████████████] 80% (28/35 plans) -- Phase 8 in progress

## Performance Metrics

**Velocity:**
- Total plans completed: 28
- Average duration: 3.4 min
- Total execution time: 98.8 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1-Infrastructure | 3/3 | 14.5 min | 4.8 min |
| 2-Core Streaming | 2/4 | 6.2 min | 3.1 min |
| 3-Essential Tools | 4/4 | 11.6 min | 2.9 min |
| 4-Permissions & Modes | 3/3 | 10.0 min | 3.3 min |
| 5-Configuration System | 2/2 | 8.0 min | 4.0 min |
| 6-Extended Tools | 7/7 | 27.0 min | 3.9 min |
| 7-Hooks System | 3/3 | 7.0 min | 2.3 min |
| 8-Commands & Skills | 3/4 | 11.5 min | 3.8 min |

**Recent Trend:**
- Last 5 plans: 07-03 (3m), 08-01 (2.5m), 08-02 (6m), 08-05 (3m)
- Trend: Stable

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Agent SDK as foundation (same tech as Claude Code)
- Fresh start architecture (not V1 extraction)
- WebSocket + SSE for streaming
- File-based session storage
- Mirror CC server architecture for parity updates
- Port 3002 for new server (avoid V1 conflict on 3001)
- ESM-only TypeScript with NodeNext resolution
- Port 5174 for client dev server (avoid V1 conflict on 5173)
- Conditional StrictMode disabled in dev to prevent double API calls
- SSE over WebSocket for Phase 1 simplicity (unidirectional streaming sufficient)
- 30-second heartbeat for SSE connection keep-alive
- Async generator pattern for SDK message streaming
- bypassPermissions mode for Phase 2 simplicity (permission UI deferred)
- Mock mode auto-detection when SDK unavailable
- Thinking blocks tracked separately from text content
- StreamingState ref used for rapid delta accumulation without re-renders
- useConversation wraps useAgentStream for clean conversation API
- Path validation uses path.resolve() to prevent traversal attacks
- Directory listings sorted: directories first, then files alphabetically
- detectLanguage defaults to 'plaintext' for unknown extensions
- ClickablePath uses button element for accessibility (not anchor)
- Content preview truncated at 200 chars for Grep results
- Grep truncation indicator at 100+ matches
- TreeView uses lazy loading - children fetched on expand
- FileViewer uses modal/panel pattern with close button
- 55s permission timeout auto-denies before SDK 60s timeout
- canUseTool callback pattern for permission handling
- AskUserQuestion sends question_request event (not permission_request)
- Segmented control for mode selection (compact mutually-exclusive options)
- Dialog-based confirmation for bypassPermissions (no browser dialogs)
- Session-scoped mode storage (mode relevant only for session lifetime)
- formatToolInput helper formats tool-specific display (Bash, Write, Edit, Read, Glob, Grep)
- Permission event types: permission_request, question_request, mode_changed
- Denied permissions tracked in useAgentStream and displayed inline in ChatView
- Settings.json arrays replace (not concat) for simpler override semantics
- CLAUDE.md files concatenated with double newlines between sources
- Environment merge order: defaults < settings.env < sessionEnv < PWD
- Project root detected via .git, package.json, CLAUDE.md, or .claude directory
- Unconditional rules (no paths field) always apply and included in system prompt
- Path-specific rules filter by minimatch glob pattern
- systemPrompt uses claude_code preset with append for custom content
- Config debug endpoint returns summary without exposing full content
- CodeIcon used for Bash instead of TerminalIcon (not available in ui-kit)
- Bash and TaskOutput share BashResultDisplay component
- WebSearch output parsed for URLs and made clickable external links
- Notebook code cells use Python highlighting, markdown cells use plaintext
- SDK web content pre-processed by AI, safe to display without sanitization
- diff library (createPatch) for unified diff generation in Edit tool
- renderToolPreview returns ReactNode for rich previews in PermissionDialog
- FileDiff showHeader=false to avoid duplicate path display in permission dialog
- CSS-based status indicators for TodoWrite (empty circle for pending, filled for in_progress)
- ChatPanelMessage: Set both content and parts fields for user messages (backward compatibility)
- ID-based matching for tool_result to tool_use via extractToolUseIds + extractToolResults
- Use cancelled flag to indicate tool errors (ui-kit already handles cancelled state display)
- HooksConfig maps hook events to arrays of action entries (matcher, action, options)
- Built-in hook actions: log, notify, block-pattern, allow, deny
- HooksService uses minimatch for tool name glob pattern matching
- Hooks passed to SDK via queryOptions.hooks alongside existing canUseTool
- PreToolUse hooks return deny with reason for blocked commands (HOOK-01)
- PostToolUse hooks receive tool_response for logging/context injection (HOOK-02)
- createPreToolUseHook factory supports: block-dangerous, auto-approve-readonly, inject-message, block-pattern
- createPostToolUseHook factory supports: log, add-context
- wrapWithNotification adds SSE notification to all hook callbacks
- HookActivityEvent type added to PermissionSSEEvent union
- SessionStart/End hooks fire on lifecycle events (HOOK-04)
- SubagentStart/Stop hooks track agent spawning (HOOK-05)
- UserPromptSubmit hooks can validate and reject input (HOOK-06)
- PermissionRequest hooks can intercept approval flow (HOOK-07)
- PreCompact hooks fire before context summarization (HOOK-08)
- Each hook event type has dedicated factory function
- Hook factories accept options object with action field for configuration
- Map-based deduplication for command scope precedence (project overrides user)
- CommandSummary type excludes full content for API responses
- System messages as separate state in ChatView (command output distinct from conversation)
- Snake_case for contextUsage to match existing UsageStats type

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-01-25
Stopped at: Completed 08-05-PLAN.md
Resume file: None
