import type { Meta, StoryObj } from '@storybook/react';
import { useState, useRef, useEffect } from 'react';
import {
  Avatar,
  Button,
  Divider,
  Heading,
  IconButton,
  Panel,
  Skeleton,
  Stack,
  Text,
  Textarea,
  Tooltip,
} from '../index';

/**
 * # AI Chat Interface
 *
 * A ChatGPT/Claude-style conversational AI interface demonstrating
 * how components work together for chat experiences.
 *
 * ## Components Used
 * - **Avatar**: User and AI profile pictures
 * - **Panel**: Message containers and sidebar
 * - **Stack**: Layout for messages and controls
 * - **Textarea**: Message input with auto-resize
 * - **Button**: Send action, new chat
 * - **IconButton**: Sidebar toggle, copy, regenerate actions
 * - **Skeleton**: Loading state for AI responses
 * - **Tooltip**: Action button hints
 * - **Text**: Message content and metadata
 */

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
}

function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m an AI assistant. How can I help you today?',
      timestamp: new Date(Date.now() - 60000),
    },
    {
      id: '2',
      role: 'user',
      content: 'Can you explain what React hooks are?',
      timestamp: new Date(Date.now() - 50000),
    },
    {
      id: '3',
      role: 'assistant',
      content: `React Hooks are functions that let you "hook into" React state and lifecycle features from function components. They were introduced in React 16.8 and allow you to use state and other React features without writing a class.

Here are the most commonly used hooks:

**useState** - Lets you add state to functional components
\`\`\`jsx
const [count, setCount] = useState(0);
\`\`\`

**useEffect** - Lets you perform side effects in function components
\`\`\`jsx
useEffect(() => {
  document.title = \`Count: \${count}\`;
}, [count]);
\`\`\`

**useContext** - Lets you subscribe to React context without nesting
\`\`\`jsx
const theme = useContext(ThemeContext);
\`\`\`

Would you like me to explain any of these in more detail?`,
      timestamp: new Date(Date.now() - 40000),
    },
  ]);

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversations: Conversation[] = [
    { id: '1', title: 'React Hooks Explanation', lastMessage: 'Would you like me to explain...', timestamp: new Date() },
    { id: '2', title: 'TypeScript Generics', lastMessage: 'Generics provide a way to...', timestamp: new Date(Date.now() - 3600000) },
    { id: '3', title: 'CSS Grid Layout', lastMessage: 'CSS Grid is a powerful...', timestamp: new Date(Date.now() - 86400000) },
    { id: '4', title: 'Node.js Best Practices', lastMessage: 'Here are some best practices...', timestamp: new Date(Date.now() - 172800000) },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'This is a simulated AI response. In a real application, this would be the response from your AI model.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      {sidebarOpen && (
        <div
          style={{
            width: 280,
            borderRight: '1px solid var(--page-border)',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--page-bg)',
          }}
        >
          <div style={{ padding: 'var(--space-4)' }}>
            <Button variant="primary" style={{ width: '100%' }}>
              + New Chat
            </Button>
          </div>

          <Divider />

          <div style={{ flex: 1, overflow: 'auto', padding: 'var(--space-2)' }}>
            <Text size="xs" color="softer" style={{ padding: 'var(--space-2)' }}>
              Today
            </Text>
            {conversations.slice(0, 2).map((conv) => (
              <div
                key={conv.id}
                style={{
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  background: conv.id === '1' ? 'var(--control-bg-hover)' : 'transparent',
                }}
              >
                <Text size="sm" weight="medium" style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {conv.title}
                </Text>
              </div>
            ))}

            <Text size="xs" color="softer" style={{ padding: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              Previous 7 Days
            </Text>
            {conversations.slice(2).map((conv) => (
              <div
                key={conv.id}
                style={{
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                }}
              >
                <Text size="sm" weight="medium" style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {conv.title}
                </Text>
              </div>
            ))}
          </div>

          <Divider />

          <div style={{ padding: 'var(--space-3)' }}>
            <Stack direction="row" align="center" gap="sm">
              <Avatar size="sm" fallback="JD" />
              <Text size="sm" weight="medium">John Doe</Text>
            </Stack>
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            borderBottom: '1px solid var(--page-border)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
          }}
        >
          <Tooltip content={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}>
            <IconButton
              variant="ghost"
              size="sm"
              icon={<span style={{ fontSize: 18 }}>{sidebarOpen ? '◀' : '▶'}</span>}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar"
            />
          </Tooltip>
          <Heading level={4} style={{ margin: 0 }}>React Hooks Explanation</Heading>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: 'var(--space-4)',
          }}
        >
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  marginBottom: 'var(--space-6)',
                }}
              >
                <Stack direction="row" gap="md" align="start">
                  <Avatar
                    size="sm"
                    fallback={message.role === 'user' ? 'JD' : 'AI'}
                    style={{
                      background: message.role === 'assistant' ? 'var(--controlPrimary-bg)' : undefined,
                      color: message.role === 'assistant' ? 'var(--controlPrimary-text)' : undefined,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" align="center" gap="sm" style={{ marginBottom: 'var(--space-1)' }}>
                      <Text size="sm" weight="semibold">
                        {message.role === 'user' ? 'You' : 'Assistant'}
                      </Text>
                      <Text size="xs" color="softer">
                        {formatTime(message.timestamp)}
                      </Text>
                    </Stack>
                    <div
                      style={{
                        whiteSpace: 'pre-wrap',
                        lineHeight: 'var(--leading-normal)',
                      }}
                    >
                      <Text>{message.content}</Text>
                    </div>
                    {message.role === 'assistant' && (
                      <Stack direction="row" gap="xs" style={{ marginTop: 'var(--space-2)' }}>
                        <Tooltip content="Copy">
                          <IconButton
                            variant="ghost"
                            size="sm"
                            icon={<span style={{ fontSize: 14 }}>📋</span>}
                            aria-label="Copy message"
                          />
                        </Tooltip>
                        <Tooltip content="Regenerate">
                          <IconButton
                            variant="ghost"
                            size="sm"
                            icon={<span style={{ fontSize: 14 }}>🔄</span>}
                            aria-label="Regenerate response"
                          />
                        </Tooltip>
                        <Tooltip content="Good response">
                          <IconButton
                            variant="ghost"
                            size="sm"
                            icon={<span style={{ fontSize: 14 }}>👍</span>}
                            aria-label="Good response"
                          />
                        </Tooltip>
                        <Tooltip content="Bad response">
                          <IconButton
                            variant="ghost"
                            size="sm"
                            icon={<span style={{ fontSize: 14 }}>👎</span>}
                            aria-label="Bad response"
                          />
                        </Tooltip>
                      </Stack>
                    )}
                  </div>
                </Stack>
              </div>
            ))}

            {/* Loading State */}
            {isLoading && (
              <div style={{ marginBottom: 'var(--space-6)' }}>
                <Stack direction="row" gap="md" align="start">
                  <Avatar
                    size="sm"
                    fallback="AI"
                    style={{
                      background: 'var(--controlPrimary-bg)',
                      color: 'var(--controlPrimary-text)',
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <Stack direction="row" align="center" gap="sm" style={{ marginBottom: 'var(--space-2)' }}>
                      <Text size="sm" weight="semibold">Assistant</Text>
                    </Stack>
                    <Stack gap="sm">
                      <Skeleton width="100%" height={16} />
                      <Skeleton width="85%" height={16} />
                      <Skeleton width="70%" height={16} />
                    </Stack>
                  </div>
                </Stack>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div
          style={{
            padding: 'var(--space-4)',
            borderTop: '1px solid var(--page-border)',
            background: 'var(--page-bg)',
          }}
        >
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <Panel padding="sm" style={{ padding: 'var(--space-3)' }}>
              <Stack direction="row" gap="sm" align="end">
                <div style={{ flex: 1 }}>
                  <Textarea
                    placeholder="Message Assistant..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    style={{
                      resize: 'none',
                      border: 'none',
                      background: 'transparent',
                      minHeight: 24,
                      maxHeight: 200,
                    }}
                  />
                </div>
                <Button
                  variant="primary"
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isLoading}
                >
                  Send
                </Button>
              </Stack>
            </Panel>
            <Text size="xs" color="softer" style={{ marginTop: 'var(--space-2)', textAlign: 'center' }}>
              AI can make mistakes. Consider checking important information.
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
}

const meta: Meta = {
  title: 'Example Pages/AI Chat',
  component: AIChatPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
## Building an AI Chat Interface

This example demonstrates how to build a ChatGPT/Claude-style chat interface using ui-kit components.

### Key Patterns

#### Message Layout
- Use **Stack** with \`direction="row"\` for avatar + content layout
- Use **Avatar** to distinguish between user and AI messages
- Style AI avatars differently (e.g., primary color background)

#### Conversation Sidebar
- Use a simple list with hover states for conversation history
- Group conversations by time (Today, Previous 7 Days)
- Truncate long titles with \`text-overflow: ellipsis\`

#### Input Area
- Use **Textarea** with dynamic height for multi-line input
- Handle Enter to send (Shift+Enter for new line)
- Use **Panel** to create a contained input area
- Disable send button when input is empty or loading

#### Loading States
- Use **Skeleton** components to indicate AI is typing
- Show 2-3 skeleton lines of varying widths for natural look

#### Message Actions
- Use **IconButton** with \`variant="ghost"\` for subtle actions
- Wrap in **Tooltip** for accessibility
- Common actions: Copy, Regenerate, Thumbs up/down

### Components Used

| Component | Purpose |
|-----------|---------|
| Avatar | User and AI profile pictures |
| Panel | Message containers, input area |
| Stack | Layout for messages and controls |
| Textarea | Message input |
| Button | Send action, new chat |
| IconButton | Toggle sidebar, message actions |
| Skeleton | Loading state for AI responses |
| Tooltip | Action button hints |
| Text | Message content, metadata |
| Heading | Chat title |
| Divider | Section separators |
        `,
      },
    },
  },
};

export default meta;

type Story = StoryObj;

export const Default: Story = {};
