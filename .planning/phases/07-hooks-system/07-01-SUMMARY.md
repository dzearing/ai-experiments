---
phase: 07-hooks-system
plan: 01
subsystem: api
tags: [hooks, sdk, typescript, callbacks, minimatch]

# Dependency graph
requires:
  - phase: 05-configuration-system
    provides: ConfigService, Settings interface, minimatch dependency
provides:
  - Hook type definitions for all 11 SDK hook events
  - HooksService with createHookCallbacks factory
  - Settings.hooks configuration schema
  - AgentService hooks integration
affects: [07-02, 07-03, tool-hooks, lifecycle-hooks]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - SDK callback-based hooks pattern
    - Config-to-callback transformation pattern

key-files:
  created:
    - apps/claude-code-web/server/src/types/hooks.ts
    - apps/claude-code-web/server/src/services/hooksService.ts
  modified:
    - apps/claude-code-web/server/src/types/config.ts
    - apps/claude-code-web/server/src/services/agentService.ts

key-decisions:
  - "HooksConfig maps hook events to arrays of action entries (matcher, action, options)"
  - "Built-in actions: log, notify, block-pattern, allow, deny"
  - "HooksService uses minimatch for tool name glob pattern matching"
  - "Hooks passed to SDK via queryOptions.hooks alongside existing canUseTool"

patterns-established:
  - "HookCallback type matches SDK signature: (input, toolUseID, {signal}) => Promise<HookJSONOutput>"
  - "SDKHooksOptions type for SDK query() hooks parameter"
  - "Config transformation pattern: settings.json hooks -> TypeScript callbacks"

# Metrics
duration: 2min
completed: 2026-01-25
---

# Phase 7 Plan 01: Hook Types and Service Foundation Summary

**Type-safe hook system foundation with all 11 SDK event types, HooksService callback factory, and AgentService integration**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-25T13:39:57Z
- **Completed:** 2026-01-25T13:42:17Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Defined comprehensive TypeScript types for all 11 SDK hook events
- Created HooksService with factory method to transform config into SDK callbacks
- Extended Settings interface with hooks configuration schema
- Integrated hooks into AgentService SDK query flow

## Task Commits

Each task was committed atomically:

1. **Task 1: Create hook type definitions** - `e7a7a63` (feat)
2. **Task 2: Extend config types and create HooksService** - `4bb486d` (feat)
3. **Task 3: Wire HooksService into AgentService** - `bf221e2` (feat)

## Files Created/Modified
- `apps/claude-code-web/server/src/types/hooks.ts` - All hook type definitions (HookEvent, HookInput variants, HookJSONOutput, HooksConfig, SDKHooksOptions)
- `apps/claude-code-web/server/src/services/hooksService.ts` - HooksService class with createHookCallbacks factory and built-in action implementations
- `apps/claude-code-web/server/src/types/config.ts` - Added hooks?: HooksConfig to Settings interface
- `apps/claude-code-web/server/src/services/agentService.ts` - Imported hooksService and integrated hooks into query options

## Decisions Made
- HooksConfig uses Partial<Record<HookEvent, HookConfigEntry[]>> for flexible event-to-actions mapping
- Built-in action types cover common use cases: log, notify, block-pattern, allow, deny
- Placeholder implementations for notify and block-pattern (to be completed in 07-02/07-03)
- Hooks work alongside existing canUseTool permission callback, not replacing it

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks completed without problems.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Hook types ready for tool hooks implementation (07-02)
- Hook types ready for lifecycle hooks implementation (07-03)
- HooksService placeholder methods ready to be implemented
- AgentService integration complete - hooks will be passed to SDK when configured

---
*Phase: 07-hooks-system*
*Completed: 2026-01-25*
