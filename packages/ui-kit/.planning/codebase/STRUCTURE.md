# Codebase Structure

**Analysis Date:** 2026-01-17

## Directory Layout

```
packages/ui-kit/
├── core/                    # Framework-agnostic design system core
│   ├── scripts/             # Build scripts (TypeScript)
│   ├── src/
│   │   ├── build/           # Build utilities (inline bootstrap generator)
│   │   ├── colors/          # Color manipulation utilities
│   │   ├── dev/             # Development utilities (theme switcher)
│   │   ├── runtime/         # Browser bootstrap for theme loading
│   │   ├── surfaces/        # Surface type definitions and helpers
│   │   ├── themes/          # Theme generator and definitions
│   │   │   ├── definitions/ # Theme JSON files (default.json, etc.)
│   │   │   └── schema/      # theme-rules.json - derivation rules
│   │   ├── tokens/          # Static token definitions
│   │   └── vite/            # Vite plugin for zero-flash themes
│   └── dist/                # Compiled output
├── icons/                   # Icon library
│   ├── scripts/             # Generation scripts (components, sprite, font)
│   └── src/
│       ├── components/      # Generated React icon components
│       ├── svgs/            # Source SVG files
│       └── utils/           # createIcon factory
├── icons-stories/           # Storybook for icon catalog
├── react/                   # Base React component library
│   ├── .storybook/          # Storybook config
│   └── src/
│       ├── components/      # 60+ components (Button, Modal, etc.)
│       ├── context/         # ThemeProvider
│       └── hooks/           # Shared hooks (useFocusTrap, etc.)
├── react-chat/              # Chat-specific components
│   ├── .storybook/
│   └── src/
│       ├── components/      # ChatInput, ChatPanel, ChatMessage, etc.
│       └── hooks/           # Chat-specific hooks
├── react-markdown/          # Markdown components
│   ├── .storybook/
│   └── src/
│       ├── components/      # MarkdownRenderer, MarkdownEditor, etc.
│       ├── hooks/           # useStreamingMarkdown, useDeepLink
│       ├── types/           # TypeScript types
│       └── utils/           # Syntax highlighter, deep link parser
├── react-pickers/           # File/folder picker components
│   ├── .storybook/
│   └── src/
│       ├── components/      # ItemPicker, ItemPickerDialog
│       └── providers/       # File system providers
├── router/                  # Lightweight React router
│   └── src/                 # Router, Route, Link, hooks
├── mock-pages/              # Example pages (Storybook demos)
│   ├── .storybook/
│   └── src/examples/        # Full-page demo stories
├── website/                 # Documentation website
│   ├── public/themes/       # Theme CSS files
│   └── src/
│       ├── components/      # Site-specific components
│       ├── layouts/         # Page layouts
│       ├── pages/           # Route pages
│       └── styles/          # Global styles
└── .planning/               # Planning documents
    └── codebase/            # Architecture analysis
```

## Directory Purposes

**`core/`:**
- Purpose: Design system foundation - tokens, themes, surfaces, bootstrap
- Contains: TypeScript source, build scripts, theme definitions
- Key files: `src/index.ts`, `src/themes/generator.ts`, `src/runtime/bootstrap.ts`

**`icons/`:**
- Purpose: SVG icon library with multiple output formats
- Contains: Source SVGs, generated React components, sprite, font
- Key files: `src/utils/createIcon.tsx`, `scripts/generate-components.ts`

**`react/`:**
- Purpose: Primary component library for React applications
- Contains: 60+ reusable UI components with CSS Modules
- Key files: `src/index.ts`, `src/context/ThemeProvider.tsx`

**`react-chat/`:**
- Purpose: Chat interface components for AI/messaging applications
- Contains: ChatInput (with TipTap), ChatPanel, MessageQueue, ThinkingIndicator
- Key files: `src/index.ts`, `src/components/ChatInput/ChatInput.tsx`

**`react-markdown/`:**
- Purpose: Markdown rendering and editing with syntax highlighting
- Contains: MarkdownRenderer, MarkdownEditor (CodeMirror-based), MarkdownCoEditor
- Key files: `src/index.ts`, `src/utils/syntaxHighlighter.ts`

**`react-pickers/`:**
- Purpose: File and folder selection UI components
- Contains: ItemPicker, ItemPickerDialog, file system providers
- Key files: `src/index.ts`

**`router/`:**
- Purpose: Minimal client-side routing for React
- Contains: Router, Route, Link, useNavigate, useParams hooks
- Key files: `src/index.ts`, `src/Router.tsx`

**`mock-pages/`:**
- Purpose: Full-page demos and design explorations
- Contains: Storybook stories demonstrating complete UI flows
- Key files: `src/examples/*.stories.tsx`

**`website/`:**
- Purpose: Public documentation and reference site
- Contains: Learning content, token reference, theme designer
- Key files: `src/pages/`, `public/themes/`

## Key File Locations

**Entry Points:**
- `core/src/index.ts`: Main core exports
- `react/src/index.ts`: Main React component exports
- `icons/dist/*.js`: Individual icon exports (tree-shakeable)

**Configuration:**
- `*/package.json`: Package dependencies and scripts
- `*/.storybook/main.ts`: Storybook configuration
- `*/vite.config.ts`: Vite build configuration
- `*/tsconfig.json`: TypeScript configuration

**Core Logic:**
- `core/src/themes/generator.ts`: Theme token generation (1200+ lines)
- `core/src/themes/schema/theme-rules.json`: Color derivation rules
- `core/src/runtime/bootstrap.ts`: Zero-flash theme initialization
- `react/src/context/ThemeProvider.tsx`: React theme context

**Testing:**
- `react-chat/src/components/ChatInput/*.test.ts`: Unit tests
- `core/src/colors/dynamicSurface.test.ts`: Color utility tests

## Naming Conventions

**Files:**
- Components: `PascalCase.tsx` (e.g., `Button.tsx`, `ChatInput.tsx`)
- Styles: `ComponentName.module.css` (e.g., `Button.module.css`)
- Stories: `ComponentName.stories.tsx`
- Tests: `ComponentName.test.tsx` or `hook.test.ts`
- Index files: `index.ts` (barrel exports)

**Directories:**
- Component folders: `PascalCase/` (e.g., `Button/`, `ChatInput/`)
- Utility folders: `kebab-case/` or `camelCase/` (e.g., `utils/`, `hooks/`)

**Exports:**
- Components: Named exports, one component per file
- Types: Co-exported with component or from `types/` folder
- Icons: One file per icon, named export (e.g., `export { AddIcon }`)

## Where to Add New Code

**New React Component:**
- Implementation: `react/src/components/{ComponentName}/`
- Files needed:
  - `{ComponentName}.tsx` - Component implementation
  - `{ComponentName}.module.css` - Styles
  - `{ComponentName}.stories.tsx` - Storybook stories
  - `index.ts` - Barrel export
- Export from: `react/src/index.ts`

**New Chat Component:**
- Implementation: `react-chat/src/components/{ComponentName}/`
- Same file structure as base components
- Export from: `react-chat/src/index.ts`

**New Icon:**
- Add SVG: `icons/src/svgs/{icon-name}.svg`
- Run: `pnpm --filter @ui-kit/icons build` (generates component)
- Exports auto-generated in `icons/package.json`

**New Token Category:**
- Add file: `core/src/tokens/{category}.ts`
- Export from: `core/src/tokens/index.ts`
- Update generator if needed: `core/src/themes/generator.ts`

**New Theme:**
- Add definition: `core/src/themes/definitions/{theme-name}.json`
- Run: `pnpm --filter @ui-kit/core build:themes`
- Output: `core/dist/themes/{theme-name}-{light,dark}.css`

**New Hook:**
- Shared hooks: `react/src/hooks/{hookName}.ts`
- Domain hooks: `react-chat/src/hooks/` or `react-markdown/src/hooks/`
- Export from package index

**Utilities:**
- Core utilities: `core/src/{category}/`
- React utilities: Within component folder or `react/src/hooks/`
- Markdown utilities: `react-markdown/src/utils/`

## Special Directories

**`dist/`:**
- Purpose: Compiled output for each package
- Generated: Yes (by build scripts)
- Committed: No (in .gitignore)

**`.storybook/`:**
- Purpose: Storybook configuration per package
- Generated: No
- Committed: Yes

**`storybook-static/`:**
- Purpose: Built Storybook for deployment
- Generated: Yes (by `build:storybook`)
- Committed: No (in .gitignore)

**`node_modules/`:**
- Purpose: Dependencies
- Generated: Yes (by pnpm)
- Committed: No

**`.planning/`:**
- Purpose: Architecture and planning documentation
- Generated: No
- Committed: Yes (for AI/human collaboration)

---

*Structure analysis: 2026-01-17*
