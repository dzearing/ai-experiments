# Phase 4: Permissions & Modes - Research

**Researched:** 2026-01-19
**Domain:** SDK permission handling, canUseTool callback, permission dialogs, execution modes, AskUserQuestion tool
**Confidence:** HIGH

## Summary

Phase 4 implements the permission and mode system that gives users control over tool execution. Currently the application uses `bypassPermissions` mode for simplicity (decided in Phase 2). This phase replaces that with a proper permission UI where users can approve, deny, or approve-always for tool requests, plus execution mode switching.

The key technical challenges are:

1. **canUseTool Callback Integration** - The SDK's `canUseTool` callback surfaces permission requests to the UI. This is a Promise-based API that pauses execution until the user responds (60-second timeout).
2. **Permission Dialog UI** - A dialog showing tool name, input parameters, and approve/deny/approve-always options.
3. **AskUserQuestion Handling** - The SDK's clarifying questions tool (`AskUserQuestion`) needs to render as a multi-select questionnaire dialog. The `OpenQuestionsResolver` component in ui-kit already handles this pattern.
4. **Mode Switching** - The SDK supports dynamic mode changes via `query.setPermissionMode()` during streaming sessions.
5. **Permission Rules** - Wildcard patterns for auto-approve/deny rules (stored in session or settings).

**Primary recommendation:** Implement `canUseTool` callback on the server that forwards permission requests to the client via SSE, use a bidirectional channel (WebSocket or POST endpoint) for client responses, and leverage the existing `OpenQuestionsResolver` component for AskUserQuestion rendering.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@anthropic-ai/claude-agent-sdk` | 0.2.12+ | canUseTool callback, permission modes | Official SDK with permission handling |
| `@ui-kit/react` | workspace | Dialog, Segmented, Button components | Existing dialog and control components |
| `@ui-kit/react-chat` | workspace | OpenQuestionsResolver | Existing questionnaire component for AskUserQuestion |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `minimatch` | ^10.0.0 | Wildcard pattern matching | For permission rule patterns like `Read:*` or `Bash:npm *` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| WebSocket for responses | POST endpoint | WebSocket is already planned, but POST is simpler for request-response |
| Custom questionnaire | OpenQuestionsResolver | Component already exists, handles single/multi-select, keyboard navigation |
| Manual rule parsing | minimatch | minimatch handles glob patterns properly, avoids regex edge cases |

**Installation:**
```bash
# Server - pattern matching for permission rules
cd apps/claude-code-web/server
pnpm add minimatch

# Client - no new dependencies, use workspace packages
```

## Architecture Patterns

### Recommended Project Structure
```
apps/claude-code-web/
├── server/src/
│   ├── routes/
│   │   └── agent.ts              # Enhanced with permission endpoints
│   ├── services/
│   │   ├── agentService.ts       # canUseTool callback implementation
│   │   └── permissionService.ts  # NEW: Permission rule management
│   └── types/
│       └── index.ts              # Permission types
└── client/src/
    ├── components/
    │   ├── ChatView.tsx          # Integration point
    │   ├── PermissionDialog.tsx  # NEW: Tool approval dialog
    │   ├── AskUserDialog.tsx     # NEW: Wraps OpenQuestionsResolver
    │   ├── ModeIndicator.tsx     # NEW: Current mode display
    │   └── ModeSelector.tsx      # NEW: Mode switching control
    ├── hooks/
    │   ├── useAgentStream.ts     # Enhanced for permission events
    │   └── usePermissions.ts     # NEW: Permission state management
    ├── types/
    │   └── agent.ts              # Permission event types
    └── contexts/
        └── PermissionContext.tsx # NEW: Permission rules context
```

### Pattern 1: Permission Request Flow (Server to Client to Server)
**What:** Bidirectional communication for permission decisions
**When to use:** Every time SDK needs user approval
**Flow:**
```
SDK calls canUseTool → Server receives request
                     → Server sends SSE event to client (type: 'permission_request')
                     → Client shows PermissionDialog
                     → User clicks approve/deny
                     → Client POSTs response to /api/agent/permission-response
                     → Server resolves canUseTool Promise
                     → SDK continues or aborts
```

**Example:**
```typescript
// Server: agentService.ts
interface PendingPermission {
  resolve: (result: PermissionResult) => void;
  reject: (error: Error) => void;
  toolName: string;
  input: ToolInput;
  timestamp: number;
}

const pendingPermissions = new Map<string, PendingPermission>();

const canUseTool: CanUseTool = async (toolName, input, { signal }) => {
  const requestId = uuidv4();

  // Send to client via SSE
  sendSSEEvent(sessionId, {
    type: 'permission_request',
    requestId,
    toolName,
    input,
    timestamp: Date.now(),
  });

  // Wait for client response (with timeout)
  return new Promise<PermissionResult>((resolve, reject) => {
    pendingPermissions.set(requestId, { resolve, reject, toolName, input, timestamp: Date.now() });

    // SDK timeout is 60s, we use 55s to respond before SDK times out
    const timeout = setTimeout(() => {
      pendingPermissions.delete(requestId);
      resolve({ behavior: 'deny', message: 'Permission request timed out' });
    }, 55000);

    signal.addEventListener('abort', () => {
      clearTimeout(timeout);
      pendingPermissions.delete(requestId);
    });
  });
};
```

### Pattern 2: AskUserQuestion Handling
**What:** Route AskUserQuestion tool to questionnaire dialog
**When to use:** When toolName === 'AskUserQuestion'
**Example:**
```typescript
// Server: detect AskUserQuestion and forward differently
const canUseTool: CanUseTool = async (toolName, input, { signal }) => {
  if (toolName === 'AskUserQuestion') {
    const requestId = uuidv4();

    // Send as question_request instead of permission_request
    sendSSEEvent(sessionId, {
      type: 'question_request',
      requestId,
      questions: (input as AskUserQuestionInput).questions,
      timestamp: Date.now(),
    });

    return waitForResponse(requestId, signal);
  }

  // Normal permission flow
  return handlePermissionRequest(toolName, input, signal);
};

// Client: route to OpenQuestionsResolver
function handleQuestionRequest(event: QuestionRequestEvent) {
  const openQuestions: OpenQuestion[] = event.questions.map(q => ({
    id: q.question, // Use question text as ID per SDK spec
    question: q.question,
    context: undefined,
    selectionType: q.multiSelect ? 'multiple' : 'single',
    options: q.options.map(opt => ({
      id: opt.label,
      label: opt.label,
      description: opt.description,
    })),
    allowCustom: true, // SDK always supports "Other" option
  }));

  return openQuestions;
}

// Response format matches SDK expectation
function formatQuestionResponse(result: OpenQuestionsResult): AskUserQuestionInput {
  const answers: Record<string, string> = {};

  for (const answer of result.answers) {
    const selectedLabels = answer.selectedOptionIds.filter(id => id !== 'custom');
    const customText = answer.customText?.trim();

    // Multi-select: join with ", "
    // Custom: use custom text
    // Single: use the label
    if (customText && answer.selectedOptionIds.includes('custom')) {
      answers[answer.questionId] = customText;
    } else {
      answers[answer.questionId] = selectedLabels.join(', ');
    }
  }

  return {
    questions: originalQuestions,
    answers,
  };
}
```

### Pattern 3: Permission Mode Switching
**What:** Change permission mode mid-session using query.setPermissionMode()
**When to use:** When user toggles mode in UI
**Example:**
```typescript
// Server: expose mode change endpoint
router.post('/mode', async (req, res) => {
  const { sessionId, mode } = req.body as { sessionId: string; mode: PermissionMode };

  const query = activeQueries.get(sessionId);
  if (!query) {
    return res.status(404).json({ error: 'Session not found' });
  }

  await query.setPermissionMode(mode);

  // Notify client of mode change confirmation
  sendSSEEvent(sessionId, {
    type: 'mode_changed',
    mode,
    timestamp: Date.now(),
  });

  res.json({ success: true, mode });
});

// Client: mode selector component
function ModeSelector({ currentMode, onModeChange }: ModeSelectorProps) {
  const modeOptions: SegmentOption[] = [
    { value: 'default', label: 'Default', icon: <ShieldIcon /> },
    { value: 'plan', label: 'Plan', icon: <MapIcon /> },
    { value: 'acceptEdits', label: 'Accept Edits', icon: <EditIcon /> },
    { value: 'bypassPermissions', label: 'Auto', icon: <BoltIcon /> },
  ];

  return (
    <Segmented
      options={modeOptions}
      value={currentMode}
      onChange={onModeChange}
      size="sm"
    />
  );
}
```

### Pattern 4: Permission Rules with Wildcards
**What:** Store and evaluate permission rules with glob patterns
**When to use:** For "approve always" functionality
**Example:**
```typescript
// Server: permission rule types
interface PermissionRule {
  pattern: string;       // e.g., "Read:*", "Bash:npm *", "Write:/tmp/*"
  behavior: 'allow' | 'deny';
  scope: 'session' | 'project';
}

// Evaluate rules using minimatch
import { minimatch } from 'minimatch';

function evaluateRules(
  toolName: string,
  input: ToolInput,
  rules: PermissionRule[]
): 'allow' | 'deny' | 'ask' {
  // Build match string: "ToolName:input_summary"
  const inputSummary = getInputSummary(toolName, input);
  const matchString = `${toolName}:${inputSummary}`;

  // Check deny rules first (deny takes precedence)
  for (const rule of rules.filter(r => r.behavior === 'deny')) {
    if (minimatch(matchString, rule.pattern)) {
      return 'deny';
    }
  }

  // Check allow rules
  for (const rule of rules.filter(r => r.behavior === 'allow')) {
    if (minimatch(matchString, rule.pattern)) {
      return 'allow';
    }
  }

  // No rule matched, ask user
  return 'ask';
}

function getInputSummary(toolName: string, input: ToolInput): string {
  switch (toolName) {
    case 'Read':
    case 'Write':
    case 'Edit':
      return (input as { file_path: string }).file_path;
    case 'Bash':
      return (input as { command: string }).command;
    case 'Glob':
    case 'Grep':
      return (input as { pattern: string }).pattern;
    default:
      return '*';
  }
}
```

### Anti-Patterns to Avoid
- **Blocking the SSE stream:** Permission requests should be async; don't block other messages while waiting
- **Missing timeout handling:** SDK times out at 60s; client must respond faster or show timeout
- **Storing secrets in rules:** Permission rules may contain file paths; don't log sensitive inputs
- **Mode bypass in subagents:** When main agent is in bypassPermissions, all subagents inherit it - warn users

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Multi-select questionnaire | Custom form | OpenQuestionsResolver | Has keyboard nav, progress, single/multi-select, custom input |
| Mode selection toggle | Custom radio buttons | Segmented | Has animated indicator, keyboard nav, ARIA |
| Dialog with actions | Custom modal | Dialog component | Has header, footer, keyboard handling |
| Glob pattern matching | Regex | minimatch | Handles glob edge cases, well-tested |
| Permission state | Local state | React context | Rules shared across components |

**Key insight:** The ui-kit already has OpenQuestionsResolver for AskUserQuestion, Dialog for permissions, and Segmented for mode selection. Phase 4 focuses on the server-side canUseTool flow and wiring existing components.

## Common Pitfalls

### Pitfall 1: canUseTool Promise Never Resolves
**What goes wrong:** SDK hangs waiting for permission response, then times out
**Why it happens:** Client response doesn't reach server, or wrong request ID
**How to avoid:** Track pending permissions with request IDs, implement timeout, log mismatches
**Warning signs:** 60-second delays, then tool denied messages

### Pitfall 2: Permission Dialog Shows for AskUserQuestion
**What goes wrong:** User sees generic permission dialog instead of questionnaire
**Why it happens:** Not checking toolName === 'AskUserQuestion' before showing dialog
**How to avoid:** Route AskUserQuestion to OpenQuestionsResolver, not PermissionDialog
**Warning signs:** "AskUserQuestion" appears as tool name in permission dialog

### Pitfall 3: Mode Change During Active Request
**What goes wrong:** Mode change races with pending permission request
**Why it happens:** setPermissionMode called while canUseTool is waiting
**How to avoid:** Disable mode selector while permission dialog is open
**Warning signs:** Inconsistent behavior, permission denied after mode change

### Pitfall 4: bypassPermissions Warning Not Shown
**What goes wrong:** User enables auto-approve without understanding risk
**Why it happens:** Mode change happens silently
**How to avoid:** Show confirmation dialog when switching to bypassPermissions
**Warning signs:** User surprised when Claude executes dangerous commands

### Pitfall 5: Plan Mode Not Restricting Tools
**What goes wrong:** Claude executes tools in plan mode
**Why it happens:** SDK handles plan mode, but UI must also restrict
**How to avoid:** SDK enforces plan mode; UI just shows indicator
**Warning signs:** Files modified while mode indicator shows "Plan"

### Pitfall 6: Denied Permissions Not Summarized
**What goes wrong:** User can't see what was denied during session
**Why it happens:** Permission denials not tracked or displayed
**How to avoid:** Store denials, show in result summary (SDKResultMessage.permission_denials)
**Warning signs:** User confused why Claude couldn't complete task

## Code Examples

Verified patterns from SDK documentation and existing components:

### Permission Dialog Component
```typescript
// Source: SDK PermissionResult types + Dialog component
import { Dialog, Button, Text, Code } from '@ui-kit/react';

interface PermissionDialogProps {
  open: boolean;
  toolName: string;
  input: Record<string, unknown>;
  onApprove: () => void;
  onDeny: () => void;
  onApproveAlways: () => void;
  onClose: () => void;
}

export function PermissionDialog({
  open,
  toolName,
  input,
  onApprove,
  onDeny,
  onApproveAlways,
  onClose,
}: PermissionDialogProps) {
  const inputDisplay = formatToolInput(toolName, input);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Allow ${toolName}?`}
      footer={
        <div className={styles.actions}>
          <Button variant="ghost" onClick={onDeny}>
            Deny
          </Button>
          <Button variant="secondary" onClick={onApproveAlways}>
            Always Allow
          </Button>
          <Button variant="primary" onClick={onApprove}>
            Allow
          </Button>
        </div>
      }
    >
      <div className={styles.content}>
        <Text>Claude wants to use the {toolName} tool:</Text>
        <Code language="json">{inputDisplay}</Code>
      </div>
    </Dialog>
  );
}

function formatToolInput(toolName: string, input: Record<string, unknown>): string {
  // Format based on tool type for readability
  switch (toolName) {
    case 'Bash':
      return `Command: ${input.command}`;
    case 'Write':
      return `File: ${input.file_path}\nContent: ${(input.content as string).slice(0, 200)}...`;
    case 'Edit':
      return `File: ${input.file_path}\nReplace: "${input.old_string}"\nWith: "${input.new_string}"`;
    default:
      return JSON.stringify(input, null, 2);
  }
}
```

### AskUserQuestion Integration
```typescript
// Source: SDK AskUserQuestionInput + OpenQuestionsResolver
import { OpenQuestionsResolver, type OpenQuestion, type OpenQuestionsResult } from '@ui-kit/react-chat';

interface AskUserDialogProps {
  open: boolean;
  questions: AskUserQuestionInput['questions'];
  onComplete: (result: OpenQuestionsResult) => void;
  onDismiss: () => void;
}

export function AskUserDialog({
  open,
  questions,
  onComplete,
  onDismiss,
}: AskUserDialogProps) {
  if (!open) return null;

  // Transform SDK questions to OpenQuestion format
  const openQuestions: OpenQuestion[] = questions.map((q, index) => ({
    id: `q-${index}`,
    question: q.question,
    context: undefined,
    selectionType: q.multiSelect ? 'multiple' : 'single',
    options: q.options.map((opt, optIndex) => ({
      id: `opt-${optIndex}`,
      label: opt.label,
      description: opt.description,
    })),
    allowCustom: true,
  }));

  const handleComplete = (result: OpenQuestionsResult) => {
    // Transform back to SDK answer format
    const answers: Record<string, string> = {};

    result.answers.forEach((answer, index) => {
      const question = questions[index];
      const selectedLabels = answer.selectedOptionIds
        .filter(id => id !== 'custom')
        .map(id => {
          const optIndex = parseInt(id.replace('opt-', ''), 10);
          return question.options[optIndex]?.label || id;
        });

      if (answer.customText?.trim()) {
        answers[question.question] = answer.customText.trim();
      } else {
        answers[question.question] = selectedLabels.join(', ');
      }
    });

    onComplete({
      ...result,
      answers: result.answers.map((a, i) => ({
        ...a,
        questionId: questions[i].question,
      })),
    });
  };

  return (
    <OpenQuestionsResolver
      questions={openQuestions}
      onComplete={handleComplete}
      onDismiss={onDismiss}
      variant="centered"
    />
  );
}
```

### Mode Indicator with Selector
```typescript
// Source: SDK PermissionMode + Segmented component
import { Segmented, Tooltip, type SegmentOption } from '@ui-kit/react';
import { ShieldIcon } from '@ui-kit/icons/ShieldIcon';
import { MapIcon } from '@ui-kit/icons/MapIcon';
import { EditIcon } from '@ui-kit/icons/EditIcon';
import { BoltIcon } from '@ui-kit/icons/BoltIcon';

type PermissionMode = 'default' | 'plan' | 'acceptEdits' | 'bypassPermissions';

interface ModeSelectorProps {
  mode: PermissionMode;
  onChange: (mode: PermissionMode) => void;
  disabled?: boolean;
}

const MODE_INFO: Record<PermissionMode, { label: string; icon: React.ReactNode; description: string }> = {
  default: {
    label: 'Default',
    icon: <ShieldIcon />,
    description: 'Prompts for tool approval',
  },
  plan: {
    label: 'Plan',
    icon: <MapIcon />,
    description: 'Read-only mode, no execution',
  },
  acceptEdits: {
    label: 'Accept Edits',
    icon: <EditIcon />,
    description: 'Auto-approves file edits',
  },
  bypassPermissions: {
    label: 'Auto',
    icon: <BoltIcon />,
    description: 'Auto-approves all tools (use with caution)',
  },
};

export function ModeSelector({ mode, onChange, disabled }: ModeSelectorProps) {
  const options: SegmentOption[] = Object.entries(MODE_INFO).map(([value, info]) => ({
    value,
    label: info.label,
    icon: info.icon,
    'aria-label': info.description,
  }));

  const handleChange = (newMode: string) => {
    if (newMode === 'bypassPermissions') {
      // Show confirmation dialog
      if (!confirm('Auto mode bypasses all permission checks. Continue?')) {
        return;
      }
    }
    onChange(newMode as PermissionMode);
  };

  return (
    <Tooltip content={MODE_INFO[mode].description}>
      <Segmented
        options={options}
        value={mode}
        onChange={handleChange}
        disabled={disabled}
        size="sm"
        aria-label="Execution mode"
      />
    </Tooltip>
  );
}
```

### Server Permission Response Endpoint
```typescript
// Source: Express route + SDK PermissionResult
import { Router } from 'express';
import type { PermissionResult } from '../types/index.js';

export const router = Router();

// Store for pending permission requests
const pendingPermissions = new Map<string, {
  resolve: (result: PermissionResult) => void;
  toolName: string;
  timestamp: number;
}>();

router.post('/permission-response', (req, res) => {
  const { requestId, behavior, message, updatedInput } = req.body as {
    requestId: string;
    behavior: 'allow' | 'deny';
    message?: string;
    updatedInput?: Record<string, unknown>;
  };

  const pending = pendingPermissions.get(requestId);
  if (!pending) {
    return res.status(404).json({ error: 'Permission request not found or expired' });
  }

  pendingPermissions.delete(requestId);

  if (behavior === 'allow') {
    pending.resolve({
      behavior: 'allow',
      updatedInput: updatedInput || {},
    });
  } else {
    pending.resolve({
      behavior: 'deny',
      message: message || 'User denied this action',
    });
  }

  res.json({ success: true });
});

// Export for use in agentService
export { pendingPermissions };
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| bypassPermissions always | Dynamic permission modes | Phase 4 | Users control tool execution |
| No clarifying questions | AskUserQuestion tool | SDK 0.2.x | Claude can gather requirements |
| Static permission rules | Session + project rules | SDK update | Flexible rule scoping |
| CLI-only approval | Web UI dialogs | Phase 4 | Visual permission management |

**Deprecated/outdated:**
- Hardcoded `bypassPermissions` in agentService.ts - Replace with configurable mode
- No canUseTool callback - Add permission handling

## Open Questions

Things that couldn't be fully resolved:

1. **Permission Persistence Scope**
   - What we know: SDK supports session, project, and user-level rules
   - What's unclear: Should "approve always" persist across sessions?
   - Recommendation: Start with session-only rules, add persistence later

2. **WebSocket vs POST for Responses**
   - What we know: WebSocket would be cleaner for bidirectional communication
   - What's unclear: Is WebSocket already planned for other features?
   - Recommendation: Use POST endpoint initially (simpler), refactor to WebSocket with Phase 5+ if needed

3. **Subagent Permissions**
   - What we know: bypassPermissions inherits to subagents and cannot be overridden
   - What's unclear: How should UI handle subagent permission requests?
   - Recommendation: Flag subagent requests in UI, warn about bypassPermissions inheritance

4. **Interrupt During Permission Dialog**
   - What we know: User might want to cancel while permission dialog is open
   - What's unclear: Should dialog close? Should it deny?
   - Recommendation: Add "Cancel" that closes dialog and denies with "User cancelled"

## Sources

### Primary (HIGH confidence)
- [Claude Agent SDK Permissions](https://platform.claude.com/docs/en/agent-sdk/permissions) - Permission modes, evaluation order
- [Claude Agent SDK TypeScript Reference](https://platform.claude.com/docs/en/agent-sdk/typescript) - canUseTool, PermissionResult, PermissionMode types
- [Handle Approvals and User Input](https://platform.claude.com/docs/en/agent-sdk/user-input) - AskUserQuestion, approval flows
- `.planning/research/AGENT_SDK.md` - Comprehensive SDK documentation from initial research

### Secondary (MEDIUM confidence)
- `packages/ui-kit/react-chat/src/components/OpenQuestionsResolver/` - Existing questionnaire component
- `packages/ui-kit/react/src/components/Dialog/` - Dialog component API
- `packages/ui-kit/react/src/components/Segmented/` - Segmented control for mode selection

### Tertiary (LOW confidence)
- None - all findings verified against official SDK documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using SDK APIs and existing ui-kit components
- Architecture: HIGH - Patterns derived from official SDK docs
- Pitfalls: HIGH - Based on SDK documentation and timeout constraints

**Research date:** 2026-01-19
**Valid until:** 2026-02-19 (30 days - SDK permissions API is stable)

---

## Implementation Checklist Summary

For the planner, key implementation areas:

1. **Server**
   - [ ] Remove hardcoded `bypassPermissions` from agentService
   - [ ] Implement canUseTool callback with SSE forwarding
   - [ ] Add pending permission tracking with timeouts
   - [ ] Add POST endpoint for permission responses
   - [ ] Add POST endpoint for mode changes
   - [ ] Handle AskUserQuestion specially in canUseTool
   - [ ] Track permission denials for result summary

2. **Client - Permission Dialog**
   - [ ] PermissionDialog component (tool name, input, actions)
   - [ ] Permission request handler in useAgentStream
   - [ ] Response sender (POST to server)
   - [ ] Timeout display (55s countdown)

3. **Client - AskUserQuestion**
   - [ ] AskUserDialog wrapping OpenQuestionsResolver
   - [ ] Transform SDK question format to OpenQuestion
   - [ ] Transform OpenQuestionsResult to SDK answer format

4. **Client - Mode Management**
   - [ ] ModeSelector component (Segmented-based)
   - [ ] ModeIndicator showing current mode
   - [ ] Mode change confirmation for bypassPermissions
   - [ ] Disable mode selector while permission pending

5. **Client - State**
   - [ ] Permission rules context (session-scoped)
   - [ ] "Approve always" rule addition
   - [ ] Denied permissions tracking for summary

6. **Types**
   - [ ] PermissionRequestEvent, QuestionRequestEvent for SSE
   - [ ] PermissionResponsePayload for POST
   - [ ] PermissionRule for wildcard patterns
