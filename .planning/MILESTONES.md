# Milestones

## v1.0: Chat UX Unification (Archived)

**Status:** Archived (2026-02-01)
**Completed Phases:** 1-4
**Deferred:** Phases 5-6 (Keyboard Navigation, Stories)

### What Shipped

- **Phase 1: Mode Foundation** - Type system, context provider, mode prop infrastructure
- **Phase 2: 1-on-1 Mode** - SubtleEmphasis design with primary-tinted user messages
- **Phase 3: Group Mode** - GroupSubtle design with avatars, sender names, consecutive compaction
- **Phase 4: Hover Toolbar** - Message actions (time, copy, edit) on hover/focus

### Deferred to Future

- Phase 5: Keyboard Navigation - Accessible message focus and toolbar interaction
- Phase 6: Stories - Storybook documentation for both modes

### Key Decisions

| Decision | Rationale |
|----------|-----------|
| Union type for ChatMode | Per codebase conventions (avoid enums) |
| Mode defaults to '1on1' | Backwards compatibility |
| CSS-driven consecutive compaction | data-consecutive attribute with CSS selectors |
| Toolbar parent handles positioning | Component positioned absolute, parent adds relative |

---

## v2.0: Coworker Design System Parity (Current)

**Status:** In Progress
**Started:** 2026-02-01
**Goal:** Implement react-layout, react-cards packages and react-chat enhancements to match Coworker design system
