# Claude Flow

A modern project management interface with AI-powered work item creation.

## Features

- **AI-Powered Work Item Creation**: Describe your idea and let Claude break it down into actionable tasks
- **Multi-step Creation Process**: Clean, focused UI for creating work items
- **Master-Detail Task View**: Review and refine generated tasks before creating work items
- **Theme Support**: Multiple beautiful themes to choose from
- **Responsive Design**: Works great on desktop and mobile

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### Running with AI Features

To use the AI-powered work item creation, you need to run both the frontend and the mock server.

#### Option 1: From the root directory (Recommended)

```bash
# From project root
pnpm dev
# Then select "V1 Application"
```

This will start both servers automatically.

#### Option 2: Manual setup

1. **Terminal 1 - Start the mock server:**
   ```bash
   cd server
   npm install  # First time only
   npm run mock
   ```
   The server will run on http://localhost:3000

2. **Terminal 2 - Start the frontend:**
   ```bash
   cd client
   npm run dev
   ```
   The frontend will run on http://localhost:5173

3. Navigate to Work Items and click "Create with AI"

#### Using real Claude integration

Instead of the mock server, you can use real Claude:
```bash
cd server
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env
npm start
```

#### Troubleshooting

If you get "Failed to fetch" errors:
- Ensure the mock server is running on port 3000
- Check that no other service is using port 3000
- Try accessing http://localhost:3000/api/health directly

## Development

### Project Structure

```
src/
├── components/     # Reusable UI components
├── contexts/       # React contexts (App, Theme)
├── pages/          # Page components
├── types/          # TypeScript type definitions
└── hooks/          # Custom React hooks

server/
├── index.js        # Real Claude integration server
├── mock-server.js  # Mock server for testing
└── README.md       # Server documentation
```

### Available Scripts

From the monorepo root:
- `pnpm dev` - Start both client and server
- `pnpm build:v1` - Build v1 for production
- `pnpm lint:v1` - Run ESLint on v1
- `pnpm test:e2e` - Run e2e tests

From this directory (`apps/v1`):
- Client scripts are in `client/package.json`
- Server scripts are in `server/package.json`

### Technologies

- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Express (server)
- Claude Code SDK