# Technology Stack

**Analysis Date:** 2026-01-17

## Languages

**Primary:**
- TypeScript ^5.4.0 - All source code across all packages

**Secondary:**
- CSS (CSS Modules) - Component styling with `.module.css` convention

## Runtime

**Environment:**
- Node.js 20+ (implied by `@types/node: ^20.0.0`)
- Browser (ES2020/ES2022 targets)

**Package Manager:**
- pnpm (workspace:* protocol used for internal dependencies)
- Lockfile: Present at monorepo root

## Frameworks

**Core:**
- React ^18.0.0 || ^19.0.0 (peer dependency), ^19.1.0 (devDependency) - UI components
- Vite ^5.0.0 || ^6.0.0 - Build tool and dev server

**Testing:**
- Vitest ^3.2.4 - Unit testing
- Testing Library (React ^14.0.0, jest-dom ^6.6.3, user-event ^14.5.2) - Component testing
- jsdom ^27.3.0 - Browser environment simulation

**Build/Dev:**
- esbuild ^0.20.0 - Fast bundling (used by @ui-kit/core and @ui-kit/icons)
- tsx ^4.20.3 - TypeScript execution for build scripts
- vite-plugin-dts ^4.5.4 - TypeScript declaration generation
- vite-plugin-lib-inject-css ^2.2.2 - CSS injection for library builds
- Storybook ^10.1.0 - Component documentation and development

## Key Dependencies

**Critical (Core):**
- `@ui-kit/core` - Design tokens, themes, surfaces (framework-agnostic foundation)
- `@ui-kit/icons` - Icon library with React components, SVG sprites, WOFF2 fonts
- `@ui-kit/react` - 62 React components built on design tokens

**Rich Text Editing:**
- `@tiptap/core` ^2.10.0 - Rich text editor framework
- `@tiptap/react` ^2.10.0 - React bindings for TipTap
- `@tiptap/starter-kit` ^2.10.0 - Essential TipTap extensions
- `@tiptap/extension-link` ^2.10.0 - Link support
- `@tiptap/extension-placeholder` ^2.10.0 - Placeholder text
- `@tiptap/extension-underline` ^2.27.1 - Underline formatting
- `tiptap-markdown` ^0.8.10 - Markdown import/export

**Code Editing (CodeMirror 6):**
- `codemirror` ^6.0.2 - Code editor core
- `@codemirror/state` ^6.5.2 - Editor state management
- `@codemirror/view` ^6.39.0 - Editor view layer
- `@codemirror/commands` ^6.10.0 - Editing commands
- `@codemirror/lang-markdown` ^6.5.0 - Markdown language support
- `@codemirror/language-data` ^6.5.2 - Language modes
- `@codemirror/search` ^6.5.11 - Search functionality
- `@codemirror/collab` ^6.1.1 - Collaborative editing support

**Real-time Collaboration:**
- `yjs` ^13.6.28 - CRDT-based collaboration
- `y-codemirror.next` ^0.3.5 - Yjs binding for CodeMirror
- `y-indexeddb` ^9.0.12 - Persistent offline storage

**Markdown Rendering:**
- `react-markdown` ^9.0.0 - Markdown to React components
- `remark-gfm` ^4.0.0 - GitHub Flavored Markdown support
- `rehype-raw` ^7.0.0 - HTML in markdown support

**Syntax Highlighting:**
- `prismjs` ^1.29.0 - Syntax highlighting
- `lowlight` ^3.1.0 - Lowlight syntax highlighter (highlight.js core)
- `@tiptap/extension-code-block-lowlight` ^2.10.0 - TipTap code blocks

**Virtualization:**
- `@tanstack/react-virtual` ^3.11.2 - Virtual scrolling for large lists

**Icon Processing (Build):**
- `svgo` ^3.3.2 - SVG optimization
- `svgicons2svgfont` ^14.0.0 - SVG to font conversion
- `svg2ttf` ^6.0.3 - SVG font to TTF conversion
- `ttf2woff2` ^6.0.1 - TTF to WOFF2 conversion
- `sharp` ^0.33.5 - Image processing (PNG exports)

**Routing:**
- `react-router-dom` ^7.1.0 - Routing (website only)
- `@ui-kit/router` - Custom lightweight router package

**Utilities:**
- `github-slugger` ^2.0.0 - URL-safe slugs for headings

## Configuration

**TypeScript:**
- Target: ES2020 (core), ES2022 (react, other packages)
- Module: ESNext with bundler resolution
- Strict mode enabled
- JSX: react-jsx (automatic runtime)
- Declaration maps enabled for debugging
- Files: `tsconfig.json` per package

**Vite:**
- Library mode builds with ES format
- React plugin (`@vitejs/plugin-react`)
- CSS Modules with camelCase convention
- Sourcemaps enabled
- External: react, react-dom, react/jsx-runtime
- Files: `vite.config.ts` per buildable package

**Storybook:**
- Version: ^10.1.0
- Framework: `@storybook/react-vite`
- Addons: `@storybook/addon-docs`
- Auto-docs via tags
- Per-package Storybook instances (ports 6007, 6009, 6033, 6034)
- Files: `.storybook/main.ts`, `.storybook/preview.tsx`, `.storybook/preview.css`

**Vitest:**
- Environment: jsdom
- Globals enabled
- Setup files: `src/test-setup.ts`
- Include pattern: `src/**/*.test.{ts,tsx}`

## Platform Requirements

**Development:**
- Node.js 20+
- pnpm 8+ (workspace protocol support)
- Storybook dev server for component development

**Production:**
- Browser: ES2020+ support required
- React 18.x or 19.x as peer dependency

## Build Outputs

**@ui-kit/core:**
- `dist/index.js` - Main entry (tokens, surfaces, themes, colors, runtime)
- `dist/runtime/bootstrap.js` - Theme bootstrap
- `dist/bootstrap.min.js` - IIFE bootstrap for inline usage
- `dist/themes/*.css` - Pre-built theme CSS files
- `dist/vite/index.js` - Vite plugin for zero-flash theme loading

**@ui-kit/icons:**
- `dist/*.js` - Individual icon React components (no barrel export)
- `dist/sprite/sprite.svg` - SVG sprite sheet
- `dist/font/icons.woff2` - Icon font
- `dist/font/icons.css` - Icon font CSS
- `dist/metadata/icons.json` - Icon metadata
- Total: ~113 icons (226 files including .json metadata)

**@ui-kit/react:**
- `dist/index.js` - Barrel export of 62 components
- CSS Modules bundled with components

**Other Packages:**
- `@ui-kit/react-chat` - Chat UI components (ChatInput, ChatMessage, ChatPanel)
- `@ui-kit/react-markdown` - Markdown renderer and editor
- `@ui-kit/react-pickers` - File/folder picker components
- `@ui-kit/router` - Lightweight React router
- `@ui-kit/mock-pages` - Storybook demos only (not published)
- `@ui-kit/icons-stories` - Icon Storybook only (not published)
- `@ui-kit/website` - Documentation website

---

*Stack analysis: 2026-01-17*
