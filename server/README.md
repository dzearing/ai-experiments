# Project Management UX Server

This server provides API endpoints for the AI-powered work item creation feature.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment (for real Claude integration):
   ```bash
   cp .env.example .env
   # Edit .env and add your ANTHROPIC_API_KEY
   ```

## Running the server

### Mock mode (no API key required)
```bash
npm run mock
```
This runs a mock server that simulates Claude responses for testing.

### Real mode (requires Anthropic API key)
```bash
npm start
```
This uses the actual Claude Code SDK to process ideas.

## API endpoints

- `GET /api/health` - Health check
- `POST /api/claude/process-idea` - Process an idea into tasks
  - Body: `{ "idea": "your idea text" }`
- `POST /api/claude/refine-tasks` - Refine existing tasks
  - Body: `{ "refinement": "refinement text", "currentTasks": [...] }`

## Development

The server runs on port 3000 by default. The frontend expects it at http://localhost:3000.