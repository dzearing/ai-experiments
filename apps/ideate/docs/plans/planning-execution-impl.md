# Planning & Execution Implementation Plan

## Overview

Integrate the planning and execution workflow into Ideate, enabling ideas to progress through:
1. **Ideation** (existing) - Idea Agent helps shape the concept
2. **Planning** (new) - Plan Agent creates implementation plan with phases/tasks
3. **Execution** (new) - Claude Code Agent executes the plan with full tool access

Live kanban updates show progress bar and running duration for executing ideas.

---

## Phase 1: Data Model Extensions

### 1.1 Extend Idea Types

**File**: `apps/ideate/client/src/types/idea.ts`

```typescript
// Add to existing types:

export interface PlanTask {
  id: string;
  title: string;
  completed: boolean;
  inProgress?: boolean;
}

export interface PlanPhase {
  id: string;
  title: string;
  description?: string;
  tasks: PlanTask[];
  expanded?: boolean;
}

export interface IdeaPlan {
  phases: PlanPhase[];
  workingDirectory: string;      // Where execution happens
  repositoryUrl?: string;        // Optional git repo
  branch?: string;               // Branch to work on
  isClone?: boolean;             // Whether working on a copy
  createdAt: string;
  updatedAt: string;
}

// Extend IdeaExecutionState:
export interface IdeaExecutionState {
  progressPercent: number;
  waitingForFeedback: boolean;
  chatRoomId?: string;
  // New fields:
  startedAt?: string;            // When execution started
  currentPhaseId?: string;       // Active phase
  currentTaskId?: string;        // Active task
}

// Extend IdeaMetadata:
export interface IdeaMetadata {
  // ... existing fields ...
  plan?: IdeaPlan;               // Plan data (when status is 'exploring' or later)
}
```

### 1.2 Server-Side Types

**File**: `apps/ideate/server/src/types/idea.ts` (create or extend)

Mirror the client types for server-side validation.

---

## Phase 2: Plan Agent Implementation

### 2.1 Plan Agent System Prompt

**File**: `apps/ideate/server/src/prompts/planAgent.md`

```markdown
You are the Plan Agent for Ideate. Your role is to help users create detailed implementation plans for their ideas.

## Your Capabilities
- Break down ideas into implementation phases
- Create specific, actionable tasks within each phase
- Suggest architecture and technical approach
- Identify dependencies and risks
- Create diagrams and documentation

## Plan Structure
Every plan you create should include:
1. **Phases**: Major milestones (3-5 typically)
2. **Tasks**: Specific actions within each phase (3-7 per phase)
3. **Working Directory**: Where the work will happen
4. **Prerequisites**: What's needed before execution

## Output Format
When creating/updating a plan, output structured XML:
<plan_update>
{
  "phases": [...],
  "workingDirectory": "/path/to/work",
  "repositoryUrl": "optional",
  "branch": "optional"
}
</plan_update>

## Guidelines
- Be specific about tasks - vague tasks are hard to execute
- Consider testing as part of each phase
- Include error handling and edge cases
- Suggest working on a copy/branch for safety when appropriate
```

### 2.2 Plan Agent Service

**File**: `apps/ideate/server/src/services/PlanAgentService.ts`

```typescript
// Pattern: Follow IdeaAgentService structure
// - Use query() from claude-agent-sdk
// - Stream responses via callbacks
// - Parse <plan_update> blocks for structured output
// - Support conversation history for refinement
```

### 2.3 Plan Agent WebSocket Handler

**File**: `apps/ideate/server/src/websocket/PlanAgentWebSocketHandler.ts`

```typescript
// Pattern: Follow IdeaAgentWebSocketHandler
// WebSocket endpoint: /plan-agent-ws
// Messages: 'message', 'plan_update', 'complete', 'error'
```

---

## Phase 3: Execution Agent Implementation

### 3.1 Execution Agent System Prompt

**File**: `apps/ideate/server/src/prompts/executionAgent.md`

The Execution Agent uses Claude Code's system prompt (from SDK) with additional context:

```markdown
{{CLAUDE_CODE_SYSTEM_PROMPT}}

## Execution Context

You are executing a plan for the idea: "{{IDEA_TITLE}}"

### Plan Overview
{{PLAN_PHASES_SUMMARY}}

### Current Phase
Phase {{CURRENT_PHASE_NUMBER}}: {{CURRENT_PHASE_TITLE}}
{{CURRENT_PHASE_TASKS}}

### Working Directory
{{WORKING_DIRECTORY}}

### Safety Guidelines
- NEVER delete or overwrite files outside the working directory
- ALWAYS confirm before destructive operations
- Create backups before major changes
- Commit frequently with meaningful messages
- Report progress after completing each task

### Progress Reporting
After completing each task, output:
<task_complete>
{
  "taskId": "task-id",
  "phaseId": "phase-id"
}
</task_complete>

When a phase is complete:
<phase_complete>
{
  "phaseId": "phase-id"
}
</phase_complete>
```

### 3.2 Execution Agent Service

**File**: `apps/ideate/server/src/services/ExecutionAgentService.ts`

```typescript
import { query, createSdkMcpServer, type SDKAssistantMessage } from '@anthropic-ai/claude-agent-sdk';
import { createIdeateMcpTools } from './IdeateMcpTools.js';

export class ExecutionAgentService {
  async executePhase(
    ideaId: string,
    phaseId: string,
    plan: IdeaPlan,
    userId: string,
    callbacks: ExecutionCallbacks
  ): Promise<void> {
    const systemPrompt = buildExecutionSystemPrompt(plan, phaseId);

    // Create Ideate MCP server with idea creation tools
    const ideateMcpServer = createIdeateMcpServer(userId, plan.workspaceId);

    const response = query({
      prompt: `Execute Phase: ${phase.title}`,
      options: {
        systemPrompt,
        model: 'claude-sonnet-4-5-20250929',
        permissionMode: 'acceptEdits',  // Auto-accept file edits
        cwd: plan.workingDirectory,
        maxTurns: 50,  // More iterations for execution
        includePartialMessages: true,
        // Full Claude Code tools PLUS Ideate MCP tools
        mcpServers: { ideate: ideateMcpServer },
      }
    });

    for await (const message of response) {
      // Handle streaming, tool use, task completion
      // Parse <task_complete> and <phase_complete> blocks
      // Update idea execution state in real-time
    }
  }
}
```

### 3.4 Ideate MCP Tools for Execution

**File**: `apps/ideate/server/src/services/IdeateMcpTools.ts`

```typescript
import { tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';

export function createIdeateMcpServer(userId: string, workspaceId?: string) {
  return createSdkMcpServer({
    name: 'ideate',
    version: '1.0.0',
    tools: [
      tool(
        'create_idea',
        'Create a new idea in Ideate (for follow-up work, improvements, or related features)',
        {
          title: z.string().describe('Title of the new idea'),
          summary: z.string().describe('Brief summary'),
          tags: z.array(z.string()).optional().describe('Tags for categorization'),
          description: z.string().optional().describe('Detailed description'),
          parentIdeaId: z.string().optional().describe('ID of parent idea if this is a follow-up'),
        },
        async (args) => {
          // Create idea via IdeaService
          const idea = await ideaService.createIdea({
            ...args,
            workspaceId,
            source: 'ai',
          }, userId);
          return {
            content: [{
              type: 'text' as const,
              text: `Created idea: "${idea.title}" (${idea.id})`,
            }],
          };
        }
      ),
      tool(
        'list_ideas',
        'List existing ideas in the current workspace',
        {
          status: z.enum(['new', 'exploring', 'executing', 'archived']).optional(),
        },
        async (args) => {
          const ideas = await ideaService.getIdeas(workspaceId, args.status);
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify(ideas.map(i => ({ id: i.id, title: i.title, status: i.status })), null, 2),
            }],
          };
        }
      ),
      tool(
        'update_idea',
        'Update an existing idea',
        {
          ideaId: z.string().describe('ID of the idea to update'),
          title: z.string().optional(),
          summary: z.string().optional(),
          tags: z.array(z.string()).optional(),
          description: z.string().optional(),
        },
        async (args) => {
          const { ideaId, ...updates } = args;
          await ideaService.updateIdea(ideaId, updates, userId);
          return {
            content: [{
              type: 'text' as const,
              text: `Updated idea ${ideaId}`,
            }],
          };
        }
      ),
    ]
  });
}
```

### 3.3 Execution Agent WebSocket Handler

**File**: `apps/ideate/server/src/websocket/ExecutionAgentWebSocketHandler.ts`

```typescript
// WebSocket endpoint: /execution-agent-ws
// Messages:
// - 'start_execution': Begin executing a phase
// - 'text_chunk': Streaming response
// - 'tool_use': Tool invocation (bash, file operations)
// - 'tool_result': Tool output
// - 'task_complete': Individual task done
// - 'phase_complete': Phase done
// - 'execution_error': Error occurred
// - 'waiting_for_feedback': Needs user input
```

---

## Phase 4: Frontend UX Components

### 4.1 Planning Overlay

**File**: `apps/ideate/client/src/components/PlanningOverlay/PlanningOverlay.tsx`

Replace/extend IdeaWorkspaceOverlay for planning phase:

```
┌─────────────────────────────────────────────────────────────┐
│ Plan Your Idea: "Real-time Collaboration"         [Close]  │
├─────────────────────────────┬───────────────────────────────┤
│  Plan Agent Chat            │  Resources Tabs              │
│                             │  [Idea Doc] [Plan] [Diagram]  │
│  > Create implementation    │  ┌───────────────────────────┐ │
│    plan                     │  │ Phase 1: Infrastructure   │ │
│                             │  │  ☐ Install dependencies   │ │
│  < I've created a 3-phase   │  │  ☐ Create provider       │ │
│    plan with 12 tasks...    │  │ Phase 2: Presence        │ │
│                             │  │  ☐ Awareness protocol    │ │
├─────────────────────────────┤  │ Phase 3: Integration     │ │
│ [Input: Type a message...]  │  │  ☐ Editor integration    │ │
└─────────────────────────────┴───────────────────────────────┘
```

Key features:
- SplitPane with chat on left, resources on right
- VS Code-style tabs for resources
- PlanView component showing phases/tasks
- "Start Execution" button when plan is ready

### 4.2 Execution Overlay

**File**: `apps/ideate/client/src/components/ExecutionOverlay/ExecutionOverlay.tsx`

```
┌─────────────────────────────────────────────────────────────┐
│ Execute: "Real-time Collaboration"   [Phase 1/3] [Pause]   │
├─────────────────────────────┬───────────────────────────────┤
│  Claude Code Chat           │  [Plan] [Files] [Terminal]    │
│                             │  ┌───────────────────────────┐ │
│  $ pnpm add yjs            │  │ Phase 1: Infrastructure   │ │
│  Added 3 packages...        │  │  ✓ Install dependencies   │ │
│                             │  │  ⟳ Create provider        │ │
│  Creating provider.ts...    │  │  ☐ WebSocket server      │ │
│                             │  │ Phase 2: Presence        │ │
│                             │  │  ☐ Awareness protocol    │ │
├─────────────────────────────┤  └───────────────────────────┘ │
│ [Input: Ask or give feedback]                               │
└─────────────────────────────────────────────────────────────┘
```

Key features:
- Shows tool execution in real-time
- Progress spinner on current task
- Ability to pause/resume execution
- Feedback input for iterations

### 4.3 Hooks

**File**: `apps/ideate/client/src/hooks/usePlanAgent.ts`
- WebSocket connection to plan agent
- Message history management
- Plan update handling

**File**: `apps/ideate/client/src/hooks/useExecutionAgent.ts`
- WebSocket connection to execution agent
- Real-time progress updates
- Task/phase completion handling

---

## Phase 5: Kanban Live Updates

### 5.1 Enhanced IdeaCard

**File**: `apps/ideate/client/src/components/IdeaCard/IdeaCard.tsx`

Add to executing ideas:
- Progress bar showing completion percentage
- Running duration counter (since startedAt)
- Current phase/task indicator
- Spinner when actively working

```tsx
{idea.status === 'executing' && idea.execution && (
  <div className={styles.executionStatus}>
    <Progress value={idea.execution.progressPercent} size="sm" />
    <Text size="xs" color="secondary">
      {formatDuration(idea.execution.startedAt)} • Phase {currentPhaseNum}/{totalPhases}
    </Text>
    {idea.execution.currentTaskId && <Spinner size="xs" />}
  </div>
)}
```

### 5.2 Real-Time Updates

**File**: `apps/ideate/client/src/hooks/useWorkspaceSocket.ts`

Add handlers for execution updates:
```typescript
socket.on('execution:progress', (data) => {
  // Update idea execution state
  setIdeas(prev => prev.map(idea =>
    idea.id === data.ideaId
      ? { ...idea, execution: { ...idea.execution, ...data } }
      : idea
  ));
});
```

---

## Phase 6: Working Directory Safety

### 6.1 Pre-Execution Checks

Before starting execution, validate:
1. Working directory exists and is writable
2. If repo, it's on correct branch
3. No uncommitted changes (warn user)
4. Clone option available for safety

### 6.2 Clone/Branch Strategy

**File**: `apps/ideate/server/src/services/WorkspaceSetupService.ts`

```typescript
export class WorkspaceSetupService {
  async prepareWorkspace(plan: IdeaPlan): Promise<string> {
    if (plan.isClone) {
      // Clone repo to temp directory
      const tempDir = await this.cloneRepository(plan.repositoryUrl);
      return tempDir;
    }
    if (plan.branch) {
      // Create/checkout branch
      await this.checkoutBranch(plan.workingDirectory, plan.branch);
    }
    return plan.workingDirectory;
  }
}
```

---

## Implementation Order

### Milestone 1: Data Model & Types (Day 1)
1. [ ] Extend `idea.ts` with PlanPhase, PlanTask, IdeaPlan
2. [ ] Add plan field to IdeaMetadata
3. [ ] Extend IdeaExecutionState with timing fields
4. [ ] Server-side type definitions

### Milestone 2: Plan Agent (Days 2-3)
1. [ ] Create `planAgent.md` system prompt
2. [ ] Implement `PlanAgentService.ts`
3. [ ] Implement `PlanAgentWebSocketHandler.ts`
4. [ ] Create `usePlanAgent.ts` hook
5. [ ] Test plan generation end-to-end

### Milestone 3: Planning UX (Days 4-5)
1. [ ] Create `PlanningOverlay` component
2. [ ] Implement `PlanView` component (from mocks)
3. [ ] Add VS Code-style tabs for resources
4. [ ] Connect to Plan Agent via WebSocket
5. [ ] Add "Start Execution" transition

### Milestone 4: Execution Agent (Days 6-8)
1. [ ] Create `executionAgent.md` system prompt
2. [ ] Implement `ExecutionAgentService.ts`
3. [ ] Implement `ExecutionAgentWebSocketHandler.ts`
4. [ ] Create `useExecutionAgent.ts` hook
5. [ ] Parse task/phase completion events

### Milestone 5: Execution UX (Days 9-10)
1. [ ] Create `ExecutionOverlay` component
2. [ ] Real-time tool execution display
3. [ ] Progress tracking UI
4. [ ] Pause/resume functionality
5. [ ] Feedback input for iterations

### Milestone 6: Kanban Updates (Day 11)
1. [ ] Enhance `IdeaCard` with progress bar
2. [ ] Add duration counter
3. [ ] Real-time WebSocket updates
4. [ ] Current phase/task indicator

### Milestone 7: Safety & Polish (Day 12)
1. [ ] Pre-execution validation
2. [ ] Clone/branch workspace setup
3. [ ] Error handling and recovery
4. [ ] Testing end-to-end flow

---

## Key Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `client/src/types/idea.ts` | Modify | Add PlanPhase, PlanTask, IdeaPlan |
| `server/src/prompts/planAgent.md` | Create | Plan Agent system prompt |
| `server/src/prompts/executionAgent.md` | Create | Execution Agent system prompt |
| `server/src/services/PlanAgentService.ts` | Create | Plan Agent service |
| `server/src/services/ExecutionAgentService.ts` | Create | Execution Agent service |
| `server/src/services/IdeateMcpTools.ts` | Create | Ideate MCP tools (create_idea, list_ideas, update_idea) |
| `server/src/websocket/PlanAgentWebSocketHandler.ts` | Create | Plan Agent WebSocket |
| `server/src/websocket/ExecutionAgentWebSocketHandler.ts` | Create | Execution Agent WebSocket |
| `client/src/hooks/usePlanAgent.ts` | Create | Plan Agent hook |
| `client/src/hooks/useExecutionAgent.ts` | Create | Execution Agent hook |
| `client/src/components/PlanningOverlay/` | Create | Planning UI |
| `client/src/components/ExecutionOverlay/` | Create | Execution UI |
| `client/src/components/IdeaCard/IdeaCard.tsx` | Modify | Add progress bar, duration |
| `server/src/services/WorkspaceSetupService.ts` | Create | Clone/branch management |

---

## Notes

- The Plan Agent is a new agent type following the IdeaAgentService pattern
- The Execution Agent uses Claude Code's full capabilities PLUS Ideate MCP tools
- Real-time updates use existing WebSocket infrastructure
- Safety is critical - always work on copies/branches when possible

### Progress Calculation

Progress depends on execution mode:

**Mode: Execute All Phases (continuous)**
```typescript
progressPercent = completedTasks / totalTasksAcrossAllPhases * 100
```

**Mode: Execute Phase by Phase (pause after each)**
```typescript
progressPercent = completedTasksInCurrentPhase / totalTasksInCurrentPhase * 100
```

The execution mode is determined when starting execution:
```typescript
interface ExecutionOptions {
  mode: 'all-phases' | 'phase-by-phase';
  startPhaseId?: string;  // For resuming at a specific phase
}
```

This is configured in the UI when user clicks "Start Execution" or "Continue to Next Phase".
