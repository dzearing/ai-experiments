const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const claudeService = require('./claude-service');
const crypto = require('crypto');
const path = require('path');
const { execSync } = require('child_process');
const subscriptionManager = require('./subscriptionManager');
const claudeFlowSettings = require('./claudeflow-settings');
const fs = require('fs');
const fsAsync = fs.promises;
const logger = require('./logger');
const sessionManager = require('./session-manager');

// Load .env from parent directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Initialize logging system
logger.initializeLogs();

// Initialize session manager on startup
(async () => {
  try {
    await sessionManager.initialize();
    logger.info('Session manager initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize session manager:', error);
    process.exit(1);
  }
})();

// Keep debugLog for backward compatibility but also log to appropriate files
function debugLog(...args) {
  console.log(...args);
  // Log to claude log for claude-specific debugging
  logger.writeClaudeLog(...args);
}

console.log('=== SERVER STARTUP ===');
console.log('Current directory:', process.cwd());
console.log('GITHUB_CLIENT_ID:', process.env.GITHUB_CLIENT_ID);
console.log('GITHUB_CLIENT_SECRET:', process.env.GITHUB_CLIENT_SECRET ? '***hidden***' : 'not set');
console.log('PORT:', process.env.PORT);
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);

// Log server startup event
logger.logEvent('SERVER_START', 'Server initializing', {
  port: process.env.PORT || 3000,
  cwd: process.cwd(),
  nodeVersion: process.version
});

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// In-memory storage for OAuth states and tokens (in production, use a database)
const oauthStates = new Map();
const userTokens = new Map();

// In-memory cache for workspace data
const workspaceCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Helper function to get cached data
function getCachedData(key) {
  const cached = workspaceCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`Cache hit for: ${key}`);
    return cached.data;
  }
  console.log(`Cache miss for: ${key}`);
  return null;
}

// Helper function to set cached data
function setCachedData(key, data) {
  workspaceCache.set(key, {
    data,
    timestamp: Date.now()
  });
}

// Helper function to invalidate cache
function invalidateCache(pattern) {
  if (typeof pattern === 'string' && !pattern.includes(':')) {
    // Simple string, just delete it
    workspaceCache.delete(pattern);
  } else {
    // Pattern with prefix, delete all matching keys
    for (const key of workspaceCache.keys()) {
      if (key.startsWith(pattern)) {
        console.log(`Invalidating cache for: ${key}`);
        workspaceCache.delete(key);
      }
    }
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', claudeAvailable: true });
});

// SSE endpoint for real-time updates
app.get('/api/sse/subscribe', (req, res) => {
  const clientId = crypto.randomUUID();
  
  logger.logEvent('SSE_SUBSCRIBE', 'New SSE client connected', { clientId });
  logger.logClient('REQUEST', {
    method: 'GET',
    url: '/api/sse/subscribe',
    clientId
  });
  
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Disable Nginx buffering
    'X-Client-Id': clientId
  });

  // Register client
  subscriptionManager.registerClient(clientId, res);

  // Send initial connection event
  res.write(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`);

  // Send heartbeat every 30 seconds to keep connection alive
  const heartbeat = setInterval(() => {
    try {
      res.write(':heartbeat\n\n');
    } catch (err) {
      clearInterval(heartbeat);
    }
  }, 30000);

  // Handle client disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
    subscriptionManager.unregisterClient(clientId);
  });
});

// Subscription management endpoint
app.post('/api/subscriptions', (req, res) => {
  const { clientId, resources } = req.body;
  
  if (!clientId || !resources || !Array.isArray(resources)) {
    return res.status(400).json({ error: 'Invalid request' });
  }
  
  const success = subscriptionManager.subscribe(clientId, resources);
  res.json({ success });
});

app.delete('/api/subscriptions', (req, res) => {
  const { clientId, resources } = req.body;
  
  if (!clientId || !resources || !Array.isArray(resources)) {
    return res.status(400).json({ error: 'Invalid request' });
  }
  
  const success = subscriptionManager.unsubscribe(clientId, resources);
  res.json({ success });
});

// Debug endpoint for testing Claude SDK
app.post('/api/claude/debug', async (req, res) => {
  try {
    const { query, model, tools, mockMode } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // If mock mode is enabled, return mock data
    if (mockMode) {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Generate mock response
      const mockResponse = {
        text: `Mock response for query: "${query}"\n\nThis is a simulated response from the Claude API using model ${model || 'claude-3-5-sonnet-20241022'}.${tools && tools.length > 0 ? `\n\nTools enabled: ${tools.join(', ')}` : ''}\n\nIn a real scenario, this would contain Claude's actual response to your query.`,
        json: query.toLowerCase().includes('json') ? {
          mock: true,
          query: query,
          model: model || 'claude-3-5-sonnet-20241022',
          timestamp: new Date().toISOString(),
          data: {
            example: "This is mock JSON data",
            items: ["item1", "item2", "item3"]
          }
        } : null,
        toolExecutions: tools && tools.length > 0 ? tools.map(tool => ({
          tool: tool,
          executed: true,
          mockResult: `Mock result for ${tool} tool`
        })) : null,
        tokenUsage: {
          inputTokens: Math.floor(Math.random() * 500) + 100,
          outputTokens: Math.floor(Math.random() * 1000) + 200,
          totalTokens: 0
        },
        error: null
      };

      // Calculate total tokens
      mockResponse.tokenUsage.totalTokens = mockResponse.tokenUsage.inputTokens + mockResponse.tokenUsage.outputTokens;
      
      return res.json(mockResponse);
    }

    // Otherwise, use the real Claude service
    console.log('Processing live request with Claude SDK...');
    const response = await claudeService.processDebugQuery(
      query, 
      model || 'claude-3-5-sonnet-20241022',
      tools || []
    );
    
    res.json(response);
  } catch (error) {
    console.error('Debug endpoint error:', error);
    console.error('Stack trace:', error.stack);
    
    // Return a more detailed error response
    res.status(500).json({ 
      error: 'Failed to process debug query',
      text: `Error: ${error.message}\n\nThis may be due to:\n1. Claude CLI not being logged in (run: claude login)\n2. Missing Claude Code installation\n3. API connectivity issues`,
      details: error.message 
    });
  }
});

// Process idea endpoint
app.post('/api/claude/process-idea', async (req, res) => {
  try {
    const { idea, mockMode, model } = req.body;
    
    console.log('Process idea request:', { idea, mockMode, model });
    
    if (!idea) {
      return res.status(400).json({ error: 'Idea text is required' });
    }

    // If mock mode is enabled, return mock data
    if (mockMode) {
      console.log('Using mock mode for process-idea');
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Generate a mock title from the idea
      const ideaWords = idea.split(' ').slice(0, 5).join(' ');
      const mockTitle = ideaWords.charAt(0).toUpperCase() + ideaWords.slice(1).toLowerCase();

      // Convert first-person to third-person in description
      let professionalDescription = idea
        .replace(/\bI want\b/gi, 'The user wants')
        .replace(/\bI need\b/gi, 'The system needs')
        .replace(/\bI have\b/gi, 'The user has')
        .replace(/\bI('ve| have) created\b/gi, 'The user has created')
        .replace(/\bI'm\b/gi, 'The user is')
        .replace(/\bI am\b/gi, 'The user is')
        .replace(/\bmy\b/gi, 'the user\'s')
        .replace(/\bMe\b/g, 'The user');

      // Generate mock general markdown (without H1 title, using H3 for sections)
      const mockGeneralMarkdown = `### Description

${professionalDescription}

### Overall goals

- [ ] Implement the core functionality as described
- [ ] Ensure proper error handling and edge cases
- [ ] Provide comprehensive documentation`;

      // Generate mock tasks based on the idea
      const mockTasks = [
        {
          id: Math.random().toString(36).substring(2, 9),
          title: "Design and architecture",
          description: "Define the technical architecture and design patterns for the feature",
          goals: [
            "Create a scalable and maintainable architecture",
            "Define clear interfaces and data flow",
            "Document technical decisions"
          ],
          workDescription: "Research best practices, create architectural diagrams, define component interfaces, and document the technical approach including data models and API contracts.",
          validationCriteria: [
            "Architecture diagram is complete and reviewed",
            "All interfaces are clearly defined with TypeScript types",
            "Technical documentation is comprehensive"
          ]
        },
        {
          id: Math.random().toString(36).substring(2, 9),
          title: "Core implementation",
          description: "Build the main functionality based on the design",
          goals: [
            "Implement all required features",
            "Write clean, maintainable code",
            "Follow established patterns"
          ],
          workDescription: "Develop the core features following the architectural design, ensuring code quality and proper testing coverage.",
          validationCriteria: [
            "All features work as specified",
            "Code passes linting and type checks",
            "Unit tests provide adequate coverage"
          ]
        }
      ];

      return res.json({ 
        generalMarkdown: mockGeneralMarkdown,
        tasks: mockTasks 
      });
    }

    const response = await claudeService.processIdea(idea, model);
    res.json(response);

  } catch (error) {
    console.error('Error processing idea:', error);
    res.status(500).json({ 
      error: 'Failed to process idea',
      details: error.message,
      suggestion: error.message.includes('CLI') || error.message.includes('authentication')
        ? 'Enable mock mode in settings to test without Claude authentication' 
        : null
    });
  }
});

// Refine tasks endpoint
app.post('/api/claude/refine-tasks', async (req, res) => {
  try {
    const { refinement, currentTasks, model, mockMode } = req.body;
    
    if (!refinement || !currentTasks) {
      return res.status(400).json({ error: 'Refinement text and current tasks are required' });
    }

    // If mock mode is enabled, return mock refinement
    if (mockMode) {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock refined tasks - modify the existing ones slightly
      const refinedTasks = currentTasks.tasks.map((task, index) => ({
        ...task,
        title: task.title + " (Refined)",
        description: task.description + " - Updated based on refinement: " + refinement.substring(0, 50) + "...",
        goals: [...task.goals, "Address refinement feedback"],
        validationCriteria: [...task.validationCriteria, "Refinement requirements are met"]
      }));

      return res.json({ tasks: refinedTasks });
    }

    const response = await claudeService.refineTasks(refinement, currentTasks, model);
    res.json(response);

  } catch (error) {
    console.error('Error refining tasks:', error);
    console.error('Stack trace:', error.stack);
    
    // Return a user-friendly error message
    res.status(500).json({ 
      error: 'Failed to refine tasks',
      details: error.message,
      suggestion: error.message.includes('authentication') 
        ? 'Enable mock mode in settings to test without Claude authentication' 
        : null
    });
  }
});

// GitHub OAuth endpoints
app.post('/api/auth/github/login', (req, res) => {
  try {
    console.log('=== GitHub OAuth Login Request ===');
    console.log('GITHUB_CLIENT_ID from env:', process.env.GITHUB_CLIENT_ID);
    
    // Generate a random state for OAuth security
    const state = crypto.randomBytes(32).toString('hex');
    oauthStates.set(state, {
      created: Date.now(),
      // Additional data can be stored here
    });

    // Clean up old states (older than 10 minutes)
    for (const [key, value] of oauthStates.entries()) {
      if (Date.now() - value.created > 10 * 60 * 1000) {
        oauthStates.delete(key);
      }
    }

    // GitHub OAuth configuration
    const clientId = process.env.GITHUB_CLIENT_ID || 'your-github-client-id';
    console.log('Using client ID:', clientId);
    
    // Use the frontend URL for the redirect
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const redirectUri = `${frontendUrl}/oauth-callback.html`;
    const scope = 'read:user user:email repo read:org';

    // Construct GitHub OAuth URL
    const authUrl = `https://github.com/login/oauth/authorize?` +
      `client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(scope)}` +
      `&state=${state}`;

    res.json({ authUrl });
  } catch (error) {
    console.error('Error initiating GitHub login:', error);
    res.status(500).json({ error: 'Failed to initiate GitHub login' });
  }
});

app.post('/api/auth/github/token', async (req, res) => {
  try {
    const { code, state } = req.body;

    // Verify state
    if (!state || !oauthStates.has(state)) {
      return res.status(400).json({ error: 'Invalid state parameter' });
    }

    // Clean up used state
    oauthStates.delete(state);

    const clientId = process.env.GITHUB_CLIENT_ID || 'your-github-client-id';
    const clientSecret = process.env.GITHUB_CLIENT_SECRET || 'your-github-client-secret';

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code
      })
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      throw new Error(tokenData.error_description || tokenData.error);
    }

    const accessToken = tokenData.access_token;

    // Get user information from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user information');
    }

    const userData = await userResponse.json();

    // Get user emails to determine account type
    const emailsResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    // Determine account type
    let accountType = 'personal';
    
    // Check if user belongs to any organizations with enterprise features
    const orgsResponse = await fetch('https://api.github.com/user/orgs', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (orgsResponse.ok) {
      const orgs = await orgsResponse.json();
      
      // Check each organization for enterprise features
      for (const org of orgs) {
        try {
          const orgResponse = await fetch(`https://api.github.com/orgs/${org.login}`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          });
          
          if (orgResponse.ok) {
            const orgData = await orgResponse.json();
            // GitHub Enterprise Cloud organizations have a plan name that includes 'enterprise'
            if (orgData.plan && orgData.plan.name.toLowerCase().includes('enterprise')) {
              accountType = 'enterprise';
              break;
            }
          }
        } catch (err) {
          // Continue checking other orgs
        }
      }
    }
    
    // Alternative: Check if the user's company field suggests enterprise
    if (accountType === 'personal' && userData.company) {
      // This is a heuristic - you might want to check against known enterprise companies
      // For now, we'll keep it as personal unless we detect actual enterprise features
    }

    // Store token (in production, encrypt this)
    const accountId = `github_${userData.id}`;
    userTokens.set(accountId, {
      accessToken: accessToken,
      userId: userData.id,
      username: userData.login,
      created: Date.now()
    });

    // Return account information
    const account = {
      id: accountId,
      username: userData.login,
      email: userData.email || '',
      avatarUrl: userData.avatar_url,
      accountType: accountType,
      connectedAt: new Date().toISOString()
    };

    res.json(account);
  } catch (error) {
    console.error('Error exchanging token:', error);
    res.status(500).json({ error: 'Failed to complete authentication' });
  }
});

app.post('/api/auth/github/logout/:accountId', (req, res) => {
  try {
    const { accountId } = req.params;
    
    // Remove token from storage
    userTokens.delete(accountId);
    
    // In production, you might also want to revoke the token with GitHub
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error logging out:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
});

app.get('/api/auth/github/accounts', (req, res) => {
  try {
    // In production, this would fetch from a database
    // For now, return empty array as tokens are not persisted
    res.json([]);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// Verify account - check if we still have a valid token
app.post('/api/auth/github/verify', (req, res) => {
  try {
    const { accountId } = req.body;
    
    if (!accountId) {
      return res.status(400).json({ error: 'Account ID is required' });
    }
    
    // Check if we have a token for this account
    const tokenData = userTokens.get(accountId);
    
    if (!tokenData) {
      return res.status(401).json({ error: 'Account not found or session expired' });
    }
    
    // In a real app, you might want to verify the token is still valid with GitHub
    res.json({ valid: true });
  } catch (error) {
    console.error('Error verifying account:', error);
    res.status(500).json({ error: 'Failed to verify account' });
  }
});

// GitHub API proxy endpoint
app.post('/api/github/proxy', async (req, res) => {
  try {
    const { accountId, endpoint, method = 'GET', body } = req.body;

    // Get token for the account
    const tokenData = userTokens.get(accountId);
    if (!tokenData) {
      return res.status(401).json({ error: 'Account not authenticated' });
    }

    // Make request to GitHub API
    const githubResponse = await fetch(`https://api.github.com${endpoint}`, {
      method: method,
      headers: {
        'Authorization': `Bearer ${tokenData.accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });

    // Check rate limit headers
    const rateLimitRemaining = githubResponse.headers.get('x-ratelimit-remaining');
    const rateLimitReset = githubResponse.headers.get('x-ratelimit-reset');
    
    if (rateLimitRemaining === '0') {
      const resetTime = new Date(parseInt(rateLimitReset) * 1000);
      return res.status(429).json({ 
        error: 'GitHub API rate limit exceeded',
        resetTime: resetTime.toISOString()
      });
    }

    if (!githubResponse.ok) {
      const errorData = await githubResponse.json();
      return res.status(githubResponse.status).json({
        error: errorData.message || 'GitHub API request failed',
        details: errorData
      });
    }

    const data = await githubResponse.json();
    
    // Include rate limit info in response headers
    if (rateLimitRemaining) {
      res.setHeader('X-RateLimit-Remaining', rateLimitRemaining);
    }
    if (rateLimitReset) {
      res.setHeader('X-RateLimit-Reset', rateLimitReset);
    }

    res.json(data);
  } catch (error) {
    console.error('GitHub proxy error:', error);
    res.status(500).json({ 
      error: 'Failed to proxy GitHub request',
      message: error.message 
    });
  }
});

// Workspace endpoints
const os = require('os');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Parse work item markdown to extract details
function parseWorkItemMarkdown(content) {
  const workItem = {
    title: '',
    status: '',
    description: '',
    priority: 'medium', // Default priority
    goals: [],
    tasks: [],
    acceptanceCriteria: [],
    metadata: null
  };

  if (!content) {
    console.log('parseWorkItemMarkdown: No content provided');
    return workItem;
  }
  
  console.log('parseWorkItemMarkdown: Parsing content length:', content.length);

  // Extract title (first # heading)
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    workItem.title = titleMatch[1].trim();
  }

  // Extract status
  const statusMatch = content.match(/##\s*Status\s*\n+(\w+)/i);
  if (statusMatch) {
    workItem.status = statusMatch[1].trim();
  }

  // Extract description
  const descMatch = content.match(/##\s*Description\s*\n+([\s\S]*?)(?=\n##|$)/i);
  if (descMatch) {
    workItem.description = descMatch[1].trim();
  }

  // Extract goals
  const goalsMatch = content.match(/##\s*Goals\s*\n+([\s\S]*?)(?=\n##|$)/i);
  if (goalsMatch) {
    const goalLines = goalsMatch[1].trim().split('\n');
    workItem.goals = goalLines
      .filter(line => line.match(/^-\s*\[[\sx]\]/))
      .map(line => ({
        text: line.replace(/^-\s*\[[\sx]\]\s*/, ''),
        completed: line.includes('[x]')
      }));
  }

  // Extract detailed tasks (stop at Metadata or next ## section)
  const tasksMatch = content.match(/##\s*Tasks\s*\n+([\s\S]*?)(?=\n##\s*(?:Metadata|$)|$)/i);
  if (tasksMatch) {
    const tasksContent = tasksMatch[1].trim();
    // Split by "### " to find task sections
    const taskSections = tasksContent.split(/(?=###\s*)/);
    const taskMatches = taskSections.filter(t => t.trim() && t.includes('###'));
    
    console.log('Tasks content length:', tasksContent.length);
    console.log('Task sections found:', taskMatches.length);
    
    workItem.tasks = taskMatches.map(taskSection => {
      const task = {
        id: '',
        taskNumber: '',
        title: '',
        description: '',
        goals: [],
        workDescription: '',
        validationCriteria: []
      };
      
      // Extract task number and title from "### 1. Task Title" format
      const titleMatch = taskSection.match(/###\s*(\d+[a-z]?)\.\s*(.+?)(?:\n|$)/);
      if (titleMatch) {
        task.taskNumber = titleMatch[1];
        task.title = titleMatch[2].trim();
        task.id = `task-${titleMatch[1]}`; // Generate ID from task number
      }
      
      // Extract description (not labeled with **)
      const contentAfterTitle = taskSection.substring(taskSection.indexOf('\n') + 1);
      const descMatch = contentAfterTitle.match(/^([\s\S]*?)(?=\n\*\*|$)/);
      if (descMatch && descMatch[1].trim() && !descMatch[1].trim().startsWith('**')) {
        task.description = descMatch[1].trim();
      }
      
      // Extract goals
      const goalsMatch = taskSection.match(/\*\*Goals:\*\*\s*\n([\s\S]*?)(?=\n\*\*|$)/);
      if (goalsMatch) {
        const goalLines = goalsMatch[1].trim().split('\n');
        task.goals = goalLines
          .filter(line => line.match(/^-\s*/))
          .map(line => line.replace(/^-\s*/, '').trim());
      }
      
      // Extract work description
      const workMatch = taskSection.match(/\*\*Work\s+Description:\*\*\s*\n?([\s\S]*?)(?=\n\*\*|$)/);
      if (workMatch) {
        task.workDescription = workMatch[1].trim();
      }
      
      // Extract validation criteria
      const criteriaMatch = taskSection.match(/\*\*Validation\s+Criteria:\*\*\s*\n?([\s\S]*?)(?=\n\*\*|###|$)/);
      if (criteriaMatch) {
        const criteriaLines = criteriaMatch[1].trim().split('\n');
        task.validationCriteria = criteriaLines
          .filter(line => line.match(/^-\s*/))
          .map(line => line.replace(/^-\s*/, '').trim());
      }
      
      console.log(`Task ${task.taskNumber}: ${task.title}`);
      return task;
    }).filter(task => task.title); // Only include tasks with titles
    
    console.log('Total tasks parsed:', workItem.tasks.length);
  }

  // Extract acceptance criteria
  const criteriaMatch = content.match(/##\s*Acceptance\s*Criteria\s*\n+([\s\S]*?)(?=\n##|$)/i);
  if (criteriaMatch) {
    const criteriaLines = criteriaMatch[1].trim().split('\n');
    workItem.acceptanceCriteria = criteriaLines
      .filter(line => line.match(/^-\s*/))
      .map(line => line.replace(/^-\s*/, '').trim());
  }

  // Extract metadata (try both JSON and plain text formats)
  const metadataMatch = content.match(/##\s*Metadata\s*\n+```json\n([\s\S]*?)\n```/i);
  if (metadataMatch) {
    try {
      workItem.metadata = JSON.parse(metadataMatch[1]);
    } catch (err) {
      // Invalid JSON
    }
  } else {
    // Try plain text metadata format
    const plainMetadataMatch = content.match(/##\s*Metadata\s*\n+([\s\S]*?)(?=\n##|$)/i);
    if (plainMetadataMatch) {
      const metadataContent = plainMetadataMatch[1].trim();
      
      // Extract work item ID
      const idMatch = metadataContent.match(/-\s*Work\s*Item\s*ID:\s*(.+)/i);
      if (idMatch) {
        workItem.metadata = workItem.metadata || {};
        workItem.metadata.workItemId = idMatch[1].trim();
      }
      
      // Extract priority
      const priorityMatch = metadataContent.match(/-\s*Priority:\s*(.+)/i);
      if (priorityMatch) {
        workItem.priority = priorityMatch[1].trim();
      }
      
      // Extract status
      const statusMatch2 = metadataContent.match(/-\s*Status:\s*(.+)/i);
      if (statusMatch2) {
        workItem.status = statusMatch2[1].trim();
      }
    }
  }

  return workItem;
}

// Parse README.md to extract project details
function parseProjectReadme(readmeContent) {
  const details = {
    purpose: '',
    repositories: [],
    primaryRepoUrl: ''
  };

  if (!readmeContent) return details;

  // Extract purpose/description (usually after # Project Name or ## Description)
  const purposeMatch = readmeContent.match(/##?\s*(Purpose|Description|Overview|About)\s*\n+([\s\S]*?)(?=\n#|$)/i);
  if (purposeMatch) {
    // Extract just the first paragraph
    const purposeText = purposeMatch[2].trim();
    const firstParagraph = purposeText.split(/\n\n/)[0];
    details.purpose = firstParagraph.replace(/\n/g, ' ').trim();
  }

  // Extract repository information
  const repoSection = readmeContent.match(/##?\s*(Repositories?|Repository\s+Information|Repository|Repos?)\s*\n+([\s\S]*?)(?=\n#|$)/i);
  if (repoSection) {
    const repoContent = repoSection[2];
    
    // Look for repo URLs (GitHub or Azure DevOps)
    const repoUrls = repoContent.match(/https?:\/\/(github\.com|dev\.azure\.com)[^\s\)]+/g) || [];
    
    // Also look for "Local development" or similar indicators
    if (repoUrls.length === 0 && repoContent.match(/local\s+development|not\s+tracked/i)) {
      // Create a placeholder for local development
      details.repositories.push({
        url: 'local://development',
        type: 'github', // Default type
        visibility: 'private',
        isPrimary: true,
        description: 'Local development repository'
      });
      details.primaryRepoUrl = 'local://development';
    } else {
      repoUrls.forEach(url => {
        const repo = {
          url: url.replace(/\.$/, ''), // Remove trailing period
          type: url.includes('github.com') ? 'github' : 'ado',
          visibility: 'private', // Default, can be overridden
          isPrimary: false
        };

        // Check if marked as primary
        const urlContext = repoContent.substring(Math.max(0, repoContent.indexOf(url) - 50), repoContent.indexOf(url) + url.length + 50);
        if (urlContext.match(/primary|main/i)) {
          repo.isPrimary = true;
          details.primaryRepoUrl = url;
        }

        // Check visibility
        if (urlContext.match(/public/i)) {
          repo.visibility = 'public';
        }

        details.repositories.push(repo);
      });

      // If no primary marked, mark first as primary
      if (details.repositories.length > 0 && !details.primaryRepoUrl) {
        details.repositories[0].isPrimary = true;
        details.primaryRepoUrl = details.repositories[0].url;
      }
    }
  }

  return details;
}

// Extract repo details from actual repository
async function extractRepoDetails(repoPath) {
  const details = {
    type: 'local',
    visibility: 'private',
    importantFolders: [],
    url: null,
    gitRemote: null
  };

  try {
    // Check for .git folder to determine repo type
    const gitPath = path.join(repoPath, '.git');
    const gitExists = await fsAsync.access(gitPath).then(() => true).catch(() => false);
    
    if (gitExists) {
      // Try to read git config for remote URL
      try {
        const configPath = path.join(gitPath, 'config');
        const gitConfig = await fsAsync.readFile(configPath, 'utf-8');
        
        // Extract remote origin URL using regex
        const remoteMatch = gitConfig.match(/\[remote "origin"\]\s*\n\s*url = (.+)/);
        if (remoteMatch) {
          const remoteUrl = remoteMatch[1].trim();
          details.gitRemote = remoteUrl;
          details.url = remoteUrl;
          
          // Determine repo type from URL
          if (remoteUrl.includes('github.com')) {
            details.type = 'github';
            
            // Extract owner/repo from GitHub URL
            const githubMatch = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)(\.git)?$/);
            if (githubMatch) {
              const owner = githubMatch[1];
              const repo = githubMatch[2];
              
              // Use gh CLI to get detailed GitHub info
              try {
                const ghResult = execSync(
                  `gh repo view ${owner}/${repo} --json name,description,visibility,isPrivate,url,sshUrl,defaultBranchRef,createdAt,pushedAt,isArchived,isFork,parent`,
                  { encoding: 'utf-8', cwd: repoPath }
                );
                
                const ghData = JSON.parse(ghResult);
                details.visibility = ghData.isPrivate ? 'private' : 'public';
                details.description = ghData.description || '';
                details.defaultBranch = ghData.defaultBranchRef?.name || 'main';
                details.isArchived = ghData.isArchived || false;
                details.isFork = ghData.isFork || false;
                details.parent = ghData.parent ? {
                  owner: ghData.parent.owner.login,
                  name: ghData.parent.name,
                  url: ghData.parent.url
                } : null;
                details.createdAt = ghData.createdAt;
                details.pushedAt = ghData.pushedAt;
                details.githubData = ghData;
              } catch (ghError) {
                console.log('Failed to get GitHub details via gh CLI:', ghError.message);
                // gh CLI might not be available or user not authenticated
                // Continue with basic git info
              }
            }
          } else if (remoteUrl.includes('dev.azure.com')) {
            details.type = 'ado';
          } else if (remoteUrl.includes('gitlab.com')) {
            details.type = 'gitlab';
          } else if (remoteUrl.includes('bitbucket.org')) {
            details.type = 'bitbucket';
          }
        }
      } catch (err) {
        console.error('Error reading git config:', err);
      }
    }

    // Check for package.json
    const packageJsonPath = path.join(repoPath, 'package.json');
    try {
      const packageJson = JSON.parse(await fsAsync.readFile(packageJsonPath, 'utf-8'));
      if (packageJson.private === false) {
        details.visibility = 'public';
      }
    } catch (err) {
      // No package.json or invalid
    }

    // Identify important folders
    const entries = await fsAsync.readdir(repoPath, { withFileTypes: true });
    const importantDirs = ['src', 'packages', 'apps', 'lib', 'docs', 'scripts', 'test', 'tests'];
    
    for (const entry of entries) {
      if (entry.isDirectory() && importantDirs.includes(entry.name)) {
        let description = '';
        switch(entry.name) {
          case 'src': description = 'Source code'; break;
          case 'packages': description = 'Monorepo packages'; break;
          case 'apps': description = 'Applications'; break;
          case 'lib': description = 'Library output'; break;
          case 'docs': description = 'Documentation'; break;
          case 'scripts': description = 'Build and utility scripts'; break;
          case 'test':
          case 'tests': description = 'Test files'; break;
        }
        details.importantFolders.push({
          path: entry.name,
          description
        });
      }
    }
  } catch (err) {
    console.error('Error extracting repo details:', err);
  }

  return details;
}

// Browse directories
app.post('/api/browse/list', async (req, res) => {
  try {
    const { path: dirPath } = req.body;
    
    // Use home directory if no path provided
    const targetPath = dirPath || os.homedir();
    
    // Security: Resolve the path to prevent directory traversal attacks
    const resolvedPath = path.resolve(targetPath);
    
    try {
      const items = await fsAsync.readdir(resolvedPath);
      const results = [];
      
      console.log(`Browsing directory: ${resolvedPath}`);
      console.log(`Found ${items.length} items`);
      
      for (const item of items) {
        try {
          const itemPath = path.join(resolvedPath, item);
          const stats = await fsAsync.stat(itemPath);
          
          // Include all directories, but mark hidden ones
          if (stats.isDirectory()) {
            const isHidden = item.startsWith('.');
            // Skip only specific system directories
            if (item === '$RECYCLE.BIN' || item === 'System Volume Information') {
              continue;
            }
            results.push({
              name: item,
              path: itemPath,
              type: 'directory',
              hidden: isHidden
            });
          }
        } catch (err) {
          console.log(`Skipping inaccessible item: ${item}`, err.message);
        }
      }
      
      // Sort directories alphabetically, with non-hidden first
      results.sort((a, b) => {
        if (a.hidden !== b.hidden) return a.hidden ? 1 : -1;
        return a.name.localeCompare(b.name);
      });
      
      console.log(`Returning ${results.length} directories`);
      
      res.json({
        currentPath: resolvedPath,
        parent: path.dirname(resolvedPath),
        items: results,
        separator: path.sep
      });
    } catch (error) {
      res.status(403).json({ 
        error: 'Cannot access directory',
        details: error.message 
      });
    }
  } catch (error) {
    console.error('Error browsing directory:', error);
    res.status(500).json({ 
      error: 'Failed to browse directory',
      details: error.message 
    });
  }
});

// Get user home directory
app.get('/api/browse/home', (req, res) => {
  res.json({ 
    path: os.homedir(),
    separator: path.sep
  });
});

// Create a new folder
app.post('/api/browse/create-folder', async (req, res) => {
  try {
    const { parentPath, folderName } = req.body;
    
    if (!parentPath || !folderName) {
      return res.status(400).json({ error: 'Parent path and folder name are required' });
    }

    // Validate folder name
    if (!/^[^<>:"/\\|?*]+$/.test(folderName)) {
      return res.status(400).json({ error: 'Invalid folder name' });
    }

    const newFolderPath = path.join(parentPath, folderName);
    
    try {
      await fsAsync.mkdir(newFolderPath, { recursive: false });
      res.json({ 
        success: true, 
        path: newFolderPath,
        name: folderName
      });
    } catch (error) {
      if (error.code === 'EEXIST') {
        res.status(409).json({ error: 'Folder already exists' });
      } else {
        res.status(403).json({ error: 'Cannot create folder', details: error.message });
      }
    }
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ 
      error: 'Failed to create folder',
      details: error.message 
    });
  }
});

// Check if workspace exists and has content
app.post('/api/workspace/exists', async (req, res) => {
  try {
    const { workspacePath } = req.body;
    
    if (!workspacePath) {
      return res.status(400).json({ error: 'Workspace path is required' });
    }

    try {
      const stats = await fsAsync.stat(workspacePath);
      if (!stats.isDirectory()) {
        res.json({ exists: false, hasContent: false });
        return;
      }

      // Check if projects folder exists and has content
      let hasContent = false;
      try {
        const projectsPath = path.join(workspacePath, 'projects');
        const projectStats = await fsAsync.stat(projectsPath);
        if (projectStats.isDirectory()) {
          const projectDirs = await fsAsync.readdir(projectsPath);
          // Check if there are any projects besides template and hidden folders
          hasContent = projectDirs.some(dir => dir !== 'template' && !dir.startsWith('.'));
        }
      } catch (err) {
        // Projects folder doesn't exist
      }

      res.json({ exists: true, hasContent });
    } catch (error) {
      res.json({ exists: false, hasContent: false });
    }
  } catch (error) {
    console.error('Error checking workspace:', error);
    res.status(500).json({ 
      error: 'Failed to check workspace',
      details: error.message 
    });
  }
});

// Read workspace structure - lightweight version
app.post('/api/workspace/read-light', async (req, res) => {
  try {
    const { workspacePath } = req.body;
    
    if (!workspacePath) {
      return res.status(400).json({ error: 'Workspace path is required' });
    }

    // Check cache first
    const cacheKey = `workspace-light:${workspacePath}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      res.set({
        'Cache-Control': 'private, max-age=60', // 1 minute for light data
        'X-Cache': 'HIT'
      });
      return res.json(cachedData);
    }

    // Start timing
    const startTime = Date.now();

    // Read projects directory - just get names and basic info
    const projectsPath = path.join(workspacePath, 'projects');
    const projects = [];

    try {
      const projectDirs = await fsAsync.readdir(projectsPath);
      
      // Read all project basic info in parallel
      const projectPromises = projectDirs
        .filter(name => !name.startsWith('.'))
        .map(async (projectName) => {
          const projectPath = path.join(projectsPath, projectName);
          const stats = await fsAsync.stat(projectPath);
          
          if (!stats.isDirectory()) return null;

          // Check if tracked
          try {
            const settingsPath = path.join(projectPath, 'claudeflow.settings.json');
            const settingsContent = await fsAsync.readFile(settingsPath, 'utf-8');
            const settings = JSON.parse(settingsContent);
            if (settings.tracked === false) return null;
          } catch (err) {
            // No settings file - continue normally
          }

          // Just return basic info - no markdown parsing
          return {
            name: projectName,
            path: projectPath,
            // We'll load details later
            isLoading: true
          };
        });

      const projectResults = await Promise.all(projectPromises);
      const validProjects = projectResults.filter(p => p !== null);

      console.log(`[PERF] Workspace light read completed in ${Date.now() - startTime}ms`);

      const responseData = { projects: validProjects };
      setCachedData(cacheKey, responseData);

      res.set({
        'Cache-Control': 'private, max-age=60',
        'X-Cache': 'MISS'
      });
      res.json(responseData);

    } catch (error) {
      console.error('Error reading projects directory:', error);
      res.json({ projects: [] });
    }

  } catch (error) {
    console.error('Error reading workspace (light):', error);
    res.status(500).json({ 
      error: 'Failed to read workspace',
      details: error.message 
    });
  }
});

// Read individual project details
app.post('/api/workspace/project-details', async (req, res) => {
  try {
    const { projectPath } = req.body;
    
    if (!projectPath) {
      return res.status(400).json({ error: 'Project path is required' });
    }

    // Check cache first
    const cacheKey = `project-details:${projectPath}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      res.set({
        'Cache-Control': 'private, max-age=300', // 5 minutes
        'X-Cache': 'HIT'
      });
      return res.json(cachedData);
    }

    const startTime = Date.now();
    const projectName = path.basename(projectPath);

    const project = {
      name: projectName,
      path: projectPath,
      repos: [],
      plans: {
        ideas: [],
        planned: [],
        active: [],
        completed: []
      }
    };

    // Read README.md and parse project details
    let readmeContent = '';
    try {
      const readmePath = path.join(projectPath, 'README.md');
      readmeContent = await fsAsync.readFile(readmePath, 'utf-8');
      project.readme = readmeContent;
    } catch (err) {
      // README is optional
    }

    // Parse project details from README
    const parsedDetails = parseProjectReadme(readmeContent);
    project.purpose = parsedDetails.purpose;
    project.repositories = parsedDetails.repositories;
    project.primaryRepoUrl = parsedDetails.primaryRepoUrl;

    // Read repos directory
    try {
      const reposPath = path.join(projectPath, 'repos');
      const repoDirs = await fsAsync.readdir(reposPath);
      
      for (const repoDir of repoDirs) {
        const match = repoDir.match(/^(.+)-(\d+)$/);
        if (match) {
          const repoPath = path.join(reposPath, repoDir);
          project.repos.push({
            name: match[1],
            number: parseInt(match[2]),
            path: repoPath,
            isAvailable: true
          });
        }
      }
    } catch (err) {
      // Repos directory is optional
    }

    // Read plans - but don't parse markdown content yet
    const planTypes = ['ideas', 'planned', 'active', 'completed'];
    
    await Promise.all(planTypes.map(async (planType) => {
      try {
        const plansPath = path.join(projectPath, 'plans', planType);
        const planFiles = await fsAsync.readdir(plansPath);
        
        const plansPromises = planFiles
          .filter(file => file.endsWith('.md') && file !== 'TEMPLATE.md')
          .map(async (file) => {
            const planPath = path.join(plansPath, file);
            const content = await fsAsync.readFile(planPath, 'utf-8');
            const parsedWorkItem = parseWorkItemMarkdown(content);
            
            return {
              name: file.replace('.md', ''),
              path: planPath,
              status: planType,
              content: content,
              workItem: parsedWorkItem
            };
          });
        
        project.plans[planType] = await Promise.all(plansPromises);
      } catch (err) {
        // Plan directory might not exist
      }
    }));

    console.log(`[PERF] Project details read completed in ${Date.now() - startTime}ms for ${projectName}`);

    setCachedData(cacheKey, project);

    res.set({
      'Cache-Control': 'private, max-age=300',
      'X-Cache': 'MISS'
    });
    res.json(project);

  } catch (error) {
    console.error('Error reading project details:', error);
    res.status(500).json({ 
      error: 'Failed to read project details',
      details: error.message 
    });
  }
});

// Create a new work item
app.post('/api/workspace/create-workitem', async (req, res) => {
  try {
    const { workspacePath, projectPath, workItem, generalMarkdown, tasks } = req.body;
    
    if (!workspacePath || !projectPath || !workItem) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate filename from title
    const fileName = workItem.title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') + '.md';
    
    // Determine target folder based on status
    const statusFolder = workItem.status === 'planned' ? 'planned' : 
                        workItem.status === 'active' ? 'active' : 
                        workItem.status === 'completed' ? 'completed' : 'ideas';
    
    const targetPath = path.join(projectPath, 'plans', statusFolder, fileName);
    
    // Create markdown content
    let markdownContent = '';
    
    // If general markdown is provided, use it as the beginning
    if (generalMarkdown) {
      markdownContent = generalMarkdown + '\n\n';
    } else {
      // Fallback to old format if no general markdown
      markdownContent = `# ${workItem.title}\n\n`;
      markdownContent += `## Description\n\n${workItem.description || 'No description provided.'}\n\n`;
    }
    
    // Add metadata section at the end with work item ID
    markdownContent += `\n## Metadata\n\n`;
    markdownContent += `- Work Item ID: ${workItem.id}\n`;
    markdownContent += `- Priority: ${workItem.priority}\n`;
    markdownContent += `- Status: ${workItem.status}\n\n`;
    
    if (tasks && tasks.length > 0) {
      markdownContent += `## Tasks\n\n`;
      tasks.forEach((task, index) => {
        markdownContent += `### ${task.taskNumber || index + 1}. ${task.title}\n\n`;
        if (task.description) {
          markdownContent += `${task.description}\n\n`;
        }
        if (task.goals && task.goals.length > 0) {
          markdownContent += `**Goals:**\n`;
          task.goals.forEach(goal => {
            markdownContent += `- ${goal}\n`;
          });
          markdownContent += '\n';
        }
        if (task.validationCriteria && task.validationCriteria.length > 0) {
          markdownContent += `**Validation Criteria:**\n`;
          task.validationCriteria.forEach(criteria => {
            markdownContent += `- ${criteria}\n`;
          });
          markdownContent += '\n';
        }
      });
    }
    
    // Ensure directory exists
    await fsAsync.mkdir(path.dirname(targetPath), { recursive: true });
    
    // Write the file
    await fsAsync.writeFile(targetPath, markdownContent);
    
    // Invalidate cache for this project
    invalidateCache(`workspace-light:${workspacePath}`);
    invalidateCache(`project-details:${projectPath}`);
    invalidateCache(`workspace:${workspacePath}`);
    
    console.log(`Created work item at: ${targetPath}`);
    
    res.json({ 
      success: true, 
      path: targetPath,
      fileName: fileName
    });
    
  } catch (error) {
    console.error('Error creating work item:', error);
    res.status(500).json({ 
      error: 'Failed to create work item',
      details: error.message 
    });
  }
});

// Update existing work item
app.post('/api/workspace/update-workitem', async (req, res) => {
  try {
    const { workspacePath, projectPath, workItem, generalMarkdown, tasks, markdownPath } = req.body;
    
    if (!workspacePath || !projectPath || !workItem) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Use existing path or generate new one
    let targetPath = markdownPath;
    if (!targetPath) {
      const fileName = workItem.title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') + '.md';
      
      const statusFolder = workItem.status === 'planned' ? 'planned' : 
                          workItem.status === 'active' ? 'active' : 
                          workItem.status === 'completed' ? 'completed' : 'ideas';
      
      targetPath = path.join(projectPath, 'plans', statusFolder, fileName);
    }
    
    // Create markdown content (same as create)
    let markdownContent = '';
    
    // If general markdown is provided, use it as the beginning
    if (generalMarkdown) {
      markdownContent = generalMarkdown + '\n\n';
    } else {
      // Fallback to old format if no general markdown
      markdownContent = `# ${workItem.title}\n\n`;
      markdownContent += `## Description\n\n${workItem.description || 'No description provided.'}\n\n`;
    }
    
    // Add metadata section at the end with work item ID
    markdownContent += `\n## Metadata\n\n`;
    markdownContent += `- Work Item ID: ${workItem.id}\n`;
    markdownContent += `- Priority: ${workItem.priority}\n`;
    markdownContent += `- Status: ${workItem.status}\n\n`;
    
    if (tasks && tasks.length > 0) {
      markdownContent += `## Tasks\n\n`;
      tasks.forEach((task, index) => {
        markdownContent += `### ${task.taskNumber || index + 1}. ${task.title}\n\n`;
        if (task.description) {
          markdownContent += `${task.description}\n\n`;
        }
        if (task.goals && task.goals.length > 0) {
          markdownContent += `**Goals:**\n`;
          task.goals.forEach(goal => {
            markdownContent += `- ${goal}\n`;
          });
          markdownContent += '\n';
        }
        if (task.validationCriteria && task.validationCriteria.length > 0) {
          markdownContent += `**Validation Criteria:**\n`;
          task.validationCriteria.forEach(criteria => {
            markdownContent += `- ${criteria}\n`;
          });
          markdownContent += '\n';
        }
      });
    }
    
    // Ensure directory exists
    await fsAsync.mkdir(path.dirname(targetPath), { recursive: true });
    
    // Write the file
    await fsAsync.writeFile(targetPath, markdownContent);
    
    // Invalidate cache for this project
    invalidateCache(`workspace-light:${workspacePath}`);
    invalidateCache(`project-details:${projectPath}`);
    invalidateCache(`workspace:${workspacePath}`);
    invalidateCache(`work-item:${targetPath}`);
    
    console.log(`Updated work item at: ${targetPath}`);
    
    res.json({ 
      success: true, 
      path: targetPath
    });
    
  } catch (error) {
    console.error('Error updating work item:', error);
    res.status(500).json({ 
      error: 'Failed to update work item',
      details: error.message 
    });
  }
});

// Read work item markdown content on demand
app.post('/api/workspace/work-item-content', async (req, res) => {
  try {
    const { workItemPath } = req.body;
    
    if (!workItemPath) {
      return res.status(400).json({ error: 'Work item path is required' });
    }

    // Check cache first
    const cacheKey = `work-item:${workItemPath}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      res.set({
        'Cache-Control': 'private, max-age=300', // 5 minutes
        'X-Cache': 'HIT'
      });
      return res.json(cachedData);
    }

    const startTime = Date.now();

    // Read and parse the markdown file
    const content = await fsAsync.readFile(workItemPath, 'utf-8');
    const parsedWorkItem = parseWorkItemMarkdown(content);

    const result = {
      content,
      parsed: parsedWorkItem,
      path: workItemPath
    };

    console.log(`[PERF] Work item content read completed in ${Date.now() - startTime}ms`);

    setCachedData(cacheKey, result);

    res.set({
      'Cache-Control': 'private, max-age=300',
      'X-Cache': 'MISS'
    });
    res.json(result);

  } catch (error) {
    console.error('Error reading work item content:', error);
    res.status(500).json({ 
      error: 'Failed to read work item content',
      details: error.message 
    });
  }
});

// Read workspace structure - full version
app.post('/api/workspace/read', async (req, res) => {
  try {
    const { workspacePath } = req.body;
    
    if (!workspacePath) {
      return res.status(400).json({ error: 'Workspace path is required' });
    }

    // Check cache first
    const cacheKey = `workspace:${workspacePath}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      res.set({
        'Cache-Control': 'private, max-age=300', // 5 minutes
        'X-Cache': 'HIT'
      });
      return res.json(cachedData);
    }

    // Start timing
    const startTime = Date.now();

    // Read projects directory
    const projectsPath = path.join(workspacePath, 'projects');
    const projects = [];

    try {
      const projectDirs = await fsAsync.readdir(projectsPath);
      console.log('Found directories in projects folder:', projectDirs);
      
      for (const projectName of projectDirs) {
        console.log('Checking project:', projectName);
        if (projectName.startsWith('.')) {
          console.log('Skipping hidden folder:', projectName);
          continue;
        }
        
        const projectPath = path.join(projectsPath, projectName);
        const stats = await fsAsync.stat(projectPath);
        
        if (stats.isDirectory()) {
          // Check for claudeflow.settings.json
          try {
            const settingsPath = path.join(projectPath, 'claudeflow.settings.json');
            const settingsContent = await fsAsync.readFile(settingsPath, 'utf-8');
            const settings = JSON.parse(settingsContent);
            
            if (settings.tracked === false) {
              console.log(`Skipping project ${projectName} - marked as not tracked`);
              continue;
            }
          } catch (err) {
            // No settings file or error reading it - continue normally
          }
          
          const project = {
            name: projectName,
            path: projectPath,
            repos: [],
            plans: {
              ideas: [],
              planned: [],
              active: [],
              completed: []
            }
          };

          // Read README.md and parse project details
          let readmeContent = '';
          try {
            const readmePath = path.join(projectPath, 'README.md');
            readmeContent = await fsAsync.readFile(readmePath, 'utf-8');
            project.readme = readmeContent;
          } catch (err) {
            // README is optional
          }

          // Parse project details from README
          const parsedDetails = parseProjectReadme(readmeContent);
          project.purpose = parsedDetails.purpose;
          project.repositories = parsedDetails.repositories;
          project.primaryRepoUrl = parsedDetails.primaryRepoUrl;

          // Read repos directory and enhance repository information
          const reposStartTime = Date.now();
          try {
            const reposPath = path.join(projectPath, 'repos');
            const repoDirs = await fsAsync.readdir(reposPath);
            
            for (const repoDir of repoDirs) {
              const match = repoDir.match(/^(.+)-(\d+)$/);
              if (match) {
                const repoPath = path.join(reposPath, repoDir);
                project.repos.push({
                  name: match[1],
                  number: parseInt(match[2]),
                  path: repoPath,
                  isAvailable: true // TODO: Read from REPOS.md
                });

                // Extract additional repo details
                const repoDetails = await extractRepoDetails(repoPath);
                
                // Try to find matching repository from README
                const repoName = match[1];
                let matchingRepo = project.repositories?.find(r => {
                  // Check for local development placeholder
                  if (r.url === 'local://development') {
                    return true;
                  }
                  const urlParts = r.url.split('/');
                  const urlRepoName = urlParts[urlParts.length - 1].replace('.git', '');
                  return urlRepoName.toLowerCase() === repoName.toLowerCase();
                });

                if (matchingRepo) {
                  // Enhance existing repo info with extracted details
                  Object.assign(matchingRepo, repoDetails);
                  // Update the URL if it was a placeholder or local
                  if (matchingRepo.url === 'local://development' || matchingRepo.url.startsWith('local://')) {
                    matchingRepo.url = repoDetails.url || `local://${repoName}`;
                  }
                } else if (project.repositories.length === 0) {
                  // No matching repo found, create new entry with extracted details
                  const newRepo = {
                    url: repoDetails.url || `local://${repoName}`,
                    ...repoDetails,
                    isPrimary: true
                  };
                  project.repositories.push(newRepo);
                  project.primaryRepoUrl = newRepo.url;
                }
              }
            }
          } catch (err) {
            // Repos directory might not exist
          }
          const reposElapsed = Date.now() - reposStartTime;
          console.log(`Repos scanned for ${project.name} in ${reposElapsed}ms`);

          // Read plans
          const plansStartTime = Date.now();
          const planTypes = ['ideas', 'planned', 'active', 'completed'];
          
          // Read all plan directories in parallel
          const planPromises = planTypes.map(async (planType) => {
            try {
              const plansPath = path.join(projectPath, 'plans', planType);
              const planFiles = await fsAsync.readdir(plansPath);
              
              // Read all files in this plan type in parallel
              const filePromises = planFiles
                .filter(planFile => planFile.endsWith('.md') && planFile !== 'TEMPLATE.md')
                .map(async (planFile) => {
                  const planPath = path.join(plansPath, planFile);
                  const content = await fsAsync.readFile(planPath, 'utf-8');
                  
                  const parsedWorkItem = parseWorkItemMarkdown(content);
                  return {
                    planType,
                    plan: {
                      name: planFile.replace('.md', ''),
                      path: planPath,
                      status: planType,
                      content: content,
                      workItem: parsedWorkItem
                    }
                  };
                });
              
              return Promise.all(filePromises);
            } catch (err) {
              // Plan directory might not exist
              return [];
            }
          });
          
          // Wait for all plan types to be read
          const allPlanResults = await Promise.all(planPromises);
          
          // Flatten and organize results by plan type
          allPlanResults.forEach(results => {
            results.forEach(({ planType, plan }) => {
              if (plan) {
                project.plans[planType].push(plan);
              }
            });
          });

          const plansElapsed = Date.now() - plansStartTime;
          console.log(`Plans read for ${project.name} in ${plansElapsed}ms`);
          
          console.log('Adding project:', project.name);
          projects.push(project);
        }
      }
    } catch (err) {
      console.error('Error reading projects directory:', err);
    }

    console.log('Total projects found:', projects.length);
    console.log('Project names:', projects.map(p => p.name));
    
    // Calculate elapsed time
    const elapsedTime = Date.now() - startTime;
    console.log(`Workspace scan completed in ${elapsedTime}ms`);
    
    // Cache the result
    const responseData = { projects };
    setCachedData(cacheKey, responseData);
    
    res.set({
      'Cache-Control': 'private, max-age=300', // 5 minutes
      'X-Cache': 'MISS'
    });
    res.json(responseData);

  } catch (error) {
    console.error('Error reading workspace:', error);
    res.status(500).json({ 
      error: 'Failed to read workspace',
      details: error.message 
    });
  }
});

// Read file content
app.post('/api/workspace/read-file', async (req, res) => {
  try {
    const { filePath } = req.body;
    
    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }
    
    try {
      const content = await fsAsync.readFile(filePath, 'utf-8');
      res.json({ content });
    } catch (readError) {
      // Special handling for claudeflow.settings.json
      if (filePath.endsWith('claudeflow.settings.json') && readError.code === 'ENOENT') {
        // File doesn't exist, create default settings
        const projectPath = path.dirname(filePath);
        const projectName = path.basename(projectPath);
        const defaultSettings = {
          version: '1.0.0',
          projectName: projectName,
          repositories: {},
          lastUpdated: new Date().toISOString()
        };
        
        // Ensure directory exists
        await fsAsync.mkdir(projectPath, { recursive: true });
        await fsAsync.writeFile(filePath, JSON.stringify(defaultSettings, null, 2));
        res.json({ content: JSON.stringify(defaultSettings, null, 2) });
      } else {
        throw readError;
      }
    }
    
  } catch (error) {
    console.error('Error reading file:', error);
    res.status(500).json({ 
      error: 'Failed to read file',
      details: error.message 
    });
  }
});

// Write file content
app.post('/api/workspace/write-file', async (req, res) => {
  try {
    const { filePath, content } = req.body;
    
    if (!filePath || content === undefined) {
      return res.status(400).json({ error: 'File path and content are required' });
    }
    
    await fsAsync.writeFile(filePath, content, 'utf-8');
    res.json({ success: true });
    
  } catch (error) {
    console.error('Error writing file:', error);
    res.status(500).json({ 
      error: 'Failed to write file',
      details: error.message 
    });
  }
});

// Create workspace structure
app.post('/api/workspace/create', async (req, res) => {
  try {
    const { workspacePath } = req.body;
    
    if (!workspacePath) {
      return res.status(400).json({ error: 'Workspace path is required' });
    }

    // Create basic workspace structure
    const dirs = [
      workspacePath,
      path.join(workspacePath, 'projects')
    ];

    for (const dir of dirs) {
      await fsAsync.mkdir(dir, { recursive: true });
    }

    // Check if .template folder exists, create it if not
    const templatePath = path.join(workspacePath, 'projects', '.template');
    try {
      await fsAsync.access(templatePath);
      console.log('.template folder already exists, skipping creation');
    } catch (err) {
      // .template doesn't exist, create it
      console.log('Creating .template folder structure');
      
      const templateDirs = [
        templatePath,
        path.join(templatePath, 'repos'),
        path.join(templatePath, 'plans'),
        path.join(templatePath, 'plans', 'ideas'),
        path.join(templatePath, 'plans', 'planned'),
        path.join(templatePath, 'plans', 'active'),
        path.join(templatePath, 'plans', 'completed')
      ];

      for (const dir of templateDirs) {
        await fsAsync.mkdir(dir, { recursive: true });
      }

      // Create template files
      const templateReadme = `# Project Name

## Description
Brief description of the project.

## Repository
- **URL**: [Repository URL]
- **Type**: [GitHub/ADO]

## Goals
- Goal 1
- Goal 2
`;

      const templateRepos = `# Repository usage

## Repository information
- **URL**: [https://github.com/org/repo or https://dev.azure.com/org/project/_git/repo]
- **Type**: [GitHub/ADO]
- **Access**: [Public/Private]

## Available clones
- repo-name-1: Available

## Active work
`;

      const templatePlan = `# Work Item Title

## Status
idea

## Description
Describe the work item here.

## Goals
- [ ] Goal 1
- [ ] Goal 2

## Tasks
1. Task 1
2. Task 2

## Acceptance Criteria
- Criteria 1
- Criteria 2
`;

      await fsAsync.writeFile(
        path.join(templatePath, 'README.md'),
        templateReadme
      );

      await fsAsync.writeFile(
        path.join(templatePath, 'REPOS.md'),
        templateRepos
      );

      await fsAsync.writeFile(
        path.join(templatePath, 'plans', 'ideas', 'TEMPLATE.md'),
        templatePlan
      );
    }

    // Create STATUS.md at workspace root if it doesn't exist
    const statusPath = path.join(workspacePath, 'STATUS.md');
    try {
      await fsAsync.access(statusPath);
    } catch (err) {
      const statusMd = `# Project status

## Items needing attention

### Pull requests
<!-- List active PRs here -->

### Pending items
<!-- List items needing immediate attention -->

## Active projects

<!-- List active projects and their current work -->

## Upcoming work

<!-- List planned work items -->
`;

      await fsAsync.writeFile(statusPath, statusMd);
    }
    
    res.json({ success: true, message: 'Workspace created successfully' });

  } catch (error) {
    console.error('Error creating workspace:', error);
    res.status(500).json({ 
      error: 'Failed to create workspace',
      details: error.message 
    });
  }
});

// Create a new project folder structure
app.post('/api/workspace/create-project', async (req, res) => {
  try {
    const { workspacePath, projectName } = req.body;
    
    if (!workspacePath || !projectName) {
      return res.status(400).json({ error: 'Workspace path and project name are required' });
    }

    // Sanitize project name for folder
    const folderName = projectName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Remove multiple hyphens
      .trim();

    const projectPath = path.join(workspacePath, 'projects', folderName);
    
    // Check if project folder already exists
    try {
      await fsAsync.access(projectPath);
      return res.status(409).json({ error: 'Project folder already exists' });
    } catch (err) {
      // Folder doesn't exist, continue
    }

    // Create project folder structure
    const dirs = [
      projectPath,
      path.join(projectPath, 'repos'),
      path.join(projectPath, 'plans'),
      path.join(projectPath, 'plans', 'ideas'),
      path.join(projectPath, 'plans', 'planned'),
      path.join(projectPath, 'plans', 'active'),
      path.join(projectPath, 'plans', 'completed')
    ];

    for (const dir of dirs) {
      await fsAsync.mkdir(dir, { recursive: true });
    }

    // Create README.md
    const readmeContent = `# ${projectName}

## Description
${projectName} project created via UI.

## Repository
- **URL**: To be added
- **Type**: GitHub
- **Access**: Private

## Goals
- To be defined
`;

    await fsAsync.writeFile(
      path.join(projectPath, 'README.md'),
      readmeContent
    );

    // Create REPOS.md
    const reposContent = `# Repository usage

## Repository information
- **URL**: To be added
- **Type**: GitHub
- **Access**: Private

## Available clones

## Active work
`;

    await fsAsync.writeFile(
      path.join(projectPath, 'REPOS.md'),
      reposContent
    );

    res.json({ 
      success: true, 
      path: projectPath,
      folderName: folderName
    });

  } catch (error) {
    console.error('Error creating project folder:', error);
    res.status(500).json({ 
      error: 'Failed to create project folder',
      details: error.message 
    });
  }
});

// Clone a GitHub repository
app.post('/api/workspace/clone-repo', async (req, res) => {
  try {
    const { projectPath, repoUrl, repoName } = req.body;
    
    if (!projectPath || !repoUrl || !repoName) {
      return res.status(400).json({ error: 'Project path, repository URL, and repository name are required' });
    }

    // Sanitize repo name for folder
    const folderName = repoName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Remove multiple hyphens
      .trim();

    // Find next available number
    const reposPath = path.join(projectPath, 'repos');
    let repoNumber = 1;
    
    try {
      await fsAsync.mkdir(reposPath, { recursive: true });
      const existingRepos = await fsAsync.readdir(reposPath);
      
      // Find existing repos with this name
      const repoPattern = new RegExp(`^${folderName}-(\\d+)$`);
      const numbers = existingRepos
        .map(dir => {
          const match = dir.match(repoPattern);
          return match ? parseInt(match[1]) : 0;
        })
        .filter(n => n > 0);
      
      if (numbers.length > 0) {
        repoNumber = Math.max(...numbers) + 1;
      }
    } catch (err) {
      // Repos directory doesn't exist yet
    }

    const repoFolderName = `${folderName}-${repoNumber}`;
    const repoPath = path.join(reposPath, repoFolderName);

    console.log(`Cloning repository ${repoUrl} to ${repoPath}`);

    // Clone the repository
    try {
      const { stdout, stderr } = await execAsync(`git clone "${repoUrl}" "${repoPath}"`, {
        cwd: reposPath
      });
      
      console.log('Clone output:', stdout);
      if (stderr) console.log('Clone stderr:', stderr);
      
      // Update REPOS.md to track the new clone
      const reposmdPath = path.join(projectPath, 'REPOS.md');
      try {
        let reposContent = await fsAsync.readFile(reposmdPath, 'utf-8');
        
        // Update repository information if it's generic
        if (reposContent.includes('To be added')) {
          reposContent = reposContent.replace(
            /- \*\*URL\*\*: To be added/,
            `- **URL**: ${repoUrl}`
          );
        }
        
        // Add to available clones
        const availableSection = reposContent.indexOf('## Available clones');
        if (availableSection !== -1) {
          const activeSection = reposContent.indexOf('## Active work');
          const insertPos = activeSection !== -1 ? activeSection : reposContent.length;
          
          const beforeActive = reposContent.substring(0, insertPos);
          const afterActive = activeSection !== -1 ? reposContent.substring(activeSection) : '';
          
          // Check if there are already clones listed
          const hasClones = beforeActive.includes(`${folderName}-`);
          if (!hasClones) {
            // Replace the section with the new clone
            reposContent = beforeActive.trimEnd() + `\n- ${repoFolderName}: Available\n\n` + afterActive;
          } else {
            // Add to existing list
            reposContent = beforeActive.trimEnd() + `\n- ${repoFolderName}: Available` + afterActive;
          }
        }
        
        await fsAsync.writeFile(reposmdPath, reposContent);
      } catch (err) {
        console.log('Could not update REPOS.md:', err.message);
      }
      
      res.json({ 
        success: true, 
        repoPath,
        repoFolderName,
        message: 'Repository cloned successfully'
      });
      
    } catch (cloneError) {
      console.error('Git clone error:', cloneError);
      return res.status(500).json({ 
        error: 'Failed to clone repository',
        details: cloneError.message,
        suggestion: 'Please ensure the repository URL is correct and you have access to it'
      });
    }

  } catch (error) {
    console.error('Error in clone-repo endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to process clone request',
      details: error.message 
    });
  }
});

// Extract project details from cloned repository
app.post('/api/workspace/extract-repo-details', async (req, res) => {
  try {
    const { repoPath } = req.body;
    
    if (!repoPath) {
      return res.status(400).json({ error: 'Repository path is required' });
    }

    const details = {
      description: '',
      purpose: '',
      isPrivate: true,
      technologies: [],
      scripts: {}
    };

    // Try to read package.json
    try {
      const packageJsonPath = path.join(repoPath, 'package.json');
      const packageContent = await fsAsync.readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(packageContent);
      
      if (packageJson.description) {
        details.description = packageJson.description;
      }
      
      if (packageJson.private === false) {
        details.isPrivate = false;
      }
      
      // Extract dependencies to determine technologies
      const deps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };
      
      if (deps.react) details.technologies.push('React');
      if (deps.vue) details.technologies.push('Vue');
      if (deps.angular) details.technologies.push('Angular');
      if (deps.typescript) details.technologies.push('TypeScript');
      if (deps.express) details.technologies.push('Express');
      if (deps.next) details.technologies.push('Next.js');
      if (deps.vite) details.technologies.push('Vite');
      if (deps.webpack) details.technologies.push('Webpack');
      
      // Extract useful scripts
      if (packageJson.scripts) {
        details.scripts = packageJson.scripts;
      }
      
    } catch (err) {
      console.log('No package.json found or error reading it:', err.message);
    }

    // Try to read README.md
    try {
      const readmePath = path.join(repoPath, 'README.md');
      const readmeContent = await fsAsync.readFile(readmePath, 'utf-8');
      
      // Extract description if not already found
      if (!details.description) {
        // Look for description in first paragraph
        const firstParagraph = readmeContent.split('\n\n')[1]; // Skip title
        if (firstParagraph && !firstParagraph.startsWith('#')) {
          details.description = firstParagraph.replace(/\n/g, ' ').trim();
          // Limit to reasonable length
          if (details.description.length > 200) {
            details.description = details.description.substring(0, 197) + '...';
          }
        }
      }
      
      // Extract purpose/about section
      const purposeMatch = readmeContent.match(/##?\s*(Purpose|About|Overview|What is|Description)\s*\n+([\s\S]*?)(?=\n#|\n\n#|$)/i);
      if (purposeMatch) {
        const purposeText = purposeMatch[2].trim();
        const firstPurposeParagraph = purposeText.split('\n\n')[0];
        details.purpose = firstPurposeParagraph.replace(/\n/g, ' ').trim();
        // Limit to reasonable length
        if (details.purpose.length > 300) {
          details.purpose = details.purpose.substring(0, 297) + '...';
        }
      }
      
    } catch (err) {
      console.log('No README.md found or error reading it:', err.message);
    }

    // Set default description if none found
    if (!details.description) {
      details.description = 'Repository imported from GitHub';
    }

    res.json(details);

  } catch (error) {
    console.error('Error extracting repo details:', error);
    res.status(500).json({ 
      error: 'Failed to extract repository details',
      details: error.message 
    });
  }
});

// Update project README with extracted details
app.post('/api/workspace/update-project-readme', async (req, res) => {
  try {
    const { projectPath, projectName, description, purpose, repositories, technologies, scripts } = req.body;
    
    if (!projectPath || !projectName) {
      return res.status(400).json({ error: 'Project path and name are required' });
    }

    // Generate README content
    let readmeContent = `# ${projectName}

## Description
${description || 'Project imported from GitHub.'}
`;

    if (purpose) {
      readmeContent += `
## Purpose
${purpose}
`;
    }

    if (technologies && technologies.length > 0) {
      readmeContent += `
## Technologies
${technologies.map(tech => `- ${tech}`).join('\n')}
`;
    }

    if (repositories && repositories.length > 0) {
      readmeContent += `
## Repository
`;
      repositories.forEach(repo => {
        readmeContent += `- **URL**: ${repo.url}
- **Type**: ${repo.type === 'github' ? 'GitHub' : 'Azure DevOps'}
- **Access**: ${repo.visibility === 'public' ? 'Public' : 'Private'}
`;
        if (!repo.isPrimary && repositories.length > 1) {
          readmeContent += `- **Primary**: No\n`;
        }
      });
    }

    if (scripts && Object.keys(scripts).length > 0) {
      const importantScripts = ['start', 'dev', 'build', 'test', 'lint'];
      const relevantScripts = Object.entries(scripts)
        .filter(([key]) => importantScripts.includes(key))
        .slice(0, 5); // Limit to 5 most important scripts
      
      if (relevantScripts.length > 0) {
        readmeContent += `
## Available Scripts
`;
        relevantScripts.forEach(([key, value]) => {
          readmeContent += `- \`npm run ${key}\`: ${value}\n`;
        });
      }
    }

    readmeContent += `
## Goals
- Successfully integrate and maintain the project
- Extend functionality as needed
- Maintain code quality and test coverage
`;

    // Write the README file
    const readmePath = path.join(projectPath, 'README.md');
    await fsAsync.writeFile(readmePath, readmeContent);

    res.json({ 
      success: true, 
      path: readmePath,
      message: 'Project README updated successfully'
    });

  } catch (error) {
    console.error('Error updating project README:', error);
    res.status(500).json({ 
      error: 'Failed to update project README',
      details: error.message 
    });
  }
});

// Hide project by creating claudeflow.settings.json
app.post('/api/projects/:projectId/hide', async (req, res) => {
  console.log('=== HIDE PROJECT ENDPOINT CALLED ===');
  console.log('Project ID:', req.params.projectId);
  
  try {
    const { projectId } = req.params;
    
    // Get workspace path from query or find it from the workspace endpoint
    const workspacePath = req.query.workspacePath || process.env.WORKSPACE_PATH;
    
    if (!workspacePath) {
      return res.status(400).json({ error: 'Workspace path is required' });
    }
    
    // The projectId is now the project name (folder name)
    const projectName = decodeURIComponent(projectId);
    const projectsPath = path.join(workspacePath, 'projects');
    const projectPath = path.join(projectsPath, projectName);
    
    // Check if project exists
    try {
      await fsAsync.access(projectPath);
    } catch (err) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Create claudeflow.settings.json
    const settingsPath = path.join(projectPath, 'claudeflow.settings.json');
    const settings = {
      tracked: false
    };
    
    await fsAsync.writeFile(settingsPath, JSON.stringify(settings, null, 2));
    
    console.log(`Created claudeflow.settings.json at: ${settingsPath}`);
    res.json({ 
      success: true, 
      path: settingsPath,
      message: 'Project hidden successfully'
    });
    
  } catch (error) {
    console.error('Error hiding project:', error);
    res.status(500).json({ 
      error: 'Failed to hide project',
      details: error.message 
    });
  }
});

// Remove project folder
app.post('/api/projects/:projectId/remove', async (req, res) => {
  console.log('=== REMOVE PROJECT ENDPOINT CALLED ===');
  console.log('Project ID:', req.params.projectId);
  
  try {
    const { projectId } = req.params;
    
    // Get workspace path from query or find it from the workspace endpoint
    const workspacePath = req.query.workspacePath || process.env.WORKSPACE_PATH;
    
    if (!workspacePath) {
      return res.status(400).json({ error: 'Workspace path is required' });
    }
    
    // The projectId is now the project name (folder name)
    const projectName = decodeURIComponent(projectId);
    const projectsPath = path.join(workspacePath, 'projects');
    const projectPath = path.join(projectsPath, projectName);
    
    // Check if project exists
    try {
      await fsAsync.access(projectPath);
    } catch (err) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Remove the project folder
    await fsAsync.rm(projectPath, { recursive: true, force: true });
    
    console.log(`Removed project folder at: ${projectPath}`);
    res.json({ 
      success: true, 
      message: 'Project folder removed successfully'
    });
    
  } catch (error) {
    console.error('Error removing project:', error);
    res.status(500).json({ 
      error: 'Failed to remove project',
      details: error.message 
    });
  }
});

// Create work item markdown file
app.post('/api/workspace/create-workitem', async (req, res) => {
  console.log('=== CREATE WORK ITEM ENDPOINT CALLED ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { workspacePath, projectPath, workItem, tasks } = req.body;
    
    if (!workspacePath || !projectPath || !workItem) {
      console.error('Missing required fields:', { workspacePath: !!workspacePath, projectPath: !!projectPath, workItem: !!workItem });
      return res.status(400).json({ error: 'Workspace path, project path, and work item are required' });
    }

    // Generate a kebab-case filename from the work item title
    const filename = workItem.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Remove multiple hyphens
      .trim();

    // Always save to planned folder when creating work items
    const planPath = path.join(projectPath, 'plans', 'planned');
    
    // Ensure the plans directory structure exists
    await fsAsync.mkdir(planPath, { recursive: true });

    // Format the markdown content using TEMPLATE.md structure
    const markdownContent = `# ${workItem.title}

## Status
planned

## Description
${workItem.description || 'No description provided.'}

## Overall Goals
${tasks && tasks.length > 0 ? 
  // Extract unique goals from all tasks
  [...new Set(tasks.flatMap(task => task.goals || []))]
    .map(goal => `- [ ] ${goal}`)
    .join('\n') 
  : '- [ ] Complete implementation\n- [ ] Add tests'}

## Tasks

${tasks && tasks.length > 0 ? 
  tasks.map(task => {
    const taskNum = task.taskNumber || '1';
    return `### Task ${taskNum}: ${task.title}
**Description:** ${task.description || 'No description provided.'}

**Goals:**
${(task.goals || []).map(goal => `- [ ] ${goal}`).join('\n') || '- [ ] Complete this task'}

**Work Description:**
${task.workDescription || 'No work description provided.'}

**Acceptance Criteria:**
${(task.validationCriteria || []).map(criteria => `- ${criteria}`).join('\n') || '- Task completed successfully'}`;
  }).join('\n\n') 
  : `### Task 1: Implement the feature
**Description:** Implement the main feature functionality.

**Goals:**
- [ ] Complete implementation

**Work Description:**
To be determined during implementation.

**Acceptance Criteria:**
- Feature works as expected`}

## Metadata
\`\`\`json
${JSON.stringify({ workItemId: workItem.id, tasks: tasks || [] }, null, 2)}
\`\`\`
`;

    // Write the markdown file
    const filePath = path.join(planPath, `${filename}.md`);
    await fsAsync.writeFile(filePath, markdownContent);

    console.log(`Created work item markdown at: ${filePath}`);
    res.json({ 
      success: true, 
      path: filePath,
      filename: `${filename}.md`
    });

  } catch (error) {
    console.error('Error creating work item markdown:', error);
    res.status(500).json({ 
      error: 'Failed to create work item markdown',
      details: error.message 
    });
  }
});

// Update work item markdown file
app.post('/api/workspace/update-workitem', async (req, res) => {
  console.log('=== UPDATE WORK ITEM ENDPOINT CALLED ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { workspacePath, projectPath, workItem, tasks, originalFilename } = req.body;
    
    if (!workspacePath || !projectPath || !workItem) {
      console.error('Missing required fields:', { workspacePath: !!workspacePath, projectPath: !!projectPath, workItem: !!workItem });
      return res.status(400).json({ error: 'Workspace path, project path, and work item are required' });
    }

    // Find the existing markdown file
    let existingFilePath = null;
    
    if (originalFilename) {
      // If we know the original filename, use it
      existingFilePath = path.join(projectPath, 'plans', 'planned', originalFilename);
    } else {
      // Otherwise, try to find it by work item ID
      const planTypes = ['ideas', 'planned', 'active', 'completed'];
      for (const planType of planTypes) {
        const planDir = path.join(projectPath, 'plans', planType);
        try {
          const files = await fsAsync.readdir(planDir);
          for (const file of files) {
            if (file.endsWith('.md')) {
              const filePath = path.join(planDir, file);
              const content = await fsAsync.readFile(filePath, 'utf-8');
              
              // Check if this file contains the work item ID in metadata
              const metadataMatch = content.match(/## Metadata\s*\n+```json\n([\s\S]*?)\n```/i);
              if (metadataMatch) {
                try {
                  const metadata = JSON.parse(metadataMatch[1]);
                  if (metadata.workItemId === workItem.id) {
                    existingFilePath = filePath;
                    break;
                  }
                } catch (err) {
                  // Invalid JSON, skip
                }
              }
            }
          }
          if (existingFilePath) break;
        } catch (err) {
          // Directory doesn't exist, continue
        }
      }
    }

    if (!existingFilePath) {
      console.error('Could not find existing markdown file for work item:', workItem.id);
      return res.status(404).json({ error: 'Work item markdown file not found' });
    }

    console.log('Updating markdown file at:', existingFilePath);

    // Generate a new filename from the updated title
    const newFilename = workItem.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Remove multiple hyphens
      .trim() + '.md';

    const newFilePath = path.join(path.dirname(existingFilePath), newFilename);

    // Format the markdown content using TEMPLATE.md structure
    const markdownContent = `# ${workItem.title}

## Status
${workItem.status || 'planned'}

## Description
${workItem.description || 'No description provided.'}

## Overall Goals
${tasks && tasks.length > 0 ? 
  // Extract unique goals from all tasks
  [...new Set(tasks.flatMap(task => task.goals || []))]
    .map(goal => `- [ ] ${goal}`)
    .join('\n') 
  : '- [ ] Complete implementation\n- [ ] Add tests'}

## Tasks

${tasks && tasks.length > 0 ? 
  tasks.map(task => {
    const taskNum = task.taskNumber || '1';
    return `### Task ${taskNum}: ${task.title}
**Description:** ${task.description || 'No description provided.'}

**Goals:**
${(task.goals || []).map(goal => `- [ ] ${goal}`).join('\n') || '- [ ] Complete this task'}

**Work Description:**
${task.workDescription || 'No work description provided.'}

**Acceptance Criteria:**
${(task.validationCriteria || []).map(criteria => `- ${criteria}`).join('\n') || '- Task completed successfully'}`;
  }).join('\n\n') 
  : `### Task 1: Implement the feature
**Description:** Implement the main feature functionality.

**Goals:**
- [ ] Complete implementation

**Work Description:**
To be determined during implementation.

**Acceptance Criteria:**
- Feature works as expected`}

## Metadata
\`\`\`json
${JSON.stringify({ workItemId: workItem.id, tasks: tasks || [] }, null, 2)}
\`\`\`
`;

    // Write the updated content
    await fsAsync.writeFile(existingFilePath, markdownContent);

    // If the filename changed, rename the file
    if (existingFilePath !== newFilePath && path.basename(existingFilePath) !== newFilename) {
      try {
        await fsAsync.rename(existingFilePath, newFilePath);
        console.log(`Renamed file from ${path.basename(existingFilePath)} to ${newFilename}`);
      } catch (err) {
        console.error('Error renaming file:', err);
        // If rename fails, keep the old filename
      }
    }

    console.log(`Updated work item markdown at: ${newFilePath || existingFilePath}`);
    res.json({ 
      success: true, 
      path: newFilePath || existingFilePath,
      filename: path.basename(newFilePath || existingFilePath)
    });

  } catch (error) {
    console.error('Error updating work item markdown:', error);
    res.status(500).json({ 
      error: 'Failed to update work item markdown',
      details: error.message 
    });
  }
});

// Update project REPOS.md with correct repository information
app.post('/api/workspace/update-repos-md', async (req, res) => {
  console.log('=== UPDATE-REPOS-MD CALLED ===');
  console.log('Caller:', req.headers.referer || 'Unknown');
  console.log('Project path:', req.body.projectPath);
  console.log('Stack trace:', new Error().stack);
  
  try {
    const { projectPath, repositories } = req.body;
    
    if (!projectPath || !repositories || !Array.isArray(repositories)) {
      return res.status(400).json({ error: 'Project path and repositories array are required' });
    }

    const reposPath = path.join(projectPath, 'REPOS.md');
    
    // Check if REPOS.md already exists
    try {
      await fsAsync.access(reposPath);
      console.log('REPOS.md already exists at:', reposPath);
    } catch (err) {
      console.log('REPOS.md does not exist, will create new one');
    }
    
    // Generate REPOS.md content
    let content = '# Repository usage\n\n';
    content += '## Repository information\n';
    
    // Get the primary repo or first repo
    const primaryRepo = repositories.find(r => r.isPrimary) || repositories[0];
    if (primaryRepo) {
      content += `- **URL**: ${primaryRepo.url}\n`;
      content += `- **Type**: ${primaryRepo.type.charAt(0).toUpperCase() + primaryRepo.type.slice(1)}\n`;
      content += `- **Access**: ${primaryRepo.visibility.charAt(0).toUpperCase() + primaryRepo.visibility.slice(1)}\n`;
      
      if (primaryRepo.description) {
        content += `- **Description**: ${primaryRepo.description}\n`;
      }
      if (primaryRepo.defaultBranch) {
        content += `- **Default Branch**: ${primaryRepo.defaultBranch}\n`;
      }
      if (primaryRepo.isFork) {
        content += `- **Fork**: Yes (parent: ${primaryRepo.parent.url})\n`;
      }
    }
    
    content += '\n## Available clones\n';
    
    // Read existing REPOS.md to preserve statuses
    let existingStatuses = new Map();
    try {
      const existingContent = await fsAsync.readFile(reposPath, 'utf-8');
      const lines = existingContent.split('\n');
      lines.forEach((line, index) => {
        const match = line.match(/^- (.+): (.+)$/);
        if (match) {
          console.log(`Line ${index}: "${line}" -> Repo: "${match[1]}", Status: "${match[2]}"`);
          existingStatuses.set(match[1], match[2]);
        } else if (line.trim().startsWith('-')) {
          console.log(`Line ${index}: "${line}" -> NO MATCH (but starts with -)`);
        }
      });
      console.log('Existing REPOS.md content:');
      console.log(existingContent);
      console.log('Preserving existing repo statuses:', Array.from(existingStatuses.entries()));
    } catch (err) {
      // REPOS.md might not exist yet
      console.log('No existing REPOS.md to preserve statuses from:', err.message);
    }
    
    // Read existing repos directory to list clones
    try {
      const reposDir = path.join(projectPath, 'repos');
      const repoDirs = await fsAsync.readdir(reposDir);
      
      for (const repoDir of repoDirs) {
        const match = repoDir.match(/^(.+)-(\d+)$/);
        if (match) {
          // Preserve existing status or default to Available
          const status = existingStatuses.get(repoDir) || 'Available';
          console.log(`Repo: ${repoDir}, Status from map: ${existingStatuses.get(repoDir)}, Final status: ${status}`);
          content += `- ${repoDir}: ${status}\n`;
        }
      }
    } catch (err) {
      // Repos directory might not exist
    }
    
    content += '\n## Active work\n';
    content += '- None currently\n';
    
    content += '\n## Notes\n';
    if (primaryRepo && primaryRepo.description) {
      content += primaryRepo.description + '\n';
    } else {
      content += 'Project repository information extracted from git configuration.\n';
    }

    // Write the file
    console.log('Writing new REPOS.md content:');
    console.log(content);
    await fsAsync.writeFile(reposPath, content, 'utf-8');
    
    res.json({ 
      success: true, 
      path: reposPath,
      message: 'REPOS.md updated successfully'
    });

  } catch (error) {
    console.error('Error updating REPOS.md:', error);
    res.status(500).json({ 
      error: 'Failed to update REPOS.md',
      details: error.message 
    });
  }
});

// Add new repository to project
app.post('/api/workspace/add-repository', async (req, res) => {
  try {
    const { projectPath, repositoryUrl } = req.body;
    
    if (!projectPath || !repositoryUrl) {
      return res.status(400).json({ error: 'Project path and repository URL are required' });
    }

    // Read current README.md
    const readmePath = path.join(projectPath, 'README.md');
    let readmeContent = '';
    try {
      readmeContent = await fsAsync.readFile(readmePath, 'utf-8');
    } catch (err) {
      console.log('No existing README.md, will create one');
    }

    // Parse repository information from URL
    const repoInfo = {
      url: repositoryUrl,
      type: repositoryUrl.includes('github.com') ? 'github' : 'ado',
      visibility: 'private', // Default to private
    };

    // Extract repo name from URL
    const repoName = repositoryUrl.split('/').pop()?.replace('.git', '') || 'unknown';

    // Update README.md to add new repository
    if (readmeContent) {
      // Find repository section
      const repoSectionMatch = readmeContent.match(/##?\s*(?:Repository|Repositories)\s*\n([\s\S]*?)(?=\n##|$)/i);
      
      if (repoSectionMatch) {
        // Add to existing repository section
        const updatedSection = repoSectionMatch[0] + 
          `\n### Additional Repository: ${repoName}\n` +
          `- **URL**: ${repoInfo.url}\n` +
          `- **Type**: ${repoInfo.type === 'github' ? 'GitHub' : 'Azure DevOps'}\n` +
          `- **Access**: ${repoInfo.visibility === 'public' ? 'Public' : 'Private'}\n`;
        
        readmeContent = readmeContent.replace(repoSectionMatch[0], updatedSection);
      } else {
        // Add new repository section
        readmeContent += `\n## Repositories\n\n`;
        readmeContent += `### ${repoName}\n`;
        readmeContent += `- **URL**: ${repoInfo.url}\n`;
        readmeContent += `- **Type**: ${repoInfo.type === 'github' ? 'GitHub' : 'Azure DevOps'}\n`;
        readmeContent += `- **Access**: ${repoInfo.visibility === 'public' ? 'Public' : 'Private'}\n`;
      }
    } else {
      // Create new README
      const projectName = path.basename(projectPath);
      readmeContent = `# ${projectName}\n\n`;
      readmeContent += `## Description\n\nProject with multiple repositories.\n\n`;
      readmeContent += `## Repositories\n\n`;
      readmeContent += `### ${repoName}\n`;
      readmeContent += `- **URL**: ${repoInfo.url}\n`;
      readmeContent += `- **Type**: ${repoInfo.type === 'github' ? 'GitHub' : 'Azure DevOps'}\n`;
      readmeContent += `- **Access**: ${repoInfo.visibility === 'public' ? 'Public' : 'Private'}\n`;
    }

    // Write updated README
    await fsAsync.writeFile(readmePath, readmeContent);

    // Update REPOS.md to include new repository info
    const reposPath = path.join(projectPath, 'REPOS.md');
    let reposContent = '';
    
    try {
      reposContent = await fsAsync.readFile(reposPath, 'utf-8');
      
      // Update repository information section
      const infoSection = reposContent.match(/##\s*Repository\s+information\s*\n([\s\S]*?)(?=\n##|$)/);
      if (infoSection) {
        // Check if this is the first additional repo
        const hasMultipleRepos = infoSection[1].includes('Additional repositories:');
        
        if (!hasMultipleRepos) {
          // Add "Additional repositories:" section
          const updatedInfo = infoSection[0].trimEnd() + '\n\n### Additional repositories:\n' +
            `- **${repoName}**: ${repoInfo.url}\n`;
          reposContent = reposContent.replace(infoSection[0], updatedInfo);
        } else {
          // Add to existing additional repos
          const updatedInfo = infoSection[0].trimEnd() + 
            `- **${repoName}**: ${repoInfo.url}\n`;
          reposContent = reposContent.replace(infoSection[0], updatedInfo);
        }
      }
      
      await fsAsync.writeFile(reposPath, reposContent);
    } catch (err) {
      console.log('Could not update REPOS.md:', err.message);
    }

    // Invalidate cache
    invalidateCache(`project-details:${projectPath}`);
    invalidateCache(`workspace:`);

    res.json({ 
      success: true,
      message: 'Repository added to project successfully',
      repository: repoInfo
    });

  } catch (error) {
    console.error('Error adding repository to project:', error);
    res.status(500).json({ 
      error: 'Failed to add repository to project',
      details: error.message 
    });
  }
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test endpoint works' });
});

// Endpoint to handle work item deletion/discarding
app.post('/api/work-items/delete', async (req, res) => {
  console.log('DELETE ENDPOINT HIT - body:', req.body);
  try {
    const { markdownPath, permanentDelete } = req.body;
    
    if (!markdownPath) {
      return res.status(400).json({ error: 'Markdown path is required' });
    }
    
    // Handle both absolute and relative paths
    let fullPath;
    if (path.isAbsolute(markdownPath)) {
      fullPath = markdownPath;
    } else {
      fullPath = path.join(process.cwd(), '..', markdownPath);
    }
    
    console.log('Checking path:', fullPath);
    
    // Check if file exists
    try {
      await fsAsync.access(fullPath);
    } catch (err) {
      console.error('File not found:', fullPath);
      return res.status(404).json({ error: 'Markdown file not found' });
    }
    
    if (permanentDelete) {
      // Permanently delete the file
      await fsAsync.unlink(fullPath);
      
      // Invalidate cache after permanent deletion
      const pathParts = fullPath.split(path.sep);
      const plansIndex = pathParts.lastIndexOf('plans');
      const projectPath = pathParts.slice(0, plansIndex).join(path.sep);
      const workspacePath = projectPath.split(path.sep).slice(0, -2).join(path.sep);
      invalidateCache(`workspace-light:${workspacePath}`);
      invalidateCache(`project-details:${projectPath}`);
      invalidateCache(`workspace:${workspacePath}`);
      
      res.json({ 
        success: true, 
        message: 'Work item markdown permanently deleted' 
      });
    } else {
      // Move to discarded folder
      const pathParts = fullPath.split(path.sep);
      const plansIndex = pathParts.lastIndexOf('plans');
      
      if (plansIndex === -1) {
        return res.status(400).json({ error: 'Invalid markdown path structure' });
      }
      
      // Build the discarded folder path
      const discardedPath = [...pathParts.slice(0, plansIndex + 1), 'discarded'].join(path.sep);
      
      // Ensure discarded folder exists
      await fsAsync.mkdir(discardedPath, { recursive: true });
      
      // Get filename and create destination path
      const filename = path.basename(fullPath);
      const destPath = path.join(discardedPath, filename);
      
      // Move the file
      await fsAsync.rename(fullPath, destPath);
      
      res.json({ 
        success: true, 
        message: 'Work item moved to discarded folder',
        newPath: path.relative(path.join(process.cwd(), '..'), destPath)
      });
    }
    
    // Invalidate cache after successful deletion/move
    const projectPath = fullPath.split(path.sep).slice(0, pathParts.lastIndexOf('plans')).join(path.sep);
    const workspacePath = projectPath.split(path.sep).slice(0, -2).join(path.sep);
    invalidateCache(`workspace-light:${workspacePath}`);
    invalidateCache(`project-details:${projectPath}`);
    invalidateCache(`workspace:${workspacePath}`);
    
  } catch (error) {
    console.error('Error deleting/discarding work item:', error);
    res.status(500).json({ 
      error: 'Failed to delete/discard work item',
      details: error.message 
    });
  }
});

// Claude API endpoints for jam sessions
app.post('/api/claude/analyze-document', async (req, res) => {
  try {
    const { content, workItemTitle, workItemDescription, userName, personaName, personaGender } = req.body;
    
    if (!content || !workItemTitle) {
      return res.status(400).json({ error: 'Content and work item title are required' });
    }
    
    const result = await claudeService.analyzeDocument(
      content, 
      workItemTitle, 
      workItemDescription, 
      userName || 'there',
      personaName,
      personaGender
    );
    res.json(result);
    
  } catch (error) {
    console.error('Error analyzing document:', error);
    res.status(500).json({ 
      error: 'Failed to analyze document',
      details: error.message 
    });
  }
});

app.post('/api/claude/analyze-work', async (req, res) => {
  try {
    const { workDescription } = req.body;
    
    if (!workDescription) {
      return res.status(400).json({ error: 'Work description is required' });
    }
    
    const result = await claudeService.analyzeWorkDescription(workDescription);
    res.json(result);
    
  } catch (error) {
    console.error('Error analyzing work description:', error);
    res.status(500).json({ 
      error: 'Failed to analyze work description',
      details: error.message 
    });
  }
});

app.post('/api/claude/chat', async (req, res) => {
  try {
    const { messages, userMessage, persona, documentContent, workItem } = req.body;
    
    if (!userMessage || !persona || !documentContent) {
      return res.status(400).json({ error: 'User message, persona, and document content are required' });
    }
    
    console.log('Chat endpoint - messages count:', messages?.length || 0, 'user message:', userMessage?.substring(0, 50));
    
    const result = await claudeService.chat(messages, userMessage, persona, documentContent, workItem);
    
    // Validate the result before sending
    if (!result || typeof result !== 'object') {
      console.error('Invalid result from chat service:', result);
      return res.status(500).json({ 
        error: 'Invalid response from chat service',
        type: 'message',
        response: 'I encountered an error processing your message. Please try again.'
      });
    }
    
    console.log('Chat response:', { 
      type: result.type, 
      action: result.action,
      hasDocumentEdit: !!result.documentEdit,
      responseLength: result.response?.length,
      documentEditLength: result.documentEdit?.length 
    });
    
    res.json(result);
    
  } catch (error) {
    console.error('Error in chat:', error);
    res.status(500).json({ 
      error: 'Failed to process chat message',
      details: error.message 
    });
  }
});

app.post('/api/claude/apply-changes', async (req, res) => {
  try {
    const { currentContent, previousSuggestion, persona, workItem } = req.body;
    
    if (!currentContent || !previousSuggestion) {
      return res.status(400).json({ error: 'Current content and previous suggestion are required' });
    }
    
    const result = await claudeService.applyChanges(currentContent, previousSuggestion, persona, workItem);
    res.json(result);
    
  } catch (error) {
    console.error('Error applying changes:', error);
    res.status(500).json({ 
      error: 'Failed to apply changes',
      details: error.message 
    });
  }
});

// Git repository endpoints

// Get repository status
app.get('/api/repos/:projectPath/:repoName/status', async (req, res) => {
  try {
    const { projectPath, repoName } = req.params;
    const fullPath = `${decodeURIComponent(projectPath)}/${repoName}`;
    
    // Use subscription manager to get status
    const status = await subscriptionManager.getRepoStatus(fullPath);
    res.json(status);
    
  } catch (error) {
    console.error('Error getting repo status:', error);
    res.status(500).json({ 
      error: 'Failed to get repository status',
      message: error.message 
    });
  }
});

// Rebase repository on main
app.post('/api/repos/:projectPath/:repoName/rebase', async (req, res) => {
  try {
    const { projectPath, repoName } = req.params;
    const repoPath = path.join(decodeURIComponent(projectPath), 'repos', repoName);
    
    // Check if directory exists
    await fsAsync.access(repoPath);
    
    // Fetch latest from origin
    execSync('git fetch origin main', { cwd: repoPath });
    
    // Get current branch
    const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: repoPath,
      encoding: 'utf-8'
    }).trim();
    
    if (currentBranch === 'main') {
      return res.status(400).json({ error: 'Cannot rebase main on itself' });
    }
    
    // Rebase on origin/main
    try {
      execSync('git rebase origin/main', { cwd: repoPath });
      
      // Force update subscription status
      const resourceId = `repo-status:${decodeURIComponent(projectPath)}/${repoName}`;
      subscriptionManager.forceCheckResources([resourceId]);
      
      res.json({ 
        success: true, 
        message: `Successfully rebased ${currentBranch} on main` 
      });
    } catch (rebaseError) {
      // Abort rebase if it failed
      try {
        execSync('git rebase --abort', { cwd: repoPath });
      } catch (abortError) {
        // Ignore abort errors
      }
      
      throw new Error(`Rebase failed: ${rebaseError.message}`);
    }
    
  } catch (error) {
    console.error('Error rebasing repository:', error);
    res.status(500).json({ 
      error: 'Failed to rebase repository',
      message: error.message 
    });
  }
});

// Reset repository to main
app.post('/api/repos/:projectPath/:repoName/reset', async (req, res) => {
  try {
    const { projectPath, repoName } = req.params;
    const { stashChanges = false } = req.body;
    const repoPath = path.join(decodeURIComponent(projectPath), 'repos', repoName);
    
    // Check if directory exists
    await fsAsync.access(repoPath);
    
    // Stash changes if requested
    if (stashChanges) {
      try {
        const status = execSync('git status --porcelain', { 
          cwd: repoPath, 
          encoding: 'utf-8' 
        });
        
        if (status.trim()) {
          execSync('git stash push -m "Auto-stash before reset"', { cwd: repoPath });
        }
      } catch (stashError) {
        console.error('Error stashing changes:', stashError);
      }
    }
    
    // Fetch latest
    execSync('git fetch origin main', { cwd: repoPath });
    
    // Checkout main
    execSync('git checkout main', { cwd: repoPath });
    
    // Reset to origin/main
    execSync('git reset --hard origin/main', { cwd: repoPath });
    
    // Update claudeflow.settings.json to mark repo as available
    try {
      const projectDir = decodeURIComponent(projectPath);
      await claudeFlowSettings.releaseRepository(projectDir, repoName);
      console.log(`Marked ${repoName} as available after reset in claudeflow.settings.json`);
    } catch (err) {
      console.error('Error updating claudeflow.settings.json:', err);
    }
    
    // Clear Claude Code history for this repo
    // This ensures fresh sessions when repo is reset
    const claudeHistoryCleared = await clearClaudeHistory(repoName);
    if (claudeHistoryCleared) {
      console.log(`Cleared Claude Code history for ${repoName}`);
    }
    
    // Force update subscription status
    const resourceId = `repo-status:${decodeURIComponent(projectPath)}/${repoName}`;
    subscriptionManager.forceCheckResources([resourceId]);
    
    res.json({ 
      success: true, 
      message: 'Successfully reset to main',
      stashed: stashChanges 
    });
    
  } catch (error) {
    console.error('Error resetting repository:', error);
    res.status(500).json({ 
      error: 'Failed to reset repository',
      message: error.message 
    });
  }
});

// Clone repository
app.post('/api/repos/:projectPath/clone', async (req, res) => {
  try {
    const { projectPath } = req.params;
    const { repoUrl, repoName: suggestedName } = req.body;
    const decodedProjectPath = decodeURIComponent(projectPath);
    
    if (!repoUrl) {
      return res.status(400).json({ error: 'Repository URL is required' });
    }
    
    // Extract repo name from URL if not provided
    let baseName = suggestedName;
    if (!baseName) {
      const urlParts = repoUrl.split('/');
      baseName = urlParts[urlParts.length - 1].replace(/\.git$/, '');
    }
    
    // Find existing clones to determine next number
    const reposPath = path.join(decodedProjectPath, 'repos');
    await fsAsync.mkdir(reposPath, { recursive: true });
    
    const repoDirs = await fsAsync.readdir(reposPath);
    let nextNumber = 1;
    
    // Find all clones of this repo
    repoDirs.forEach(dir => {
      const match = dir.match(new RegExp(`^${baseName}-(\\d+)$`));
      if (match) {
        const num = parseInt(match[1]);
        if (num >= nextNumber) {
          nextNumber = num + 1;
        }
      }
    });
    
    const newRepoName = `${baseName}-${nextNumber}`;
    const newRepoPath = path.join(reposPath, newRepoName);
    
    console.log(`Cloning ${repoUrl} to ${newRepoPath}`);
    
    // Clone the repository
    try {
      execSync(`git clone "${repoUrl}" "${newRepoName}"`, {
        cwd: reposPath,
        stdio: 'pipe'
      });
    } catch (cloneError) {
      console.error('Clone error:', cloneError);
      return res.status(500).json({ 
        error: 'Failed to clone repository',
        message: cloneError.message 
      });
    }
    
    // Update REPOS.md if it exists
    const reposFilePath = path.join(decodedProjectPath, 'REPOS.md');
    try {
      let reposContent = await fsAsync.readFile(reposFilePath, 'utf-8');
      
      // Add new clone to available clones section
      const availableSection = reposContent.match(/## Available clones\n([\s\S]*?)(?=\n##|$)/);
      if (availableSection) {
        const lines = availableSection[1].trim().split('\n');
        lines.push(`- ${newRepoName}: Available`);
        
        reposContent = reposContent.replace(
          availableSection[0],
          `## Available clones\n\n${lines.join('\n')}\n`
        );
        
        await fsAsync.writeFile(reposFilePath, reposContent);
      }
    } catch (err) {
      console.log('No REPOS.md file or error updating it:', err.message);
    }
    
    // Invalidate cache
    invalidateCache(`project-details:${decodedProjectPath}`);
    invalidateCache(`workspace:`);
    
    // Force update subscription status
    const resourceId = `repo-status:${decodedProjectPath}/${newRepoName}`;
    subscriptionManager.forceCheckResources([resourceId]);
    
    res.json({ 
      success: true, 
      repoName: newRepoName,
      path: newRepoPath,
      message: `Successfully cloned repository as ${newRepoName}` 
    });
    
  } catch (error) {
    console.error('Error cloning repository:', error);
    res.status(500).json({ 
      error: 'Failed to clone repository',
      message: error.message 
    });
  }
});

// Delete repository clone
app.delete('/api/repos/:projectPath/:repoName', async (req, res) => {
  try {
    const { projectPath, repoName } = req.params;
    const repoPath = path.join(decodeURIComponent(projectPath), 'repos', repoName);
    
    // Check if directory exists
    await fsAsync.access(repoPath);
    
    // Remove the directory
    await fsAsync.rm(repoPath, { recursive: true, force: true });
    
    // Update REPOS.md to remove this clone
    const reposFilePath = path.join(decodeURIComponent(projectPath), 'REPOS.md');
    try {
      let reposContent = await fsAsync.readFile(reposFilePath, 'utf-8');
      
      // Remove lines referencing this repo
      const lines = reposContent.split('\n');
      const filteredLines = lines.filter(line => !line.includes(repoName));
      
      await fsAsync.writeFile(reposFilePath, filteredLines.join('\n'));
    } catch (err) {
      console.error('Error updating REPOS.md:', err);
      // Continue even if REPOS.md update fails
    }
    
    // Invalidate cache
    invalidateCache(`project-details:${decodeURIComponent(projectPath)}`);
    invalidateCache(`workspace:`);
    
    res.json({ 
      success: true, 
      message: `Successfully deleted ${repoName}` 
    });
    
  } catch (error) {
    console.error('Error deleting repository:', error);
    res.status(500).json({ 
      error: 'Failed to delete repository',
      message: error.message 
    });
  }
});

// Claude Code endpoints
// Sessions are now managed by sessionManager
// Store active Claude Code SSE clients by session ID
// Each session maps to an object containing connections by connectionId
const claudeCodeClients = new Map(); // Map<sessionId, Map<connectionId, { res, timestamp, lastHeartbeat }>>

// Helper function to clear Claude history for a repo
async function clearClaudeHistory(repoName) {
  try {
    // Find and end any active sessions for this repo
    const allSessions = sessionManager.getAllSessions();
    for (const session of allSessions) {
      if (session.repoName === repoName) {
        // Clean up session
        await sessionManager.deleteSession(session.sessionId);
        
        // Remove all SSE connections
        const connections = claudeCodeClients.get(session.sessionId);
        if (connections) {
          for (const [connId, conn] of connections.entries()) {
            try {
              conn.res.write(`event: session-end\ndata: ${JSON.stringify({ message: 'Session ended due to repo reset' })}\n\n`);
              conn.res.end();
            } catch (err) {
              // Connection might already be disconnected
            }
          }
          claudeCodeClients.delete(session.sessionId);
        }
        
        logger.info(`Ended active Claude session ${session.sessionId} for repo ${repoName}`);
      }
    }
    
    return true;
  } catch (error) {
    logger.error('Error clearing Claude history:', error);
    return false;
  }
}

// Request deduplication cache and lock mechanism (in-memory for now)
const sessionCreationRequests = new Map();
const sessionCreationLocks = new Set(); // Track in-flight session creation keys
const SESSION_CREATION_DEBOUNCE_MS = 2000; // 2 seconds

// Initialize Claude Code session
app.post('/api/claude/code/start', async (req, res) => {
  const { projectId, projectPath, repoName, userName, userEmail } = req.body;
  
  // Create a unique key for this session request (needed for finally block)
  const requestKey = `${projectPath || 'unknown'}-${repoName || 'unknown'}-${userName || 'anonymous'}`;
  
  try {
    logger.logClient('REQUEST', {
      method: 'POST',
      url: '/api/claude/code/start',
      body: { projectId, projectPath, repoName, userName }
    });
    
    if (!projectId || !projectPath || !repoName) {
      logger.logClient('RESPONSE', { status: 400, error: 'Missing required fields' });
      return res.status(400).json({ error: 'Project ID, path, and repo name are required' });
    }
    
    const now = Date.now();
    
    // Check if there's a recent request for the same session
    const existingRequest = sessionCreationRequests.get(requestKey);
    if (existingRequest && (now - existingRequest.timestamp) < SESSION_CREATION_DEBOUNCE_MS) {
      const timeSinceRequest = now - existingRequest.timestamp;
      logger.debug(`Duplicate session request detected - returning existing session: ${existingRequest.sessionId} (${timeSinceRequest}ms ago)`);
      logger.logEvent('CLAUDE_SESSION_DEDUPLICATED', 'Returning existing session for duplicate request', {
        sessionId: existingRequest.sessionId,
        timeSinceRequest,
        requestKey
      });
      logger.logClient('RESPONSE', { status: 200, sessionId: existingRequest.sessionId, duplicate: true });
      return res.json({
        sessionId: existingRequest.sessionId,
        reservedRepo: repoName,
        contextUsage: 0
      });
    }
    
    // Check if there's already a session creation in progress for this key
    if (sessionCreationLocks.has(requestKey)) {
      logger.debug(`Session creation already in progress for ${requestKey}, waiting briefly and retrying`);
      
      // Wait a short time and check cache again
      await new Promise(resolve => setTimeout(resolve, 50));
      const retryRequest = sessionCreationRequests.get(requestKey);
      if (retryRequest) {
        logger.logEvent('CLAUDE_SESSION_DEDUPLICATED', 'Returning session after brief wait', {
          sessionId: retryRequest.sessionId,
          requestKey
        });
        logger.logClient('RESPONSE', { status: 200, sessionId: retryRequest.sessionId, waitedForLock: true });
        return res.json({
          sessionId: retryRequest.sessionId,
          reservedRepo: repoName,
          contextUsage: 0
        });
      }
    }
    
    // Set lock to prevent race conditions
    sessionCreationLocks.add(requestKey);
    logger.debug(`Acquired session creation lock for ${requestKey}`);
    
    try {
      // Check if there's already an active session for this repo
      const allSessions = sessionManager.getAllSessions();
      for (const session of allSessions) {
        if (session.projectPath === projectPath && session.repoName === repoName) {
          logger.debug(`Found existing session for ${repoName}, reusing it`);
          
          logger.logEvent('CLAUDE_SESSION_REUSED', 'Reusing existing Claude Code session', {
            sessionId: session.sessionId,
            repoName,
            userName
          });
          
          logger.logClient('RESPONSE', { 
            status: 200, 
            sessionId: session.sessionId,
            reservedRepo: repoName,
            new: false  // Indicate this is an existing session
          });
          
          // Store in deduplication cache
          sessionCreationRequests.set(requestKey, {
            sessionId: session.sessionId,
            timestamp: now
          });
          
          // Return the existing session
          return res.json({
            sessionId: session.sessionId,
            reservedRepo: repoName,
            contextUsage: 0,
            new: false
          });
        }
      }
    } catch (error) {
      // Error checking for existing sessions - log but continue with creating new session
      logger.error('Error checking for existing sessions:', error);
    }
    
    const sessionId = `${projectId}-${repoName}-${crypto.randomUUID()}`;
    
    // Use the specific repo requested by the user
    const reposPath = path.join(projectPath, 'repos');
    const repoPath = path.join(reposPath, repoName);
    
    // Verify the repo exists
    try {
      await fsAsync.access(repoPath);
    } catch (err) {
      return res.status(404).json({ error: `Repository ${repoName} not found` });
    }
    
    // Check if repo is clean and available
    const { exec } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);
    
    try {
      // Check if repo is clean
      const { stdout: statusOutput } = await execAsync('git status --porcelain', { 
        cwd: repoPath 
      });
      
      if (statusOutput.trim() !== '') {
        console.warn(`Repository ${repoName} has uncommitted changes but proceeding anyway`);
      }
    } catch (err) {
      console.error(`Error checking repo status for ${repoName}:`, err);
    }
    
    const reservedRepo = repoName;
    
    // Migrate from REPOS.md if needed
    try {
      await claudeFlowSettings.migrateFromReposMd(projectPath);
    } catch (err) {
      console.error('Error migrating from REPOS.md:', err);
    }
    
    // Update claudeflow.settings.json to mark repo as reserved
    try {
      // First ensure the repo exists in settings
      let settings = await claudeFlowSettings.load(projectPath);
      if (!settings.repositories[reservedRepo]) {
        await claudeFlowSettings.addRepository(projectPath, reservedRepo, {
          type: 'local',
          description: 'Repository for Claude Code sessions'
        });
        // Reload settings after adding repository
        settings = await claudeFlowSettings.load(projectPath);
      }
      
      // Check if it's already reserved by claude-code
      const repo = settings.repositories[reservedRepo];
      if (repo && repo.status === 'reserved' && repo.reservedBy === 'claude-code') {
        // Repository is already reserved by us - this is fine and expected
        // This happens when restarting sessions or when multiple session creation
        // requests happen concurrently
      } else {
        // Now reserve it
        try {
          await claudeFlowSettings.reserveRepository(projectPath, reservedRepo, 'claude-code');
        } catch (reserveError) {
          // Check if it failed because it's already reserved by claude-code
          // This can happen in race conditions with concurrent requests
          const updatedSettings = await claudeFlowSettings.load(projectPath);
          const updatedRepo = updatedSettings.repositories[reservedRepo];
          if (updatedRepo && updatedRepo.status === 'reserved' && updatedRepo.reservedBy === 'claude-code') {
            // Another concurrent request already reserved it for claude-code - that's fine
          } else {
            // This is an actual error - log it
            logger.error('Unexpected error reserving repository:', reserveError);
            logger.error('Project path was:', projectPath);
            logger.error('Repo was:', reservedRepo);
          }
        }
      }
    } catch (err) {
      // This is an unexpected error
      logger.error('Unexpected error updating claudeflow.settings.json:', err);
      logger.error('Project path was:', projectPath);
      logger.error('Repo was:', reservedRepo);
      // Continue anyway - don't fail the session start
    }
    
    // Create session using session manager
    const session = sessionManager.createSession({
      sessionId,
      projectId,
      projectPath,
      repoName: reservedRepo,
      userName,
      userEmail
    });
    
    logger.debug('Created session:', {
      sessionId,
      projectPath,
      reservedRepo,
      greetingShown: session.greetingShown
    });
    
    logger.logEvent('CLAUDE_SESSION_CREATED', 'New Claude Code session', {
      sessionId,
      repoName: reservedRepo,
      userName,
      projectPath
    });
    
    logger.logClient('RESPONSE', { 
      status: 200, 
      sessionId,
      reservedRepo,
      new: true 
    });
    
    // Store in deduplication cache
    sessionCreationRequests.set(requestKey, {
      sessionId,
      timestamp: now
    });
    
    // Clean up old cache entries (older than 5 minutes)
    const CACHE_CLEANUP_MS = 5 * 60 * 1000;
    for (const [key, value] of sessionCreationRequests.entries()) {
      if (now - value.timestamp > CACHE_CLEANUP_MS) {
        sessionCreationRequests.delete(key);
      }
    }
    
    res.json({
      sessionId,
      reservedRepo,
      contextUsage: 0,
      new: true
    });
    
  } catch (error) {
    console.error('Error starting Claude Code session:', error);
    res.status(500).json({ 
      error: 'Failed to start session',
      message: error.message 
    });
  } finally {
    // Always remove the lock when done
    sessionCreationLocks.delete(requestKey);
    logger.debug(`Released session creation lock for ${requestKey}`);
  }
});

// Send message to Claude
app.post('/api/claude/code/message', async (req, res) => {
  try {
    const { sessionId, message, mode } = req.body;
    
    logger.logClient('REQUEST', {
      method: 'POST',
      url: '/api/claude/code/message',
      sessionId,
      messageLength: message?.length || 0,
      mode
    });
    
    const session = sessionManager.getSession(sessionId);
    if (!session) {
      logger.logClient('RESPONSE', { status: 404, error: 'Session not found', sessionId });
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Add user message to history
    sessionManager.addMessage(sessionId, { 
      role: 'user', 
      content: message,
      timestamp: new Date().toISOString()
    });
    
    // Create unique message ID
    const messageId = crypto.randomUUID();
    
    // Send to all SSE connections for this session
    const connections = claudeCodeClients.get(sessionId);
    if (!connections || connections.size === 0) {
      logger.logClient('RESPONSE', { status: 503, error: 'No active connections', sessionId });
      return res.status(503).json({ error: 'No active connections for this session' });
    }
    
    // Don't send a message-start event here - it creates an empty message
    // The actual assistant messages will be created by the onMessage callback
    
    console.log(`Processing message for session ${sessionId}, mode: ${mode}, connections: ${connections.size}`);
    
    // Process with Claude
    const claudeService = require('./claude-service');
    
    try {
      // Check if we should use mock mode
      const useMockMode = req.headers['x-mock-mode'] === 'true' || !claudeService.isClaudeAvailable;
      
      if (useMockMode) {
        // Simulate streaming response
        const mockResponse = `I'll help you with that. Let me ${mode === 'plan' ? 'create a plan' : 'get started'}...\n\nThis is a mock response for testing the Claude Code interface. In a real implementation, this would connect to the Claude API and provide actual assistance.`;
        
        const words = mockResponse.split(' ');
        let currentChunk = '';
        
        for (let i = 0; i < words.length; i++) {
          currentChunk += words[i] + ' ';
          
          // Send chunk
          for (const [connId, conn] of connections.entries()) {
            try {
              conn.res.write(`event: message-chunk\ndata: ${JSON.stringify({ 
                messageId, 
                chunk: words[i] + ' ' 
              })}\n\n`);
            } catch (err) {
              console.error(`Error sending chunk to connection ${connId}:`, err);
              connections.delete(connId);
            }
          }
          
          // Simulate typing delay
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        // Add assistant message to history
        sessionManager.addMessage(sessionId, { 
          role: 'assistant', 
          content: mockResponse,
          timestamp: new Date().toISOString()
        });
        
        // Update context usage (mock calculation)
        const updatedSession = sessionManager.getSession(sessionId);
        const estimatedTokens = updatedSession.messages.reduce((sum, msg) => 
          sum + Math.ceil(msg.content.length / 4), 0
        );
        const contextUsage = Math.round((estimatedTokens / updatedSession.maxTokens) * 100);
        sessionManager.updateContextTokens(sessionId, estimatedTokens);
        
        // Send context update
        for (const [connId, conn] of connections.entries()) {
          try {
            conn.res.write(`event: context-update\ndata: ${JSON.stringify({ percentage: contextUsage })}\n\n`);
          } catch (err) {
            console.error(`Error sending context update to connection ${connId}:`, err);
            connections.delete(connId);
          }
        }
      } else {
        // Real Claude integration using the SDK
        console.log('Using Claude SDK for real response');
        
        // Build context from session messages
        const contextMessages = session.messages.slice(-10); // Last 10 messages for context
        const contextPrompt = contextMessages.map(msg => 
          `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`
        ).join('\n\n');
        
        // Create the full prompt
        const fullPrompt = `${contextPrompt}\n\nHuman: ${message}\n\nAssistant:`;
        
        // Configure tools based on mode (for context in prompt)
        const tools = mode === 'plan' ? ['search', 'read'] : ['search', 'read', 'write', 'bash'];
        
        // Don't send any thinking or progress messages
        
        // Get the repo path for Claude to work in
        const repoPath = path.join(session.projectPath, 'repos', session.repoName);
        
        // Process with Claude with progress updates
        console.log('=== CLAUDE REQUEST ===');
        console.log('Full prompt:', fullPrompt);
        console.log('Tools:', tools);
        console.log('Repo path:', repoPath);
        console.log('=====================');
        
        logger.logClaude('REQUEST', {
          sessionId,
          messageId,
          mode,
          userMessage: message,
          promptLength: fullPrompt.length,
          tools,
          repoPath
        });
        
        console.log('About to call processClaudeCodeMessage...');
        let response;
        let pendingAssistantText = '';
        let toolExecutions = [];
        let currentAssistantMessageId = null;
        let hasCompletedInitialMessage = false;
        
        try {
          response = await claudeService.processClaudeCodeMessage(
          fullPrompt, 
          tools, 
          'opus', // Use opus model as preferred
          repoPath,
          // onProgress callback - don't send any progress messages
          null,
          // onToolExecution callback  
          (toolExecution) => {
            console.log('Tool execution received:', toolExecution);
            
            // If we have pending assistant text, complete and save it as a message first
            if (pendingAssistantText && currentAssistantMessageId && !hasCompletedInitialMessage) {
              // Send message-end event
              const currentConnections = claudeCodeClients.get(sessionId);
              if (currentConnections) {
                for (const [connId, conn] of currentConnections.entries()) {
                  try {
                    conn.res.write(`event: message-end\ndata: ${JSON.stringify({ 
                      messageId: currentAssistantMessageId
                    })}\n\n`);
                  } catch (err) {
                    console.error(`Error sending message-end to connection ${connId}:`, err);
                    currentConnections.delete(connId);
                  }
                }
              }
              
              // Save to session
              sessionManager.addMessage(sessionId, {
                id: currentAssistantMessageId,
                role: 'assistant',
                content: pendingAssistantText,
                timestamp: new Date().toISOString()
              });
              
              pendingAssistantText = '';
              hasCompletedInitialMessage = true;
              currentAssistantMessageId = null;
            }
            
            // Format tool args for display
            let displayArgs = '';
            if (toolExecution.args) {
              try {
                const args = typeof toolExecution.args === 'string' ? JSON.parse(toolExecution.args) : toolExecution.args;
                if (toolExecution.name === 'Read' && args.file_path) {
                  displayArgs = args.file_path;
                } else if (toolExecution.name === 'Write' && args.file_path) {
                  displayArgs = args.file_path;
                } else if (toolExecution.name === 'Bash' && args.command) {
                  displayArgs = args.command;
                } else {
                  displayArgs = JSON.stringify(args, null, 2);
                }
              } catch (e) {
                displayArgs = toolExecution.args;
              }
            }
            
            // Create tool message
            const toolMessageId = `${messageId}-tool-${toolExecution.id || Date.now()}`;
            const toolMessage = {
              id: toolMessageId,
              role: 'tool',
              name: toolExecution.name,
              args: displayArgs,
              status: toolExecution.status || 'complete',
              timestamp: new Date().toISOString(),
              executionTime: toolExecution.executionTime
            };
            
            // Add to session
            sessionManager.addMessage(sessionId, toolMessage);
            
            // Store for later reference
            toolExecutions.push(toolExecution);
            
            const currentConnections = claudeCodeClients.get(sessionId);
            if (currentConnections) {
              for (const [connId, conn] of currentConnections.entries()) {
                try {
                  conn.res.write(`event: tool-execution\ndata: ${JSON.stringify({ 
                    messageId,
                    toolExecution: {
                      ...toolExecution,
                      args: displayArgs
                    }
                  })}\n\n`);
                } catch (err) {
                  console.error(`Error sending tool execution to connection ${connId}:`, err);
                  currentConnections.delete(connId);
                }
              }
            }
          },
          // onMessage callback
          (messageType, content) => {
            debugLog('Claude message event - raw params:', { messageType, content });
            
            // Fix: The SDK is passing the full message object as the first parameter
            let actualMessageType = messageType;
            let actualContent = content;
            
            // Check if messageType is actually the full message object
            if (typeof messageType === 'object' && messageType !== null) {
              // Extract the actual type and content from the message object
              if (messageType.type) {
                actualMessageType = messageType.type;
                actualContent = messageType.content || content;
              } else {
                // Fallback - treat the whole object as content
                actualMessageType = 'message';
                actualContent = messageType;
              }
            }
            
            debugLog('Parsed message event:', { type: actualMessageType, content: actualContent });
            
            // Skip "result" type messages as they contain the full response that we've already streamed
            if (actualMessageType === 'result') {
              debugLog('Skipping result message - already handled through streaming');
              return;
            }
            
            // Handle content that might be an array of content blocks
            let textContent = actualContent;
            let skipMessage = false;
            
            if (Array.isArray(actualContent)) {
              // Check for tool use blocks
              const hasToolUse = actualContent.some(block => block && block.type === 'tool_use');
              
              if (hasToolUse) {
                // Don't send tool use messages as regular messages
                // They will be handled by tool execution events
                debugLog('Skipping tool_use message - will be handled by tool execution events');
                skipMessage = true;
              } else {
                // Extract text from content blocks
                textContent = actualContent
                  .filter(block => block && block.type === 'text')
                  .map(block => block.text || '')
                  .join('\n');
                debugLog('Extracted text from content array:', textContent);
              }
            } else if (actualContent && typeof actualContent === 'object' && actualContent.type === 'text') {
              textContent = actualContent.text;
              debugLog('Extracted text from content object:', textContent);
            } else if (typeof actualContent === 'string') {
              textContent = actualContent;
            } else {
              debugLog('Unhandled content type:', typeof actualContent, actualContent);
              textContent = '';
            }
            
            // Only send message if we have text content and it's not a tool use
            if (textContent && !skipMessage) {
              // If this is the first assistant text, create a new message
              if (!currentAssistantMessageId) {
                currentAssistantMessageId = crypto.randomUUID();
                // Send message-start event
                const currentConnections = claudeCodeClients.get(sessionId);
                if (currentConnections) {
                  for (const [connId, conn] of currentConnections.entries()) {
                    try {
                      conn.res.write(`event: message-start\ndata: ${JSON.stringify({ 
                        id: currentAssistantMessageId,
                        isGreeting: false
                      })}\n\n`);
                    } catch (err) {
                      console.error(`Error sending message-start to connection ${connId}:`, err);
                      currentConnections.delete(connId);
                    }
                  }
                }
              }
              
              // Accumulate text
              pendingAssistantText += textContent;
              
              // Send as message chunk
              const currentConnections = claudeCodeClients.get(sessionId);
              if (currentConnections) {
                for (const [connId, conn] of currentConnections.entries()) {
                  try {
                    conn.res.write(`event: message-chunk\ndata: ${JSON.stringify({ 
                      messageId: currentAssistantMessageId,
                      chunk: textContent 
                    })}\n\n`);
                  } catch (err) {
                    console.error(`Error sending message chunk to connection ${connId}:`, err);
                    currentConnections.delete(connId);
                  }
                }
              }
            }
          }
        );
        } catch (err) {
          console.error('Error calling processClaudeCodeMessage:', err);
          throw err;
        }
        
        console.log('processClaudeCodeMessage returned');
        console.log('Type of returned value:', typeof response);
        console.log('Is Promise?', response instanceof Promise);
        console.log('Constructor name:', response?.constructor?.name);
        
        console.log('=== CLAUDE RESPONSE ===');
        console.log('Response type:', typeof response);
        console.log('Response is null?', response === null);
        console.log('Response is undefined?', response === undefined);
        if (response) {
          console.log('Response keys:', Object.keys(response));
          console.log('Response.text type:', typeof response.text);
          console.log('Response.text is object?', typeof response.text === 'object');
          console.log('Response.text constructor:', response.text?.constructor?.name);
          console.log('Response.text value:', response.text ? (typeof response.text === 'string' ? response.text.substring(0, 100) + '...' : `[${typeof response.text}] ${JSON.stringify(response.text)}`) : 'null/undefined');
        }
        console.log('Response:', JSON.stringify(response, null, 2));
        console.log('======================');
        
        // Check if response.text is actually a string before logging
        let logText = null;
        if (response.text) {
          if (typeof response.text === 'string') {
            logText = response.text.substring(0, 200) + '...';
          } else {
            console.error('ERROR: response.text is not a string!', typeof response.text, response.text);
            logText = String(response.text).substring(0, 200) + '...';
          }
        }
        
        logger.logClaude('RESPONSE', {
          sessionId,
          messageId,
          success: !response.error,
          error: response.error,
          text: logText,
          textLength: response.text ? response.text.length : 0,
          toolExecutions: response.toolExecutions?.length || 0,
          tokenUsage: response.tokenUsage
        });
        
        if (response.error) {
          throw new Error(response.error);
        }
        
        // Stream the response
        console.log('About to stream response - response:', response);
        console.log('About to stream response - response.text type:', typeof response.text);
        console.log('About to stream response - response.text:', response.text);
        
        // Debug: Check if response is actually the expected object
        if (!response || typeof response !== 'object') {
          console.error('ERROR: response is not an object!', typeof response, response);
          throw new Error('Invalid response from processClaudeCodeMessage');
        }
        
        const responseText = response.text || 'I apologize, but I was unable to generate a response.';
        console.log('ResponseText to stream type:', typeof responseText);
        console.log('ResponseText to stream:', responseText.substring(0, 100) + '...');
        console.log('PendingAssistantText:', pendingAssistantText.substring(0, 100) + '...');
        console.log('ResponseText length:', responseText.length);
        console.log('PendingAssistantText length:', pendingAssistantText.length);
        console.log('Are they equal?', responseText === pendingAssistantText);
        
        // If we already sent assistant messages through onMessage callback, ignore the final response
        if (pendingAssistantText || hasCompletedInitialMessage) {
          console.log('Already sent assistant messages through streaming, ignoring response.text');
          console.log('Messages sent via streaming:', hasCompletedInitialMessage ? 'yes' : 'no');
          console.log('PendingAssistantText length:', pendingAssistantText.length);
          console.log('Response.text length:', responseText.length);
          // Don't send anything - we already streamed the content
        } else if (responseText) {
          // Only send response.text if we haven't sent anything yet (simple responses without tools)
          console.log('No assistant messages sent via streaming, using response.text');
          // Create a new message ID for the final response
          const finalMessageId = crypto.randomUUID();
          
          // Send message-start event
          const currentConnections = claudeCodeClients.get(sessionId);
          if (currentConnections) {
            for (const [connId, conn] of currentConnections.entries()) {
              try {
                conn.res.write(`event: message-start\ndata: ${JSON.stringify({ 
                  id: finalMessageId,
                  isGreeting: false
                })}\n\n`);
              } catch (err) {
                console.error(`Error sending message-start to connection ${connId}:`, err);
                currentConnections.delete(connId);
              }
            }
          }
          
          // Stream the response
          const words = responseText.split(' ');
          for (let i = 0; i < words.length; i++) {
            const currentConnections = claudeCodeClients.get(sessionId);
            if (currentConnections) {
              for (const [connId, conn] of currentConnections.entries()) {
                try {
                  conn.res.write(`event: message-chunk\ndata: ${JSON.stringify({ 
                    messageId: finalMessageId, 
                    chunk: words[i] + ' ' 
                  })}\n\n`);
                } catch (err) {
                  console.error(`Error writing to connection ${connId}:`, err);
                  currentConnections.delete(connId);
                }
              }
            }
            
            // Small delay to simulate natural streaming
            await new Promise(resolve => setTimeout(resolve, 20));
          }
          
          // Send message-end event
          if (currentConnections) {
            for (const [connId, conn] of currentConnections.entries()) {
              try {
                conn.res.write(`event: message-end\ndata: ${JSON.stringify({ 
                  messageId: finalMessageId
                })}\n\n`);
              } catch (err) {
                console.error(`Error sending message-end to connection ${connId}:`, err);
                currentConnections.delete(connId);
              }
            }
          }
          
          // Save the final message
          sessionManager.addMessage(sessionId, { 
            id: finalMessageId,
            role: 'assistant', 
            content: responseText,
            timestamp: new Date().toISOString()
          });
        }
        
        // Send final tool execution summary if there were any
        if (response.toolExecutions && response.toolExecutions.length > 0) {
          console.log('Sending final tool execution summary:', response.toolExecutions.length, 'tools');
          const currentConnections = claudeCodeClients.get(sessionId);
          if (currentConnections) {
            for (const [connId, conn] of currentConnections.entries()) {
              try {
                conn.res.write(`event: tool-summary\ndata: ${JSON.stringify({ 
                  messageId,
                  toolExecutions: response.toolExecutions,
                  totalExecutions: response.toolExecutions.length,
                  successfulExecutions: response.toolExecutions.filter(t => t.isSuccess).length
                })}\n\n`);
              } catch (err) {
                console.error(`Error sending tool summary to connection ${connId}:`, err);
                currentConnections.delete(connId);
              }
            }
          }
        }
        
        // Message has already been added in the streaming section above
        
        // Update context usage based on token usage
        if (response.tokenUsage) {
          // Calculate cumulative tokens for the session
          const currentSession = sessionManager.getSession(sessionId);
          const newTokenTotal = (currentSession.contextTokens || 0) + response.tokenUsage.totalTokens;
          sessionManager.updateContextTokens(sessionId, newTokenTotal);
          const contextUsage = Math.round((newTokenTotal / currentSession.maxTokens) * 100);
          
          // Send final token count with the message
          const currentConnections = claudeCodeClients.get(sessionId);
          if (currentConnections) {
            for (const [connId, conn] of currentConnections.entries()) {
              try {
                conn.res.write(`event: token-update\ndata: ${JSON.stringify({ 
                  messageId,
                  inputTokens: response.tokenUsage.inputTokens,
                  outputTokens: response.tokenUsage.outputTokens,
                  totalTokens: response.tokenUsage.totalTokens,
                  sessionTotal: newTokenTotal
                })}\n\n`);
              } catch (err) {
                console.error(`Error sending token update to connection ${connId}:`, err);
                currentConnections.delete(connId);
              }
            }
            
            for (const [connId, conn] of currentConnections.entries()) {
              try {
                conn.res.write(`event: context-update\ndata: ${JSON.stringify({ percentage: contextUsage })}\n\n`);
              } catch (err) {
                console.error(`Error sending context update to connection ${connId}:`, err);
                currentConnections.delete(connId);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error processing Claude message:', error);
      
      // Send error message to connections
      const errorMessage = `I apologize, but I encountered an error: ${error.message}`;
      const errorConnections = claudeCodeClients.get(sessionId);
      if (errorConnections) {
        for (const [connId, conn] of errorConnections.entries()) {
          try {
            conn.res.write(`event: message-chunk\ndata: ${JSON.stringify({ 
              messageId, 
              chunk: errorMessage 
            })}\n\n`);
          } catch (err) {
            console.error(`Error sending error message to connection ${connId}:`, err);
            errorConnections.delete(connId);
          }
        }
      }
      
      // Add error to session history
      sessionManager.addMessage(sessionId, { 
        role: 'assistant', 
        content: errorMessage,
        timestamp: new Date().toISOString()
      });
    }
    
    // Send message end event
    const finalConnections = claudeCodeClients.get(sessionId);
    if (finalConnections) {
      for (const [connId, conn] of finalConnections.entries()) {
        try {
          conn.res.write(`event: message-end\ndata: ${JSON.stringify({ messageId })}\n\n`);
        } catch (err) {
          console.error(`Error sending message-end to connection ${connId}:`, err);
          finalConnections.delete(connId);
        }
      }
    }
    
    res.json({ success: true, messageId });
    
  } catch (error) {
    console.error('Error processing Claude Code message:', error);
    res.status(500).json({ 
      error: 'Failed to process message',
      message: error.message 
    });
  }
});

// SSE endpoint for Claude Code streaming
app.get('/api/claude/code/stream', (req, res) => {
  const { sessionId, connectionId } = req.query;
  
  logger.logClient('REQUEST', {
    method: 'GET',
    url: '/api/claude/code/stream',
    sessionId,
    connectionId
  });
  
  if (!sessionId || !connectionId) {
    logger.logClient('RESPONSE', { status: 400, error: 'Session ID and connection ID required' });
    return res.status(400).json({ error: 'Session ID and connection ID required' });
  }
  
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  
  // Initialize session connections map if needed
  if (!claudeCodeClients.has(sessionId)) {
    claudeCodeClients.set(sessionId, new Map());
  }
  
  const sessionConnections = claudeCodeClients.get(sessionId);
  
  // Clean up old connections from this session (older than 30 seconds)
  const now = Date.now();
  const staleConnectionIds = [];
  for (const [connId, conn] of sessionConnections.entries()) {
    if (now - conn.timestamp > 30000) {
      staleConnectionIds.push(connId);
      try {
        conn.res.end();
      } catch (err) {
        // Connection already closed
      }
    }
  }
  
  // Remove stale connections
  staleConnectionIds.forEach(connId => {
    const staleConn = sessionConnections.get(connId);
    const age = staleConn ? now - staleConn.timestamp : 0;
    sessionConnections.delete(connId);
    logger.logEvent('CLAUDE_SSE_STALE_REMOVED', 'Removed stale connection', {
      sessionId,
      connectionId: connId,
      age
    });
  });
  
  // Add new connection
  sessionConnections.set(connectionId, {
    res,
    timestamp: now,
    lastHeartbeat: now
  });
  
  // Send initial connection event
  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);
  
  logger.logEvent('CLAUDE_SSE_CONNECTED', 'Claude Code SSE client connected', {
    sessionId,
    connectionId,
    totalConnections: sessionConnections.size,
    removedStale: staleConnectionIds.length
  });
  
  // Get session from session manager
  const session = sessionManager.getSession(sessionId);
  
  if (!session) {
    logger.error('Session not found in SSE connection:', sessionId);
    res.write(`event: error\ndata: ${JSON.stringify({ error: 'Session not found' })}\n\n`);
    res.end();
    return;
  }
  
  debugLog('SSE connection - session state:', {
    sessionId,
    connectionId,
    messageCount: session.messages.length,
    activeConnections: sessionConnections.size,
    greetingShown: session.greetingShown,
    lastMessageCompleted: session.lastMessageCompleted
  });
  
  // Check if there are any existing messages to send to the new connection
  if (session.messages.length > 0) {
    debugLog(`Sending ${session.messages.length} existing messages to new connection`);
    debugLog('Session messages:', session.messages.map(m => ({ id: m.id, role: m.role, content: m.content?.substring(0, 50) })));
    
    // Use setImmediate to ensure events are sent after connection is established
    setImmediate(() => {
      // Send all existing messages to the new connection
      for (const message of session.messages) {
        debugLog(`Processing message: role=${message.role}, id=${message.id}, content=${message.content?.substring(0, 30)}`);
        if (message.role === 'assistant') {
          const messageId = message.id || crypto.randomUUID();
          debugLog(`Sending assistant message: ${messageId}`);
          
          try {
            // Send message-start event
            res.write(`event: message-start\ndata: ${JSON.stringify({ 
              id: messageId,
              type: 'assistant',
              isGreeting: message.isGreeting || false
            })}\n\n`);
            
            // Send the complete message content
            res.write(`event: message-chunk\ndata: ${JSON.stringify({ 
              messageId: messageId, 
              chunk: message.content
            })}\n\n`);
            
            // Send message-complete event
            res.write(`event: message-complete\ndata: ${JSON.stringify({ 
              messageId: messageId 
            })}\n\n`);
          } catch (err) {
            debugLog('Error sending existing message:', err);
          }
        } else if (message.role === 'tool') {
          debugLog(`Sending tool message: ${message.id}`);
          
          try {
            // Send tool execution event
            res.write(`event: tool-execution\ndata: ${JSON.stringify({ 
              messageId: message.id,
              toolExecution: {
                id: message.id,
                name: message.name,
                args: message.args,
                status: message.status || 'complete',
                executionTime: message.executionTime
              }
            })}\n\n`);
          } catch (err) {
            debugLog('Error sending tool message:', err);
          }
        }
      }
    });
  }
  
  // Check if we should show greeting (only if no messages exist)
  if (!session.greetingShown && session.messages.length === 0 && !session.greetingInProgress) {
    // Mark greeting as in progress to prevent duplicates
    sessionManager.setGreetingInProgress(sessionId, true);
    
    // Generate greeting for new session immediately
    debugLog('Initiating greeting generation for new session');
    
    // Generate greeting without delay
    (async () => {
      try {
        
        const { userName, userEmail } = session;
        const { projectPath, repoName } = session;
        
        debugLog('Greeting session data:', { userName, projectPath, repoName });
        
        if (!projectPath || !repoName) {
          debugLog('Missing required path data for greeting:', { projectPath, repoName });
          throw new Error(`Missing path data: projectPath=${projectPath}, repoName=${repoName}`);
        }
        
        // Get project info
        const projectName = path.basename(projectPath);
        
        // Create greeting prompt
        const greetingPrompt = `Generate a friendly, personalized greeting for a Claude Code session. Keep it brief (1-2 sentences), warm, and motivating.

Context:
- User's name: ${userName || 'Developer'}
- Repository: ${repoName}
- Project: ${projectName}
- Current time: ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}

The greeting should:
- Welcome the user by name (if available)
- Mention the repository they're working in
- Be encouraging and ready to help
- End with something like "What would you like to work on?" or similar
- Feel fresh and not repetitive
- Occasionally use relevant developer-friendly phrases or mild humor

Examples of good greetings:
- "Hey Alex! Ready to dive into the auth-service repo? Let's build something great today!"
- "Good morning Sarah! I see you're working on the frontend-app repo. What feature shall we tackle?"
- "Welcome back, Jordan! Time to make some magic happen in the api-gateway repo. What's on the agenda?"

Generate a greeting now:`;

        const claudeService = require('./claude-service');
        
        // Create a greeting message ID
        const greetingMessageId = crypto.randomUUID();
        debugLog(`Created greeting message ID: ${greetingMessageId}`);
        
        // Get current connections
        const connections = claudeCodeClients.get(sessionId);
        if (!connections || connections.size === 0) {
          debugLog('No active connections for greeting, skipping');
          sessionManager.setGreetingShown(sessionId, false);
          sessionManager.setGreetingInProgress(sessionId, false);
          return;
        }
        
        debugLog(`Sending greeting to ${connections.size} connections for session ${sessionId}`);
        
        // Send greeting start event to all active connections
        for (const [connId, conn] of connections.entries()) {
          try {
            conn.res.write(`event: message-start\ndata: ${JSON.stringify({ 
              id: greetingMessageId,
              type: 'assistant',
              isGreeting: true 
            })}\n\n`);
            debugLog(`Sent message-start to connection ${connId}`);
          } catch (err) {
            debugLog(`Error sending message-start to connection ${connId}:`, err);
            // Remove dead connection
            connections.delete(connId);
          }
        }
        
        debugLog('Claude service available:', claudeService.isClaudeAvailable);
        
        let greetingText = '';
        
        if (claudeService.isClaudeAvailable) {
          // Get real greeting from Claude
          debugLog('Calling processClaudeCodeMessage for greeting');
          const greetingResponse = await claudeService.processClaudeCodeMessage(
            greetingPrompt,
            [], // No tools needed for greeting
            'opus',
            path.join(projectPath, 'repos', repoName),
            null, // No progress callback needed
            null, // No tool execution callback
            null  // No message callback
          );
          
          debugLog('Greeting response:', greetingResponse);
          debugLog('Response text type:', typeof greetingResponse.text);
          
          if (greetingResponse.text && typeof greetingResponse.text === 'string') {
            greetingText = greetingResponse.text;
          } else {
            // Fallback if Claude returns no text
            greetingText = `Hello${userName ? ' ' + userName : ''}! I'm ready to help you with the **${repoName}** repository. What would you like to work on today?`;
          }
        } else {
          // Fallback greeting when Claude is not available
          greetingText = `Hello${userName ? ' ' + userName : ''}! I'm ready to help you with the **${repoName}** repository. What would you like to work on today?`;
        }
        
        // Send the complete greeting as a single chunk for reliability
        // Add a small delay to ensure message-start is processed first
        await new Promise(resolve => setTimeout(resolve, 50));
        
        const currentConnections = claudeCodeClients.get(sessionId);
        if (currentConnections && currentConnections.size > 0) {
          debugLog(`Sending greeting to ${currentConnections.size} connections`);
          
          for (const [connId, conn] of currentConnections.entries()) {
            try {
              // Send the complete text as one chunk
              debugLog(`Sending chunk with messageId: ${greetingMessageId} to connection ${connId}`);
              conn.res.write(`event: message-chunk\ndata: ${JSON.stringify({ 
                messageId: greetingMessageId, 
                chunk: greetingText
              })}\n\n`);
              debugLog(`Sent greeting chunk to connection ${connId}`);
            } catch (err) {
              debugLog(`Error sending greeting to connection ${connId}:`, err);
              currentConnections.delete(connId);
            }
          }
        } else {
          debugLog('No active connections to send greeting to');
          // Store the greeting message so it can be retrieved when client reconnects
          const existingMessage = session.messages.find(m => m.role === 'assistant' && m.isGreeting);
          if (!existingMessage) {
            debugLog('Storing greeting message for later delivery');
          }
        }
        
        // Add greeting to session messages with the same ID
        sessionManager.addMessage(sessionId, { 
          id: greetingMessageId,
          role: 'assistant', 
          content: greetingText,
          isGreeting: true,
          timestamp: new Date().toISOString()
        });
        
        // Send message complete event
        const finalConnections = claudeCodeClients.get(sessionId);
        if (finalConnections && finalConnections.size > 0) {
          debugLog(`Sending message-complete to ${finalConnections.size} connections`);
          for (const [connId, conn] of finalConnections.entries()) {
            try {
              conn.res.write(`event: message-complete\ndata: ${JSON.stringify({ 
                messageId: greetingMessageId 
              })}\n\n`);
              debugLog(`Sent message-complete to connection ${connId}`);
            } catch (err) {
              debugLog(`Error sending message-complete to connection ${connId}:`, err);
              finalConnections.delete(connId);
            }
          }
        }
        
        
        logger.logEvent('CLAUDE_GREETING_GENERATED', 'Greeting message sent', {
          sessionId,
          greetingLength: greetingText.length,
          activeConnections: finalConnections?.size || 0
        });
        
        logger.writeClaudeLog('Greeting generation completed and marked');
        
        // Mark greeting as completed
        sessionManager.setGreetingShown(sessionId, true);
        sessionManager.setGreetingInProgress(sessionId, false);
        
      } catch (error) {
        debugLog('Error generating greeting:', error);
        debugLog('Error stack:', error.stack);
        console.error('Error generating greeting:', error);
        // Reset flags on error so greeting can be retried
        sessionManager.setGreetingShown(sessionId, false);
        sessionManager.setGreetingInProgress(sessionId, false);
        // Continue without greeting on error
      }
    })();
  }
  
  // Heartbeat to keep connection alive and detect dead connections
  const heartbeat = setInterval(() => {
    try {
      res.write(':heartbeat\n\n');
      // Update last heartbeat time
      const conn = sessionConnections.get(connectionId);
      if (conn) {
        conn.lastHeartbeat = Date.now();
      }
    } catch (err) {
      clearInterval(heartbeat);
      // Remove dead connection
      sessionConnections.delete(connectionId);
      logger.logEvent('CLAUDE_SSE_HEARTBEAT_FAILED', 'Connection failed during heartbeat', {
        sessionId,
        connectionId
      });
    }
  }, 30000);
  
  // Clean up on disconnect
  const cleanup = () => {
    clearInterval(heartbeat);
    
    const connections = claudeCodeClients.get(sessionId);
    if (connections) {
      connections.delete(connectionId);
      
      // If no more connections for this session, clean up the session map
      if (connections.size === 0) {
        claudeCodeClients.delete(sessionId);
      }
    }
    
    logger.logEvent('CLAUDE_SSE_DISCONNECTED', 'Claude Code SSE client disconnected', {
      sessionId,
      connectionId,
      remainingConnections: connections?.size || 0
    });
  };
  
  // Handle both 'close' and 'error' events
  req.on('close', cleanup);
  req.on('error', cleanup);
  res.on('close', cleanup);
  res.on('error', cleanup);
});

// Cancel Claude Code message
app.post('/api/claude/code/cancel', async (req, res) => {
  try {
    const { sessionId, messageId } = req.body;
    
    if (!sessionId || !messageId) {
      return res.status(400).json({ error: 'Session ID and message ID required' });
    }
    
    const session = sessionManager.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Send cancel event to all SSE connections
    const connections = claudeCodeClients.get(sessionId);
    if (connections) {
      for (const [connId, conn] of connections.entries()) {
        try {
          conn.res.write(`event: message-cancelled\ndata: ${JSON.stringify({ messageId })}\n\n`);
        } catch (err) {
          console.error('Error sending cancel event to connection', connId, ':', err);
          connections.delete(connId);
        }
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error cancelling message:', error);
    res.status(500).json({ 
      error: 'Failed to cancel message',
      message: error.message 
    });
  }
});

// End Claude Code session
app.post('/api/claude/code/end', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    logger.logClient('REQUEST', {
      method: 'POST',
      url: '/api/claude/code/end',
      sessionId
    });
    
    console.log('=== END SESSION REQUEST ===');
    console.log('Session ID:', sessionId);
    console.log('All active sessions:', Array.from(sessionManager.getAllSessionIds()));
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }
    
    const session = sessionManager.getSession(sessionId);
    console.log('Session found:', !!session);
    
    // If session not found in memory, try to recover from sessionId
    if (!session) {
      console.log('Session not found in memory, attempting recovery from sessionId:', sessionId);
      
      // SessionId format: projectId-repoName-uuid
      const parts = sessionId.split('-');
      if (parts.length >= 3) {
        const projectId = parts[0];
        // Handle repo names that might contain hyphens
        const repoName = parts.slice(1, -1).join('-');
        
        console.log('Recovered from sessionId:', { projectId, repoName });
        
        // Try to find project path from workspace
        const workspacePath = '/home/dzearing/workspace';
        const projectsPath = path.join(workspacePath, 'projects');
        
        try {
          const projectDirs = await fsAsync.readdir(projectsPath);
          for (const projectName of projectDirs) {
            const projectPath = path.join(projectsPath, projectName);
            
            // Check if this project has the repo we're looking for
            const reposPath = path.join(projectPath, 'repos');
            try {
              const repoDirs = await fsAsync.readdir(reposPath);
              if (repoDirs.includes(repoName)) {
                console.log('Found project path:', projectPath);
                
                // Release the repository
                try {
                  await claudeFlowSettings.releaseRepository(projectPath, repoName);
                  console.log(`Released repo ${repoName} back to available in claudeflow.settings.json (recovery mode)`);
                  
                  res.json({ success: true, message: 'Session ended (recovered)' });
                  return;
                } catch (err) {
                  console.error('Error releasing repository during recovery:', err);
                }
              }
            } catch (err) {
              // repos directory might not exist
            }
          }
        } catch (err) {
          console.error('Error during session recovery:', err);
        }
      }
      
      return res.status(404).json({ error: 'Session not found and recovery failed' });
    }
    
    // Clean up session
    sessionManager.deleteSession(sessionId);
    
    // Remove all SSE connections
    const connections = claudeCodeClients.get(sessionId);
    if (connections) {
      for (const [connId, conn] of connections.entries()) {
        try {
          conn.res.write(`event: session-end\ndata: ${JSON.stringify({ message: 'Session ended' })}\n\n`);
          conn.res.end();
        } catch (err) {
          // Connection might already be disconnected
        }
      }
      claudeCodeClients.delete(sessionId);
    }
    
    // Mark repo as available again in REPOS.md and clear Claude history
    console.log('Session cleanup:', {
      sessionId,
      repoName: session.repoName,
      projectPath: session.projectPath
    });
    
    if (session.repoName && session.projectPath) {
      const repoPath = path.join(session.projectPath, 'repos', session.repoName);
      
      console.log('Repo path:', repoPath);
      
      // Clear Claude history for this repo
      try {
        await clearClaudeHistory(repoPath);
        console.log(`Cleared Claude history for ${session.repoName}`);
      } catch (err) {
        console.error('Error clearing Claude history:', err);
      }
      
      // Update claudeflow.settings.json
      try {
        console.log('About to release repository:', session.repoName);
        await claudeFlowSettings.releaseRepository(session.projectPath, session.repoName);
        console.log(`Released repo ${session.repoName} back to available in claudeflow.settings.json`);
        
        // Verify it was released
        const settings = await claudeFlowSettings.load(session.projectPath);
        console.log('Verification - repo status after release:', settings.repositories[session.repoName]);
      } catch (err) {
        console.error('Error updating claudeflow.settings.json:', err);
        console.error('Full error:', err.stack);
      }
    } else {
      console.log('Warning: No reservedRepo or projectPath in session');
    }
    
    logger.logEvent('CLAUDE_SESSION_ENDED', 'Claude Code session ended successfully', {
      sessionId,
      repoName: session.repoName,
      projectPath: session.projectPath
    });
    
    logger.logClient('RESPONSE', { status: 200, success: true });
    res.json({ success: true, message: 'Session ended' });
    
  } catch (error) {
    console.error('Error ending Claude Code session:', error);
    logger.logClient('RESPONSE', { status: 500, error: error.message });
    res.status(500).json({ 
      error: 'Failed to end session',
      message: error.message 
    });
  }
});

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Log files available in: ${path.join(__dirname, 'logs')}/`);
  console.log('  - client-messages.log: Client requests and responses');
  console.log('  - claude-messages.log: Claude API interactions');
  console.log('  - events.log: High-level system events');
  
  logger.logEvent('SERVER_READY', `Server listening on port ${PORT}`, {
    port: PORT,
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
  });
  
  // Check Claude availability on startup
  if (claudeService.isClaudeAvailable) {
    console.log('Claude Code SDK integrated and ready');
  } else {
    console.log('⚠️  Claude CLI not found or not authenticated');
    console.log('   To use Claude features:');
    console.log('   1. Install: npm install -g claude-code');
    console.log('   2. Login: claude login');
    console.log('   Or use mock mode for testing');
  }
  
  // Clean up any orphaned Claude Code reservations on startup
  console.log('Checking for orphaned Claude Code reservations...');
  const workspacePath = '/home/dzearing/workspace';
  const projectsPath = path.join(workspacePath, 'projects');
  
  try {
    const projectDirs = await fsAsync.readdir(projectsPath);
    for (const projectName of projectDirs) {
      if (projectName.startsWith('.')) continue;
      
      const projectPath = path.join(projectsPath, projectName);
      const settingsPath = path.join(projectPath, 'claudeflow.settings.json');
      
      try {
        // Check if settings file exists
        await fsAsync.access(settingsPath);
        
        // Load settings
        const settings = await claudeFlowSettings.load(projectPath);
        
        if (settings.repositories) {
          let hasOrphaned = false;
          
          // Check for orphaned Claude Code reservations
          for (const [repoName, repo] of Object.entries(settings.repositories)) {
            if (repo.status === 'reserved' && repo.reservedBy === 'claude-code') {
              console.log(`Found orphaned Claude Code reservation: ${projectName}/${repoName}`);
              
              // Release it
              await claudeFlowSettings.releaseRepository(projectPath, repoName);
              hasOrphaned = true;
            }
          }
          
          if (hasOrphaned) {
            console.log(`Cleaned up orphaned reservations in ${projectName}`);
          }
        }
      } catch (err) {
        // Settings file doesn't exist or error reading it
      }
    }
  } catch (err) {
    console.error('Error cleaning up orphaned reservations:', err);
  }
  
  console.log('Server startup complete');
});