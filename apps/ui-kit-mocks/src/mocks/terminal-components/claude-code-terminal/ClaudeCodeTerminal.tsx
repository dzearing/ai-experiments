import React, { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import styles from './ClaudeCodeTerminal.module.css';
import { Button, Spinner } from '@claude-flow/ui-kit-react';
import {
  ChevronRightIcon,
  ChevronLeftIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  PlayIcon,
  StopIcon,
  SettingsIcon,
  CheckCircleIcon,
  ErrorCircleIcon,
  InfoCircleIcon,
  ClockIcon,
  CodeIcon,
  FileIcon,
  FolderIcon,
  RefreshIcon,
  SaveIcon,
  CopyIcon,
  ExpandIcon,
  CollapseIcon,
  MenuIcon,
  CloseIcon,
  AddIcon,
} from '@claude-flow/ui-kit-icons';

export interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: Date;
  model?: string;
  toolName?: string;
  toolStatus?: 'executing' | 'completed' | 'failed';
  toolOutput?: string;
}

export interface Chat {
  id: string;
  title: string;
  subtitle: string;
  previousSubtitle?: string;
  subtitleInitialized?: boolean;
  isActive: boolean;
  isBusy: boolean;
  messages: Message[];
  lastActivity: Date;
  repoPath?: string;
  branch?: string;
}

export interface ClaudeCodeTerminalProps {
  onCommand?: (command: string) => void;
  onPrompt?: (prompt: string) => void;
}

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

    // Add command message
    const cmdMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: command,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, cmdMessage]);
    
    // Update chat messages
    setChats(prev => prev.map(chat => 
      chat.id === activeChatId 
        ? { ...chat, messages: [...chat.messages, cmdMessage], lastActivity: new Date() }
        : chat
    ));

    // Process command
    switch (cmd) {
      case 'help':
        addSystemMessage(`Available commands:
/clear - Clear the conversation
/stop - Stop current operation
/plan - Toggle plan mode
/help - Show this help message

Keyboard shortcuts:
↑/↓ - Navigate command history
Tab - Auto-complete commands
Shift+Tab - Toggle Plan/Execute mode
# - Enter remember mode
${isMac ? '⌘' : 'Ctrl'}+Enter - Submit prompt`);
        break;
        
      case 'plan':
        const newMode = currentMode === 'plan' ? 'default' : 'plan';
        setCurrentMode(newMode);
        addSystemMessage(`Switched to ${newMode === 'plan' ? 'Plan' : 'Execute'} mode`);
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
  
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
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
          addSystemMessage(`Switched to ${newMode === 'plan' ? 'Plan' : 'Execute'} mode`);
        }
      } else if (input.startsWith('/')) {
        // Command auto-complete
        const commands = ['help', 'clear', 'stop', 'plan'];
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
    
    // Submit on Ctrl+Enter (Windows) or Cmd+Enter (Mac)
    if (e.key === 'Enter' && (isMac ? e.metaKey : e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
      // Ensure input stays enabled and focused
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.disabled = false;
          inputRef.current.focus();
        }
      });
      return; // Exit early to prevent any other processing
    }
    // Enter key alone just adds a newline (default behavior)
    
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

  const renderMessage = (message: Message) => {
    const iconMap = {
      user: <ChevronRightIcon className={styles.messageIcon} />,
      assistant: '✨',
      system: <InfoCircleIcon className={styles.messageIcon} />,
      tool: message.toolStatus === 'completed' ? <CheckCircleIcon className={styles.messageIcon} /> :
            message.toolStatus === 'failed' ? <ErrorCircleIcon className={styles.messageIcon} /> :
            <Spinner size="small" />,
    };

    return (
      <div key={message.id} className={`${styles.message} ${styles[`message-${message.type}`]}`}>
        <div className={styles.messageHeader}>
          <span className={styles.messageIcon}>{iconMap[message.type]}</span>
          <span className={styles.messageType}>
            {message.type === 'tool' ? message.toolName : message.type}
          </span>
          <span className={styles.messageTime}>
            {message.timestamp.toLocaleTimeString()}
          </span>
        </div>
        <div className={styles.messageContent}>
          <pre>{message.content}</pre>
          {message.toolOutput && (
            <div className={styles.toolOutput}>
              <span className={styles.toolOutputLabel}>Output:</span> {message.toolOutput}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.terminal}>
      <div className={styles.body}>
        {showChatNav && (
          <div className={styles.chatNav}>
            <div className={styles.chatNavHeader}>
              <div className={styles.chatNavTitleRow}>
                <Button 
                  variant="inline"
                  shape="square"
                  size="small"
                  onClick={() => setShowChatNav(false)}
                  aria-label="Collapse chat navigation"
                  className={styles.collapseButton}
                >
                  <ChevronLeftIcon />
                </Button>
                <h3 className={styles.chatNavTitle}>Chats</h3>
              </div>
            </div>
            <div className={styles.chatNavFilters}>
              <Button
                variant={chatFilter === 'idle' ? 'primary' : 'neutral'}
                size="small"
                onClick={() => setChatFilter(chatFilter === 'idle' ? 'all' : 'idle')}
                aria-label="Filter idle chats"
              >
                <CheckCircleIcon className={styles.idleIcon} /> Idle
              </Button>
              <Button
                variant={chatFilter === 'busy' ? 'primary' : 'neutral'}
                size="small"
                onClick={() => setChatFilter(chatFilter === 'busy' ? 'all' : 'busy')}
                aria-label="Filter busy chats"
              >
                <Spinner size="small" /> Busy
              </Button>
            </div>
            <Button 
              variant="primary" 
              size="medium"
              onClick={handleNewChat}
              aria-label="New chat"
              className={styles.newChatButton}
            >
              <AddIcon /> New chat
            </Button>
            <div className={styles.chatList}>
              {chats
                .filter(chat => {
                  if (chatFilter === 'idle') return !chat.isBusy;
                  if (chatFilter === 'busy') return chat.isBusy;
                  return true;
                })
                .map((chat, index) => (
                  <div 
                    key={chat.id}
                    className={`${styles.chatItem} ${chat.isActive ? styles.chatItemActive : ''} ${hasInitialized && newChatIds.has(chat.id) ? styles.chatItemNew : ''}`}
                    onClick={() => handleChatSelect(chat.id)}
                    style={hasInitialized && newChatIds.has(chat.id) ? { animationDelay: `${index * 50}ms` } : undefined}
                  >
                    <div className={styles.chatItemIndicator}>
                      {chat.isBusy ? (
                        <Spinner size="small" />
                      ) : (
                        <CheckCircleIcon className={styles.idleIcon} />
                      )}
                    </div>
                    <div className={styles.chatItemContent}>
                      <div className={styles.chatItemTitle}>{chat.title}</div>
                      <div className={styles.chatItemSubtitleContainer}>
                        {chat.previousSubtitle && (
                          <div 
                            className={styles.chatItemSubtitle}
                            data-leaving="true"
                          >
                            {chat.previousSubtitle}
                          </div>
                        )}
                        <div 
                          key={chat.subtitle} 
                          className={styles.chatItemSubtitle}
                          data-animate={chat.previousSubtitle ? "true" : "false"}
                        >
                          {chat.subtitle}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
        <div className={styles.mainContent}>
          <div className={styles.chatHeader}>
            <div className={styles.chatHeaderLeft}>
              {!showChatNav && (
                <Button
                  variant="inline"
                  shape="square"
                  size="small"
                  onClick={() => setShowChatNav(true)}
                  aria-label="Expand chat navigation"
                  className={styles.expandHeaderButton}
                >
                  <ChevronRightIcon />
                </Button>
              )}
              <h2 className={styles.chatTitle}>{activeChat.title}</h2>
            </div>
            {(activeChat.repoPath || activeChat.branch) && (
              <div className={styles.chatRepoInfo}>
                {activeChat.repoPath && (
                  <div className={styles.repoName}>
                    <span className={styles.repoLabel}>Repo:</span> {activeChat.repoPath}
                  </div>
                )}
                {activeChat.branch && (
                  <div className={styles.branchName}>
                    <span className={styles.branchLabel}>Branch:</span> {activeChat.branch}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className={styles.messages}>
            {messages.map(renderMessage)}
            {isStreaming && (
              <div className={styles.streamingIndicator}>
                <Spinner size="small" />
                <span>Claude is thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {autoComplete.length > 0 && (
            <div className={styles.autoComplete}>
              {autoComplete.map((cmd, idx) => (
                <div 
                  key={cmd}
                  className={`${styles.autoCompleteItem} ${idx === autoCompleteIndex ? styles.selected : ''}`}
                >
                  /{cmd}
                </div>
              ))}
            </div>
          )}

          <div className={styles.inputArea}>
            <div className={styles.inputWrapper}>
              <span className={`${styles.modeBadge} ${
                isRememberMode ? styles.modeBadgeRemember : 
                currentMode === 'plan' ? styles.modeBadgePlan : 
                styles.modeBadgeExecute
              }`}>
                {isRememberMode ? 'Remember' : currentMode === 'plan' ? 'Plan' : 'Execute'}
              </span>
              <textarea
                ref={inputRef}
                className={`${styles.input} ${
                  isRememberMode ? styles.inputRemember : 
                  currentMode === 'plan' ? styles.inputPlan : 
                  styles.inputExecute
                }`}
                value={isRememberMode && input.startsWith('#') ? input.slice(1) : input}
                onChange={(e) => {
                  const newValue = e.target.value;
                  if (isRememberMode) {
                    // In remember mode, prepend # to the actual stored value
                    setInput('#' + newValue);
                  } else {
                    setInput(newValue);
                  }
                }}
                onKeyDown={handleKeyDown}
                placeholder="Type a prompt or /help for commands"
                disabled={false}
                aria-label="Terminal input"
                rows={1}
              />
            </div>
            <div className={styles.helperText}>
              Shift-Tab to change modes, {isMac ? '⌘' : 'Ctrl'}-Enter to submit
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};