const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const claudeService = require('./claude-service');
const crypto = require('crypto');
const path = require('path');
const { execSync } = require('child_process');

// Load .env from parent directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

console.log('=== SERVER STARTUP ===');
console.log('Current directory:', process.cwd());
console.log('GITHUB_CLIENT_ID:', process.env.GITHUB_CLIENT_ID);
console.log('GITHUB_CLIENT_SECRET:', process.env.GITHUB_CLIENT_SECRET ? '***hidden***' : 'not set');
console.log('PORT:', process.env.PORT);
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);

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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', claudeAvailable: true });
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
    
    console.log('Process idea request:', { idea: idea.substring(0, 50), mockMode, model });
    
    if (!idea) {
      return res.status(400).json({ error: 'Idea text is required' });
    }

    // If mock mode is enabled, return mock data
    if (mockMode) {
      console.log('Using mock mode for process-idea');
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Generate mock tasks based on the idea
      const mockTasks = [
        {
          id: Math.random().toString(36).substring(2, 9),
          title: "Design and Architecture",
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
          title: "Core Implementation",
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

      return res.json({ tasks: mockTasks });
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
const fs = require('fs').promises;
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

  if (!content) return workItem;

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
  const tasksMatch = content.match(/##\s*Tasks\s*\n+([\s\S]*?)(?=\n##\s*(?:Metadata|$))/i);
  if (tasksMatch) {
    const tasksContent = tasksMatch[1].trim();
    // Split by "### Task" but keep the content after it
    const taskSections = tasksContent.split(/(?=###\s*Task\s+)/);
    const taskMatches = taskSections.filter(t => t.trim() && t.includes('###'));
    
    console.log('Tasks content length:', tasksContent.length);
    console.log('Task sections found:', taskMatches.length);
    
    workItem.tasks = taskMatches.map(taskSection => {
      // Remove the ### Task prefix
      const taskContent = taskSection.replace(/###\s*Task\s+/, '');
      const task = {
        id: '',
        taskNumber: '',
        title: '',
        description: '',
        goals: [],
        workDescription: '',
        validationCriteria: []
      };
      
      // Extract task number and title
      const titleMatch = taskContent.match(/^(\d+[a-z]?):\s*(.+?)(?:\n|$)/);
      if (titleMatch) {
        task.taskNumber = titleMatch[1];
        task.title = titleMatch[2].trim();
        task.id = `task-${titleMatch[1]}`; // Generate ID from task number
      }
      
      // Extract description
      const descMatch = taskContent.match(/\*\*Description:\*\*\s*(.+?)(?=\n\*\*|$)/s);
      if (descMatch) {
        task.description = descMatch[1].trim();
      }
      
      // Extract goals
      const goalsMatch = taskContent.match(/\*\*Goals:\*\*\s*\n([\s\S]*?)(?=\n\*\*|$)/);
      if (goalsMatch) {
        const goalLines = goalsMatch[1].trim().split('\n');
        task.goals = goalLines
          .filter(line => line.match(/^-\s*\[[\sx]\]/))
          .map(line => line.replace(/^-\s*\[[\sx]\]\s*/, '').trim());
      }
      
      // Extract work description
      const workMatch = taskContent.match(/\*\*Work\s+Description:\*\*\s*\n?([\s\S]*?)(?=\n\*\*|$)/);
      if (workMatch) {
        task.workDescription = workMatch[1].trim();
      }
      
      // Extract acceptance criteria
      const criteriaMatch = taskContent.match(/\*\*Acceptance\s+Criteria:\*\*\s*\n?([\s\S]*?)$/);
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

  // Extract metadata (if exists - for backward compatibility)
  const metadataMatch = content.match(/##\s*Metadata\s*\n+```json\n([\s\S]*?)\n```/i);
  if (metadataMatch) {
    try {
      workItem.metadata = JSON.parse(metadataMatch[1]);
    } catch (err) {
      // Invalid JSON
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
    const gitExists = await fs.access(gitPath).then(() => true).catch(() => false);
    
    if (gitExists) {
      // Try to read git config for remote URL
      try {
        const configPath = path.join(gitPath, 'config');
        const gitConfig = await fs.readFile(configPath, 'utf-8');
        
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
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      if (packageJson.private === false) {
        details.visibility = 'public';
      }
    } catch (err) {
      // No package.json or invalid
    }

    // Identify important folders
    const entries = await fs.readdir(repoPath, { withFileTypes: true });
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
      const items = await fs.readdir(resolvedPath);
      const results = [];
      
      console.log(`Browsing directory: ${resolvedPath}`);
      console.log(`Found ${items.length} items`);
      
      for (const item of items) {
        try {
          const itemPath = path.join(resolvedPath, item);
          const stats = await fs.stat(itemPath);
          
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
      await fs.mkdir(newFolderPath, { recursive: false });
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
      const stats = await fs.stat(workspacePath);
      if (!stats.isDirectory()) {
        res.json({ exists: false, hasContent: false });
        return;
      }

      // Check if projects folder exists and has content
      let hasContent = false;
      try {
        const projectsPath = path.join(workspacePath, 'projects');
        const projectStats = await fs.stat(projectsPath);
        if (projectStats.isDirectory()) {
          const projectDirs = await fs.readdir(projectsPath);
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
      const projectDirs = await fs.readdir(projectsPath);
      
      // Read all project basic info in parallel
      const projectPromises = projectDirs
        .filter(name => !name.startsWith('.'))
        .map(async (projectName) => {
          const projectPath = path.join(projectsPath, projectName);
          const stats = await fs.stat(projectPath);
          
          if (!stats.isDirectory()) return null;

          // Check if tracked
          try {
            const settingsPath = path.join(projectPath, 'claudeflow.settings.json');
            const settingsContent = await fs.readFile(settingsPath, 'utf-8');
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
      readmeContent = await fs.readFile(readmePath, 'utf-8');
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
      const repoDirs = await fs.readdir(reposPath);
      
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
        const planFiles = await fs.readdir(plansPath);
        
        project.plans[planType] = planFiles
          .filter(file => file.endsWith('.md') && file !== 'TEMPLATE.md')
          .map(file => ({
            name: file.replace('.md', ''),
            path: path.join(plansPath, file),
            status: planType,
            // Don't read content yet - lazy load when needed
            contentLoaded: false
          }));
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
    const content = await fs.readFile(workItemPath, 'utf-8');
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
      const projectDirs = await fs.readdir(projectsPath);
      console.log('Found directories in projects folder:', projectDirs);
      
      for (const projectName of projectDirs) {
        console.log('Checking project:', projectName);
        if (projectName.startsWith('.')) {
          console.log('Skipping hidden folder:', projectName);
          continue;
        }
        
        const projectPath = path.join(projectsPath, projectName);
        const stats = await fs.stat(projectPath);
        
        if (stats.isDirectory()) {
          // Check for claudeflow.settings.json
          try {
            const settingsPath = path.join(projectPath, 'claudeflow.settings.json');
            const settingsContent = await fs.readFile(settingsPath, 'utf-8');
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
            readmeContent = await fs.readFile(readmePath, 'utf-8');
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
            const repoDirs = await fs.readdir(reposPath);
            
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
              const planFiles = await fs.readdir(plansPath);
              
              // Read all files in this plan type in parallel
              const filePromises = planFiles
                .filter(planFile => planFile.endsWith('.md') && planFile !== 'TEMPLATE.md')
                .map(async (planFile) => {
                  const planPath = path.join(plansPath, planFile);
                  const content = await fs.readFile(planPath, 'utf-8');
                  
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
    
    const content = await fs.readFile(filePath, 'utf-8');
    res.json({ content });
    
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
    
    await fs.writeFile(filePath, content, 'utf-8');
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
      await fs.mkdir(dir, { recursive: true });
    }

    // Check if .template folder exists, create it if not
    const templatePath = path.join(workspacePath, 'projects', '.template');
    try {
      await fs.access(templatePath);
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
        await fs.mkdir(dir, { recursive: true });
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

      await fs.writeFile(
        path.join(templatePath, 'README.md'),
        templateReadme
      );

      await fs.writeFile(
        path.join(templatePath, 'REPOS.md'),
        templateRepos
      );

      await fs.writeFile(
        path.join(templatePath, 'plans', 'ideas', 'TEMPLATE.md'),
        templatePlan
      );
    }

    // Create STATUS.md at workspace root if it doesn't exist
    const statusPath = path.join(workspacePath, 'STATUS.md');
    try {
      await fs.access(statusPath);
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

      await fs.writeFile(statusPath, statusMd);
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
      await fs.access(projectPath);
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
      await fs.mkdir(dir, { recursive: true });
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

    await fs.writeFile(
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

    await fs.writeFile(
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
      await fs.mkdir(reposPath, { recursive: true });
      const existingRepos = await fs.readdir(reposPath);
      
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
        let reposContent = await fs.readFile(reposmdPath, 'utf-8');
        
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
        
        await fs.writeFile(reposmdPath, reposContent);
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
      const packageContent = await fs.readFile(packageJsonPath, 'utf-8');
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
      const readmeContent = await fs.readFile(readmePath, 'utf-8');
      
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
    await fs.writeFile(readmePath, readmeContent);

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
      await fs.access(projectPath);
    } catch (err) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Create claudeflow.settings.json
    const settingsPath = path.join(projectPath, 'claudeflow.settings.json');
    const settings = {
      tracked: false
    };
    
    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));
    
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
      await fs.access(projectPath);
    } catch (err) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Remove the project folder
    await fs.rm(projectPath, { recursive: true, force: true });
    
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
    await fs.mkdir(planPath, { recursive: true });

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
    await fs.writeFile(filePath, markdownContent);

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
          const files = await fs.readdir(planDir);
          for (const file of files) {
            if (file.endsWith('.md')) {
              const filePath = path.join(planDir, file);
              const content = await fs.readFile(filePath, 'utf-8');
              
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
    await fs.writeFile(existingFilePath, markdownContent);

    // If the filename changed, rename the file
    if (existingFilePath !== newFilePath && path.basename(existingFilePath) !== newFilename) {
      try {
        await fs.rename(existingFilePath, newFilePath);
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
  try {
    const { projectPath, repositories } = req.body;
    
    if (!projectPath || !repositories || !Array.isArray(repositories)) {
      return res.status(400).json({ error: 'Project path and repositories array are required' });
    }

    const reposPath = path.join(projectPath, 'REPOS.md');
    
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
    
    // Read existing repos directory to list clones
    try {
      const reposDir = path.join(projectPath, 'repos');
      const repoDirs = await fs.readdir(reposDir);
      
      for (const repoDir of repoDirs) {
        const match = repoDir.match(/^(.+)-(\d+)$/);
        if (match) {
          content += `- ${repoDir}: Available\n`;
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
    await fs.writeFile(reposPath, content, 'utf-8');
    
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
      await fs.access(fullPath);
    } catch (err) {
      console.error('File not found:', fullPath);
      return res.status(404).json({ error: 'Markdown file not found' });
    }
    
    if (permanentDelete) {
      // Permanently delete the file
      await fs.unlink(fullPath);
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
      await fs.mkdir(discardedPath, { recursive: true });
      
      // Get filename and create destination path
      const filename = path.basename(fullPath);
      const destPath = path.join(discardedPath, filename);
      
      // Move the file
      await fs.rename(fullPath, destPath);
      
      res.json({ 
        success: true, 
        message: 'Work item moved to discarded folder',
        newPath: path.relative(path.join(process.cwd(), '..'), destPath)
      });
    }
    
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  
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
});