# External Integrations

**Analysis Date:** 2026-01-17

## APIs & External Services

**None Detected:**
- This is a UI component library with no direct external API dependencies
- All components are designed to be data-agnostic
- Consumers provide data through props and callbacks

## Data Storage

**Databases:**
- None - UI component library only

**File Storage:**
- Local filesystem only (for icon/font generation during build)

**Caching:**
- Browser localStorage - Theme preference persistence (`uikit-theme` key)
- IndexedDB - Optional via `y-indexeddb` for collaborative editing persistence
- No server-side caching

## Authentication & Identity

**Auth Provider:**
- None - UI library does not handle authentication
- Auth UI components (login forms, etc.) not included

## Monitoring & Observability

**Error Tracking:**
- None integrated

**Logs:**
- Console logging during development only
- Build scripts log to stdout

## CI/CD & Deployment

**Hosting:**
- Not applicable (library package)
- Website package (`@ui-kit/website`) is a Vite SPA

**CI Pipeline:**
- Not detected in this package
- Build validation: `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`

## Environment Configuration

**Required env vars:**
- None

**Build-time Configuration:**
- `vite.config.ts` per package
- `tsconfig.json` per package
- `.storybook/main.ts` for Storybook configuration

**Runtime Configuration:**
- Theme configuration via Vite plugin options:
  ```typescript
  uikit({
    themesPath: '/themes',      // Where theme CSS is served
    defaultTheme: 'default',    // Default theme name
    defaultBg: { light: '#fafafa', dark: '#0f0f0f' },
    copyThemes: true,           // Auto-copy theme CSS to public/
  })
  ```

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## Browser APIs Used

**Storage:**
- `localStorage` - Theme preference (`uikit-theme`)
- `IndexedDB` - Optional collaborative editing persistence via y-indexeddb

**Media:**
- `window.matchMedia('(prefers-color-scheme: dark)')` - System theme detection

**DOM:**
- `MutationObserver` - Some components observe DOM changes
- `ResizeObserver` - Layout components (SplitPane, Sizer)
- `IntersectionObserver` - Virtual scrolling

**Events:**
- `popstate` - Router navigation
- `hashchange` - Deep link navigation
- Keyboard/mouse events for all interactive components

## Internal Package Dependencies

**Dependency Graph:**
```
@ui-kit/core (foundation - no dependencies)
    ↓
@ui-kit/icons (depends on: core)
    ↓
@ui-kit/react (depends on: core, icons)
    ↓
├── @ui-kit/react-markdown (depends on: core, react)
├── @ui-kit/react-pickers (depends on: core, react, icons)
└── @ui-kit/react-chat (depends on: core, react, icons, react-markdown)

@ui-kit/router (standalone - peer depends on react)

@ui-kit/website (depends on: core, icons, react)
@ui-kit/mock-pages (depends on: core, icons, react, react-chat, react-markdown)
@ui-kit/icons-stories (depends on: core, icons, react)
```

**Workspace Protocol:**
- All internal dependencies use `workspace:*` for automatic version linking

## Third-Party Library Integrations

**TipTap (Rich Text Editor):**
- Location: `@ui-kit/react-chat`, `@ui-kit/react-markdown`
- Usage: ChatInput component, MarkdownEditor (TipTap mode)
- Custom extensions:
  - `react-chat/src/components/ChatInput/ImageChipExtension.ts`
  - `react-chat/src/components/ChatInput/TopicChipExtension.ts`
  - `react-chat/src/components/ChatInput/CodeExtension.ts`

**CodeMirror 6 (Code Editor):**
- Location: `@ui-kit/react-markdown`
- Usage: MarkdownEditor (plain text mode), MarkdownCoEditor
- Custom extensions:
  - `react-markdown/src/components/MarkdownEditor/extensions/theme.ts`
  - `react-markdown/src/components/MarkdownEditor/extensions/folding.ts`
  - `react-markdown/src/components/MarkdownEditor/extensions/search.ts`
- Collaborative: Yjs integration via y-codemirror.next

**Yjs (CRDT Collaboration):**
- Location: `@ui-kit/react-markdown`
- Usage: Real-time collaborative markdown editing
- Persistence: Optional via y-indexeddb
- Binding: y-codemirror.next for CodeMirror integration

**react-markdown + Prism.js (Rendering):**
- Location: `@ui-kit/react-markdown`
- Usage: MarkdownRenderer component
- Plugins: remark-gfm (GFM), rehype-raw (HTML passthrough)

**TanStack Virtual:**
- Location: `@ui-kit/react-chat`
- Usage: VirtualizedChatPanel for efficient message list rendering

## Vite Plugin Integration

**@ui-kit/core/vite:**
- Zero-flash theme loading plugin
- Features:
  - Injects inline bootstrap script into HTML
  - Copies theme CSS files to public directory
  - Auto-detects system light/dark preference
  - Persists user theme preferences
- File: `core/src/vite/plugin.ts`

**Usage:**
```typescript
// vite.config.ts
import { uikit } from '@ui-kit/core/vite';

export default defineConfig({
  plugins: [
    react(),
    uikit({
      defaultTheme: 'github',
      themesPath: '/assets/themes',
    }),
  ],
});
```

## Asset Generation Pipeline

**Icons Build (build-time only):**
1. Source: SVG files in `icons/src/svgs/`
2. Process:
   - svgo optimization
   - React component generation
   - SVG sprite generation
   - Font generation (svgicons2svgfont → svg2ttf → ttf2woff2)
   - Metadata generation (JSON search index)
3. Tools: esbuild, vite, tsx scripts

**Themes Build (build-time only):**
1. Source: Theme definitions in `core/src/themes/definitions/`
2. Process:
   - Token resolution
   - CSS variable generation
   - Light/dark mode variants
3. Output: `core/dist/themes/*.css`

---

*Integration audit: 2026-01-17*
