# Bug Fixes Plan: Execution, Persistence, and UI State

This document outlines a comprehensive plan to fix multiple related bugs in the Ideate application.

## Bug Summary

| # | Bug | Priority | Complexity |
|---|-----|----------|------------|
| 1 | IDEA workflow doesn't start when wrong tab selected | High | Medium |
| 2 | Ideas not persisted until planning phase | High | Low |
| 3 | Tool execution/states not persisted correctly | Critical | High |
| 4 | Idea cards don't show execution progress | Medium | Medium |
| 5 | Execute button has delay before "in progress" state | Low | Low |
| 6 | Missing play/pause button in dialog header | Medium | Low |
| 7 | Phase executed twice (duplicate execution) | Critical | Medium |

---

## Phase 1: Fix Duplicate Phase Execution (Bug #7)

**Root Cause Analysis:**
The auto-continue effect in `IdeaDialog.tsx` can trigger multiple times because:
1. `completedPhaseId` state is set, triggering the effect
2. If any dependency (`plan`, `executeAgent`, `executionIdeaContext`) changes during the 500ms timeout, the effect re-runs
3. The `startExecution` call happens again before `setCompletedPhaseId(null)` clears the state

**Fix:**

### File: `apps/ideate/client/src/components/IdeaDialog/IdeaDialog.tsx`

```typescript
// Add a ref to track if auto-continue is already in progress
const autoContinueInProgressRef = useRef(false);

// Update the auto-continue effect
useEffect(() => {
  const phases = plan?.phases;
  if (!completedPhaseId || !phases || pauseBetweenPhasesRef.current) return;

  // Prevent duplicate execution
  if (autoContinueInProgressRef.current) return;

  const completedIndex = phases.findIndex(p => p.id === completedPhaseId);
  const nextPhase = completedIndex >= 0 && completedIndex < phases.length - 1
    ? phases[completedIndex + 1]
    : null;

  if (nextPhase) {
    autoContinueInProgressRef.current = true;
    const timerId = setTimeout(() => {
      const fullPlan: IdeaPlan = { /* ... */ };
      executeAgent.startExecution(executionIdeaContext, fullPlan, nextPhase.id);
      setCompletedPhaseId(null);
      autoContinueInProgressRef.current = false;
    }, 500);
    return () => {
      clearTimeout(timerId);
      autoContinueInProgressRef.current = false;
    };
  } else {
    setCompletedPhaseId(null);
  }
}, [completedPhaseId, plan, executeAgent, executionIdeaContext]);
```

**Testing:**
1. Create a plan with 3+ phases
2. Execute with "Pause between phases" UNCHECKED
3. Verify each phase executes exactly once
4. Check server logs for `[ExecutionAgentService] Starting execution of phase` - should see each phase ID only once

---

## Phase 2: Fix Tool/Message Persistence Sequence (Bug #3)

**Root Cause Analysis:**
Currently, the entire response is accumulated in `session.accumulatedResponse` and saved as ONE message at the end. Tool calls are attached as a separate array. When rehydrated:
- All text appears first
- All tool calls appear at the bottom
- Tool states show "in progress" because their output wasn't saved during streaming

**Fix Strategy:**
Save messages incrementally during streaming, not just at the end.

### File: `apps/ideate/server/src/services/ExecutionAgentService.ts`

**Changes needed:**

1. **Track message segments during streaming:**
```typescript
interface MessageSegment {
  type: 'text' | 'tool';
  content?: string;
  toolCall?: { name: string; input?: Record<string, unknown>; output?: string };
  timestamp: number;
}

// Add to ExecutionSession:
messageSegments: MessageSegment[];
lastTextSegmentId?: string;
```

2. **When text arrives after a tool, create a new segment:**
```typescript
// In processStreamMessage, when processing text blocks:
if (session.pendingTools.length > 0 || session.completedToolCalls.length > 0) {
  // Text arriving after tools - save previous content and start new segment
  if (session.accumulatedResponse.trim()) {
    await this.saveCurrentSegment(session, ideaId, userId);
    session.accumulatedResponse = '';
  }
}
session.accumulatedResponse += textToAppend;
```

3. **When a tool completes, save it immediately:**
```typescript
// When tool_result is received or completePendingTools is called:
session.completedToolCalls.push(toolCall);
// Save the tool call as a separate message segment
await this.chatService.addMessage(ideaId, userId, 'assistant', '', {
  type: 'tool_use',
  toolName: toolCall.name,
  toolCalls: [toolCall],
});
```

4. **Update message loading to preserve order:**
The `getMessages` already returns in chronological order, but we need to ensure each segment has the correct timestamp for proper ordering.

### File: `apps/ideate/server/src/services/ExecutionAgentChatService.ts`

Add a method to save tool calls as separate entries:
```typescript
async addToolMessage(
  ideaId: string,
  userId: string,
  toolCall: StoredToolCall,
  timestamp?: number
): Promise<ExecutionAgentMessage> {
  return this.addMessage(ideaId, userId, 'assistant', '', {
    type: 'tool_use',
    toolName: toolCall.name,
    toolCalls: [toolCall],
  });
}
```

### Client: `apps/ideate/client/src/hooks/useExecutionAgent.ts`

Ensure history loading preserves tool call sequence:
```typescript
case 'history':
  if (data.messages) {
    // Messages already come in order, just set them
    // Each message may have toolCalls already attached
    setMessages(data.messages);
  }
  break;
```

**Testing:**
1. Start execution that uses multiple tools
2. Close dialog mid-execution
3. Reopen dialog
4. Verify:
   - Messages appear in correct sequence (text, tool, text, tool...)
   - Tool calls show correct state (completed with output, not "in progress")
   - No duplicate tools or missing content

---

## Phase 3: Fix Early Idea Persistence (Bug #2)

**Root Cause Analysis:**
The `IdeaDialog` only saves ideas when:
1. User clicks "Next: Planning" button
2. Dialog closes with valid content (auto-save in useEffect)

But ideas should be persisted as soon as meaningful content exists.

**Fix Strategy:**
Add debounced auto-save during ideation phase.

### File: `apps/ideate/client/src/components/IdeaDialog/IdeaDialog.tsx`

```typescript
// Add debounced save effect
const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

useEffect(() => {
  // Only auto-save during ideation phase for new ideas
  if (!isInitialized || phase !== 'ideation') return;

  const { title, summary } = parsedContent;

  // Don't save if content is minimal/placeholder
  if (!title.trim() || title === 'Untitled Idea' || !summary.trim()) return;

  // Already have an ID - update existing
  if (currentIdea?.id) {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      const { title, summary, tags, description } = parsedContent;
      await updateIdea(currentIdea.id, {
        title: title.trim(),
        summary: summary.trim(),
        tags,
        description: description.trim() || undefined,
      });
      hasDocumentChanges.current = false;
    }, 2000); // 2 second debounce
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }

  // New idea with valid content - create it
  if (!currentIdea && title.trim() && title !== 'Untitled Idea' && summary.trim()) {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      const { title, summary, tags, description } = parsedContent;
      const newIdea = await createIdea({
        title: title.trim(),
        summary: summary.trim(),
        tags,
        description: description.trim() || undefined,
        workspaceId,
        thingIds: initialThingIds,
      });
      setCurrentIdea(newIdea);
      onSuccess?.(newIdea);
      hasDocumentChanges.current = false;
    }, 2000);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }
}, [isInitialized, phase, parsedContent, currentIdea, updateIdea, createIdea, workspaceId, initialThingIds, onSuccess]);
```

**Testing:**
1. Create new idea via facilitator
2. Let Idea Agent write the document
3. Wait 3+ seconds after agent finishes
4. Close dialog WITHOUT clicking "Next: Planning"
5. Verify idea appears in Kanban board
6. Reopen idea - content should be preserved

---

## Phase 4: Fix Facilitator Tab Selection (Bug #1)

**Root Cause Analysis:**
When facilitator creates an idea under a Thing, the workflow opens the IdeaDialog but doesn't ensure the correct tab is selected in the parent Thing's details pane.

**Fix Location:**
The fix needs to happen in the facilitator workflow that handles `idea_create` results.

### File: `apps/ideate/client/src/contexts/FacilitatorContext.tsx` (or similar workflow handler)

Look for the handler that receives `idea_create` results and add tab selection:

```typescript
// When idea_create is called with thingIds:
if (thingIds && thingIds.length > 0) {
  // 1. Select the parent thing
  selectThing(thingIds[0]);

  // 2. Switch to Ideas tab in details
  setDetailsTab('ideas');

  // 3. Open the idea dialog
  openIdeaDialog({ thingIds, ... });
}
```

### File: May need to add to context or use existing navigation methods

Need to expose `setDetailsTab` from whatever context manages the details pane tabs.

**Testing:**
1. Select a Thing
2. Switch to Documents tab in details pane
3. Press Cmd+Period, ask facilitator to create idea under that Thing
4. Verify:
   - Thing stays selected
   - Details pane switches to Ideas tab
   - IdeaDialog opens

---

## Phase 5: Fix Idea Card Execution Display (Bug #4)

**Root Cause Analysis:**
The IdeaCard component reads execution state from the idea's metadata, but:
1. State updates may not be pushed to the client in real-time
2. The "waiting for input" badge logic may not be triggered correctly

**Fix Strategy:**

### File: `apps/ideate/client/src/components/IdeaCard/IdeaCard.tsx`

Ensure proper display of all states:

```typescript
// Improve execution state display
const isWaitingForInput = execution?.waitingForFeedback === true;
const isActivelyExecuting = isExecuting && !isWaitingForInput && execution?.currentTaskId;

// Add visual indicators
{isActivelyExecuting && <Spinner size="sm" />}
{isWaitingForInput && (
  <Badge variant="warning">Waiting for input</Badge>
)}
```

### File: `apps/ideate/server/src/services/IdeaService.ts`

Ensure `waitingForFeedback` is properly set when execution blocks:

```typescript
// In updateExecutionStateInternal:
if (updates.waitingForFeedback !== undefined) {
  metadata.execution.waitingForFeedback = updates.waitingForFeedback;
  // Notify subscribers of state change
}
```

### File: `apps/ideate/client/src/contexts/IdeasContext.tsx`

Add subscription to execution state changes so cards update in real-time.

**Testing:**
1. Execute a plan that will block (needs user input)
2. Minimize/close dialog
3. View Kanban board
4. Verify:
   - Card shows "Waiting for input" badge
   - Card bubbles to top of Executing lane
   - Spinner shows when actively working

---

## Phase 6: Fix Execute Button Delay (Bug #5)

**Root Cause Analysis:**
When clicking "Execute", the `session_state` dispatch happens but there's a delay before the Claude Agent SDK actually starts streaming.

**Fix:**
Show optimistic "in progress" state immediately.

### File: `apps/ideate/client/src/components/IdeaDialog/IdeaDialog.tsx`

```typescript
const handleStartExecution = useCallback(() => {
  // ... validation ...

  // Immediately show executing state (optimistic update)
  setPhase('executing');
  setActiveTab('exec-plan');

  // The executeAgent.startExecution will update the real state
  executeAgent.startExecution(executionIdeaContext, fullPlan, firstPhaseId);
}, [...]);
```

### File: `apps/ideate/client/src/hooks/useExecutionAgent.ts`

Ensure `isExecuting` is set true immediately when starting:

```typescript
const startExecution = useCallback((...) => {
  // Set executing state BEFORE sending to server
  setIsExecuting(true);
  setSessionState({ status: 'running', ... });

  // Then send to server
  ws.send(JSON.stringify({ type: 'start_execution', ... }));
}, [...]);
```

**Testing:**
1. Create a plan
2. Click "Execute"
3. Verify chat shows "in progress" immediately (no 1-2 second delay)

---

## Phase 7: Add Play/Pause Button to Header (Feature #6)

### File: `apps/ideate/client/src/components/IdeaDialog/IdeaDialog.tsx`

Add to header section:

```typescript
// In header section, add execution controls
<header className={styles.header}>
  <div className={styles.headerLeft}>
    <h1 className={styles.headerTitle}>...</h1>
    {/* ... linked things ... */}
  </div>
  <div className={styles.headerActions}>
    {/* Play/Pause button during execution */}
    {phase === 'executing' && (
      executeAgent.isExecuting ? (
        <IconButton
          icon={<PauseIcon />}
          variant="ghost"
          onClick={executeAgent.pauseExecution}
          aria-label="Pause execution"
        />
      ) : executeAgent.isPaused ? (
        <IconButton
          icon={<PlayIcon />}
          variant="primary"
          onClick={executeAgent.resumeExecution}
          aria-label="Resume execution"
        />
      ) : null
    )}
    <IconButton
      icon={<CloseIcon />}
      variant="ghost"
      size="md"
      onClick={handleCloseRequest}
      aria-label="Close"
    />
  </div>
</header>
```

### File: `apps/ideate/client/src/components/IdeaDialog/IdeaDialog.module.css`

Ensure header actions have proper spacing:

```css
.headerActions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
```

**Testing:**
1. Start execution
2. Verify Pause button appears in header
3. Click Pause - verify icon changes to Play
4. Click Play - verify execution resumes

---

## Implementation Order

1. **Phase 1: Duplicate Execution Fix** (Critical - blocks other testing)
2. **Phase 3: Early Persistence** (High impact, low complexity)
3. **Phase 6: Execute Button Delay** (Quick win)
4. **Phase 7: Play/Pause Header** (Quick win)
5. **Phase 2: Tool Persistence** (Complex, high impact)
6. **Phase 4: Tab Selection** (Medium complexity)
7. **Phase 5: Card Display** (Depends on real-time updates)

---

## Testing Checklist

### After Each Phase:
- [ ] TypeScript compiles without errors
- [ ] No console errors in browser
- [ ] No server errors in logs
- [ ] Feature works as expected
- [ ] No regression in related features

### Full Integration Test:
1. [ ] Create idea via facilitator (Tab switching works)
2. [ ] Idea persists during ideation (Auto-save works)
3. [ ] Move to planning, create plan
4. [ ] Execute plan with multiple phases
5. [ ] Close/reopen during execution (Messages preserved correctly)
6. [ ] Use play/pause controls
7. [ ] Verify Kanban cards show correct state
8. [ ] Complete execution - verify all phases run exactly once
