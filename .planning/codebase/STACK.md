# Technology Stack

**Analysis Date:** 2026-01-19

**Scope:** `/apps/ideate/` and `/packages/ui-kit/`

## Languages

**Primary:**
- TypeScript 5.8.x - All application and library code
- Target: ES2022 for both client and server

**Secondary:**
- CSS Modules - Component styling with camelCase convention
- Markdown - Persona definitions, prompts, documentation

## Runtime

**Environment:**
- Node.js 22.x (current environment: v22.17.0)
- ES Modules throughout (`"type": "module"` in all package.json files)

**Package Manager:**
- pnpm 9.0.0
- Lockfile: `pnpm-lock.yaml` (lockfileVersion 9.0)
- Workspaces: pnpm workspaces for monorepo management

## Frameworks

### Ideate Client (`/apps/ideate/client/`)

**Core:**
- React 19.1.0 - UI framework
- Vite 6.0.0 - Build tool and dev server (port 5190)
- `@ui-kit/router` (workspace) - Lightweight client-side routing

**State Management:**
- React Context API - Hierarchical provider pattern (no Redux/Zustand)
- Yjs 13.6.28 - Real-time collaborative data structures
- y-websocket 3.0.0 - WebSocket sync for Yjs
- y-indexeddb 9.0.12 - Offline persistence

**Editor:**
- CodeMirror 6.x (`@codemirror/state`, `@codemirror/view`) - Code editing
- y-codemirror.next 0.3.5 - Yjs bindings for CodeMirror

**Validation:**
- Zod 3.25.x - Runtime schema validation

### Ideate Server (`/apps/ideate/server/`)

**Core:**
- Express 5.1.0 - HTTP server framework
- ws 8.18.0 - WebSocket server

**Real-time Collaboration:**
- Yjs 13.6.28 - CRDT for document sync
- y-protocols 1.0.7 - Sync and awareness protocols
- lib0 0.2.115 - Encoding/decoding utilities

**AI Integration:**
- `@anthropic-ai/claude-agent-sdk` 0.1.76 - Claude AI agent integration
- `@anthropic-ai/claude-code` - Claude Code SDK (some services)

**Discovery:**
- bonjour-service 1.2.1 - mDNS service discovery for LAN

**Validation:**
- Zod 4.2.1 - Server-side schema validation (note: different major version from client)

### UI-Kit Packages (`/packages/ui-kit/`)

**Core (`/packages/ui-kit/core/`):**
- Framework-agnostic design tokens and themes
- esbuild 0.20.0 - Build tool for token compilation
- Vite plugin for theme integration

**React (`/packages/ui-kit/react/`):**
- React 18/19 compatible component library
- Storybook 10.1.0 - Component documentation/development
- vite-plugin-dts - TypeScript declaration generation
- vite-plugin-lib-inject-css - CSS injection for library builds

**Icons (`/packages/ui-kit/icons/`):**
- SVG-based icon system
- Outputs: React components, SVG sprite, WOFF2 font, PNG exports
- Build tools: sharp, svgo, svgicons2svgfont, svg2ttf, ttf2woff2

**React-Chat (`/packages/ui-kit/react-chat/`):**
- Tiptap 2.10.0 - Rich text editor framework
- `@tanstack/react-virtual` 3.11.2 - Virtualized lists
- tiptap-markdown 0.8.10 - Markdown support

**React-Markdown (`/packages/ui-kit/react-markdown/`):**
- react-markdown 9.0.0 - Markdown rendering
- remark-gfm 4.0.0 - GitHub Flavored Markdown
- rehype-raw 7.0.0 - Raw HTML support
- Prism.js 1.29.0 / lowlight 3.1.0 - Syntax highlighting
- Tiptap 2.10.0 - WYSIWYG markdown editing

**Router (`/packages/ui-kit/router/`):**
- Lightweight custom router (React 18/19 compatible)
- No external routing dependencies

**React-Pickers (`/packages/ui-kit/react-pickers/`):**
- File/folder picker components
- Depends on core, react, icons packages

### Testing Frameworks

**Unit Testing:**
- Vitest 3.2.4 - Test runner (Vite-native)
- jsdom 27.3.0 - DOM environment
- `@testing-library/react` 14.0.0 - React testing utilities
- `@testing-library/jest-dom` 6.6.3 - DOM matchers
- `@testing-library/user-event` 14.5.2 - User interaction simulation

**E2E Testing:**
- Playwright 1.53.2 - Browser automation

### Build/Dev Tools

**Monorepo:**
- Lage 2.7.9 - Task orchestration
- pnpm workspaces - Package management

**Code Quality:**
- ESLint 9.29.0 - Linting
- typescript-eslint 8.34.1 - TypeScript ESLint integration
- eslint-plugin-react-hooks 5.2.0 - React hooks linting
- eslint-plugin-react-refresh 0.4.20 - Fast refresh linting

**Development:**
- tsx 4.20.3 - TypeScript execution for Node.js
- concurrently 8.2.0 - Parallel command execution

## Key Dependencies

**Critical (Ideate App):**
- `@anthropic-ai/claude-agent-sdk` - AI agent functionality, core to app purpose
- `yjs` - Real-time collaboration foundation
- `express` - HTTP API server
- `ws` - WebSocket communication

**Critical (UI-Kit):**
- `@ui-kit/core` - Design token foundation, used by all UI packages
- `react` - UI framework (peer dependency)

**Infrastructure:**
- `uuid` 11.1.0 - ID generation
- `dotenv` 17.0.1 - Environment configuration
- `cors` 2.8.5 - CORS middleware

## Configuration

**Environment:**
- `dotenv` loads from `.env` files (none committed to repo)
- `PORT` env var for server (default: 3002)
- `HOSTNAME` env var for service discovery

**Build Configuration:**
- `tsconfig.json` - TypeScript configuration per package
- `vite.config.ts` - Vite build and dev server config
- `eslint.config.js` - ESLint flat config (ESLint 9.x style)

**Key Client Config (`/apps/ideate/client/vite.config.ts`):**
```typescript
// Dev server
server: {
  port: 5190,
  proxy: { '/api': 'http://localhost:3002' }
}

// CSS modules
css: { modules: { localsConvention: 'camelCase' } }

// Path aliases for workspace packages
resolve: {
  alias: {
    '@ui-kit/react': '../../../packages/ui-kit/react/src',
    // ... other ui-kit packages
  }
}
```

**TypeScript Settings (Common):**
```json
{
  "target": "ES2022",
  "module": "ESNext",
  "moduleResolution": "bundler",
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true
}
```

## Platform Requirements

**Development:**
- Node.js 22.x
- pnpm 9.x
- macOS/Linux (Darwin 25.2.0 confirmed)

**Production:**
- Node.js runtime for server
- Static file hosting for client (Vite build output)
- File system access for workspace storage (`~/Ideate/workspaces/`)

## Package Relationships

```
@ideate/client
├── @ui-kit/core (design tokens)
├── @ui-kit/icons (icon components)
├── @ui-kit/react (base components)
├── @ui-kit/react-chat (chat UI)
├── @ui-kit/react-markdown (markdown rendering)
├── @ui-kit/react-pickers (file pickers)
├── @ui-kit/router (routing)
└── @claude-flow/data-bus (pub/sub)

@ideate/server
├── @anthropic-ai/claude-agent-sdk (AI)
└── @claude-flow/data-bus (pub/sub)

@ui-kit/react
├── @ui-kit/core
└── @ui-kit/icons

@ui-kit/react-chat
├── @ui-kit/core
├── @ui-kit/icons
├── @ui-kit/react
└── @ui-kit/react-markdown

@ui-kit/react-markdown
├── @ui-kit/core
└── @ui-kit/react
```

---

*Stack analysis: 2026-01-19*
