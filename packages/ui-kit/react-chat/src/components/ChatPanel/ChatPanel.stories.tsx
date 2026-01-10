import type { Meta, StoryObj } from '@storybook/react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatPanel, type ChatPanelMessage } from './ChatPanel';
import type { ChatMessagePart } from '../ChatMessage';

const meta: Meta<typeof ChatPanel> = {
  title: 'React Chat/ChatPanel',
  component: ChatPanel,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
A unified chat rendering component that displays a list of messages with auto-scroll, loading indicators, and typing indicators.

## Features

| Feature | Description |
|---------|-------------|
| **Message list** | Renders messages with consecutive grouping |
| **Auto-scroll** | Scrolls to bottom on new messages |
| **Empty state** | Customizable placeholder when no messages |
| **Loading indicator** | Shows when AI is thinking |
| **Typing indicators** | Shows who is typing in group chat |
| **Menu actions** | Optional per-message action menus |

## Usage

\`\`\`tsx
import { ChatPanel } from '@ui-kit/react-chat';

<ChatPanel
  messages={messages}
  emptyState={<p>No messages yet</p>}
  isLoading={isThinking}
  onMessageMenuSelect={(action, id) => handleAction(action, id)}
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    messages: {
      description: 'Array of messages to display',
    },
    emptyState: {
      description: 'Content shown when no messages',
    },
    isLoading: {
      control: 'boolean',
      description: 'Whether AI is thinking',
    },
    loadingText: {
      control: 'text',
      description: 'Text shown during loading',
    },
    autoScroll: {
      control: 'boolean',
      description: 'Auto-scroll to bottom on new messages',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ChatPanel>;

// Helper to generate timestamps
const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60 * 1000);

// Sample messages for basic stories
const sampleMessages: ChatPanelMessage[] = [
  {
    id: '1',
    content: 'Hello! How can I help you today?',
    timestamp: minutesAgo(10),
    senderName: 'Assistant',
    senderColor: '#6366f1',
  },
  {
    id: '2',
    content: 'I need help with my project.',
    timestamp: minutesAgo(9),
    senderName: 'You',
    senderColor: '#10b981',
    isOwn: true,
  },
  {
    id: '3',
    content: "Of course! I'd be happy to help. What kind of project are you working on?",
    timestamp: minutesAgo(8),
    senderName: 'Assistant',
    senderColor: '#6366f1',
  },
];

export const Default: Story = {
  args: {
    messages: sampleMessages,
  },
  decorators: [
    (Story) => (
      <div style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
        <Story />
      </div>
    ),
  ],
};

export const EmptyState: Story = {
  args: {
    messages: [],
    emptyState: (
      <div style={{ textAlign: 'center', color: 'var(--color-body-textSoft20)' }}>
        <p style={{ fontSize: '24px', marginBottom: '8px' }}>No messages yet</p>
        <p>Start a conversation to see messages here.</p>
      </div>
    ),
  },
  decorators: [
    (Story) => (
      <div style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
        <Story />
      </div>
    ),
  ],
};

export const Loading: Story = {
  args: {
    messages: sampleMessages,
    isLoading: true,
    loadingText: 'Thinking...',
  },
  decorators: [
    (Story) => (
      <div style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
        <Story />
      </div>
    ),
  ],
};

export const TypingIndicator: Story = {
  args: {
    messages: sampleMessages,
    typingUsers: ['Alice'],
  },
  decorators: [
    (Story) => (
      <div style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
        <Story />
      </div>
    ),
  ],
};

export const MultipleTyping: Story = {
  args: {
    messages: sampleMessages,
    typingUsers: ['Alice', 'Bob', 'Charlie'],
  },
  decorators: [
    (Story) => (
      <div style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
        <Story />
      </div>
    ),
  ],
};

// Generate many messages for stress testing
function generateStressMessages(count: number): ChatPanelMessage[] {
  const messages: ChatPanelMessage[] = [];
  const senders = [
    { name: 'Assistant', color: '#6366f1', isOwn: false },
    { name: 'You', color: '#10b981', isOwn: true },
  ];

  const contentVariants = [
    'Short message.',
    'This is a medium-length message that contains a bit more text to display.',
    `This is a longer message with multiple paragraphs.

It includes line breaks and more content to test variable heights.

And even a third paragraph for good measure.`,
    `Here's a message with **markdown** formatting:

- Bullet point one
- Bullet point two
- Bullet point three

And some \`inline code\` as well.`,
    `\`\`\`typescript
function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Calculate first 10 fibonacci numbers
const results = Array.from({ length: 10 }, (_, i) => fibonacci(i));
console.log(results);
\`\`\``,
  ];

  for (let i = 0; i < count; i++) {
    const sender = senders[i % 2];
    const content = contentVariants[i % contentVariants.length];

    messages.push({
      id: `stress-${i}`,
      content,
      timestamp: minutesAgo(count - i),
      senderName: sender.name,
      senderColor: sender.color,
      isOwn: sender.isOwn,
    });
  }

  return messages;
}

export const StressTest50Messages: Story = {
  args: {
    messages: generateStressMessages(50),
  },
  decorators: [
    (Story) => (
      <div style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Stress test with 50 messages of varying heights including code blocks and markdown.',
      },
    },
  },
};

export const StressTest200Messages: Story = {
  args: {
    messages: generateStressMessages(200),
  },
  decorators: [
    (Story) => (
      <div style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Stress test with 200 messages. Scroll performance may degrade without virtualization.',
      },
    },
  },
};

export const StressTest500Messages: Story = {
  args: {
    messages: generateStressMessages(500),
  },
  decorators: [
    (Story) => (
      <div style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Extreme stress test with 500 messages. This will likely cause noticeable lag without virtualization.',
      },
    },
  },
};

// Dynamic streaming story
function StreamingDemo() {
  const [messages, setMessages] = useState<ChatPanelMessage[]>([
    {
      id: '1',
      content: 'Can you explain how React hooks work?',
      timestamp: minutesAgo(1),
      senderName: 'You',
      senderColor: '#10b981',
      isOwn: true,
    },
  ]);

  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const fullResponse = `React hooks are functions that let you "hook into" React state and lifecycle features from function components.

## Common Hooks

### useState
Manages local state in a functional component:
\`\`\`tsx
const [count, setCount] = useState(0);
\`\`\`

### useEffect
Performs side effects in function components:
\`\`\`tsx
useEffect(() => {
  document.title = \`Count: \${count}\`;
}, [count]);
\`\`\`

### useCallback
Memoizes callback functions:
\`\`\`tsx
const handleClick = useCallback(() => {
  console.log('clicked');
}, []);
\`\`\`

Hooks enable cleaner, more reusable component logic without classes.`;

  const startStreaming = useCallback(() => {
    setIsStreaming(true);
    setStreamingContent('');

    let index = 0;
    const interval = setInterval(() => {
      if (index < fullResponse.length) {
        const chunkSize = Math.floor(Math.random() * 5) + 1;
        setStreamingContent((prev) => prev + fullResponse.slice(index, index + chunkSize));
        index += chunkSize;
      } else {
        clearInterval(interval);
        setIsStreaming(false);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [fullResponse]);

  useEffect(() => {
    const timer = setTimeout(startStreaming, 1000);

    return () => clearTimeout(timer);
  }, [startStreaming]);

  const displayMessages: ChatPanelMessage[] = [
    ...messages,
    ...(streamingContent || isStreaming
      ? [
          {
            id: 'streaming',
            content: streamingContent,
            timestamp: new Date(),
            senderName: 'Assistant',
            senderColor: '#6366f1',
            isStreaming,
          },
        ]
      : []),
  ];

  return (
    <div style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
      <ChatPanel messages={displayMessages} isLoading={!streamingContent && isStreaming} loadingText="Thinking..." />
      <div style={{ padding: '16px', borderTop: '1px solid var(--color-divider)' }}>
        <button
          onClick={() => {
            setMessages((prev) => [
              ...prev,
              {
                id: `q-${Date.now()}`,
                content: 'Can you tell me more?',
                timestamp: new Date(),
                senderName: 'You',
                senderColor: '#10b981',
                isOwn: true,
              },
            ]);
            startStreaming();
          }}
          style={{
            padding: '8px 16px',
            background: 'var(--color-buttonPrimary-background)',
            color: 'var(--color-buttonPrimary-text)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Send Another Message
        </button>
      </div>
    </div>
  );
}

export const StreamingMessage: Story = {
  render: () => <StreamingDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates streaming message content that grows over time. Tests dynamic height changes.',
      },
    },
  },
};

// Dynamic message addition story
function DynamicMessagesDemo() {
  const [messages, setMessages] = useState<ChatPanelMessage[]>([]);
  const [autoAdd, setAutoAdd] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addMessage = useCallback(() => {
    const isOwn = Math.random() > 0.5;
    const contentOptions = [
      'Quick message!',
      'This is a slightly longer message with more content.',
      `Multi-line message:

- Point 1
- Point 2
- Point 3`,
      `\`\`\`js
const x = 42;
console.log(x);
\`\`\``,
    ];

    setMessages((prev) => [
      ...prev,
      {
        id: `dynamic-${Date.now()}-${Math.random()}`,
        content: contentOptions[Math.floor(Math.random() * contentOptions.length)],
        timestamp: new Date(),
        senderName: isOwn ? 'You' : 'Assistant',
        senderColor: isOwn ? '#10b981' : '#6366f1',
        isOwn,
      },
    ]);
  }, []);

  useEffect(() => {
    if (autoAdd) {
      intervalRef.current = setInterval(addMessage, 500);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoAdd, addMessage]);

  return (
    <div style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid var(--color-divider)',
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
        }}
      >
        <button
          onClick={addMessage}
          style={{
            padding: '8px 16px',
            background: 'var(--color-buttonPrimary-background)',
            color: 'var(--color-buttonPrimary-text)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Add Message
        </button>
        <button
          onClick={() => setAutoAdd(!autoAdd)}
          style={{
            padding: '8px 16px',
            background: autoAdd ? '#ef4444' : 'var(--color-buttonSecondary-background)',
            color: autoAdd ? 'white' : 'var(--color-buttonSecondary-text)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          {autoAdd ? 'Stop Auto-Add' : 'Start Auto-Add (2/sec)'}
        </button>
        <button
          onClick={() => setMessages([])}
          style={{
            padding: '8px 16px',
            background: 'var(--color-buttonSecondary-background)',
            color: 'var(--color-buttonSecondary-text)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Clear All
        </button>
        <span style={{ color: 'var(--color-body-textSoft10)' }}>Messages: {messages.length}</span>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ChatPanel messages={messages} emptyState={<p>Click "Add Message" to start</p>} />
      </div>
    </div>
  );
}

export const DynamicMessages: Story = {
  render: () => <DynamicMessagesDemo />,
  parameters: {
    docs: {
      description: {
        story:
          'Interactive demo for adding messages dynamically. Use "Start Auto-Add" to stress test with rapid message additions.',
      },
    },
  },
};

// Tool calls stress test
function generateToolCallMessages(count: number): ChatPanelMessage[] {
  const messages: ChatPanelMessage[] = [];

  const toolCallSets: ChatMessagePart[][] = [
    [
      { type: 'text', content: 'Let me search for that information.' },
      {
        type: 'tool',
        tool: { name: 'search_web', input: { query: 'React hooks tutorial' }, output: 'Found 15 results...' },
      },
      { type: 'text', content: 'I found some relevant results.' },
    ],
    [
      { type: 'text', content: 'I will read the file and analyze it.' },
      {
        type: 'tool',
        tool: {
          name: 'read_file',
          input: { path: '/src/components/App.tsx' },
          output: `import React from 'react';
import { Router } from './Router';

export function App() {
  return <Router />;
}`,
        },
      },
      { type: 'text', content: 'The file contains a simple App component.' },
    ],
    [
      {
        type: 'tool',
        tool: { name: 'list_directory', input: { path: '/src' }, output: 'components/\nutils/\nindex.ts' },
      },
      {
        type: 'tool',
        tool: { name: 'read_file', input: { path: '/src/index.ts' }, output: "export * from './App';" },
      },
      { type: 'text', content: 'I have analyzed the directory structure.' },
    ],
  ];

  for (let i = 0; i < count; i++) {
    const isAssistant = i % 2 === 1;

    if (isAssistant) {
      messages.push({
        id: `tool-${i}`,
        content: '',
        parts: toolCallSets[i % toolCallSets.length],
        timestamp: minutesAgo(count - i),
        senderName: 'Assistant',
        senderColor: '#6366f1',
      });
    } else {
      messages.push({
        id: `tool-${i}`,
        content: `User question ${Math.floor(i / 2) + 1}: Can you help me with this task?`,
        timestamp: minutesAgo(count - i),
        senderName: 'You',
        senderColor: '#10b981',
        isOwn: true,
      });
    }
  }

  return messages;
}

export const ToolCallsStressTest: Story = {
  args: {
    messages: generateToolCallMessages(50),
  },
  decorators: [
    (Story) => (
      <div style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Stress test with messages containing multiple tool calls. Tests rendering of expandable tool outputs.',
      },
    },
  },
};

// Scroll behavior test
function ScrollBehaviorDemo() {
  const [messages, setMessages] = useState<ChatPanelMessage[]>(generateStressMessages(30));
  const [autoScroll, setAutoScroll] = useState(true);

  const addMessage = useCallback(() => {
    setMessages((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        content: `New message added at ${new Date().toLocaleTimeString()}`,
        timestamp: new Date(),
        senderName: 'Assistant',
        senderColor: '#6366f1',
      },
    ]);
  }, []);

  useEffect(() => {
    const interval = setInterval(addMessage, 2000);

    return () => clearInterval(interval);
  }, [addMessage]);

  return (
    <div style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid var(--color-divider)',
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
        }}
      >
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input type="checkbox" checked={autoScroll} onChange={(e) => setAutoScroll(e.target.checked)} />
          Auto-scroll enabled
        </label>
        <span style={{ color: 'var(--color-body-textSoft10)' }}>
          Messages: {messages.length} (new message every 2s)
        </span>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ChatPanel messages={messages} autoScroll={autoScroll} />
      </div>
      <div style={{ padding: '16px', borderTop: '1px solid var(--color-divider)', fontSize: '14px' }}>
        <strong>Test scroll behavior:</strong>
        <ol style={{ margin: '8px 0', paddingLeft: '20px' }}>
          <li>With auto-scroll ON, new messages should scroll into view</li>
          <li>Scroll up manually to read history</li>
          <li>Notice: currently auto-scroll forces you back to bottom (this is the problem to fix)</li>
          <li>Toggle auto-scroll OFF to stay at your scroll position</li>
        </ol>
      </div>
    </div>
  );
}

export const ScrollBehaviorTest: Story = {
  render: () => <ScrollBehaviorDemo />,
  parameters: {
    docs: {
      description: {
        story:
          'Tests auto-scroll behavior with continuous message additions. Demonstrates the current limitation where users cannot read history while new messages arrive.',
      },
    },
  },
};

// Very long messages test
function generateLongMessages(): ChatPanelMessage[] {
  const loremParagraph = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.`;

  return [
    {
      id: 'long-1',
      content: 'Short question to start.',
      timestamp: minutesAgo(10),
      senderName: 'You',
      senderColor: '#10b981',
      isOwn: true,
    },
    {
      id: 'long-2',
      content: Array(10).fill(loremParagraph).join('\n\n'),
      timestamp: minutesAgo(9),
      senderName: 'Assistant',
      senderColor: '#6366f1',
    },
    {
      id: 'long-3',
      content: 'Another short message.',
      timestamp: minutesAgo(8),
      senderName: 'You',
      senderColor: '#10b981',
      isOwn: true,
    },
    {
      id: 'long-4',
      content: `Here's a very long code example:

\`\`\`typescript
${Array(50)
  .fill(null)
  .map((_, i) => `const variable${i} = ${i * 2}; // Line ${i + 1}`)
  .join('\n')}
\`\`\`

That's a lot of code!`,
      timestamp: minutesAgo(7),
      senderName: 'Assistant',
      senderColor: '#6366f1',
    },
    {
      id: 'long-5',
      content: Array(5).fill(loremParagraph).join('\n\n'),
      timestamp: minutesAgo(6),
      senderName: 'You',
      senderColor: '#10b981',
      isOwn: true,
    },
  ];
}

export const LongMessagesTest: Story = {
  args: {
    messages: generateLongMessages(),
  },
  decorators: [
    (Story) => (
      <div style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Tests rendering of very long messages with large text blocks and extensive code examples.',
      },
    },
  },
};

// Mixed content stress test
function generateMixedContent(count: number): ChatPanelMessage[] {
  const messages: ChatPanelMessage[] = [];

  for (let i = 0; i < count; i++) {
    const isOwn = i % 3 === 0;
    const hasToolCalls = !isOwn && i % 4 === 1;
    const isStreaming = !isOwn && i === count - 1;

    let content = '';
    let parts: ChatMessagePart[] | undefined;

    if (hasToolCalls) {
      parts = [
        { type: 'text', content: 'Processing your request...' },
        {
          type: 'tool',
          tool: {
            name: 'analyze',
            input: { data: `item-${i}` },
            output: `Analysis complete for item ${i}`,
            startTime: Date.now() - 5000,
            endTime: Date.now(),
          },
        },
        { type: 'text', content: 'Here are the results.' },
      ];
    } else if (i % 5 === 0) {
      content = `\`\`\`typescript
// Code block ${i}
interface Item${i} {
  id: number;
  name: string;
  value: ${i};
}
\`\`\``;
    } else if (i % 7 === 0) {
      content = `Message ${i} with a **bold** statement and some *italic* text.

> This is a quoted section
> With multiple lines

And a list:
- Item A
- Item B
- Item C`;
    } else {
      content = `Message ${i}: ${isOwn ? 'User message content here.' : 'Assistant response with helpful information.'}`;
    }

    messages.push({
      id: `mixed-${i}`,
      content,
      parts,
      timestamp: minutesAgo(count - i),
      senderName: isOwn ? 'You' : 'Assistant',
      senderColor: isOwn ? '#10b981' : '#6366f1',
      isOwn,
      isStreaming,
    });
  }

  return messages;
}

export const MixedContentStressTest: Story = {
  args: {
    messages: generateMixedContent(100),
    isLoading: false,
  },
  decorators: [
    (Story) => (
      <div style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Comprehensive stress test with 100 messages containing a mix of plain text, markdown, code blocks, and tool calls.',
      },
    },
  },
};

// Performance profiling story
function PerformanceProfileDemo() {
  const [messageCount, setMessageCount] = useState(50);
  const [messages, setMessages] = useState<ChatPanelMessage[]>(() => generateStressMessages(50));
  const [renderTime, setRenderTime] = useState<number | null>(null);

  const regenerate = useCallback(() => {
    const start = performance.now();
    setMessages(generateStressMessages(messageCount));
    requestAnimationFrame(() => {
      setRenderTime(performance.now() - start);
    });
  }, [messageCount]);

  return (
    <div style={{ height: '700px', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid var(--color-divider)',
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          Message count:
          <input
            type="number"
            value={messageCount}
            onChange={(e) => setMessageCount(Number(e.target.value))}
            min={10}
            max={1000}
            step={10}
            style={{ width: '80px', padding: '4px 8px' }}
          />
        </label>
        <button
          onClick={regenerate}
          style={{
            padding: '8px 16px',
            background: 'var(--color-buttonPrimary-background)',
            color: 'var(--color-buttonPrimary-text)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Regenerate Messages
        </button>
        {renderTime !== null && (
          <span style={{ color: 'var(--color-body-textSoft10)' }}>Last render: {renderTime.toFixed(2)}ms</span>
        )}
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ChatPanel messages={messages} />
      </div>
      <div
        style={{
          padding: '16px',
          borderTop: '1px solid var(--color-divider)',
          fontSize: '14px',
          color: 'var(--color-body-textSoft10)',
        }}
      >
        <strong>Performance testing:</strong>
        <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
          <li>Adjust message count and click "Regenerate"</li>
          <li>Open DevTools Performance tab to profile scroll</li>
          <li>Try scrolling quickly through the list</li>
          <li>Watch for dropped frames or jank</li>
        </ul>
      </div>
    </div>
  );
}

export const PerformanceProfile: Story = {
  render: () => <PerformanceProfileDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Interactive performance profiling tool. Adjust message count and use DevTools to measure render times and scroll performance.',
      },
    },
  },
};
