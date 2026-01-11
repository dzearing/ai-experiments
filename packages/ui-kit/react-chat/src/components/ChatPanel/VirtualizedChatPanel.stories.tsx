import type { Meta, StoryObj } from '@storybook/react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { VirtualizedChatPanel, type VirtualizedChatPanelMessage } from './VirtualizedChatPanel';
import { ChatPanel } from './ChatPanel';
import type { ChatMessagePart } from '../ChatMessage';

const meta: Meta<typeof VirtualizedChatPanel> = {
  title: 'React Chat/VirtualizedChatPanel',
  component: VirtualizedChatPanel,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
A performance-optimized chat panel that uses virtual scrolling to only render visible messages.

## When to Use

Use \`VirtualizedChatPanel\` instead of \`ChatPanel\` when:
- Chat history can grow to **100+ messages**
- Messages contain **variable-height content** (code blocks, tool calls)
- Scroll performance is degraded

## How Virtualization Works

Instead of rendering all messages to the DOM, this component:
1. Only renders messages visible in the viewport
2. Adds an **overscan** buffer (default: 10 items) above and below
3. Uses absolute positioning with transforms for smooth scrolling
4. Dynamically measures actual heights after render

## Verifying Virtualization

Open your browser DevTools and inspect the DOM:
- With **500 messages**, you should see only ~20-30 \`<div>\` elements in the scroll container
- Compare to the regular ChatPanel which renders all 500

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| \`overscan\` | number | 10 | Items to render outside viewport |
| \`estimatedMessageHeight\` | number | 80 | Initial height estimate in px |

## Usage

\`\`\`tsx
import { VirtualizedChatPanel } from '@ui-kit/react-chat';

<VirtualizedChatPanel
  messages={messages}
  overscan={10}
  estimatedMessageHeight={80}
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    overscan: {
      control: { type: 'number', min: 0, max: 50 },
      description: 'Number of items to render outside visible area',
    },
    estimatedMessageHeight: {
      control: { type: 'number', min: 40, max: 200 },
      description: 'Estimated height per message for initial sizing',
    },
  },
};

export default meta;
type Story = StoryObj<typeof VirtualizedChatPanel>;

// Helper to generate timestamps
const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60 * 1000);

// Generate messages for testing
function generateMessages(count: number): VirtualizedChatPanelMessage[] {
  const messages: VirtualizedChatPanelMessage[] = [];
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
      id: `msg-${i}`,
      content,
      timestamp: minutesAgo(count - i),
      senderName: sender.name,
      senderColor: sender.color,
      isOwn: sender.isOwn,
    });
  }

  return messages;
}

// DOM Stats component to show virtualization is working
function DOMStats({ containerId, isVirtualized }: { containerId: string; isVirtualized: boolean }) {
  const [stats, setStats] = useState({ messageCount: 0, totalElements: 0 });

  useEffect(() => {
    const updateStats = () => {
      const container = document.getElementById(containerId);

      if (container) {
        let messageCount = 0;

        if (isVirtualized) {
          // Virtualized: count items with data-index attribute
          messageCount = container.querySelectorAll('[data-index]').length;
        } else {
          // Non-virtualized: count ChatMessage root elements (direct children of messages container)
          // ChatMessage renders article elements or divs with specific structure
          const messagesContainer = container.querySelector('[class*="messages"]');

          if (messagesContainer) {
            messageCount = messagesContainer.children.length;
          }
        }

        // Count ALL elements inside the container
        const allElements = container.querySelectorAll('*');

        setStats({
          messageCount,
          totalElements: allElements.length,
        });
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 300);

    return () => clearInterval(interval);
  }, [containerId, isVirtualized]);

  return (
    <div
      style={{
        padding: '8px 16px',
        background: 'var(--color-panel-background)',
        borderRadius: '4px',
        fontSize: '13px',
        fontFamily: 'monospace',
      }}
    >
      <strong>Messages in DOM:</strong> {stats.messageCount} | <strong>Total DOM nodes:</strong> {stats.totalElements}
    </div>
  );
}

// Comparison demo showing virtualized vs non-virtualized
function ComparisonDemo() {
  const messages = generateMessages(200);
  const [showVirtualized, setShowVirtualized] = useState(true);

  return (
    <div style={{ height: '700px', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid var(--color-divider)',
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showVirtualized}
            onChange={(e) => setShowVirtualized(e.target.checked)}
          />
          Use VirtualizedChatPanel
        </label>
        <span style={{ color: 'var(--color-body-textSoft10)' }}>
          200 messages total
        </span>
        <DOMStats
          containerId={showVirtualized ? 'virtualized-container' : 'regular-container'}
          isVirtualized={showVirtualized}
        />
      </div>
      <div
        style={{ flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}
        id={showVirtualized ? 'virtualized-container' : 'regular-container'}
      >
        {showVirtualized ? (
          <VirtualizedChatPanel messages={messages} overscan={5} />
        ) : (
          <ChatPanel messages={messages} />
        )}
      </div>
      <div
        style={{
          padding: '16px',
          borderTop: '1px solid var(--color-divider)',
          fontSize: '14px',
          flexShrink: 0,
        }}
      >
        <strong>How to verify:</strong>
        <ol style={{ margin: '8px 0', paddingLeft: '20px' }}>
          <li>Toggle the checkbox to see DOM node count change in real-time</li>
          <li>
            <strong>Virtualized:</strong> Only visible messages + overscan buffer
          </li>
          <li>
            <strong>Non-virtualized:</strong> All 200 message elements
          </li>
        </ol>
      </div>
    </div>
  );
}

export const Comparison: Story = {
  render: () => <ComparisonDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Toggle between virtualized and non-virtualized to see the DOM element difference. Check DevTools to verify.',
      },
    },
  },
};

// 500 messages stress test
export const StressTest500: Story = {
  args: {
    messages: generateMessages(500),
    overscan: 10,
  },
  decorators: [
    (Story) => (
      <div style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--color-divider)', flexShrink: 0 }}>
          <strong>500 messages</strong> - Only ~20-30 are rendered in the DOM at any time.
          <br />
          <span style={{ color: 'var(--color-body-textSoft10)', fontSize: '13px' }}>
            Open DevTools → Elements to verify. Scroll should be smooth.
          </span>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}>
          <Story />
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Stress test with 500 messages. Virtualization ensures only visible items are in the DOM.',
      },
    },
  },
};

// 1000 messages extreme test
export const StressTest1000: Story = {
  args: {
    messages: generateMessages(1000),
    overscan: 10,
  },
  decorators: [
    (Story) => (
      <div style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--color-divider)', flexShrink: 0 }}>
          <strong>1000 messages</strong> - Extreme test. Still only ~20-30 DOM elements.
          <br />
          <span style={{ color: 'var(--color-body-textSoft10)', fontSize: '13px' }}>
            Without virtualization, this would render 1000 elements and cause severe lag.
          </span>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}>
          <Story />
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Extreme stress test with 1000 messages. Virtualization makes this feasible.',
      },
    },
  },
};

// Overscan tuning demo
function OverscanDemo() {
  const [overscan, setOverscan] = useState(10);
  const messages = generateMessages(200);

  return (
    <div style={{ height: '700px', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid var(--color-divider)',
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          Overscan:
          <input
            type="range"
            min={0}
            max={30}
            value={overscan}
            onChange={(e) => setOverscan(Number(e.target.value))}
            style={{ width: '120px' }}
          />
          <span style={{ fontFamily: 'monospace', minWidth: '24px' }}>{overscan}</span>
        </label>
        <DOMStats containerId="overscan-container" isVirtualized={true} />
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }} id="overscan-container">
        <VirtualizedChatPanel messages={messages} overscan={overscan} />
      </div>
      <div
        style={{
          padding: '16px',
          borderTop: '1px solid var(--color-divider)',
          fontSize: '14px',
          flexShrink: 0,
        }}
      >
        <strong>Overscan explained:</strong>
        <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
          <li><strong>0:</strong> Only visible items rendered - may see blank areas when scrolling fast</li>
          <li><strong>5-10:</strong> Good balance - smooth scrolling, minimal DOM nodes</li>
          <li><strong>20+:</strong> Very smooth but more DOM nodes - diminishing returns</li>
        </ul>
      </div>
    </div>
  );
}

export const OverscanTuning: Story = {
  render: () => <OverscanDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Adjust the overscan value and observe DOM element count. Higher overscan = smoother scroll but more DOM nodes.',
      },
    },
  },
};

// Scroll lock demo with new messages
function ScrollLockDemo() {
  const [messages, setMessages] = useState<VirtualizedChatPanelMessage[]>(() => generateMessages(50));
  const [isLocked, setIsLocked] = useState(true);
  const [autoAdd, setAutoAdd] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const counterRef = useRef(50);

  const addMessage = useCallback(() => {
    counterRef.current += 1;
    const i = counterRef.current;
    const isOwn = i % 5 === 0;

    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${i}`,
        content: isOwn
          ? `User message #${i}`
          : `Assistant response #${i}. This is a longer message to demonstrate variable height content in the virtualized list.`,
        timestamp: new Date(),
        senderName: isOwn ? 'You' : 'Assistant',
        senderColor: isOwn ? '#10b981' : '#6366f1',
        isOwn,
      },
    ]);
  }, []);

  useEffect(() => {
    if (autoAdd) {
      intervalRef.current = setInterval(addMessage, 800);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoAdd, addMessage]);

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
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => setAutoAdd(!autoAdd)}
          style={{
            padding: '8px 16px',
            background: autoAdd ? '#ef4444' : 'var(--color-buttonPrimary-background)',
            color: autoAdd ? 'white' : 'var(--color-buttonPrimary-text)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          {autoAdd ? 'Stop Adding Messages' : 'Start Adding Messages'}
        </button>
        <span style={{ color: 'var(--color-body-textSoft10)' }}>
          Messages: {messages.length}
        </span>
        <span
          style={{
            padding: '4px 8px',
            borderRadius: '4px',
            background: isLocked ? '#22c55e20' : '#f59e0b20',
            color: isLocked ? '#22c55e' : '#f59e0b',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          Scroll: {isLocked ? 'LOCKED (auto-scroll)' : 'UNLOCKED (reading history)'}
        </span>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}>
        <VirtualizedChatPanel
          messages={messages}
          overscan={10}
          onScrollLockChange={setIsLocked}
        />
      </div>
      <div
        style={{
          padding: '16px',
          borderTop: '1px solid var(--color-divider)',
          fontSize: '14px',
          flexShrink: 0,
        }}
      >
        <strong>Test scroll lock behavior:</strong>
        <ol style={{ margin: '8px 0', paddingLeft: '20px' }}>
          <li>Click "Start Adding Messages" to begin auto-adding</li>
          <li>Notice: scroll stays locked to bottom, new messages appear</li>
          <li>Scroll up to read history - scroll unlocks automatically</li>
          <li>New messages still arrive but you stay at your position</li>
          <li>Click "Jump to bottom" button (appears when unlocked) to re-lock</li>
        </ol>
      </div>
    </div>
  );
}

export const ScrollLockBehavior: Story = {
  render: () => <ScrollLockDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates smart scroll-lock: stays at bottom for new messages, unlocks when you scroll up to read history.',
      },
    },
  },
};

// Streaming message test
function StreamingDemo() {
  const [messages, setMessages] = useState<VirtualizedChatPanelMessage[]>([
    {
      id: 'initial',
      content: 'Can you explain how virtualization works?',
      timestamp: minutesAgo(1),
      senderName: 'You',
      senderColor: '#10b981',
      isOwn: true,
    },
  ]);

  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const fullResponse = `Virtual scrolling (or windowing) is a technique that only renders items currently visible in the viewport.

## How It Works

1. **Calculate visible range** - Based on scroll position and container height
2. **Render only those items** - Plus a small overscan buffer
3. **Position with transforms** - Items use \`position: absolute\` and \`translateY()\`
4. **Measure after render** - Dynamic heights are measured and cached

## Benefits

- **Constant DOM size** - Whether you have 100 or 10,000 items
- **Smooth scrolling** - Fewer DOM nodes = better performance
- **Lower memory usage** - Unmounted items are garbage collected

## Example

\`\`\`tsx
// Instead of rendering all 1000 items:
messages.map(msg => <Message key={msg.id} {...msg} />)

// Virtualization renders only ~20:
virtualItems.map(item => (
  <div style={{ transform: \`translateY(\${item.start}px)\` }}>
    <Message {...messages[item.index]} />
  </div>
))
\`\`\`

This is how this very chat panel stays fast even with thousands of messages.`;

  const startStreaming = useCallback(() => {
    setIsStreaming(true);
    setStreamingContent('');

    let index = 0;
    const interval = setInterval(() => {
      if (index < fullResponse.length) {
        const chunkSize = Math.floor(Math.random() * 8) + 2;

        setStreamingContent((prev) => prev + fullResponse.slice(index, index + chunkSize));
        index += chunkSize;
      } else {
        clearInterval(interval);
        setIsStreaming(false);
      }
    }, 25);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setTimeout(startStreaming, 500);

    return () => clearTimeout(timer);
  }, [startStreaming]);

  const displayMessages: VirtualizedChatPanelMessage[] = [
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
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}>
        <VirtualizedChatPanel
          messages={displayMessages}
          isLoading={!streamingContent && isStreaming}
        />
      </div>
      <div
        style={{
          padding: '16px',
          borderTop: '1px solid var(--color-divider)',
          display: 'flex',
          gap: '16px',
          flexShrink: 0,
        }}
      >
        <button
          onClick={startStreaming}
          disabled={isStreaming}
          style={{
            padding: '8px 16px',
            background: isStreaming ? 'var(--color-buttonSecondary-background)' : 'var(--color-buttonPrimary-background)',
            color: isStreaming ? 'var(--color-buttonSecondary-text)' : 'var(--color-buttonPrimary-text)',
            border: 'none',
            borderRadius: '4px',
            cursor: isStreaming ? 'not-allowed' : 'pointer',
            opacity: isStreaming ? 0.6 : 1,
          }}
        >
          {isStreaming ? 'Streaming...' : 'Restart Stream'}
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
        story: 'Tests dynamic height changes during message streaming. The virtualizer re-measures as content grows.',
      },
    },
  },
};

// Tool calls with virtualization
function generateToolCallMessages(count: number): VirtualizedChatPanelMessage[] {
  const messages: VirtualizedChatPanelMessage[] = [];

  const toolCallSets: ChatMessagePart[][] = [
    [
      { type: 'text', content: 'Let me search for that.' },
      {
        type: 'tool',
        tool: { name: 'search_web', input: { query: 'React virtualization' }, output: 'Found 25 results...' },
      },
      { type: 'text', content: 'Here are the results.' },
    ],
    [
      { type: 'text', content: 'Reading the file...' },
      {
        type: 'tool',
        tool: {
          name: 'read_file',
          input: { path: '/src/App.tsx' },
          output: `import React from 'react';
export function App() {
  return <div>Hello World</div>;
}`,
        },
      },
    ],
    [
      {
        type: 'tool',
        tool: { name: 'list_dir', input: { path: '/src' }, output: 'components/\nutils/\nindex.ts' },
      },
      {
        type: 'tool',
        tool: { name: 'read_file', input: { path: '/src/index.ts' }, output: "export * from './App';" },
      },
      { type: 'text', content: 'Directory structure analyzed.' },
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
        content: `Question ${Math.floor(i / 2) + 1}: Can you help me with this?`,
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
    messages: generateToolCallMessages(100),
    overscan: 10,
  },
  decorators: [
    (Story) => (
      <div style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--color-divider)', flexShrink: 0 }}>
          <strong>100 messages with tool calls</strong> - Variable heights from expandable tool outputs.
          <br />
          <span style={{ color: 'var(--color-body-textSoft10)', fontSize: '13px' }}>
            Expanding/collapsing tool calls triggers re-measurement.
          </span>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}>
          <Story />
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Stress test with messages containing tool calls. Tests height re-measurement when tools are expanded/collapsed.',
      },
    },
  },
};

// Basic usage
const basicMessages: VirtualizedChatPanelMessage[] = [
  {
    id: '1',
    content: 'Hello! How can I help you today?',
    timestamp: minutesAgo(5),
    senderName: 'Assistant',
    senderColor: '#6366f1',
  },
  {
    id: '2',
    content: 'I need help understanding virtualization.',
    timestamp: minutesAgo(4),
    senderName: 'You',
    senderColor: '#10b981',
    isOwn: true,
  },
  {
    id: '3',
    content: `Virtualization is a rendering optimization technique where only visible items are rendered to the DOM.

Instead of rendering all items (which can be slow with hundreds or thousands), we:
1. Calculate which items are visible based on scroll position
2. Render only those items (plus a buffer called "overscan")
3. Position them absolutely using CSS transforms

This keeps the DOM small and scrolling smooth, regardless of list size.`,
    timestamp: minutesAgo(3),
    senderName: 'Assistant',
    senderColor: '#6366f1',
  },
];

export const Default: Story = {
  args: {
    messages: basicMessages,
    overscan: 10,
    estimatedMessageHeight: 80,
  },
  decorators: [
    (Story) => (
      <div style={{ height: '400px', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        <Story />
      </div>
    ),
  ],
};
