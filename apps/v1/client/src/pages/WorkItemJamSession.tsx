import { useState, useEffect, useRef, Fragment, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContextV2';
import { Button } from '../components/ui/Button';
import { IconButton } from '../components/ui/IconButton';
import { LoadingSpinner, InlineLoadingSpinner } from '../components/ui/LoadingSpinner';
import { StockPhotoAvatar, getGenderFromSeed, getRandomName } from '../components/StockPhotoAvatar';
import { useAuth } from '../contexts/AuthContext';
import { AgentSelector } from '../components/AgentSelector';
import { DancingBubbles } from '../components/ui/DancingBubbles';
import { apiUrl } from '../config/api';
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  CreateLink,
  InsertThematicBreak,
  ListsToggle,
  BlockTypeSelect,
  Separator,
  type MDXEditorMethods,
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';
import '../styles/mdx-editor.css';
import type { Persona } from '../types';

interface ChatMessage {
  id: string;
  personaId: string;
  content: string;
  timestamp: Date;
  type: 'message' | 'suggestion' | 'system' | 'action' | 'summary';
  actionStatus?: 'pending' | 'complete';
  suggestedResponses?: string[];
}

export function WorkItemJamSession() {
  const { workItemId } = useParams<{ workItemId: string }>();
  const navigate = useNavigate();
  const {
    workItems,
    personas,
    jamSessions,
    createPersona,
    startJamSession,
    addJamMessage,
    updateJamSession,
  } = useApp();
  const { currentStyles, isDarkMode } = useTheme();
  const { activeAccount } = useAuth();
  const styles = currentStyles;

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [persona, setPersona] = useState<Persona | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showAgentSelector, setShowAgentSelector] = useState(true);
  const [showAgentSelectorOverlay, setShowAgentSelectorOverlay] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [markdownContent, setMarkdownContent] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isUpdatingEditor, setIsUpdatingEditor] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [editorKey, setEditorKey] = useState(0); // Key to force editor remount when needed
  const [chatStarted, setChatStarted] = useState(false);
  const [isLoadingAgent, setIsLoadingAgent] = useState(false);
  const [agentSuggestions, setAgentSuggestions] = useState<any[]>([]);
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState<string>('');
  const editorRef = useRef<MDXEditorMethods>(null);
  const suggestionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const workItem = workItems.find((w) => w.id === workItemId);
  console.log('WorkItemJamSession - workItemId:', workItemId);
  console.log('WorkItemJamSession - found workItem:', workItem);

  // Helper function to get a random loading message for an agent
  const getRandomAgentLoadingMessage = (agent: Persona): string => {
    // Use the agent's custom loading messages if available
    if (agent.loadingMessages && agent.loadingMessages.length > 0) {
      const randomIndex = Math.floor(Math.random() * agent.loadingMessages.length);
      return agent.loadingMessages[randomIndex];
    }

    // Fallback loading messages personalized with agent's first name
    const firstName = agent.name.split(' ')[0];
    const fallbackMessages = [
      `${firstName} is analyzing your document...`,
      `${firstName} is reviewing the content...`,
      `${firstName} is preparing suggestions...`,
      `${firstName} is getting ready to help...`,
      `${firstName} is checking requirements...`,
      `${firstName} is organizing thoughts...`,
      `${firstName} is loading best practices...`,
      `${firstName} is gathering insights...`,
      `${firstName} is preparing feedback...`,
      `${firstName} is reviewing patterns...`,
      `${firstName} is calibrating approach...`,
      `${firstName} is finalizing analysis...`,
    ];
    const randomIndex = Math.floor(Math.random() * fallbackMessages.length);
    return fallbackMessages[randomIndex];
  };

  // Rotate loading messages every 6 seconds
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (isLoadingAgent && persona) {
      // Set initial message
      setCurrentLoadingMessage(getRandomAgentLoadingMessage(persona));

      // Rotate message every 6 seconds
      intervalId = setInterval(() => {
        setCurrentLoadingMessage(getRandomAgentLoadingMessage(persona));
      }, 6000);
    } else if (isAnalyzing) {
      // For auto-create flow, also rotate the messages
      const loadingMessages = [
        'Finding the perfect reviewer for your work item',
        'Searching for an expert to review your document',
        'Matching your work with the ideal specialist',
        'Assembling the right agent for your needs',
        'Preparing a specialized reviewer for your project',
        'Looking for the best agent to assist you',
        'Identifying the perfect expert for this task',
        'Customizing an agent for your specific requirements',
        'Analyzing your requirements for the best match',
        'Selecting optimal expertise for your needs',
        'Configuring the ideal reviewer profile',
        'Tailoring agent capabilities to your project',
        'Optimizing reviewer selection for your work',
        'Preparing personalized agent recommendations',
        'Finalizing the perfect agent match',
      ];

      // Set initial message
      const initialMessage = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
      setCurrentLoadingMessage(initialMessage);

      // Rotate message every 6 seconds
      intervalId = setInterval(() => {
        const newMessage = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
        setCurrentLoadingMessage(newMessage);
      }, 6000);
    } else {
      // Clear the message when not loading
      setCurrentLoadingMessage('');
    }

    // Cleanup interval on unmount or when loading state changes
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isLoadingAgent, isAnalyzing, persona]);

  // Get suggested responses based on message type
  const getSuggestedResponses = (type: string): string[] => {
    switch (type) {
      case 'suggestion':
        return [
          'Make these changes',
          'Let me think about it',
          'Can you explain more?',
          'What are the alternatives?',
        ];
      case 'summary':
        return [
          'Great! What else can we improve?',
          'Can you review the next task?',
          "Let's focus on a different area",
          'That looks good, thanks!',
        ];
      case 'message':
      default:
        return [
          'Tell me more',
          'What do you suggest?',
          'Can you provide an example?',
          "Let's move on to something else",
        ];
    }
  };

  // Monitor editedContent changes and save draft
  useEffect(() => {
    console.log(
      'editedContent changed, new length:',
      editedContent.length,
      'first 100 chars:',
      editedContent.substring(0, 100)
    );

    // Save draft content to jam session
    if (sessionId && editedContent !== markdownContent) {
      const debounceTimer = setTimeout(() => {
        updateJamSession(sessionId, { draftContent: editedContent });
      }, 1000); // Debounce for 1 second

      return () => clearTimeout(debounceTimer);
    }
  }, [editedContent, sessionId, markdownContent, updateJamSession]);

  // State for bottom padding
  const [bottomPadding, setBottomPadding] = useState(0);
  
  // Calculate padding and scroll to last user message
  const scrollLastUserMessageToTop = useCallback(() => {
    console.log('[SCROLL] scrollLastUserMessageToTop called, messages:', messages.length);
    if (!chatContainerRef.current || messages.length === 0) {
      console.log('[SCROLL] Early return - no container or messages');
      return;
    }
    
    // Find the last user message
    let lastUserMessageIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].personaId === 'user') {
        lastUserMessageIndex = i;
        break;
      }
    }
    
    console.log('[SCROLL] Last user message index:', lastUserMessageIndex);
    if (lastUserMessageIndex < 0) return;
    
    // Wait for DOM to update
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!chatContainerRef.current) {
          console.log('[SCROLL] Container lost after RAF');
          return;
        }
        
        const container = chatContainerRef.current;
        const messageElements = container.querySelectorAll('[data-message-id]');
        console.log('[SCROLL] Found message elements:', messageElements.length);
        const userMessageElement = messageElements[lastUserMessageIndex] as HTMLElement;
        
        if (!userMessageElement) {
          console.log('[SCROLL] User message element not found at index:', lastUserMessageIndex);
          return;
        }
        
        // Get measurements
        const containerHeight = container.clientHeight;
        const messageHeight = userMessageElement.offsetHeight;
        const messageTop = userMessageElement.offsetTop;
        
        console.log('[SCROLL] Measurements:', {
          containerHeight,
          messageHeight,
          messageTop
        });
        
        // Calculate padding needed: container height - message height - 8px padding
        const paddingNeeded = Math.max(0, containerHeight - messageHeight - 8);
        console.log('[SCROLL] Setting bottom padding to:', paddingNeeded);
        setBottomPadding(paddingNeeded);
        
        // Scroll to position message 8px from top
        // Need another frame for padding to apply
        requestAnimationFrame(() => {
          const scrollTarget = messageTop - 8;
          console.log('[SCROLL] Scrolling to:', scrollTarget);
          container.scrollTo({
            top: scrollTarget,
            behavior: 'smooth'
          });
        });
      });
    });
  }, [messages]);
  
  // On initial load, position last user message
  useEffect(() => {
    scrollLastUserMessageToTop();
  }, []); // Run once on mount
  
  // When messages change, check if latest is from user
  useEffect(() => {
    console.log('[SCROLL] Messages changed, count:', messages.length);
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      console.log('[SCROLL] Latest message persona:', latestMessage.personaId);
      if (latestMessage.personaId === 'user') {
        console.log('[SCROLL] Latest is user message, triggering scroll');
        scrollLastUserMessageToTop();
      } else {
        console.log('[SCROLL] Latest is not user message, no scroll');
      }
    }
  }, [messages, scrollLastUserMessageToTop]);

  // Manage suggestion button visibility
  useEffect(() => {
    // Clear any existing timer
    if (suggestionTimerRef.current) {
      clearTimeout(suggestionTimerRef.current);
    }

    // Reset selected suggestion when messages change
    setSelectedSuggestion(null);

    // Hide suggestions when typing or when there are no messages
    if (isTyping || messages.length === 0) {
      setShowSuggestions(false);
      return;
    }

    // Check if the last message is from a persona (not user or system)
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.personaId !== 'user' && lastMessage.personaId !== 'system') {
      // Wait 500ms before showing suggestions
      suggestionTimerRef.current = setTimeout(() => {
        setShowSuggestions(true);
      }, 500);
    } else {
      setShowSuggestions(false);
    }

    // Cleanup
    return () => {
      if (suggestionTimerRef.current) {
        clearTimeout(suggestionTimerRef.current);
      }
    };
  }, [messages, isTyping]);

  // Reset initialization when work item changes
  useEffect(() => {
    setHasInitialized(false);
  }, [workItemId]);

  // Load markdown content
  useEffect(() => {
    const loadMarkdown = async () => {
      console.log('WorkItem:', workItem);
      console.log('WorkItem markdownPath:', workItem?.markdownPath);

      if (!workItem) {
        console.log('No work item found');
        return;
      }

      if (workItem.markdownPath) {
        try {
          console.log('Loading markdown from:', workItem.markdownPath);
          const response = await fetch(apiUrl('/api/workspace/read-file'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filePath: workItem.markdownPath }),
          });

          if (response.ok) {
            const data = await response.json();
            console.log('Markdown content loaded, length:', data.content.length);

            // Remove only the metadata section if it exists, keeping tasks that may come after
            let content = data.content;
            const metadataIndex = content.lastIndexOf('\n## Metadata\n');
            if (metadataIndex !== -1) {
              // Find the next section after metadata (starts with ## )
              const afterMetadata = content.substring(metadataIndex + '\n## Metadata\n'.length);
              const nextSectionMatch = afterMetadata.match(/\n## /);

              if (nextSectionMatch) {
                // There's another section after metadata, remove only the metadata content
                const metadataEndIndex = metadataIndex + '\n## Metadata\n'.length + nextSectionMatch.index;
                content = content.substring(0, metadataIndex) + content.substring(metadataEndIndex);
              } else {
                // No section after metadata, remove everything from metadata onwards
                content = content.substring(0, metadataIndex);
              }
            }

            setMarkdownContent(content);
            setEditedContent(content);
          } else {
            const errorText = await response.text();
            console.error('Failed to load markdown:', response.status, errorText);
          }
        } catch (error) {
          console.error('Error loading markdown:', error);
        }
      } else {
        console.log('No markdownPath on work item, constructing from metadata');
        // If no markdownPath, generate content from work item metadata
        let generatedContent = '';

        // Use generalMarkdown if available, otherwise create a basic header
        if (workItem?.metadata?.generalMarkdown) {
          generatedContent = workItem.metadata.generalMarkdown;
        } else {
          generatedContent = `# ${workItem.title}

## Description
${workItem.description || 'No description provided.'}`;
        }

        // Add tasks section if tasks exist
        if (workItem?.metadata?.tasks && workItem.metadata.tasks.length > 0) {
          // Add a tasks header if not already in generalMarkdown
          if (!generatedContent.includes('## Tasks')) {
            generatedContent += '\n\n## Tasks';
          }

          // For each task, use the taskMarkdownContents if available, otherwise generate from task data
          workItem.metadata.tasks.forEach((task: any, index: number) => {
            const taskId = task.id;

            // Check if we have stored markdown content for this task
            if (workItem.metadata?.taskMarkdownContents?.[taskId]) {
              // Use the full markdown content for this task
              generatedContent += '\n\n' + workItem.metadata.taskMarkdownContents[taskId];
            } else {
              // Fallback to generating from task data
              generatedContent += `

### Task ${task.taskNumber || index + 1}: ${task.title}
**Description:** ${task.description}

**Goals:**
${task.goals?.map((g: string) => `- ${g}`).join('\n') || '- No goals defined'}

**Work Description:**
${task.workDescription || 'No work description'}

**Validation Criteria:**
${task.validationCriteria?.map((c: string) => `- ${c}`).join('\n') || '- No criteria defined'}`;
            }
          });
        }

        console.log('Generated content length:', generatedContent.length);
        setMarkdownContent(generatedContent);
        setEditedContent(generatedContent);
      }
    };

    loadMarkdown();
  }, [workItem]);

  // Check if persona already exists for this work item
  useEffect(() => {
    if (workItem && markdownContent && !hasInitialized) {
      setHasInitialized(true);

      console.log(
        'Checking for existing session - workItem:',
        workItem.id,
        'jamSessionIds:',
        workItem.jamSessionIds
      );
      console.log(
        'Available jamSessions:',
        jamSessions.map((s) => ({ id: s.id, workItemId: s.workItemId }))
      );

      // Look for existing jam session
      const existingSessionId = workItem.jamSessionIds[0]; // Get first session if exists

      if (existingSessionId) {
        console.log('Found existing session ID:', existingSessionId);
        const session = jamSessions.find((s) => s.id === existingSessionId);
        if (session) {
          console.log('Found session:', session);
          setSessionId(existingSessionId);

          // Get the persona from the session
          const personaId = session.participantIds.find((id) => id !== 'user');
          console.log(
            'Looking for persona ID:',
            personaId,
            'in personas:',
            personas.map((p) => ({ id: p.id, name: p.name }))
          );
          const existingPersona = personas.find((p) => p.id === personaId);

          if (existingPersona) {
            console.log('Found existing persona:', existingPersona);
            setPersona(existingPersona);
            setSelectedAgentId(existingPersona.id);
            setChatStarted(true);
            setShowAgentSelector(false);

            // Load existing messages
            const sessionMessages: ChatMessage[] = session.messages.map((msg) => ({
              id: msg.id,
              personaId: msg.personaId,
              content: msg.content,
              timestamp: new Date(msg.timestamp),
              type:
                msg.type === 'challenge' || msg.type === 'decision'
                  ? 'message'
                  : (msg.type as ChatMessage['type']),
              suggestedResponses:
                msg.personaId !== 'user' ? getSuggestedResponses('message') : undefined,
            }));

            setMessages(sessionMessages);

            // Restore draft content if available
            if (session.draftContent) {
              setEditedContent(session.draftContent);
            }
          }
        }
      }
      // Don't auto-create agent anymore - let user choose
    }
  }, [
    workItem,
    markdownContent,
    hasInitialized,
    jamSessions,
    personas,
  ]);

  const analyzeDocument = async () => {
    if (!workItem || isAnalyzing) return; // Prevent multiple concurrent calls

    console.log('analyzeDocument called for workItem:', workItem.id);

    setIsAnalyzing(true);
    setSetupError(null);
    setChatStarted(true);

    try {
      // Generate persona details ahead of time for consistency
      const personaId = Date.now().toString();
      const avatarSeed = `${personaId}-${workItem.id}`;
      const avatarGender = getGenderFromSeed(avatarSeed);
      const personaName = getRandomName(avatarSeed, avatarGender);

      // Call Claude to analyze the document and suggest a persona
      const userName = activeAccount?.username || 'there';

      // Create an AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        const response = await fetch(apiUrl('/api/claude/analyze-document'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: markdownContent,
            workItemTitle: workItem.title,
            workItemDescription: workItem.description,
            userName: userName,
            personaName: personaName,
            personaGender: avatarGender,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Analyze document failed:', response.status, errorText);
          throw new Error(`Failed to analyze document: ${response.status} ${errorText}`);
        }

        const data = await response.json();

        // Use the pre-generated persona details for consistency
        const newPersona: Omit<Persona, 'id'> = {
          name: personaName, // Use the pre-generated name
          type: data.personaType || 'usability-expert',
          jobTitle: data.jobTitle || 'UX Specialist',
          expertise: data.expertise || ['UI/UX Design', 'User Research', 'Accessibility'],
          personality:
            data.personality || 'Thoughtful and detail-oriented, with a focus on user experience',
          status: 'available',
          avatarSeed: avatarSeed,
          avatarGender: avatarGender,
        };

        createPersona(newPersona);
        // Note: createPersona is synchronous but state update might not be immediate
        // For now, use the data we just created
        const createdPersona = { ...newPersona, id: personaId };
        setPersona(createdPersona as Persona);

        // Start a jam session
        const newSessionId = startJamSession(
          workItem.id,
          [createdPersona.id],
          `Review session for ${workItem.title}`
        );
        setSessionId(newSessionId);

        // Combine greeting and analysis into one message
        // Claude should already be using the correct name we provided
        const greetingText = data.greetingMessage || `Hey ${userName}! I'm ${personaName}.`;

        const combinedGreeting = `${greetingText} ${data.personalizedGreeting || "I'm excited to review this work item with you."}

${data.analysisMessage || `I've found ${data.issueCount || 'several'} areas we can improve. Let's go through them one by one.`}`;

        const greetingMessage: ChatMessage = {
          id: Date.now().toString(),
          personaId: createdPersona.id,
          content: combinedGreeting,
          timestamp: new Date(),
          type: 'message',
          // No suggestedResponses - the actual suggestion is coming next
        };

        setMessages([greetingMessage]);
        setShowSuggestions(false); // Don't show suggestions for this combined message

        // Add the first suggestion after a delay
        if (data.firstSuggestionDetails || data.firstSuggestion) {
          setTimeout(() => {
            setIsTyping(true);

            setTimeout(() => {
              const suggestionContent =
                data.firstSuggestionDetails ||
                data.firstSuggestion ||
                'I have a suggestion for improving your work item.';

              const suggestionMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                personaId: createdPersona.id,
                content: suggestionContent,
                timestamp: new Date(),
                type: 'suggestion',
                suggestedResponses: getSuggestedResponses('suggestion'),
              };
              setMessages((prev) => [...prev, suggestionMessage]);
              setIsTyping(false);
            }, 1500);
          }, 1000);
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error: any) {
      console.error('Error analyzing document:', error);

      // Set appropriate error message
      let errorMessage = 'Failed to set up review session.';
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out. The AI service is taking too long to respond.';
      } else if (error.message?.includes('Failed to fetch')) {
        errorMessage = 'Unable to connect to the AI service. Please check your connection.';
      } else if (error.message?.includes('500')) {
        errorMessage = 'The AI service encountered an error. Please try again.';
      }

      setSetupError(errorMessage);
      setRetryCount((prev) => prev + 1);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRetry = () => {
    setSetupError(null);
    analyzeDocument();
  };

  const restartChatWithCurrentAgent = async () => {
    if (!persona || !workItem) return;

    // Clear messages and suggestions
    setMessages([]);
    setAgentSuggestions([]);
    setCurrentSuggestionIndex(0);
    setIsTyping(false);

    // Start fresh with current agent
    await initializeAgentChat(persona);
  };

  const initializeAgentChat = async (selectedPersona: Persona) => {
    if (!workItem) return;

    setIsLoadingAgent(true);
    setShowAgentSelector(false);
    setShowAgentSelectorOverlay(false);
    setChatStarted(true);

    // Start a jam session if not exists
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      currentSessionId = startJamSession(
        workItem.id,
        [selectedPersona.id],
        `Review session for ${workItem.title}`
      );
      setSessionId(currentSessionId);
    }

    // Don't show a loading message in the chat - the UI loading state handles it

    // Call API to analyze document and get all suggestions
    try {
      const response = await fetch(apiUrl('/api/claude/agent-analyze'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentContent: editedContent,
          workItem: {
            title: workItem.title,
            description: workItem.description,
          },
          persona: {
            name: selectedPersona.name,
            jobTitle: selectedPersona.jobTitle,
            expertise: selectedPersona.expertise,
            agentPrompt: selectedPersona.agentPrompt,
            roleSummary: selectedPersona.roleSummary,
          },
        }),
      });

      setIsLoadingAgent(false);

      if (response.ok) {
        const data = await response.json();

        // Store all suggestions
        setAgentSuggestions(data.suggestions || []);
        setCurrentSuggestionIndex(0);

        // Clear loading and show introduction
        setMessages([]);

        // Build suggested responses for the introduction (which now includes the first suggestion)
        const responses: string[] = [];
        if (data.suggestions && data.suggestions.length > 0) {
          const firstSuggestion = data.suggestions[0];

          // If it's a change suggestion, add "Make these changes"
          if (firstSuggestion.type === 'change' || firstSuggestion.suggestedChange) {
            responses.push('Make these changes');
          }

          // Add contextual responses
          responses.push('Tell me more');
          responses.push('Why is this important?');

          // Add "Next suggestion" if there are more
          if (data.suggestions.length > 1) {
            responses.push('Next suggestion');
          }
        }

        const introMessage: ChatMessage = {
          id: Date.now().toString(),
          personaId: selectedPersona.id,
          content: data.introduction || `Hi! I'm ${selectedPersona.name}, your ${selectedPersona.jobTitle}. I've analyzed your document and found ${data.suggestions?.length || 0} areas for improvement.`,
          timestamp: new Date(),
          type: 'message',
          suggestedResponses: responses.length > 0 ? responses : undefined,
        };

        setMessages([introMessage]);

        // Set the current suggestion index to 0 since first suggestion is in the intro
        if (data.suggestions && data.suggestions.length > 0) {
          setCurrentSuggestionIndex(0);
        }

        // Save to jam session
        if (currentSessionId) {
          addJamMessage(currentSessionId, selectedPersona.id, introMessage.content, 'message');
        }
      } else {
        throw new Error('Failed to get analysis');
      }
    } catch (error) {
      console.error('Error analyzing document:', error);
      setIsLoadingAgent(false);

      // Show error message but offer to retry
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        personaId: 'system',
        content: `Failed to analyze the document. This might be due to a connection issue or the AI service being temporarily unavailable.`,
        timestamp: new Date(),
        type: 'system',
      };

      const retryMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        personaId: selectedPersona.id,
        content: `I apologize for the technical issue. Would you like me to try analyzing your document again?`,
        timestamp: new Date(),
        type: 'message',
        suggestedResponses: ['Try again', 'Continue without analysis'],
      };

      setMessages([errorMessage, retryMessage]);
    }
  };

  const startChatWithAgent = async () => {
    if (!selectedAgentId || !workItem) return;

    // Handle auto-create agent
    if (selectedAgentId === 'auto-create') {
      setShowAgentSelector(false);
      await analyzeDocument();
      return;
    }

    // Use existing agent
    const selectedPersona = personas.find((p) => p.id === selectedAgentId);
    if (!selectedPersona) return;

    setPersona(selectedPersona);
    await initializeAgentChat(selectedPersona);
  };

  const presentSuggestion = (index: number, suggestion: any, totalSuggestions: number) => {
    const hasMore = index < totalSuggestions - 1;

    // Build suggested responses based on suggestion type
    const responses: string[] = [];

    // If it's a change suggestion, add "Make these changes"
    if (suggestion.type === 'change' || suggestion.suggestedChange) {
      responses.push('Make these changes');
    }

    // Add contextual responses
    responses.push('Tell me more');
    responses.push('Why is this important?');

    // Add "Next suggestion" if there are more
    if (hasMore) {
      responses.push('Next suggestion');
    } else {
      responses.push('Review again');
    }

    const suggestionMessage: ChatMessage = {
      id: (Date.now() + index).toString(),
      personaId: persona!.id,
      content: suggestion.content || suggestion.text,
      timestamp: new Date(),
      type: 'suggestion',
      suggestedResponses: responses,
    };

    setMessages((prev) => [...prev, suggestionMessage]);
    setCurrentSuggestionIndex(index);
  };

  const handleDocumentLink = (searchText: string) => {
    if (!editorRef.current) return;

    console.log('Searching for text:', searchText);

    // Focus the editor first
    editorRef.current.focus();

    // We need to access the underlying Lexical editor
    // MDXEditor doesn't directly expose the Lexical editor instance for updates,
    // so we'll use a workaround by simulating selection through DOM
    setTimeout(() => {
      const editorElement = document.querySelector('.mdxeditor [contenteditable="true"]') as HTMLElement;
      if (!editorElement) {
        console.log('Editor element not found');
        return;
      }

      // Create a text search walker
      const walker = document.createTreeWalker(
        editorElement,
        NodeFilter.SHOW_TEXT,
        null
      );

      let node: Node | null;
      let found = false;
      const searchLower = searchText.toLowerCase();

      // Walk through all text nodes to find the search text
      while ((node = walker.nextNode())) {
        const textContent = node.textContent || '';
        const lowerContent = textContent.toLowerCase();
        const index = lowerContent.indexOf(searchLower);

        if (index !== -1) {
          // Found the text, create a selection
          const range = document.createRange();
          const selection = window.getSelection();

          if (selection) {
            // Clear any existing selection
            selection.removeAllRanges();

            // Set the range to select the found text
            range.setStart(node, index);
            range.setEnd(node, index + searchText.length);

            // Apply the selection
            selection.addRange(range);

            // Scroll the selection into view
            const selectedElement = selection.anchorNode?.parentElement;
            if (selectedElement) {
              selectedElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
              });
            }

            console.log('Text found and selected:', searchText);
            found = true;
            break;
          }
        }
      }

      if (!found) {
        console.log('Text not found:', searchText);

        // Try searching for partial matches or section headers
        // Reset walker
        const walker2 = document.createTreeWalker(
          editorElement,
          NodeFilter.SHOW_TEXT,
          null
        );

        // Look for partial matches (e.g., "Task 3" might be part of "Task 3: Some Title")
        while ((node = walker2.nextNode())) {
          const textContent = node.textContent || '';
          const lowerContent = textContent.toLowerCase();

          // Check if this looks like a task reference
          if (searchLower.startsWith('task ') && lowerContent.includes(searchLower)) {
            const index = lowerContent.indexOf(searchLower);
            const range = document.createRange();
            const selection = window.getSelection();

            if (selection) {
              selection.removeAllRanges();

              // Select from the match to the end of the line or node
              range.setStart(node, index);

              // Find the end of the line or paragraph
              let endOffset = textContent.length;
              const newlineIndex = textContent.indexOf('\n', index);
              if (newlineIndex !== -1) {
                endOffset = newlineIndex;
              }

              range.setEnd(node, Math.min(endOffset, textContent.length));
              selection.addRange(range);

              // Scroll into view
              const selectedElement = selection.anchorNode?.parentElement;
              if (selectedElement) {
                selectedElement.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center'
                });
              }

              console.log('Partial match found and selected:', searchText);
              found = true;
              break;
            }
          }
        }
      }
    }, 100); // Small delay to ensure editor is ready
  };

  const sendMessage = async (messageText?: string) => {
    const message = messageText || inputMessage;
    if (!message.trim() || !persona || !sessionId) return;

    // Handle /clear command
    if (message.trim().toLowerCase() === '/clear') {
      setInputMessage('');
      await restartChatWithCurrentAgent();
      return;
    }

    // Handle "Try again" response
    if (message === 'Try again' && persona) {
      setInputMessage('');
      await initializeAgentChat(persona);
      return;
    }

    // Handle "Next suggestion" response
    if (message === 'Next suggestion' && agentSuggestions.length > 0) {
      // Since first suggestion is in intro, we need to show the second one (index 1) first time
      const nextIndex = currentSuggestionIndex === 0 ? 1 : currentSuggestionIndex + 1;
      if (nextIndex < agentSuggestions.length) {
        // Add user message
        const userMessage: ChatMessage = {
          id: Date.now().toString(),
          personaId: 'user',
          content: message,
          timestamp: new Date(),
          type: 'message',
        };
        setMessages((prev) => [...prev, userMessage]);
        setInputMessage('');

        // Present next suggestion
        setTimeout(() => {
          presentSuggestion(nextIndex, agentSuggestions[nextIndex], agentSuggestions.length);
        }, 500);
        return;
      }
    }

    // Handle "Make these changes" response
    if ((message === 'Make these changes' || message === 'Apply change') && currentSuggestionIndex < agentSuggestions.length) {
      const currentSuggestion = agentSuggestions[currentSuggestionIndex];
      console.log('[APPLY CHANGE] Current suggestion:', currentSuggestion);
      console.log('[APPLY CHANGE] Has suggestedChange:', !!currentSuggestion.suggestedChange);

      if (currentSuggestion.suggestedChange) {
        // Add user message
        const userMessage: ChatMessage = {
          id: Date.now().toString(),
          personaId: 'user',
          content: message,
          timestamp: new Date(),
          type: 'message',
        };
        setMessages((prev) => [...prev, userMessage]);
        setInputMessage('');

        // Apply the change
        setIsTyping(true);

        // Apply the suggested change to the markdown content
        let updatedContent = editedContent;
        console.log('[APPLY CHANGE] Current content length:', editedContent.length);
        console.log('[APPLY CHANGE] Suggested change:', currentSuggestion.suggestedChange);

        // If the suggestion includes a section, try to replace that specific section
        if (currentSuggestion.section && currentSuggestion.section !== 'General') {
          console.log('[APPLY CHANGE] Targeting section:', currentSuggestion.section);
          // Try to find and replace the specific section
          const sectionPattern = new RegExp(`(^|\\n)(#{1,6}\\s*${currentSuggestion.section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})([^#]*)`, 'im');
          const match = updatedContent.match(sectionPattern);

          if (match) {
            console.log('[APPLY CHANGE] Found section match');
            // Replace the content of this section with the suggested change
            const sectionHeader = match[2];
            const newSectionContent = `${sectionHeader}\n${currentSuggestion.suggestedChange}`;
            updatedContent = updatedContent.replace(match[0], match[1] + newSectionContent);
          } else {
            console.log('[APPLY CHANGE] Section not found, replacing entire content');
            // If we can't find the section, treat it as a full document replacement
            updatedContent = currentSuggestion.suggestedChange;
          }
        } else {
          console.log('[APPLY CHANGE] No specific section, replacing entire content');
          // For general suggestions or if no section is specified, replace the entire content
          updatedContent = currentSuggestion.suggestedChange;
        }

        console.log('[APPLY CHANGE] Updated content length:', updatedContent.length);

        // Update both the edited content and the markdown content
        setEditedContent(updatedContent);
        setMarkdownContent(updatedContent);

        // Force the editor to update with the new content
        if (editorRef.current) {
          console.log('[APPLY CHANGE] Updating editor with new content');
          editorRef.current.setMarkdown(updatedContent);
        } else {
          console.log('[APPLY CHANGE] Editor ref not available');
        }

        setTimeout(() => {
          const confirmMessage: ChatMessage = {
            id: Date.now().toString(),
            personaId: persona.id,
            content: `Change applied successfully! I've updated the ${currentSuggestion.section || 'document'} with the suggested changes. Would you like to see the next suggestion?`,
            timestamp: new Date(),
            type: 'message',
            suggestedResponses: currentSuggestionIndex < agentSuggestions.length - 1
              ? ['Next suggestion', 'Review changes', 'Continue editing']
              : ['Review changes', 'Continue editing', 'Start over'],
          };
          setMessages((prev) => [...prev, confirmMessage]);
          setIsTyping(false);
        }, 500);
        return;
      }
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      personaId: 'user',
      content: message,
      timestamp: new Date(),
      type: 'message',
    };
    setMessages((prev) => [...prev, userMessage]);
    if (!messageText) {
      setInputMessage('');
    }
    setIsTyping(true);
    setShowSuggestions(false); // Hide suggestions when sending

    try {
      // Send to Claude for response
      const response = await fetch(apiUrl('/api/claude/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages,
          userMessage: message,
          persona: {
            ...persona,
            // Ensure agentPrompt is included for context
            agentPrompt: persona.agentPrompt,
            roleSummary: persona.roleSummary,
          },
          documentContent: editedContent,
          workItem: {
            title: workItem?.title,
            description: workItem?.description,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      console.log('Chat response:', data);

      // Check if this is a confirmation to apply changes
      const isApplyConfirmation = data.type === 'action' && data.action === 'apply-changes';

      if (isApplyConfirmation) {
        console.log('User confirmed to apply changes');

        // Add Claude's acknowledgment message first
        const ackMessage: ChatMessage = {
          id: Date.now().toString(),
          personaId: persona.id,
          content: data.response,
          timestamp: new Date(),
          type: 'message',
        };
        setMessages((prev) => [...prev, ackMessage]);

        // Add action message
        const actionMessageId = (Date.now() + 1).toString();
        const actionMessage: ChatMessage = {
          id: actionMessageId,
          personaId: 'system',
          content: 'Applying suggested changes to the document...',
          timestamp: new Date(),
          type: 'action',
          actionStatus: 'pending',
        };
        setMessages((prev) => [...prev, actionMessage]);

        // Lock the editor
        setIsUpdatingEditor(true);

        // Make a separate API call to apply the changes with current content
        try {
          const applyResponse = await fetch(apiUrl('/api/claude/apply-changes'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              currentContent: editedContent, // Current state of the document
              previousSuggestion: data.suggestionToApply || messages[messages.length - 2]?.content,
              persona: persona,
              workItem: {
                title: workItem?.title,
                description: workItem?.description,
              },
            }),
          });

          if (!applyResponse.ok) {
            throw new Error('Failed to apply changes');
          }

          const applyData = await applyResponse.json();

          if (applyData.success && applyData.updatedContent) {
            // Save current scroll position
            const editorContainer =
              document.querySelector('.mdxeditor [contenteditable]') ||
              document.querySelector('.mdxeditor');
            const savedScrollTop = editorContainer?.scrollTop || 0;

            console.log('Saving scroll position:', savedScrollTop);

            // Update content and force editor remount
            setEditedContent(applyData.updatedContent);
            setEditorKey((prev) => prev + 1); // Force remount to ensure content updates

            // Restore scroll position after remount
            setTimeout(() => {
              const newEditorContainer =
                document.querySelector('.mdxeditor [contenteditable]') ||
                document.querySelector('.mdxeditor');
              if (newEditorContainer && savedScrollTop > 0) {
                newEditorContainer.scrollTop = savedScrollTop;
                console.log('Restored scroll position to:', savedScrollTop);
              }
            }, 100); // Wait for editor to remount

            // Mark action as complete
            setTimeout(() => {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === actionMessageId ? { ...msg, actionStatus: 'complete' } : msg
                )
              );

              // Add completion message
              const completeMessage: ChatMessage = {
                id: (Date.now() + 2).toString(),
                personaId: persona.id,
                content:
                  applyData.summary || "I've updated the document with the suggested changes.",
                timestamp: new Date(),
                type: 'summary',
                suggestedResponses: getSuggestedResponses('summary'),
              };
              setMessages((prev) => [...prev, completeMessage]);

              setIsUpdatingEditor(false);
            }, 500);
          } else {
            // Handle failure case
            throw new Error(applyData.error || 'Failed to apply changes');
          }
        } catch (error) {
          console.error('Error applying changes:', error);
          setIsUpdatingEditor(false);

          // Update action to failed
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === actionMessageId
                ? { ...msg, actionStatus: 'complete', content: 'Failed to apply changes' }
                : msg
            )
          );
        }
      } else {
        // Regular message without document edit
        const personaMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          personaId: persona.id,
          content: data.response,
          timestamp: new Date(),
          type: data.type === 'suggestion' ? 'suggestion' : 'message',
          suggestedResponses: data.suggestedResponses || getSuggestedResponses(data.type),
        };
        setMessages((prev) => [...prev, personaMessage]);
      }

      // Save to jam session
      if (sessionId) {
        addJamMessage(sessionId, 'user', message, 'message');
        addJamMessage(sessionId, persona.id, data.response, data.type || 'message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const saveMarkdown = async () => {
    if (!workItem?.markdownPath) return;

    // Add action message
    const actionMessageId = Date.now().toString();
    const savingMessage: ChatMessage = {
      id: actionMessageId,
      personaId: 'system',
      content: 'Saving document...',
      timestamp: new Date(),
      type: 'action',
      actionStatus: 'pending',
    };
    setMessages((prev) => [...prev, savingMessage]);

    try {
      // Don't save the metadata section back - it should be preserved from the original file
      // The backend should handle merging the edited content with preserved metadata
      const contentToSave = editedContent;

      const response = await fetch(apiUrl('/api/workspace/write-file'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: workItem.markdownPath,
          content: contentToSave,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save markdown');
      }

      // Mark action as complete
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === actionMessageId
            ? { ...msg, actionStatus: 'complete', content: 'Document saved' }
            : msg
        )
      );
    } catch (error) {
      console.error('Error saving markdown:', error);
      // Update the existing message to show error
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === actionMessageId
            ? { ...msg, content: 'Failed to save document. Please try again.', type: 'system' }
            : msg
        )
      );
    }
  };


  // Render message with rich formatting and clickable links
  const renderMessageContent = (content: string) => {
    // Combined pattern for all formatting including standard markdown links and task references
    const formattingPattern =
      /\[([^\]]+)\]\(doc:([^)]+)\)|\[([^\]]+)\]\(#([^)]+)\)|\[([^\]]+)\]\(([^)]+)\)|(Task \d+:.*?)(?=\n|$)|`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*|\n/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    let keyIndex = 0;

    while ((match = formattingPattern.exec(content)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(
          <Fragment key={`text-${keyIndex++}`}>
            {content.substring(lastIndex, match.index)}
          </Fragment>
        );
      }

      if (match[1] && match[2]) {
        // Document link: [text](doc:search)
        const linkText = match[1];
        const searchText = match[2];
        parts.push(
          <button
            key={`link-${keyIndex++}`}
            onClick={() => handleDocumentLink(searchText)}
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            <span>{linkText}</span>
          </button>
        );
      } else if (match[3] && match[4]) {
        // Section/anchor link: [text](#section)
        const linkText = match[3];
        const sectionId = match[4];
        parts.push(
          <button
            key={`link-${keyIndex++}`}
            onClick={() => handleDocumentLink(sectionId)}
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            <span>{linkText}</span>
          </button>
        );
      } else if (match[5] && match[6]) {
        // Standard markdown link: [text](url-or-section)
        const linkText = match[5];
        const target = match[6];

        // Check if it's a section reference (starts with # or contains section keywords)
        const isSectionRef = target.startsWith('#') ||
                           target.toLowerCase().includes('task') ||
                           target.toLowerCase().includes('section') ||
                           target.toLowerCase().includes('goal') ||
                           target.toLowerCase().includes('criteria');

        if (isSectionRef) {
          // Treat as document section reference
          const searchText = target.startsWith('#') ? target.substring(1) : target;
          parts.push(
            <button
              key={`link-${keyIndex++}`}
              onClick={() => handleDocumentLink(searchText)}
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              <span>📍</span>
              <span>{linkText}</span>
            </button>
          );
        } else if (target.startsWith('http://') || target.startsWith('https://')) {
          // External link
          parts.push(
            <a
              key={`link-${keyIndex++}`}
              href={target}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              {linkText}
            </a>
          );
        } else {
          // Treat as document reference
          parts.push(
            <button
              key={`link-${keyIndex++}`}
              onClick={() => handleDocumentLink(target)}
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              <span>📍</span>
              <span>{linkText}</span>
            </button>
          );
        }
      } else if (match[7]) {
        // Task reference pattern: "Task 3: ..."
        const taskText = match[7];
        parts.push(
          <button
            key={`link-${keyIndex++}`}
            onClick={() => handleDocumentLink(taskText)}
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            <span>{taskText}</span>
          </button>
        );
      } else if (match[8]) {
        // Inline code: `code`
        parts.push(
          <code
            key={`code-${keyIndex++}`}
            className="px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-sm font-mono"
          >
            {match[8]}
          </code>
        );
      } else if (match[9]) {
        // Bold: **text**
        parts.push(<strong key={`bold-${keyIndex++}`}>{match[9]}</strong>);
      } else if (match[10]) {
        // Italic: *text*
        parts.push(<em key={`italic-${keyIndex++}`}>{match[10]}</em>);
      } else if (match[0] === '\n') {
        // Newline
        parts.push(<br key={`br-${keyIndex++}`} />);
      }

      lastIndex = match.index + match[0].length;
    }

    // Add any remaining text
    if (lastIndex < content.length) {
      parts.push(<Fragment key={`text-${keyIndex++}`}>{content.substring(lastIndex)}</Fragment>);
    }

    return parts.length > 0 ? <>{parts}</> : content;
  };

  if (!workItem) {
    return (
      <div className={`p-8 text-center ${styles.textColor}`}>
        <p>Work item not found</p>
        <Button onClick={() => navigate('/work-items')} variant="secondary" className="mt-4">
          Back to Work Items
        </Button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <IconButton
            aria-label="Back to work items"
            variant="secondary"
            onClick={() => navigate('/work-items')}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </IconButton>
          <div>
            <h1 className={`text-xl font-bold ${styles.headingColor}`}>
              Review Session: {workItem.title}
            </h1>
            <p className={`text-sm ${styles.mutedText}`}>
              {persona ? `With ${persona.name}` : 'Setting up review session...'}
            </p>
          </div>
        </div>
        <Button onClick={saveMarkdown} variant="primary" size="sm">
          Save Changes
        </Button>
      </div>

      {/* Main content panel */}
      <div
        className={`
        flex-1 flex min-h-0
        ${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius}
        ${styles.cardShadow}
      `}
      >
        {/* Left panel - Markdown editor */}
        <div className={`w-1/2 border-r ${styles.contentBorder} flex flex-col`}>
          <div className={`px-4 py-3 border-b ${styles.contentBorder}`}>
            <h2 className={`font-medium ${styles.headingColor}`}>Document</h2>
          </div>
          <div
            className={`flex-1 flex flex-col min-h-0 ${isDarkMode ? 'mdx-dark' : 'mdx-light'} mdx-edge-to-edge relative`}
          >
            {editedContent && editedContent.trim() ? (
              <>
                <MDXEditor
                  key={`${workItemId}-${editorKey}`} // Include editorKey to force remount when needed
                  ref={editorRef}
                  markdown={editedContent}
                  onChange={(newContent) => {
                    console.log('Editor onChange called, new length:', newContent?.length);
                    setEditedContent(newContent);
                  }}
                  contentEditableClassName="prose prose-neutral dark:prose-invert max-w-none p-4"
                  plugins={[
                    headingsPlugin(),
                    listsPlugin(),
                    quotePlugin(),
                    thematicBreakPlugin(),
                    markdownShortcutPlugin(),
                    toolbarPlugin({
                      toolbarContents: () => (
                        <>
                          <UndoRedo />
                          <Separator />
                          <BoldItalicUnderlineToggles />
                          <Separator />
                          <ListsToggle />
                          <Separator />
                          <BlockTypeSelect />
                          <Separator />
                          <CreateLink />
                          <InsertThematicBreak />
                        </>
                      ),
                    }),
                  ]}
                />
                {isUpdatingEditor && (
                  <div className="absolute inset-0 bg-white/50 dark:bg-black/50 flex items-center justify-center z-10">
                    <LoadingSpinner size="medium" text="Applying changes..." />
                  </div>
                )}
              </>
            ) : (
              <div className="p-4 text-center text-gray-500">Loading document...</div>
            )}
          </div>
        </div>

        {/* Right panel - Chat or Agent Selector */}
        <div className={`w-1/2 flex flex-col`}>
          {showAgentSelector && !chatStarted ? (
            // Agent selector view
            <div className="flex-1 flex flex-col">
              <div className={`px-4 py-3 border-b ${styles.contentBorder}`}>
                <h2 className={`font-medium ${styles.headingColor}`}>Review Session</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <AgentSelector
                  agents={personas}
                  selectedAgentId={selectedAgentId}
                  onSelectAgent={setSelectedAgentId}
                  showAutoCreate={true}
                />
              </div>
              <div className={`p-4 border-t ${styles.contentBorder}`}>
                <Button
                  onClick={startChatWithAgent}
                  disabled={!selectedAgentId}
                  variant="primary"
                  className="w-full"
                >
                  Start Chat
                </Button>
              </div>
            </div>
          ) : !persona && !isAnalyzing && setupError ? (
            // Error state
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30">
                    <svg
                      className="w-8 h-8 text-red-600 dark:text-red-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
                <p className={`${styles.headingColor} font-medium text-lg mb-2`}>Setup failed</p>
                <p className={`${styles.mutedText} text-sm mb-4`}>{setupError}</p>
                {retryCount < 3 && (
                  <Button onClick={handleRetry} variant="primary">
                    Try again
                  </Button>
                )}
                {retryCount >= 3 && (
                  <div className="space-y-3">
                    <p className={`${styles.mutedText} text-xs`}>
                      Multiple attempts failed. You can still continue with a default reviewer.
                    </p>
                    <Button
                      onClick={() => {
                        // Use fallback persona
                        const fallbackId = Date.now().toString();
                        const fallbackSeed = `${fallbackId}-${workItem.id}-fallback`;
                        const fallbackGender = getGenderFromSeed(fallbackSeed);
                        const fallbackName = getRandomName(fallbackSeed, fallbackGender);

                        const defaultPersona: Omit<Persona, 'id'> = {
                          name: fallbackName,
                          type: 'usability-expert',
                          jobTitle: 'UX Specialist',
                          expertise: ['UI/UX Design', 'User Research', 'Accessibility'],
                          personality: 'Thoughtful and detail-oriented reviewer',
                          status: 'available',
                          avatarSeed: fallbackSeed,
                          avatarGender: fallbackGender,
                        };

                        createPersona(defaultPersona);
                        const createdPersona = { ...defaultPersona, id: fallbackId };
                        setPersona(createdPersona as Persona);

                        const newSessionId = startJamSession(
                          workItem.id,
                          [createdPersona.id],
                          `Review session for ${workItem.title}`
                        );
                        setSessionId(newSessionId);

                        const greetingMessage: ChatMessage = {
                          id: Date.now().toString(),
                          personaId: createdPersona.id,
                          content: `Hi! I'm ${fallbackName}, your UX reviewer. I'll help review your work item and provide feedback to improve the user experience.`,
                          timestamp: new Date(),
                          type: 'message',
                        };

                        setMessages([greetingMessage]);
                        setSetupError(null);
                      }}
                      variant="secondary"
                    >
                      Continue with default reviewer
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : isAnalyzing || isLoadingAgent ? (
            // Document analysis state - show different messages based on which loading state
            <div className="flex-1 flex flex-col">
              {/* Header skeleton */}
              <div className={`px-4 py-3 border-b ${styles.contentBorder}`}>
                <div className="flex items-center gap-3">
                  <div className="animate-pulse">
                    <div className="w-10 h-10 bg-neutral-300 dark:bg-neutral-700 rounded-full"></div>
                  </div>
                  <div className="flex-1 animate-pulse">
                    <div className="h-4 bg-neutral-300 dark:bg-neutral-700 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-neutral-300 dark:bg-neutral-700 rounded w-48"></div>
                  </div>
                </div>
              </div>

              {/* Chat area with loading message */}
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                  <div className="mb-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 animate-pulse">
                      <svg
                        className="w-8 h-8 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        />
                      </svg>
                    </div>
                  </div>
                  {isLoadingAgent && persona ? (
                    <>
                      <p className={`${styles.headingColor} font-medium text-lg mb-2`}>
                        {persona.name.split(' ')[0]} is preparing...
                      </p>
                      <p className={`${styles.mutedText} text-sm mb-4`}>
                        {currentLoadingMessage || getRandomAgentLoadingMessage(persona)}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className={`${styles.headingColor} font-medium text-lg mb-2`}>
                        Analyzing work item plan...
                      </p>
                      <p className={`${styles.mutedText} text-sm mb-4`}>
                        {currentLoadingMessage || 'Finding the perfect reviewer for your work item'}
                      </p>
                    </>
                  )}
                  <div className="flex items-center justify-center gap-2">
                    <div
                      className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ) : persona ? (
            <>
              {/* Persona header with chevron */}
              <div className={`px-4 py-3 border-b ${styles.contentBorder} relative`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <StockPhotoAvatar
                        seed={persona.avatarSeed || persona.id}
                        size={40}
                        gender={persona.avatarGender}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className={`font-medium ${styles.headingColor}`}>{persona.name}</h3>
                      <p className={`text-sm ${styles.mutedText} truncate`}>{persona.jobTitle}</p>
                    </div>
                  </div>
                  <IconButton
                    aria-label="Change agent"
                    variant="ghost"
                    onClick={() => setShowAgentSelectorOverlay(!showAgentSelectorOverlay)}
                  >
                    <svg
                      className={`h-5 w-5 transition-transform ${showAgentSelectorOverlay ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </IconButton>
                </div>

                {/* Agent selector overlay */}
                {showAgentSelectorOverlay && (
                  <div className={`absolute top-full left-0 right-0 z-20 ${styles.cardBg} ${styles.cardBorder} border-t-0 max-h-96 overflow-y-auto shadow-lg`}>
                    <div className="p-4">
                      <AgentSelector
                        agents={personas}
                        selectedAgentId={selectedAgentId}
                        onSelectAgent={async (newAgentId) => {
                          if (newAgentId !== selectedAgentId) {
                            setSelectedAgentId(newAgentId);

                            if (newAgentId === 'auto-create') {
                              setShowAgentSelectorOverlay(false);
                              await analyzeDocument();
                            } else {
                              const newPersona = personas.find(p => p.id === newAgentId);
                              if (newPersona) {
                                setPersona(newPersona);
                                setShowAgentSelectorOverlay(false);
                                await restartChatWithCurrentAgent();
                              }
                            }
                          } else {
                            setShowAgentSelectorOverlay(false);
                          }
                        }}
                        showAutoCreate={true}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0" ref={chatContainerRef}>
                {messages.map((message, index) => {
                  const isLastPersonaMessage =
                    message.personaId !== 'user' &&
                    message.personaId !== 'system' &&
                    index === messages.length - 1 &&
                    !isTyping &&
                    showSuggestions;

                  return (
                    <div
                      key={message.id}
                      data-message-id={message.id}
                      className={`flex flex-col ${message.personaId === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`flex ${message.personaId === 'user' ? 'justify-end' : 'justify-start'} max-w-[80%] ${message.personaId === 'user' ? 'ml-auto' : 'mr-auto'}`}
                      >
                        <div
                          className={`rounded-lg px-4 py-2 ${
                            message.personaId === 'user'
                              ? `bg-blue-600 text-white`
                              : message.type === 'system'
                                ? `${styles.contentBg} ${styles.mutedText} text-sm italic`
                                : message.type === 'action'
                                  ? `${styles.contentBg} ${styles.contentBorder} border ${styles.textColor}`
                                  : `${styles.contentBg} ${styles.contentBorder} border ${styles.textColor}`
                          }`}
                        >
                          <div className="relative">
                            {message.type === 'suggestion' && (
                              <div className={`text-xs font-medium ${styles.mutedText} mb-1`}>
                                💡 Suggestion
                              </div>
                            )}
                            {message.type === 'action' && (
                              <div className={`text-xs font-medium ${styles.mutedText} mb-1`}>
                                ⚡ Action
                              </div>
                            )}
                            {message.type === 'summary' && (
                              <div className={`text-xs font-medium ${styles.mutedText} mb-1`}>
                                📋 Summary of changes
                              </div>
                            )}
                            {/* Regular messages have no header */}
                            <div
                              className={
                                message.type === 'action' ? 'whitespace-pre-wrap italic' : ''
                              }
                            >
                              {renderMessageContent(message.content)}
                            </div>
                            {message.type === 'action' && (
                              <div className="absolute top-0 right-0">
                                {message.actionStatus === 'pending' ? (
                                  <InlineLoadingSpinner />
                                ) : message.actionStatus === 'complete' ? (
                                  <svg
                                    className="h-4 w-4 text-green-600 dark:text-green-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={3}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                ) : null}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Suggested responses */}
                      {isLastPersonaMessage &&
                        message.suggestedResponses &&
                        message.suggestedResponses.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3 max-w-[80%]">
                            {message.suggestedResponses.map((suggestion, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  setSelectedSuggestion(suggestion);
                                  sendMessage(suggestion);
                                }}
                                className={`
                              px-3 py-1.5 text-sm rounded-full transition-all border
                              ${styles.contentBg} ${styles.contentBorder} ${styles.textColor}
                              hover:bg-opacity-70 dark:hover:bg-opacity-30
                              ${selectedSuggestion === suggestion ? 'opacity-50' : ''}
                            `}
                                disabled={isTyping || !!selectedSuggestion}
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        )}
                    </div>
                  );
                })}
                {isTyping && (
                  <div className="flex justify-start">
                    <div
                      className={`${styles.contentBg} ${styles.contentBorder} border rounded-lg px-4 py-2`}
                    >
                      <DancingBubbles />
                    </div>
                  </div>
                )}
                {/* Dynamic bottom padding to allow scrolling user message to top */}
                <div style={{ height: `${bottomPadding}px` }} />
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className={`p-4 border-t ${styles.contentBorder} flex-shrink-0`}>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Type your message..."
                    className={`flex-1 px-3 py-2 ${styles.buttonRadius} ${styles.contentBg} ${styles.contentBorder} border ${styles.textColor} focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500`}
                  />
                  <Button
                    onClick={() => sendMessage()}
                    disabled={!inputMessage.trim() || isTyping}
                    variant="primary"
                  >
                    Send
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
