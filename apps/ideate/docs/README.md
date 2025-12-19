# Ideate

Ideate is a collaborative platform for human-AI idea generation, organization, and execution. It enables teams to capture free-form thoughts, collaborate on documents, and leverage AI agents to structure and act on ideas.

## Vision

The goal of Ideate is to enable seamless collaboration between people and AI agents. Users can:

- **Capture ideas quickly** - Enter notes, thoughts, and rough ideas that flow automatically to the right place
- **Collaborate in real-time** - See other people's cursors while editing documents together
- **Work with AI agents** - Each user has their own AI assistant that helps articulate and organize their ideas
- **Execute on ideas** - Turn ideas into actionable work items and execute them with AI assistance

## Core Concepts

### Documents & Co-Authoring

Documents are the primary workspace for collaboration. Every document supports:

- **Real-time co-editing** - Multiple users can edit simultaneously with visible cursors
- **AI agent participation** - AI agents can edit documents, and users can see/interact with agent edits
- **Markdown-based** - Rich text editing with support for flowcharts, illustrations, and embedded files
- **Chat sessions** - Each document has an associated chat where collaborators (human and AI) can be @mentioned

### Idea Flow

The "idea flow" concept makes it easy to capture thoughts without friction:

1. User has a random thought or idea
2. Quick prompt interface captures the idea
3. AI agent asks clarifying questions
4. Agent routes the idea to the appropriate document, task, or project
5. If someone else is editing the target document, they can see the agent making edits
6. Users can click on an active agent to communicate directly with it

### Workspaces & Groups

- **Workspaces** - Shared environments for teams to collaborate
- **Groups** - Collections of people who work together
- **Projects** - Organizational units for related documents and work items

### Dashboard & Attention Management

The user dashboard surfaces items that need attention:

- Automatically prioritized to-do lists
- AI-rated importance for work items
- Notifications when collaboration is needed
- Quick access to active projects and documents

### Work Item Tracking

Built-in task management that integrates with the idea capture flow:

- Ideas can become work items
- Work items can be "played" to start AI-assisted execution
- Agents create potential work items as they identify opportunities
- Queue of work that can be reviewed and approved

### AI Agent Integration

Future vision includes integration with Claude Code for local project work:

- Formulate plans collaboratively with multiple humans and agents
- Create a queue of approved work
- Press play on ideas to start execution
- AI returns to dashboard when feedback is needed

## Current Status

### Implemented

- **Client Application** (React 19 + Vite)
  - Landing page, authentication, dashboard, settings
  - Document editor with markdown support
  - Page transitions and routing
  - Context-based state management

- **Server** (Express v5)
  - REST API for documents and authentication
  - WebSocket server for real-time collaboration
  - mDNS service discovery for local network sharing
  - File-based document storage

- **Real-time Collaboration**
  - WebSocket-based document syncing
  - Cursor position broadcasting
  - Co-author presence tracking
  - Edit operation synchronization

- **Network Discovery**
  - Bonjour/mDNS service publishing
  - Automatic discovery of other Ideate instances on local network
  - Public document sharing across network

### In Development

- AI agent integration
- Idea flow quick capture
- Work item tracking
- Project organization
- Chat sessions per document
- Flowcharts and illustrations

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite, React Router v7
- **Backend**: Express v5, TypeScript, WebSocket (ws)
- **UI Components**: @ui-kit/react, @ui-kit/icons
- **Editor**: @ui-kit/react-markdown (MarkdownCoEditor)
- **Discovery**: bonjour-service (mDNS)
- **Storage**: File system (Markdown files + JSON metadata)

## Development

```bash
# From repository root
pnpm dev:ideate
# Or start client and server separately
cd apps/ideate/client && pnpm dev
cd apps/ideate/server && pnpm dev
```

- Client: http://localhost:5174
- Server: http://localhost:3002
- WebSocket: ws://localhost:3002/ws

## Project Structure

```
apps/ideate/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── contexts/    # React context providers
│   │   └── pages/       # Route page components
│   └── README.md        # Client architecture docs
├── server/              # Express backend
│   ├── src/
│   │   ├── routes/      # API route handlers
│   │   ├── services/    # Business logic services
│   │   └── websocket/   # Real-time collaboration
│   └── README.md        # Server architecture docs
└── docs/                # Project documentation
    ├── README.md        # This file
    └── plans/           # Implementation plans
```

## Documentation

- [Client Architecture](../client/README.md)
- [Server Architecture](../server/README.md)
- [Implementation Plans](./plans/)
