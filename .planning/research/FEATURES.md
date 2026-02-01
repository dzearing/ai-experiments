# Feature Landscape: Coworker Design System Parity

**Domain:** AI Chat & Productivity Design System
**Researched:** 2026-02-01
**Reference:** Coworker/Copilot Design System

This document maps the feature landscape for achieving parity with the Coworker design system, categorizing features by necessity (table stakes vs differentiators) and flagging anti-features to avoid.

---

## 1. Layout Components

### Table Stakes

Features users expect from layout components. Missing these makes the design system feel incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **PageHeader with actions** | Standard pattern in enterprise apps; Atlassian, Ant Design all provide this | Medium | Must support title, breadcrumbs, actions row, responsive collapse |
| **Flexible slot system** | Users need to place custom content (buttons, search, filters) | Medium | Slots for: leading icon, title, subtitle, actions, auxiliary content |
| **Responsive behavior** | Headers must adapt to mobile/tablet/desktop | Medium | Stack vertically on mobile, horizontal on desktop |
| **Breadcrumb integration** | Navigation context is essential for multi-level apps | Low | Should integrate with router, support custom separators |
| **TitleBar for app chrome** | Copilot-style apps need window-level title bars | Medium | Menu button, tabs, controls (minimize/close), draggable region support |
| **SidePanel overlay/push modes** | Standard pattern for auxiliary content; Soul Design System, Atlassian provide | Medium | Must support left/right positioning, overlay vs push-content modes |
| **SidePanel collapsible state** | Users need to maximize workspace | Low | Toggle open/closed with animation, remember state |
| **Z-index management** | Panels must layer correctly over content | Low | Use design token for consistent elevation |

### Differentiators

Features that set a design system apart. Not expected, but valued when present.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Sticky header behavior** | Keeps navigation accessible during scroll | Low | Position: sticky with shadow on scroll |
| **PageHeader variants** | Adapt to different page types (entity, agent, content) | Medium | Entity header: edit title inline; Agent header: avatar + capabilities; Content header: version controls |
| **TitleBar tab integration** | Work/Web toggle pattern from Copilot | Medium | Tabs embedded in title bar chrome, selected state integrated with window controls |
| **SidePanel resize handle** | User-controlled panel width | High | Drag handle with live resize, min/max constraints, persist width preference |
| **Multi-panel layouts** | Support left + right panels simultaneously | Medium | Coordinate z-index, handle viewport constraints |
| **PageHeader command palette** | Quick action search (Cmd+K pattern) | High | Fuzzy search over available actions, keyboard navigation |

### Anti-Features

Features to deliberately NOT build. Common mistakes in layout components.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Fixed pixel widths** | Breaks responsive design, doesn't scale | Use flex/grid with min/max constraints, CSS custom properties for sizes |
| **Nested header levels** | Creates visual hierarchy chaos | One header per page level, use sections/cards for sub-content |
| **Auto-hiding headers** | Disorienting for users, hard to predict | Use sticky headers that remain visible, or explicit collapse controls |
| **SidePanel without dismiss** | Traps users, no escape hatch | Always provide close button, Escape key handler, click-outside-to-close |
| **Hard-coded breakpoints** | Doesn't adapt to container context | Use container queries where possible, make breakpoints configurable |

### Feature Dependencies

```
PageHeader
├── requires: Breadcrumb component
├── optional: Tabs component (for TitleBar variant)
└── optional: Command palette (for search variant)

TitleBar
├── requires: Tabs component (for Work/Web toggle)
└── requires: IconButton (for controls)

SidePanel
├── requires: FocusTrap utility
├── requires: Portal/Overlay system
└── optional: ResizeHandle component
```

---

## 2. Entity Cards

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Structured card layout** | Users expect consistent entity previews | Low | Thumbnail/icon, title, metadata, actions |
| **FileCard with document preview** | Standard for file browsers (Google Drive, OneDrive) | Medium | Thumbnail, file type icon, name, size, modified date, owner avatar |
| **PersonCard with presence** | Expected in collaboration tools (Teams, Slack) | Medium | Avatar with online/offline/busy indicator, name, role/title, contact actions |
| **EventCard with time info** | Calendar integrations require this | Medium | Calendar icon, title, time/date, location, attendee count |
| **Hover/focus actions** | Desktop users expect quick actions on hover | Low | Show actions on card hover, keyboard accessible |
| **Click navigation** | Cards are interactive entry points | Low | Entire card clickable, keyboard Enter support |
| **Truncation with tooltip** | Prevent layout breaking with long text | Low | Ellipsis truncation, show full text on hover |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Rich media thumbnails** | Better visual recognition than generic icons | Medium | Video preview, PDF first page, image thumbnails, auto-generated for docs |
| **Inline insights** | AI-powered metadata ("Shared with 12 people") | Low | Insight text with subtle styling, sparkle icon indicator |
| **Quick actions overflow** | More actions without cluttering card | Low | Show 2-3 primary actions, "+N more" button for Menu |
| **Presence animation** | Online status pulses for real-time feel | Low | Animated ring around avatar for active/typing states |
| **Card skeleton loading** | Better perceived performance | Low | Shimmer effect for cards while loading |
| **Drag-to-reorder support** | User-controlled organization | High | Draggable card with visual feedback, drop zones |
| **Multi-select mode** | Bulk operations (delete, move, share) | Medium | Checkbox on hover/select mode, bulk action bar |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Auto-playing media** | Distracting, performance drain | Show static thumbnail, play on click/hover intent |
| **Cards without fallbacks** | Breaks when images fail to load | Provide icon fallback, placeholder color from filename hash |
| **Action buttons always visible** | Clutters grid view, reduces content density | Show actions on hover/focus/selection, mobile: show on tap |
| **Fixed card sizes** | Doesn't adapt to content or viewport | Use aspect ratio with min/max, responsive grid columns |
| **Too many metadata fields** | Information overload, hard to scan | Show 2-3 key metadata, rest in popover/expanded view |

### Feature Dependencies

```
FileCard
├── requires: Card base component
├── requires: Avatar component (for owner)
├── requires: Icon component (for file type)
└── optional: Thumbnail/Image component

PersonCard
├── requires: Card base component
├── requires: Avatar component (with presence indicator)
├── requires: Badge component (for role/status)
└── optional: Tooltip component (for contact info)

EventCard
├── requires: Card base component
├── requires: Icon component (calendar)
├── requires: AvatarGroup (for attendees)
└── optional: Chip component (for location/tags)
```

---

## 3. Chat Enhancements

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **ReasoningSteps container** | Major AI providers (Claude, Gemini, DeepSeek) expose thinking | Medium | Collapsible container, progress indicator, step-by-step display |
| **Individual reasoning step** | Users need to see AI thought process breakdown | Low | Step number, description, status (active/completed), optional references |
| **Step completion states** | Visual feedback on progress | Low | Spinner (active), checkmark (done), error icon (failed) |
| **Collapsible reasoning** | Long reasoning clutters chat; Copilot pattern | Low | Expand/collapse control, remember state per message |
| **Progress indicator** | Users need to know reasoning is happening | Low | "Thinking..." text, progress percentage, elapsed time |
| **AttachmentPill component** | Standard in chat UIs (Teams, Slack, Discord) | Low | File name, icon, size, remove button, click to preview |
| **AttachmentList layout** | Multiple attachments need organized display | Low | Horizontal scroll or wrap grid, max visible count |
| **Inline citations** | AI-generated content needs source attribution | Low | Numbered citation pill [1], hover shows source metadata |
| **Reference list/panel** | Users need to access cited sources | Medium | List of sources with title, favicon, URL, click to open |
| **Like/Dislike feedback** | Standard in AI chat (ChatGPT, Claude, Copilot) | Low | Thumbs up/down buttons, one-click feedback, optional comment |
| **Copy message action** | Users need to extract AI responses | Low | Copy button on message hover/toolbar, success feedback |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Quick Answer button** | Skip reasoning for faster response option | Low | Button appears during reasoning: "Show answer now" |
| **Reasoning duration summary** | Shows AI effort for transparency | Low | "Reasoned for 2 minutes" badge after completion |
| **Interstitial reasoning text** | Context between reasoning steps | Low | Lighter text for explanatory connections between steps |
| **Reference preview on hover** | Quick source verification without navigation | Medium | Popover with title, excerpt, metadata (Perplexity pattern) |
| **Citation clustering** | Group related citations for clarity | Medium | Multiple sources for one claim: [1-3] instead of [1][2][3] |
| **Feedback with categories** | Structured feedback for better training data | Medium | Form with radio options (wrong, incomplete, off-topic), text input |
| **Share message action** | Collaboration feature | Low | Share button generates shareable link or copies formatted text |
| **Bookmark/save action** | Users want to save important responses | Low | Bookmark button, saved messages collection |
| **Edit and regenerate** | Refine prompts without retyping | Medium | Edit button on user message, auto-regenerates AI response |
| **Attachment preview thumbnails** | Better recognition than icons alone | Medium | Image thumbnails, document first-page preview, video poster frame |
| **Screenshot paste enhancement** | Annotate pasted screenshots | High | Draw arrows, add text, highlight areas before sending |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Always-visible reasoning** | Overwhelming for simple queries, clutters chat | Default to collapsed after completion, "Show thinking" button |
| **Reasoning for every response** | Not all responses need exposed reasoning | Only show ReasoningSteps when model actually used extended thinking |
| **Unlimited attachment size** | Performance issues, storage costs | Set size limits (e.g., 10MB), show progress for uploads, compress images |
| **Auto-uploading attachments** | Privacy concerns, bandwidth waste | Require explicit send action, show pending attachments clearly |
| **Nested citation pills** | Hard to parse, visually cluttered | Flatten citations, use reference numbers, link to reference panel |
| **Modal dialogs for feedback** | Interrupts flow, feels heavy-handed | Inline feedback forms or slide-in panels, non-blocking |

### Feature Dependencies

```
ReasoningSteps
├── requires: Collapse/Accordion component
├── requires: ReasoningStep (child)
├── requires: Progress component
└── optional: Timer/duration display

ReasoningStep
├── requires: Icon component (status icons)
├── optional: InlineCitation component
└── optional: Interstitial text styling

AttachmentPill
├── requires: Chip/Pill base component
├── requires: Icon component (file types)
└── optional: Thumbnail component

InlineCitation
├── requires: Badge/Pill component
├── requires: Popover component (for hover preview)
└── optional: Icon component (favicon)

ReferenceList/Panel
├── requires: List component
├── requires: Link component
├── optional: Favicon component
└── optional: SidePanel (for dedicated reference view)

FeedbackButtons
├── requires: IconButton component
├── requires: Icon component (thumbs up/down)
└── optional: Dialog/Form (for detailed feedback)
```

---

## 4. Copilot Theme & Motion

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Brand gradient tokens** | Core to Copilot visual identity | Low | Three gradient colors (blue/purple #464FEB, cyan #47CFFA, purple #B47CF8) |
| **Gradient variants** | Different use cases need different applications | Low | Linear (horizontal), radial, full-width, subtle (with transparency) |
| **Sparkle/AI indicator icon** | Universal AI signifier in 2026 | Low | Sparkle icon for AI-generated content, brand gradient fill option |
| **Smooth transitions** | Modern UX expectation | Low | 200ms default, ease-out curve, respects prefers-reduced-motion |
| **Focus state animations** | Accessibility and polish | Low | Focus ring scales in smoothly, color transition |
| **Hover state transitions** | Interactive feedback | Low | Background color, border color, shadow transitions |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Gradient animation on load** | Eye-catching, premium feel (Koto design for Copilot+ PC) | Medium | Subtle gradient position shift or rotation on component mount |
| **Illumination metaphor** | AI as "light" that enhances (Copilot brand philosophy) | Medium | Glow effects on brand elements, light sweep animations |
| **Reasoning pulse animation** | Shows active AI thinking | Low | Pulsing glow on reasoning indicator, smooth infinite animation |
| **Streaming text shimmer** | Shows content generation in progress | Medium | Subtle shimmer/wave effect on text as it streams in |
| **Success confirmation animation** | Delightful feedback for actions | Low | Checkmark scales in with bounce, brand gradient flash |
| **Loading skeleton with gradient** | Brand-consistent loading states | Low | Skeleton uses subtle brand gradient sweep instead of gray |
| **Dimensionality in motion** | Cards lift on hover, depth cues | Medium | Transform scale + shadow increase, 3D hint with slight rotation |
| **Sophistication in transitions** | Elegant, not flashy (Koto motion principles) | High | Multi-step animations with easing, coordinated timing, clear focus guidance |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Overuse of gradients** | Feels dated (2018 style), reduces readability | Use gradients sparingly for accents, AI indicators, not backgrounds everywhere |
| **Constant animations** | Distracting, drains battery, accessibility issue | Animate on interaction or state change only, respect prefers-reduced-motion |
| **Abrupt state changes** | Feels janky, hard to follow | Add transition duration, ease curves, coordinated timing |
| **Neon/synthetic gradients** | Koto explicitly avoided this for Copilot | Use natural light-inspired gradients (dawn, daylight, dusk palettes) |
| **Rotating/spinning brand elements** | Gimmicky, nauseating | Use subtle position shifts, fades, glows instead |
| **Heavy blur effects** | Performance issues, especially on lists | Use shadows for depth, subtle backdrop blur only for modals |

### Feature Dependencies

```
Brand gradient system
├── requires: CSS custom property tokens
├── requires: Theme definition support for brandFlair
└── optional: Gradient utility classes

Motion system
├── requires: Animation duration tokens
├── requires: Easing curve tokens
├── requires: prefers-reduced-motion media query support
└── optional: AnimationGroup/choreography utility

AI indicators
├── requires: Sparkle icon
├── requires: Gradient fill support for icons
└── optional: Pulsing animation keyframes
```

---

## 5. Brand Flair Gradient Usage

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Three-color gradient definition** | Core Copilot brand identity (Koto design) | Low | Color1: #464FEB (blue/purple), Color2: #47CFFA (cyan), Color3: #B47CF8 (purple) |
| **Linear gradient variant** | Standard horizontal gradient for bars, borders | Low | 90deg left-to-right flow through all three colors |
| **Radial gradient variant** | Circular glow effects, spotlight focus | Low | Radial from center outward through color stops |
| **Gradient CSS custom properties** | Theme system integration | Low | --brand-flair-1, --brand-flair-2, --brand-flair-3, --gradient-brand |
| **Gradient on AI elements** | Visual distinction of AI-powered features | Low | Apply to: sparkle icons, reasoning indicators, AI badges |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Natural light color mapping** | Copilot brand philosophy: gradients from dawn/daylight/dusk | Medium | Warm tones for afternoon, cool for morning, balanced midday |
| **Gradient with transparency** | Subtle accents without overwhelming content | Low | rgba() versions of brand colors, 10-40% opacity for backgrounds |
| **Animated gradient positions** | Living, dynamic brand presence | Medium | Shift gradient stops on hover, move background-position over time |
| **Conic gradient variant** | Unique visual for circular elements (avatars, badges) | Low | Conic gradient for 360-degree color sweep |
| **Gradient border technique** | Sophisticated accent without filling background | Medium | Use border-image or pseudo-element mask for gradient borders |
| **Gradient text fill** | Striking typography for hero text, AI labels | Low | background-clip: text; -webkit-background-clip: text; |
| **Context-aware gradient intensity** | Adapt to light/dark mode | Medium | Brighter in dark mode, subtle in light mode for readability |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Gradient on body text** | Unreadable, accessibility fail | Use solid text colors, reserve gradients for accents and icons |
| **Clashing gradients** | Multiple gradients compete, visual chaos | One gradient accent per visual region, use solid brand colors elsewhere |
| **Hard color stops** | Looks banded, not smooth | Use smooth transitions with proper color space (oklch recommended) |
| **Vibration/strobing gradients** | Seizure risk, very annoying | Animate slowly (>3s duration), subtle position shifts only |
| **Gradient in icons by default** | Most icons should be monochrome for clarity | Only AI-specific icons get gradient fill, rest use solid color |

### Feature Dependencies

```
Brand flair system
├── requires: Theme definition with brandFlair object
├── requires: Color system supporting multiple color spaces
└── optional: CSS custom property fallbacks for older browsers

Gradient utilities
├── requires: CSS class generators or mixins
├── optional: JavaScript color manipulation (for transparency variants)
└── optional: Animation keyframes for movement
```

---

## MVP Recommendation

For achieving baseline Coworker design system parity, prioritize in this order:

### Phase 1: Chat Enhancements (Highest Value)
**Why first:** These are user-facing, core to AI interaction, and expected in modern AI chat UIs.

1. AttachmentPill + AttachmentList (Low complexity, high visibility)
2. InlineCitation + ReferenceList (Medium complexity, critical for AI credibility)
3. FeedbackButtons (Low complexity, enables data collection)
4. ReasoningSteps + ReasoningStep (Medium complexity, but key differentiator)

**Defer:**
- Quick Answer button (nice-to-have, not essential)
- Screenshot paste enhancement (high complexity, specialized use case)
- Bookmark/save actions (feature creep, can be added later)

### Phase 2: Entity Cards (Medium Priority)
**Why second:** Enables rich content display, but can use basic Card component initially.

1. FileCard (Most common, highest demand)
2. PersonCard (Collaboration feature, moderate demand)
3. EventCard (Calendar integration, specialized)

**Defer:**
- Drag-to-reorder (high complexity, not core to MVP)
- Multi-select mode (bulk operations can wait)
- Rich media thumbnails (start with icons, add thumbnails later)

### Phase 3: Layout Components (Foundation)
**Why third:** Important structure, but existing Stack/Grid can fill gap temporarily.

1. PageHeader (Standard pattern, medium complexity)
2. SidePanel (Common pattern, medium complexity)
3. TitleBar (Copilot-specific, lower priority)

**Defer:**
- Command palette (high complexity, nice-to-have)
- Resize handle for panels (medium complexity, convenience feature)
- Multi-panel layouts (edge case, add when needed)

### Phase 4: Brand Flair & Motion (Polish)
**Why last:** Visual polish, doesn't affect functionality.

1. Brand gradient tokens (Low complexity, quick win)
2. Basic transitions (Low complexity, standards)
3. AI indicator animations (Low complexity, brand identity)

**Defer:**
- Illumination metaphor (high complexity, subjective value)
- Sophisticated motion choreography (time-intensive, diminishing returns)
- Animated gradient positions (performance consideration, nice-to-have)

---

## Success Metrics

How to measure feature completeness:

| Category | Table Stakes Completion | Differentiator Completion | Quality Gate |
|----------|------------------------|---------------------------|--------------|
| Layout Components | 7/8 features | 2/6 features | Can build Copilot-style app shell |
| Entity Cards | 6/7 features | 2/7 features | File browser, people picker, calendar work |
| Chat Enhancements | 9/11 features | 3/11 features | AI chat feels modern, transparent |
| Copilot Theme | 5/6 features | 2/8 features | Brand recognizable, smooth interactions |
| Brand Flair | 5/5 features | 2/7 features | Gradients present, not overwhelming |

**Minimum Viable Parity:** 70% of table stakes features across all categories.
**Full Parity:** 100% of table stakes + 40% of differentiators.
**Exceeds Parity:** 100% of table stakes + 70% of differentiators + new features not in Coworker.

---

## Sources

### Layout Components
- [Frontend Design Patterns That Actually Work in 2026](https://www.netguru.com/blog/frontend-design-patterns)
- [Side panel - Soul Design System](https://soul.emplifi.io/latest/components/components/side-panel/design-properties-PTWsHzBc)
- [Essential Layout Components For Your Design System](https://dev.to/nayaabkhan/essential-layout-components-for-your-design-system-26p)
- [Page layout - Atlassian Design System](https://atlassian.design/components/page-layout/)
- [Page header - Atlassian Design System](https://atlassian.design/components/page-header/)
- [Layout - Ant Design](https://ant.design/components/layout/)

### Entity Cards
- [Cards design pattern](https://ui-patterns.com/patterns/cards)
- [Card patterns - Horizon Design System](https://horizon.servicenow.com/workspace/patterns/cards/card-patterns)

### Chat Enhancements
- [The Developer's Guide to Generative UI in 2026](https://dev.to/copilotkit/the-developers-guide-to-generative-ui-in-2026-1bh3)
- [Innovative Chat UI Design Trends 2025](https://multitaskai.com/blog/chat-ui-design/)
- [16 Chat UI Design Patterns That Work in 2025](https://bricxlabs.com/blogs/message-screen-ui-deisgn)
- [Chain-of-Thought Component - AI SDK](https://ai-sdk.dev/elements/components/chain-of-thought)
- [AI UX Patterns - Citations](https://www.shapeof.ai/patterns/citations)
- [InlineCitation Component - AI SDK](https://ai-sdk.dev/elements/components/inline-citation)
- [Reasoning models - OpenAI API](https://platform.openai.com/docs/guides/reasoning)
- [Human Feedback - Chainlit](https://docs.chainlit.io/data-persistence/feedback)
- [Review chatbot feedback - Zapier](https://help.zapier.com/hc/en-us/articles/21980947537421-Review-chatbot-feedback)
- [Prompt Suggestions - Nielsen Norman Group](https://www.nngroup.com/articles/prompt-suggestions/)
- [Add Prompt Suggestions - Microsoft Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/prompt-suggestions)
- [Empty State UI Pattern - Mobbin](https://mobbin.com/glossary/empty-state)

### Copilot Brand & Motion
- [New Microsoft Copilot+ PC branding](https://www.creativebloq.com/news/koto-microsoft-copilot)
- [Microsoft: Copilot+PC - Koto Studio](https://koto.studio/work/copilotpc/)
- [New Microsoft Copilot+ PC Brand by Koto](https://www.brandinginasia.com/new-microsoft-copilot-pc-brand-by-koto-focuses-on-a-lighter-brighter-approach/)
- [The Copilot Logo History, Colors, Font, And Meaning](https://www.designyourway.net/blog/copilot-logo/)

### Design System References
- [Fluent UI React v9](https://react.fluentui.dev/)
- [Fluent 2 Design System - React Components](https://fluent2.microsoft.design/components/web/react/)
