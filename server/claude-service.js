const claude = require('@instantlyeasy/claude-code-sdk-ts').claude;
const { execSync } = require('child_process');

class ClaudeService {
  constructor() {
    this.isClaudeAvailable = this.checkClaudeAvailability();
  }

  checkClaudeAvailability() {
    try {
      // Try to check if claude CLI is available
      const result = execSync('which claude', { encoding: 'utf8' }).trim();
      console.log('Claude CLI found at:', result);
      return true;
    } catch (error) {
      console.log('Claude CLI not found in PATH');
      return false;
    }
  }
  async processDebugQuery(query, model, tools = []) {
    try {
      // Build the claude query with correct API
      let claudeQuery = claude();

      // Set model first if provided
      if (model) {
        claudeQuery = claudeQuery.withModel(model);
      }

      // Then set the query
      claudeQuery = claudeQuery.query(query);

      // Configure tools if provided
      if (tools.length > 0) {
        tools.forEach(tool => {
          switch(tool) {
            case 'search':
              claudeQuery = claudeQuery.withSearch();
              break;
            case 'read':
              claudeQuery = claudeQuery.withRead();
              break;
            case 'write':
              claudeQuery = claudeQuery.withWrite();
              break;
            case 'bash':
              claudeQuery = claudeQuery.withBash();
              break;
          }
        });
      }

      // Execute query and gather response data
      const startTime = Date.now();
      
      // Try to get text response directly
      let response = {
        text: null,
        json: null,
        toolExecutions: null,
        tokenUsage: null,
        error: null
      };

      try {
        // Get text response
        response.text = await claudeQuery.asText();
        console.log('Claude SDK response received:', response.text ? response.text.substring(0, 100) + '...' : 'No response');
      } catch (e) {
        console.error('Claude SDK error:', e);
        throw new Error(`Claude SDK failed: ${e.message}`);
      }

      try {
        // Try to parse as JSON if possible
        if (response.text && response.text.includes('{')) {
          const jsonMatch = response.text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            response.json = JSON.parse(jsonMatch[0]);
          }
        }
      } catch (e) {
        // JSON parsing failed
      }

      // Token usage is not available with the current SDK implementation
      // We'll just provide mock values for now
      response.tokenUsage = {
        inputTokens: query.length / 4, // rough estimate
        outputTokens: response.text ? response.text.length / 4 : 0,
        totalTokens: 0
      };
      response.tokenUsage.totalTokens = response.tokenUsage.inputTokens + response.tokenUsage.outputTokens;

      return response;
    } catch (error) {
      console.error('Claude debug query error:', error);
      return {
        error: error.message || 'Failed to process Claude query',
        text: null,
        json: null,
        toolExecutions: null,
        tokenUsage: null
      };
    }
  }

  async processIdea(idea, model = 'claude-3-5-sonnet-20241022') {
    // Check if Claude is available first
    if (!this.isClaudeAvailable) {
      throw new Error(
        'Claude CLI is not installed or not in PATH.\n' +
        'Please install Claude Code CLI and authenticate:\n' +
        '1. Install: npm install -g claude-code\n' +
        '2. Login: claude login\n' +
        'Or enable mock mode in settings for testing.'
      );
    }

    const prompt = `You are a project management assistant. A user has provided the following idea for a work item:

"${idea}"

Please break this down into specific, actionable tasks. For each task, provide:
1. A clear, concise title
2. A detailed description
3. 2-3 specific goals
4. A work description explaining what needs to be done
5. 2-3 validation criteria to verify the task is complete

Respond with a JSON array of tasks in this exact format:
{
  "tasks": [
    {
      "id": "unique-id",
      "title": "Task Title",
      "description": "Detailed description",
      "goals": ["Goal 1", "Goal 2"],
      "workDescription": "What needs to be done",
      "validationCriteria": ["Criteria 1", "Criteria 2"]
    }
  ]
}`;

    try {
      console.log('Processing idea with Claude SDK...');
      const response = await claude()
        .withModel(model)
        .query(prompt)
        .asText();

      console.log('Claude SDK response received');
      
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Could not parse response as JSON');
    } catch (error) {
      console.error('Error processing idea:', error);
      
      // If it's a CLI execution error, provide a helpful message
      if (error.message && error.message.includes('exited with code 1')) {
        throw new Error(
          'Claude CLI authentication error. Please ensure:\n' +
          '1. You are logged in: claude login\n' +
          '2. Or enable mock mode in settings for testing'
        );
      }
      
      throw error;
    }
  }

  async refineTasks(refinement, currentTasks, model = 'claude-3-5-sonnet-20241022') {
    // Check if Claude is available first
    if (!this.isClaudeAvailable) {
      throw new Error(
        'Claude CLI is not installed or not in PATH.\n' +
        'Please install Claude Code CLI and authenticate:\n' +
        '1. Install: npm install -g claude-code\n' +
        '2. Login: claude login\n' +
        'Or enable mock mode in settings for testing.'
      );
    }

    const prompt = `You are a project management assistant. Here are the current tasks:

${JSON.stringify(currentTasks, null, 2)}

The user has provided this refinement:
"${refinement}"

Please update the tasks based on this refinement. You may:
- Modify existing tasks
- Add new tasks
- Remove tasks that are no longer relevant
- Adjust goals, descriptions, or validation criteria

Respond with the updated JSON array of tasks in the same format as before.`;

    try {
      console.log('Attempting to refine tasks with Claude SDK...');
      const response = await claude()
        .withModel(model)
        .query(prompt)
        .asText();

      console.log('Claude SDK response received for refine tasks');
      
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Could not parse response as JSON');
    } catch (error) {
      console.error('Error refining tasks:', error);
      console.error('Error details:', error.stack);
      
      // If it's a CLI authentication error, provide a helpful message
      if (error.message && error.message.includes('exited with code 1')) {
        throw new Error(
          'Claude CLI authentication error. Please ensure:\n' +
          '1. Claude Code is installed: npm install -g claude-code\n' +
          '2. You are logged in: claude login\n' +
          '3. Try using mock mode for testing without authentication'
        );
      }
      
      throw error;
    }
  }
}

module.exports = new ClaudeService();