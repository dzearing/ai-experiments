import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContextV2';
import { StockPhotoAvatar } from '../components/StockPhotoAvatar';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';
import type { Persona, PersonaType } from '../types';

interface Message {
  id: string;
  personaId: string;
  content: string;
  timestamp: Date;
}

interface SuggestedPersona {
  persona: Persona;
  relevance: number;
  reason: string;
}

// Keywords that suggest certain persona types
const PERSONA_KEYWORDS: Record<PersonaType, string[]> = {
  'usability-expert': ['user experience', 'ux', 'ui', 'interface', 'usability', 'accessibility', 'design patterns', 'user flow'],
  'developer': ['code', 'implementation', 'api', 'function', 'class', 'algorithm', 'performance', 'architecture'],
  'tester': ['test', 'quality', 'bug', 'edge case', 'validation', 'qa', 'testing', 'coverage'],
  'data-scientist': ['data', 'analytics', 'metrics', 'statistics', 'ml', 'machine learning', 'analysis', 'insights'],
  'devops': ['deployment', 'ci/cd', 'infrastructure', 'docker', 'kubernetes', 'cloud', 'monitoring', 'scaling'],
  'project-manager': ['timeline', 'deadline', 'scope', 'requirements', 'stakeholder', 'planning', 'milestone', 'deliverable'],
  'designer': ['visual', 'color', 'typography', 'layout', 'brand', 'style', 'mockup', 'figma'],
  'motion-designer': ['animation', 'transition', 'motion', 'interaction', 'micro-interaction', 'gesture', 'movement']
};

export function JamSessionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { jamSessions, personas } = useApp();
  const { currentStyles, isDarkMode } = useTheme();
  const styles = currentStyles;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const session = jamSessions.find(s => s.id === id);
  
  const [focusDocument, setFocusDocument] = useState(`# ${session?.title || 'Jam Session'}

## Objective
Define the main goal of this session...

## Context
Provide background information...

## Key Questions
- What are we trying to solve?
- What are the constraints?
- What are the success criteria?

## Ideas & Solutions
Document ideas as they emerge...

## Action Items
- [ ] Next steps...
`);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>(session?.participantIds || []);
  const [suggestedPersonas, setSuggestedPersonas] = useState<SuggestedPersona[]>([]);
  const [isTyping, setIsTyping] = useState<string | null>(null);

  // Auto-suggest personas based on focus document content
  useEffect(() => {
    const content = focusDocument.toLowerCase();
    const suggestions: SuggestedPersona[] = [];

    personas.forEach(persona => {
      if (persona.status !== 'available') return;
      
      let relevanceScore = 0;
      let matchedKeywords: string[] = [];

      // Check for keyword matches
      const keywords = PERSONA_KEYWORDS[persona.type] || [];
      keywords.forEach(keyword => {
        if (content.includes(keyword)) {
          relevanceScore += 10;
          matchedKeywords.push(keyword);
        }
      });

      // Check for direct type mention
      if (content.includes(persona.type.replace('-', ' '))) {
        relevanceScore += 20;
      }

      if (relevanceScore > 0) {
        suggestions.push({
          persona,
          relevance: relevanceScore,
          reason: matchedKeywords.length > 0 
            ? `Relevant for: ${matchedKeywords.slice(0, 3).join(', ')}` 
            : `${persona.type} expertise may be helpful`
        });
      }
    });

    // Sort by relevance and take top 5
    setSuggestedPersonas(
      suggestions
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, 5)
    );
  }, [focusDocument, personas]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!session) {
    return (
      <div className="text-center py-12">
        <p className={styles.mutedText}>Session not found</p>
        <button
          onClick={() => navigate('/jam-sessions')}
          className={`mt-4 px-4 py-2 ${styles.buttonRadius} ${styles.primaryButton} ${styles.primaryButtonText}`}
        >
          Back to Sessions
        </button>
      </div>
    );
  }

  const activePersonas = personas.filter(p => selectedPersonas.includes(p.id));

  const sendMessage = () => {
    if (!inputMessage.trim() || selectedPersonas.length === 0) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      personaId: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');

    // Simulate persona responses
    selectedPersonas.forEach((personaId, index) => {
      setTimeout(() => {
        setIsTyping(personaId);
        
        setTimeout(() => {
          const persona = personas.find(p => p.id === personaId);
          if (!persona) return;

          const response = generatePersonaResponse(persona, inputMessage, focusDocument);
          
          setMessages(prev => [...prev, {
            id: Date.now().toString() + personaId,
            personaId,
            content: response,
            timestamp: new Date()
          }]);
          
          setIsTyping(null);
        }, 1500 + (index * 1000)); // Stagger responses
      }, 500 + (index * 500));
    });
  };

  const generatePersonaResponse = (persona: Persona, message: string, context: string): string => {
    // Simple mock responses based on persona type
    const responses: Record<PersonaType, string[]> = {
      'usability-expert': [
        "From a UX perspective, we should consider the user journey here.",
        "This could impact accessibility. We need to ensure WCAG compliance.",
        "Have we conducted user research on this feature?",
        "The interface should follow established design patterns for better usability."
      ],
      'developer': [
        "We'll need to consider the technical implementation details.",
        "This might affect performance. We should profile the code.",
        "I can implement this using our existing architecture.",
        "We should ensure proper error handling and edge cases."
      ],
      'tester': [
        "What are the edge cases we need to test?",
        "We'll need comprehensive test coverage for this.",
        "I see potential issues with data validation here.",
        "Have we considered automated testing strategies?"
      ],
      'data-scientist': [
        "Let me analyze the data patterns here.",
        "We should track metrics to measure success.",
        "The data suggests an interesting trend.",
        "We need more data points to make an informed decision."
      ],
      'devops': [
        "This will need proper CI/CD pipeline configuration.",
        "We should consider the deployment strategy.",
        "Monitoring and logging will be crucial here.",
        "Let's ensure this scales properly in production."
      ],
      'project-manager': [
        "How does this align with our project timeline?",
        "We need to consider the resource allocation.",
        "Let's break this down into actionable tasks.",
        "What are the dependencies and blockers?"
      ],
      'designer': [
        "The visual hierarchy needs attention here.",
        "This should align with our design system.",
        "Let me create a mockup to illustrate this.",
        "Color and typography choices are important for brand consistency."
      ],
      'motion-designer': [
        "We could add subtle animations to enhance the experience.",
        "The transition timing is crucial for perceived performance.",
        "Micro-interactions would make this more engaging.",
        "Let's ensure animations are accessible with reduced motion support."
      ]
    };

    const personaResponses = responses[persona.type] || ["I'll need to think about this."];
    return personaResponses[Math.floor(Math.random() * personaResponses.length)];
  };

  const togglePersona = (personaId: string) => {
    setSelectedPersonas(prev => 
      prev.includes(personaId) 
        ? prev.filter(id => id !== personaId)
        : [...prev, personaId]
    );
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {/* Left side - Focus Document */}
      <div className={`flex-1 ${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} ${styles.cardShadow} p-4 flex flex-col`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-lg font-semibold ${styles.headingColor}`}>Focus Document</h2>
          <button
            onClick={() => navigate('/jam-sessions')}
            className={`px-3 py-1 text-sm ${styles.buttonRadius} ${styles.contentBg} ${styles.contentBorder} border ${styles.textColor} hover:opacity-80`}
          >
            Back to Sessions
          </button>
        </div>
        
        <div className="flex-1" data-color-mode={isDarkMode ? 'dark' : 'light'}>
          <MDEditor
            value={focusDocument}
            onChange={(value) => setFocusDocument(value || '')}
            height="100%"
            preview="edit"
            hideToolbar={false}
            visibleDragbar={false}
          />
        </div>
      </div>

      {/* Right side - Conversations */}
      <div className={`flex-1 ${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} ${styles.cardShadow} p-4 flex flex-col`}>
        <h2 className={`text-lg font-semibold ${styles.headingColor} mb-4`}>Conversation</h2>
        
        {/* Persona Selection */}
        <div className={`mb-4 ${styles.contentBg} ${styles.contentBorder} border ${styles.borderRadius} p-4`}>
          <div className={`text-sm font-medium ${styles.headingColor} mb-3`}>Active Participants ({activePersonas.length})</div>
          
          {activePersonas.length === 0 ? (
            <p className={`text-sm ${styles.mutedText} mb-3`}>No participants yet. Add participants below to start the conversation.</p>
          ) : (
            <div className="grid grid-cols-1 gap-2 mb-3">
              {activePersonas.map(persona => (
                <div key={persona.id} className={`flex items-center gap-3 p-2 ${styles.cardBg} ${styles.borderRadius}`}>
                  <StockPhotoAvatar seed={persona.id} size={40} />
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${styles.textColor}`}>{persona.name}</div>
                    <div className={`text-xs ${styles.mutedText}`}>{persona.type}</div>
                  </div>
                  <button
                    onClick={() => togglePersona(persona.id)}
                    className={`px-2 py-1 text-xs ${styles.buttonRadius} ${styles.contentBg} ${styles.contentBorder} border ${styles.textColor} hover:border-red-500 hover:text-red-500 transition-colors`}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Available Personas to Add */}
          <div className={`pt-3 border-t ${styles.contentBorder}`}>
            <div className={`text-sm font-medium ${styles.headingColor} mb-2`}>Add Participants</div>
            <div className="grid grid-cols-1 gap-1 max-h-48 overflow-y-auto">
              {/* Suggested personas first */}
              {suggestedPersonas.length > 0 && (
                <>
                  <div className={`text-xs ${styles.mutedText} px-2 py-1`}>Suggested based on focus document:</div>
                  {suggestedPersonas
                    .filter(({ persona }) => !selectedPersonas.includes(persona.id))
                    .map(({ persona, reason }) => (
                      <button
                        key={persona.id}
                        onClick={() => togglePersona(persona.id)}
                        className={`w-full flex items-center gap-2 p-2 text-sm ${styles.buttonRadius} ${styles.primaryButton} ${styles.primaryButtonText} hover:opacity-90 transition-colors`}
                      >
                        <StockPhotoAvatar seed={persona.id} size={28} />
                        <div className="flex-1 text-left">
                          <div>{persona.name}</div>
                          <div className={`text-xs opacity-90`}>{reason}</div>
                        </div>
                        <span className={`text-xs px-2 py-0.5 bg-white/20 rounded`}>
                          Add
                        </span>
                      </button>
                    ))}
                  <div className={`text-xs ${styles.mutedText} px-2 py-1 mt-2`}>Other available:</div>
                </>
              )}
              
              {/* Other available personas */}
              {personas
                .filter(p => p.status === 'available' && !selectedPersonas.includes(p.id) && !suggestedPersonas.some(s => s.persona.id === p.id))
                .map(persona => (
                  <button
                    key={persona.id}
                    onClick={() => togglePersona(persona.id)}
                    className={`w-full flex items-center gap-2 p-2 text-sm ${styles.buttonRadius} ${styles.contentBg} hover:${styles.cardBg} ${styles.contentBorder} border transition-colors`}
                  >
                    <StockPhotoAvatar seed={persona.id} size={28} />
                    <div className="flex-1 text-left">
                      <div className={styles.textColor}>{persona.name}</div>
                      <div className={`text-xs ${styles.mutedText}`}>{persona.type}</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 ${styles.primaryButton} ${styles.primaryButtonText} rounded`}>
                      Add
                    </span>
                  </button>
                ))}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className={`flex-1 overflow-y-auto mb-4 ${styles.contentBg} ${styles.borderRadius} p-4`}>
          {messages.length === 0 ? (
            <div className={`text-center ${styles.mutedText} py-8`}>
              {selectedPersonas.length === 0 
                ? "Add participants to start the conversation"
                : "Start the conversation by asking a question or sharing an idea"}
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map(message => {
                const isUser = message.personaId === 'user';
                const persona = !isUser ? personas.find(p => p.id === message.personaId) : null;
                
                return (
                  <div key={message.id} className={`flex gap-3 ${isUser ? 'justify-end' : ''}`}>
                    {!isUser && persona && (
                      <StockPhotoAvatar seed={persona.id} size={36} />
                    )}
                    <div className={`max-w-[70%] ${isUser ? 'order-first' : ''}`}>
                      {!isUser && persona && (
                        <div className={`text-xs ${styles.mutedText} mb-1`}>{persona.name}</div>
                      )}
                      <div className={`px-4 py-2 ${styles.buttonRadius} ${
                        isUser 
                          ? `${styles.primaryButton} ${styles.primaryButtonText}`
                          : `${styles.cardBg} ${styles.cardBorder} border ${styles.textColor}`
                      }`}>
                        {message.content}
                      </div>
                      <div className={`text-xs ${styles.mutedText} mt-1 ${isUser ? 'text-right' : ''}`}>
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {isTyping && (
                <div className="flex gap-3">
                  <StockPhotoAvatar seed={isTyping} size={36} />
                  <div className={`px-4 py-2 ${styles.buttonRadius} ${styles.cardBg} ${styles.cardBorder} border`}>
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={selectedPersonas.length === 0 ? "Add participants first..." : "Type your message..."}
            disabled={selectedPersonas.length === 0}
            className={`flex-1 px-4 py-2 ${styles.buttonRadius} ${styles.contentBg} ${styles.contentBorder} border ${styles.textColor} focus:ring-2 focus:ring-neutral-500 disabled:opacity-50`}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || selectedPersonas.length === 0}
            className={`px-4 py-2 ${styles.buttonRadius} ${styles.primaryButton} ${styles.primaryButtonText} ${styles.primaryButtonHover} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}