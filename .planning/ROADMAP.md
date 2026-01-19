# Roadmap: Claude Code Web

## Overview

This roadmap delivers a full-parity web clone of Claude Code in 10 phases. We start with infrastructure scaffolding and core streaming, then layer on tools, permissions, configuration, hooks, commands, modes, subagents, and MCP integration. Each phase delivers a coherent, verifiable capability that builds toward the complete Claude Code experience in a web interface.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Infrastructure Foundation** - Server/client scaffolding with Agent SDK integration
- [ ] **Phase 2: Core Streaming** - Message streaming and basic conversation flow
- [ ] **Phase 3: Essential Tools** - File and search tools with UI visualization
- [ ] **Phase 4: Permissions & Modes** - Permission dialogs and execution modes
- [ ] **Phase 5: Configuration System** - CLAUDE.md, settings, and rules loading
- [ ] **Phase 6: Extended Tools** - Bash, web tools, notebooks, and tool polish
- [ ] **Phase 7: Hooks System** - Pre/post tool hooks and lifecycle hooks
- [ ] **Phase 8: Commands & Skills** - Slash commands and skills system
- [ ] **Phase 9: Subagents** - Task tool and subagent visualization
- [ ] **Phase 10: MCP Integration** - MCP servers and custom tool discovery

## Phase Details

### Phase 1: Infrastructure Foundation
**Goal**: Working server and client that can connect and communicate
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-08, INFRA-09
**Success Criteria** (what must be TRUE):
  1. Express server starts and responds to health check
  2. Agent SDK initializes without error
  3. React client loads and displays initial UI
  4. Client can establish SSE/WebSocket connection to server
  5. UI kit components render correctly in new app
**Plans**: 3 plans created

Plans:
- [x] 01-01: Server scaffolding with Express and Agent SDK
- [ ] 01-02: React client with Vite and ui-kit integration
- [ ] 01-03: Connection layer (SSE/WebSocket)

### Phase 2: Core Streaming
**Goal**: Users can have streaming conversations with Claude
**Depends on**: Phase 1
**Requirements**: CORE-01, CORE-02, CORE-03, CORE-04, CORE-05, CORE-09, UI-01, UI-02, UI-03, UI-04
**Success Criteria** (what must be TRUE):
  1. User can send a message and see streaming response appear token by token
  2. Thinking blocks display during extended reasoning
  3. Multi-turn conversation maintains context across messages
  4. Markdown renders with syntax highlighting and copy buttons
  5. Context usage indicator shows token consumption
**Plans**: TBD

Plans:
- [ ] 02-01: Server streaming endpoint with SDKMessage forwarding
- [ ] 02-02: Chat UI with message list and input
- [ ] 02-03: Streaming renderer with markdown and thinking blocks

### Phase 3: Essential Tools
**Goal**: Core file and search tools work with visual feedback
**Depends on**: Phase 2
**Requirements**: TOOL-01, TOOL-06, TOOL-07, TOOL-11, TOOL-12, UI-05, UI-06, UI-12, UI-13
**Success Criteria** (what must be TRUE):
  1. Read tool displays file contents with syntax highlighting
  2. Glob tool finds files and displays results
  3. Grep tool searches content and shows matches
  4. Tool execution shows progress indicator while running
  5. Tool results collapse/expand and file paths are clickable
**Plans**: TBD

Plans:
- [ ] 03-01: Tool execution pipeline and progress indicators
- [ ] 03-02: Read tool with syntax highlighting
- [ ] 03-03: Glob and Grep tools with results display
- [ ] 03-04: File tree browser and diff viewer components

### Phase 4: Permissions & Modes
**Goal**: Users can approve/deny tool usage and switch execution modes
**Depends on**: Phase 3
**Requirements**: PERM-01, PERM-02, PERM-03, PERM-04, PERM-05, PERM-06, MODE-01, MODE-02, MODE-03, MODE-04, MODE-05, MODE-06
**Success Criteria** (what must be TRUE):
  1. Permission dialog appears for tool requiring approval
  2. User can approve, deny, or approve-always for tool
  3. AskUserQuestion renders as multi-select questionnaire dialog
  4. Plan mode restricts to read-only operations
  5. Mode indicator shows current mode and mode can be changed mid-session
**Plans**: TBD

Plans:
- [ ] 04-01: Permission callback surfacing to UI
- [ ] 04-02: Permission dialog components
- [ ] 04-03: Execution modes and mode switching

### Phase 5: Configuration System
**Goal**: Configuration files load from proper hierarchy
**Depends on**: Phase 2
**Requirements**: CONF-01, CONF-02, CONF-03, CONF-04, CONF-05
**Success Criteria** (what must be TRUE):
  1. CLAUDE.md files load from project/user hierarchy
  2. Settings load from .claude/settings.json with correct precedence
  3. Modular rules load from .claude/rules/*.md
  4. Working directory is configurable per session
  5. Environment variables pass through to tool execution
**Plans**: TBD

Plans:
- [ ] 05-01: CLAUDE.md and settings loading
- [ ] 05-02: Rules and environment configuration

### Phase 6: Extended Tools
**Goal**: All remaining tools work (Bash, Write, Edit, Web, Notebook)
**Depends on**: Phase 4
**Requirements**: TOOL-02, TOOL-03, TOOL-04, TOOL-05, TOOL-08, TOOL-09, TOOL-10, UI-11
**Success Criteria** (what must be TRUE):
  1. Write tool creates files with confirmation dialog
  2. Edit tool shows diff preview before applying changes
  3. Bash tool executes commands with streaming output
  4. Bash background execution works with BashOutput retrieval
  5. WebSearch and WebFetch tools display results
  6. TodoWrite shows task list panel
**Plans**: TBD

Plans:
- [ ] 06-01: Write and Edit tools with diff preview
- [ ] 06-02: Bash tool with streaming output
- [ ] 06-03: Web tools and notebook editing
- [ ] 06-04: TodoWrite visualization

### Phase 7: Hooks System
**Goal**: Hooks intercept and modify tool execution at all lifecycle points
**Depends on**: Phase 6
**Requirements**: HOOK-01, HOOK-02, HOOK-03, HOOK-04, HOOK-05, HOOK-06, HOOK-07, HOOK-08, HOOK-09, HOOK-10
**Success Criteria** (what must be TRUE):
  1. PreToolUse hooks can intercept and block tool calls
  2. PostToolUse hooks run after tool execution completes
  3. Hook matchers filter by tool name pattern
  4. SessionStart/SessionEnd hooks fire on lifecycle events
  5. Hooks can inject system messages and modify tool input
**Plans**: TBD

Plans:
- [ ] 07-01: Hook registration and execution pipeline
- [ ] 07-02: Tool hooks (Pre/Post)
- [ ] 07-03: Lifecycle and permission hooks

### Phase 8: Commands & Skills
**Goal**: Slash commands and skills system work
**Depends on**: Phase 5
**Requirements**: CMD-01, CMD-02, CMD-03, CMD-04, CMD-05, CMD-06, CMD-07, UI-07, UI-08, UI-09, UI-10
**Success Criteria** (what must be TRUE):
  1. Built-in slash commands available (/help, /clear, etc.)
  2. Custom commands load from .claude/commands/
  3. Commands support arguments and can run bash pre-execution
  4. Command palette UI triggered by /
  5. Keyboard shortcuts match Claude Code CLI
  6. Vim mode available for input
**Plans**: TBD

Plans:
- [ ] 08-01: Built-in slash commands
- [ ] 08-02: Custom commands and skills loading
- [ ] 08-03: Command palette UI
- [ ] 08-04: Keyboard shortcuts and vim mode

### Phase 9: Subagents
**Goal**: Task tool spawns subagents with visual tracking
**Depends on**: Phase 6
**Requirements**: AGENT-01, AGENT-02, AGENT-03, AGENT-04, AGENT-05, AGENT-06, AGENT-07
**Success Criteria** (what must be TRUE):
  1. Task tool spawns subagent with isolated context
  2. Built-in agent types work (Explore, Plan, general-purpose)
  3. Custom agent definitions load from options.agents
  4. Subagent messages display identified by parent relationship
  5. Subagent spawning shows visual animation and progress tracking
**Plans**: TBD

Plans:
- [ ] 09-01: Task tool and subagent spawning
- [ ] 09-02: Subagent message routing and display
- [ ] 09-03: Subagent visualization and progress

### Phase 10: MCP Integration
**Goal**: MCP servers connect and expose custom tools
**Depends on**: Phase 7
**Requirements**: MCP-01, MCP-02, MCP-03, MCP-04, MCP-05, MCP-06, MCP-07, MCP-08, INFRA-05, INFRA-06, INFRA-07, CORE-06, CORE-07, CORE-08, UI-14, UI-15
**Success Criteria** (what must be TRUE):
  1. Stdio MCP servers spawn local processes
  2. HTTP and SSE MCP servers connect to remote endpoints
  3. MCP tools discovered and added with mcp__{server}__{tool} naming
  4. MCP server status visible in UI
  5. Sessions persist to disk and can be resumed/forked
  6. Context auto-compaction summarizes when approaching limits
  7. Theme support (light/dark) and responsive layout work
**Plans**: TBD

Plans:
- [ ] 10-01: Stdio MCP server integration
- [ ] 10-02: HTTP/SSE MCP servers
- [ ] 10-03: MCP tool discovery and status UI
- [ ] 10-04: Session persistence and resumption
- [ ] 10-05: Context compaction and file checkpointing
- [ ] 10-06: Theme and responsive polish

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 10

Note: Phases 5 and 8 (Configuration, Commands) can run in parallel with Phases 3-4 and 6-7 respectively since they have independent dependencies.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Infrastructure Foundation | 1/3 | In progress | - |
| 2. Core Streaming | 0/3 | Not started | - |
| 3. Essential Tools | 0/4 | Not started | - |
| 4. Permissions & Modes | 0/3 | Not started | - |
| 5. Configuration System | 0/2 | Not started | - |
| 6. Extended Tools | 0/4 | Not started | - |
| 7. Hooks System | 0/3 | Not started | - |
| 8. Commands & Skills | 0/4 | Not started | - |
| 9. Subagents | 0/3 | Not started | - |
| 10. MCP Integration | 0/6 | Not started | - |

---
*Roadmap created: 2026-01-19*
*Last updated: 2026-01-19*
