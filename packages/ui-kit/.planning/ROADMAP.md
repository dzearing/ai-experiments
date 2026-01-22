# Roadmap: Chat UX Unification

## Overview

This roadmap transforms the react-chat package to support both 1-on-1 AI conversations (SubtleEmphasis design) and multi-user chat rooms (GroupSubtle design) through a unified mode-aware API. The journey starts with establishing the type foundation and context system, progresses through implementing each mode's distinct rendering, adds interaction capabilities (hover toolbar, keyboard navigation), and concludes with Storybook documentation. Each phase delivers a coherent, testable capability.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Mode Foundation** - Type system, context provider, mode prop infrastructure
- [x] **Phase 2: 1-on-1 Mode** - SubtleEmphasis design with primary-tinted user messages
- [x] **Phase 3: Group Mode** - GroupSubtle design with avatars, sender names, consecutive compaction
- [x] **Phase 4: Hover Toolbar** - Message actions (time, copy, edit) on hover/focus
- [ ] **Phase 5: Keyboard Navigation** - Accessible message focus and toolbar interaction
- [ ] **Phase 6: Stories** - Storybook documentation for both modes

## Phase Details

### Phase 1: Mode Foundation
**Goal**: Establish the type system and context infrastructure that enables mode-aware rendering
**Depends on**: Nothing (first phase)
**Requirements**: MODE-01, MODE-02, MODE-03
**Success Criteria** (what must be TRUE):
  1. ChatLayout accepts mode prop with '1on1' or 'group' values
  2. Mode defaults to '1on1' when not specified (backwards compatibility)
  3. ChatMessage component can read mode from context and adapt behavior
  4. Existing ChatLayout consumers continue working without changes
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md — Types and context setup (ChatMode, ChatParticipant, ChatProvider, useChatContext)
- [x] 01-02-PLAN.md — ChatLayout mode prop integration and ChatMessage context wiring

### Phase 2: 1-on-1 Mode
**Goal**: Implement SubtleEmphasis design for user/assistant conversations
**Depends on**: Phase 1
**Requirements**: ONE-01, ONE-02, ONE-03, ONE-04, ONE-05
**Success Criteria** (what must be TRUE):
  1. User messages display with primary background tint, visually distinct
  2. Assistant messages display with transparent background
  3. Messages are full-width and left-aligned (no SMS-style bubbles)
  4. No avatars or sender labels appear in 1-on-1 mode
  5. Messages have subtle border-radius for visual separation
**Plans**: 1 plan

Plans:
- [x] 02-01-PLAN.md — SubtleEmphasis CSS and mode-conditional rendering

### Phase 3: Group Mode
**Goal**: Implement GroupSubtle design for multi-participant conversations
**Depends on**: Phase 2
**Requirements**: GRP-01, GRP-02, GRP-03, GRP-04, GRP-05
**Success Criteria** (what must be TRUE):
  1. Each participant has a small colored avatar with initials
  2. Sender name appears above message content
  3. User messages have primary background, others transparent
  4. Consecutive messages from same sender collapse (avatar/name hidden)
  5. Header displays stacked participant avatars
**Plans**: 2 plans

Plans:
- [x] 03-01-PLAN.md — ChatMessage group mode rendering (GRP-01, GRP-02, GRP-03, GRP-04)
- [x] 03-02-PLAN.md — ChatGroupHeader component with stacked avatars (GRP-05)

### Phase 4: Hover Toolbar
**Goal**: Enable message actions via hover toolbar
**Depends on**: Phase 3
**Requirements**: TBR-01, TBR-02, TBR-03, TBR-04, TBR-05, TBR-06
**Success Criteria** (what must be TRUE):
  1. Toolbar appears in top-right corner when hovering a message
  2. Toolbar displays formatted timestamp
  3. Copy button copies message content to clipboard
  4. Edit button is present when enabled (off by default)
  5. Toolbar styling adapts to message type (user vs assistant)
**Plans**: 2 plans

Plans:
- [x] 04-01-PLAN.md — MessageToolbar component with timestamp, copy button, edit button, backdrop blur
- [x] 04-02-PLAN.md — Toolbar integration with ChatMessage and action wiring

### Phase 5: Keyboard Navigation
**Goal**: Make messages accessible via keyboard
**Depends on**: Phase 4
**Requirements**: KEY-01, KEY-02, KEY-03
**Success Criteria** (what must be TRUE):
  1. Messages are focusable via Tab key
  2. Focused message shows toolbar without requiring hover
  3. Toolbar actions can be triggered via keyboard when message is focused
**Plans**: TBD

Plans:
- [ ] 05-01: Message focus management
- [ ] 05-02: Keyboard-triggered toolbar actions

### Phase 6: Stories
**Goal**: Document both modes in Storybook with interactive examples
**Depends on**: Phase 5
**Requirements**: STY-01, STY-02, STY-03
**Success Criteria** (what must be TRUE):
  1. 1-on-1 mode story demonstrates SubtleEmphasis design
  2. Group mode story demonstrates GroupSubtle design
  3. Stories show interactive hover toolbar behavior
  4. Developers can understand usage by viewing stories
**Plans**: TBD

Plans:
- [ ] 06-01: 1-on-1 mode story
- [ ] 06-02: Group mode story

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Mode Foundation | 2/2 | Complete | 2026-01-17 |
| 2. 1-on-1 Mode | 1/1 | Complete | 2026-01-17 |
| 3. Group Mode | 2/2 | Complete | 2026-01-18 |
| 4. Hover Toolbar | 2/2 | Complete | 2026-01-18 |
| 5. Keyboard Navigation | 0/2 | Not started | - |
| 6. Stories | 0/2 | Not started | - |

---
*Roadmap created: 2026-01-17*
*Phase 1 planned: 2026-01-17*
*Phase 2 planned: 2026-01-17*
*Phase 3 planned: 2026-01-17*
*Phase 4 planned: 2026-01-18*
*Total v1 requirements: 25*
*Coverage: 25/25 mapped*
