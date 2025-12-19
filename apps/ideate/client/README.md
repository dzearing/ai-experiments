# Ideate Client

React 19 frontend for the Ideate collaborative platform.

## Architecture Overview

The client is a single-page application built with React 19, Vite, and TypeScript. It uses the shared `@ui-kit/react` component library and follows a context-based state management pattern.

## Technology Stack

- **React 19** - UI framework with concurrent features
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router v7** - Client-side routing
- **@ui-kit/react** - Shared component library
- **@ui-kit/react-markdown** - Collaborative markdown editor
- **CSS Modules** - Scoped styling

## Project Structure

```
src/
├── main.tsx                 # Application entry point
├── App.tsx                  # Root component with routing
├── components/
│   └── AppLayout/
│       ├── AppLayout.tsx    # Authenticated page layout
│       └── AppLayout.module.css
├── contexts/
│   ├── AuthContext.tsx      # Authentication state
│   ├── DocumentContext.tsx  # Document CRUD operations
│   └── NetworkContext.tsx   # Local network discovery
└── pages/
    ├── Landing.tsx          # Landing page (unauthenticated)
    ├── Auth.tsx             # Sign-in page
    ├── Dashboard.tsx        # User's document dashboard
    ├── DocumentEditor.tsx   # Collaborative document editing
    └── Settings.tsx         # User settings
```

## Context Providers

The application uses a hierarchical context structure:

```
AuthProvider
└── DocumentProvider
    └── NetworkProvider
        └── Routes
```

### AuthContext

Manages user authentication state.

```typescript
interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (nickname: string) => Promise<void>;
  signOut: () => Promise<void>;
}
```

**Current Implementation:**
- Simple nickname-based authentication (stored in localStorage)
- Generates avatar via DiceBear API
- Creates unique user ID from nickname + timestamp

**Future:**
- Google OAuth integration
- Session token management
- Server-side authentication

### DocumentContext

Handles document CRUD operations and local state.

```typescript
interface DocumentContextValue {
  documents: DocumentMetadata[];
  isLoading: boolean;
  error: string | null;
  fetchDocuments: () => Promise<void>;
  createDocument: (title: string) => Promise<Document>;
  getDocument: (id: string) => Promise<Document | null>;
  updateDocument: (id: string, updates: Partial<Document>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
}
```

**Current Implementation:**
- Mock data for development
- Local state management

**Future:**
- REST API integration with server
- Real-time sync via WebSocket
- Optimistic updates

### NetworkContext

Discovers shared documents on the local network.

```typescript
interface NetworkContextValue {
  networkDocuments: NetworkDocument[];
  isDiscovering: boolean;
  startDiscovery: () => void;
  stopDiscovery: () => void;
  joinDocument: (address: string) => Promise<void>;
}
```

**Current Implementation:**
- Mock discovery simulation

**Future:**
- mDNS discovery integration via server API
- WebSocket connection for joining remote documents

## Pages

### Landing (`/`)

Public welcome page with app branding and sign-in CTA.

### Auth (`/auth`)

Simple sign-in form using nickname. Redirects to dashboard on success.

### Dashboard (`/dashboard`)

User's home screen after authentication:
- **My Documents** - Grid of user's documents with create button
- **Shared on Network** - Live-updating list of documents discovered on local network
- "New Document" modal for creating documents

### DocumentEditor (`/doc/:documentId`)

Full-screen collaborative markdown editor using `MarkdownCoEditor` from `@ui-kit/react-markdown`:
- Toolbar with back button, title input, and sharing controls
- Three view modes: edit, preview, split
- Network sharing toggle (public/private)
- Invite collaborators button (placeholder)

### Settings (`/settings`)

User preferences and account management.

## Routing

```
/                  → Landing (public)
/auth              → Auth (public)
/dashboard         → Dashboard (protected)
/doc/:documentId   → DocumentEditor (protected)
/settings          → Settings (protected)
```

Protected routes are wrapped with `AppLayout` which provides:
- Header with logo navigation
- Theme toggle (light/dark/system)
- User menu with settings and sign-out

## UI Components Used

From `@ui-kit/react`:
- `Button`, `IconButton`
- `Card`
- `Input`
- `Modal`
- `Spinner`
- `Avatar`
- `Menu`
- `PageTransition`, `useHistoryIndex`
- `useTheme`

From `@ui-kit/icons`:
- `AddIcon`, `FileIcon`, `LinkIcon`
- `ArrowLeftIcon`, `ShareIcon`
- `GearIcon`, `LogoutIcon`
- `SunIcon`, `MoonIcon`, `SunMoonIcon`

From `@ui-kit/react-markdown`:
- `MarkdownCoEditor`

## Storybook

The client includes Storybook for component development:

```bash
cd apps/ideate/client
pnpm storybook
```

Stories are located alongside page components (e.g., `Dashboard.stories.tsx`).

## Development

```bash
# Start dev server
pnpm dev

# Build for production
pnpm build

# Type checking
pnpm typecheck

# Run Storybook
pnpm storybook
```

Default port: `5174`

## Future Features

### Idea Quick Capture
- Global keyboard shortcut to capture ideas
- AI-powered routing to appropriate documents/tasks

### Real-time Collaboration
- Visible cursors from other users
- Selection highlighting
- Presence indicators

### AI Agent Integration
- Per-user AI assistants
- Agent activity visible in document
- Click-to-interact with editing agents

### Chat Sessions
- Per-document chat sidebar
- @mention collaborators (human and AI)
- Context-aware AI responses

### Work Item Tracking
- Inline task creation from document content
- Dashboard task queue
- AI-generated work items
