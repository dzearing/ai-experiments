import type { Meta, StoryObj } from '@storybook/react';
import { useState, useCallback, useRef, useEffect } from 'react';
import { Button, Checkbox, Stack, Text, Chip } from '@ui-kit/react';
import { ChatLayout } from './ChatLayout';
import { VirtualizedChatPanel, type VirtualizedChatPanelMessage } from '../ChatPanel';
import type { ChatMessagePart, ChatMessageToolCall } from '../ChatMessage';
import { ChatGroupHeader } from '../ChatGroupHeader';
import type { ChatParticipant } from '../../context';

const meta: Meta<typeof ChatLayout> = {
  title: 'React Chat/ChatLayout',
  component: ChatLayout,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
A standard layout container for chat interfaces that properly positions all chat elements.

## Purpose

ChatLayout provides a consistent structure for chat UIs, ensuring:
- Header is fixed at the top
- Messages fill available space
- ThinkingIndicator appears above the input when active
- MessageQueue shows queued messages
- ChatInput is fixed at the bottom

## Usage

\`\`\`tsx
import { ChatLayout, VirtualizedChatPanel } from '@ui-kit/react-chat';

<ChatLayout
  header={<MyHeader />}
  isThinking={isAgentThinking}
  thinkingIndicatorProps={{
    statusText: 'Analyzing...',
    showEscapeHint: true,
  }}
  queuedMessages={queuedMessages}
  onRemoveQueuedMessage={handleRemove}
  chatInputProps={{
    placeholder: 'Type a message...',
    onSubmit: handleSubmit,
  }}
>
  <VirtualizedChatPanel messages={messages} />
</ChatLayout>
\`\`\`
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ChatLayout>;

// =============================================================================
// REUSABLE UTILITIES
// =============================================================================

/** Generate a timestamp from minutes ago */
const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60 * 1000);

/** Sample header component */
function SampleHeader({ title, status }: { title: string; status: 'connected' | 'disconnected' | 'thinking' }) {
  const chipVariant = {
    connected: 'success' as const,
    disconnected: 'error' as const,
    thinking: 'warning' as const,
  };

  const statusLabels = {
    connected: 'Connected',
    disconnected: 'Disconnected',
    thinking: 'Processing...',
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-4)',
        padding: 'var(--space-3) var(--space-4)',
        borderBottom: '1px solid var(--soft-border)',
        background: 'var(--soft-bg)',
      }}
    >
      <Text weight="medium">{title}</Text>
      <Chip size="sm" variant={chipVariant[status]}>
        {statusLabels[status]}
      </Chip>
    </div>
  );
}

// =============================================================================
// MESSAGE SIMULATION HOOK
// =============================================================================

interface UseMessageSimulationOptions {
  /** Initial messages to start with */
  initialMessages?: VirtualizedChatPanelMessage[];
  /** Interval in ms between new messages (default: 5000) */
  interval?: number;
  /** Whether simulation is enabled */
  enabled?: boolean;
  /** Message generator function */
  generateMessage?: (index: number) => VirtualizedChatPanelMessage;
}

/** Hook to simulate incoming messages at regular intervals */
function useMessageSimulation({
  initialMessages = [],
  interval = 5000,
  enabled = true,
  generateMessage,
}: UseMessageSimulationOptions) {
  const [messages, setMessages] = useState<VirtualizedChatPanelMessage[]>(initialMessages);
  const counterRef = useRef(initialMessages.length);

  const defaultGenerator = useCallback((index: number): VirtualizedChatPanelMessage => {
    const isAssistant = index % 2 === 0;
    const contents = [
      'This is a simulated message to demonstrate the chat layout.',
      'Here is another message with some **markdown** formatting.',
      'A shorter reply.',
      `This message has multiple lines.

It demonstrates how the chat handles longer content with paragraphs.`,
    ];

    return {
      id: `sim-${index}-${Date.now()}`,
      content: contents[index % contents.length],
      timestamp: new Date(),
      senderName: isAssistant ? 'Assistant' : 'You',
      senderColor: isAssistant ? '#6366f1' : '#10b981',
      isOwn: !isAssistant,
    };
  }, []);

  const generator = generateMessage ?? defaultGenerator;

  useEffect(() => {
    if (!enabled) return;

    const timer = setInterval(() => {
      counterRef.current += 1;
      const newMessage = generator(counterRef.current);

      setMessages(prev => [...prev, newMessage]);
    }, interval);

    return () => clearInterval(timer);
  }, [enabled, interval, generator]);

  const addMessage = useCallback((message: VirtualizedChatPanelMessage) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    counterRef.current = 0;
  }, []);

  return { messages, addMessage, clearMessages, setMessages };
}

// =============================================================================
// STREAMING SIMULATION HOOK
// =============================================================================

interface UseStreamingSimulationOptions {
  /** Full text to stream */
  fullText: string;
  /** Characters per chunk */
  chunkSize?: number;
  /** Delay between chunks in ms */
  chunkDelay?: number;
  /** Callback when streaming completes */
  onComplete?: () => void;
}

/** Hook to simulate streaming text */
function useStreamingSimulation({
  fullText,
  chunkSize = 5,
  chunkDelay = 30,
  onComplete,
}: UseStreamingSimulationOptions) {
  const [streamedText, setStreamedText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const indexRef = useRef(0);

  const startStreaming = useCallback(() => {
    setStreamedText('');
    setIsStreaming(true);
    indexRef.current = 0;
  }, []);

  useEffect(() => {
    if (!isStreaming) return;

    const timer = setInterval(() => {
      const nextIndex = Math.min(indexRef.current + chunkSize, fullText.length);

      setStreamedText(fullText.slice(0, nextIndex));
      indexRef.current = nextIndex;

      if (nextIndex >= fullText.length) {
        setIsStreaming(false);
        onComplete?.();
        clearInterval(timer);
      }
    }, chunkDelay);

    return () => clearInterval(timer);
  }, [isStreaming, fullText, chunkSize, chunkDelay, onComplete]);

  return { streamedText, isStreaming, startStreaming };
}

// =============================================================================
// TOOL EXECUTION SIMULATION
// =============================================================================

interface ToolSimulation {
  name: string;
  input: Record<string, unknown>;
  output: string;
  duration: number;
}

const SAMPLE_TOOLS: ToolSimulation[] = [
  {
    name: 'Read',
    input: { file_path: '/src/components/App.tsx' },
    output: 'import React from "react";\n\nexport function App() {\n  return <div>Hello World</div>;\n}',
    duration: 800,
  },
  {
    name: 'Grep',
    input: { pattern: 'useState', path: '/src' },
    output: 'Found 15 matches in 8 files',
    duration: 1200,
  },
  {
    name: 'Bash',
    input: { command: 'pnpm test' },
    output: 'PASS src/App.test.tsx\nTests: 5 passed, 5 total\nTime: 2.5s',
    duration: 2500,
  },
  {
    name: 'WebSearch',
    input: { query: 'React best practices 2024' },
    output: 'Found 25 relevant results...',
    duration: 1800,
  },
  {
    name: 'Edit',
    input: { file_path: '/src/utils/helpers.ts', old_string: 'foo', new_string: 'bar' },
    output: 'Successfully edited file',
    duration: 500,
  },
];

/** Generate a message with tool calls */
function generateToolMessage(tools: ToolSimulation[], completed: boolean = true): VirtualizedChatPanelMessage {
  const toolCalls: ChatMessageToolCall[] = tools.map((tool, i) => ({
    name: tool.name,
    input: tool.input,
    output: completed ? tool.output : undefined,
    startTime: Date.now() - (completed ? tool.duration : 0),
    duration: completed ? tool.duration : undefined,
    completed,
  }));

  const parts: ChatMessagePart[] = [
    { type: 'text', text: 'Let me help you with that.' },
    { type: 'tool_calls', calls: toolCalls },
    ...(completed ? [{ type: 'text' as const, text: 'Done! I\'ve completed the requested operations.' }] : []),
  ];

  return {
    id: `tool-msg-${Date.now()}`,
    content: '',
    parts,
    timestamp: new Date(),
    senderName: 'Assistant',
    senderColor: '#6366f1',
  };
}

// =============================================================================
// STORIES
// =============================================================================

// Default story
export const Default: Story = {
  render: () => {
    const { messages } = useMessageSimulation({
      initialMessages: [
        {
          id: '1',
          content: 'Hello! How can I help you today?',
          timestamp: minutesAgo(2),
          senderName: 'Assistant',
          senderColor: '#6366f1',
        },
        {
          id: '2',
          content: 'I need help with my React application.',
          timestamp: minutesAgo(1),
          senderName: 'You',
          senderColor: '#10b981',
          isOwn: true,
        },
      ],
      enabled: false,
    });

    return (
      <ChatLayout
        header={<SampleHeader title="Chat Agent" status="connected" />}
        chatInputProps={{
          placeholder: 'Type a message...',
          onSubmit: () => {},
        }}
      >
        <VirtualizedChatPanel messages={messages} />
      </ChatLayout>
    );
  },
};

// Auto-simulation with new messages every 5 seconds
function AutoSimulationDemo() {
  const [enabled, setEnabled] = useState(true);
  const { messages, clearMessages } = useMessageSimulation({
    initialMessages: [
      {
        id: 'initial',
        content: 'This demo adds a new message every 5 seconds.',
        timestamp: new Date(),
        senderName: 'Assistant',
        senderColor: '#6366f1',
      },
    ],
    interval: 5000,
    enabled,
  });

  return (
    <>
      <Stack
        direction="horizontal"
        gap="md"
        align="center"
        style={{
          padding: 'var(--space-3) var(--space-4)',
          borderBottom: '1px solid var(--soft-border)',
          flexShrink: 0,
        }}
      >
        <Checkbox
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          label="Auto-add messages (every 5s)"
        />
        <Button variant="default" size="sm" onClick={clearMessages}>
          Clear
        </Button>
        <Text size="sm" color="soft">
          Messages: {messages.length}
        </Text>
      </Stack>
      <ChatLayout
        header={<SampleHeader title="Auto-Simulation" status="connected" />}
        chatInputProps={{
          placeholder: 'Type a message...',
          onSubmit: () => {},
        }}
      >
        <VirtualizedChatPanel messages={messages} />
      </ChatLayout>
    </>
  );
}

export const AutoSimulation: Story = {
  render: () => <AutoSimulationDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates automatic message simulation. New messages are added every 5 seconds.',
      },
    },
  },
};

// Streaming message example
function StreamingDemo() {
  const fullResponse = `I'll help you understand how streaming works in this chat interface.

## How Streaming Works

1. **Text arrives in chunks** - The response is built up character by character
2. **Real-time display** - Users see the response as it's being generated
3. **Smooth experience** - The BusyIndicator shows activity

\`\`\`typescript
// Example streaming implementation
const stream = await api.streamResponse(prompt);
for await (const chunk of stream) {
  appendToMessage(chunk);
}
\`\`\`

This creates a more engaging experience than waiting for the full response.`;

  const [messages, setMessages] = useState<VirtualizedChatPanelMessage[]>([
    {
      id: 'user-1',
      content: 'Can you explain how streaming works?',
      timestamp: minutesAgo(1),
      senderName: 'You',
      senderColor: '#10b981',
      isOwn: true,
    },
  ]);

  const { streamedText, isStreaming, startStreaming } = useStreamingSimulation({
    fullText: fullResponse,
    chunkSize: 8,
    chunkDelay: 25,
    onComplete: () => {
      setMessages(prev => prev.map(m =>
        m.id === 'streaming' ? { ...m, isStreaming: false } : m
      ));
    },
  });

  const handleStart = useCallback(() => {
    setMessages(prev => [
      ...prev.filter(m => m.id !== 'streaming'),
      {
        id: 'streaming',
        content: '',
        timestamp: new Date(),
        senderName: 'Assistant',
        senderColor: '#6366f1',
        isStreaming: true,
      },
    ]);
    startStreaming();
  }, [startStreaming]);

  // Update streaming message content
  useEffect(() => {
    if (streamedText) {
      setMessages(prev => prev.map(m =>
        m.id === 'streaming' ? { ...m, content: streamedText } : m
      ));
    }
  }, [streamedText]);

  return (
    <>
      <Stack
        direction="horizontal"
        gap="md"
        align="center"
        style={{
          padding: 'var(--space-3) var(--space-4)',
          borderBottom: '1px solid var(--soft-border)',
          flexShrink: 0,
        }}
      >
        <Button
          variant={isStreaming ? 'default' : 'primary'}
          onClick={handleStart}
          disabled={isStreaming}
        >
          {isStreaming ? 'Streaming...' : 'Start Streaming Response'}
        </Button>
      </Stack>
      <ChatLayout
        header={<SampleHeader title="Streaming Demo" status={isStreaming ? 'thinking' : 'connected'} />}
        isThinking={isStreaming}
        thinkingIndicatorProps={{
          statusText: 'Generating response...',
        }}
        chatInputProps={{
          placeholder: isStreaming ? 'Waiting for response...' : 'Type a message...',
          onSubmit: () => {},
        }}
      >
        <VirtualizedChatPanel messages={messages} />
      </ChatLayout>
    </>
  );
}

export const StreamingMessage: Story = {
  render: () => <StreamingDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates streaming message display. Click the button to see text stream in character by character.',
      },
    },
  },
};

// Tool execution example
function ToolExecutionDemo() {
  const [messages, setMessages] = useState<VirtualizedChatPanelMessage[]>([
    {
      id: 'user-1',
      content: 'Can you read my App.tsx file and run the tests?',
      timestamp: minutesAgo(1),
      senderName: 'You',
      senderColor: '#10b981',
      isOwn: true,
    },
  ]);
  const [isRunning, setIsRunning] = useState(false);

  const simulateToolExecution = useCallback(() => {
    setIsRunning(true);

    // Start with running tools
    const runningTools = [SAMPLE_TOOLS[0], SAMPLE_TOOLS[2]]; // Read and Bash

    setMessages(prev => [
      ...prev,
      generateToolMessage(runningTools, false),
    ]);

    // Complete tools one by one
    let completed = 0;
    const completeNext = () => {
      completed++;
      if (completed <= runningTools.length) {
        setMessages(prev => {
          const lastMsg = prev[prev.length - 1];

          if (lastMsg.parts) {
            const updatedParts = lastMsg.parts.map(part => {
              if (part.type === 'tool_calls') {
                return {
                  ...part,
                  calls: part.calls.map((call, i) => ({
                    ...call,
                    output: i < completed ? runningTools[i].output : undefined,
                    completed: i < completed,
                    duration: i < completed ? runningTools[i].duration : undefined,
                  })),
                };
              }

              return part;
            });

            return [
              ...prev.slice(0, -1),
              { ...lastMsg, parts: updatedParts },
            ];
          }

          return prev;
        });

        if (completed < runningTools.length) {
          setTimeout(completeNext, runningTools[completed].duration);
        } else {
          // Add completion text
          setTimeout(() => {
            setMessages(prev => {
              const lastMsg = prev[prev.length - 1];

              if (lastMsg.parts) {
                return [
                  ...prev.slice(0, -1),
                  {
                    ...lastMsg,
                    parts: [
                      ...lastMsg.parts,
                      { type: 'text' as const, text: 'I\'ve read the file and run the tests. All 5 tests passed!' },
                    ],
                  },
                ];
              }

              return prev;
            });
            setIsRunning(false);
          }, 500);
        }
      }
    };

    setTimeout(completeNext, runningTools[0].duration);
  }, []);

  return (
    <>
      <Stack
        direction="horizontal"
        gap="md"
        align="center"
        style={{
          padding: 'var(--space-3) var(--space-4)',
          borderBottom: '1px solid var(--soft-border)',
          flexShrink: 0,
        }}
      >
        <Button
          variant={isRunning ? 'default' : 'primary'}
          onClick={simulateToolExecution}
          disabled={isRunning}
        >
          {isRunning ? 'Executing...' : 'Simulate Tool Execution'}
        </Button>
      </Stack>
      <ChatLayout
        header={<SampleHeader title="Tool Execution" status={isRunning ? 'thinking' : 'connected'} />}
        isThinking={isRunning}
        thinkingIndicatorProps={{
          statusText: 'Running tools...',
        }}
        chatInputProps={{
          placeholder: isRunning ? 'Agent is working...' : 'Type a message...',
          onSubmit: () => {},
        }}
      >
        <VirtualizedChatPanel messages={messages} />
      </ChatLayout>
    </>
  );
}

export const ToolExecution: Story = {
  render: () => <ToolExecutionDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates tool execution with progress indicators. Tools complete one by one with timing.',
      },
    },
  },
};

// Multiple tool types showcase
function MultipleToolsDemo() {
  const messages: VirtualizedChatPanelMessage[] = [
    {
      id: 'user-1',
      content: 'Show me different types of tool executions.',
      timestamp: minutesAgo(3),
      senderName: 'You',
      senderColor: '#10b981',
      isOwn: true,
    },
    {
      id: 'assistant-1',
      content: '',
      parts: [
        { type: 'text', text: 'Here are examples of different tool states:' },
        {
          type: 'tool_calls',
          calls: [
            {
              name: 'Read',
              input: { file_path: '/src/App.tsx' },
              output: 'File contents here...',
              completed: true,
              duration: 450,
            },
            {
              name: 'Grep',
              input: { pattern: 'useState' },
              output: 'Found 12 matches',
              completed: true,
              duration: 890,
            },
          ],
        },
        { type: 'text', text: 'Both tools completed successfully.' },
      ],
      timestamp: minutesAgo(2),
      senderName: 'Assistant',
      senderColor: '#6366f1',
    },
    {
      id: 'user-2',
      content: 'What about a running tool?',
      timestamp: minutesAgo(1),
      senderName: 'You',
      senderColor: '#10b981',
      isOwn: true,
    },
    {
      id: 'assistant-2',
      content: '',
      parts: [
        { type: 'text', text: 'Here\'s a tool that\'s currently running:' },
        {
          type: 'tool_calls',
          calls: [
            {
              name: 'Bash',
              input: { command: 'pnpm build' },
              startTime: Date.now() - 3000,
              completed: false,
            },
          ],
        },
      ],
      timestamp: new Date(),
      senderName: 'Assistant',
      senderColor: '#6366f1',
    },
  ];

  return (
    <ChatLayout
      header={<SampleHeader title="Tool States Showcase" status="connected" />}
      chatInputProps={{
        placeholder: 'Type a message...',
        onSubmit: () => {},
      }}
    >
      <VirtualizedChatPanel messages={messages} />
    </ChatLayout>
  );
}

export const MultipleToolTypes: Story = {
  render: () => <MultipleToolsDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Shows different tool states: completed tools with output and a running tool with live timer.',
      },
    },
  },
};

// With thinking indicator
function ThinkingDemo() {
  const [isThinking, setIsThinking] = useState(true);
  const { messages } = useMessageSimulation({
    initialMessages: [
      {
        id: '1',
        content: 'Analyze this codebase for potential improvements.',
        timestamp: minutesAgo(1),
        senderName: 'You',
        senderColor: '#10b981',
        isOwn: true,
      },
    ],
    enabled: false,
  });

  return (
    <>
      <Stack
        direction="horizontal"
        gap="md"
        align="center"
        style={{
          padding: 'var(--space-3) var(--space-4)',
          borderBottom: '1px solid var(--soft-border)',
          flexShrink: 0,
        }}
      >
        <Checkbox
          checked={isThinking}
          onChange={(e) => setIsThinking(e.target.checked)}
          label="Show ThinkingIndicator"
        />
      </Stack>
      <ChatLayout
        header={<SampleHeader title="Idea Agent" status={isThinking ? 'thinking' : 'connected'} />}
        isThinking={isThinking}
        thinkingIndicatorProps={{
          statusText: 'Analyzing codebase...',
          showEscapeHint: true,
        }}
        chatInputProps={{
          placeholder: isThinking ? 'Type to queue message...' : 'Ask the agent...',
          onSubmit: () => {},
        }}
      >
        <VirtualizedChatPanel messages={messages} />
      </ChatLayout>
    </>
  );
}

export const WithThinkingIndicator: Story = {
  render: () => <ThinkingDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Toggle the checkbox to show/hide the ThinkingIndicator. It appears left-aligned directly above the chat input.',
      },
    },
  },
};

// With queued messages
function QueuedMessagesDemo() {
  const [isThinking, setIsThinking] = useState(true);
  const [queuedMessages, setQueuedMessages] = useState([
    { id: 'q1', content: 'First queued message' },
    { id: 'q2', content: 'Second queued message' },
  ]);
  const { messages } = useMessageSimulation({
    initialMessages: [
      {
        id: '1',
        content: 'Processing your request...',
        timestamp: minutesAgo(1),
        senderName: 'Assistant',
        senderColor: '#6366f1',
      },
    ],
    enabled: false,
  });

  const handleRemoveQueued = useCallback((id: string) => {
    setQueuedMessages(prev => prev.filter(m => m.id !== id));
  }, []);

  const handleAddQueued = useCallback(() => {
    const id = `q${Date.now()}`;

    setQueuedMessages(prev => [...prev, { id, content: `Queued message ${prev.length + 1}` }]);
  }, []);

  return (
    <>
      <Stack
        direction="horizontal"
        gap="md"
        align="center"
        style={{
          padding: 'var(--space-3) var(--space-4)',
          borderBottom: '1px solid var(--soft-border)',
          flexShrink: 0,
        }}
      >
        <Checkbox
          checked={isThinking}
          onChange={(e) => setIsThinking(e.target.checked)}
          label="Agent is thinking"
        />
        <Button variant="default" size="sm" onClick={handleAddQueued}>
          Add Queued Message
        </Button>
        <Text size="sm" color="soft">
          Queued: {queuedMessages.length}
        </Text>
      </Stack>
      <ChatLayout
        header={<SampleHeader title="Plan Agent" status={isThinking ? 'thinking' : 'connected'} />}
        isThinking={isThinking}
        thinkingIndicatorProps={{
          statusText: 'Creating implementation plan...',
          showEscapeHint: true,
        }}
        queuedMessages={queuedMessages}
        onRemoveQueuedMessage={handleRemoveQueued}
        chatInputProps={{
          placeholder: 'Type to queue message...',
          onSubmit: () => {},
        }}
      >
        <VirtualizedChatPanel messages={messages} />
      </ChatLayout>
    </>
  );
}

export const WithQueuedMessages: Story = {
  render: () => <QueuedMessagesDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Shows queued messages that appear between the ThinkingIndicator and ChatInput.',
      },
    },
  },
};

// Interactive full demo
function InteractiveDemo() {
  const [messages, setMessages] = useState<VirtualizedChatPanelMessage[]>([
    {
      id: 'initial',
      content: 'Hello! Send a message to see the full interaction flow.',
      timestamp: new Date(),
      senderName: 'Assistant',
      senderColor: '#6366f1',
    },
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const [queuedMessages, setQueuedMessages] = useState<{ id: string; content: string }[]>([]);
  const counterRef = useRef(1);

  const handleSubmit = useCallback(({ content }: { content: string }) => {
    if (!content.trim()) return;

    if (isThinking) {
      setQueuedMessages(prev => [...prev, { id: `q${Date.now()}`, content }]);
    } else {
      counterRef.current += 1;
      setMessages(prev => [
        ...prev,
        {
          id: `msg-${counterRef.current}`,
          content,
          timestamp: new Date(),
          senderName: 'You',
          senderColor: '#10b981',
          isOwn: true,
        },
      ]);

      setIsThinking(true);

      // Simulate response with tool
      setTimeout(() => {
        counterRef.current += 1;
        setMessages(prev => [
          ...prev,
          {
            id: `msg-${counterRef.current}`,
            content: '',
            parts: [
              { type: 'text', text: `Processing your message: "${content}"` },
              {
                type: 'tool_calls',
                calls: [
                  {
                    name: 'Grep',
                    input: { pattern: content.split(' ')[0] },
                    output: 'Search completed',
                    completed: true,
                    duration: 650,
                  },
                ],
              },
              { type: 'text', text: 'Here\'s what I found based on your request.' },
            ],
            timestamp: new Date(),
            senderName: 'Assistant',
            senderColor: '#6366f1',
          },
        ]);
        setIsThinking(false);
      }, 2000);
    }
  }, [isThinking]);

  const handleRemoveQueued = useCallback((id: string) => {
    setQueuedMessages(prev => prev.filter(m => m.id !== id));
  }, []);

  return (
    <ChatLayout
      header={<SampleHeader title="Interactive Demo" status={isThinking ? 'thinking' : 'connected'} />}
      isThinking={isThinking}
      thinkingIndicatorProps={{
        showEscapeHint: true,
      }}
      queuedMessages={queuedMessages}
      onRemoveQueuedMessage={handleRemoveQueued}
      chatInputProps={{
        placeholder: isThinking ? 'Type to queue message...' : 'Send a message...',
        onSubmit: handleSubmit,
      }}
    >
      <VirtualizedChatPanel messages={messages} />
    </ChatLayout>
  );
}

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Fully interactive demo. Send messages to see the full flow: user message → thinking → tool execution → response.',
      },
    },
  },
};

// =============================================================================
// 1-ON-1 MODE STORIES (SubtleEmphasis design)
// =============================================================================

/** 1-on-1 mode demo showing SubtleEmphasis design for AI conversations */
function OneOnOneModeDemo() {
  const messages: VirtualizedChatPanelMessage[] = [
    {
      id: '1',
      content: 'Hello! I need help understanding the new API.',
      timestamp: minutesAgo(8),
      senderName: 'You',
      senderColor: '#10b981',
      isOwn: true,
    },
    {
      id: '2',
      content: 'Of course! The API uses REST endpoints with JSON payloads. What specific aspect would you like to understand better?',
      timestamp: minutesAgo(7),
      senderName: 'Assistant',
      senderColor: '#6366f1',
    },
    {
      id: '3',
      content: 'How do I authenticate requests?',
      timestamp: minutesAgo(6),
      senderName: 'You',
      senderColor: '#10b981',
      isOwn: true,
    },
    {
      id: '4',
      content: 'Can I also get some code examples?',
      timestamp: minutesAgo(5),
      senderName: 'You',
      senderColor: '#10b981',
      isOwn: true,
      isConsecutive: true,
      enableEdit: true,
    },
    {
      id: '5',
      content: `Authentication is handled via bearer tokens. Here's how it works:

## Getting a Token

1. Register your application in the developer portal
2. Use client credentials flow to obtain access token
3. Include token in Authorization header

\`\`\`typescript
const response = await fetch('/api/resource', {
  headers: {
    'Authorization': \`Bearer \${accessToken}\`,
    'Content-Type': 'application/json'
  }
});
\`\`\`

The token expires after 1 hour, so you'll need to refresh it periodically.`,
      timestamp: minutesAgo(4),
      senderName: 'Assistant',
      senderColor: '#6366f1',
    },
    {
      id: '6',
      content: 'That makes sense. What about rate limiting?',
      timestamp: minutesAgo(2),
      senderName: 'You',
      senderColor: '#10b981',
      isOwn: true,
      enableEdit: true,
    },
    {
      id: '7',
      content: 'Rate limits are 100 requests per minute for standard tier, and 1000 for premium tier. The API returns 429 status when exceeded.',
      timestamp: minutesAgo(1),
      senderName: 'Assistant',
      senderColor: '#6366f1',
    },
  ];

  return (
    <ChatLayout
      mode="1on1"
      header={<SampleHeader title="AI Assistant" status="connected" />}
      chatInputProps={{
        placeholder: 'Message assistant...',
        onSubmit: () => {},
      }}
    >
      <VirtualizedChatPanel messages={messages} />
    </ChatLayout>
  );
}

export const OneOnOneMode: Story = {
  render: () => <OneOnOneModeDemo />,
  parameters: {
    docs: {
      description: {
        story: `
1-on-1 mode implements the SubtleEmphasis design for AI conversations.

**Visual Design:**
- User messages: Primary background tint, visually distinct
- Assistant messages: Transparent background
- Full-width, left-aligned layout (no SMS-style bubbles)
- No avatars or sender labels

**Interactive Features:**
- **Hover** over any message to see the toolbar (timestamp, copy, edit if enabled)
- **Tab** through messages to focus them (toolbar appears on focus)
- **Focus ring** visible on keyboard navigation

**Try It:**
1. Hover over a message to see timestamp and copy button
2. Press Tab to navigate between messages
3. User messages show edit button when \`enableEdit={true}\`
        `,
      },
    },
  },
};

// Empty state
export const EmptyState: Story = {
  render: () => {
    const emptyState = (
      <Stack direction="vertical" align="center" gap="md" style={{ padding: 'var(--space-10)' }}>
        <Text size="lg" color="soft">💬</Text>
        <Text weight="medium">No messages yet</Text>
        <Text size="sm" color="soft">Start a conversation by typing below</Text>
      </Stack>
    );

    return (
      <ChatLayout
        header={<SampleHeader title="New Conversation" status="connected" />}
        chatInputProps={{
          placeholder: 'Start typing...',
          onSubmit: () => {},
        }}
      >
        <VirtualizedChatPanel messages={[]} emptyState={emptyState} />
      </ChatLayout>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'ChatLayout with an empty message list showing the empty state.',
      },
    },
  },
};

// =============================================================================
// GROUP MODE STORIES
// =============================================================================

/** Sample participants for group mode */
const SAMPLE_PARTICIPANTS: ChatParticipant[] = [
  { id: 'user', name: 'You', initials: 'Y', color: '#10b981', isCurrentUser: true },
  { id: 'alice', name: 'Alice Chen', initials: 'AC', color: '#6366f1' },
  { id: 'bob', name: 'Bob Smith', initials: 'BS', color: '#f59e0b' },
  { id: 'carol', name: 'Carol Davis', initials: 'CD', color: '#ec4899' },
  { id: 'dan', name: 'Dan Wilson', initials: 'DW', color: '#8b5cf6' },
];

/** Group mode demo showing multi-participant chat */
function GroupModeDemo() {
  const participants = SAMPLE_PARTICIPANTS;
  const otherParticipants = participants.filter(p => !p.isCurrentUser);

  const messages: VirtualizedChatPanelMessage[] = [
    {
      id: '1',
      content: 'Hey everyone! I wanted to discuss the new feature implementation.',
      timestamp: minutesAgo(10),
      senderName: 'Alice Chen',
      senderColor: '#6366f1',
      isOwn: false,
    },
    {
      id: '2',
      content: 'Sounds good! What did you have in mind?',
      timestamp: minutesAgo(9),
      senderName: 'Bob Smith',
      senderColor: '#f59e0b',
      isOwn: false,
    },
    {
      id: '3',
      content: 'I think we should start with the API design.',
      timestamp: minutesAgo(8),
      senderName: 'Alice Chen',
      senderColor: '#6366f1',
      isOwn: false,
      isConsecutive: true,
    },
    {
      id: '4',
      content: 'Here are my thoughts on the implementation.',
      timestamp: minutesAgo(7),
      senderName: 'You',
      senderColor: '#10b981',
      isOwn: true,
      enableEdit: true,
    },
    {
      id: '5',
      content: 'We could use a REST API or GraphQL. I prefer REST for simplicity.',
      timestamp: minutesAgo(6),
      senderName: 'You',
      senderColor: '#10b981',
      isOwn: true,
      isConsecutive: true,
    },
    {
      id: '6',
      content: 'Also, we should consider caching strategies.',
      timestamp: minutesAgo(5),
      senderName: 'You',
      senderColor: '#10b981',
      isOwn: true,
      isConsecutive: true,
    },
    {
      id: '7',
      content: 'Great points! I agree with the REST approach.',
      timestamp: minutesAgo(4),
      senderName: 'Carol Davis',
      senderColor: '#ec4899',
      isOwn: false,
    },
    {
      id: '8',
      content: 'Let me add some thoughts on the caching layer.',
      timestamp: minutesAgo(3),
      senderName: 'Dan Wilson',
      senderColor: '#8b5cf6',
      isOwn: false,
    },
    {
      id: '9',
      content: 'We should use Redis for session caching and an in-memory cache for frequently accessed data.',
      timestamp: minutesAgo(2),
      senderName: 'Dan Wilson',
      senderColor: '#8b5cf6',
      isOwn: false,
      isConsecutive: true,
    },
  ];

  return (
    <ChatLayout
      mode="group"
      participants={participants}
      header={
        <ChatGroupHeader
          participants={otherParticipants}
        />
      }
      chatInputProps={{
        placeholder: 'Message the group...',
        onSubmit: () => {},
      }}
    >
      <VirtualizedChatPanel messages={messages} />
    </ChatLayout>
  );
}

export const GroupMode: Story = {
  render: () => <GroupModeDemo />,
  parameters: {
    docs: {
      description: {
        story: `
Group mode displays messages with participant avatars, sender names, and visual distinction between the current user and others.

**Visual Design:**
- Colored avatars with initials for each participant
- Sender name appears above message content
- User messages: Primary background tint
- Other participants: Transparent background
- Consecutive messages collapse (avatar/name hidden)
- Header shows stacked participant avatars

**Interactive Features:**
- **Hover** over any message to see the toolbar (timestamp, copy button)
- **Tab** through messages to focus them (toolbar appears on focus)
- **Focus ring** visible on keyboard navigation (not mouse click)
- **Edit button** shows on user messages with \`enableEdit={true}\`

**Try It:**
1. Hover over any message to see the timestamp
2. Click the copy button to copy message text
3. Press Tab to navigate between messages
4. Notice avatar/name hiding on consecutive messages from same sender
        `,
      },
    },
  },
};

/** Group mode with many participants to show overflow */
function GroupModeOverflowDemo() {
  const participants = SAMPLE_PARTICIPANTS;
  const otherParticipants = participants.filter(p => !p.isCurrentUser);

  const messages: VirtualizedChatPanelMessage[] = [
    {
      id: '1',
      content: 'Welcome to the team chat!',
      timestamp: minutesAgo(5),
      senderName: 'Alice Chen',
      senderColor: '#6366f1',
      isOwn: false,
    },
    {
      id: '2',
      content: 'Thanks for having me!',
      timestamp: minutesAgo(4),
      senderName: 'You',
      senderColor: '#10b981',
      isOwn: true,
    },
  ];

  return (
    <ChatLayout
      mode="group"
      participants={participants}
      header={
        <ChatGroupHeader
          participants={otherParticipants}
          maxAvatars={3}
        />
      }
      chatInputProps={{
        placeholder: 'Message the group...',
        onSubmit: () => {},
      }}
    >
      <VirtualizedChatPanel messages={messages} />
    </ChatLayout>
  );
}

export const GroupModeWithOverflow: Story = {
  render: () => <GroupModeOverflowDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Group mode with more than 3 participants, showing the "+N others" overflow indicator in the header.',
      },
    },
  },
};
