# Project Research Summary

**Project:** UI-Kit Coworker Design System Parity Milestone
**Domain:** AI Chat & Productivity Design System Extension
**Researched:** 2026-02-01
**Confidence:** HIGH

## Executive Summary

This milestone extends the existing ui-kit design system to achieve parity with the Coworker/Copilot design system by adding layout components (PageHeader, SidePanel, TitleBar), specialized cards (FileCard, PersonCard, EventCard), chat enhancements (reasoning steps, citations, attachments), and the Copilot brand theme. The research reveals a critical architectural insight: **NO new packages should be created**. The existing `@ui-kit/react` package already provides the necessary foundation (Card, Stack, Panel primitives), and creating separate `@ui-kit/react-layout` and `@ui-kit/react-cards` packages would fragment the API and introduce unnecessary circular dependency risks.

The recommended approach is purely additive: enhance existing packages with new components and tokens. The existing stack (React 19, TypeScript 5.4, Vite 5, CSS Modules, Storybook 10) supports all requirements with ZERO new runtime dependencies. All new components are presentational (display data, emit events) and compose from existing primitives. The theme system's token generator already supports all needed extensions through simple JSON additions. This milestone is fundamentally about expanding content (typography tokens, brand flair tokens, icons) and creating specialized variants of existing components rather than introducing new technologies.

The primary risks center on accessibility and performance: Windows High Contrast Mode must be tested from day one, chat virtualization is mandatory (not optional), and a centralized z-index scale must be established before layout components are built. Animation performance requires strict discipline (transform/opacity only), and typography token expansion needs careful namespacing to avoid breaking existing components. These are all preventable through adherence to established patterns and explicit testing protocols.

## Key Findings

### Recommended Stack

The existing stack is fully adequate for this milestone. Research confirms **zero new runtime dependencies** are needed. All extensions leverage validated capabilities: the theme generator already handles token derivation, the icon build pipeline supports all formats, and the component architecture scales naturally through composition patterns.

**Core technologies (no changes):**
- React 19 + TypeScript 5.4 — Component development with existing patterns
- Vite 5 + CSS Modules — Build system with proven configuration
- Storybook 10 + Vitest — Development and testing environment
- pnpm workspaces — Monorepo management (existing structure)
- @tanstack/react-virtual — Chat virtualization (already in react-chat)

**Extensions required (within existing packages):**
- 30 new icons in `@ui-kit/icons` — Product icons, agent icons, UI indicators (existing build pipeline)
- 6 typography tokens in `@ui-kit/core` — Display sizes, semantic naming (additive only)
- Brand flair tokens in `@ui-kit/core` — Gradient support for Copilot theme (optional property)
- Copilot theme definition in `@ui-kit/core` — Single JSON file (follows existing pattern)

**Architectural decision: Enhance existing packages rather than create new ones.** Creating `@ui-kit/react-layout` and `@ui-kit/react-cards` would introduce circular dependency risks, fragment the component API, and create confusion about where components live. Instead, add components directly to `@ui-kit/react` which already contains layout primitives (Stack, Panel, Card).

### Expected Features

Research identified clear feature priorities across four categories: layout components, entity cards, chat enhancements, and Copilot theme.

**Must have (table stakes):**
- PageHeader with breadcrumbs, actions row, responsive collapse — Standard enterprise app pattern
- SidePanel with overlay/push modes, collapsible state — Expected in modern UIs
- FileCard, PersonCard, EventCard — Core entity previews for productivity apps
- Reasoning steps with collapsible container — AI transparency expectation (Claude, Gemini provide this)
- Inline citations with reference list — AI credibility requirement
- Attachment pills with file metadata — Standard in chat UIs (Teams, Slack)
- Brand gradient tokens (3-color) — Core Copilot visual identity
- Smooth transitions (200ms default) — Modern UX baseline

**Should have (competitive):**
- TitleBar with Work/Web tabs — Copilot-specific chrome pattern
- Quick Answer button during reasoning — Skip long thinking for fast responses
- Reference preview on hover — Quick source verification (Perplexity pattern)
- Gradient animation on load — Premium feel (Koto design philosophy)
- Adaptive aspect ratios via container queries — Context-aware card images

**Defer (v2+):**
- Command palette (Cmd+K) for PageHeader — High complexity, nice-to-have
- SidePanel resize handle — Convenience feature, not critical
- Drag-to-reorder for cards — Complex interaction, specialized use case
- Screenshot paste enhancement — High complexity, niche
- Multi-panel layouts — Edge case, add when needed

### Architecture Approach

The ui-kit follows a proven surface-based token system where components use semantic tokens (`--base-bg`, `--base-fg`) that get remapped by surface classes (`.surface.primary`). This pattern naturally extends to all new components. The architecture is layered: primitives (Button, Input) → compositions (Card, Panel) → specializations (PersonaCard, ChatMessage). New components fit cleanly into existing layers without requiring architectural changes.

**Major components and integration points:**

1. **Core extensions** (tokens and themes) — Typography tokens add display sizes and semantic naming, brand flair tokens add gradient support, Copilot theme defines brand colors. All integrate via existing theme generator with zero generator code changes.

2. **Layout components in @ui-kit/react** — AppBar, SideNav, ContentLayout, ToolWindow compose from existing Stack, Panel primitives. No new dependencies. Use centralized z-index scale from core tokens to prevent layering conflicts.

3. **Card specializations in @ui-kit/react** — PersonaCard, ProjectCard, StatusCard extend base Card component with specialized content structures. Use container queries for adaptive aspect ratios. Implement accessible truncation patterns with "Show more" buttons.

4. **Chat enhancements in @ui-kit/react-chat** — ReasoningSteps, AttachmentPill, InlineCitation, ReferenceList extend existing chat components. Virtual scrolling (via existing @tanstack/react-virtual) is mandatory, not optional. Animate only transform/opacity for 60fps performance.

**Dependency flow remains clean:** `core` (foundation) → `icons` (standalone) → `react` (primitives + specializations) → `react-chat` (chat-specific). No circular dependencies introduced.

### Critical Pitfalls

Research identified five critical pitfalls that would cause rewrites or system-wide breakage if not prevented.

1. **Phantom dependencies in pnpm workspace** — Imports work locally due to hoisting but break in production. Prevention: Explicitly declare every direct import in package.json, test isolated builds (`pnpm --filter [package] build`), verify with `pnpm list --depth 0`.

2. **Circular dependencies between packages** — TypeScript project references forbid circular imports. Prevention: DO NOT create separate layout/cards packages. Add components to existing `@ui-kit/react` which already has needed primitives. Use madge to detect cycles (`npx madge --circular packages/ui-kit/`).

3. **Z-index wars from multiple component layers** — Modals, panels, dropdowns each define z-index scales that conflict. Prevention: Establish centralized z-index scale in `@ui-kit/core` tokens BEFORE building layout components. Avoid creating stacking contexts on layout containers (no `position: relative` with z-index).

4. **Chat performance degradation without virtualization** — 200+ messages cause catastrophic lag (< 30fps, 500ms input latency). Prevention: Use @tanstack/react-virtual from day one (already in react-chat dependencies). Test with 500+ messages during development, not just 10-20. Measure frame rates and enforce 60fps minimum.

5. **Broken high contrast / forced colors mode** — Components become invisible or unreadable in Windows High Contrast Mode. Prevention: Use design tokens instead of hardcoded colors. Test with forced-colors emulation in Chrome DevTools. Add `@media (forced-colors: active)` queries. Use system colors (Canvas, CanvasText, ButtonFace).

## Implications for Roadmap

Based on research, components should be built in dependency order, with foundation (tokens) before consumers (components). Performance and accessibility requirements must be addressed from the start, not retrofitted.

### Phase 1: Core Extensions (Foundation)
**Rationale:** Tokens must exist before components can use them. Core has no dependencies, can be built first. Changes are purely additive (no breaking changes).

**Delivers:**
- 6 new typography tokens (--text-5xl, --text-display, --text-title-1, --text-subtitle-1, --text-body-1/2/3, --text-caption-1/2)
- Brand flair token system (--brand-flair-1/2/3, --gradient-brand)
- Copilot theme definition (copilot.json with light/dark/high-contrast)
- All themes regenerated with new tokens

**Addresses:** Typography token expansion (FEATURES.md), brand gradient system (FEATURES.md), theme support (STACK.md)

**Avoids:** Typography token naming conflicts (PITFALLS.md #6) — semantic tokens map to existing scale tokens for backward compatibility

**Research needs:** NONE — Pattern is well-established, generator code unchanged

### Phase 2: Icon Additions (Content)
**Rationale:** Icons needed by layout and card components. Icon package is standalone, can be built in parallel with Phase 1.

**Delivers:**
- 30 new icons (sparkle, microphone, shield, pin, bookmark, briefcase, attachment, copilot, product icons, agent icons, status icons)
- React components generated via existing pipeline
- Sprite and font assets updated

**Addresses:** Icon requirements (STACK.md), AI indicators (FEATURES.md)

**Avoids:** No pitfalls identified — existing pipeline handles all formats

**Research needs:** NONE — Build scripts already support SVG → React component generation

### Phase 3: Layout Components (Structure)
**Rationale:** Layout components provide shell structure for other components. Must establish z-index scale and responsive breakpoints before card components use them.

**Delivers:**
- AppBar component (uses Stack, Panel)
- SideNav component (uses Panel, List)
- ContentLayout component (uses Stack)
- ToolWindow component (uses Panel, Modal)
- Centralized z-index tokens in core
- Consistent breakpoint tokens in core

**Addresses:** Layout components (FEATURES.md), page structure patterns (ARCHITECTURE.md)

**Avoids:** Z-index wars (PITFALLS.md #3), inconsistent breakpoints (PITFALLS.md #11)

**Research needs:** MEDIUM — Establish z-index scale and test layering edge cases. Verify no stacking context issues with flex/grid containers.

### Phase 4: Card Specializations (Content Display)
**Rationale:** Cards depend on layout primitives and benefit from layout components for testing context. Use container queries for adaptive sizing.

**Delivers:**
- PersonaCard component (extends Card, uses Avatar, Stack, Text)
- ProjectCard component (extends Card, uses Stack, Text, Progress)
- StatusCard component (extends Card, uses Stack, Text, Chip)
- Container query patterns for adaptive aspect ratios
- Accessible truncation with "Show more" buttons

**Addresses:** Entity cards (FEATURES.md), specialized card variants (ARCHITECTURE.md)

**Avoids:** Truncation accessibility issues (PITFALLS.md #7), aspect ratio problems (PITFALLS.md #8)

**Research needs:** MEDIUM — Test container query browser support, verify screen reader behavior with truncated content and expansion controls

### Phase 5: Chat Enhancements (AI Features)
**Rationale:** Chat components depend on icons (Phase 2) and potentially card components (Phase 4) for rich content display. Virtual scrolling is mandatory, not optional.

**Delivers:**
- ReasoningSteps component (collapsible, progress indicator)
- ReasoningStep component (individual step display)
- AttachmentPill component (file metadata, preview)
- AttachmentList component (multiple attachments)
- InlineCitation component (numbered citations)
- ReferenceList component (source panel)
- Virtual scrolling implementation (uses existing @tanstack/react-virtual)

**Addresses:** Chat enhancements (FEATURES.md), reasoning transparency (FEATURES.md), AI credibility (FEATURES.md)

**Avoids:** Chat performance degradation (PITFALLS.md #4), animation jank (PITFALLS.md #9)

**Research needs:** HIGH — Test virtualization with markdown rendering (react-markdown), measure performance with 500+ messages, enforce 60fps during animations (transform/opacity only)

### Phase 6: Accessibility Pass (Polish)
**Rationale:** Accessibility must be validated across all components. Test high contrast mode, screen readers, keyboard navigation.

**Delivers:**
- Windows High Contrast Mode support verified
- Screen reader testing complete (VoiceOver, NVDA)
- Keyboard navigation validated (Tab, Enter, Space, Escape)
- WCAG 2.1 AA compliance confirmed
- Forced colors mode media queries

**Addresses:** Accessibility requirements (implicit in all FEATURES.md), enterprise compliance

**Avoids:** Broken high contrast mode (PITFALLS.md #5), truncation accessibility (PITFALLS.md #7)

**Research needs:** HIGH — Manual testing required, no automated solution for all cases. Establish testing protocol and checklist.

### Phase Ordering Rationale

- **Foundation first (Phases 1-2):** Core and icons have no dependencies, provide tokens and assets for all other work. Can be built in parallel.

- **Structure then content (Phases 3-4):** Layout components establish patterns (z-index, breakpoints) that card components follow. Layout provides testing context for cards.

- **Chat enhancements after primitives (Phase 5):** Chat components may use icons and cards. Virtual scrolling needs performance testing with complete component set.

- **Accessibility validation last (Phase 6):** All components must exist before comprehensive accessibility testing. Manual testing across all components is time-intensive, better as dedicated phase.

- **Phases 3-4 can partially parallelize:** Layout and cards don't strictly depend on each other, but cards benefit from layout context for testing. Start layout first, begin cards once layout structure is clear.

### Research Flags

Phases likely needing deeper research during planning:

- **Phase 3 (Layout):** Z-index scale coordination, stacking context issues with flex/grid containers. Need to test edge cases with nested layouts and portals.

- **Phase 5 (Chat):** Virtual scrolling with dynamic markdown heights, performance measurement protocols, testing with 500+ messages. Need to establish performance budget and measurement tooling.

- **Phase 6 (Accessibility):** Windows High Contrast Mode testing strategy, screen reader testing protocol, automated vs manual testing balance.

Phases with standard patterns (skip deep research):

- **Phase 1 (Core):** Token system is well-established, changes are purely additive. Theme generator handles everything automatically.

- **Phase 2 (Icons):** Icon pipeline is proven, just adding content. Build scripts unchanged.

- **Phase 4 (Cards):** Component composition follows existing patterns. Container queries are well-documented, browser support is strong (2026).

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified from existing package.json files, no new dependencies needed |
| Features | HIGH | Clear priorities from gap analysis, multiple design system references |
| Architecture | HIGH | Existing architecture patterns proven, no changes needed |
| Pitfalls | MEDIUM-HIGH | Well-documented in recent sources, some reliance on community best practices |

**Overall confidence:** HIGH

The stack analysis is definitive (inspected actual codebase), feature research draws from established design systems (Fluent, Atlassian, Soul), and architecture analysis is based on working code patterns. Pitfall research draws from recent (2024-2026) articles and official documentation, with some reliance on community consensus for best practices.

### Gaps to Address

Areas where research was inconclusive or needs validation during implementation:

- **pnpm hoisting configuration** — Need to determine if strict isolation is sufficient or if shamefully-hoist required for specific packages. Test during Phase 3 setup.

- **Container query browser support in target environments** — Verify browser support requirements. Container queries widely supported in 2026, but need to check minimum browser versions for target users. Polyfill may be needed for older Safari.

- **Virtual scrolling with markdown rendering complexity** — @tanstack/react-virtual works well with fixed heights, but markdown messages have dynamic heights. Need to test interaction between react-markdown and virtual scrolling during Phase 5. May need to measure heights after markdown render for accurate virtualization.

- **Forced colors mode automated testing** — Manual testing with Windows High Contrast Mode is straightforward, but need to determine if Playwright or other tooling can automate this for CI/CD. Research during Phase 6 planning.

- **Typography token migration strategy** — Adding semantic tokens (body-1, caption-1) alongside existing scale tokens (text-base, text-sm) creates two naming systems. Need to document which to use and provide migration guidance for future component development. Plan during Phase 1.

## Sources

### Primary (HIGH confidence)

**Internal Codebase:**
- `/packages/ui-kit/core/src/themes/generator.ts` — Theme generation system architecture
- `/packages/ui-kit/core/src/themes/schema/theme-rules.json` — Token derivation rules
- `/packages/ui-kit/core/src/tokens/typography.ts` — Typography token system
- `/packages/ui-kit/react/src/index.ts` — Component export structure and patterns
- `/packages/ui-kit/react/vite.config.ts` — Build configuration
- `/packages/ui-kit/react-chat/package.json` — Verified @tanstack/react-virtual dependency

**Official Documentation:**
- Microsoft Learn — Windows High Contrast Mode, Fluent design
- MDN Web Docs — Stacking contexts, container queries, animation performance
- pnpm Official Docs — Phantom dependencies, workspace hoisting
- Material Design 3 — Typography type scale tokens

### Secondary (MEDIUM confidence)

**Technical Blogs:**
- Josh Comeau (joshwcomeau.com) — Z-index and stacking contexts (CSS fundamentals)
- Sara Soueidan (sarasoueidan.com) — Component-level art direction with container queries
- LogRocket — Virtual scrolling performance, CSS animation optimization
- Smashing Magazine — Windows High Contrast Mode guide

**Design System References:**
- Fluent UI React v9 — Component patterns, accessibility
- Atlassian Design System — Page layout, page header patterns
- Soul Design System — Side panel patterns
- Ant Design — Layout component architecture

**Community Articles:**
- DEV Community — Container queries guide, CSS animation performance
- Medium — Phantom dependencies (pnpm), typography tokens, reflow/repaint
- UX Collective — Typography in design systems with semantic tokens

**GitHub Discussions:**
- TypeScript Issue #33685 — Circular project references
- Open WebUI Issue #13787 — Chat performance with large history

### Tertiary (LOW confidence, needs validation)

**Copilot Brand Research:**
- Koto Studio case study — Microsoft Copilot+ PC branding (motion principles, gradient philosophy)
- Creative Bloq, Branding in Asia — Secondary coverage of Koto design work
- Design Your Way — Copilot logo history and color palette

Note: Copilot brand research relies on design agency case studies and secondary coverage rather than official Microsoft design documentation. Brand colors and gradient approach verified through multiple sources but should be validated against official Copilot brand guidelines if available.

---
*Research completed: 2026-02-01*
*Ready for roadmap: yes*
