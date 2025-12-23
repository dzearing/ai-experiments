import type { Meta, StoryObj } from '@storybook/react';
import { useState, useRef, useEffect } from 'react';
import {
  Avatar,
  Button,
  Divider,
  Heading,
  IconButton,
  Skeleton,
  Stack,
  Text,
  Tooltip,
} from '@ui-kit/react';
import { ChatInput, type ChatInputSubmitData } from '@ui-kit/react-chat';
import { MarkdownRenderer } from '@ui-kit/react-markdown';
import { CopyIcon } from '@ui-kit/icons/CopyIcon';
import { RefreshIcon } from '@ui-kit/icons/RefreshIcon';
import { ThumbsUpIcon } from '@ui-kit/icons/ThumbsUpIcon';
import { ThumbsDownIcon } from '@ui-kit/icons/ThumbsDownIcon';
import { ChevronLeftIcon } from '@ui-kit/icons/ChevronLeftIcon';
import { ChevronRightIcon } from '@ui-kit/icons/ChevronRightIcon';

/**
 * # AI Chat Interface
 *
 * A ChatGPT/Claude-style conversational AI interface demonstrating
 * how components work together for chat experiences.
 *
 * ## Components Used
 * - **ChatInput** (react-chat): Rich message input with markdown formatting
 * - **MarkdownRenderer** (react-markdown): Renders AI responses with code blocks
 * - **Avatar**: User and AI profile pictures
 * - **Panel**: Message containers and sidebar
 * - **Stack**: Layout for messages and controls
 * - **IconButton**: Sidebar toggle, copy, regenerate actions
 * - **Skeleton**: Loading state for AI responses
 * - **Tooltip**: Action button hints
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

  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversations: Conversation[] = [
    { id: '1', title: 'React Hooks Explanation', lastMessage: 'Would you like me to explain...', timestamp: new Date() },
    { id: '2', title: 'TypeScript Generics', lastMessage: 'Generics provide a way to...', timestamp: new Date(Date.now() - 3600000) },
    { id: '3', title: 'CSS Grid Layout', lastMessage: 'CSS Grid is a powerful...', timestamp: new Date(Date.now() - 86400000) },
    { id: '4', title: 'Node.js Best Practices', lastMessage: 'Here are some best practices...', timestamp: new Date(Date.now() - 172800000) },
  ];

  const isInitialMount = useRef(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Skip scrolling on initial mount to prevent unwanted scroll
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (data: ChatInputSubmitData) => {
    if (!data.content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: data.content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Simulate AI response with markdown content
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Great question! Here's a quick example demonstrating the concept:

\`\`\`typescript
function Example() {
  const [value, setValue] = useState('');

  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}
\`\`\`

**Key points:**
- State is managed locally in the component
- The \`setValue\` function triggers re-renders
- React automatically batches updates for performance

Would you like me to elaborate on any of these points?`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 2000);
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
            <Text size="xs" color="soft" style={{ padding: 'var(--space-2)' }}>
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

            <Text size="xs" color="soft" style={{ padding: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
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
            <Stack direction="horizontal" align="center" gap="sm">
              <Avatar size="sm" fallback="JD" color="#059669" />
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
              icon={sidebarOpen ? <ChevronLeftIcon style={{ width: 18, height: 18 }} /> : <ChevronRightIcon style={{ width: 18, height: 18 }} />}
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
                <Stack direction="horizontal" gap="md" align="start">
                  <Avatar
                    size="sm"
                    fallback={message.role === 'user' ? 'JD' : 'AI'}
                    color={message.role === 'assistant' ? '#7c3aed' : '#059669'}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="horizontal" align="center" gap="sm" style={{ marginBottom: 'var(--space-1)' }}>
                      <Text size="sm" weight="semibold">
                        {message.role === 'user' ? 'You' : 'Assistant'}
                      </Text>
                      <Text size="xs" color="soft">
                        {formatTime(message.timestamp)}
                      </Text>
                    </Stack>
                    {/* Use MarkdownRenderer for formatted content */}
                    <MarkdownRenderer content={message.content} />
                    {message.role === 'assistant' && (
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 'var(--space-1)',
                          marginTop: 'var(--space-2)',
                          padding: '2px',
                          borderRadius: 'var(--radius-full)',
                          border: '1px solid var(--control-border)',
                          background: 'var(--control-bg)',
                        }}
                      >
                        <Tooltip content="Copy">
                          <IconButton
                            variant="ghost"
                            size="sm"
                            icon={<CopyIcon style={{ width: 14, height: 14 }} />}
                            aria-label="Copy message"
                          />
                        </Tooltip>
                        <Tooltip content="Regenerate">
                          <IconButton
                            variant="ghost"
                            size="sm"
                            icon={<RefreshIcon style={{ width: 14, height: 14 }} />}
                            aria-label="Regenerate response"
                          />
                        </Tooltip>
                        <div style={{ width: 1, height: 16, background: 'var(--control-border)' }} />
                        <Tooltip content="Good response">
                          <IconButton
                            variant="ghost"
                            size="sm"
                            icon={<ThumbsUpIcon style={{ width: 14, height: 14 }} />}
                            aria-label="Good response"
                          />
                        </Tooltip>
                        <Tooltip content="Bad response">
                          <IconButton
                            variant="ghost"
                            size="sm"
                            icon={<ThumbsDownIcon style={{ width: 14, height: 14 }} />}
                            aria-label="Bad response"
                          />
                        </Tooltip>
                      </div>
                    )}
                  </div>
                </Stack>
              </div>
            ))}

            {/* Loading State */}
            {isLoading && (
              <div style={{ marginBottom: 'var(--space-6)' }}>
                <Stack direction="horizontal" gap="md" align="start">
                  <Avatar
                    size="sm"
                    fallback="AI"
                    color="#7c3aed"
                  />
                  <div style={{ flex: 1 }}>
                    <Stack direction="horizontal" align="center" gap="sm" style={{ marginBottom: 'var(--space-2)' }}>
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

        {/* Input Area - Using ChatInput from react-chat */}
        <div
          style={{
            padding: 'var(--space-4)',
            borderTop: '1px solid var(--page-border)',
            background: 'var(--page-bg)',
          }}
        >
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <ChatInput
              placeholder="Message Assistant..."
              onSubmit={handleSubmit}
              disabled={isLoading}
            />
            <Text size="xs" color="soft" style={{ marginTop: 'var(--space-2)', textAlign: 'center' }}>
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

### Key Components

#### ChatInput (from @ui-kit/react-chat)
The \`ChatInput\` component provides a rich text input experience:
- Auto-resizing textarea
- Markdown formatting toolbar (bold, italic, code, etc.)
- Image attachment support
- Submit on Enter (Shift+Enter for new line)
- Message history navigation

\`\`\`tsx
import { ChatInput } from '@ui-kit/react-chat';

<ChatInput
  placeholder="Message Assistant..."
  onSubmit={(data) => handleMessage(data.text)}
  showFormattingToolbar
/>
\`\`\`

#### MarkdownRenderer (from @ui-kit/react-markdown)
The \`MarkdownRenderer\` component renders AI responses:
- Syntax highlighted code blocks
- Proper heading hierarchy
- Lists, tables, blockquotes
- Link handling

\`\`\`tsx
import { MarkdownRenderer } from '@ui-kit/react-markdown';

<MarkdownRenderer content={message.content} />
\`\`\`

### Components Used

| Component | Package | Purpose |
|-----------|---------|---------|
| ChatInput | react-chat | Rich message input |
| MarkdownRenderer | react-markdown | Formatted AI responses |
| Avatar | react | User and AI profile pictures |
| Panel | react | Message containers |
| Stack | react | Layout for messages |
| IconButton | react | Message actions |
| Skeleton | react | Loading state |
| Tooltip | react | Action hints |
        `,
      },
    },
  },
};

export default meta;

type Story = StoryObj;

export const Default: Story = {};
