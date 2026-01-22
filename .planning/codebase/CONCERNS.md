# Codebase Concerns

**Analysis Date:** 2025-01-19
**Scope:** `/apps/ideate/` and `/packages/ui-kit/`

## Tech Debt

**Large File Complexity:**
- Issue: Multiple files exceed 500-line guideline, increasing maintenance burden
- Files:
  - `apps/ideate/client/src/components/IdeaDialog/IdeaDialog.tsx` (2224 lines)
  - `apps/ideate/server/src/services/MCPToolsService.ts` (1949 lines)
  - `apps/ideate/server/src/services/TopicService.ts` (1591 lines)
  - `apps/ideate/server/src/services/IdeaAgentService.ts` (1404 lines)
  - `apps/ideate/server/src/services/FacilitatorService.ts` (1336 lines)
  - `apps/ideate/server/src/websocket/YjsCollaborationHandler.ts` (1245 lines)
  - `apps/ideate/server/src/services/IdeaService.ts` (1241 lines)
  - `packages/ui-kit/react-chat/src/components/ChatInput/ChatInput.tsx` (1373 lines)
  - `packages/ui-kit/core/src/themes/generator.ts` (1220 lines)
- Impact: Difficult to understand, test, and modify; increases cognitive load
- Fix approach: Extract logical units into separate files/modules; IdeaDialog could split agent modes, MCPToolsService could have tool handlers in separate files

**Debug Logging Hardcoded in Production:**
- Issue: `DEBUG_YJS_UPDATES = true` hardcoded in production code
- Files: `packages/ui-kit/react-markdown/src/components/MarkdownEditor/useCodeMirrorEditor.ts:26`
- Impact: Performance degradation, console noise in production
- Fix approach: Use environment variable or feature flag; remove or disable by default

**Incomplete TODOs:**
- Issue: Several TODO comments indicate incomplete functionality
- Files:
  - `apps/ideate/client/src/contexts/NetworkContext.tsx:40,49` - mDNS discovery and document WebSocket connection not implemented
  - `apps/ideate/client/src/pages/Topics.tsx:211` - Edit modal not implemented
  - `apps/ideate/server/src/services/AuthService.ts:26` - Google token validation is mocked
  - `apps/ideate/server/src/services/DocumentService.ts:335` - Collaborator details fetch is a TODO
  - `packages/ui-kit/react-markdown/src/hooks/useAIEdits.ts:82,105` - Line-to-position and selector-based targeting incomplete
- Impact: Features may not work as expected; security implications for auth
- Fix approach: Prioritize auth validation TODO; implement or remove other TODOs

**Deprecated Fields Still in Use:**
- Issue: Multiple deprecated fields maintained for backward compatibility
- Files:
  - `apps/ideate/server/src/services/ExecutionAgentChatService.ts:53,158`
  - `apps/ideate/server/src/services/FacilitatorChatService.ts:60,63`
  - `apps/ideate/server/src/services/IdeaAgentChatService.ts:42,45`
- Impact: Code duplication, confusion about which fields to use
- Fix approach: Set deprecation timeline; migrate consumers; remove deprecated fields

**Excessive Console Logging:**
- Issue: 821 console.log/warn/error calls in ideate app, 139 in ui-kit
- Files: Distributed across 89 files in ideate, 46 files in ui-kit
- Impact: Performance overhead, console noise, potential information leakage
- Fix approach: Replace with structured logging (clientLogger already exists); remove debug logs

## Security Considerations

**Authentication Not Implemented:**
- Risk: Google OAuth token validation is completely mocked - any token creates a session
- Files: `apps/ideate/server/src/services/AuthService.ts:25-46`
- Current mitigation: In-memory sessions with 7-day expiry
- Recommendations: Implement actual Google OAuth verification before production deployment

**Open CORS Policy:**
- Risk: CORS allows any origin (`origin: true`) which permits cross-origin requests from any domain
- Files: `apps/ideate/server/src/index.ts:44-47`
- Current mitigation: Development-only setting (documented as "for LAN access")
- Recommendations: Restrict to known origins in production; use environment-based configuration

**No Rate Limiting:**
- Risk: API endpoints have no rate limiting, vulnerable to abuse/DoS
- Files: All routes in `apps/ideate/server/src/routes/`
- Current mitigation: None
- Recommendations: Add rate limiting middleware (express-rate-limit) for API and WebSocket connections

**No Input Validation Framework:**
- Risk: Limited input validation on API endpoints; user ID from header not validated
- Files: `apps/ideate/server/src/routes/topics.ts:27` - `userId` taken directly from header
- Current mitigation: Some routes check for null/undefined
- Recommendations: Add Zod validation middleware; validate all inputs

**WebSocket Authentication:**
- Risk: WebSocket connections may not validate user identity consistently
- Files: `apps/ideate/server/src/websocket/YjsCollaborationHandler.ts`
- Current mitigation: Room-based isolation
- Recommendations: Validate user session on WebSocket upgrade

## Performance Bottlenecks

**Yjs Debug Extension Always Active:**
- Problem: Debug extension logs every transaction when DEBUG_YJS_UPDATES is true
- Files: `packages/ui-kit/react-markdown/src/components/MarkdownEditor/useCodeMirrorEditor.ts:26-80`
- Cause: Hardcoded flag, logging on every document change
- Improvement path: Disable by default; use conditional compilation or runtime flag

**Large Component Re-renders:**
- Problem: IdeaDialog (2224 lines) likely causes unnecessary re-renders due to size and state complexity
- Files: `apps/ideate/client/src/components/IdeaDialog/IdeaDialog.tsx`
- Cause: Many useState/useEffect hooks in single component
- Improvement path: Split into smaller memoized sub-components; use context for shared state

**Service Instantiation on Every Request:**
- Problem: Some routes create new service instances per request
- Files: `apps/ideate/server/src/services/MCPToolsService.ts:58-62` - constructor creates 4 new service instances
- Cause: No dependency injection or singleton pattern
- Improvement path: Use singleton services or dependency injection container

## Fragile Areas

**Yjs Collaboration Synchronization:**
- Files:
  - `apps/ideate/server/src/websocket/YjsCollaborationHandler.ts`
  - `apps/ideate/client/src/hooks/useYjsCollaboration.ts`
- Why fragile: Complex state synchronization between multiple clients and server; relative position conversions can fail silently (returns undefined)
- Safe modification: Add comprehensive tests before changes; test with multiple simultaneous clients
- Test coverage: No direct unit tests for YjsCollaborationHandler

**Agent Chat Services:**
- Files:
  - `apps/ideate/server/src/services/IdeaAgentService.ts`
  - `apps/ideate/server/src/services/PlanAgentService.ts`
  - `apps/ideate/server/src/services/ExecutionAgentService.ts`
- Why fragile: Complex streaming state, SDK integration, multiple WebSocket handlers; deprecated and new fields coexist
- Safe modification: Test each agent type independently; verify streaming works end-to-end
- Test coverage: Limited - only `useExecutionAgent.test.ts` exists for client hook

**Theme Generator:**
- Files: `packages/ui-kit/core/src/themes/generator.ts`
- Why fragile: 1220 lines with `as any` casts to access theme rules; complex token derivation logic
- Safe modification: Add type safety; add unit tests for token generation
- Test coverage: Only `dynamicSurface.test.ts` exists, not generator

## Test Coverage Gaps

**Ideate App - Very Limited Unit Tests:**
- What's not tested: Most components, services, and WebSocket handlers
- Files: Only 5 test files exist in ideate app:
  - `apps/ideate/client/src/components/FacilitatorOverlay/FacilitatorOverlay.test.tsx`
  - `apps/ideate/client/src/contexts/FacilitatorContext.test.tsx`
  - `apps/ideate/client/src/hooks/useExecutionAgent.test.ts`
  - `apps/ideate/client/src/hooks/useGlobalKeyboard.test.ts`
  - `apps/ideate/server/src/shared/thingToolsMcp.test.ts`
- Risk: Regressions go unnoticed; refactoring is dangerous
- Priority: High

**Server Routes Untested:**
- What's not tested: All Express routes (auth, documents, workspaces, chatrooms, personas, ideas, topics, fs, facts)
- Files: `apps/ideate/server/src/routes/*`
- Risk: API contract changes break clients; error handling untested
- Priority: High

**UI-Kit Limited Test Coverage:**
- What's not tested: Many React components have no tests
- Files: Only 8 test files in ui-kit/react, 6 in react-chat, 5 in router
- Risk: Component behavior regressions
- Priority: Medium

**Skipped E2E Tests:**
- What's not tested: `execute-mode.spec.ts:133` - "shows Idea tab in ideation phase with editor content" is skipped
- Files: `apps/ideate/client/e2e/execute-mode.spec.ts`
- Risk: Feature may be broken without detection
- Priority: Medium

## Dependencies at Risk

**Storybook Version Mismatch:**
- Risk: Mixed Storybook 8.x and 10.x dependencies could cause conflicts
- Files:
  - `packages/ui-kit/react/package.json` - has both `@storybook/test: ^8.6.14` and `storybook: ^10.1.0`
- Impact: Build failures, inconsistent behavior
- Migration plan: Align all Storybook packages to same major version

**Deprecated npm Packages:**
- Risk: Some dependencies are deprecated (per pnpm-lock.yaml warnings)
- Files: pnpm-lock.yaml references deprecated packages:
  - `@types/parse-path` - stub types no longer needed
  - `glob@7.x` - old version
  - Intersection Observer polyfill - no longer needed
- Impact: Security vulnerabilities, no bug fixes
- Migration plan: Update to recommended replacements; remove unnecessary polyfills

## Missing Critical Features

**Production-Ready Authentication:**
- Problem: OAuth validation is mocked; in-memory session store
- Blocks: Production deployment; multi-instance scaling
- Files: `apps/ideate/server/src/services/AuthService.ts`

**Session Persistence:**
- Problem: Sessions stored in memory (Map), lost on server restart
- Blocks: Production deployment; horizontal scaling
- Files: `apps/ideate/server/src/services/AuthService.ts:18`

**Error Monitoring:**
- Problem: No error tracking service integration
- Blocks: Production debugging; error analysis
- Files: No Sentry, DataDog, or similar integration found

---

*Concerns audit: 2025-01-19*
