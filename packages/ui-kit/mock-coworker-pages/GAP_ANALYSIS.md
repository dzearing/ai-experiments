# UI-Kit vs Coworker Design System: Gap Analysis

This document identifies gaps between our `@ui-kit` design system and the Coworker/Copilot design system to achieve feature parity.

---

## Executive Summary

| Category | Coworker | UI-Kit | Gap |
|----------|----------|--------|-----|
| Components | 33 | 65+ | ~15 new components needed |
| Icons | 112+ | 103 | ~30 new icons needed |
| Themes | Fluent-based | 20 themes | Token mapping needed |
| Typography Scale | 14 levels | 8 levels | 6 additional levels |

**New Packages Needed:**
- `@ui-kit/react-layout` - Page structure (PageHeader, TitleBar, SidePanel)
- `@ui-kit/react-cards` - Entity cards (FileCard, PersonCard, EventCard)

---

## 1. Component Gaps

### 1.1 Chat & Messaging Components

| Coworker Component | UI-Kit Equivalent | Gap Status | Priority |
|--------------------|-------------------|------------|----------|
| Chat Input (Fluent) | `ChatInput` | **Partial** - Missing tools/sources slots | High |
| CopilotChatBar | - | **Missing** - Need attachment toolbar + drag-drop | High |
| Messages | `ChatMessage` | **Partial** - Missing citation support | High |
| Message Actions | `MessageToolbar` | **Partial** - Missing like/dislike, share | Medium |
| Attachments | - | **Missing** - AttachmentPill, AttachmentList | High |
| Citations & References | - | **Missing** - InlineCitation, ReferenceList | High |
| Prompt Starters | - | **Missing** - Suggestion cards with feedback | Medium |

**Recommended New Components:**
```
@ui-kit/react-chat (enhancements)
├── AttachmentPill
├── AttachmentList
├── InlineCitation
├── ReferenceList
├── PromptStarter
└── PromptStarterList
```

### 1.2 AI Reasoning Components

| Coworker Component | UI-Kit Equivalent | Gap Status | Priority |
|--------------------|-------------------|------------|----------|
| Chain of Thought | - | **Missing** | High |
| ChainOfThoughtItem | - | **Missing** | High |
| ChainOfThoughtCollapsibleItem | - | **Missing** | High |
| Compact Indicator | `ThinkingIndicator` | **Partial** - Need "Reasoned for X min" variant | Medium |

**Recommended Additions to `@ui-kit/react-chat`:**
```
@ui-kit/react-chat (new components)
├── ReasoningSteps (container)
├── ReasoningStep (individual step, collapsible)
├── ReasoningProgress
└── QuickAnswerButton
```

### 1.3 Button Variants

| Coworker Variant | UI-Kit Equivalent | Gap Status |
|------------------|-------------------|------------|
| primary | `variant="primary"` | **Exists** |
| secondary | `variant="default"` | **Exists** (different name) |
| tertiary | `variant="ghost"` | **Exists** (different name) |
| action | - | **Missing** - Button with icon + label style |
| action-brand | - | **Missing** - Brand-colored action |
| dropdown | - | **Missing** - Button with chevron |
| dropdown-selected | - | **Missing** - Selected dropdown state |
| icon | `IconButton` | **Exists** |
| icon-subtle | `IconButton variant="ghost"` | **Exists** |
| loading state | - | **Missing** - Button with spinner |

**Recommended Enhancements:**
- Add `loading` prop to Button
- Add `variant="action"` and `variant="action-brand"`
- Add dropdown button variant or `SplitButton` component

### 1.4 Input & Controls

| Coworker Component | UI-Kit Equivalent | Gap Status | Priority |
|--------------------|-------------------|------------|----------|
| Agent Tags | `Chip` with `onRemove` | **Partial** - Need media slot | Medium |
| Capability Picker | `Segmented` | **Partial** - Need icon + dropdown variant | Medium |
| Voice Control | - | **Missing** | Low |
| Pill Filters | `Segmented` or `Tabs variant="pills"` | **Exists** | - |
| Suggestion Chips | `Chip` | **Partial** - Need clickable variant | Medium |
| Action Buttons | - | **Missing** - Toggle button group | Medium |
| Sensitivity Labels | - | **Missing** | Low |
| Dropdown Menus | `Menu`, `Dropdown` | **Exists** | - |
| Checkbox Pattern | `Checkbox` | **Exists** | - |

**Recommended New Components:**
```
@ui-kit/react (enhancements)
├── TagInput (with media slot)
├── ActionButtonGroup
├── VoiceInput (optional)
└── SensitivityLabel (optional)
```

### 1.5 Feedback & Status

| Coworker Component | UI-Kit Equivalent | Gap Status | Priority |
|--------------------|-------------------|------------|----------|
| Latency Patterns (Spinner) | `Spinner` | **Exists** | - |
| Latency Patterns (Streaming) | `TypingIndicator` | **Partial** - Need MorseCode variant | Medium |
| Status Badges | `Chip` | **Partial** - Need pattern maturity variants | Low |
| Feedback (Like/Dislike) | - | **Missing** | High |
| Feedback Form | - | **Missing** | Medium |
| Notifications (Bell) | - | **Missing** | Medium |
| Notification Items | - | **Missing** | Medium |
| Toasts | `Toast` | **Exists** | - |

**Recommended New Components:**
```
@ui-kit/react (enhancements)
├── FeedbackButtons (thumbs up/down)
├── FeedbackForm
├── NotificationBell
├── NotificationItem
└── NotificationList
```

### 1.6 Navigation & Layout

| Coworker Component | UI-Kit Equivalent | Gap Status | Priority |
|--------------------|-------------------|------------|----------|
| Headers (Entity/Pages/Agents) | - | **Missing** | High |
| Title Bar | - | **Missing** | Medium |
| Side Panel | - | **Missing** | Medium |
| Teaching Popover | `Popover` | **Partial** - Need onboarding variant | Medium |
| First Run Experience | - | **Missing** | Low |

**Recommended New Package `@ui-kit/react-layout`:**
```
@ui-kit/react-layout (new package)
├── PageHeader
├── ContentHeader
├── TitleBar
├── SidePanel
└── PageContainer
```

**Recommended Additions to `@ui-kit/react`:**
```
├── TourPopover
└── OnboardingDialog
```

### 1.7 Data Display

| Coworker Component | UI-Kit Equivalent | Gap Status | Priority |
|--------------------|-------------------|------------|----------|
| Entity Cards (Document) | `Card` | **Partial** - Need structured layout | High |
| Entity Cards (People) | `Card` + `Avatar` | **Partial** - Need presence indicator | Medium |
| Entity Cards (Meeting) | `Card` | **Partial** - Need meeting structure | Medium |
| Reference Panel | - | **Missing** | High |
| System Messages | - | **Missing** | Medium |

**Recommended New Package `@ui-kit/react-cards`:**
```
@ui-kit/react-cards (new package)
├── FileCard
├── PersonCard
├── EventCard
├── LinkCard
└── EntityList
```

**Recommended Additions to `@ui-kit/react-chat`:**
```
├── ReferencePanel
└── SystemMessage
```

---

## 2. Token System Gaps

### 2.1 Typography Scale

**Coworker has 14 levels, UI-Kit has 8:**

| Coworker | Size | UI-Kit Equivalent | Gap |
|----------|------|-------------------|-----|
| Display | 68px | - | **Missing** |
| Large Title | 40px | - | **Missing** |
| Title 1 | 28px | - | **Missing** |
| Title 2 | 24px | `--text-2xl` (24px) | Exists |
| Title 3 | 20px | `--text-xl` (20px) | Exists |
| Subtitle 1 | 20px | `--text-xl` (20px) | Exists |
| Subtitle 2 | 16px | - | **Missing** (between lg and xl) |
| Body 1 | 16.6px | `--text-lg` (17px) | Close |
| Body 2 | 14px | - | **Missing** (between sm and base) |
| Body 3 | 12px | - | **Missing** |
| Caption 1 | 12px | - | **Missing** |
| Caption 2 | 10px | - | **Missing** |

**Recommended Token Additions:**
```css
/* Display & Large Titles */
--text-display: 68px;
--text-5xl: 40px;
--text-4xl: 36px; /* exists */
--text-3xl: 30px; /* exists */

/* Body variants */
--text-body-1: 16.6px;
--text-body-2: 14px;
--text-body-3: 12px;

/* Captions */
--text-caption-1: 12px;
--text-caption-2: 10px;
```

### 2.2 Brand/Flair Colors

**Coworker has brand gradient colors not in UI-Kit:**

```css
/* Copilot brand flair - MISSING */
--brand-flair-1: #464FEB; /* Blue/purple */
--brand-flair-2: #47CFFA; /* Cyan */
--brand-flair-3: #B47CF8; /* Purple */

/* Gradient variants needed */
--gradient-brand: linear-gradient(90deg, var(--brand-flair-1), var(--brand-flair-2), var(--brand-flair-3));
```

**Recommendation:** Add to theme definition:
```typescript
interface ThemeDefinition {
  // ... existing
  brandFlair?: {
    color1: string;
    color2: string;
    color3: string;
  };
}
```

### 2.3 Surface Mapping

| Coworker Surface | UI-Kit Surface | Notes |
|------------------|----------------|-------|
| `background` | `base` | Equivalent |
| `card` | `raised` | Equivalent |
| `secondary` | `soft` | Equivalent |
| `muted` | `softer` | Equivalent |
| `accent` | `primary` | Equivalent |

**Status:** Surface system maps well. No major gaps.

### 2.4 Text Color Tokens

| Coworker | Hex | UI-Kit Equivalent |
|----------|-----|-------------------|
| Primary | #424242 | `--body-text` |
| Subtle | #707070 | `--body-text-soft` |
| Disabled | #9E9E9E | `--control-text-disabled` |
| Placeholder | #BDBDBD | `--input-placeholder` |

**Status:** UI-Kit has equivalent tokens but with different naming.

### 2.5 Missing Interaction State Tokens

Coworker has explicit interaction state tokens:

```css
/* MISSING - Primary color states */
--primary-hover: /* computed */;
--primary-active: /* computed */;
--primary-disabled: /* computed */;
```

**Recommendation:** Ensure all surfaces have hover/active/disabled variants.

---

## 3. Icon Gaps

### 3.1 Microsoft Product Icons (Missing)

| Icon | Description | Priority |
|------|-------------|----------|
| `copilot` | Copilot logo (color + mono) | High |
| `word` | Microsoft Word | High |
| `excel` | Microsoft Excel | High |
| `powerpoint` | Microsoft PowerPoint | High |
| `outlook` | Microsoft Outlook | Medium |
| `teams` | Microsoft Teams | Medium |
| `onedrive` | OneDrive | Medium |
| `sharepoint` | SharePoint | Medium |
| `defender` | Microsoft Defender | Low |
| `power-apps` | Power Apps | Low |
| `designer` | Microsoft Designer | Low |

### 3.2 Agent Icons (Missing)

| Icon | Description | Priority |
|------|-------------|----------|
| `analyst` | Analyst agent | High |
| `researcher` | Researcher agent | High |
| `catch-up` | Catch Up agent | Medium |
| `planner` | Planner agent | Medium |
| `flow-builder` | Flow Builder | Medium |
| `sales` | Sales agent | Low |
| `photos` | Photos agent | Low |

### 3.3 UI Icons (Missing)

| Icon | Description | UI-Kit Has |
|------|-------------|------------|
| `sparkle` | AI/magic indicator | **Missing** |
| `microphone` | Voice input | **Missing** |
| `microphone-off` | Muted mic | **Missing** |
| `shield` | Sensitivity/security | **Missing** |
| `shield-lock` | Protected content | **Missing** |
| `pin` | Pin/unpin | **Missing** |
| `bookmark` | Bookmark | **Missing** |
| `briefcase` | Work/business | **Missing** |
| `drag-handle` | Drag indicator | `GripperIcon` exists |

### 3.4 Status Icons (Partial)

| Coworker | UI-Kit | Gap |
|----------|--------|-----|
| Running (spinner) | `Spinner` component | Exists |
| Paused | `PauseIcon` | Exists |
| Needs Input | - | **Missing** |
| Proactive Reply | - | **Missing** |

---

## 4. Recommended Package Structure

### 4.1 Enhancements to `@ui-kit/react`

Core component enhancements:

```
@ui-kit/react (enhancements)
├── Button (add loading prop, action variants)
├── Chip (add media slot, clickable variant)
├── Avatar (add presence indicator)
│
├── NotificationBell (new)
├── NotificationItem (new)
├── NotificationList (new)
│
├── TourPopover (new - for onboarding hints)
└── OnboardingDialog (new)
```

### 4.2 Enhancements to `@ui-kit/react-chat`

Conversation and messaging UI:

```
@ui-kit/react-chat (enhancements)
├── ChatInput (add tools/sources slots)
├── ChatMessage (add citation support)
├── MessageToolbar (add feedback actions)
├── ThinkingIndicator (add duration variant)
│
├── ReasoningSteps (new - chain of thought container)
├── ReasoningStep (new - individual step)
├── ReasoningProgress (new - progress indicator)
│
├── AttachmentPill (new)
├── AttachmentList (new)
│
├── Citation (new - inline citation)
├── ReferenceList (new)
├── ReferencePanel (new)
│
├── SuggestionCard (new - prompt starters)
│
├── FeedbackButtons (new - thumbs up/down)
├── FeedbackForm (new)
│
└── SystemMessage (new)
```

### 4.3 New Package: `@ui-kit/react-layout`

Page structure and navigation components:

```
@ui-kit/react-layout (new package)
├── PageHeader (page title with actions)
├── TitleBar (app-level title bar)
├── ContentHeader (section headers)
├── SidePanel (collapsible side content)
└── PageContainer (standard page wrapper)
```

### 4.4 New Package: `@ui-kit/react-cards`

Structured card layouts for entity previews:

```
@ui-kit/react-cards (new package)
├── FileCard (document/file previews)
├── PersonCard (user/contact previews)
├── EventCard (meeting/calendar previews)
├── LinkCard (URL previews)
└── EntityList (grid/list of cards)
```

### 4.5 Icon Additions to `@ui-kit/icons`

```
@ui-kit/icons (new icons)
├── Microsoft Product (11 icons)
├── Agent Icons (7 icons)
├── SparkleIcon
├── MicrophoneIcon
├── MicrophoneOffIcon
├── ShieldIcon
├── ShieldLockIcon
├── PinIcon
├── BookmarkIcon
└── BriefcaseIcon
```

---

## 5. Token System Evolution

### 5.1 Typography Enhancements

Add semantic typography tokens following Fluent pattern:

```typescript
// tokens/typography.ts
export const typographyTokens = {
  // Display (new)
  display: { size: '68px', lineHeight: '92px', weight: 600 },

  // Titles (enhance)
  'large-title': { size: '40px', lineHeight: '52px', weight: 600 },
  'title-1': { size: '28px', lineHeight: '36px', weight: 600 },
  'title-2': { size: '24px', lineHeight: '32px', weight: 600 },
  'title-3': { size: '20px', lineHeight: '28px', weight: 600 },

  // Subtitles (new)
  'subtitle-1': { size: '20px', lineHeight: '28px', weight: 400 },
  'subtitle-2': { size: '16px', lineHeight: '22px', weight: 600 },

  // Body (enhance)
  'body-1': { size: '16.6px', lineHeight: '24px', weight: 400 },
  'body-1-strong': { size: '16.6px', lineHeight: '24px', weight: 600 },
  'body-2': { size: '14px', lineHeight: '20px', weight: 400 },
  'body-2-strong': { size: '14px', lineHeight: '20px', weight: 600 },
  'body-3': { size: '12px', lineHeight: '16px', weight: 400 },

  // Captions (new)
  'caption-1': { size: '12px', lineHeight: '16px', weight: 400 },
  'caption-1-strong': { size: '12px', lineHeight: '16px', weight: 600 },
  'caption-2': { size: '10px', lineHeight: '14px', weight: 400 },
  'caption-2-strong': { size: '10px', lineHeight: '14px', weight: 600 },
};
```

### 5.2 Brand Flair Support

Add to theme definition:

```typescript
interface ThemeDefinition {
  // ... existing

  // Brand gradient colors for AI features
  brandFlair?: {
    color1: string;  // Primary gradient color
    color2: string;  // Secondary gradient color
    color3: string;  // Tertiary gradient color
  };
}
```

Generated tokens:
```css
--brand-flair-1: #464FEB;
--brand-flair-2: #47CFFA;
--brand-flair-3: #B47CF8;
--gradient-brand: linear-gradient(90deg, var(--brand-flair-1), var(--brand-flair-2), var(--brand-flair-3));
--gradient-brand-radial: radial-gradient(circle, var(--brand-flair-1), var(--brand-flair-2), var(--brand-flair-3));
```

### 5.3 Fluent Theme Preset

Create a `fluent` theme that maps directly to Coworker tokens:

```typescript
const fluentTheme: ThemeDefinition = {
  id: 'fluent',
  name: 'Fluent',
  colors: {
    primary: '#0F6CBD',  // Fluent brand blue
    neutral: '#242424',
  },
  typography: {
    fontSans: "'Segoe UI Variable', 'Segoe UI', sans-serif",
    scale: 1,
  },
  brandFlair: {
    color1: '#464FEB',
    color2: '#47CFFA',
    color3: '#B47CF8',
  },
};
```

---

## 6. Implementation Priority

### Phase 1: Core Chat Enhancements (High Priority)
1. Add `AttachmentPill` and `AttachmentList` to react-chat
2. Add `Citation` and `ReferenceList` to react-chat
3. Enhance `ChatInput` with tools/sources slots
4. Add `FeedbackButtons` component to react-chat
5. Add essential icons (sparkle, microphone, shield)

### Phase 2: AI Reasoning Components (High Priority)
1. Add `ReasoningSteps`, `ReasoningStep` to react-chat
2. Add `ReasoningProgress` component to react-chat
3. Enhance `ThinkingIndicator` with duration variant

### Phase 3: Entity Cards Package (Medium Priority)
1. Create `@ui-kit/react-cards` package
2. Add `FileCard`, `PersonCard`, `EventCard`
3. Add `LinkCard` and `EntityList`

### Phase 4: Layout Package (Medium Priority)
1. Create `@ui-kit/react-layout` package
2. Add `PageHeader`, `TitleBar`, `ContentHeader`
3. Add `SidePanel`, `PageContainer`

### Phase 5: Notifications & Onboarding (Medium Priority)
1. Add `NotificationBell`, `NotificationItem`, `NotificationList` to react
2. Add `TourPopover`, `OnboardingDialog` to react

### Phase 6: Token System & Theme (Medium Priority)
1. Add extended typography scale
2. Add brand flair tokens
3. Create Fluent theme preset

### Phase 7: Icons (Lower Priority)
1. Add UI icons (sparkle, microphone, shield, pin, bookmark)
2. Add remaining status and action icons

---

## 7. Quick Reference: Component Mapping

| Need | Coworker | UI-Kit Solution |
|------|----------|-----------------|
| Chat input with attachments | CopilotChatBar | Enhance `ChatInput` in react-chat |
| AI thinking display | Chain of Thought | `ReasoningSteps` in react-chat |
| File attachment pills | AttachmentPill | `AttachmentPill` in react-chat |
| Citation references | InlineCitation | `Citation` in react-chat |
| Like/dislike feedback | FeedbackButtons | `FeedbackButtons` in react-chat |
| Document preview card | Entity Card | `FileCard` in react-cards |
| Person preview card | People Card | `PersonCard` in react-cards |
| Meeting preview card | Meeting Card | `EventCard` in react-cards |
| Page header with actions | Headers | `PageHeader` in react-layout |
| Title bar | TitleBar | `TitleBar` in react-layout |
| Side panel | SidePanel | `SidePanel` in react-layout |
| Notification bell | Notifications | `NotificationBell` in react |
| Onboarding hints | Teaching Popover | `TourPopover` in react |
| AI gradient styling | Brand Flair | New tokens in core |
