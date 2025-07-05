import { useState, useEffect, useRef, Fragment } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContextV2';
import { Button } from '../components/ui/Button';
import { IconButton } from '../components/ui/IconButton';
import { LoadingSpinner, InlineLoadingSpinner } from '../components/ui/LoadingSpinner';
import { StockPhotoAvatar, getGenderFromSeed, getRandomName } from '../components/StockPhotoAvatar';
import { useAuth } from '../contexts/AuthContext';
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
  Separator
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
  const { workItems, personas, jamSessions, createPersona, startJamSession, addJamMessage, updateJamSession } = useApp();
  const { currentStyles, isDarkMode } = useTheme();
  const { activeAccount } = useAuth();
  const styles = currentStyles;
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [persona, setPersona] = useState<Persona | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
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
  const editorRef = useRef<any>(null);
  const suggestionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const workItem = workItems.find(w => w.id === workItemId);
  console.log('WorkItemJamSession - workItemId:', workItemId);
  console.log('WorkItemJamSession - found workItem:', workItem);
  
  // Get suggested responses based on message type
  const getSuggestedResponses = (type: string): string[] => {
    switch (type) {
      case 'suggestion':
        return [
          'Yes, please apply this change',
          'Let me think about it',
          'Can you explain more?',
          'What are the alternatives?'
        ];
      case 'summary':
        return [
          'Great! What else can we improve?',
          'Can you review the next task?',
          'Let\'s focus on a different area',
          'That looks good, thanks!'
        ];
      case 'message':
      default:
        return [
          'Tell me more',
          'What do you suggest?',
          'Can you provide an example?',
          'Let\'s move on to something else'
        ];
    }
  };
  
  // Monitor editedContent changes and save draft
  useEffect(() => {
    console.log('editedContent changed, new length:', editedContent.length, 'first 100 chars:', editedContent.substring(0, 100));
    
    // Save draft content to jam session
    if (sessionId && editedContent !== markdownContent) {
      const debounceTimer = setTimeout(() => {
        updateJamSession(sessionId, { draftContent: editedContent });
      }, 1000); // Debounce for 1 second
      
      return () => clearTimeout(debounceTimer);
    }
  }, [editedContent, sessionId, markdownContent, updateJamSession]);
  
  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
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
      
      if (workItem?.markdownPath) {
        try {
          console.log('Loading markdown from:', workItem.markdownPath);
          const response = await fetch('http://localhost:3000/api/workspace/read-file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filePath: workItem.markdownPath })
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('Markdown content loaded, length:', data.content.length);
            
            // Remove metadata section if it exists
            let content = data.content;
            const metadataIndex = content.lastIndexOf('\n## Metadata\n');
            if (metadataIndex !== -1) {
              content = content.substring(0, metadataIndex);
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
        console.log('No markdownPath on work item');
        // If no markdownPath, generate content from work item metadata
        if (workItem?.metadata?.tasks) {
          const generatedContent = `# ${workItem.title}

## Description
${workItem.description}

## Tasks
${workItem.metadata.tasks.map((task: any, index: number) => `
### Task ${task.taskNumber || index + 1}: ${task.title}
**Description:** ${task.description}

**Goals:**
${task.goals?.map((g: string) => `- ${g}`).join('\n') || '- No goals defined'}

**Work Description:**
${task.workDescription || 'No work description'}

**Validation Criteria:**
${task.validationCriteria?.map((c: string) => `- ${c}`).join('\n') || '- No criteria defined'}
`).join('\n')}`;
          
          setMarkdownContent(generatedContent);
          setEditedContent(generatedContent);
        }
      }
    };
    
    loadMarkdown();
  }, [workItem]);
  
  // Check if persona already exists for this work item
  useEffect(() => {
    if (workItem && markdownContent && !hasInitialized) {
      setHasInitialized(true);
      
      // Add a small delay to show the initial loading state
      setTimeout(() => {
        console.log('Checking for existing session - workItem:', workItem.id, 'jamSessionIds:', workItem.jamSessionIds);
        console.log('Available jamSessions:', jamSessions.map(s => ({ id: s.id, workItemId: s.workItemId })));
        
        // Look for existing jam session
        const existingSessionId = workItem.jamSessionIds[0]; // Get first session if exists
        
        if (existingSessionId) {
          console.log('Found existing session ID:', existingSessionId);
          const session = jamSessions.find(s => s.id === existingSessionId);
          if (session) {
            console.log('Found session:', session);
            setSessionId(existingSessionId);
            
            // Get the persona from the session
            const personaId = session.participantIds.find(id => id !== 'user');
            console.log('Looking for persona ID:', personaId, 'in personas:', personas.map(p => ({ id: p.id, name: p.name })));
            const existingPersona = personas.find(p => p.id === personaId);
            
            if (existingPersona) {
              console.log('Found existing persona:', existingPersona);
              setPersona(existingPersona);
              
              // Load existing messages
              const sessionMessages = session.messages.map(msg => ({
                id: msg.id,
                personaId: msg.senderId,
                content: msg.content,
                timestamp: new Date(msg.timestamp),
                type: msg.type || 'message' as const,
                suggestedResponses: msg.senderId !== 'user' ? getSuggestedResponses('message') : undefined
              }));
              
              setMessages(sessionMessages);
              
              // Restore draft content if available
              if (session.draftContent) {
                setEditedContent(session.draftContent);
              }
              
              // If no messages exist, send initial greeting
              if (sessionMessages.length === 0) {
                const userName = activeAccount?.username || 'there';
                const greetingMessage: ChatMessage = {
                  id: Date.now().toString(),
                  personaId: existingPersona.id,
                  content: `Hey ${userName}! I'm ${existingPersona.name}, your ${existingPersona.jobTitle || existingPersona.type}. I'm here to review your work item and provide feedback. Let me take a look at what you have.`,
                  timestamp: new Date(),
                  type: 'message',
                  suggestedResponses: getSuggestedResponses('message')
                };
                
                setMessages([greetingMessage]);
                
                // Add message to jam session
                addJamMessage(existingSessionId, existingPersona.id, greetingMessage.content, 'message');
              }
            } else {
              // Persona not found for existing session - create new session
              console.warn('Persona not found for existing session, creating new session');
              analyzeDocument();
            }
          } else {
            // Session not found in jamSessions - create new session
            console.warn('Session not found in jamSessions, creating new session');
            analyzeDocument();
          }
        } else {
          // Analyze the document to create a persona
          analyzeDocument();
        }
      }, 500);
    }
  }, [workItem, markdownContent, hasInitialized, jamSessions, personas, activeAccount, addJamMessage]);
  
  const analyzeDocument = async () => {
    if (!workItem || isAnalyzing) return; // Prevent multiple concurrent calls
    
    console.log('analyzeDocument called for workItem:', workItem.id);
    
    setIsAnalyzing(true);
    setSetupError(null);
    
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
        const response = await fetch('http://localhost:3000/api/claude/analyze-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: markdownContent,
            workItemTitle: workItem.title,
            workItemDescription: workItem.description,
            userName: userName,
            personaName: personaName,
            personaGender: avatarGender
          }),
          signal: controller.signal
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
        personality: data.personality || 'Thoughtful and detail-oriented, with a focus on user experience',
        status: 'available',
        avatarSeed: avatarSeed,
        avatarGender: avatarGender
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
        type: 'message'
        // No suggestedResponses - the actual suggestion is coming next
      };
      
      setMessages([greetingMessage]);
      setShowSuggestions(false); // Don't show suggestions for this combined message
      
      // Add the first suggestion after a delay
      if (data.firstSuggestionDetails || data.firstSuggestion) {
        setTimeout(() => {
          setIsTyping(true);
          
          setTimeout(() => {
            const suggestionContent = data.firstSuggestionDetails || 
                                     data.firstSuggestion || 
                                     "I have a suggestion for improving your work item.";
            
            const suggestionMessage: ChatMessage = {
              id: (Date.now() + 1).toString(),
              personaId: createdPersona.id,
              content: suggestionContent,
              timestamp: new Date(),
              type: 'suggestion',
              suggestedResponses: getSuggestedResponses('suggestion')
            };
            setMessages(prev => [...prev, suggestionMessage]);
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
      setRetryCount(prev => prev + 1);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const handleRetry = () => {
    setSetupError(null);
    analyzeDocument();
  };
  
  const sendMessage = async (messageText?: string) => {
    const message = messageText || inputMessage;
    if (!message.trim() || !persona || !sessionId) return;
    
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      personaId: 'user',
      content: message,
      timestamp: new Date(),
      type: 'message'
    };
    setMessages(prev => [...prev, userMessage]);
    if (!messageText) {
      setInputMessage('');
    }
    setIsTyping(true);
    setShowSuggestions(false); // Hide suggestions when sending
    
    try {
      // Send to Claude for response
      const response = await fetch('http://localhost:3000/api/claude/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages,
          userMessage: message,
          persona: persona,
          documentContent: editedContent,
          workItem: {
            title: workItem?.title,
            description: workItem?.description
          }
        })
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
          type: 'message'
        };
        setMessages(prev => [...prev, ackMessage]);
        
        // Add action message
        const actionMessageId = (Date.now() + 1).toString();
        const actionMessage: ChatMessage = {
          id: actionMessageId,
          personaId: 'system',
          content: 'Applying suggested changes to the document...',
          timestamp: new Date(),
          type: 'action',
          actionStatus: 'pending'
        };
        setMessages(prev => [...prev, actionMessage]);
        
        // Lock the editor
        setIsUpdatingEditor(true);
        
        // Make a separate API call to apply the changes with current content
        try {
          const applyResponse = await fetch('http://localhost:3000/api/claude/apply-changes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              currentContent: editedContent, // Current state of the document
              previousSuggestion: data.suggestionToApply || messages[messages.length - 2]?.content,
              persona: persona,
              workItem: {
                title: workItem?.title,
                description: workItem?.description
              }
            })
          });
          
          if (!applyResponse.ok) {
            throw new Error('Failed to apply changes');
          }
          
          const applyData = await applyResponse.json();
          
          if (applyData.success && applyData.updatedContent) {
            // Save current scroll position
            const editorContainer = document.querySelector('.mdxeditor [contenteditable]') || 
                                   document.querySelector('.mdxeditor');
            const savedScrollTop = editorContainer?.scrollTop || 0;
            
            console.log('Saving scroll position:', savedScrollTop);
            
            // Update content and force editor remount
            setEditedContent(applyData.updatedContent);
            setEditorKey(prev => prev + 1); // Force remount to ensure content updates
            
            // Restore scroll position after remount
            setTimeout(() => {
              const newEditorContainer = document.querySelector('.mdxeditor [contenteditable]') || 
                                        document.querySelector('.mdxeditor');
              if (newEditorContainer && savedScrollTop > 0) {
                newEditorContainer.scrollTop = savedScrollTop;
                console.log('Restored scroll position to:', savedScrollTop);
              }
            }, 100); // Wait for editor to remount
            
            // Mark action as complete
            setTimeout(() => {
              setMessages(prev => prev.map(msg => 
                msg.id === actionMessageId 
                  ? { ...msg, actionStatus: 'complete' }
                  : msg
              ));
              
              // Add completion message
              const completeMessage: ChatMessage = {
                id: (Date.now() + 2).toString(),
                personaId: persona.id,
                content: applyData.summary || "I've updated the document with the suggested changes.",
                timestamp: new Date(),
                type: 'summary',
                suggestedResponses: getSuggestedResponses('summary')
              };
              setMessages(prev => [...prev, completeMessage]);
              
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
          setMessages(prev => prev.map(msg => 
            msg.id === actionMessageId 
              ? { ...msg, actionStatus: 'complete', content: 'Failed to apply changes' }
              : msg
          ));
        }
        
      } else {
        // Regular message without document edit
        const personaMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          personaId: persona.id,
          content: data.response,
          timestamp: new Date(),
          type: data.type === 'suggestion' ? 'suggestion' : 'message',
          suggestedResponses: data.suggestedResponses || getSuggestedResponses(data.type)
        };
        setMessages(prev => [...prev, personaMessage]);
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
      actionStatus: 'pending'
    };
    setMessages(prev => [...prev, savingMessage]);
    
    try {
      // Remove metadata section if it exists
      let contentToSave = editedContent;
      const metadataIndex = contentToSave.lastIndexOf('\n## Metadata\n');
      if (metadataIndex !== -1) {
        contentToSave = contentToSave.substring(0, metadataIndex);
      }
      
      const response = await fetch('http://localhost:3000/api/workspace/write-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: workItem.markdownPath,
          content: contentToSave
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save markdown');
      }
      
      // Mark action as complete
      setMessages(prev => prev.map(msg => 
        msg.id === actionMessageId 
          ? { ...msg, actionStatus: 'complete', content: 'Document saved' }
          : msg
      ));
      
    } catch (error) {
      console.error('Error saving markdown:', error);
      // Update the existing message to show error
      setMessages(prev => prev.map(msg => 
        msg.id === actionMessageId 
          ? { ...msg, content: 'Failed to save document. Please try again.', type: 'system' }
          : msg
      ));
    }
  };
  
  // Handle clicking on document references
  const handleDocumentLink = (searchText: string) => {
    if (!editedContent || !editorRef.current) return;
    
    // Find the text in the document
    const index = editedContent.toLowerCase().indexOf(searchText.toLowerCase());
    if (index !== -1) {
      console.log('Found text at index:', index, 'searching for:', searchText);
      
      // Try to focus the editor and set cursor position
      try {
        // Focus the editor
        const editorElement = document.querySelector('.mdxeditor [contenteditable="true"]') as HTMLElement;
        if (editorElement) {
          editorElement.focus();
          
          // Calculate approximate line number and scroll
          const lines = editedContent.substring(0, index).split('\n');
          const lineNumber = lines.length;
          
          // Scroll to make the match visible
          // This is approximate - MDXEditor handles its own scrolling
          const lineHeight = 24; // Approximate line height
          const scrollTop = (lineNumber - 5) * lineHeight; // Scroll to 5 lines before match
          
          const scrollContainer = document.querySelector('.mdxeditor-root-contenteditable');
          if (scrollContainer) {
            scrollContainer.scrollTop = Math.max(0, scrollTop);
          }
          
          // Highlight effect
          editorElement.style.transition = 'background-color 0.3s';
          editorElement.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
          setTimeout(() => {
            editorElement.style.backgroundColor = '';
          }, 1000);
        }
      } catch (error) {
        console.error('Error focusing editor:', error);
      }
    }
  };
  
  // Render message with rich formatting and clickable links
  const renderMessageContent = (content: string) => {
    // Combined pattern for all formatting
    const formattingPattern = /\[([^\]]+)\]\(doc:([^)]+)\)|`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*|\n/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    let keyIndex = 0;
    
    while ((match = formattingPattern.exec(content)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(<Fragment key={`text-${keyIndex++}`}>{content.substring(lastIndex, match.index)}</Fragment>);
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
            📍 {linkText}
          </button>
        );
      } else if (match[3]) {
        // Inline code: `code`
        parts.push(
          <code 
            key={`code-${keyIndex++}`}
            className="px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-sm font-mono"
          >
            {match[3]}
          </code>
        );
      } else if (match[4]) {
        // Bold: **text**
        parts.push(<strong key={`bold-${keyIndex++}`}>{match[4]}</strong>);
      } else if (match[5]) {
        // Italic: *text*
        parts.push(<em key={`italic-${keyIndex++}`}>{match[5]}</em>);
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </IconButton>
          <div>
            <h1 className={`text-xl font-bold ${styles.headingColor}`}>Review Session: {workItem.title}</h1>
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
      <div className={`
        flex-1 flex min-h-0
        ${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius}
        ${styles.cardShadow}
      `}>
        {/* Left panel - Markdown editor */}
        <div className={`w-1/2 border-r ${styles.contentBorder} flex flex-col`}>
          <div className={`px-4 py-3 border-b ${styles.contentBorder}`}>
            <h2 className={`font-medium ${styles.headingColor}`}>Document</h2>
          </div>
          <div className={`flex-1 flex flex-col min-h-0 ${isDarkMode ? 'mdx-dark' : 'mdx-light'} mdx-edge-to-edge relative`}>
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
                      )
                    })
                  ]}
                />
                {isUpdatingEditor && (
                  <div className="absolute inset-0 bg-white/50 dark:bg-black/50 flex items-center justify-center z-10">
                    <LoadingSpinner size="medium" text="Applying changes..." />
                  </div>
                )}
              </>
            ) : (
              <div className="p-4 text-center text-gray-500">
                Loading document...
              </div>
            )}
          </div>
        </div>
        
        {/* Right panel - Chat */}
        <div className={`w-1/2 flex flex-col`}>
          {!persona && !isAnalyzing && !setupError ? (
            // Initial loading state
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-pulse mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full mx-auto mb-4"></div>
                  <div className="h-2 bg-neutral-300 dark:bg-neutral-700 rounded w-32 mx-auto mb-2"></div>
                  <div className="h-2 bg-neutral-300 dark:bg-neutral-700 rounded w-24 mx-auto"></div>
                </div>
                <p className={`${styles.textColor} font-medium`}>Setting up review session...</p>
                <p className={`${styles.mutedText} text-sm mt-2`}>Loading document and preparing reviewer</p>
              </div>
            </div>
          ) : !persona && !isAnalyzing && setupError ? (
            // Error state
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30">
                    <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className={`${styles.headingColor} font-medium text-lg mb-2`}>Setup failed</p>
                <p className={`${styles.mutedText} text-sm mb-4`}>{setupError}</p>
                {retryCount < 3 && (
                  <Button
                    onClick={handleRetry}
                    variant="primary"
                  >
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
                          avatarGender: fallbackGender
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
                          type: 'message'
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
          ) : isAnalyzing ? (
            // Document analysis state
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
                      <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                  </div>
                  <p className={`${styles.headingColor} font-medium text-lg mb-2`}>Analyzing work item plan...</p>
                  <p className={`${styles.mutedText} text-sm mb-4`}>Finding the perfect reviewer for your work item</p>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          ) : persona ? (
            <>
              {/* Persona header */}
              <div className={`px-4 py-3 border-b ${styles.contentBorder}`}>
                <div className="flex items-center gap-3">
                  <StockPhotoAvatar
                    seed={persona.avatarSeed || persona.id}
                    size={40}
                    gender={persona.avatarGender}
                  />
                  <div>
                    <h3 className={`font-medium ${styles.headingColor}`}>{persona.name}</h3>
                    <p className={`text-sm ${styles.mutedText}`}>{persona.expertise.join(', ')}</p>
                  </div>
                </div>
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
                    className={`flex flex-col ${message.personaId === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className={`flex ${message.personaId === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.personaId === 'user'
                          ? `${styles.primaryButton} ${styles.primaryButtonText}`
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
                        <div className={message.type === 'action' ? 'whitespace-pre-wrap italic' : ''}>{renderMessageContent(message.content)}</div>
                        {message.type === 'action' && (
                          <div className="absolute top-0 right-0">
                            {message.actionStatus === 'pending' ? (
                              <InlineLoadingSpinner />
                            ) : message.actionStatus === 'complete' ? (
                              <svg className="h-4 w-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </div>
                    </div>
                    
                    {/* Suggested responses */}
                    {isLastPersonaMessage && message.suggestedResponses && message.suggestedResponses.length > 0 && (
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
                    <div className={`${styles.contentBg} ${styles.contentBorder} border rounded-lg px-4 py-2`}>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
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