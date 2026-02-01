# Roadmap: ui-kit

## Milestones

- ✅ **v1.0 Chat UX Unification** - Phases 1-4 (shipped 2026-01-18, Phases 5-6 deferred)
- 🚧 **v2.0 Coworker Design System Parity** - Phases 7-12 (in progress)

## Phases

<details>
<summary>✅ v1.0 Chat UX Unification (Phases 1-4) - SHIPPED 2026-01-18</summary>

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
- [x] 01-01-PLAN.md — Types and context setup
- [x] 01-02-PLAN.md — ChatLayout mode prop integration

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
- [x] 03-01-PLAN.md — ChatMessage group mode rendering
- [x] 03-02-PLAN.md — ChatGroupHeader component with stacked avatars

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
- [x] 04-01-PLAN.md — MessageToolbar component
- [x] 04-02-PLAN.md — Toolbar integration with ChatMessage

### Phase 5: Keyboard Navigation (DEFERRED)
**Goal**: Make messages accessible via keyboard
**Depends on**: Phase 4
**Requirements**: KEY-01, KEY-02, KEY-03
**Success Criteria** (what must be TRUE):
  1. Messages are focusable via Tab key
  2. Focused message shows toolbar without requiring hover
  3. Toolbar actions can be triggered via keyboard when message is focused
**Plans**: Deferred to future milestone

### Phase 6: Stories (DEFERRED)
**Goal**: Document both modes in Storybook with interactive examples
**Depends on**: Phase 5
**Requirements**: STY-01, STY-02, STY-03
**Success Criteria** (what must be TRUE):
  1. 1-on-1 mode story demonstrates SubtleEmphasis design
  2. Group mode story demonstrates GroupSubtle design
  3. Stories show interactive hover toolbar behavior
  4. Developers can understand usage by viewing stories
**Plans**: Deferred to future milestone

</details>

### 🚧 v2.0 Coworker Design System Parity (In Progress)

**Milestone Goal:** Implement layout, card, and chat components to achieve visual parity with Coworker design system

#### Phase 7: Core Extensions
**Goal**: Extend token system with Copilot theme, typography levels, and brand gradients
**Depends on**: Nothing (new milestone foundation)
**Requirements**: TKN-01, TKN-02, TKN-03, TKN-04, TKN-05, TKN-06, TKN-07, TKN-08, TKN-09
**Success Criteria** (what must be TRUE):
  1. Copilot theme exists with light and dark mode color definitions
  2. Brand flair gradient tokens are available for use in components
  3. Typography tokens include display (68px), large-title (40px), and title-1 (28px) levels
  4. Typography tokens include subtitle-2 (16px), body-2/3 (14px, 12px), and caption-1/2 (12px, 10px) levels
  5. All themes regenerated successfully with new token additions
**Plans**: 3 plans (1 wave, all parallel)

Plans:
- [x] 07-01-PLAN.md — Copilot theme definition and generation
- [x] 07-02-PLAN.md — Typography token extensions (display, title, body, caption levels)
- [x] 07-03-PLAN.md — Brand flair gradient tokens

#### Phase 8: Icons
**Goal**: Add UI icons and create product icons package for Microsoft and agent branding
**Depends on**: Phase 7
**Requirements**: ICN-01, ICN-02, ICN-03, ICN-04, ICN-05, ICN-06, ICN-07, ICN-08, ICN-09
**Success Criteria** (what must be TRUE):
  1. SparkleIcon, MicrophoneIcon/MicrophoneOffIcon, ShieldIcon/ShieldLockIcon exist in @ui-kit/icons
  2. PinIcon, BookmarkIcon, BriefcaseIcon exist in @ui-kit/icons
  3. Product icons package structure created with proper build pipeline
  4. Microsoft product icons (Word, Excel, PowerPoint, Outlook, Teams, OneDrive, SharePoint) available
  5. Agent icons (Analyst, Researcher, Planner, CatchUp) available
**Plans**: 4 plans (2 waves)

Plans:
- [x] 08-01-PLAN.md — UI icons additions (SparkleIcon, MicrophoneIcon, ShieldIcon, PinIcon, BookmarkIcon, BriefcaseIcon)
- [x] 08-02-PLAN.md — Product icons package setup (@ui-kit/react-product-icons)
- [x] 08-03-PLAN.md — Microsoft product icons (Word, Excel, PowerPoint, Outlook, Teams, OneDrive, SharePoint)
- [x] 08-04-PLAN.md — Agent icons (Analyst, Researcher, Planner, CatchUp)

#### Phase 9: Layout Components
**Goal**: Deliver page structure components with centralized z-index coordination
**Depends on**: Phase 8
**Requirements**: LAY-01, LAY-02, LAY-03, LAY-04, QS-05
**Success Criteria** (what must be TRUE):
  1. PageHeader component displays title, breadcrumbs, and action slots responsively
  2. TitleBar component provides app-level navigation with Work/Web tabs
  3. SidePanel supports collapsible overlay and push modes
  4. ContentLayout provides standard page wrapper with header/content/footer slots
  5. Z-index scale prevents layering conflicts between components
  6. mock-coworker-pages contains real use cases mirroring demo states from coworker-demo.lovable.app for each layout component
**Plans**: 4 plans (3 waves)

Plans:
- [ ] 09-01-PLAN.md — Z-index scale establishment
- [ ] 09-02-PLAN.md — PageHeader and TitleBar components
- [ ] 09-03-PLAN.md — SidePanel component
- [ ] 09-04-PLAN.md — ContentLayout and mock pages integration

#### Phase 10: Card Components
**Goal**: Create specialized card variants for common entity types
**Depends on**: Phase 9
**Requirements**: CRD-01, CRD-02, CRD-03, CRD-04, QS-05
**Success Criteria** (what must be TRUE):
  1. FileCard displays document previews with thumbnails and metadata
  2. PersonCard shows user information with avatar and presence indicator
  3. EventCard renders meeting/calendar events with time and participants
  4. LinkCard shows URL previews with fetched metadata and images
  5. Cards use container queries for adaptive aspect ratios
  6. mock-coworker-pages contains real use cases mirroring demo states from coworker-demo.lovable.app for each card component
**Plans**: TBD

Plans:
- [ ] 10-01: FileCard and LinkCard components
- [ ] 10-02: PersonCard and EventCard components
- [ ] 10-03: Container query patterns and truncation

#### Phase 11: Chat Enhancements
**Goal**: Add reasoning steps, citations, attachments, and feedback to chat experience
**Depends on**: Phase 10
**Requirements**: CHT-01, CHT-02, CHT-03, CHT-04, CHT-05, CHT-06, CHT-07, CHT-08, CHT-09, QS-05
**Success Criteria** (what must be TRUE):
  1. ReasoningSteps container displays chain-of-thought with collapsible steps
  2. ReasoningProgress shows "Thinking for X seconds" indicator during processing
  3. InlineCitation displays numbered reference markers within message content
  4. ReferenceList and ReferencePanel show citation details
  5. AttachmentPill and AttachmentList display file attachments with metadata
  6. FeedbackButtons enable thumbs up/down responses
  7. Virtual scrolling maintains 60fps performance with 500+ messages
  8. mock-coworker-pages contains real use cases mirroring demo states from coworker-demo.lovable.app for each chat component
**Plans**: TBD

Plans:
- [ ] 11-01: Reasoning steps and progress components
- [ ] 11-02: Citation and reference components
- [ ] 11-03: Attachment components
- [ ] 11-04: Feedback buttons and virtualization validation

#### Phase 12: Visual Audit & Polish
**Goal**: Verify all components meet quality standards and achieve visual parity with Coworker
**Depends on**: Phase 11
**Requirements**: QS-01, QS-02, QS-03, QS-04 (applied to all components)
**Success Criteria** (what must be TRUE):
  1. All components follow COMPONENT_GUIDE.md patterns (sizing, accessibility, RTL, animations)
  2. Package README files reference component guide for developers
  3. Each component visually audited against coworker-demo.lovable.app/design-system
  4. No visual glitches, misalignment, or jarring interactions exist
  5. Windows High Contrast Mode support verified for all components
**Plans**: TBD

Plans:
- [ ] 12-01: Component guide compliance audit
- [ ] 12-02: Visual parity verification
- [ ] 12-03: Accessibility testing (High Contrast Mode, screen readers, keyboard)
- [ ] 12-04: Polish pass (animations, transitions, edge cases)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 7 → 8 → 9 → 10 → 11 → 12

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Mode Foundation | v1.0 | 2/2 | Complete | 2026-01-17 |
| 2. 1-on-1 Mode | v1.0 | 1/1 | Complete | 2026-01-17 |
| 3. Group Mode | v1.0 | 2/2 | Complete | 2026-01-18 |
| 4. Hover Toolbar | v1.0 | 2/2 | Complete | 2026-01-18 |
| 5. Keyboard Navigation | v1.0 | 0/0 | Deferred | - |
| 6. Stories | v1.0 | 0/0 | Deferred | - |
| 7. Core Extensions | v2.0 | 3/3 | Complete | 2026-02-01 |
| 8. Icons | v2.0 | 4/4 | Complete | 2026-02-01 |
| 9. Layout Components | v2.0 | 0/4 | Not started | - |
| 10. Card Components | v2.0 | 0/3 | Not started | - |
| 11. Chat Enhancements | v2.0 | 0/4 | Not started | - |
| 12. Visual Audit & Polish | v2.0 | 0/4 | Not started | - |

---
*Roadmap created: 2026-01-17*
*v1.0 milestone completed: 2026-01-18 (Phases 1-4)*
*v2.0 milestone started: 2026-02-01*
*Total v1.0 requirements: 25 (100% coverage)*
*Total v2.0 requirements: 31 (100% coverage)*
