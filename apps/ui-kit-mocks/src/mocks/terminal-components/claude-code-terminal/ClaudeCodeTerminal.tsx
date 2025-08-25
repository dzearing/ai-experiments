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
      subtitle: 'Running migration scripts',
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
      subtitle: 'Analyzing bundle size',
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
  const [showChatNav, setShowChatNav] = useState(true);
  const [chatFilter, setChatFilter] = useState<'all' | 'idle' | 'busy'>('all');
  const [autoComplete, setAutoComplete] = useState<string[]>([]);
  const [autoCompleteIndex, setAutoCompleteIndex] = useState(0);
  const [currentMode, setCurrentMode] = useState<'default' | 'plan'>('default');
  const [isRememberMode, setIsRememberMode] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount and set initial height
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
    }
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
    }
  }, [activeChatId, chats]);
  
  // Detect remember mode
  useEffect(() => {
    setIsRememberMode(input.startsWith('#'));
  }, [input]);

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
    setAutoComplete([]);
  }, [input, onPrompt]);

  const handleCommand = (command: string) => {
    const parts = command.split(' ');
    const cmd = parts[0].substring(1); // Remove the '/'
    const args = parts.slice(1).join(' ');

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
    
    setChats(prev => [
      ...prev.map(c => ({ ...c, isActive: false })),
      newChat
    ]);
    setActiveChatId(newChat.id);
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

    // History navigation
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = Math.min(history.length - 1, historyIndex + 1);
        if (newIndex === history.length - 1) {
          setHistoryIndex(-1);
          setInput('');
        } else {
          setHistoryIndex(newIndex);
          setInput(history[newIndex]);
        }
      }
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
              <Button 
                variant="neutral" 
                size="small"
                onClick={handleNewChat}
                aria-label="New chat"
              >
                <ChevronRightIcon /> New
              </Button>
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
                <Spinner size="tiny" /> Busy
              </Button>
            </div>
            <div className={styles.chatList}>
              {chats
                .filter(chat => {
                  if (chatFilter === 'idle') return !chat.isBusy;
                  if (chatFilter === 'busy') return chat.isBusy;
                  return true;
                })
                .map(chat => (
                  <div 
                    key={chat.id}
                    className={`${styles.chatItem} ${chat.isActive ? styles.chatItemActive : ''}`}
                    onClick={() => handleChatSelect(chat.id)}
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
                      <div className={styles.chatItemSubtitle}>{chat.subtitle}</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
        <div className={styles.mainContent}>
          {!showChatNav && (
            <div className={styles.collapsedNav}>
              <Button
                variant="inline"
                shape="square"
                size="small"
                onClick={() => setShowChatNav(true)}
                aria-label="Expand chat navigation"
                className={styles.expandButton}
              >
                <ChevronRightIcon />
              </Button>
            </div>
          )}
          <div className={styles.chatHeader}>
            <h2 className={styles.chatTitle}>{activeChat.title}</h2>
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
                disabled={isStreaming}
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