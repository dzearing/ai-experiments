import React, { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import styles from './ClaudeCodeTerminal.module.css';
import { Button, Spinner, Tabs, TabItem } from '@claude-flow/ui-kit-react';
import {
  AddIcon,
  CodeIcon,
  ChatIcon,
  UsersIcon,
  ListTaskIcon,
} from '@claude-flow/ui-kit-icons';
import { ContextView } from './views/ContextView';
import { AgentsView } from './views/AgentsView';
import { DiffView } from './views/DiffView';
import { ChatNavigation, MessageList, InputArea, PlanEditor, ChatHeader } from './components';
import type { Message, Chat, ClaudeCodeTerminalProps } from './types';

export const ClaudeCodeTerminal: React.FC<ClaudeCodeTerminalProps> = ({
  onCommand,
  onPrompt,
}) => {
  // Detect OS for platform-specific shortcuts
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  
  // Initialize chats with sample data
  const [chats, setChats] = useState<Chat[]>([
    {
      id: 'chat-1',
      title: 'Implementing authentication',
      subtitle: 'Setting up OAuth2 flow',
      isActive: true,
      isBusy: false,
      messages: [
        {
          id: '1',
          type: 'system',
          content: 'Claude Code Web Terminal - Connected to session',
          timestamp: new Date(),
        },
      ],
      lastActivity: new Date(),
      repoPath: 'claude-flow',
      branch: 'feature/auth',
    },
    {
      id: 'chat-2',
      title: 'Database migration',
      subtitle: 'Running migration scripts...',
      isActive: false,
      isBusy: true,
      messages: [],
      lastActivity: new Date(Date.now() - 1000 * 60 * 5),
      repoPath: 'backend-api',
      branch: 'main',
    },
    {
      id: 'chat-3',
      title: 'UI component refactoring',
      subtitle: 'Optimizing Button component',
      isActive: false,
      isBusy: false,
      messages: [],
      lastActivity: new Date(Date.now() - 1000 * 60 * 15),
      repoPath: 'ui-kit',
      branch: 'refactor/buttons',
    },
    {
      id: 'chat-4',
      title: 'Performance optimization',
      subtitle: 'Analyzing bundle size...',
      isActive: false,
      isBusy: true,
      messages: [],
      lastActivity: new Date(Date.now() - 1000 * 60 * 30),
      repoPath: 'web-app',
      branch: 'perf/bundle-size',
    },
  ]);
  
  const [activeChatId, setActiveChatId] = useState('chat-1');
  const activeChat = chats.find(c => c.id === activeChatId) || chats[0];
  
  const [messages, setMessages] = useState<Message[]>(activeChat.messages);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentDraft, setCurrentDraft] = useState(''); // Store the current draft when navigating history
  const [showChatNav, setShowChatNav] = useState(true);
  const [chatFilter, setChatFilter] = useState<'all' | 'idle' | 'busy'>('all');
  const [autoComplete, setAutoComplete] = useState<string[]>([]);
  const [autoCompleteIndex, setAutoCompleteIndex] = useState(0);
  const [currentMode, setCurrentMode] = useState<'default' | 'plan'>('default');
  const [isRememberMode, setIsRememberMode] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [inputMode, setInputMode] = useState<'single-line' | 'multi-line'>('single-line');
  const [planContent, setPlanContent] = useState(`# Project Implementation Plan\n\n## Overview\nThis document outlines the implementation strategy for the authentication feature.\n\n## Phase 1: Setup OAuth2\n- Configure OAuth providers\n- Set up redirect URIs\n- Implement token storage\n\n## Phase 2: User Flow\n1. **Login Page**\n   - Design responsive login form\n   - Add social login buttons\n   - Implement error handling\n\n2. **Session Management**\n   - Create session middleware\n   - Handle token refresh\n   - Implement logout flow\n\n## Technical Considerations\n- Security best practices\n- Rate limiting\n- CSRF protection\n\n## Testing Strategy\n- Unit tests for auth logic\n- Integration tests for OAuth flow\n- E2E tests for user journey`);
  
  // Tab management state
  const [activeTabId, setActiveTabId] = useState('chat-1');
  const [dynamicTabs, setDynamicTabs] = useState<string[]>(['chat-1', 'plan-1', 'context-1', 'agents-1']);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Predefined actions for simulating work
  const workActions = [
    'Analyzing code structure',
    'Reading file contents',
    'Searching for references',
    'Running type checks',
    'Evaluating dependencies',
    'Processing imports',
    'Scanning for patterns',
    'Building AST',
    'Checking syntax',
    'Validating configuration',
    'Examining test coverage',
    'Reviewing documentation',
    'Parsing modules',
    'Inspecting components',
    'Analyzing performance',
    'Gathering metrics',
    'Compiling results',
    'Organizing findings',
  ];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const messagesContainer = messagesEndRef.current?.parentElement;
    if (messagesContainer) {
      messagesContainer.scrollTo({
        top: messagesContainer.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages.length]); // Only trigger on message count change, not content changes

  // Focus input on mount and set initial height
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
    }
    // Mark as initialized after first render to prevent initial animations
    setHasInitialized(true);
  }, []);

  // Adjust textarea height when input changes
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
    }
  }, [input]);
  
  // Update messages when active chat changes
  useEffect(() => {
    const chat = chats.find(c => c.id === activeChatId);
    if (chat) {
      setMessages(chat.messages);
      // Immediately scroll to bottom when switching chats (no animation)
      // Use scrollTop instead of scrollIntoView to prevent full page scroll
      setTimeout(() => {
        const messagesContainer = messagesEndRef.current?.parentElement;
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      }, 0);
    }
  }, [activeChatId, chats]);
  
  // Detect remember mode
  useEffect(() => {
    setIsRememberMode(input.startsWith('#'));
  }, [input]);
  
  // Maintain focus when switching modes
  useEffect(() => {
    // Small delay to ensure DOM has updated
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 50);
    
    return () => clearTimeout(timer);
  }, [currentMode]);
  
  
  // Animate subtitles for busy chats with staggered timing
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    let mounted = true;
    
    // Create a separate timer for each busy chat with random intervals
    const updateChat = (chatId: string) => {
      if (!mounted) return;
      
      // Each update gets a new random interval
      const nextInterval = Math.random() * 5000 + 5000; // 5-10 seconds
      
      const timer = setTimeout(() => {
        if (!mounted) return;
        
        setChats(prevChats => 
          prevChats.map(chat => {
            if (chat.id === chatId && chat.isBusy) {
              // Pick a random action from the list and add ellipsis
              const randomAction = workActions[Math.floor(Math.random() * workActions.length)] + '...';
              return { 
                ...chat, 
                previousSubtitle: chat.subtitleInitialized ? chat.subtitle : undefined,
                subtitle: randomAction,
                subtitleInitialized: true
              };
            }
            return chat;
          })
        );
        
        // Clear the previous subtitle after animation completes
        const clearTimer = setTimeout(() => {
          if (!mounted) return;
          setChats(prevChats => 
            prevChats.map(chat => 
              chat.id === chatId ? { ...chat, previousSubtitle: undefined } : chat
            )
          );
        }, 500); // Match animation duration
        timers.push(clearTimer);
        
        // Schedule the next update for this chat
        updateChat(chatId);
      }, nextInterval);
      
      timers.push(timer);
    };
    
    // Start timers for all busy chats with different initial delays
    chats.forEach((chat) => {
      if (chat.isBusy) {
        // Stagger initial delays more evenly
        const initialDelay = Math.random() * 10000; // Spread initial starts over 10 seconds
        const timer = setTimeout(() => {
          if (mounted) updateChat(chat.id);
        }, initialDelay);
        timers.push(timer);
      }
    });
    
    return () => {
      mounted = false;
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [chats.filter(c => c.isBusy).length]); // Only re-run when number of busy chats changes

  const handleSubmit = useCallback(() => {
    if (!input.trim()) return;

    const trimmedInput = input.trim();
    
    // Add to history
    setHistory(prev => [...prev, trimmedInput]);
    setHistoryIndex(-1);

    // Check if it's a command
    if (trimmedInput.startsWith('/')) {
      handleCommand(trimmedInput);
    } else {
      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: trimmedInput,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);
      
      // Update chat messages
      setChats(prev => prev.map(chat => 
        chat.id === activeChatId 
          ? { ...chat, messages: [...chat.messages, userMessage], lastActivity: new Date() }
          : chat
      ));

      // Simulate assistant response
      simulateAssistantResponse(trimmedInput);
      
      if (onPrompt) {
        onPrompt(trimmedInput);
      }
    }

    setInput('');
    setCurrentDraft(''); // Clear the draft when submitting
    setAutoComplete([]);
    
    // Keep focus on the input and ensure it's not disabled
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.disabled = false;
      }
    });
  }, [input, onPrompt]);

  const handleCommand = (command: string) => {
    const parts = command.split(' ');
    const cmd = parts[0].substring(1); // Remove the '/'

    // Don't add command as a user message - commands are handled silently
    
    // Process command
    switch (cmd) {
      case 'help':
        addSystemMessage(`Available commands:
/clear - Clear the conversation
/stop - Stop current operation
/diff - Open a diff view tab
/agents - Open or switch to agents tab
/plan - Open or switch to plan tab
/context - Open or switch to context tab
/help - Show this help message

Keyboard shortcuts:
↑/↓ - Navigate command history
Tab - Auto-complete commands
# - Enter remember mode
${isMac ? '⌘' : 'Ctrl'}+↓ - Toggle input mode (single-line/multi-line)
${inputMode === 'single-line' ? 'Enter' : `${isMac ? '⌘' : 'Ctrl'}+Enter`} - Submit prompt
${inputMode === 'single-line' ? 'Shift+Enter' : 'Enter'} - New line`);
        break;
        
      case 'diff':
        // Open a diff tab
        const diffId = `diff-${Date.now()}`;
        setDynamicTabs(prev => [...prev, diffId]);
        setActiveTabId(diffId);
        addSystemMessage('Opened diff view tab');
        break;
        
      case 'agents':
        // Check if agents tab exists
        const agentsTabExists = getTabItems().some(tab => tab.id === 'agents-1');
        if (agentsTabExists) {
          setActiveTabId('agents-1');
          addSystemMessage('Switched to agents tab');
        } else {
          // Agents tab was closed, recreate it
          if (!dynamicTabs.includes('agents-1')) {
            setDynamicTabs(prev => [...prev, 'agents-1']);
          }
          setActiveTabId('agents-1');
          addSystemMessage('Opened agents tab');
        }
        break;
        
      case 'plan':
        // Check if plan tab exists
        const planTabExists = getTabItems().some(tab => tab.id === 'plan-1');
        if (planTabExists) {
          setActiveTabId('plan-1');
          addSystemMessage('Switched to plan tab');
        } else {
          // Plan tab was closed, recreate it
          if (!dynamicTabs.includes('plan-1')) {
            setDynamicTabs(prev => [...prev, 'plan-1']);
          }
          setActiveTabId('plan-1');
          addSystemMessage('Opened plan tab');
        }
        break;
        
      case 'context':
        // Check if context tab exists
        const contextTabExists = getTabItems().some(tab => tab.id === 'context-1');
        if (contextTabExists) {
          setActiveTabId('context-1');
          addSystemMessage('Switched to context tab');
        } else {
          // Context tab was closed, recreate it
          if (!dynamicTabs.includes('context-1')) {
            setDynamicTabs(prev => [...prev, 'context-1']);
          }
          setActiveTabId('context-1');
          addSystemMessage('Opened context tab');
        }
        break;
        
        
      case 'clear':
        const clearMessage = {
          id: Date.now().toString(),
          type: 'system' as const,
          content: 'Conversation cleared',
          timestamp: new Date(),
        };
        setMessages([clearMessage]);
        // Update chat to only have the clear message
        setChats(prev => prev.map(chat => 
          chat.id === activeChatId 
            ? { ...chat, messages: [clearMessage], lastActivity: new Date() }
            : chat
        ));
        break;
      
      case 'stop':
        setIsStreaming(false);
        addSystemMessage('Operation stopped');
        break;
      
      default:
        addSystemMessage(`Unknown command: /${cmd}. Type /help for available commands.`);
    }

    if (onCommand) {
      onCommand(command);
    }
  };

  const addSystemMessage = (content: string) => {
    const sysMessage: Message = {
      id: Date.now().toString(),
      type: 'system',
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, sysMessage]);
    
    // Update chat messages
    setChats(prev => prev.map(chat => 
      chat.id === activeChatId 
        ? { ...chat, messages: [...chat.messages, sysMessage], lastActivity: new Date() }
        : chat
    ));
  };

  const simulateAssistantResponse = (prompt: string) => {
    setIsStreaming(true);
    
    // Mark chat as busy
    setChats(prev => prev.map(chat => 
      chat.id === activeChatId 
        ? { ...chat, isBusy: true, subtitle: 'Processing request...' }
        : chat
    ));
    
    // Simulate a tool use first
    setTimeout(() => {
      const toolMessage: Message = {
        id: Date.now().toString(),
        type: 'tool',
        content: 'Reading file: /src/main.ts',
        timestamp: new Date(),
        toolName: 'Read',
        toolStatus: 'executing',
      };
      setMessages(prev => [...prev, toolMessage]);
      
      // Complete tool after delay
      setTimeout(() => {
        setMessages(prev => prev.map(m => 
          m.id === toolMessage.id 
            ? { ...m, toolStatus: 'completed', toolOutput: 'File read successfully (42 lines)' }
            : m
        ));
      }, 1000);
    }, 500);

    // Simulate assistant response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `I'll help you with: "${prompt}". Let me analyze the code and provide a solution...

Based on the file structure, I can see this is a React application. Here's what I'll do:

1. First, I'll examine the current implementation
2. Then I'll make the necessary modifications
3. Finally, I'll test the changes

Let me start by implementing the solution...`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsStreaming(false);
      
      // Update chat with assistant message and clear busy state
      setChats(prev => prev.map(chat => 
        chat.id === activeChatId 
          ? { 
              ...chat, 
              messages: [...chat.messages, assistantMessage], 
              isBusy: false,
              subtitle: 'Ready',
              lastActivity: new Date()
            }
          : chat
      ));
      
    }, 2000);
  };

  const handleChatSelect = (chatId: string) => {
    setActiveChatId(chatId);
    setChats(prev => prev.map(chat => ({
      ...chat,
      isActive: chat.id === chatId
    })));
  };
  
  const [newChatIds, setNewChatIds] = useState<Set<string>>(new Set());
  const [hasInitialized, setHasInitialized] = useState(false);
  
  const handleNewChat = () => {
    const newChat: Chat = {
      id: `chat-${Date.now()}`,
      title: 'New conversation',
      subtitle: 'Ready',
      isActive: true,
      isBusy: false,
      messages: [{
        id: Date.now().toString(),
        type: 'system',
        content: 'New conversation started',
        timestamp: new Date(),
      }],
      lastActivity: new Date(),
    };
    
    // Track this as a new chat for animation
    setNewChatIds(prev => new Set(prev).add(newChat.id));
    
    setChats(prev => [
      newChat,
      ...prev.map(c => ({ ...c, isActive: false }))
    ]);
    setActiveChatId(newChat.id);
    
    // Focus the input after the new chat is rendered
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    });
    
    // Remove from new chat tracking after animation completes
    setTimeout(() => {
      setNewChatIds(prev => {
        const next = new Set(prev);
        next.delete(newChat.id);
        return next;
      });
    }, 600); // Match animation duration
  };
  
  const handleDeleteChat = (chatId: string) => {
    setChats(prev => {
      const filtered = prev.filter(c => c.id !== chatId);
      // If we deleted the active chat, activate the first remaining chat
      if (chatId === activeChatId && filtered.length > 0) {
        setActiveChatId(filtered[0].id);
        filtered[0].isActive = true;
      }
      return filtered;
    });
  };
  
  const handleChatReorder = (draggedId: string, targetId: string) => {
    setChats(prev => {
      const newChats = [...prev];
      const draggedIndex = newChats.findIndex(c => c.id === draggedId);
      const targetIndex = newChats.findIndex(c => c.id === targetId);
      
      if (draggedIndex !== -1 && targetIndex !== -1 && draggedIndex !== targetIndex) {
        const [draggedChat] = newChats.splice(draggedIndex, 1);
        newChats.splice(targetIndex, 0, draggedChat);
      }
      
      return newChats;
    });
  };
  
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle input mode toggle with Ctrl/Meta+Down Arrow
    if (e.key === 'ArrowDown' && (isMac ? e.metaKey : e.ctrlKey)) {
      e.preventDefault();
      setInputMode(prev => prev === 'single-line' ? 'multi-line' : 'single-line');
      // No system message - the mode change is already visible in the mode badge and helper text
      return;
    }
    
    // Handle remember mode exit
    if (isRememberMode) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setInput('');
        setIsRememberMode(false);
        return;
      } else if (e.key === 'Backspace' && input === '#') {
        // Exit remember mode when backspacing on empty remember input
        e.preventDefault();
        setInput('');
        setIsRememberMode(false);
        return;
      }
    }
    
    // Handle Escape key
    if (e.key === 'Escape' && !isRememberMode) {
      e.preventDefault();
      if (isStreaming) {
        // Abort if we're waiting for a response
        setIsStreaming(false);
        addSystemMessage('Operation aborted');
        // Mark active chat as idle
        setChats(prev => prev.map(chat => 
          chat.id === activeChatId 
            ? { ...chat, isBusy: false, subtitle: 'Ready' }
            : chat
        ));
      } else {
        // Clear input if idle
        setInput('');
        setCurrentDraft('');
        setHistoryIndex(-1);
      }
      return;
    }

    // History navigation with multiline support
    const textarea = e.currentTarget;
    const cursorPosition = textarea.selectionStart;
    const lines = textarea.value.split('\n');
    let currentLine = 0;
    let positionInLine = cursorPosition;
    let charCount = 0;
    
    // Find current line and position within that line
    for (let i = 0; i < lines.length; i++) {
      if (charCount + lines[i].length >= cursorPosition) {
        currentLine = i;
        positionInLine = cursorPosition - charCount;
        break;
      }
      charCount += lines[i].length + 1; // +1 for newline
    }
    
    if (e.key === 'ArrowUp') {
      // Check if we're at the first line
      if (currentLine === 0) {
        // If at position 0 of first line, navigate to previous history
        if (positionInLine === 0 && history.length > 0) {
          e.preventDefault();
          
          // If we're already at the beginning of history, no-op
          if (historyIndex === 0) {
            return;
          }
          
          // Save current input as draft if we're starting to navigate history
          if (historyIndex === -1) {
            setCurrentDraft(input);
          }
          
          const newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
          setHistoryIndex(newIndex);
          setInput(history[newIndex]);
          // Set cursor to end when going backward (up) in history
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
          }, 0);
        } else if (positionInLine > 0) {
          // Move to position 0 of first line
          e.preventDefault();
          textarea.selectionStart = textarea.selectionEnd = 0;
        }
      }
      // Otherwise let default behavior handle moving between lines
    } else if (e.key === 'ArrowDown') {
      // Check if we're at the last line
      if (currentLine === lines.length - 1) {
        // If at last position of last line, navigate to next history
        if (positionInLine === lines[currentLine].length) {
          if (historyIndex !== -1) {
            e.preventDefault();
            const newIndex = historyIndex + 1;
            if (newIndex >= history.length) {
              // Return to current draft
              setHistoryIndex(-1);
              setInput(currentDraft);
              setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = currentDraft.length;
              }, 0);
            } else {
              setHistoryIndex(newIndex);
              setInput(history[newIndex]);
              // Set cursor to beginning when moving forward in history
              setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = 0;
              }, 0);
            }
          }
        } else if (positionInLine < lines[currentLine].length) {
          // Move to end of last line
          e.preventDefault();
          textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
        }
      }
      // Otherwise let default behavior handle moving between lines
    }
    
    // Auto-complete and mode switching
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        // Toggle between execute and plan mode (but not if in remember mode)
        if (!isRememberMode) {
          const newMode = currentMode === 'plan' ? 'default' : 'plan';
          setCurrentMode(newMode);
          // No system message when switching modes - it's already shown in the mode badge
          // Always maintain focus on input when switching modes
          requestAnimationFrame(() => {
            if (inputRef.current) {
              inputRef.current.focus();
              // Restore cursor position to end
              const length = inputRef.current.value.length;
              inputRef.current.setSelectionRange(length, length);
            }
          });
        }
      } else if (input.startsWith('/')) {
        // Command auto-complete
        const commands = ['help', 'clear', 'stop', 'diff', 'agents', 'plan', 'context'];
        const partial = input.substring(1);
        const matches = commands.filter(c => c.startsWith(partial));
        if (matches.length === 1) {
          setInput('/' + matches[0]);
        } else if (matches.length > 1) {
          setAutoComplete(matches);
          setAutoCompleteIndex(0);
        }
      }
    }
    
    // Handle Enter key based on input mode
    if (e.key === 'Enter') {
      if (inputMode === 'single-line') {
        // Single-line mode: Enter submits
        if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          handleSubmit();
          // Ensure input stays enabled and focused
          requestAnimationFrame(() => {
            if (inputRef.current) {
              inputRef.current.disabled = false;
              inputRef.current.focus();
            }
          });
          return;
        }
        // Shift+Enter adds a newline in single-line mode
      } else {
        // Multi-line mode: Ctrl/Cmd+Enter submits
        if (isMac ? e.metaKey : e.ctrlKey) {
          e.preventDefault();
          handleSubmit();
          // Ensure input stays enabled and focused
          requestAnimationFrame(() => {
            if (inputRef.current) {
              inputRef.current.disabled = false;
              inputRef.current.focus();
            }
          });
          return;
        }
        // Enter alone adds a newline (default behavior)
      }
    }
    
    // Interrupt with Ctrl+C
    if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault();
      if (isStreaming) {
        setIsStreaming(false);
        addSystemMessage('Operation interrupted');
      }
    }
    
    // Clear with Ctrl+L
    if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setMessages([]);
    }
  };

  const handleTabChange = (tabId: string) => {
    setActiveTabId(tabId);
  };

  const handleTabClose = (tabId: string) => {
    // Don't allow closing the last tab
    const allTabs = getTabItems();
    if (allTabs.length <= 1) return;
    
    // Remove from dynamic tabs if it's there
    setDynamicTabs(prev => prev.filter(id => id !== tabId));
    
    // If we closed the active tab, select another one
    if (tabId === activeTabId) {
      const remainingTabs = allTabs.filter(t => t.id !== tabId);
      if (remainingTabs.length > 0) {
        setActiveTabId(remainingTabs[0].id);
      }
    }
  };

  const handleNewTab = () => {
    const newId = `chat-${Date.now()}`;
    setDynamicTabs(prev => [...prev, newId]);
    setActiveTabId(newId);
  };

  // Generate tab items with embedded content
  const getTabItems = (): TabItem[] => {
    // Map all dynamic tabs (including base tabs)
    const allTabs = dynamicTabs.map(tabId => {
      if (tabId === 'chat-1') {
        return { 
          id: 'chat-1', 
          label: 'Chat', 
          icon: <ChatIcon size={14} />, 
          closable: true,
          content: currentMode === 'plan' ? (
            // Show split view when in plan mode
            <div className={styles.splitContainer}>
              <div className={styles.leftPane}>
                {getChatContent()}
              </div>
              <div className={styles.rightPane}>
                {getPlanContent()}
              </div>
            </div>
          ) : getChatContent()
        };
      } else if (tabId === 'plan-1') {
        return {
          id: tabId,
          label: 'Plan',
          icon: <ListTaskIcon size={14} />,
          closable: true,
          content: getPlanContent()
        };
      } else if (tabId === 'context-1') {
        return {
          id: tabId,
          label: 'Context',
          icon: <ListTaskIcon size={14} />,
          closable: true,
          content: <ContextView />
        };
      } else if (tabId === 'agents-1') {
        return {
          id: tabId,
          label: 'Agents',
          icon: <UsersIcon size={14} />,
          closable: true,
          content: <AgentsView />
        };
      } else if (tabId.startsWith('diff-')) {
        return {
          id: tabId,
          label: 'Code Diff',
          icon: <CodeIcon size={14} />,
          closable: true,
          content: <DiffView />
        };
      } else if (tabId.startsWith('chat-')) {
        return {
          id: tabId,
          label: `Chat`,
          icon: <ChatIcon size={14} />,
          closable: true,
          content: getChatContent()
        };
      }
      return null;
    }).filter(Boolean) as TabItem[];

    return allTabs;
  };

  const getChatContent = () => (
    <div className={styles.chatContainer}>
      <MessageList 
        messages={messages}
        isStreaming={isStreaming}
        messagesEndRef={messagesEndRef}
      />
      <InputArea
        input={input}
        inputMode={inputMode}
        currentMode={currentMode}
        isRememberMode={isRememberMode}
        autoComplete={autoComplete}
        autoCompleteIndex={autoCompleteIndex}
        isMac={isMac}
        inputRef={inputRef}
        onInputChange={setInput}
        onKeyDown={handleKeyDown}
      />
    </div>
  );

  const getPlanContent = () => (
    <PlanEditor
      planContent={planContent}
      onPlanContentChange={setPlanContent}
    />
  );


  return (
    <div className={styles.terminal}>
      <div className={styles.body}>
        <ChatNavigation
          chats={chats}
          activeChatId={activeChatId}
          showChatNav={showChatNav}
          chatFilter={chatFilter}
          isEditMode={isEditMode}
          newChatIds={newChatIds}
          hasInitialized={hasInitialized}
          onChatSelect={handleChatSelect}
          onNewChat={handleNewChat}
          onDeleteChat={handleDeleteChat}
          onToggleNav={setShowChatNav}
          onFilterChange={setChatFilter}
          onEditModeToggle={setIsEditMode}
          onChatReorder={handleChatReorder}
        />
        <div className={styles.mainContent}>
          <ChatHeader
            chat={activeChat}
            showChatNav={showChatNav}
            onToggleNav={setShowChatNav}
          />
          <Tabs
            tabs={getTabItems()}
            activeTabId={activeTabId}
            onTabChange={handleTabChange}
            onTabClose={handleTabClose}
            toolbar={
              <Button
                variant="inline"
                shape="square"
                size="small"
                onClick={handleNewTab}
                aria-label="New tab"
              >
                <AddIcon />
              </Button>
            }
            contentClassName={styles.tabContent}
            size="medium"
          />
        </div>
      </div>
    </div>
  );
};