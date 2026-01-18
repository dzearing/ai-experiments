# Phase 4: Hover Toolbar - Research

**Researched:** 2026-01-18
**Domain:** React UI, CSS hover interactions, clipboard API, accessibility
**Confidence:** HIGH

## Summary

Research for implementing a hover toolbar on ChatMessage components. The toolbar appears on message hover/focus and provides timestamp display, copy-to-clipboard, and optional edit functionality.

Key findings:
- The ui-kit/react package already provides `CopyButton`, `IconButton`, and `Tooltip` components that handle clipboard operations and tooltips
- Mockup code in GroupSubtleLayout.tsx demonstrates the exact design pattern required: positioned absolute in top-right, backdrop blur, show on hover
- The `navigator.clipboard.writeText()` API is used in the existing CopyButton component
- RelativeTime component's `formatFullDate` utility can be used for tooltip display; simple `toLocaleTimeString` for inline timestamp

**Primary recommendation:** Create a dedicated `MessageToolbar` component in react-chat that composes `IconButton` and `CopyButton` from ui-kit/react, with CSS-driven hover visibility.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @ui-kit/react | local | IconButton, CopyButton, Tooltip | Already provides clipboard + tooltip functionality |
| @ui-kit/icons | local | CopyIcon, EditIcon | Icon library for toolbar buttons |
| navigator.clipboard | Web API | Clipboard write access | Modern browsers, already used in CopyButton |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| formatFullDate | from @ui-kit/react | Full date for tooltip | Show complete timestamp on hover |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CopyButton | navigator.clipboard directly | CopyButton handles feedback UI, tooltip, error handling |
| IconButton + Tooltip | Custom buttons | IconButton already composes Tooltip automatically |

**Installation:**
Already available - no new dependencies needed.

## Architecture Patterns

### Recommended Component Structure
```
react-chat/src/components/
├── ChatMessage/
│   ├── ChatMessage.tsx          # Updated to include MessageToolbar
│   ├── ChatMessage.module.css   # Updated with toolbar styles
│   └── index.ts
└── MessageToolbar/              # New component
    ├── MessageToolbar.tsx       # Toolbar UI
    ├── MessageToolbar.module.css
    └── index.ts
```

### Pattern 1: CSS Hover-Revealed Toolbar
**What:** Toolbar hidden by default, revealed on parent hover via CSS
**When to use:** Hover-to-reveal UI patterns
**Example:**
```css
/* Source: GroupSubtleLayout mockup */
.messageToolbar {
  position: absolute;
  right: var(--space-2);
  top: var(--space-2);
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1);
  border-radius: var(--radius-md);
  opacity: 0;
  transition: opacity var(--duration-fast) var(--ease-default);
  backdrop-filter: blur(8px);
}

.message:hover .messageToolbar,
.message:focus-within .messageToolbar {
  opacity: 1;
}
```

### Pattern 2: Mode-Adaptive Styling
**What:** Different color schemes for user vs assistant messages
**When to use:** When toolbar appears over different backgrounds
**Example:**
```css
/* User message toolbar - over primary background */
.toolbarUser {
  background: var(--primary-bg-hover);
  color: var(--primary-fg);
}

/* Assistant message toolbar - over transparent/neutral background */
.toolbarAssistant {
  background: var(--soft-bg);
  border: 1px solid var(--soft-border);
  color: var(--base-fg-soft);
}
```

### Pattern 3: CopyButton with getContent Callback
**What:** Use getContent prop instead of static content for dynamic copy
**When to use:** When content to copy may vary
**Example:**
```typescript
// Source: CopyButton.tsx API
<CopyButton
  getContent={() => getMessageText(messageId)}
  variant="ghost"
  size="sm"
  aria-label="Copy message"
/>
```

### Anti-Patterns to Avoid
- **Don't use CSS visibility:hidden** - breaks focus management; use opacity for smooth transitions
- **Don't inline clipboard code** - CopyButton already handles the clipboard API, feedback states, and errors
- **Don't create new Tooltip instances** - IconButton and CopyButton already include tooltips

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Clipboard copy | navigator.clipboard directly | CopyButton | Handles async, feedback state, error handling |
| Icon buttons with tooltips | button + Tooltip manually | IconButton | Already composes Tooltip, handles accessibility |
| Time formatting | Custom formatTime | toLocaleTimeString | Standard browser API, already used in mockups |
| Full date tooltip | Custom string building | formatFullDate from RelativeTime | Consistent formatting across app |

**Key insight:** The ui-kit/react package already provides battle-tested components for the toolbar actions. Compose, don't reimplement.

## Common Pitfalls

### Pitfall 1: Clipboard API Requires Secure Context
**What goes wrong:** Copy fails silently in non-HTTPS environments
**Why it happens:** navigator.clipboard requires secure context (HTTPS or localhost)
**How to avoid:** CopyButton component already handles this - just use it
**Warning signs:** Copy button click does nothing in production

### Pitfall 2: Backdrop-filter Browser Support
**What goes wrong:** Blur effect not visible in older browsers
**Why it happens:** backdrop-filter has limited browser support
**How to avoid:** Provide solid background fallback, backdrop-filter is progressive enhancement
**Warning signs:** Toolbar background looks off in Safari < 14

### Pitfall 3: Focus vs Hover Accessibility
**What goes wrong:** Keyboard users can't access toolbar
**Why it happens:** Only hover trigger, no focus trigger
**How to avoid:** Add `:focus-within` selector alongside `:hover`
**Warning signs:** Toolbar invisible when tabbing through messages

### Pitfall 4: Toolbar Obscuring Message Content
**What goes wrong:** Toolbar covers text in short messages
**Why it happens:** Absolute positioning in top-right
**How to avoid:** Add minimum padding or let toolbar push outside message bounds
**Warning signs:** First line of message hidden by toolbar on hover

## Code Examples

Verified patterns from official sources:

### Timestamp Formatting (from mockups)
```typescript
// Source: GroupSubtleLayout.tsx line 30-32
function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
```

### Toolbar Structure (from mockups)
```tsx
// Source: GroupSubtleLayout.tsx lines 69-87
<div className={`${styles.messageToolbar} ${isOwn ? styles.toolbarUser : styles.toolbarAssistant}`}>
  <span className={styles.toolbarTime}>
    {formatTime(timestamp)}
  </span>
  <button className={styles.toolbarButton} aria-label="Copy message">
    <CopyIcon className={styles.toolbarIcon} />
  </button>
  {showEdit && (
    <button className={styles.toolbarButton} aria-label="Edit message">
      <EditIcon className={styles.toolbarIcon} />
    </button>
  )}
</div>
```

### CopyButton with Dynamic Content
```typescript
// Source: CopyButton.tsx API
<CopyButton
  getContent={async () => {
    // Extract plain text from message (strip markdown)
    return getPlainTextContent(messageContent);
  }}
  variant="ghost"
  size="sm"
/>
```

### Toolbar CSS Pattern
```css
/* Source: mock-pages/styles.module.css lines 172-241 */
.messageToolbar {
  position: absolute;
  right: var(--space-2);
  top: var(--space-2);
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1);
  border-radius: var(--radius-md);
  opacity: 0;
  transition: opacity var(--duration-fast) var(--ease-default);
  backdrop-filter: blur(8px);
}

.message:hover .messageToolbar,
.message:focus-within .messageToolbar {
  opacity: 1;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| document.execCommand('copy') | navigator.clipboard.writeText() | 2019+ | Async API, better error handling |
| visibility: hidden | opacity: 0 + transition | CSS3 | Smooth fade transitions |
| Custom tooltip logic | Tooltip component composition | ui-kit | Consistent tooltip behavior |

**Deprecated/outdated:**
- `document.execCommand('copy')`: Deprecated, use Clipboard API
- `copy-to-clipboard` npm package: Not needed, Clipboard API is well-supported

## Prop Interface Recommendations

### MessageToolbar Component
```typescript
interface MessageToolbarProps {
  /** Message timestamp for display */
  timestamp: Date | number | string;

  /** Callback to get message content for copy (async supported) */
  getContent: () => string | Promise<string>;

  /** Whether this is the user's own message (affects styling) */
  isOwn?: boolean;

  /** Show edit button (default: false) */
  showEdit?: boolean;

  /** Callback when edit is clicked */
  onEdit?: () => void;

  /** Additional CSS class */
  className?: string;
}
```

### ChatMessage Updates
```typescript
// New props to add to ChatMessageProps
interface ChatMessageProps {
  // ... existing props ...

  /** Callback when edit is clicked on toolbar */
  onEdit?: (messageId: string) => void;

  /** Enable edit button in toolbar (default: false) */
  enableEdit?: boolean;
}
```

## Design Token Mappings

### Toolbar Surface Tokens
| Usage | Token | Notes |
|-------|-------|-------|
| User toolbar background | `--primary-bg-hover` | Matches user message |
| Assistant toolbar background | `--soft-bg` | Neutral background |
| Assistant toolbar border | `--soft-border` | Visual separation |
| User toolbar text | `--primary-fg` | High contrast on primary |
| Assistant toolbar text | `--base-fg-soft` | Softer text |

### Spacing Tokens
| Usage | Token | Value |
|-------|-------|-------|
| Toolbar position offset | `--space-2` | 8px from edges |
| Toolbar gap | `--space-1` | 4px between items |
| Toolbar padding | `--space-1` | 4px internal padding |

### Other Tokens
| Usage | Token |
|-------|-------|
| Border radius | `--radius-md` |
| Transition duration | `--duration-fast` |
| Transition easing | `--ease-default` |

## Open Questions

Things that couldn't be fully resolved:

1. **Edit callback behavior**
   - What we know: Edit button should be configurable (off by default)
   - What's unclear: What should edit do - inline editing or open modal?
   - Recommendation: Make onEdit callback generic; consumer decides behavior

2. **Touch device behavior**
   - What we know: Hover doesn't work on touch
   - What's unclear: Should toolbar always show on touch, or use long-press?
   - Recommendation: Consider always-visible timestamp with tap-to-reveal buttons (Phase 5 scope)

## Sources

### Primary (HIGH confidence)
- `/packages/ui-kit/react/src/components/CopyButton/CopyButton.tsx` - clipboard API pattern
- `/packages/ui-kit/react/src/components/IconButton/IconButton.tsx` - icon button with tooltip
- `/packages/ui-kit/mock-pages/src/examples/chat-ux-exploration/layouts/GroupSubtleLayout.tsx` - mockup implementation
- `/packages/ui-kit/mock-pages/src/examples/chat-ux-exploration/shared/styles.module.css` - toolbar CSS patterns

### Secondary (MEDIUM confidence)
- `/packages/ui-kit/react/src/components/RelativeTime/formatRelativeTime.ts` - date formatting utilities

### Tertiary (LOW confidence)
- None - all findings verified against codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - verified against existing codebase
- Architecture: HIGH - matches mockup patterns exactly
- Pitfalls: HIGH - identified from component implementations and CSS

**Research date:** 2026-01-18
**Valid until:** 2026-02-18 (stable - internal codebase patterns)
