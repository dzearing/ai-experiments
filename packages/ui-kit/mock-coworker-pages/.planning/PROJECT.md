# UI-Kit Coworker Design System Parity

## What This Is

Extension of the `@ui-kit` design system to achieve feature parity with the Microsoft Coworker/Copilot design system. This includes new packages (`react-layout`, `react-cards`), enhancements to existing packages (`react-chat`, `react`), new icons, and token system evolution.

## Core Value

Provide a complete component library that enables building AI chat experiences comparable to Microsoft Copilot, using ui-kit's existing surface-based theming and token architecture.

## Current Milestone: v1.0 Coworker Parity

**Goal:** Implement core components needed to recreate Coworker demo states

**Target features:**
- New `@ui-kit/react-layout` package (PageHeader, TitleBar, SidePanel)
- New `@ui-kit/react-cards` package (FileCard, PersonCard, EventCard)
- Enhanced `@ui-kit/react-chat` (ReasoningSteps, Citations, Attachments, Feedback)
- Core component enhancements (Button loading, Avatar presence, notifications)
- New icons (sparkle, microphone, shield, etc.)
- Token system extensions (typography scale, brand flair)

## Requirements

### Validated

(None yet — ship to validate)

### Active

See `.planning/REQUIREMENTS.md` for full requirements list.

**New Packages:**
- [ ] `@ui-kit/react-layout` package with layout components
- [ ] `@ui-kit/react-cards` package with entity cards

**react-chat Enhancements:**
- [ ] ReasoningSteps components for chain-of-thought display
- [ ] Citation and reference components
- [ ] Attachment components
- [ ] Feedback components (thumbs up/down)
- [ ] SuggestionCard for prompt starters

**react Enhancements:**
- [ ] Button loading state
- [ ] Avatar presence indicator
- [ ] Notification components
- [ ] TourPopover for onboarding

**Icons:**
- [ ] UI icons (sparkle, microphone, shield, pin, bookmark)

**Tokens:**
- [ ] Extended typography scale
- [ ] Brand flair gradient tokens

### Out of Scope

- Microsoft product icons (Word, Excel, etc.) — trademark concerns
- Agent-specific icons (analyst, researcher) — too product-specific
- Voice input component — complex, defer to v2
- Sensitivity labels — enterprise-specific

## Context

**Existing Foundation:**
- `@ui-kit/core` — token system with 20 themes, surface-based colors
- `@ui-kit/react` — 65+ components
- `@ui-kit/react-chat` — chat-specific components (ChatInput, ChatMessage, ThinkingIndicator)
- `@ui-kit/react-icons` — 103 icons

**Research Source:**
- Coworker demo at https://coworker-demo.lovable.app/
- Gap analysis documented in `GAP_ANALYSIS.md`
- Coworker inventory in `COWORKER_DESIGN_SYSTEM.md`
- UI-Kit inventory in `UIKIT_DESIGN_SYSTEM.md`

## Constraints

- **Tech stack**: React, TypeScript, CSS Modules, Storybook
- **Token system**: Must integrate with existing surface-based theming
- **Naming**: Generic names only (FileCard not DocumentCard, EventCard not MeetingCard)
- **Package structure**: Follow existing ui-kit patterns

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Create react-layout package | Separation of concerns — layout components are distinct from primitives | — Pending |
| Create react-cards package | Entity cards are a cohesive category worth grouping | — Pending |
| AI components in react-chat | All conversation-related components belong together | — Pending |
| Generic naming | Avoid product-specific terms for reusability | — Pending |

---
*Last updated: 2025-02-01 after gap analysis completion*
