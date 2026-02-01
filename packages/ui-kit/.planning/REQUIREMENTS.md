# Requirements: v2.0 Coworker Design System Parity

## Quality Standards (Apply to ALL)

- **QS-01**: All components follow COMPONENT_GUIDE.md patterns (sizing, accessibility, RTL, animations)
- **QS-02**: Package README files reference component guide
- **QS-03**: Each component visually audited against coworker-demo.lovable.app/design-system
- **QS-04**: UX must be beautiful, fluent, polished — no visual glitches, misalignment, or jarring interactions

---

## Theme & Tokens

- [ ] **TKN-01**: Create Copilot theme definition (copilot.json) with light mode colors
- [ ] **TKN-02**: Add dark mode overrides to Copilot theme
- [ ] **TKN-03**: Add brand flair gradient tokens (#464FEB, #47CFFA, #B47CF8)
- [ ] **TKN-04**: Add display typography level (68px)
- [ ] **TKN-05**: Add large-title typography level (40px)
- [ ] **TKN-06**: Add title-1 typography level (28px)
- [ ] **TKN-07**: Add subtitle-2 typography level (16px)
- [ ] **TKN-08**: Add body-2/body-3 typography levels (14px, 12px)
- [ ] **TKN-09**: Add caption-1/caption-2 typography levels (12px, 10px)

---

## Chat Enhancements (@ui-kit/react-chat)

### Reasoning Steps
- [ ] **CHT-01**: ReasoningSteps container component for chain-of-thought display
- [ ] **CHT-02**: ReasoningStep individual step with collapsible content
- [ ] **CHT-03**: ReasoningProgress indicator ("Thinking for X seconds")

### Citations & References
- [ ] **CHT-04**: InlineCitation component for inline reference markers
- [ ] **CHT-05**: ReferenceList component for citation list display
- [ ] **CHT-06**: ReferencePanel slide-out panel for reference details

### Attachments
- [ ] **CHT-07**: AttachmentPill component for file attachment display
- [ ] **CHT-08**: AttachmentList component for multiple attachments

### Feedback
- [ ] **CHT-09**: FeedbackButtons component (thumbs up/down)

---

## Layout Components (@ui-kit/react)

- [ ] **LAY-01**: PageHeader component with title, breadcrumbs, action slots
- [ ] **LAY-02**: TitleBar component for app-level navigation
- [ ] **LAY-03**: SidePanel collapsible side content panel
- [ ] **LAY-04**: ContentLayout standard page wrapper with header/content/footer slots

---

## Card Components (@ui-kit/react)

- [ ] **CRD-01**: FileCard component for document/file previews with thumbnail
- [ ] **CRD-02**: PersonCard component for user/contact display with avatar, presence
- [ ] **CRD-03**: EventCard component for meeting/calendar events
- [ ] **CRD-04**: LinkCard component for URL previews with metadata

---

## Icons

### UI Icons (@ui-kit/icons)
- [ ] **ICN-01**: SparkleIcon for AI/magic indicators
- [ ] **ICN-02**: MicrophoneIcon and MicrophoneOffIcon for voice input
- [ ] **ICN-03**: ShieldIcon and ShieldLockIcon for security indicators
- [ ] **ICN-04**: PinIcon and BookmarkIcon for save actions
- [ ] **ICN-05**: BriefcaseIcon for work/business context

### Product Icons (@ui-kit/react-product-icons - NEW PACKAGE)
- [ ] **ICN-06**: Create react-product-icons package structure
- [ ] **ICN-07**: Microsoft product icons (Word, Excel, PowerPoint, Outlook)
- [ ] **ICN-08**: Microsoft product icons (Teams, OneDrive, SharePoint)
- [ ] **ICN-09**: Agent icons (Analyst, Researcher, Planner, CatchUp)

---

## Future Requirements (Deferred)

- High contrast mode support (TKN-10)
- SuggestionCard/PromptStarter components
- NotificationBell, NotificationItem, NotificationList
- TourPopover, OnboardingDialog
- Voice input components

---

## Out of Scope

- Creating separate react-layout or react-cards packages (add to existing react package per architecture research)
- Microsoft Defender, Power Apps, Designer icons (low priority)
- First Run Experience components
- Sensitivity labels

---

## Traceability

| Phase | Requirements |
|-------|--------------|
| TBD | TBD |

*Requirements defined: 2026-02-01*
*Total requirements: 31 (9 tokens, 9 chat, 4 layout, 4 cards, 5 icons)*
