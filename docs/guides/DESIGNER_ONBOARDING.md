# Designer Onboarding Guide

This guide helps designers get started creating UI components and mock pages using VS Code and Claude Code.

---

## Initial Setup (One Time)

### 1. Install Git (skip if already installed)

To check if git is installed, open a terminal and run `git --version`. If you see a version number, skip to step 2.

**Mac:**
1. Open Terminal (press `Cmd+Space`, type "Terminal", press Enter)
2. Run: `xcode-select --install`
3. Click "Install" in the popup that appears

**Windows:**
1. Download Git from https://git-scm.com/download/win
2. Run the installer, accept all defaults
3. Restart VS Code after installation

### 2. Clone the Repository

In Terminal, run these commands:
```bash
mkdir git
cd git
git clone https://github.com/dzearing/ai-experiments.git
cd ai-experiments
code .
```

### 3. Install Dependencies

1. In VS Code, open the terminal: Press `` Ctrl+` `` (backtick) or **View → Terminal**
2. Run:
   ```bash
   npm install -g pnpm
   pnpm install
   ```

### 4. Start Claude Code

1. Open Claude Code in VS Code (click the Claude icon in the sidebar, or use the command palette)
2. You're ready to start creating components and mock pages

---

## Daily Use

### 1. Open the Project

Open Terminal and run:
```bash
cd git/ai-experiments
code .
```

### 2. Open Terminal in VS Code

Press `` Ctrl+` `` (backtick) or go to **View → Terminal** to open the integrated terminal.

### 3. Start the Dev Server

Run one of these commands in the terminal:

**For creating mock pages (recommended to start):**
```bash
cd packages/ui-kit/mock-pages && pnpm dev
```
This opens Storybook at http://localhost:6007

**For creating components:**
```bash
cd packages/ui-kit/react && pnpm dev
```
This opens Storybook at http://localhost:6033

**To see available icons:**
```bash
cd packages/ui-kit/icons-stories && pnpm dev
```

### 4. Open the Browser

After running `pnpm dev`, click the URL in the terminal (http://localhost:6007 or similar) to open Storybook in your browser.

---

## Creating Mock Pages

Mock pages are full-page designs that demonstrate how components work together. They live in:
```
packages/ui-kit/mock-pages/src/
```

### Using Claude Code to Create a Mock Page

1. Open Claude Code in VS Code
2. Describe what you want to create:

**Example prompt:**
```
Create a new mock page in packages/ui-kit/mock-pages for a "Task Dashboard" that shows:
- A header with a title and user avatar
- A sidebar with navigation items
- A main area with task cards in a grid
- Each card should show task title, status badge, and due date

Read and follow packages/ui-kit/mock-pages/MOCK_GUIDE.md for styling rules.
Read and follow packages/ui-kit/core/TOKEN_GUIDE.md for available design tokens.
Use existing components from @ui-kit/react where possible.
```

### Important Rules for Mock Pages

1. **Always use design tokens** - Never use hardcoded colors like `#ffffff` or `blue`
2. **Stay within color groups** - If you use `--soft-bg`, use `--soft-fg` for text (see TOKEN_GUIDE.md)
3. **Use existing components first** - Check what's available before creating custom elements

---

## Creating Components

Components are reusable UI building blocks. They live in:
```
packages/ui-kit/react/src/components/
```

### Using Claude Code to Create a Component

**Example prompt:**
```
Create a new "FeatureCard" component in packages/ui-kit/react that displays:
- An icon at the top
- A title
- A description
- An optional "Learn more" link

Read and follow packages/ui-kit/react/COMPONENT_GUIDE.md.
Read and follow packages/ui-kit/core/TOKEN_GUIDE.md for design tokens.
Include a Storybook story file with examples.
```

### Component File Structure

Claude Code will create these files for you:
```
src/components/FeatureCard/
├── FeatureCard.tsx           # The component code
├── FeatureCard.module.css    # Styles using design tokens
├── FeatureCard.stories.tsx   # Storybook examples
└── index.ts                  # Export file
```

---

## Essential Guides to Reference

When working with Claude Code, tell it to read these guides in your prompts:

| Guide | Path (from project root) | Use For |
|-------|--------------------------|---------|
| **TOKEN_GUIDE.md** | `packages/ui-kit/core/TOKEN_GUIDE.md` | All available design tokens (colors, spacing, typography) |
| **COMPONENT_GUIDE.md** | `packages/ui-kit/react/COMPONENT_GUIDE.md` | How to structure and build components |
| **MOCK_GUIDE.md** | `packages/ui-kit/mock-pages/MOCK_GUIDE.md` | How to create mock pages |
| **ICONS_CHEATSHEET.md** | `docs/guides/ICONS_CHEATSHEET.md` | Available icons |
| **TOKEN_CHEATSHEET.md** | `docs/guides/TOKEN_CHEATSHEET.md` | Quick token reference |

**Tip:** Always include "Read and follow [guide path]" in your prompts so Claude Code uses the correct patterns.

---

## Common Design Tokens

### Colors (The Golden Rule)

**Always match your background and foreground from the same group:**

```css
/* Correct - same group */
.card {
  background: var(--soft-bg);
  color: var(--soft-fg);
  border: 1px solid var(--soft-border);
}

/* Wrong - mixed groups */
.card {
  background: var(--soft-bg);
  color: var(--base-fg);  /* This may not be readable! */
}
```

### Available Color Groups

| Group | Use For |
|-------|---------|
| `softer` | Input fields, code blocks, recessed areas |
| `soft` | Cards, panels, alternating rows |
| `base` | Page background (default) |
| `strong` | Buttons, highlights |
| `primary` | Primary actions, selected states |
| `success` | Success messages |
| `warning` | Warning messages |
| `danger` | Errors, destructive actions |

### Spacing

```css
var(--space-1)   /* 4px */
var(--space-2)   /* 8px */
var(--space-3)   /* 12px */
var(--space-4)   /* 16px */
var(--space-6)   /* 24px */
var(--space-8)   /* 32px */
```

### Typography

```css
var(--font-size-xs)    /* 12px */
var(--font-size-sm)    /* 14px */
var(--font-size-md)    /* 16px */
var(--font-size-lg)    /* 18px */
var(--font-size-xl)    /* 20px */
```

---

## Viewing Your Changes

1. After Claude Code creates or modifies files, the Storybook dev server automatically reloads
2. Check your browser - the new component/page should appear in the sidebar
3. If it doesn't appear, refresh the browser

---

## Example Prompts for Claude Code

### Creating a Dashboard Mock Page
```
Create a mock page called "AnalyticsDashboard" in packages/ui-kit/mock-pages that shows:
- A top nav bar with logo and user menu
- A stats summary row with 4 metric cards
- A main chart area
- A recent activity sidebar

Read and follow packages/ui-kit/mock-pages/MOCK_GUIDE.md.
Read and follow packages/ui-kit/core/TOKEN_GUIDE.md for tokens.
Use Stack, Card, Text, and Badge components from @ui-kit/react.
```

### Creating an Interactive Component
```
Create a "RatingStars" component in packages/ui-kit/react that:
- Shows 5 stars
- Allows clicking to set a rating
- Has a read-only mode
- Uses the primary color for filled stars

Read and follow packages/ui-kit/react/COMPONENT_GUIDE.md.
Create a Storybook story with interactive controls.
```

### Iterating on a Design
```
In the TaskDashboard mock page at packages/ui-kit/mock-pages/src/TaskDashboard.stories.tsx:
- Make the sidebar narrower (200px instead of 250px)
- Add hover states to the navigation items using --soft-bg-hover
- Change the task cards to use a 3-column grid on large screens
```

---

## Saving Your Work

Your changes are saved locally as you work. When you're ready to share them:

**Option 1: Ask a developer for help**
- Let them know you have changes ready
- They'll review, commit, and push for you

**Option 2: Use Claude Code to commit**
Ask Claude Code:
```
Show me what files I've changed, then commit them with a message describing what I created.
```

**Getting the latest changes from others:**
```bash
git pull
pnpm install
```

---

## Troubleshooting

### Dev server won't start
- Make sure you're in the correct directory
- Try running `pnpm install` first

### Changes don't appear in Storybook
- Check the terminal for errors (red text)
- Try refreshing the browser
- Make sure you saved the file (Ctrl+S / Cmd+S)

### Claude Code made an error
- Share the error message with Claude Code
- Ask it to fix the issue
- Reference the appropriate guide for correct patterns

---

## Quick Reference Commands

| What | Command |
|------|---------|
| Start mock pages dev server | `cd packages/ui-kit/mock-pages && pnpm dev` |
| Start components dev server | `cd packages/ui-kit/react && pnpm dev` |
| View icons | `cd packages/ui-kit/icons-stories && pnpm dev` |
| Stop the server | Press `Ctrl+C` in terminal |
| Install dependencies | `pnpm install` (run from project root) |
