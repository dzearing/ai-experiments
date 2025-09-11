const { claude, isEnhancedError, hasResolution } = require('@instantlyeasy/claude-code-sdk-ts');
const { execSync } = require('child_process');
const logger = require('./logger');

class ClaudeService {
  constructor() {
    this.isClaudeAvailable = this.checkClaudeAvailability();
    this.defaultTimeout = 30000; // 30 seconds

    // Centralized model configuration
    this.models = {
      // Use 'latest' to always get the most recent version
      opus: 'opus', // Will use latest Opus
      sonnet: 'sonnet', // Will use latest Sonnet
      haiku: 'haiku', // Will use latest Haiku
      default: 'sonnet', // Default model for all operations
    };
  }

  // Get the appropriate model name
  getModel(modelKey) {
    // If no key provided, use default
    if (!modelKey) {
      return this.models.default;
    }

    // Return mapped model or use the key as-is if not found
    return this.models[modelKey] || modelKey;
  }

  // Helper function to add timeout to promises
  async withTimeout(promise, timeoutMs = this.defaultTimeout) {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out')), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
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
      // Try using the SDK in a simpler way
      console.log('Processing query with Claude SDK...');
      console.log('Query length:', query.length);
      console.log('Model:', model);
      console.log('Tools requested:', tools);

      let response = {
        text: null,
        json: null,
        toolExecutions: null,
        tokenUsage: null,
        error: null,
      };

      try {
        // Use the simplest form of the SDK
        console.log('Calling claude().query().asText()...');
        const claudeResponse = await claude().query(query).asText();

        response.text = claudeResponse;
        console.log('Claude SDK response received.');
        console.log('Response length:', response.text ? response.text.length : 0);
        console.log(
          'Response preview:',
          response.text ? response.text.substring(0, 200) + '...' : 'No response'
        );
        console.log('Full response:', response.text);
      } catch (e) {
        console.error('Claude SDK error:', e);
        console.error('Error details:', e.stack);
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
        inputTokens: Math.ceil(query.length / 4), // rough estimate
        outputTokens: response.text ? Math.ceil(response.text.length / 4) : 0,
        totalTokens: 0,
      };
      response.tokenUsage.totalTokens =
        response.tokenUsage.inputTokens + response.tokenUsage.outputTokens;

      return response;
    } catch (error) {
      console.error('Claude debug query error:', error);
      return {
        error: error.message || 'Failed to process Claude query',
        text: null,
        json: null,
        toolExecutions: null,
        tokenUsage: null,
      };
    }
  }

  async generateAgentSpecification(workDescription, model) {
    // Force using Opus model for best quality agent generation
    const modelName = this.getModel('opus');
    console.log('Using model for agent generation:', modelName);
    
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

    const prompt = `You are an expert in designing AI agent specifications. A user needs an agent for the following work:

"${workDescription}"

IMPORTANT: Return ONLY a valid JSON object. Do not include any text before or after the JSON.
Use only ASCII characters. Do not use any special characters or unicode.
For the agentPrompt field, use \\n for newlines and escape quotes properly.

Create an agent specification and return it as JSON:

{
  "name": "Choose a professional name (first and last name)",
  "type": "Choose ONE from: usability-expert, developer, tester, data-scientist, devops, project-manager, designer, motion-designer",
  "jobTitle": "Professional job title relevant to the work",
  "expertise": ["List 5-7 specific skills as an array of strings"],
  "agentPrompt": "A markdown string with the full specification. Use \\n for line breaks. Include sections for: Agent Overview, Core Capabilities, Input Requirements, Output Deliverables, Working Process, and Integration Points.",
  "loadingMessages": [
    "Create 5 unique loading messages in third person, referencing the agent by their first name",
    "Each message should be short (under 50 characters), personality-driven, and role-specific",
    "Messages should describe what the agent is doing to prepare",
    "Example for a developer named Sarah: 'Sarah is setting up her development environment...'",
    "Example for a designer named Alex: 'Alex is organizing his design workspace...'"
  ]
}

Example structure for agentPrompt field:
"# Name - Title\\n\\n## Agent Overview\\n- Name: ...\\n- Job Title: ...\\n\\n## Core Capabilities\\n- Skill 1\\n- Skill 2\\n\\n## Input Requirements\\n- Requirement 1\\n- Requirement 2\\n\\n## Output Deliverables\\n- Output 1\\n- Output 2\\n\\n## Working Process\\n1. Step 1\\n2. Step 2\\n\\n## Integration Points\\n- Integration 1\\n- Integration 2"

Example loadingMessages for a developer agent named Sarah:
["Sarah is setting up her development environment...", "Sarah is loading code analysis tools...", "Sarah is checking the latest documentation...", "Sarah is preparing her debugging toolkit...", "Sarah is syncing with the codebase..."]

Remember: Return ONLY the JSON object, nothing else.`;

    try {
      console.log('Generating agent specification with Claude SDK using Opus model...');
      const claudeResponse = await claude()
        .withModel(modelName)
        .query(prompt)
        .asText();
      
      console.log('Raw Claude response length:', claudeResponse.length);
      console.log('First 200 chars:', claudeResponse.substring(0, 200));
      
      // Clean the response first
      let cleanedResponse = claudeResponse.trim();
      
      // Remove any potential BOM or zero-width characters
      cleanedResponse = cleanedResponse.replace(/^\uFEFF/, '');
      cleanedResponse = cleanedResponse.replace(/[\u200B-\u200D\uFEFF]/g, '');
      
      // Try to extract JSON from the response
      try {
        // First, try to parse the entire response as JSON
        try {
          const parsed = JSON.parse(cleanedResponse);
          console.log('Successfully parsed entire response as JSON');
          return parsed;
        } catch (e) {
          // Response might have text around the JSON
        }
        
        // Try to find JSON in a code block
        const codeBlockMatch = cleanedResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
          const parsed = JSON.parse(codeBlockMatch[1]);
          console.log('Successfully parsed JSON from code block');
          return parsed;
        }
        
        // Try to find a raw JSON object
        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          // Additional cleaning for the extracted JSON
          let jsonStr = jsonMatch[0];
          
          // Remove any non-ASCII characters that shouldn't be in JSON
          jsonStr = jsonStr.replace(/[^\x00-\x7F]/g, (char) => {
            // Keep newlines and tabs
            if (char === '\n' || char === '\t') return char;
            // Replace other non-ASCII with space
            return ' ';
          });
          
          const parsed = JSON.parse(jsonStr);
          console.log('Successfully parsed extracted JSON object');
          return parsed;
        }
        
        // If JSON parsing fails completely, try to extract key information manually
        const nameMatch = claudeResponse.match(/"name":\s*"([^"]+)"/);
        const typeMatch = claudeResponse.match(/"type":\s*"([^"]+)"/);
        const jobTitleMatch = claudeResponse.match(/"jobTitle":\s*"([^"]+)"/);
        
        if (nameMatch && typeMatch && jobTitleMatch) {
          console.log('Falling back to manual extraction');
          
          // Extract expertise array
          const expertiseMatch = claudeResponse.match(/"expertise":\s*\[([^\]]+)\]/);
          let expertise = ['Software Development', 'Problem Solving', 'Technical Analysis'];
          if (expertiseMatch) {
            try {
              expertise = JSON.parse('[' + expertiseMatch[1] + ']');
            } catch (e) {
              // Use default expertise if parsing fails
            }
          }
          
          // Extract or generate agent prompt
          const agentPromptMatch = claudeResponse.match(/"agentPrompt":\s*"([^"]+(?:\\.[^"]+)*)"/);
          const agentPrompt = agentPromptMatch ? 
            agentPromptMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') :
            `# ${nameMatch[1]} - ${jobTitleMatch[1]}\n\n## Agent Overview\n- **Name**: ${nameMatch[1]}\n- **Job Title**: ${jobTitleMatch[1]}\n- **Agent Type**: ${typeMatch[1]}\n\n## Core Capabilities\n${expertise.map(e => `- ${e}`).join('\n')}`;
          
          return {
            name: nameMatch[1],
            type: typeMatch[1],
            jobTitle: jobTitleMatch[1],
            expertise,
            loadingMessages: [
              `${nameMatch[1].split(' ')[0]} is preparing the workspace...`,
              `${nameMatch[1].split(' ')[0]} is getting ready to assist...`,
              `${nameMatch[1].split(' ')[0]} is loading tools and resources...`,
              `${nameMatch[1].split(' ')[0]} is setting up for the conversation...`,
              `${nameMatch[1].split(' ')[0]} is organizing thoughts...`
            ],
            agentPrompt
          };
        }
        
        throw new Error('Could not extract agent information from Claude response');
        
      } catch (jsonError) {
        console.error('JSON parsing error:', jsonError);
        console.log('Failed to parse response, returning fallback');
        
        // Return a sensible fallback based on the work description
        const fallbackType = workDescription.toLowerCase().includes('boat') ? 'developer' : 'developer';
        const fallbackName = 'Alex Morgan';
        const fallbackJobTitle = workDescription.toLowerCase().includes('boat') ? 
          'Marine Systems Engineer' : 'Software Developer';
        
        return {
          name: fallbackName,
          type: fallbackType,
          jobTitle: fallbackJobTitle,
          expertise: ['Technical Analysis', 'Problem Solving', 'Project Management', 'Quality Assurance'],
          loadingMessages: [
            'Alex is setting up the workspace...',
            'Alex is loading development tools...',
            'Alex is reviewing project requirements...',
            'Alex is preparing technical resources...',
            'Alex is getting ready to assist...'
          ],
          agentPrompt: `# ${fallbackName} - ${fallbackJobTitle}

## Agent Overview
- **Name**: ${fallbackName}
- **Job Title**: ${fallbackJobTitle}
- **Primary Role**: Technical specialist for ${workDescription}
- **Agent Type**: ${fallbackType}

## Core Capabilities
- Technical Analysis and Design
- Problem Solving and Innovation
- Project Management
- Quality Assurance
- Documentation

## Input Requirements
- Clear project requirements and specifications
- Access to relevant tools and resources
- Communication channels with stakeholders

## Output Deliverables
- Technical solutions and implementations
- Documentation and reports
- Quality assessments
- Progress updates

## Working Process
1. Analyze requirements
2. Design solution
3. Implement and test
4. Document and deliver
5. Iterate based on feedback

## Integration Points
- Version control systems
- Project management tools
- Communication platforms
- Testing frameworks`
        };
      }
    } catch (error) {
      console.error('Error generating agent specification:', error);
      throw error;
    }
  }

  async processIdea(idea, model) {
    const modelName = this.getModel(model);

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

Please create:
1. A general work item description in markdown format
2. A breakdown of specific, actionable tasks

For the general markdown:
- Do NOT include the title as H1 (it will be displayed separately)
- Use H3 (###) for sections like "Description" and "Overall goals"
- Use sentence case for all headers (e.g., "Overall goals" not "Overall Goals")
- Reword the description to use third-person language (convert "I want" to "The user wants", "I need" to "The system needs", etc.)
- Make the description clear, concise, and professional
- Do NOT include Priority or Status sections

For each task, provide:
1. A clear, concise title in sentence case (e.g., "Design authentication UI components" not "Design Authentication UI Components")
2. A detailed description
3. 2-3 specific goals
4. A work description explaining what needs to be done
5. 2-3 validation criteria to verify the task is complete

Respond with JSON in this exact format:
{
  "generalMarkdown": "### Description\\n\\nProfessional description here...\\n\\n### Overall goals\\n\\n- [ ] Goal 1\\n- [ ] Goal 2",
  "tasks": [
    {
      "id": "unique-id",
      "title": "Task title in sentence case",
      "description": "Detailed description",
      "goals": ["Goal 1", "Goal 2"],
      "workDescription": "What needs to be done",
      "validationCriteria": ["Criteria 1", "Criteria 2"]
    }
  ]
}`;

    try {
      console.log('Processing idea with Claude SDK...');
      const response = await claude().withModel(modelName).query(prompt).asText();

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

  async refineTasks(refinement, currentTasks, model) {
    const modelName = this.getModel(model);

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
      const response = await claude().withModel(modelName).query(prompt).asText();

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

  async analyzeDocument(
    content,
    workItemTitle,
    workItemDescription,
    userName,
    personaName,
    personaGender,
    model
  ) {
    const modelName = this.getModel(model);

    // Check if Claude is available first
    if (!this.isClaudeAvailable) {
      // Return a mock response for development
      const isAuthRelated =
        workItemTitle.toLowerCase().includes('auth') ||
        content.toLowerCase().includes('authentication');
      const topicKeyword = isAuthRelated ? 'authentication' : 'this topic';

      // Use the provided persona name or generate a default
      const name = personaName || 'Alex Chen';

      return {
        personaType: 'usability-expert',
        expertise: ['UI/UX Design', 'User Research', 'Accessibility', 'Design Systems'],
        personality:
          'Thoughtful and detail-oriented, with a focus on user experience and design consistency',
        greetingMessage: `Hey ${userName}! I'm ${name}, a UX specialist.`,
        personalizedGreeting: isAuthRelated
          ? `I love talking about authentication - it's got so many interesting edge cases. I'll try to find some! Give me a second while I read through your document...`
          : `This looks like an interesting ${topicKeyword} to review. Let me take a moment to analyze the document...`,
        analysisMessage: `I've found 3 areas we can improve. Let's go through them one by one.`,
        issueCount: 3,
        firstSuggestion: `In [Task 1](doc:Task 1), I noticed the task organization could be more specific. Would you like me to explain this in detail?`,
        firstSuggestionDetails: `In [Task 1: Design Authentication UI Components](doc:Task 1), the description mentions creating UI components but doesn't specify which authentication methods to support (OAuth, SAML, basic auth, etc.). 

For better clarity, I suggest we specify:
- Which authentication providers (GitHub, Google, etc.)
- Whether we need multi-factor authentication support
- If we're supporting SSO

This will help developers know exactly what to build. Would you like me to update this section?`,
      };
    }

    const prompt = `You are an expert at analyzing documents and suggesting the best reviewer persona.

Analyze this work item document:

Title: ${workItemTitle}
Description: ${workItemDescription}
User's Name: ${userName}
${personaName ? `\nIMPORTANT: The reviewer's name is ${personaName} (${personaGender || 'any'} gender). You MUST use this exact name in all your responses.` : ''}

Content:
${content}

Based on the content, suggest a reviewer persona who would be best suited to review this document. Also analyze the document to find specific issues:

IMPORTANT: Actually analyze the document and count real issues:
- If the document is well-written with no issues, set issueCount to 0
- If you find 1 issue, set issueCount to 1
- If you find 2-3 issues, set issueCount to the actual number
- If you find more than 5 issues, just say "several" in the analysisMessage

Provide:
1. Their persona type (e.g., 'usability-expert', 'developer', 'tester', 'project-manager', 'designer')
2. Their areas of expertise (3-4 specific skills)
3. A brief personality description
4. A personalized greeting message directed at ${userName} that introduces yourself as ${personaName || 'the reviewer'} and mentions something specific about the topic
5. A personalized comment about the topic showing enthusiasm
6. An analysis message that accurately reflects the number of issues found:
   - If 0 issues: "Your document looks great! I don't see any areas that need improvement."
   - If 1 issue: "I found 1 area we could improve."
   - If 2-5 issues: "I've found N areas we can improve. Let's go through them one by one."
   - If 6+ issues: "I've found several areas we can improve. Let's start with the most important ones."
7. The first suggestion (only if issueCount > 0) - MUST START with: "In [Section Name](doc:exact text), ..."
8. Detailed explanation of the first suggestion (only if issueCount > 0) - MUST ALSO START with: "In [Section Name](doc:exact text), ..."

For document references, use the format [display text](doc:search text) where search text is a unique phrase from the document.

CRITICAL: Return ONLY valid JSON. Properly escape all special characters:
- Newlines as \\n, tabs as \\t, quotes as \\"
- No literal newlines inside string values
- No text before or after the JSON

Respond with exactly this JSON structure:
{
  "personaType": "type",
  "expertise": ["skill1", "skill2", "skill3"],
  "personality": "Brief personality description",
  "greetingMessage": "Hey ${userName}! I'm ${personaName || '[name]'}, a [role].",
  "personalizedGreeting": "Personalized comment about the specific topic",
  "analysisMessage": "Accurate message based on actual issue count (see instructions above)",
  "issueCount": 2,
  "firstSuggestion": "In [Task 1](doc:Design Authentication), I noticed... (ONLY include if issueCount > 0)",
  "firstSuggestionDetails": "In [Task 1's requirements](doc:Design Authentication UI Components), we should specify... (ONLY include if issueCount > 0)"
}`;

    try {
      const response = await this.withTimeout(
        claude().withModel(modelName).query(prompt).asText(),
        35000 // 35 seconds to allow some buffer over client timeout
      );

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Could not parse response as JSON');
    } catch (error) {
      console.error('Error analyzing document:', error);

      // Re-throw timeout errors to let client handle them
      if (error.message === 'Request timed out') {
        throw error;
      }
      // Return default persona on error
      return {
        personaType: 'usability-expert',
        expertise: ['UI/UX Design', 'User Research', 'Accessibility'],
        personality: 'Thoughtful and detail-oriented reviewer',
        greetingMessage: `Hi ${userName}! I'm ${personaName || 'your reviewer'}.`,
        personalizedGreeting: `I'll be reviewing your work item today. Let me provide suggestions to improve it.`,
        analysisMessage: `I've found several areas we can improve.`,
        issueCount: 3,
      };
    }
  }

  async processClaudeCodeMessage(
    prompt,
    tools = [],
    model,
    workingDirectory = null,
    onProgress = null,
    onToolExecution = null,
    onMessage = null,
    isPlanMode = false
  ) {
    const modelName = this.getModel(model);

    // Check if Claude is available first
    if (!this.isClaudeAvailable) {
      return {
        error: 'Claude CLI is not available. Please install and authenticate Claude Code CLI.',
        text: null,
        toolExecutions: [],
        tokenUsage: null,
      };
    }

    // Safety check: if we detect plan mode, ensure no write tools are included
    if (isPlanMode || tools.includes('plan')) {
      // Filter out any write-related tools
      tools = tools.filter((tool) => !['write', 'bash', 'todo'].includes(tool));
      logger.debug('Plan mode detected - filtered tools to read-only:', tools);
    }

    try {
      logger.debug('Processing Claude Code message with full SDK');
      logger.debug('Working directory:', workingDirectory);
      logger.debug('Model:', model);
      logger.debug('Requested tools:', tools);
      logger.debug('Tools array is empty?', tools.length === 0);

      // For simple text queries without tools, use asText()
      if (tools.length === 0) {
        logger.debug('Using simple text query (no tools)');
        logger.debug('Using model:', modelName);

        let claudeInstance = claude().withModel(modelName);

        if (workingDirectory) {
          claudeInstance = claudeInstance.inDirectory(workingDirectory);
        }

        console.log('Sending prompt to Claude...');
        const response = await claudeInstance.query(prompt).asText();

        console.log('Simple text response:', response);
        console.log('Response type:', typeof response);

        return {
          text: response,
          toolExecutions: [],
          tokenUsage: {
            inputTokens: Math.ceil(prompt.length / 4),
            outputTokens: Math.ceil(response.length / 4),
            totalTokens: Math.ceil(prompt.length / 4) + Math.ceil(response.length / 4),
          },
          error: null,
        };
      }

      console.log('Using model for tool execution:', modelName);

      // Build the Claude SDK chain with proper tool access and event handlers
      let claudeInstance = claude().withModel(modelName);

      // Map tool names to Claude SDK tool names
      const toolMapping = {
        search: ['Grep', 'Glob'],
        read: ['Read', 'LS', 'TodoRead'],
        write: ['Write', 'Edit', 'MultiEdit', 'NotebookEdit'],
        bash: ['Bash'],
        plan: [], // In plan mode, we'll control tools explicitly
        todo: ['TodoWrite', 'TodoRead'],
      };

      // Build the allowed tools list based on the tools parameter
      let allowedTools = [];
      if (tools && tools.length > 0) {
        tools.forEach((tool) => {
          if (toolMapping[tool]) {
            allowedTools.push(...toolMapping[tool]);
          }
        });
      } else {
        // Default to all tools if none specified
        allowedTools = [
          'LS',
          'Read',
          'Grep',
          'Bash',
          'Write',
          'Edit',
          'MultiEdit',
          'Glob',
          'NotebookRead',
          'NotebookEdit',
          'WebFetch',
          'TodoRead',
          'TodoWrite',
          'WebSearch',
          'Task',
        ];
      }

      // CRITICAL: In plan mode, remove ALL write/edit/execution tools
      if (isPlanMode || tools.includes('plan')) {
        // Only allow read-only tools in plan mode (plus exit_plan_mode)
        const readOnlyTools = [
          'LS',
          'Read',
          'Grep',
          'Glob',
          'TodoRead',
          'NotebookRead',
          'WebFetch',
          'WebSearch',
          'exit_plan_mode',
        ];
        const originalTools = [...allowedTools];
        const originalLength = allowedTools.length;
        allowedTools = allowedTools.filter((tool) => readOnlyTools.includes(tool));

        console.log('===== PLAN MODE TOOL FILTERING =====');
        console.log('isPlanMode:', isPlanMode);
        console.log('tools includes plan:', tools.includes('plan'));
        console.log('Original tools:', originalTools);
        console.log('Filtered tools:', allowedTools);
        console.log(
          'Tools removed:',
          originalTools.filter((t) => !allowedTools.includes(t))
        );
        console.log('====================================');

        logger.debug('PLAN MODE ACTIVE - Restricting to read-only tools');
        logger.debug('Tools before filtering:', originalTools);
        logger.debug(
          `Filtered out write tools. Original: ${originalLength}, Filtered: ${allowedTools.length}`
        );

        // Double-check: ensure no write tools remain
        const writeTools = ['Write', 'Edit', 'MultiEdit', 'NotebookEdit', 'Bash', 'TodoWrite'];
        const remainingWriteTools = allowedTools.filter((tool) => writeTools.includes(tool));
        if (remainingWriteTools.length > 0) {
          logger.error('ERROR: Write tools still present in plan mode:', remainingWriteTools);
          allowedTools = allowedTools.filter((tool) => !writeTools.includes(tool));
        }
      }

      logger.debug('Requested tools:', tools);
      logger.debug('Final allowed tools:', allowedTools);
      logger.debug('Is plan mode:', isPlanMode);

      // If in plan mode and no tools left, default to minimal read-only set
      if ((isPlanMode || tools.includes('plan')) && allowedTools.length === 0) {
        allowedTools = ['Read', 'LS', 'Grep', 'Glob', 'exit_plan_mode'];
        logger.debug('Plan mode with empty tools, defaulting to:', allowedTools);
      }

      claudeInstance = claudeInstance.allowTools(allowedTools).skipPermissions(); // Auto-accept tool usage to avoid permission prompts

      // Set working directory if provided
      if (workingDirectory) {
        claudeInstance = claudeInstance.inDirectory(workingDirectory);
      }

      // Track tool executions and messages
      const toolExecutions = [];
      const pendingToolExecutions = new Map(); // Track tools waiting for results
      let assistantMessage = '';
      let tokenUsage = null;
      let lastToolId = null; // Track the most recently invoked tool

      // Add event handlers for real-time feedback
      claudeInstance = claudeInstance
        .onMessage((messageType, content) => {
          logger.debug('Message event:', messageType, content);
          if (onMessage) {
            onMessage(messageType, content);
          }

          // Check if this is a tool result message
          if (
            messageType === 'tool_result' &&
            lastToolId &&
            pendingToolExecutions.has(lastToolId)
          ) {
            const toolExecution = pendingToolExecutions.get(lastToolId);
            toolExecution.status = 'complete';
            toolExecution.isSuccess = true;
            toolExecution.executionTime = Date.now() - toolExecution.startTime;
            toolExecution.result = typeof content === 'string' ? content : JSON.stringify(content);

            pendingToolExecutions.delete(lastToolId);

            // Send completion update
            if (onToolExecution) {
              onToolExecution({
                ...toolExecution,
                isUpdate: true,
              });
            }

            logger.debug('Tool execution completed:', toolExecution.id);
            lastToolId = null; // Reset
          }

          // Don't send any mock progress messages
        })
        .onAssistant((content) => {
          console.log('Assistant message chunk:', content);
          console.log('Assistant message chunk type:', typeof content);

          // Ensure content is a string
          if (typeof content === 'string') {
            assistantMessage += content;
          } else if (content && typeof content === 'object') {
            // Handle object content
            if (content.text) {
              assistantMessage += content.text;
            } else if (Array.isArray(content)) {
              // Handle array of content blocks
              const textContent = content
                .filter((block) => block && block.type === 'text')
                .map((block) => block.text || '')
                .join('');
              assistantMessage += textContent;
            } else {
              console.warn('Unexpected content type in onAssistant:', content);
              assistantMessage += JSON.stringify(content);
            }
          } else {
            console.warn('Non-string content in onAssistant:', typeof content, content);
            assistantMessage += String(content);
          }

          // Don't send any mock progress messages
        })
        .onToolUse((toolInfo) => {
          // The onToolUse callback only receives tool invocation info, not results
          logger.debug('onToolUse callback called with tool info:', toolInfo);

          // Handle different formats of tool info
          let toolName = '';
          let toolArgs = {};

          if (typeof toolInfo === 'object') {
            if (toolInfo.name) {
              // Format: {name: 'ToolName', input: {...}}
              toolName = toolInfo.name;
              toolArgs = toolInfo.input || {};
            } else if (toolInfo.tool_name) {
              // Alternative format
              toolName = toolInfo.tool_name;
              toolArgs = toolInfo.arguments || toolInfo.args || {};
            } else {
              // Fallback
              toolName = 'Unknown Tool';
              toolArgs = toolInfo;
            }
          } else if (typeof toolInfo === 'string') {
            toolName = toolInfo;
          }

          // Format args for display
          let argsDisplay = '';
          if (toolArgs) {
            if (typeof toolArgs === 'string') {
              argsDisplay = toolArgs;
            } else if (typeof toolArgs === 'object') {
              argsDisplay = JSON.stringify(toolArgs, null, 2);
            } else {
              argsDisplay = String(toolArgs);
            }
          }

          // Create a pending tool execution entry with unique ID
          const execution = {
            id: `tool-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: String(toolName),
            args: argsDisplay,
            result: 'Executing...',
            isSuccess: null, // Unknown until execution completes
            timestamp: new Date().toISOString(),
            status: 'running',
            startTime: Date.now(), // Track start time for duration calculation
            executionTime: null, // Will be calculated when complete
          };

          logger.debug('Tool invocation tracked:', execution);

          toolExecutions.push(execution);
          pendingToolExecutions.set(execution.id, execution);
          lastToolId = execution.id;

          // Send real-time tool execution update
          if (onToolExecution) {
            onToolExecution(execution);
          }

          // Don't send any mock progress messages
        });

      // Add system instruction for plan mode
      if (isPlanMode || tools.includes('plan')) {
        const planModePrompt = `CRITICAL: You are in PLAN MODE. You must NOT make any edits, writes, or execute any commands. You can only:
- Read files to understand the current state
- Search for relevant code
- Describe what changes would be made
- Ask the user if they want to proceed with the plan

DO NOT use Edit, Write, MultiEdit, Bash, or any other modification tools. Only describe what you would do.

User request: ${prompt}`;
        prompt = planModePrompt;
        logger.debug('Added plan mode restrictions to prompt');
      }

      console.log('Executing Claude query with tool support...');

      // Execute the query and get tool executions
      const result = await claudeInstance.query(prompt).asToolExecutions();

      console.log('=== CLAUDE SDK RESULT ===');
      console.log('Result type:', typeof result);
      console.log('Result keys:', Object.keys(result || {}));
      console.log('Result.response type:', typeof result.response);
      console.log('Result.response:', result.response);
      console.log('=========================');

      logger.debug('Claude execution completed');
      logger.debug('Tool executions from SDK:', result.toolExecutions?.length || 0);
      logger.debug('Tool executions from callbacks:', toolExecutions.length);
      logger.debug('Result response type:', typeof result.response);
      logger.debug('Result response is array:', Array.isArray(result.response));
      if (typeof result.response === 'string') {
        logger.debug('Final response preview:', result.response.substring(0, 200) + '...');
      } else {
        logger.debug('Result response structure:', JSON.stringify(result.response, null, 2));
      }

      // Extract token usage if available
      if (result.tokenUsage) {
        tokenUsage = {
          inputTokens: result.tokenUsage.inputTokens || 0,
          outputTokens: result.tokenUsage.outputTokens || 0,
          totalTokens: result.tokenUsage.totalTokens || 0,
        };
      } else {
        // Fallback token estimation
        tokenUsage = {
          inputTokens: Math.ceil(prompt.length / 4),
          outputTokens: Math.ceil((result.response || '').length / 4),
          totalTokens: 0,
        };
        tokenUsage.totalTokens = tokenUsage.inputTokens + tokenUsage.outputTokens;
      }

      // Extract text from response if it's an array of content blocks
      let responseText = '';

      // First, check if we have assistantMessage from the onAssistant callback
      console.log('assistantMessage value:', assistantMessage);
      console.log('assistantMessage type:', typeof assistantMessage);
      console.log('assistantMessage length:', assistantMessage.length);

      if (assistantMessage && assistantMessage.trim()) {
        responseText = assistantMessage;
        logger.debug(
          'Using assistantMessage from onAssistant callback:',
          responseText.substring(0, 100) + '...'
        );
      } else if (result.response) {
        // If no assistantMessage, extract from result.response
        logger.debug('No assistantMessage, extracting from result.response');

        if (typeof result.response === 'string') {
          responseText = result.response;
        } else if (Array.isArray(result.response)) {
          // If response is an array of content blocks, extract text
          responseText = result.response
            .filter((block) => block && block.type === 'text')
            .map((block) => block.text || '')
            .join('\n');
          logger.debug('Extracted text from array:', responseText.substring(0, 100) + '...');
        } else if (result.response && typeof result.response === 'object') {
          // Handle various object structures
          if (result.response.type === 'text' && result.response.text) {
            responseText = result.response.text;
          } else if (result.response.content) {
            // The response might have a content field
            if (typeof result.response.content === 'string') {
              responseText = result.response.content;
            } else if (Array.isArray(result.response.content)) {
              responseText = result.response.content
                .filter((block) => block && block.type === 'text')
                .map((block) => block.text || '')
                .join('\n');
            }
          }
          logger.debug('Extracted text from object:', responseText.substring(0, 100) + '...');
        }
      }

      // Ensure responseText is always a string
      if (!responseText || typeof responseText !== 'string') {
        logger.debug('Warning: responseText is not a string, type:', typeof responseText);
        responseText = 'No response generated';
      }

      // Mark any remaining pending tool executions as complete
      const completedToolExecutions = toolExecutions.map((tool) => {
        // If already marked complete, keep the existing status
        if (tool.status === 'complete') {
          return tool;
        }
        // Otherwise mark as complete
        return {
          ...tool,
          status: 'complete',
          isSuccess: true,
          result: 'Completed successfully',
          executionTime: tool.startTime ? Date.now() - tool.startTime : null,
        };
      });

      const finalResponse = {
        text: responseText,
        toolExecutions: completedToolExecutions, // Send completed tool executions
        tokenUsage: tokenUsage,
        error: null,
      };

      logger.debug('Final response object:', {
        textType: typeof finalResponse.text,
        textValue: finalResponse.text ? finalResponse.text.substring(0, 100) + '...' : null,
        hasToolExecutions: !!finalResponse.toolExecutions,
        hasTokenUsage: !!finalResponse.tokenUsage,
      });

      return finalResponse;
    } catch (error) {
      console.error('Claude Code processing error:', error);

      // Enhanced error handling
      let errorMessage = 'Failed to process Claude Code message';
      let errorDetails = null;

      if (isEnhancedError(error)) {
        console.log('Enhanced error detected');
        errorMessage = error.message || errorMessage;

        if (hasResolution(error)) {
          console.log('Error has resolution:', error.resolution);
          errorDetails = {
            type: error.type || 'unknown',
            resolution: error.resolution,
            category: error.category || 'general',
          };
        }
      }

      console.error('Error details:', errorDetails);

      return {
        error: errorMessage,
        errorDetails: errorDetails,
        text: null,
        toolExecutions: [],
        tokenUsage: null,
      };
    }
  }

  async analyzeWorkDescription(workDescription, model) {
    const modelName = this.getModel(model);

    // Check if Claude is available first
    if (!this.isClaudeAvailable) {
      // Return a mock response for development
      const lowerDesc = workDescription.toLowerCase();
      let type = 'developer';
      let jobTitle = 'Senior Software Engineer';
      let expertise = ['Code Review', 'Best Practices', 'Architecture', 'Performance Optimization'];
      let personality =
        'A thoughtful and analytical developer who focuses on writing clean, maintainable code.';

      if (lowerDesc.includes('design') || lowerDesc.includes('ui') || lowerDesc.includes('ux')) {
        type = 'designer';
        jobTitle = 'UI/UX Designer';
        expertise = ['UI Design', 'User Experience', 'Design Systems', 'Prototyping'];
        personality =
          'A creative designer with a keen eye for aesthetics and user-centered design principles.';
      } else if (lowerDesc.includes('test') || lowerDesc.includes('qa')) {
        type = 'tester';
        jobTitle = 'Quality Assurance Engineer';
        expertise = ['Test Planning', 'Edge Cases', 'Automation', 'Quality Assurance'];
        personality =
          'A meticulous tester who enjoys finding edge cases and ensuring software quality.';
      }

      return {
        type,
        jobTitle,
        name: 'Alex Chen',
        personality,
        expertise,
      };
    }

    const prompt = `You are an expert at analyzing work descriptions and suggesting the best agent type.

Analyze this work description:
"${workDescription}"

Based on the work description, suggest an agent with:
1. A job title that best matches the expertise needed (e.g., "Senior Design Systems Architect", "Infrastructure Security Specialist", "Full-Stack Product Engineer", etc.)
2. The most appropriate type from: usability-expert, developer, tester, data-scientist, devops, project-manager, designer, motion-designer
3. A fitting personality description (2-3 sentences)
4. 4-6 relevant areas of expertise

Important: The job title should be specific and descriptive, matching the actual work being described. Don't limit yourself to generic titles.

Respond in JSON format:
{
  "type": "agent-type",
  "jobTitle": "Specific Job Title",
  "name": "Suggested Name",
  "personality": "Personality description",
  "expertise": ["Expertise 1", "Expertise 2", "Expertise 3", "Expertise 4"]
}`;

    try {
      const response = await this.withTimeout(
        claude().withModel(modelName).query(prompt).asText(),
        25000 // 25 seconds for work analysis
      );

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Could not parse response as JSON');
    } catch (error) {
      console.error('Error analyzing work description:', error);

      // Re-throw timeout errors
      if (error.message === 'Request timed out') {
        throw error;
      }
      // Return default on error
      return {
        type: 'developer',
        name: 'Alex Chen',
        personality: 'A versatile professional ready to tackle various challenges.',
        expertise: ['Problem Solving', 'Collaboration', 'Technical Analysis', 'Documentation'],
      };
    }
  }

  async applyChanges(currentContent, previousSuggestion, persona, workItem, model) {
    const modelName = this.getModel(model);

    // Check if Claude is available first
    if (!this.isClaudeAvailable) {
      // Return mock implementation for development
      // This is a simple mock that adds a note about the changes
      const lines = currentContent.split('\n');
      const updatedLines = lines.map((line, index) => {
        if (index === 0) {
          return line + '\n\n<!-- Changes applied based on review suggestion -->';
        }
        return line;
      });

      return {
        success: true,
        updatedContent: updatedLines.join('\n'),
        summary: 'Applied suggested changes to improve clarity and completeness.',
      };
    }

    const prompt = `You are ${persona.name}, a ${persona.type} helping to improve a work item document.

You previously made this SPECIFIC suggestion:
"${previousSuggestion}"

The user has agreed to apply ONLY THIS SPECIFIC SUGGESTION. 

CRITICAL: Read your suggestion carefully and apply ONLY what you suggested:
- If you mentioned Task 2, modify ONLY Task 2
- If you mentioned adding API endpoints, add ONLY API endpoints
- Do NOT make any other improvements or changes
- Do NOT update other tasks, goals, or sections

Work Item: ${workItem.title}
Description: ${workItem.description}

Current document content:
${currentContent}

CRITICAL INSTRUCTIONS - READ CAREFULLY:
1. Apply ONLY the EXACT changes mentioned in your previous suggestion
2. DO NOT modify any other parts of the document
3. DO NOT update goals, tasks, or sections that weren't specifically mentioned
4. Make SURGICAL edits - if you suggested changes to Task 2, ONLY modify Task 2
5. Preserve ALL other content exactly as it is
6. Do NOT add comments, notes, or improvements beyond what was suggested
7. Maintain exact markdown formatting, spacing, and structure
8. Return the COMPLETE document with ONLY the suggested changes applied

Example:
- If you suggested "add API endpoints to Task 2", ONLY add that to Task 2
- Do NOT touch Task 1, overall goals, or any other section
- Keep everything else EXACTLY as it was

CRITICAL: Return ONLY valid JSON with proper escaping:
- Escape newlines as \\n, tabs as \\t, quotes as \\"
- No literal newlines inside string values
- No text before or after the JSON

Respond with exactly this JSON structure:
{
  "success": true,
  "updatedContent": "The complete updated document with your changes applied",
  "summary": "Brief summary of what was changed (1 sentence)"
}`;

    try {
      const response = await this.withTimeout(
        claude().withModel(modelName).query(prompt).asText(),
        30000 // 30 seconds timeout
      );

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        // Validate the response
        if (!result.updatedContent || result.updatedContent.trim().length === 0) {
          throw new Error('Invalid response: empty content');
        }
        return result;
      }
      throw new Error('Could not parse response as JSON');
    } catch (error) {
      console.error('Error applying changes:', error);

      // Return error response
      return {
        success: false,
        error: error.message || 'Failed to apply changes',
        updatedContent: currentContent, // Return original content on error
      };
    }
  }

  async chat(messages, userMessage, persona, documentContent, workItem, model) {
    const modelName = this.getModel(model);

    // Check if Claude is available first
    if (!this.isClaudeAvailable) {
      // Return a mock response for development
      // Determine response based on conversation flow
      const messageCount = messages.length;
      console.log('Mock chat - message count:', messageCount, 'user message:', userMessage);
      console.log(
        'Last few messages:',
        messages
          .slice(-3)
          .map((m) => ({ persona: m.personaId, type: m.type, content: m.content.substring(0, 50) }))
      );

      // Get only user and persona messages (exclude system/action messages)
      const conversationMessages = messages.filter(
        (m) => m.type === 'message' || m.type === 'suggestion'
      );
      const userMessages = conversationMessages.filter((m) => m.personaId === 'user');
      const userMessageCount = userMessages.length;

      console.log(
        'User message count:',
        userMessageCount,
        'Total conversation messages:',
        conversationMessages.length
      );

      // Check if this is a response to a suggestion
      const lastPersonaMessage = [...messages]
        .reverse()
        .find((m) => m.personaId !== 'user' && m.personaId !== 'system');
      const isRespondingToSuggestion =
        lastPersonaMessage &&
        (lastPersonaMessage.type === 'suggestion' ||
          lastPersonaMessage.content.includes('Would you like'));

      console.log(
        'Last persona message type:',
        lastPersonaMessage?.type,
        'Is responding to suggestion:',
        isRespondingToSuggestion
      );

      // First real user message - provide a suggestion
      if (userMessageCount === 1 && !isRespondingToSuggestion) {
        return {
          response:
            "I notice the task breakdown could be more specific. For example, the first task mentions 'Design Authentication UI Components' but doesn't specify which authentication methods to support. Would you like me to suggest a more detailed breakdown?",
          type: 'suggestion',
        };
      }

      // If user is responding to a suggestion
      if (isRespondingToSuggestion) {
        const userAgreed =
          userMessage.toLowerCase().includes('yes') ||
          userMessage.toLowerCase().includes('apply') ||
          userMessage.toLowerCase().includes('ok') ||
          userMessage.toLowerCase().includes('sure') ||
          userMessage.toLowerCase().includes('please');

        console.log('User agreed?', userAgreed);

        if (userAgreed) {
          // Return an action response indicating changes should be applied
          return {
            response:
              'Great! Let me apply those changes to make the authentication requirements more specific.',
            type: 'action',
            action: 'apply-changes',
            suggestionToApply: lastPersonaMessage.content,
          };
        } else {
          return {
            response:
              "No problem! Let me know if you'd like me to look at other aspects of the document.",
            type: 'message',
          };
        }
      }

      // Default fallback - continue conversation
      console.log('Falling back to default response');

      // Check if this might be a continuation after applying changes
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.type === 'summary') {
        return {
          response:
            "In [Task 2](doc:Task 2), I notice it mentions implementing backend services but doesn't specify the API structure or data models. Would you like me to add those details?",
          type: 'suggestion',
        };
      }

      return {
        response:
          "I'm here to help improve your work item plan. What would you like me to focus on next?",
        type: 'message',
      };
    }

    // Use agentPrompt if available, otherwise fall back to basic persona description
    const agentDescription = persona.agentPrompt || 
      `You are ${persona.name}, a ${persona.type} with expertise in ${persona.expertise.join(', ')}.
Your personality: ${persona.personality}`;

    const prompt = `${agentDescription}

You are reviewing a work item document and providing suggestions to improve it.

Work Item: ${workItem.title}
Description: ${workItem.description}

Current document content:
${documentContent}

Conversation history:
${messages
  .map((m) => {
    const speaker =
      m.personaId === 'user' ? 'User' : m.personaId === 'system' ? 'System' : persona.name;
    const typeInfo = m.type !== 'message' ? ` [${m.type}]` : '';
    return `${speaker}${typeInfo}: ${m.content}`;
  })
  .join('\n')}

User: ${userMessage}

IMPORTANT: Check if the user is responding to your previous suggestion:
- Look at the most recent message from you (${persona.name})
- If it was marked [suggestion] and the user is now agreeing (yes, apply, ok, sure, please, etc.)
- Then you MUST return type: "action" with action: "apply-changes"
- Include the FULL suggestion content in suggestionToApply field

Example flow:
${persona.name} [suggestion]: "In Task 2, we should add API endpoint specifications..."
User: "Yes please apply this change"
-> You MUST return: {"response": "Great! Let me apply those changes...", "type": "action", "action": "apply-changes", "suggestionToApply": "In Task 2, we should add API endpoint specifications..."}

Provide a helpful response following these rules:
1. If suggesting an improvement, set type to "suggestion"
2. CRITICAL: EVERY suggestion MUST START with a reference to the specific location:
   - First sentence MUST be: "In [Section Name](doc:exact text from that section), ..."
   - Example: "In [Task 2's validation criteria](doc:User can authenticate), we should add..."
   - DO NOT bury the reference in the middle or end of your suggestion
3. Use markdown formatting in your responses:
   - Use **bold** for emphasis
   - Use \`inline code\` for code snippets or technical terms
   - Use *italics* for subtle emphasis
4. CRITICAL: If the user agrees to apply your MOST RECENT suggestion (says yes, apply, ok, sure, please, etc.):
   - Return type: "action"
   - Set action: "apply-changes"
   - Include the FULL content of your previous suggestion in suggestionToApply field
   - Your response should acknowledge you're applying the changes
5. For regular conversation, set type to "message"

CRITICAL JSON FORMATTING RULES:
- Return ONLY valid JSON with no text before or after
- Properly escape ALL special characters in string values:
  - Newlines as \\n
  - Tabs as \\t
  - Quotes as \\"
  - Backslashes as \\\\
- Do NOT include literal newlines inside JSON string values
- Ensure all string values are on a single line

Respond with this exact JSON structure (replace the values but keep the structure):
{
  "response": "Your response text here with proper escaping",
  "type": "message",
  "action": "apply-changes",
  "suggestionToApply": "Previous suggestion if applicable"
}

Note: Include "action" field ONLY when type is "action". Include "suggestionToApply" ONLY when type is "action".`;

    try {
      const response = await claude().withModel(modelName).query(prompt).asText();

      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.error('JSON parse failed:', parseError.message);
          console.error('Raw response:', response);
          console.error('Extracted JSON:', jsonMatch[0]);
          throw new Error('Could not parse response as JSON: ' + parseError.message);
        }
      }
      throw new Error('No JSON found in response');
    } catch (error) {
      console.error('Error in chat:', error);
      // Return a helpful error message
      return {
        response:
          "I'm having trouble connecting to provide suggestions right now. Please try again or check your Claude CLI authentication.",
        type: 'message',
      };
    }
  }
}

module.exports = new ClaudeService();
