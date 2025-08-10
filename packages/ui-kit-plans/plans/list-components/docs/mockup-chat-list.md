# Chat List Component Mockup

## Visual Design

```
┌─────────────────────────────────────────────────────────────┐
│ Chat Messages                                               │
│ ┌───────────────────────────────────────────────────────┐   │
│ │                    Scroll Area                        │   │
│ │                                                       │   │
│ │  ┌─────────────────────────────────────┐             │   │
│ │  │ Avatar │ User Name        10:23 AM  │             │   │
│ │  │   🧑   │ ─────────────────────────── │             │   │
│ │  │        │ This is a message with     │             │   │
│ │  │        │ dynamic height that can    │             │   │
│ │  │        │ span multiple lines...     │             │   │
│ │  └─────────────────────────────────────┘             │   │
│ │                                                       │   │
│ │                      ┌─────────────────────────────┐ │   │
│ │                      │        10:24 AM  Assistant │ │   │
│ │                      │ ─────────────────────────── │ │   │
│ │                      │ Response message here      │ │   │
│ │                      │ with code block:          │ │   │
│ │                      │ ```javascript             │ │   │
│ │                      │ const x = 42;             │ │   │
│ │                      │ ```                       │ │   │
│ │                      └─────────────────────────────┘ │   │
│ │                                                       │   │
│ │  ┌─────────────────────────────────────┐             │   │
│ │  │ Avatar │ User Name        10:25 AM  │             │   │
│ │  │   🧑   │ ─────────────────────────── │             │   │
│ │  │        │ Another message...         │             │   │
│ │  └─────────────────────────────────────┘             │   │
│ │                                                       │   │
│ │  [Typing indicator...]                               │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ Type a message...                        [Send] [+]   │   │
│ └───────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Component Structure

### Chat Message Item
```html
<div class="chat-message" data-message-id="msg-123" style="--item-y: 240px;">
  <div class="chat-message__avatar">
    <img src="avatar.jpg" alt="User" />
  </div>
  <div class="chat-message__content">
    <div class="chat-message__header">
      <span class="chat-message__author">User Name</span>
      <span class="chat-message__time">10:23 AM</span>
    </div>
    <div class="chat-message__body">
      <!-- Dynamic content here -->
    </div>
    <div class="chat-message__actions">
      <button aria-label="Edit">✏️</button>
      <button aria-label="Reply">↩️</button>
      <button aria-label="React">😊</button>
    </div>
  </div>
</div>
```

## Animation Sequences

### New Message Entrance
```
Frame 0: Message invisible, positioned 20px below final position
Frame 1-10: Fade in opacity 0→1, slide up 20px→0px
Frame 11-15: Subtle bounce effect
```

### Message Removal
```
Frame 0: Full opacity, normal position
Frame 1-10: Fade out opacity 1→0, slight scale down 1→0.95
Frame 11: Remove from DOM, return to recycle pool
```

### Auto-Scroll Animation
```
When new message arrives and user is at bottom:
- Smooth scroll to new bottom over 200ms
- Use easing function for natural feel
- Maintain 60fps during scroll
```

## States

### Loading State
```
┌─────────────────────────────────────┐
│  ░░░ ░░░░░░░░░░░░    ░░░░░░░        │  <- Skeleton loader
│  ░░░░░░░░░░░░░░░░░░░░░░░░░          │
│                                      │
│  ░░░ ░░░░░░░░░░░░    ░░░░░░░        │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░          │
└─────────────────────────────────────┘
```

### Empty State
```
┌─────────────────────────────────────┐
│                                      │
│         💬                           │
│    No messages yet                  │
│    Start a conversation              │
│                                      │
└─────────────────────────────────────┘
```

### Error State
```
┌─────────────────────────────────────┐
│  ⚠️ Failed to load messages          │
│  [Retry]                             │
└─────────────────────────────────────┘
```

## Interaction Patterns

### Scroll Behavior
- **At Bottom**: Auto-scroll on new messages
- **Not at Bottom**: Show "New messages" indicator
- **Scroll Up**: Load older messages (virtualized)
- **Fast Scroll**: Show date indicator overlay

### Touch Gestures (Mobile)
- **Pull to Refresh**: Load newer messages
- **Swipe Right on Message**: Show actions
- **Long Press**: Select mode for bulk actions
- **Pinch**: Zoom text size

## CSS Implementation

```css
.chat-list {
  --chat-padding: var(--spacing);
  --message-gap: var(--spacing-small10);
  --avatar-size: 32px;
  
  position: relative;
  height: 100%;
  overflow-y: auto;
  scroll-behavior: smooth;
  padding: var(--chat-padding);
}

.chat-message {
  position: absolute;
  width: 100%;
  transform: translateY(var(--item-y));
  transition: transform var(--duration-smooth) var(--easing-smooth);
  will-change: transform;
  display: flex;
  gap: var(--spacing-small20);
  padding: var(--message-gap) 0;
}

/* Entrance animation */
.chat-message.entering {
  animation: slideInUp var(--duration-normal) var(--easing-smooth);
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(calc(var(--item-y) + 20px));
  }
  to {
    opacity: 1;
    transform: translateY(var(--item-y));
  }
}

/* User vs Assistant messages */
.chat-message--user {
  flex-direction: row;
}

.chat-message--assistant {
  flex-direction: row-reverse;
}

.chat-message--assistant .chat-message__content {
  background: var(--color-panel-background);
  border-radius: var(--radius-medium);
  padding: var(--spacing-small20);
}

/* Avatar */
.chat-message__avatar {
  width: var(--avatar-size);
  height: var(--avatar-size);
  border-radius: var(--radius-round);
  background: var(--color-avatar-background);
  flex-shrink: 0;
}

/* Content */
.chat-message__content {
  flex: 1;
  min-width: 0;
}

.chat-message__header {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--spacing-small30);
}

.chat-message__author {
  font-weight: var(--font-weight-medium);
  color: var(--color-body-text);
}

.chat-message__time {
  font-size: var(--font-size-small);
  color: var(--color-body-textSoft20);
}

.chat-message__body {
  color: var(--color-body-text);
  line-height: var(--line-height-normal);
  word-wrap: break-word;
}

/* Actions (on hover) */
.chat-message__actions {
  opacity: 0;
  transition: opacity var(--duration-fast);
  display: flex;
  gap: var(--spacing-small30);
  margin-top: var(--spacing-small30);
}

.chat-message:hover .chat-message__actions {
  opacity: 1;
}

/* Typing indicator */
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: var(--spacing-small20);
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: var(--color-body-textSoft20);
  border-radius: var(--radius-round);
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.5;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

/* New message indicator */
.new-messages-indicator {
  position: sticky;
  bottom: var(--spacing);
  background: var(--color-accent-background);
  color: var(--color-accent-text);
  padding: var(--spacing-small20) var(--spacing);
  border-radius: var(--radius-full);
  text-align: center;
  cursor: pointer;
  animation: slideInUp var(--duration-normal);
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .chat-list {
    --chat-padding: var(--spacing-small20);
    --avatar-size: 28px;
  }
  
  .chat-message__actions {
    opacity: 1; /* Always visible on mobile */
  }
}
```

## Performance Metrics

- **Initial Render**: < 16ms for viewport items
- **Scroll FPS**: Maintain 60fps during scroll
- **Message Addition**: < 4ms per message
- **DOM Nodes**: Max 50 message nodes active
- **Memory**: < 20MB for 10,000 messages