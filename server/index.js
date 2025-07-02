const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { query } = require('@anthropic-ai/claude-code');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', claudeAvailable: !!process.env.ANTHROPIC_API_KEY });
});

// Process idea endpoint
app.post('/api/claude/process-idea', async (req, res) => {
  try {
    const { idea } = req.body;
    
    if (!idea) {
      return res.status(400).json({ error: 'Idea text is required' });
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

    let responseText = '';
    
    for await (const message of query({
      prompt,
      options: { 
        maxTurns: 1,
        systemPrompt: 'You are a helpful project management assistant that breaks down ideas into actionable tasks. Always respond with valid JSON.'
      }
    })) {
      if (message.text) {
        responseText += message.text;
      }
    }

    // Extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsedResponse = JSON.parse(jsonMatch[0]);
      res.json(parsedResponse);
    } else {
      throw new Error('Could not parse Claude response as JSON');
    }

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
    const { refinement, currentTasks } = req.body;
    
    if (!refinement || !currentTasks) {
      return res.status(400).json({ error: 'Refinement text and current tasks are required' });
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

    let responseText = '';
    
    for await (const message of query({
      prompt,
      options: { 
        maxTurns: 1,
        systemPrompt: 'You are a helpful project management assistant that refines task breakdowns based on user feedback. Always respond with valid JSON.'
      }
    })) {
      if (message.text) {
        responseText += message.text;
      }
    }

    // Extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsedResponse = JSON.parse(jsonMatch[0]);
      res.json(parsedResponse);
    } else {
      throw new Error('Could not parse Claude response as JSON');
    }

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
  console.log(`Claude Code API key configured: ${!!process.env.ANTHROPIC_API_KEY}`);
});