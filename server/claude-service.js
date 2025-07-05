const claude = require('@instantlyeasy/claude-code-sdk-ts').claude;
const { execSync } = require('child_process');

class ClaudeService {
  constructor() {
    this.isClaudeAvailable = this.checkClaudeAvailability();
    this.defaultTimeout = 30000; // 30 seconds
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

  async analyzeDocument(content, workItemTitle, workItemDescription, userName, personaName, personaGender, model = 'claude-3-5-sonnet-20241022') {
    // Check if Claude is available first
    if (!this.isClaudeAvailable) {
      // Return a mock response for development
      const isAuthRelated = workItemTitle.toLowerCase().includes('auth') || content.toLowerCase().includes('authentication');
      const topicKeyword = isAuthRelated ? 'authentication' : 'this topic';
      
      // Use the provided persona name or generate a default
      const name = personaName || 'Alex Chen';
      
      return {
        personaType: 'usability-expert',
        expertise: ['UI/UX Design', 'User Research', 'Accessibility', 'Design Systems'],
        personality: 'Thoughtful and detail-oriented, with a focus on user experience and design consistency',
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

This will help developers know exactly what to build. Would you like me to update this section?`
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
        claude()
          .withModel(model)
          .query(prompt)
          .asText(),
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
        issueCount: 3
      };
    }
  }

  async analyzeWorkDescription(workDescription, model = 'claude-3-5-sonnet-20241022') {
    // Check if Claude is available first
    if (!this.isClaudeAvailable) {
      // Return a mock response for development
      const lowerDesc = workDescription.toLowerCase();
      let type = 'developer';
      let jobTitle = 'Senior Software Engineer';
      let expertise = ['Code Review', 'Best Practices', 'Architecture', 'Performance Optimization'];
      let personality = 'A thoughtful and analytical developer who focuses on writing clean, maintainable code.';
      
      if (lowerDesc.includes('design') || lowerDesc.includes('ui') || lowerDesc.includes('ux')) {
        type = 'designer';
        jobTitle = 'UI/UX Designer';
        expertise = ['UI Design', 'User Experience', 'Design Systems', 'Prototyping'];
        personality = 'A creative designer with a keen eye for aesthetics and user-centered design principles.';
      } else if (lowerDesc.includes('test') || lowerDesc.includes('qa')) {
        type = 'tester';
        jobTitle = 'Quality Assurance Engineer';
        expertise = ['Test Planning', 'Edge Cases', 'Automation', 'Quality Assurance'];
        personality = 'A meticulous tester who enjoys finding edge cases and ensuring software quality.';
      }
      
      return {
        type,
        jobTitle,
        name: 'Alex Chen',
        personality,
        expertise
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
        claude()
          .withModel(model)
          .query(prompt)
          .asText(),
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
        expertise: ['Problem Solving', 'Collaboration', 'Technical Analysis', 'Documentation']
      };
    }
  }

  async applyChanges(currentContent, previousSuggestion, persona, workItem, model = 'claude-3-5-sonnet-20241022') {
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
        summary: 'Applied suggested changes to improve clarity and completeness.'
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
        claude()
          .withModel(model)
          .query(prompt)
          .asText(),
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
        updatedContent: currentContent // Return original content on error
      };
    }
  }

  async chat(messages, userMessage, persona, documentContent, workItem, model = 'claude-3-5-sonnet-20241022') {
    // Check if Claude is available first
    if (!this.isClaudeAvailable) {
      // Return a mock response for development
      // Determine response based on conversation flow
      const messageCount = messages.length;
      console.log('Mock chat - message count:', messageCount, 'user message:', userMessage);
      console.log('Last few messages:', messages.slice(-3).map(m => ({ persona: m.personaId, type: m.type, content: m.content.substring(0, 50) })));
      
      // Get only user and persona messages (exclude system/action messages)
      const conversationMessages = messages.filter(m => m.type === 'message' || m.type === 'suggestion');
      const userMessages = conversationMessages.filter(m => m.personaId === 'user');
      const userMessageCount = userMessages.length;
      
      console.log('User message count:', userMessageCount, 'Total conversation messages:', conversationMessages.length);
      
      // Check if this is a response to a suggestion
      const lastPersonaMessage = [...messages].reverse().find(m => m.personaId !== 'user' && m.personaId !== 'system');
      const isRespondingToSuggestion = lastPersonaMessage && (lastPersonaMessage.type === 'suggestion' || lastPersonaMessage.content.includes('Would you like'));
      
      console.log('Last persona message type:', lastPersonaMessage?.type, 'Is responding to suggestion:', isRespondingToSuggestion);
      
      // First real user message - provide a suggestion
      if (userMessageCount === 1 && !isRespondingToSuggestion) {
        return {
          response: "I notice the task breakdown could be more specific. For example, the first task mentions 'Design Authentication UI Components' but doesn't specify which authentication methods to support. Would you like me to suggest a more detailed breakdown?",
          type: 'suggestion'
        };
      }
      
      // If user is responding to a suggestion
      if (isRespondingToSuggestion) {
        const userAgreed = userMessage.toLowerCase().includes('yes') || 
                          userMessage.toLowerCase().includes('apply') || 
                          userMessage.toLowerCase().includes('ok') ||
                          userMessage.toLowerCase().includes('sure') ||
                          userMessage.toLowerCase().includes('please');
        
        console.log('User agreed?', userAgreed);
        
        if (userAgreed) {
          // Return an action response indicating changes should be applied
          return {
            response: "Great! Let me apply those changes to make the authentication requirements more specific.",
            type: 'action',
            action: 'apply-changes',
            suggestionToApply: lastPersonaMessage.content
          };
        } else {
          return {
            response: "No problem! Let me know if you'd like me to look at other aspects of the document.",
            type: 'message'
          };
        }
      }
      
      // Default fallback - continue conversation
      console.log('Falling back to default response');
      
      // Check if this might be a continuation after applying changes
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.type === 'summary') {
        return {
          response: "In [Task 2](doc:Task 2), I notice it mentions implementing backend services but doesn't specify the API structure or data models. Would you like me to add those details?",
          type: 'suggestion'
        };
      }
      
      return {
        response: "I'm here to help improve your work item plan. What would you like me to focus on next?",
        type: 'message'
      };
    }

    const prompt = `You are ${persona.name}, a ${persona.type} with expertise in ${persona.expertise.join(', ')}.
Your personality: ${persona.personality}

You are reviewing a work item document and providing suggestions to improve it.

Work Item: ${workItem.title}
Description: ${workItem.description}

Current document content:
${documentContent}

Conversation history:
${messages.map(m => {
  const speaker = m.personaId === 'user' ? 'User' : m.personaId === 'system' ? 'System' : persona.name;
  const typeInfo = m.type !== 'message' ? ` [${m.type}]` : '';
  return `${speaker}${typeInfo}: ${m.content}`;
}).join('\n')}

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
      const response = await claude()
        .withModel(model)
        .query(prompt)
        .asText();
      
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
        response: "I'm having trouble connecting to provide suggestions right now. Please try again or check your Claude CLI authentication.",
        type: 'message'
      };
    }
  }
}

module.exports = new ClaudeService();