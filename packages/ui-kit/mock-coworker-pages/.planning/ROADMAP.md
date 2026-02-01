# Roadmap: UI-Kit Coworker Parity

**Created:** 2025-02-01
**Milestone:** v1.0 Coworker Parity
**Phases:** 7

## Overview

| Phase | Name | Goal | Requirements | Status |
|-------|------|------|--------------|--------|
| 1 | Core Chat Enhancements | Add attachments, citations, feedback, suggestions to react-chat | CHAT-04 to CHAT-13 | Pending |
| 2 | AI Reasoning Components | Add chain-of-thought display components | CHAT-01 to CHAT-03, CHAT-14 | Pending |
| 3 | Entity Cards Package | Create react-cards package with structured cards | CARDS-01 to CARDS-06 | Pending |
| 4 | Layout Package | Create react-layout package with page structure | LAYOUT-01 to LAYOUT-06 | Pending |
| 5 | Core Enhancements | Enhance Button, Chip, Avatar; add notifications | CORE-01 to CORE-10 | Pending |
| 6 | Token System | Extend typography scale, add brand flair tokens | TOKEN-01 to TOKEN-07 | Pending |
| 7 | Icons | Add new UI icons | ICON-01 to ICON-08 | Pending |

---

## Phase 1: Core Chat Enhancements

**Goal:** Add essential chat components for attachments, citations, feedback, and suggestions to `@ui-kit/react-chat`

**Requirements:**
- CHAT-04: AttachmentPill
- CHAT-05: AttachmentList
- CHAT-06: Citation
- CHAT-07: ReferenceList
- CHAT-08: ReferencePanel
- CHAT-09: SuggestionCard
- CHAT-10: FeedbackButtons
- CHAT-11: FeedbackForm
- CHAT-12: SystemMessage
- CHAT-13: ChatInput enhanced

**Success Criteria:**
1. User can see file attachments as pills with icon and filename
2. User can see inline citations that link to references
3. User can expand reference panel to see source details
4. User can provide thumbs up/down feedback on messages
5. User can see prompt starter suggestions
6. User can see system messages in chat flow

**Dependencies:** None (foundation phase)

---

## Phase 2: AI Reasoning Components

**Goal:** Add chain-of-thought display components for showing AI reasoning process

**Requirements:**
- CHAT-01: ReasoningSteps
- CHAT-02: ReasoningStep
- CHAT-03: ReasoningProgress
- CHAT-14: ThinkingIndicator duration variant

**Success Criteria:**
1. User can see collapsible reasoning steps during AI thinking
2. User can expand individual reasoning steps to see details
3. User can see "Reasoned for X seconds" indicator
4. Reasoning display integrates with existing ThinkingIndicator

**Dependencies:** Phase 1 (builds on chat foundation)

---

## Phase 3: Entity Cards Package

**Goal:** Create `@ui-kit/react-cards` package with structured entity card components

**Requirements:**
- CARDS-01: Package setup
- CARDS-02: FileCard
- CARDS-03: PersonCard
- CARDS-04: EventCard
- CARDS-05: LinkCard
- CARDS-06: EntityList

**Success Criteria:**
1. Package builds and exports all components
2. FileCard displays document preview with icon, title, metadata
3. PersonCard displays user with avatar, name, role/status
4. EventCard displays meeting with time, title, attendees
5. LinkCard displays URL preview with favicon and description
6. EntityList renders cards in grid or list layout

**Dependencies:** None (new package)

---

## Phase 4: Layout Package

**Goal:** Create `@ui-kit/react-layout` package with page structure components

**Requirements:**
- LAYOUT-01: Package setup
- LAYOUT-02: PageHeader
- LAYOUT-03: TitleBar
- LAYOUT-04: ContentHeader
- LAYOUT-05: SidePanel
- LAYOUT-06: PageContainer

**Success Criteria:**
1. Package builds and exports all components
2. PageHeader displays page title with action button slots
3. TitleBar displays app-level navigation bar
4. ContentHeader displays section dividers with titles
5. SidePanel supports collapsible side content
6. PageContainer provides consistent page wrapper with spacing

**Dependencies:** None (new package)

---

## Phase 5: Core Component Enhancements

**Goal:** Enhance existing react components and add notification system

**Requirements:**
- CORE-01: Button loading
- CORE-02: Button action variant
- CORE-03: Chip media slot
- CORE-04: Chip clickable variant
- CORE-05: Avatar presence
- CORE-06: NotificationBell
- CORE-07: NotificationItem
- CORE-08: NotificationList
- CORE-09: TourPopover
- CORE-10: OnboardingDialog

**Success Criteria:**
1. Button shows spinner when loading prop is true
2. Button action variant has icon + label styling
3. Chip can display icon or avatar in media slot
4. Chip can be clicked as a toggle/action
5. Avatar shows presence dot (online/away/offline)
6. NotificationBell shows badge count and opens dropdown
7. TourPopover displays onboarding hints with arrows

**Dependencies:** Phase 6 (may need new tokens)

---

## Phase 6: Token System Extensions

**Goal:** Extend typography scale and add brand flair tokens to core

**Requirements:**
- TOKEN-01: Display (68px)
- TOKEN-02: Large title (40px)
- TOKEN-03: Title-1 (28px)
- TOKEN-04: Subtitle-2 (16px)
- TOKEN-05: Captions (12px, 10px)
- TOKEN-06: Brand flair colors
- TOKEN-07: Gradient brand variable

**Success Criteria:**
1. New typography tokens available in all themes
2. Display and large title sizes work for hero content
3. Caption sizes work for metadata and labels
4. Brand flair gradient renders correctly
5. Tokens documented in Storybook

**Dependencies:** None (token changes)

---

## Phase 7: Icons

**Goal:** Add new UI icons to `@ui-kit/react-icons`

**Requirements:**
- ICON-01: SparkleIcon
- ICON-02: MicrophoneIcon
- ICON-03: MicrophoneOffIcon
- ICON-04: ShieldIcon
- ICON-05: ShieldLockIcon
- ICON-06: PinIcon
- ICON-07: BookmarkIcon
- ICON-08: BriefcaseIcon

**Success Criteria:**
1. All icons render at standard sizes (16, 20, 24)
2. Icons follow existing icon design patterns
3. Icons support currentColor for theming
4. Icons documented in icon gallery

**Dependencies:** None (can be done in parallel)

---

## Parallel Execution Options

These phases can run in parallel:
- Phase 3 (Cards) + Phase 4 (Layout) — independent new packages
- Phase 6 (Tokens) + Phase 7 (Icons) — independent additions

Recommended execution order:
1. Phase 1 → Phase 2 (chat foundation then reasoning)
2. Phase 3 || Phase 4 (parallel package creation)
3. Phase 5 (core enhancements, may use new tokens)
4. Phase 6 || Phase 7 (parallel token/icon work)

---

*Roadmap created: 2025-02-01*
*Last updated: 2025-02-01*
