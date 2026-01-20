# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-19)

**Core value:** Everything you can do in Claude Code CLI, you can do in this web app
**Current focus:** Phase 4 - Permissions & Modes (IN PROGRESS)

## Current Position

Phase: 4 of 10 (Permissions & Modes)
Plan: 3 of 3 in current phase
Status: Phase complete
Last activity: 2026-01-20 - Completed 04-03-PLAN.md

Progress: [████████████░] 34% (12/35 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 12
- Average duration: 3.5 min
- Total execution time: 42.3 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1-Infrastructure | 3/3 | 14.5 min | 4.8 min |
| 2-Core Streaming | 2/4 | 6.2 min | 3.1 min |
| 3-Essential Tools | 4/4 | 11.6 min | 2.9 min |
| 4-Permissions & Modes | 3/3 | 10.0 min | 3.3 min |

**Recent Trend:**
- Last 5 plans: 03-03 (2.7m), 03-04 (3.2m), 04-01 (3m), 04-02 (3m), 04-03 (4m)
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

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-01-20
Stopped at: Completed 04-03-PLAN.md (Phase 4 complete)
Resume file: None
