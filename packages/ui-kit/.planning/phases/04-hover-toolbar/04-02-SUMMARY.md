---
phase: 04-hover-toolbar
plan: 02
subsystem: ui
tags: [react, chat, css-modules, hover-toolbar, integration]

# Dependency graph
requires:
  - phase: 04-hover-toolbar
    plan: 01
    provides: MessageToolbar component
provides:
  - ChatMessage with integrated hover toolbar
  - Hover reveal CSS for both 1-on-1 and group modes
  - enableEdit and onEdit props for edit functionality
  - Copy functionality via getContent callback
affects: [04-hover-toolbar]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "extractTextContent helper for clipboard copy"
    - "CSS hover/focus-within reveal pattern"
    - "Position relative parent + absolute child for overlay"

key-files:
  created: []
  modified:
    - react-chat/src/components/ChatMessage/ChatMessage.tsx
    - react-chat/src/components/ChatMessage/ChatMessage.module.css
    - react-chat/src/components/ChatMessage/ChatMessage.stories.tsx

key-decisions:
  - "Position relative added to oneOnOneMessage for toolbar positioning"
  - "Toolbar opacity transition (not visibility) for smooth fade"
  - "Focus-within alongside hover for keyboard accessibility"
  - "extractTextContent filters to text parts only"
  - "Deprecated menuItems/onMenuSelect replaced with enableEdit/onEdit"

patterns-established:
  - "Hover toolbar integration: parent handles visibility via CSS"
  - "useCallback for getContent to avoid recreating on each render"

# Metrics
duration: 5min
completed: 2026-01-18
---

# Phase 4 Plan 2: ChatMessage Integration Summary

**MessageToolbar integrated into ChatMessage with hover reveal, copy functionality, and optional edit button**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-18
- **Completed:** 2026-01-18
- **Tasks:** 3
- **Files created:** 0
- **Files modified:** 3

## Accomplishments
- Added hover reveal CSS for MessageToolbar in ChatMessage.module.css
- Integrated MessageToolbar into ChatMessage component for both modes
- Created extractTextContent helper for clipboard copy functionality
- Added enableEdit and onEdit props replacing deprecated menuItems/onMenuSelect
- Updated Storybook stories to demonstrate toolbar functionality

## Task Commits

Each task was committed atomically:

1. **Task 1: Add hover reveal CSS for MessageToolbar** - `124f500` (style)
2. **Task 2: Integrate MessageToolbar into ChatMessage component** - `5f59c64` (feat)
3. **Task 3: Update Storybook stories** - `f72298c` (docs)

## Files Modified
- `react-chat/src/components/ChatMessage/ChatMessage.module.css` - Added position:relative to oneOnOneMessage, messageToolbar class, hover/focus-within reveal
- `react-chat/src/components/ChatMessage/ChatMessage.tsx` - Import MessageToolbar, add extractTextContent, enableEdit/onEdit props, render toolbar in both modes
- `react-chat/src/components/ChatMessage/ChatMessage.stories.tsx` - Updated docs, replaced WithMenu with WithEditEnabled/AssistantWithToolbar stories

## Decisions Made
- **Position relative on oneOnOneMessage:** Required for absolute toolbar positioning (groupMessage already had it)
- **Opacity transition:** Smooth fade in/out rather than visibility toggle
- **Focus-within alongside hover:** Keyboard users can access toolbar buttons
- **extractTextContent helper:** Filters message parts to text only, joins with newlines
- **Replaced menuItems/onMenuSelect:** Simplified API with enableEdit/onEdit props

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None - plan executed as specified.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- MessageToolbar fully integrated and working
- Plan 03 will add keyboard accessibility enhancements
- TBR requirements satisfied:
  - TBR-01: Toolbar appears on message hover in top-right corner
  - TBR-02: Toolbar displays formatted timestamp
  - TBR-03: Copy button copies message content to clipboard
  - TBR-04: Edit button is configurable (enableEdit prop)
  - TBR-05: Toolbar styling adapts to message type
  - TBR-06: Toolbar has backdrop blur for visual separation

---
*Phase: 04-hover-toolbar*
*Completed: 2026-01-18*
