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

// Workspace endpoints
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

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
    type: 'github',
    visibility: 'private',
    importantFolders: []
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
        if (gitConfig.includes('dev.azure.com')) {
          details.type = 'ado';
        }
      } catch (err) {
        // Ignore git config read errors
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
                  // Enhance existing repo info
                  Object.assign(matchingRepo, repoDetails);
                  // Update the URL if it was a placeholder
                  if (matchingRepo.url === 'local://development') {
                    matchingRepo.url = `local://${repoName}`;
                  }
                } else if (project.repositories.length === 0) {
                  // No matching repo found, create new entry
                  const newRepo = {
                    url: `local://${repoName}`,
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
                  
                  const parsedWorkItem = parseWorkItemMarkdown(content);
                  console.log(`Parsed work item: ${planFile}`, {
                    title: parsedWorkItem.title,
                    tasksCount: parsedWorkItem.tasks ? parsedWorkItem.tasks.length : 0,
                    tasks: parsedWorkItem.tasks
                  });
                  project.plans[planType].push({
                    name: planFile.replace('.md', ''),
                    path: planPath,
                    status: planType,
                    content: content,
                    workItem: parsedWorkItem
                  });
                }
              }
            } catch (err) {
              // Plan directory might not exist
            }
          }

          console.log('Adding project:', project.name);
          projects.push(project);
        }
      }
    } catch (err) {
      console.error('Error reading projects directory:', err);
    }

    console.log('Total projects found:', projects.length);
    console.log('Project names:', projects.map(p => p.name));
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