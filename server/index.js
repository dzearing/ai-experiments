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
    
    if (!idea) {
      return res.status(400).json({ error: 'Idea text is required' });
    }

    // If mock mode is enabled, return mock data
    if (mockMode) {
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Claude Code SDK integrated and ready`);
});