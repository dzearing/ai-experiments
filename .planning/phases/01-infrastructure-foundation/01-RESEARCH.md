# Phase 1: Infrastructure Foundation - Research

**Researched:** 2026-01-19
**Domain:** Server infrastructure, React SPA, real-time communication
**Confidence:** HIGH

## Summary

This phase establishes the foundational infrastructure for the Claude Code Web application. The primary components are:
1. An Express v5 TypeScript server with Claude Agent SDK integration
2. A React 19 SPA frontend using Vite and existing ui-kit packages
3. Real-time communication via SSE (primary) with WebSocket option for bidirectional needs

The existing codebase provides strong patterns to follow. The apps/v1/ application already implements Express + Claude SDK + SSE patterns. The ui-kit packages provide tested React components ready for integration. The Agent SDK research (`.planning/research/AGENT_SDK.md`) documents the complete SDK API surface.

**Primary recommendation:** Follow apps/v1 patterns for server architecture while upgrading to TypeScript and the official `@anthropic-ai/claude-agent-sdk` package. Use ui-kit packages directly without duplicating component code.

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `express` | ^5.1.0 | HTTP server framework | Already used in v1, stable, well-documented |
| `@anthropic-ai/claude-agent-sdk` | ^0.2.12 | Claude AI agent integration | Official SDK, replaces `@instantlyeasy/claude-code-sdk-ts` |
| `react` | ^19.1.0 | UI framework | Already used throughout project |
| `vite` | ^7.0.0 | Build tool and dev server | Already used in v1 client |
| `typescript` | ~5.8.3 | Type safety | Already used throughout project |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `cors` | ^2.8.5 | CORS middleware | Cross-origin API requests from frontend |
| `dotenv` | ^17.0.1 | Environment configuration | Loading API keys and config |
| `uuid` | ^11.1.0 | ID generation | Session and message IDs |
| `@vitejs/plugin-react` | ^4.5.2 | React support for Vite | Development hot reload |

### UI-Kit Packages (workspace dependencies)

| Package | Purpose | Key Components |
|---------|---------|----------------|
| `@ui-kit/core` | Design tokens, themes | Bootstrap, surfaces, CSS variables |
| `@ui-kit/react` | Base components | Button, Card, Input, Dialog |
| `@ui-kit/react-chat` | Chat UI components | ChatMessage, ChatInput, virtualized lists |
| `@ui-kit/react-markdown` | Markdown rendering | react-markdown, syntax highlighting |
| `@ui-kit/icons` | Icon system | Per-icon imports (tree-shakeable) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Express | Fastify/Hono | Smaller/faster but v1 uses Express, consistency wins |
| SSE | WebSocket only | SSE simpler for streaming, add WS later for bidirectional |
| Custom UI | Shadcn/Radix | ui-kit already exists and is themed |

**Installation:**
```bash
# Server dependencies
cd apps/claude-code-web/server
pnpm add express@^5.1.0 cors@^2.8.5 dotenv@^17.0.1 uuid@^11.1.0 @anthropic-ai/claude-agent-sdk@^0.2.12

# Server dev dependencies
pnpm add -D @types/node@^24.0.0 @types/express@^5.0.0 @types/cors@^2.8.0 @types/uuid@^10.0.0 typescript@~5.8.3 tsx@^4.20.3

# Client dependencies (in addition to workspace packages)
pnpm add react@^19.1.0 react-dom@^19.1.0

# Client dev dependencies
pnpm add -D @types/react@^19.1.8 @types/react-dom@^19.1.6 @vitejs/plugin-react@^4.5.2 typescript@~5.8.3 vite@^7.0.0
```

## Architecture Patterns

### Recommended Project Structure

```
apps/claude-code-web/
├── client/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts
│   └── src/
│       ├── main.tsx                    # Entry point
│       ├── App.tsx                     # Root component
│       ├── components/
│       │   └── ChatView.tsx            # Initial chat UI shell
│       ├── hooks/
│       │   └── useAgentStream.ts       # SSE hook
│       ├── contexts/
│       │   └── AgentContext.tsx        # Agent state management
│       ├── types/
│       │   └── sdk.ts                  # SDK message type imports
│       └── styles/
│           └── App.module.css
│
└── server/
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── index.ts                    # Express app entry
        ├── routes/
        │   ├── health.ts               # Health check
        │   └── agent.ts                # Agent API routes
        ├── services/
        │   └── agentService.ts         # Agent SDK wrapper
        ├── middleware/
        │   └── errorHandler.ts
        └── types/
            └── index.ts
```

### Pattern 1: SSE Streaming Endpoint

**What:** Server-Sent Events endpoint that forwards Agent SDK messages to client
**When to use:** For streaming responses from Claude to the browser
**Example:**
```typescript
// Source: apps/v1/server/index.js SSE pattern adapted to TypeScript
import type { Request, Response } from 'express';
import { query } from '@anthropic-ai/claude-agent-sdk';

export async function handleAgentStream(req: Request, res: Response): Promise<void> {
  const { prompt, sessionId } = req.query as { prompt: string; sessionId?: string };

  // SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  try {
    for await (const message of query({
      prompt,
      options: {
        resume: sessionId,
        includePartialMessages: true
      }
    })) {
      res.write(`data: ${JSON.stringify(message)}\n\n`);
    }
  } catch (error) {
    res.write(`data: ${JSON.stringify({ type: 'error', error: String(error) })}\n\n`);
  } finally {
    res.end();
  }
}
```

### Pattern 2: Client SSE Consumer Hook

**What:** React hook that consumes SSE stream and manages state
**When to use:** In chat components to receive streaming messages
**Example:**
```typescript
// Source: .planning/research/AGENT_SDK.md streaming example
import { useState, useCallback } from 'react';
import type { SDKMessage } from '@anthropic-ai/claude-agent-sdk';

interface UseAgentStreamReturn {
  messages: SDKMessage[];
  isStreaming: boolean;
  startStream: (prompt: string) => void;
  error: string | null;
}

export function useAgentStream(): UseAgentStreamReturn {
  const [messages, setMessages] = useState<SDKMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startStream = useCallback((prompt: string) => {
    setIsStreaming(true);
    setError(null);

    const eventSource = new EventSource(
      `/api/agent/stream?prompt=${encodeURIComponent(prompt)}`
    );

    eventSource.onmessage = (event) => {
      const message = JSON.parse(event.data) as SDKMessage;
      setMessages(prev => [...prev, message]);

      if (message.type === 'result') {
        eventSource.close();
        setIsStreaming(false);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      setIsStreaming(false);
      setError('Connection lost');
    };
  }, []);

  return { messages, isStreaming, startStream, error };
}
```

### Pattern 3: Agent SDK Initialization

**What:** Proper Agent SDK setup with error handling
**When to use:** Server startup and agent service initialization
**Example:**
```typescript
// Source: .planning/research/AGENT_SDK.md API reference
import { query } from '@anthropic-ai/claude-agent-sdk';
import type { SDKMessage, Options } from '@anthropic-ai/claude-agent-sdk';

export interface AgentQueryOptions {
  prompt: string;
  sessionId?: string;
  cwd?: string;
}

export async function* queryAgent(
  options: AgentQueryOptions
): AsyncGenerator<SDKMessage> {
  const queryOptions: Options = {
    resume: options.sessionId,
    cwd: options.cwd || process.cwd(),
    includePartialMessages: true,
    tools: { type: 'preset', preset: 'claude_code' },
    systemPrompt: { type: 'preset', preset: 'claude_code' }
  };

  try {
    for await (const message of query({
      prompt: options.prompt,
      options: queryOptions
    })) {
      yield message;
    }
  } catch (error) {
    yield {
      type: 'result',
      subtype: 'error_during_execution',
      is_error: true,
      result: String(error),
      errors: [String(error)]
    } as SDKMessage;
  }
}
```

### Anti-Patterns to Avoid

- **Running Agent SDK in browser:** The SDK spawns Claude Code CLI subprocess - server-side only
- **Polling instead of streaming:** Use SSE/WebSocket, not repeated fetch calls
- **Blocking the event loop:** Use async generators, don't buffer entire responses
- **Ignoring partial messages:** Enable `includePartialMessages: true` for real-time streaming UX
- **Hardcoded paths:** Use `cwd` option or `process.cwd()`, not hardcoded directories

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SSE parsing | Custom parser | Native EventSource | Browser API, handles reconnection |
| Message streaming | Buffer & send | Agent SDK async generator | Already handles chunking correctly |
| Component styling | Custom tokens | @ui-kit/core design tokens | Consistency with rest of project |
| Chat UI | Custom components | @ui-kit/react-chat | Already built and tested |
| Markdown rendering | Custom parser | @ui-kit/react-markdown | Includes syntax highlighting |
| Icon management | SVG imports | @ui-kit/icons | Tree-shakeable, themed |

**Key insight:** The monorepo already has solutions for most UI needs. Focus Phase 1 on infrastructure wiring, not component development.

## Common Pitfalls

### Pitfall 1: Agent SDK Process Management

**What goes wrong:** Server crashes when Claude Code CLI isn't available or authenticated
**Why it happens:** SDK spawns subprocess that may not be installed or logged in
**How to avoid:** Check availability at startup, provide clear error messages
**Warning signs:** `ENOENT` errors, "command not found", authentication errors

```typescript
// Check at server startup
import { execSync } from 'child_process';

function checkClaudeAvailable(): boolean {
  try {
    execSync('which claude', { encoding: 'utf8' });
    return true;
  } catch {
    console.error('Claude CLI not found. Install with: npm install -g @anthropic-ai/claude-code');
    return false;
  }
}
```

### Pitfall 2: SSE Connection Management

**What goes wrong:** Memory leaks from abandoned connections, zombie event sources
**Why it happens:** Client disconnects without cleanup, no heartbeat
**How to avoid:** Heartbeat pings, cleanup on `req.close`, client-side EventSource cleanup
**Warning signs:** Growing memory usage, connections lingering after tab close

```typescript
// Server: heartbeat and cleanup
const heartbeat = setInterval(() => {
  try {
    res.write(':heartbeat\n\n');
  } catch {
    clearInterval(heartbeat);
  }
}, 30000);

req.on('close', () => {
  clearInterval(heartbeat);
  // Clean up any agent query in progress
});
```

### Pitfall 3: TypeScript Module Configuration

**What goes wrong:** ESM/CJS conflicts, import errors
**Why it happens:** Mixed module systems in Node.js, incorrect tsconfig
**How to avoid:** Use consistent ESM throughout, proper tsconfig settings
**Warning signs:** `ERR_REQUIRE_ESM`, `Cannot find module`, `Unexpected token 'export'`

```json
// Server tsconfig.json critical settings
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "target": "ES2022",
    "esModuleInterop": true
  }
}

// package.json
{
  "type": "module"
}
```

### Pitfall 4: Workspace Package Resolution

**What goes wrong:** Can't find @ui-kit/* packages, build fails
**Why it happens:** Workspace packages not built, incorrect dependency declaration
**How to avoid:** Build dependencies first, use `workspace:*` protocol
**Warning signs:** `Cannot find module '@ui-kit/react'`, missing dist folders

```json
// package.json dependency declaration
{
  "dependencies": {
    "@ui-kit/core": "workspace:*",
    "@ui-kit/react": "workspace:*",
    "@ui-kit/react-chat": "workspace:*"
  }
}
```

## Code Examples

Verified patterns from official sources:

### Express v5 with TypeScript

```typescript
// Source: Express 5 documentation + existing v1 patterns
import express, { type Express, type Request, type Response } from 'express';
import cors from 'cors';
import { router as healthRouter } from './routes/health.js';
import { router as agentRouter } from './routes/agent.js';

const app: Express = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/health', healthRouter);
app.use('/api/agent', agentRouter);

// Error handling (Express 5 supports async errors natively)
app.use((err: Error, req: Request, res: Response) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Health Check Endpoint

```typescript
// Source: Standard practice + v1 pattern
import { Router } from 'express';

export const router = Router();

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.0.1'
  });
});
```

### Vite Config with UI-Kit Integration

```typescript
// Source: v1 client vite.config.ts + ui-kit core docs
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { uikitVitePlugin } from '@ui-kit/core/vite';

export default defineConfig({
  plugins: [
    react(),
    uikitVitePlugin()
  ],
  server: {
    port: 5174,
    proxy: {
      '/api': 'http://localhost:3002'
    }
  }
});
```

### React App Entry with UI-Kit Bootstrap

```typescript
// Source: ui-kit core bootstrap pattern
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from '@ui-kit/core/bootstrap.js';
import { App } from './App';

// Initialize theme before rendering
initializeTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@instantlyeasy/claude-code-sdk-ts` | `@anthropic-ai/claude-agent-sdk` | 2025 | Official SDK with full type support |
| Express 4 | Express 5 | 2024 | Native async error handling |
| CJS modules | ESM modules | 2024 | Better tree-shaking, native Node support |
| polling for updates | SSE streaming | N/A | Real-time UX, lower latency |

**Deprecated/outdated:**
- `@instantlyeasy/claude-code-sdk-ts`: Third-party wrapper, use official SDK instead
- `require()` syntax: Use ES imports for consistency
- Express 4 error middleware: Express 5 handles async errors automatically

## Open Questions

Things that couldn't be fully resolved:

1. **UI-Kit Core Vite Plugin**
   - What we know: `@ui-kit/core` has a `/vite` export for build integration
   - What's unclear: Exact configuration options and whether it's required or optional
   - Recommendation: Start without it, add if theme loading issues occur

2. **Agent SDK Working Directory**
   - What we know: SDK requires `cwd` option for file operations
   - What's unclear: Best practice for multi-workspace support
   - Recommendation: Use single hardcoded directory for Phase 1, parameterize later

3. **WebSocket vs SSE for Permissions**
   - What we know: SSE is unidirectional; permissions need user response
   - What's unclear: Whether to add WS now or use separate REST endpoint for responses
   - Recommendation: Use REST endpoint for permission responses in Phase 1, add WS in Phase 4

## Sources

### Primary (HIGH confidence)
- `.planning/research/AGENT_SDK.md` - Complete SDK API documentation
- `.planning/codebase/STACK.md` - Technology stack analysis
- `.planning/codebase/CONVENTIONS.md` - Coding conventions
- `apps/v1/server/index.js` - Existing Express + SSE implementation
- `apps/v1/client/package.json` - React + Vite dependencies
- `packages/ui-kit/*/package.json` - UI-Kit package configurations

### Secondary (MEDIUM confidence)
- Express 5 release notes - async error handling changes
- Vite 7 documentation - configuration patterns

### Tertiary (LOW confidence)
- None - all findings verified with existing codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - verified against existing monorepo packages
- Architecture: HIGH - patterns from working v1 implementation
- Pitfalls: HIGH - observed in v1 codebase and SDK documentation

**Research date:** 2026-01-19
**Valid until:** 2026-02-19 (stable stack, 30 days)
