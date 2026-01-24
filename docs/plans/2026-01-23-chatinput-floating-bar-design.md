# ChatInput Floating Bar Design Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Apply the new "floating bar" design to the ChatInput component with gradient focus border, elevation animation, and polished visual treatment.

**Architecture:** Update ChatInput.module.css to replace the current double-border focus style with an elevated card appearance. Use CSS mask technique for gradient border, focus-within for sub-component focus handling, and CSS transitions for smooth animations.

**Tech Stack:** CSS Modules, CSS Custom Properties (design tokens), CSS masks, CSS animations

---

## Reference: Target Design

The mock implementation is at:
- `packages/ui-kit/mock-pages/src/examples/ChatInputRedesign.module.css`
- `packages/ui-kit/mock-pages/src/examples/ChatInputRedesign.stories.tsx`

Key visual features:
1. Elevated card appearance with subtle shadow at rest
2. More rounded corners (`--radius-xl`)
3. Gradient multi-colored border on focus (pink → purple → blue → green → yellow)
4. Shadow grows and component lifts on focus (`translateY(-2px)`)
5. Gradient border animates (slow color rotation)
6. Focus-within triggers for ALL child elements (editor, buttons, image well)

---

## Task 1: Update Container Base Styles

**Files:**
- Modify: `packages/ui-kit/react-chat/src/components/ChatInput/ChatInput.module.css:1-16`

**Step 1: Update the `.container` base styles**

Replace lines 1-16 with:

```css
.container {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  box-sizing: border-box;
  background: var(--soft-bg);
  border: 1px solid var(--soft-border);
  border-radius: var(--radius-xl);
  padding: var(--space-2);
  isolation: isolate;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.04),
    0 2px 4px rgba(0, 0, 0, 0.04);
  transition:
    background-color var(--duration-fast) var(--ease-default),
    border-color var(--duration-fast) var(--ease-default),
    box-shadow 0.2s ease-out,
    transform 0.2s ease-out;
}
```

**Step 2: Verify the file saved correctly**

Read lines 1-20 of the file to confirm changes.

**Step 3: Commit**

```bash
git add packages/ui-kit/react-chat/src/components/ChatInput/ChatInput.module.css
git commit -m "feat(ChatInput): update container base styles for floating bar design"
```

---

## Task 2: Update Hover State

**Files:**
- Modify: `packages/ui-kit/react-chat/src/components/ChatInput/ChatInput.module.css:18-20`

**Step 1: Update the hover state**

Replace the hover rule with:

```css
.container:hover:not(.disabled) {
  background: var(--soft-bg-hover);
}
```

**Step 2: Verify the change**

Read lines 18-22 to confirm.

**Step 3: Commit**

```bash
git add packages/ui-kit/react-chat/src/components/ChatInput/ChatInput.module.css
git commit -m "feat(ChatInput): update hover state for soft surface"
```

---

## Task 3: Replace Focus-Within Styles

**Files:**
- Modify: `packages/ui-kit/react-chat/src/components/ChatInput/ChatInput.module.css:22-27`

**Step 1: Replace the focus-within rule**

Replace lines 22-27 with the new elevated focus state:

```css
.container:focus-within {
  background: var(--soft-bg-pressed);
  border-color: transparent;
  transform: translateY(-2px);
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.06),
    0 8px 24px rgba(0, 0, 0, 0.08),
    0 0 8px 0 rgba(167, 139, 250, 0.3),
    0 0 20px 0 rgba(96, 165, 250, 0.2),
    0 0 32px 0 rgba(244, 114, 182, 0.1);
}
```

**Step 2: Verify the change**

Read lines 22-35 to confirm.

**Step 3: Commit**

```bash
git add packages/ui-kit/react-chat/src/components/ChatInput/ChatInput.module.css
git commit -m "feat(ChatInput): replace outline focus with elevated shadow"
```

---

## Task 4: Add Gradient Border Pseudo-Element

**Files:**
- Modify: `packages/ui-kit/react-chat/src/components/ChatInput/ChatInput.module.css` (add after focus-within rule)

**Step 1: Add the gradient border pseudo-element**

Add these rules immediately after the `.container:focus-within` block (around line 33):

```css
/* Gradient border for focus state */
.container::before {
  content: '';
  position: absolute;
  inset: -2.5px;
  border-radius: calc(var(--radius-xl) + 2.5px);
  padding: 2.5px;
  background: linear-gradient(
    135deg,
    #f472b6 0%,
    #a78bfa 25%,
    #60a5fa 50%,
    #34d399 75%,
    #fbbf24 100%
  );
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask-composite: exclude;
  z-index: -1;
  opacity: 0;
  transition: opacity 0.15s ease-out;
  animation: gradientRotate 3s linear infinite;
  background-size: 200% 200%;
  pointer-events: none;
}

.container:focus-within::before {
  opacity: 1;
}
```

**Step 2: Verify the change**

Read lines 33-65 to confirm the new rules were added.

**Step 3: Commit**

```bash
git add packages/ui-kit/react-chat/src/components/ChatInput/ChatInput.module.css
git commit -m "feat(ChatInput): add animated gradient border for focus state"
```

---

## Task 5: Add Gradient Animation Keyframes

**Files:**
- Modify: `packages/ui-kit/react-chat/src/components/ChatInput/ChatInput.module.css` (add after the pseudo-element rules)

**Step 1: Add the keyframes animation**

Add after the `.container:focus-within::before` rule:

```css
@keyframes gradientRotate {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
```

**Step 2: Verify the change**

Read the section where keyframes were added to confirm.

**Step 3: Commit**

```bash
git add packages/ui-kit/react-chat/src/components/ChatInput/ChatInput.module.css
git commit -m "feat(ChatInput): add gradient rotation animation"
```

---

## Task 6: Update Size Variants

**Files:**
- Modify: `packages/ui-kit/react-chat/src/components/ChatInput/ChatInput.module.css` (size variants section)

**Step 1: Update size variants to use consistent radius**

Find and update the size variant rules:

```css
/* Size variants */
.sm {
  padding: var(--space-1-5);
  border-radius: var(--radius-lg);
}

.md {
  padding: var(--space-2);
}

.lg {
  padding: var(--space-3);
}

/* Adjust gradient border radius for small size */
.sm::before {
  border-radius: calc(var(--radius-lg) + 2.5px);
}
```

**Step 2: Verify the change**

Read the size variants section to confirm.

**Step 3: Commit**

```bash
git add packages/ui-kit/react-chat/src/components/ChatInput/ChatInput.module.css
git commit -m "feat(ChatInput): update size variants for consistent rounding"
```

---

## Task 7: Update Error State

**Files:**
- Modify: `packages/ui-kit/react-chat/src/components/ChatInput/ChatInput.module.css` (error state section)

**Step 1: Update error state to work with new design**

Find and update the error rules:

```css
/* States */
.error {
  border-color: var(--feedback-danger-border);
}

.error::before {
  background: var(--feedback-danger-bg);
}

.error:focus-within {
  border-color: transparent;
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.06),
    0 8px 24px rgba(0, 0, 0, 0.08),
    0 0 8px 0 rgba(239, 68, 68, 0.3),
    0 0 20px 0 rgba(239, 68, 68, 0.2),
    0 0 32px 0 rgba(239, 68, 68, 0.1);
}
```

**Step 2: Verify the change**

Read the error state section to confirm.

**Step 3: Commit**

```bash
git add packages/ui-kit/react-chat/src/components/ChatInput/ChatInput.module.css
git commit -m "feat(ChatInput): update error state for floating bar design"
```

---

## Task 8: Update Drop Overlay Border Radius

**Files:**
- Modify: `packages/ui-kit/react-chat/src/components/ChatInput/ChatInput.module.css` (drop overlay section)

**Step 1: Update drop overlay radius**

Find `.dropOverlay` and update:

```css
.dropOverlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-bg);
  opacity: 0.9;
  border-radius: var(--radius-xl);
  color: var(--primary-fg);
  font-size: var(--text-base);
  font-weight: var(--weight-medium);
  pointer-events: none;
  z-index: 10;
}
```

**Step 2: Verify the change**

Read the drop overlay section to confirm.

**Step 3: Commit**

```bash
git add packages/ui-kit/react-chat/src/components/ChatInput/ChatInput.module.css
git commit -m "feat(ChatInput): update drop overlay radius"
```

---

## Task 9: Update Reduced Motion Preferences

**Files:**
- Modify: `packages/ui-kit/react-chat/src/components/ChatInput/ChatInput.module.css` (reduced motion section)

**Step 1: Update reduced motion media query**

Find and update the `@media (prefers-reduced-motion: reduce)` section:

```css
/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .container {
    transition: none;
  }

  .container::before {
    animation: none;
    transition: none;
  }

  .imageThumbnail {
    transition: none;
  }
}
```

**Step 2: Verify the change**

Read the reduced motion section to confirm.

**Step 3: Commit**

```bash
git add packages/ui-kit/react-chat/src/components/ChatInput/ChatInput.module.css
git commit -m "feat(ChatInput): respect reduced motion for animations"
```

---

## Task 10: Build and Visual Verification

**Files:**
- Test: `packages/ui-kit/react-chat`

**Step 1: Build the react-chat package**

```bash
cd /Users/dzearing/git/ai-exp-2/packages/ui-kit/react-chat && pnpm build
```

Expected: Build succeeds with no errors.

**Step 2: Build and run Storybook to verify visually**

```bash
cd /Users/dzearing/git/ai-exp-2/packages/ui-kit/mock-pages && pnpm dev
```

Navigate to ChatInput stories and verify:
- [ ] Subtle shadow at rest
- [ ] More rounded corners
- [ ] Gradient border appears on focus
- [ ] Component elevates (`translateY(-2px)`) on focus
- [ ] Gradient animates (slow color shift)
- [ ] Focus persists when clicking multiline button
- [ ] Focus persists when clicking formatting toolbar buttons
- [ ] Focus persists when clicking image well thumbnails
- [ ] Error state shows red glow instead of gradient
- [ ] All size variants (sm, md, lg) look correct
- [ ] Reduced motion disables animation

**Step 3: Commit final verification**

```bash
git add .
git commit -m "feat(ChatInput): complete floating bar design implementation"
```

---

## Summary of Changes

| File | Change |
|------|--------|
| `ChatInput.module.css` | Updated container to use `--soft-bg`, `--radius-xl`, elevation shadow |
| `ChatInput.module.css` | Replaced outline focus with gradient border pseudo-element |
| `ChatInput.module.css` | Added `@keyframes gradientRotate` for animated gradient |
| `ChatInput.module.css` | Updated size variants for consistent rounding |
| `ChatInput.module.css` | Updated error state with red glow |
| `ChatInput.module.css` | Updated drop overlay radius |
| `ChatInput.module.css` | Added reduced motion support for new animations |

## Key Technical Details

1. **Gradient border technique**: Uses CSS mask to create a border-only gradient. The `::before` pseudo-element has a gradient background, and a mask cuts out the content area leaving only the border visible.

2. **Focus-within**: The `:focus-within` selector triggers when ANY descendant element has focus, including the TipTap editor, toolbar buttons, and image well thumbnails.

3. **Stacking context**: `isolation: isolate` creates a new stacking context so the `z-index: -1` on `::before` positions it behind the container content but above elements behind the container.

4. **Accessibility**: Gradient animation respects `prefers-reduced-motion`. The component still has clear focus indication through the visible gradient border.
