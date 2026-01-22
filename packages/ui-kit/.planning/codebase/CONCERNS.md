# Codebase Concerns

**Analysis Date:** 2025-01-17

## Tech Debt

**Debug Logging Left in Production Code:**
- Issue: Extensive debug logging (`DEBUG_YJS_UPDATES = true`) is hardcoded enabled in production code
- Files: `react-markdown/src/components/MarkdownEditor/useCodeMirrorEditor.ts`
- Impact: Console noise in production, performance overhead from logging, exposes internal implementation details
- Fix approach: Convert to environment-based conditional (`process.env.NODE_ENV === 'development'`) or remove entirely

**Incomplete AI Edit Implementation:**
- Issue: TODOs indicate incomplete functionality for line-to-position conversion and selector-based targeting
- Files: `react-markdown/src/hooks/useAIEdits.ts` (lines 82, 105)
- Impact: AI co-authoring features partially implemented, selector-based edits non-functional
- Fix approach: Implement LineNumberExtension integration and selector-based targeting logic

**Type Casting to `any` in Theme Generator:**
- Issue: Multiple `as any` casts used to bypass TypeScript checks when accessing theme rules
- Files: `core/src/themes/generator.ts` (lines 216, 397, 407)
- Impact: Type safety compromised, potential runtime errors if JSON schema changes
- Fix approach: Define proper TypeScript interfaces for `theme-rules.json` schema

**`any` Types in Markdown Renderer:**
- Issue: All react-markdown component overrides use `any` for props
- Files: `react-markdown/src/components/MarkdownRenderer/MarkdownRenderer.tsx` (lines 226-387)
- Impact: No type safety for markdown renderer customizations, potential runtime prop issues
- Fix approach: Define proper prop interfaces for each markdown element type

**ESLint Disable Comment:**
- Issue: React hooks exhaustive deps rule disabled without clear justification
- Files: `router/src/Router.tsx` (line 68)
- Impact: Potential stale closure bugs in router navigation
- Fix approach: Review dependency array and either fix the dependencies or document why exclusion is safe

## Known Bugs

**Console Debug Logs in Tests:**
- Symptoms: Test files contain debug `console.log` statements
- Files: `react-chat/src/components/ChatInput/ChatInput.focus.test.tsx` (lines 76-81)
- Trigger: Running tests outputs debug information
- Workaround: Filter console output in test runner

**Stories with Stray Console Logs:**
- Symptoms: Storybook stories contain `console.log` calls that pollute browser console
- Files: `react-chat/src/components/ChatPanel/ChatPanel.stories.tsx` (lines 204, 323, 434), `react-chat/src/components/ChatPanel/VirtualizedChatPanel.stories.tsx` (line 110)
- Trigger: Viewing stories in Storybook
- Workaround: None currently

## Security Considerations

**DiskItemProvider Error Exposure:**
- Risk: Server error messages exposed directly to client
- Files: `react-pickers/src/providers/DiskItemProvider.ts` (line 58)
- Current mitigation: None
- Recommendations: Sanitize error messages, avoid exposing server-side paths or stack traces

**LocalStorage Theme Storage:**
- Risk: Theme data stored in localStorage without validation
- Files: `core/src/themes/storage.ts`
- Current mitigation: Basic error handling
- Recommendations: Add schema validation for stored themes, consider size limits

## Performance Bottlenecks

**Large Component Files:**
- Problem: Several components exceed 500 lines, increasing bundle size and cognitive load
- Files:
  - `react-chat/src/components/ChatInput/ChatInput.tsx` (1373 lines)
  - `core/src/themes/generator.ts` (1220 lines)
  - `website/src/pages/Themes/ThemeDesignerPage.tsx` (1023 lines)
  - `react/src/components/Menu/Menu.tsx` (1018 lines)
  - `react-chat/src/components/ChatMessage/ChatMessage.tsx` (827 lines)
  - `react/src/components/Dropdown/Dropdown.tsx` (801 lines)
  - `react-markdown/src/components/MarkdownEditor/useCodeMirrorEditor.ts` (721 lines)
  - `react/src/components/TreeView/TreeView.tsx` (703 lines)
  - `react-pickers/src/components/ItemPickerDialog/ItemPickerDialog.tsx` (683 lines)
- Cause: Components handling too many concerns, lack of decomposition
- Improvement path: Extract sub-components, split hooks, move utilities to separate files

**Large Story Files:**
- Problem: Story files are extremely large, slowing Storybook builds
- Files:
  - `mock-pages/src/examples/NewIdeaInputFlow.stories.tsx` (1697 lines)
  - `mock-pages/src/examples/IdeateThings.stories.tsx` (1296 lines)
  - `mock-pages/src/examples/IdeaUserFlow.stories.tsx` (1259 lines)
  - `mock-pages/src/examples/ExecutingIdea.stories.tsx` (1241 lines)
- Cause: Complex mock page implementations in story files
- Improvement path: Extract page implementations to separate files, stories should import them

**Theme Generator Performance:**
- Problem: Theme token generation involves multiple passes and string parsing
- Files: `core/src/themes/generator.ts`
- Cause: Runtime derivation parsing using regex for each token
- Improvement path: Consider pre-compiling derivation rules, cache computed values

## Fragile Areas

**CodeMirror Yjs Integration:**
- Files: `react-markdown/src/components/MarkdownEditor/useCodeMirrorEditor.ts`
- Why fragile: Complex error recovery for "tile errors" with aggressive state resets, multiple refs tracking sync state
- Safe modification: Test thoroughly with collaborative editing scenarios before changes
- Test coverage: Minimal automated testing for error recovery paths

**Theme Derivation System:**
- Files: `core/src/themes/generator.ts`
- Why fragile: String-based derivation rules parsed at runtime, dependencies between tokens not explicit
- Safe modification: Always test generated CSS in both light and dark modes
- Test coverage: Only color utility tests exist (`core/src/colors/dynamicSurface.test.ts`)

**Menu Submenu Navigation:**
- Files: `react/src/components/Menu/Menu.tsx`
- Why fragile: Complex state management for hover delays, click ignore delays, nested focus tracking
- Safe modification: Test all keyboard navigation paths, RTL support
- Test coverage: No automated tests for Menu component

## Scaling Limits

**LocalStorage Theme Limits:**
- Current capacity: Browser localStorage (typically 5-10MB)
- Limit: Users with many custom themes may hit storage quota
- Scaling path: Implement server-side theme storage, add compression for theme data

## Dependencies at Risk

**No Critical Dependencies Identified:**
- The codebase uses well-maintained libraries (React, CodeMirror, TipTap)
- Regular dependency updates should be monitored

## Missing Critical Features

**Test Infrastructure Gaps:**
- Problem: Most UI components lack automated tests
- Files: Only 19 test files for ~100+ components
- Blocks: Confident refactoring, regression detection

**Storybook Coverage Gaps:**
- Problem: Some components may lack story coverage for all states
- Files: 98 story files exist, coverage appears reasonable
- Blocks: Visual regression testing, design review

## Test Coverage Gaps

**Untested Major Components:**
- What's not tested: Menu, Dropdown, TreeView, Dialog, Modal, Table, Tabs
- Files: `react/src/components/Menu/Menu.tsx`, `react/src/components/Dropdown/Dropdown.tsx`, `react/src/components/TreeView/TreeView.tsx`, etc.
- Risk: Regressions in keyboard navigation, accessibility, edge cases undetected
- Priority: High - these are complex interactive components

**No Integration Tests:**
- What's not tested: Component interactions, provider contexts, routing
- Files: Entire `router/` package has tests but `react/` components with context dependencies do not
- Risk: Context provider bugs, SSR issues
- Priority: Medium - rely on manual testing and Storybook

**Theme Generation Not Fully Tested:**
- What's not tested: Full token generation, surface calculations, accessibility contrast
- Files: `core/src/themes/generator.ts`
- Risk: Theme output may not match expectations, contrast issues
- Priority: Medium - visual review catches most issues

## Deprecated APIs

**Chat Message API Migration:**
- Issue: `content` and `toolCalls` props marked deprecated in favor of `parts`
- Files: `react-chat/src/components/ChatMessage/ChatMessage.tsx` (lines 367, 397), `react-chat/src/components/ChatPanel/ChatPanel.tsx` (lines 13, 25)
- Impact: Consumers using old API will need migration
- Timeline: Should be removed in next major version

**ItemPickerDialog Legacy Props:**
- Issue: Direct FS-related props deprecated in favor of `provider` prop
- Files: `react-pickers/src/components/ItemPickerDialog/ItemPickerDialog.tsx` (lines 47, 52)
- Impact: Backward compatibility maintained but adds complexity
- Timeline: Remove in next major version

**MarkdownCoEditor Split Orientation:**
- Issue: `splitOrientation` prop kept for API compatibility but no longer used
- Files: `react-markdown/src/components/MarkdownCoEditor/MarkdownCoEditor.tsx` (lines 89, 160)
- Impact: Dead code, confusing API
- Timeline: Remove in next major version

**Surface Type Aliases:**
- Issue: Multiple type aliases marked deprecated (TonalSurface aliases, ControlRole)
- Files: `core/src/surfaces/types.ts` (lines 35, 56, 77)
- Impact: Type confusion, extra maintenance burden
- Timeline: Remove deprecated aliases in next major version

**Search Extension:**
- Issue: Combined `searchExtension` deprecated in favor of `baseSearchExtension` + `createSearchKeybindings()`
- Files: `react-markdown/src/components/MarkdownEditor/extensions/search.ts` (line 112)
- Impact: Minor - clear migration path documented
- Timeline: Remove in next minor version

---

*Concerns audit: 2025-01-17*
