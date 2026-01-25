---
phase: 08-commands-skills
plan: 03
subsystem: commands
tags: [commands, execution, arguments, bash, api]
dependency-graph:
  requires: [08-01]
  provides: [argument-substitution, bash-preprocessing, command-execution-api]
  affects: [08-04]
tech-stack:
  added: []
  patterns: [argument-substitution, bash-injection, exec-promisify]
key-files:
  created: []
  modified:
    - apps/claude-code-web/server/src/services/commandsService.ts
    - apps/claude-code-web/server/src/routes/commands.ts
decisions:
  - id: CMD-03
    choice: "Remove $N placeholders when no args provided"
    rationale: "Cleaner output than leaving unexpanded placeholders"
  - id: CMD-04
    choice: "30 second timeout for bash pre-execution"
    rationale: "Safety limit to prevent hung commands"
  - id: CMD-05
    choice: "hasBashAllowed checks for Bash, Bash*, Bash(*) patterns"
    rationale: "Match Claude Code allowed-tools syntax flexibility"
metrics:
  duration: "3.5 min"
  completed: 2026-01-25
---

# Phase 8 Plan 3: Command Argument Substitution & Bash Pre-execution Summary

Argument substitution ($1, $2, $ARGUMENTS) and bash pre-execution (!`command`) for custom commands with execute API endpoint.

## Performance

- **Duration:** 3m 37s
- **Started:** 2026-01-25T17:22:54Z
- **Completed:** 2026-01-25T17:26:31Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments

- substituteArguments method handles $1, $2, $ARGUMENTS placeholders
- preprocessBashCommands executes bash and injects output for commands with Bash allowed
- processCommand orchestrates command lookup, argument substitution, and bash preprocessing
- POST /api/commands/execute endpoint for client-side command execution

## Task Commits

Each task was committed atomically:

1. **Task 1: Add argument substitution** - `10d589f` (feat)
2. **Task 2: Add bash pre-execution** - `deaf46a` (feat)
3. **Task 3: Add processCommand and execute endpoint** - `50e888b` (feat)

## Files Modified

- `apps/claude-code-web/server/src/services/commandsService.ts` - Added substituteArguments, preprocessBashCommands, hasBashAllowed, processCommand methods
- `apps/claude-code-web/server/src/routes/commands.ts` - Added POST /api/commands/execute endpoint

## Decisions Made

| ID | Decision | Rationale |
|----|----------|-----------|
| CMD-03 | Remove $N placeholders when no args | Cleaner output than leaving unexpanded placeholders |
| CMD-04 | 30 second bash timeout | Safety limit to prevent hung commands |
| CMD-05 | hasBashAllowed pattern matching | Match Claude Code allowed-tools syntax (Bash, Bash*, Bash(*)) |

## Deviations from Plan

None - plan executed exactly as written.

## Verification Performed

1. TypeScript compiles without errors
2. Created test command with $1, $2, $ARGUMENTS and !`git branch --show-current`
3. POST /api/commands/execute returned:
   - Correctly substituted arguments
   - Correctly injected git branch output (cc)
   - Correctly returned allowedTools array
4. Unknown commands return 404 error

## Issues Encountered

- Test command initially had invalid YAML (unquoted `[arg1] [arg2]`)
- Fixed by quoting the argument-hint value in frontmatter
- This is expected - users need to follow YAML syntax in frontmatter

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for 08-04 (Client-Side Command Execution). The API provides:
- POST /api/commands/execute endpoint
- Returns processed content with argument substitution and bash output
- Returns allowedTools and model for session configuration
- 404 for unknown commands

Client will need to:
- Call execute endpoint when user invokes custom command
- Pass processed content to conversation as user message
- Apply allowedTools and model overrides to session

---
*Phase: 08-commands-skills*
*Completed: 2026-01-25*
