const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Helper to generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 9);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mode: 'mock' });
});

// Mock process idea endpoint
app.post('/api/claude/process-idea', async (req, res) => {
  try {
    const { idea } = req.body;
    
    if (!idea) {
      return res.status(400).json({ error: 'Idea text is required' });
    }

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate mock tasks based on common patterns
    const mockTasks = [
      {
        id: generateId(),
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
        id: generateId(),
        title: "Core Implementation",
        description: "Implement the main functionality as described in the requirements",
        goals: [
          "Build the core feature functionality",
          "Ensure code quality and maintainability",
          "Follow established patterns and conventions"
        ],
        workDescription: "Implement the main components, services, and business logic. Write clean, well-documented code following the project's coding standards.",
        validationCriteria: [
          "All core functionality is implemented and working",
          "Code passes linting and type checking",
          "Unit tests achieve >80% coverage"
        ]
      },
      {
        id: generateId(),
        title: "User Interface Development",
        description: "Create the user interface components and interactions",
        goals: [
          "Build intuitive and responsive UI components",
          "Ensure accessibility standards are met",
          "Maintain consistency with design system"
        ],
        workDescription: "Develop React components with proper state management, implement responsive layouts, add proper ARIA labels, and ensure keyboard navigation works correctly.",
        validationCriteria: [
          "UI matches design specifications",
          "All interactive elements are keyboard accessible",
          "Components are responsive across breakpoints"
        ]
      },
      {
        id: generateId(),
        title: "Testing and Quality Assurance",
        description: "Write comprehensive tests and ensure quality standards",
        goals: [
          "Achieve high test coverage",
          "Identify and fix edge cases",
          "Ensure reliability and performance"
        ],
        workDescription: "Write unit tests for all components and services, create integration tests for key workflows, and perform manual testing to identify edge cases.",
        validationCriteria: [
          "Unit test coverage exceeds 80%",
          "All critical user paths have integration tests",
          "No critical bugs in manual testing"
        ]
      }
    ];

    res.json({ tasks: mockTasks });

  } catch (error) {
    console.error('Error processing idea:', error);
    res.status(500).json({ 
      error: 'Failed to process idea',
      details: error.message 
    });
  }
});

// Mock refine tasks endpoint
app.post('/api/claude/refine-tasks', async (req, res) => {
  try {
    const { refinement, currentTasks } = req.body;
    
    if (!refinement || !currentTasks) {
      return res.status(400).json({ error: 'Refinement text and current tasks are required' });
    }

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simple mock refinement - add a new task based on keywords
    const refinedTasks = [...currentTasks];
    
    if (refinement.toLowerCase().includes('document')) {
      refinedTasks.push({
        id: generateId(),
        title: "Documentation and Training",
        description: "Create comprehensive documentation and training materials",
        goals: [
          "Document all features and APIs",
          "Create user guides and tutorials",
          "Prepare training materials for team"
        ],
        workDescription: "Write API documentation, create user guides with screenshots, develop training presentations, and record demo videos if needed.",
        validationCriteria: [
          "API documentation is complete and accurate",
          "User guide covers all features",
          "Training materials are reviewed and approved"
        ]
      });
    } else if (refinement.toLowerCase().includes('performance')) {
      refinedTasks.push({
        id: generateId(),
        title: "Performance Optimization",
        description: "Optimize performance and ensure scalability",
        goals: [
          "Improve load times and responsiveness",
          "Optimize resource usage",
          "Ensure scalability under load"
        ],
        workDescription: "Profile the application, identify bottlenecks, implement caching strategies, optimize database queries, and add performance monitoring.",
        validationCriteria: [
          "Page load time under 2 seconds",
          "Memory usage remains stable",
          "Can handle 100+ concurrent users"
        ]
      });
    } else {
      // Generic refinement - slightly modify existing tasks
      refinedTasks[0] = {
        ...refinedTasks[0],
        description: refinedTasks[0].description + " (refined based on feedback)",
        goals: [...refinedTasks[0].goals, "Address specific requirements from refinement"]
      };
    }

    res.json({ tasks: refinedTasks });

  } catch (error) {
    console.error('Error refining tasks:', error);
    res.status(500).json({ 
      error: 'Failed to refine tasks',
      details: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Mock server running on http://localhost:${PORT}`);
  console.log('This is a mock server for testing - no Claude API key required');
});