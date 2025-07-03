const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const claudeService = require('./claude-service');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

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
      details: error.message 
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
    res.status(500).json({ 
      error: 'Failed to refine tasks',
      details: error.message 
    });
  }
});

// Workspace endpoints
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

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

// Check if workspace exists
app.post('/api/workspace/exists', async (req, res) => {
  try {
    const { workspacePath } = req.body;
    
    if (!workspacePath) {
      return res.status(400).json({ error: 'Workspace path is required' });
    }

    try {
      const stats = await fs.stat(workspacePath);
      res.json({ exists: stats.isDirectory() });
    } catch (error) {
      res.json({ exists: false });
    }
  } catch (error) {
    console.error('Error checking workspace:', error);
    res.status(500).json({ 
      error: 'Failed to check workspace',
      details: error.message 
    });
  }
});

// Read workspace structure
app.post('/api/workspace/read', async (req, res) => {
  try {
    const { workspacePath } = req.body;
    
    if (!workspacePath) {
      return res.status(400).json({ error: 'Workspace path is required' });
    }

    // Read projects directory
    const projectsPath = path.join(workspacePath, 'projects');
    const projects = [];

    try {
      const projectDirs = await fs.readdir(projectsPath);
      
      for (const projectName of projectDirs) {
        if (projectName === 'template') continue;
        
        const projectPath = path.join(projectsPath, projectName);
        const stats = await fs.stat(projectPath);
        
        if (stats.isDirectory()) {
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

          // Read README.md
          try {
            const readmePath = path.join(projectPath, 'README.md');
            project.readme = await fs.readFile(readmePath, 'utf-8');
          } catch (err) {
            // README is optional
          }

          // Read repos
          try {
            const reposPath = path.join(projectPath, 'repos');
            const repoDirs = await fs.readdir(reposPath);
            
            for (const repoDir of repoDirs) {
              const match = repoDir.match(/^(.+)-(\d+)$/);
              if (match) {
                project.repos.push({
                  name: match[1],
                  number: parseInt(match[2]),
                  path: path.join(reposPath, repoDir),
                  isAvailable: true // TODO: Read from REPOS.md
                });
              }
            }
          } catch (err) {
            // Repos directory might not exist
          }

          // Read plans
          const planTypes = ['ideas', 'planned', 'active', 'completed'];
          for (const planType of planTypes) {
            try {
              const plansPath = path.join(projectPath, 'plans', planType);
              const planFiles = await fs.readdir(plansPath);
              
              for (const planFile of planFiles) {
                if (planFile.endsWith('.md') && planFile !== 'TEMPLATE.md') {
                  const planPath = path.join(plansPath, planFile);
                  const content = await fs.readFile(planPath, 'utf-8');
                  
                  project.plans[planType].push({
                    name: planFile.replace('.md', ''),
                    path: planPath,
                    status: planType,
                    content: content
                  });
                }
              }
            } catch (err) {
              // Plan directory might not exist
            }
          }

          projects.push(project);
        }
      }
    } catch (err) {
      console.error('Error reading projects directory:', err);
    }

    res.json({ projects });

  } catch (error) {
    console.error('Error reading workspace:', error);
    res.status(500).json({ 
      error: 'Failed to read workspace',
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
      path.join(workspacePath, 'projects'),
      path.join(workspacePath, 'projects', 'template'),
      path.join(workspacePath, 'projects', 'template', 'repos'),
      path.join(workspacePath, 'projects', 'template', 'plans'),
      path.join(workspacePath, 'projects', 'template', 'plans', 'ideas'),
      path.join(workspacePath, 'projects', 'template', 'plans', 'planned'),
      path.join(workspacePath, 'projects', 'template', 'plans', 'active'),
      path.join(workspacePath, 'projects', 'template', 'plans', 'completed')
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }

    // Create template files
    const templateReadme = `# Project Name

## Description
Brief description of the project.

## Goals
- Goal 1
- Goal 2

## Team
- Lead: [Persona Name]
- Members: [List of personas]
`;

    const templateRepos = `# Repository usage

## Repository information
- **URL**: [Repository URL]
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
      path.join(workspacePath, 'projects', 'template', 'README.md'),
      templateReadme
    );

    await fs.writeFile(
      path.join(workspacePath, 'projects', 'template', 'REPOS.md'),
      templateRepos
    );

    await fs.writeFile(
      path.join(workspacePath, 'projects', 'template', 'plans', 'ideas', 'TEMPLATE.md'),
      templatePlan
    );

    // Create STATUS.md
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

    await fs.writeFile(
      path.join(workspacePath, 'STATUS.md'),
      statusMd
    );

    res.json({ success: true, message: 'Workspace created successfully' });

  } catch (error) {
    console.error('Error creating workspace:', error);
    res.status(500).json({ 
      error: 'Failed to create workspace',
      details: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Claude Code SDK integrated and ready`);
});