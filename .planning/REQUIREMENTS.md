# Requirements: Claude Code Web

**Defined:** 2026-01-19
**Core Value:** Everything you can do in Claude Code CLI, you can do in this web app

## v1 Requirements

Requirements for full Claude Code parity. Each maps to roadmap phases.

### Core Agent

- [ ] **CORE-01**: Server streams `SDKMessage` objects to client via SSE/WebSocket
- [ ] **CORE-02**: User can send messages and receive streaming responses
- [ ] **CORE-03**: Thinking blocks display in UI during extended reasoning
- [ ] **CORE-04**: Partial message streaming shows real-time token generation
- [ ] **CORE-05**: Multi-turn conversations maintain context
- [ ] **CORE-06**: Sessions persist to disk and can be resumed
- [ ] **CORE-07**: Session forking creates branch from existing session
- [ ] **CORE-08**: Context auto-compaction summarizes when approaching limits
- [ ] **CORE-09**: Context usage indicator shows token consumption

### Tools

- [ ] **TOOL-01**: Read tool displays file contents with syntax highlighting
- [ ] **TOOL-02**: Write tool creates files with confirmation dialog
- [ ] **TOOL-03**: Edit tool shows diff preview before applying changes
- [ ] **TOOL-04**: Bash tool executes commands with output streaming
- [ ] **TOOL-05**: Bash background execution with BashOutput retrieval
- [ ] **TOOL-06**: Glob tool finds files by pattern
- [ ] **TOOL-07**: Grep tool searches file contents with results display
- [ ] **TOOL-08**: WebSearch tool shows search results
- [ ] **TOOL-09**: WebFetch tool displays fetched content
- [ ] **TOOL-10**: NotebookEdit tool modifies Jupyter notebooks
- [ ] **TOOL-11**: Tool execution shows progress indicator while running
- [ ] **TOOL-12**: Tool results display formatted output with collapse/expand

### Configuration

- [ ] **CONF-01**: CLAUDE.md files load from project hierarchy
- [ ] **CONF-02**: Settings load from .claude/settings.json hierarchy
- [ ] **CONF-03**: Modular rules load from .claude/rules/*.md
- [ ] **CONF-04**: Working directory configurable per session
- [ ] **CONF-05**: Environment variables passthrough to tools

### Hooks

- [ ] **HOOK-01**: PreToolUse hooks can intercept and block tool calls
- [ ] **HOOK-02**: PostToolUse hooks run after tool execution
- [ ] **HOOK-03**: Hook matchers filter by tool name pattern
- [ ] **HOOK-04**: SessionStart/SessionEnd hooks fire on lifecycle
- [ ] **HOOK-05**: SubagentStart/SubagentStop hooks track agent spawning
- [ ] **HOOK-06**: UserPromptSubmit hooks can validate input
- [ ] **HOOK-07**: PermissionRequest hooks handle approval flow
- [ ] **HOOK-08**: PreCompact hooks run before context summarization
- [ ] **HOOK-09**: Hooks can inject system messages
- [ ] **HOOK-10**: Hooks can modify tool input before execution

### Commands

- [ ] **CMD-01**: Built-in slash commands available (e.g., /help, /clear)
- [ ] **CMD-02**: Custom commands load from .claude/commands/
- [ ] **CMD-03**: Commands support arguments ($1, $2, $ARGUMENTS)
- [ ] **CMD-04**: Commands can run bash pre-execution
- [ ] **CMD-05**: Command palette UI triggered by /
- [ ] **CMD-06**: Skills system loads from .claude/skills/
- [ ] **CMD-07**: Skills have multi-file structure (SKILL.md + files)

### Modes

- [ ] **MODE-01**: Default mode shows permission prompts for tools
- [ ] **MODE-02**: Plan mode restricts to read-only operations
- [ ] **MODE-03**: Accept edits mode auto-approves file modifications
- [ ] **MODE-04**: Bypass permissions mode auto-approves all (with warning)
- [ ] **MODE-05**: Mode indicator shows current execution mode
- [ ] **MODE-06**: Mode can be changed mid-session

### Subagents

- [ ] **AGENT-01**: Task tool spawns subagents with isolated context
- [ ] **AGENT-02**: Built-in agent types work (Explore, Plan, general-purpose)
- [ ] **AGENT-03**: Custom agent definitions from options.agents
- [ ] **AGENT-04**: Subagent messages identified by parent_tool_use_id
- [ ] **AGENT-05**: Subagent spawning shows visual indicator/animation
- [ ] **AGENT-06**: Background agents run without blocking main chat
- [ ] **AGENT-07**: Agent progress and completion visible in UI

### MCP

- [ ] **MCP-01**: Stdio MCP servers spawn local processes
- [ ] **MCP-02**: HTTP MCP servers connect to remote endpoints
- [ ] **MCP-03**: SSE MCP servers connect via Server-Sent Events
- [ ] **MCP-04**: SDK MCP servers run in-process
- [ ] **MCP-05**: MCP tools discovered and added to available tools
- [ ] **MCP-06**: MCP tool naming follows mcp__{server}__{tool} pattern
- [ ] **MCP-07**: MCP server status shown in UI
- [ ] **MCP-08**: MCP resources can be listed and read

### Permissions

- [ ] **PERM-01**: canUseTool callback surfaces approval to UI
- [ ] **PERM-02**: Permission dialog shows tool name and input
- [ ] **PERM-03**: User can approve, deny, or approve-always
- [ ] **PERM-04**: AskUserQuestion renders as multi-select dialog
- [ ] **PERM-05**: Permission rules support wildcard patterns
- [ ] **PERM-06**: Denied permissions shown in result summary

### UI/UX

- [ ] **UI-01**: Chat message list with virtualized scrolling
- [ ] **UI-02**: Streaming text renders incrementally
- [ ] **UI-03**: Markdown renders with syntax highlighting
- [ ] **UI-04**: Code blocks have copy button
- [ ] **UI-05**: File paths are clickable to open in viewer
- [ ] **UI-06**: Tool execution groups visually in message
- [ ] **UI-07**: Keyboard shortcuts match Claude Code CLI
- [ ] **UI-08**: Vim mode available for input
- [ ] **UI-09**: Multi-line input with Shift+Enter
- [ ] **UI-10**: Message history navigation
- [ ] **UI-11**: TodoWrite shows task list panel
- [ ] **UI-12**: File diff viewer shows before/after
- [ ] **UI-13**: File tree browser for workspace
- [ ] **UI-14**: Theme support (light/dark)
- [ ] **UI-15**: Responsive layout for different screen sizes

### Infrastructure

- [ ] **INFRA-01**: Express server with TypeScript
- [ ] **INFRA-02**: Agent SDK integration with error handling
- [ ] **INFRA-03**: SSE endpoint for message streaming
- [ ] **INFRA-04**: WebSocket option for bidirectional communication
- [ ] **INFRA-05**: Session storage with persistence
- [ ] **INFRA-06**: File checkpointing for undo/rewind
- [ ] **INFRA-07**: Cost tracking per session
- [ ] **INFRA-08**: React client with Vite
- [ ] **INFRA-09**: Integration with ui-kit packages

## v2 Requirements (Future)

Deferred to future milestone. Tracked but not in current roadmap.

### Multi-User

- **MULTI-01**: User authentication (OAuth)
- **MULTI-02**: Per-user session isolation
- **MULTI-03**: Shared workspace collaboration

### Ideate Integration

- **IDEATE-01**: Combine with Ideate app features
- **IDEATE-02**: Project management integration

### Mobile

- **MOBILE-01**: Mobile-responsive layout
- **MOBILE-02**: Touch-friendly interactions

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| IDE integration (VS Code, JetBrains) | Web app serves different purpose |
| Native CLI executable | This IS the web alternative |
| Multi-user hosted deployment | Local dev tool for v1 |
| Mobile native app | Desktop browser focus |
| Offline mode | Requires Claude API connection |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CORE-01 | Phase 2 | Pending |
| CORE-02 | Phase 2 | Pending |
| CORE-03 | Phase 2 | Pending |
| CORE-04 | Phase 2 | Pending |
| CORE-05 | Phase 2 | Pending |
| CORE-06 | Phase 10 | Pending |
| CORE-07 | Phase 10 | Pending |
| CORE-08 | Phase 10 | Pending |
| CORE-09 | Phase 2 | Pending |
| TOOL-01 | Phase 3 | Pending |
| TOOL-02 | Phase 6 | Pending |
| TOOL-03 | Phase 6 | Pending |
| TOOL-04 | Phase 6 | Pending |
| TOOL-05 | Phase 6 | Pending |
| TOOL-06 | Phase 3 | Pending |
| TOOL-07 | Phase 3 | Pending |
| TOOL-08 | Phase 6 | Pending |
| TOOL-09 | Phase 6 | Pending |
| TOOL-10 | Phase 6 | Pending |
| TOOL-11 | Phase 3 | Pending |
| TOOL-12 | Phase 3 | Pending |
| CONF-01 | Phase 5 | Pending |
| CONF-02 | Phase 5 | Pending |
| CONF-03 | Phase 5 | Pending |
| CONF-04 | Phase 5 | Pending |
| CONF-05 | Phase 5 | Pending |
| HOOK-01 | Phase 7 | Pending |
| HOOK-02 | Phase 7 | Pending |
| HOOK-03 | Phase 7 | Pending |
| HOOK-04 | Phase 7 | Pending |
| HOOK-05 | Phase 7 | Pending |
| HOOK-06 | Phase 7 | Pending |
| HOOK-07 | Phase 7 | Pending |
| HOOK-08 | Phase 7 | Pending |
| HOOK-09 | Phase 7 | Pending |
| HOOK-10 | Phase 7 | Pending |
| CMD-01 | Phase 8 | Pending |
| CMD-02 | Phase 8 | Pending |
| CMD-03 | Phase 8 | Pending |
| CMD-04 | Phase 8 | Pending |
| CMD-05 | Phase 8 | Pending |
| CMD-06 | Phase 8 | Pending |
| CMD-07 | Phase 8 | Pending |
| MODE-01 | Phase 4 | Pending |
| MODE-02 | Phase 4 | Pending |
| MODE-03 | Phase 4 | Pending |
| MODE-04 | Phase 4 | Pending |
| MODE-05 | Phase 4 | Pending |
| MODE-06 | Phase 4 | Pending |
| AGENT-01 | Phase 9 | Pending |
| AGENT-02 | Phase 9 | Pending |
| AGENT-03 | Phase 9 | Pending |
| AGENT-04 | Phase 9 | Pending |
| AGENT-05 | Phase 9 | Pending |
| AGENT-06 | Phase 9 | Pending |
| AGENT-07 | Phase 9 | Pending |
| MCP-01 | Phase 10 | Pending |
| MCP-02 | Phase 10 | Pending |
| MCP-03 | Phase 10 | Pending |
| MCP-04 | Phase 10 | Pending |
| MCP-05 | Phase 10 | Pending |
| MCP-06 | Phase 10 | Pending |
| MCP-07 | Phase 10 | Pending |
| MCP-08 | Phase 10 | Pending |
| PERM-01 | Phase 4 | Pending |
| PERM-02 | Phase 4 | Pending |
| PERM-03 | Phase 4 | Pending |
| PERM-04 | Phase 4 | Pending |
| PERM-05 | Phase 4 | Pending |
| PERM-06 | Phase 4 | Pending |
| UI-01 | Phase 2 | Pending |
| UI-02 | Phase 2 | Pending |
| UI-03 | Phase 2 | Pending |
| UI-04 | Phase 2 | Pending |
| UI-05 | Phase 3 | Pending |
| UI-06 | Phase 3 | Pending |
| UI-07 | Phase 8 | Pending |
| UI-08 | Phase 8 | Pending |
| UI-09 | Phase 8 | Pending |
| UI-10 | Phase 8 | Pending |
| UI-11 | Phase 6 | Pending |
| UI-12 | Phase 6 | Pending |
| UI-13 | Phase 3 | Pending |
| UI-14 | Phase 10 | Pending |
| UI-15 | Phase 10 | Pending |
| INFRA-01 | Phase 1 | Complete |
| INFRA-02 | Phase 1 | Complete |
| INFRA-03 | Phase 1 | Complete |
| INFRA-04 | Phase 1 | Complete |
| INFRA-05 | Phase 10 | Pending |
| INFRA-06 | Phase 10 | Pending |
| INFRA-07 | Phase 10 | Pending |
| INFRA-08 | Phase 1 | Complete |
| INFRA-09 | Phase 1 | Complete |

**Coverage:**
- v1 requirements: 79 total
- Mapped to phases: 79
- Unmapped: 0

---
*Requirements defined: 2026-01-19*
*Last updated: 2026-01-19 - UI-12 moved from Phase 3 to Phase 6 (diff viewer belongs with Edit tools)*
