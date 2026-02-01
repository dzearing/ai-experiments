# Coworker Demo Design System Inventory

**Source:** https://coworker-demo.lovable.app/design-system
**Last Updated:** February 2026

This document provides a comprehensive inventory of the Copilot Design System used in the Coworker demo application. The design system is built with React, TypeScript, and Fluent UI.

---

## Table of Contents

1. [Components](#components)
   - [Chat & Messaging](#chat--messaging)
   - [AI Reasoning](#ai-reasoning)
   - [Buttons](#buttons)
   - [Input & Controls](#input--controls)
   - [Feedback & Status](#feedback--status)
   - [Navigation](#navigation)
   - [Data Display](#data-display)
2. [Foundations](#foundations)
   - [Primary Brand Palette](#primary-brand-palette)
   - [Brand Flair & Gradients](#brand-flair--gradients)
   - [Status Colors](#status-colors)
   - [Surface Colors](#surface-colors)
   - [Text Color Scale](#text-color-scale)
   - [Typography Scale](#typography-scale)
   - [Fluent UI Theme Mapping](#fluent-ui-theme-mapping)
3. [Icons](#icons)
   - [Microsoft Product Icons](#microsoft-product-icons)
   - [Navigation Icons](#navigation-icons)
   - [Agent Icons](#agent-icons)
   - [UI Icons](#ui-icons)
   - [Status Indicators](#status-indicators)
   - [Chevrons & Arrows](#chevrons--arrows)
   - [Action Icons](#action-icons)
4. [Content](#content)

---

## Components

**URL:** https://coworker-demo.lovable.app/design-system (Components tab)

Total: **33 components** across 8 categories

### Chat & Messaging

**Count:** 8 components

| Component | Type | Description | Key Variants/States |
|-----------|------|-------------|---------------------|
| **Chat Input** | Fluent | Primary Fluent ChatInput component | Standard, With Tools and Sources |
| **CopilotChatBar** | Fluent | Complete input with grounding & drag-drop | With attachments, file pills, voice input |
| **Messages** | Fluent | CopilotMessage and UserMessage | User message, Copilot response with citations |
| **Message Actions** | Fluent | Feedback buttons and toolbars | Copilot Actions (Copy, Like, Dislike, Share, More), User Actions (Edit, Bookmark, Share) |
| **Attachments** | Fluent | AttachmentPill and AttachmentList | Person pills, Document pills (DOCX, XLSX, PPTX, PDF), Screenshot pills, Removable |
| **Citations & References** | Fluent | InlineCitation and ReferenceList | Inline citation badges, Reference list with document icons |
| **Prompt Starters** | Fluent | Suggestion prompts for empty states | Standard (icon + text), With title variant, Like/Dislike feedback |

### AI Reasoning

**Count:** 4 components

| Component | Type | Description | Key Variants/States |
|-----------|------|-------------|---------------------|
| **Chain of Thought** | Fluent | V2 reasoning container with progress states and 22-step research flow | Loading state (with progress), Finished state ("Reasoned for X minutes"), Quick Answer button option, Expandable/collapsible |
| **ChainOfThoughtItem** | Fluent | Individual reasoning step with references and interstitial text | Active (with spinner), Completed (with checkmark), With references, With interstitial text |
| **ChainOfThoughtCollapsibleItem** | Fluent | Collapsible reasoning steps for nested workflows | Expanded, Collapsed, With progress indicator |
| **Compact Indicator** | Custom | Minimal thinking indicator for inline use | "Thinking...", "Analyzing documents...", "Reasoned for X min" |

### Buttons

**Count:** 1 component (with many variants)

| Component | Type | Description | Key Variants/States |
|-----------|------|-------------|---------------------|
| **Copilot Buttons** | Custom | Primary, secondary, tertiary and dropdown button styles | **Variants:** primary, secondary, tertiary, action, action-brand, dropdown, dropdown-selected, icon, icon-subtle. **States:** default, hover, pressed, loading, disabled. **Sizes:** sm, md, lg |

**Button Variant Details:**
- **Primary** - Main action buttons
- **Secondary** - Secondary actions
- **Tertiary** - Low-emphasis actions
- **Action** - With icons (e.g., "Prepare a pitch", "Create a report")
- **Action-brand** - Brand-colored action buttons
- **Dropdown** - With chevron indicator
- **Dropdown-selected** - Selected dropdown state
- **Icon** - Icon-only buttons for toolbars
- **Icon-subtle** - Subtle icon buttons

### Input & Controls

**Count:** 7 components

| Component | Type | Description | Key Variants/States |
|-----------|------|-------------|---------------------|
| **Agent Tags** | Fluent | Tags with media and dismiss | With icon, Without icon, Dismissible |
| **Capability Picker** | Fluent | Response mode selection | Quick response, Analyst mode, Dropdown with selection |
| **Voice Control** | Fluent | Voice input with states | Idle, Recording (with animation), Muted, With stop button |
| **Pill Filters** | Custom | Tab-style content filters | Selected, Unselected, Multiple filter groups |
| **Suggestion Chips** | Custom | Clickable prompt suggestions | Default, Outlined, With Sparkle icon |
| **Action Buttons** | Custom | Unified button styles for chat input actions | With labels, Icon only, Selected state, Variants (Sources, Tools, Computer use) |
| **Sensitivity Labels** | Fluent | Data classification indicators | Standard shield, With lock, Highly Confidential button variant |
| **Dropdown Menus** | Custom | Filter and sort menus with consistent styling | Standard, With Labels & Separator, With Selection Indicator |
| **Checkbox Pattern** | Custom | Standardized selection indicator | Selected, Unselected, Hover. Specs: 20x20px, 4px radius, 12x12px icon |

### Feedback & Status

**Count:** 5 components

| Component | Type | Description | Key Variants/States |
|-----------|------|-------------|---------------------|
| **Latency Patterns** | Fluent | Loading and streaming indicators | **Spinner sizes:** tiny, extra-small, small, medium, large, extra-large, huge. **Streaming:** MorseCode animation, "Thinking..." text. **Scroll button:** with/without streaming indicator |
| **Status Badges** | Custom | Pattern maturity indicators | Coherent pattern (green), Adopted pattern (blue), Establishing pattern (yellow), Experimental feature (purple) |
| **Feedback** | Fluent | FeedbackButtons and FeedbackForm | Like/Dislike buttons, Full feedback form with text input, radio options, privacy controls |
| **Notifications** | Custom | Bell states and items | Rest, Activity (dot indicator), Count badge (3, 12, 99), Pressed state, Selected state. Notification items with avatar, title, time, description |
| **Toasts** | Custom | Toast notifications | With agent icon, Title, Description, "View conversation" link, Dismiss button. Position: top-left, 16px padding, max 4 visible, 8px gap |

### Navigation

**Count:** 4 components

| Component | Type | Description | Key Variants/States |
|-----------|------|-------------|---------------------|
| **Headers** | Custom | Page and entity header variants with controls | **Variants:** Entity, Pages, Agents. **Controls:** Edit title, Edit button, Open in app, Avatars, Undo/Redo, Primary action, More button, Close, Zoom controls |
| **Title Bar** | Custom | Header for Copilot chat pane | Menu button, Protection status, Storage, Globe, New chat, More options, Close. Work/Web toggle tabs |
| **Teaching Popover** | Custom | Contextual onboarding guidance | Close button, Illustration, Title, Description, Navigation buttons (Back, Next) |
| **First Run Experience** | Fluent | Onboarding dialog | Start Tour button |

### Data Display

**Count:** 5 components

| Component | Type | Description | Key Variants/States |
|-----------|------|-------------|---------------------|
| **Entity Cards** | Fluent | Fluent UI Copilot entity cards | **Document Cards:** Word, Excel, PowerPoint with user avatar, timestamp, insights, thumbnail. **People Cards:** Avatar with presence, name, role, actions. **Meeting Cards:** Calendar icon, title, time, location, attendees, insights. **Overflow Actions:** "+N" button for additional actions |
| **Reference Panel** | Custom | Source selection and management | Checkbox selection, Document list with icons, Source count badge |
| **System Messages** | Custom | System notifications | Person added notification, Copilot action notification (with link), Standard access message |
| **First Run Experience** | Fluent | Onboarding dialog | Start Tour button |

---

## Foundations

**URL:** https://coworker-demo.lovable.app/design-system (Foundations tab)

### Primary Brand Palette

Primary color with interaction states:

| Token | State | Description |
|-------|-------|-------------|
| `--primary` | Default | Primary brand color |
| `--primary-hover` | Hover | Hover state |
| `--primary-active` | Active | Pressed/active state |
| `--primary-disabled` | Disabled | Disabled state |

### Brand Flair & Gradients

Copilot signature gradient colors:

| Token | Value | Description |
|-------|-------|-------------|
| `--brand-flair-1` | #464FEB | Blue/purple |
| `--brand-flair-2` | #47CFFA | Cyan |
| `--brand-flair-3` | #B47CF8 | Purple |

**Gradient Variants:**
- **Primary** - Linear gradient
- **Full** - Full-width gradient
- **Radial** - Radial gradient

### Status Colors

Semantic colors for states:

| Token | State |
|-------|-------|
| `--status-success` | Success (green) |
| `--status-warning` | Warning (yellow/amber) |
| `--status-error` | Error (red) |

### Surface Colors

Background and foreground tokens:

| Token | Usage |
|-------|-------|
| `background` | Page background |
| `card` | Card/panel background |
| `secondary` | Secondary surfaces |
| `muted` | Muted/subtle backgrounds |
| `accent` | Accent surfaces |

### Text Color Scale

Semantic text colors for typography hierarchy:

| Token | Hex | Usage | CSS Class |
|-------|-----|-------|-----------|
| Primary | #424242 | Main body text | `text-text-primary` |
| Subtle | #707070 | Secondary text | `text-text-subtle` |
| Disabled | #9E9E9E | Disabled states | `text-text-disabled` |
| Placeholder | #BDBDBD | Input placeholders | `text-text-placeholder` |

### Typography Scale

Fluent Copilot typography presets (format: font-size / line-height / font-weight):

#### Display & Titles

| Class | Specs | Description |
|-------|-------|-------------|
| `.text-display` | 68px / 92px / 600 | Display text |
| `.text-large-title` | 40px / 52px / 600 | Large title |
| `.text-title-1` | 28px / 36px / 600 | Title 1 |
| `.text-title-2` | 24px / 32px / 600 | Title 2 |
| `.text-title-3` | 20px / 28px / 600 | Title 3 |

#### Subtitles

| Class | Specs | Description |
|-------|-------|-------------|
| `.text-subtitle-1` | 20px / 28px / 400 | Large subtitle text |
| `.text-subtitle-2` | 16px / 22px / 600 | Small subtitle text |

#### Body Text

| Class | Specs | Description |
|-------|-------|-------------|
| `.text-body-1` | 16.6px / 24px / 400 | Primary body text for main content areas |
| `.text-body-1-strong` | 16.6px / 24px / 600 | Emphasized primary text |
| `.text-body-2` | 14px / 20px / 400 | Secondary body text for supporting content |
| `.text-body-2-strong` | 14px / 20px / 600 | Used for Chain of Thought step headers |
| `.text-body-3` | 12px / 16px / 400 | Tertiary body text for compact areas |

#### Captions

| Class | Specs | Description |
|-------|-------|-------------|
| `.text-caption-1` | 12px / 16px / 400 | Primary captions and labels |
| `.text-caption-1-strong` | 12px / 16px / 600 | Emphasized captions |
| `.text-caption-2` | 10px / 14px / 400 | Small captions, metadata, timestamps |
| `.text-caption-2-strong` | 10px / 14px / 600 | Emphasized small captions |

#### Typography Usage

**CSS Utility Class:**
```tsx
<p className="text-body-2-strong">Text</p>
```

**Fluent React Component:**
```tsx
<Body1Strong>Text</Body1Strong>
```

### Fluent UI Theme Mapping

How CSS variables map to Fluent tokens:

| CSS Variable | Fluent UI Token | Usage |
|--------------|-----------------|-------|
| `--primary` | `colorBrandBackground` | Primary button background |
| `--primary-hover` | `colorBrandBackgroundHover` | Primary button hover |
| `--muted` | `colorSubtleBackgroundHover` | Subtle button hover |
| `--foreground` | `colorNeutralForeground1` | Primary text color |
| `--ring` | `colorStrokeFocus2` | Focus ring color |

---

## Icons

**URL:** https://coworker-demo.lovable.app/design-system (Icons tab)

### Microsoft Product Icons

Product and service icons (40x40):

| Icon Name | Description |
|-----------|-------------|
| copilot-color | Copilot full color |
| copilot-monoline | Copilot monoline |
| word | Microsoft Word |
| word-2 | Word alternate |
| excel | Microsoft Excel |
| excel-2 | Excel alternate |
| powerpoint | Microsoft PowerPoint |
| ppt | PowerPoint alternate |
| outlook | Microsoft Outlook |
| mail | Mail icon |
| exchange | Microsoft Exchange |
| teams | Microsoft Teams |
| onedrive | OneDrive |
| sharepoint | SharePoint |
| sharepoint-2 | SharePoint alternate |
| designer | Microsoft Designer |
| notes | Notes/OneNote |
| opal | Opal |
| defender | Microsoft Defender |
| power-apps | Power Apps |
| analytics | Analytics |
| automate | Power Automate |

### Navigation Icons

Theme-aware icons with regular/color variants (hover to see color state):

| Icon Name | Description |
|-----------|-------------|
| Search | Search/magnifying glass |
| Library | Library/books |
| Create | Create/new |
| Chat | Chat bubble |
| Chat New | New chat |
| Pages | Pages/documents |
| Notebooks | Notebooks |
| Notebooks New | New notebook |
| History | History/clock |
| Apps | Applications grid |
| Boards | Boards/kanban |
| Agents | AI agents |
| Agents New | New agent |
| Frontier | Frontier icon |
| Copilot Outline | Copilot outline |

### Agent Icons

Available in 20px and 24px sizes:

| Icon Name | Description |
|-----------|-------------|
| analyst | Analyst agent |
| app-builder | App Builder agent |
| catch-up | Catch Up agent |
| edit-mono | Edit/pencil mono |
| eventify | Eventify agent |
| flow-builder | Flow Builder agent |
| idea-coach | Idea Coach agent |
| people | People agent |
| photos | Photos agent |
| planner | Planner agent |
| prompt-coach | Prompt Coach agent |
| researcher | Researcher agent |
| sales | Sales agent |
| skills-navigator | Skills Navigator agent |
| surveys | Surveys agent |

### UI Icons

Interface and action icons (20x20):

| Icon Name | Description |
|-----------|-------------|
| chat-empty | Empty chat state |
| chat-hover | Chat hover state |
| chat-hover-2 | Chat hover alternate |
| button-chat | Chat button |
| create-plus | Create/plus |
| agents-add | Add agent |
| search-mono | Search monoline |
| notebooks | Notebooks |
| menu-collapse | Menu collapse |
| chevron | Chevron |
| icon-hamburger | Hamburger menu |
| icon-mic | Microphone |
| icon-calendar | Calendar |
| icon-briefcase | Briefcase |
| icon-chat | Chat |
| icon-edit-response | Edit response |
| icon-info | Information |
| icon-open | Open/external link |
| icon-outlook | Outlook |
| icon-plus | Plus |
| icon-ppt | PowerPoint |
| icon-slider | Slider/settings |
| icon-teams | Teams |
| icon-word | Word |
| icon-sensitivity | Sensitivity shield |
| icon-sensitivity-orange | Sensitivity shield (orange) |
| text-align | Text alignment |
| options | Options/settings |
| researcher | Researcher |
| sales | Sales |
| pages | Pages |

### Status Indicators

Status icons with rest/hover states:

| Icon Name | Description |
|-----------|-------------|
| Completed | Checkmark - task complete |
| Error | Error/warning |
| Running | In progress |
| Paused | Paused state |
| Needs Input | Attention needed |
| Collapse | Collapse/minimize |
| Expand | Expand/maximize |
| Dismiss | Close/dismiss |
| Nav Menu | Navigation menu |
| Notification | Bell notification |
| Proactive Reply | Proactive response indicator |

### Chevrons & Arrows

Directional icons with rest/hover states, available in 16px and 20px:

| Icon Name | Sizes |
|-----------|-------|
| Down | 16, 20 |
| Right | 16, 20 |
| Up | 16, 20 |

### Action Icons

Interactive action icons with rest/hover states, available in 16px and 20px:

| Icon Name | Sizes |
|-----------|-------|
| Plus | 16, 20 |
| Pin | 16, 20 |
| Unpin | 16, 20 |
| Filter | 16, 20 |
| Search | 16, 20 |
| More | 16, 20 |

### Icon Usage

```tsx
// Import CopilotIcon component
import { CopilotIcon } from '@/lib/copilot-chat';

// Use in JSX
<CopilotIcon className="h-6 w-6" />

// Or use img tag for SVG files
<img src="/icons/word.svg" alt="Word" className="h-8 w-8" />

// For hover variants, use CSS group pattern
<div className="group relative">
  <img src="/icons/chat-regular.svg" className="group-hover:opacity-0" />
  <img src="/icons/chat-color.svg" className="opacity-0 group-hover:opacity-100 absolute inset-0" />
</div>
```

---

## Content

**URL:** https://coworker-demo.lovable.app/design-system (Content tab)

The Content tab provides a CMS (Content Management System) interface for managing demo content including:

- Prompts
- Reasoning steps
- Tasks
- Completion messages

**Note:** This section requires admin authentication to access. Content changes are saved to the database and applied to the `/templates` demo page.

### Authentication Required

To access the Content CMS:
1. Sign in with an admin account
2. Use email/password authentication
3. New accounts can be created via the "Create one" option

---

## Quick Reference

### Component Categories Summary

| Category | Count | Key Components |
|----------|-------|----------------|
| Chat & Messaging | 8 | Chat Input, Messages, Attachments, Citations |
| AI Reasoning | 4 | Chain of Thought, Reasoning Items, Compact Indicator |
| Buttons | 1 | Copilot Buttons (9 variants) |
| Input & Controls | 7 | Agent Tags, Voice Control, Suggestion Chips |
| Feedback & Status | 5 | Latency Patterns, Notifications, Toasts |
| Navigation | 4 | Headers, Title Bar, Teaching Popover |
| Data Display | 5 | Entity Cards, Reference Panel, System Messages |

### Design Token Categories

| Category | Key Tokens |
|----------|------------|
| Brand Colors | `--primary`, `--brand-flair-*` |
| Status Colors | `--status-success`, `--status-warning`, `--status-error` |
| Surfaces | `background`, `card`, `secondary`, `muted`, `accent` |
| Text Colors | `text-primary`, `text-subtle`, `text-disabled`, `text-placeholder` |

### Typography Quick Reference

| Level | Class | Size |
|-------|-------|------|
| Display | `.text-display` | 68px |
| Title 1 | `.text-title-1` | 28px |
| Title 2 | `.text-title-2` | 24px |
| Title 3 | `.text-title-3` | 20px |
| Body 1 | `.text-body-1` | 16.6px |
| Body 2 | `.text-body-2` | 14px |
| Body 3 | `.text-body-3` | 12px |
| Caption 1 | `.text-caption-1` | 12px |
| Caption 2 | `.text-caption-2` | 10px |

### Fluent vs Custom Components

| Type | Components |
|------|------------|
| **Fluent** | Chat Input, CopilotChatBar, Messages, Message Actions, Attachments, Citations & References, Prompt Starters, Chain of Thought, ChainOfThoughtItem, ChainOfThoughtCollapsibleItem, Agent Tags, Capability Picker, Voice Control, Sensitivity Labels, Latency Patterns, Feedback, Entity Cards, First Run Experience |
| **Custom** | Copilot Buttons, Pill Filters, Suggestion Chips, Action Buttons, Dropdown Menus, Checkbox Pattern, Status Badges, Notifications, Toasts, Headers, Title Bar, Teaching Popover, Reference Panel, System Messages, Compact Indicator |
