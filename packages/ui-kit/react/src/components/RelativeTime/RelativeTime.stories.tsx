import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useState } from 'react';
import { RelativeTime } from './RelativeTime';

const meta = {
  title: 'Data Display/RelativeTime',
  component: RelativeTime,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Displays timestamps as human-readable relative time strings that automatically update.

## Features

- **Auto-updating**: Updates as time passes with smart intervals
- **Format variants**: narrow ("5m"), short ("5 mins ago"), long ("5 minutes ago")
- **Tooltip**: Shows full timestamp on hover
- **Semantic HTML**: Uses \`<time>\` element with \`datetime\` attribute

## Usage

\`\`\`tsx
import { RelativeTime } from '@ui-kit/react';

// Basic usage
<RelativeTime timestamp={message.createdAt} />

// With format options
<RelativeTime timestamp={date} format="long" />

// Static (no auto-update)
<RelativeTime timestamp={date} static />
\`\`\`

## Update Intervals

The component uses smart intervals based on timestamp age:
- Under 1 minute: updates every 10 seconds
- Under 1 hour: updates every minute
- Under 1 day: updates every 5 minutes
- Older: updates every hour
        `,
      },
    },
  },
  argTypes: {
    timestamp: {
      control: 'date',
      description: 'Timestamp to display',
    },
    format: {
      control: 'select',
      options: ['narrow', 'short', 'long'],
      description: 'Display format style',
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'base', 'lg'],
      description: 'Text size',
    },
    color: {
      control: 'select',
      options: ['default', 'soft', 'inherit'],
      description: 'Text color',
    },
    static: {
      control: 'boolean',
      description: 'Disable auto-updates',
    },
    showTooltip: {
      control: 'boolean',
      description: 'Show full timestamp tooltip on hover',
    },
  },
} satisfies Meta<typeof RelativeTime>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic story with recent timestamp
export const Default: Story = {
  args: {
    timestamp: Date.now() - 5 * 60 * 1000, // 5 minutes ago
  },
};

// All format variants side by side
export const Formats: Story = {
  render: () => {
    const timestamp = Date.now() - 5 * 60 * 1000;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div>
          <strong>Narrow:</strong> <RelativeTime timestamp={timestamp} format="narrow" />
        </div>
        <div>
          <strong>Short:</strong> <RelativeTime timestamp={timestamp} format="short" />
        </div>
        <div>
          <strong>Long:</strong> <RelativeTime timestamp={timestamp} format="long" />
        </div>
      </div>
    );
  },
};

// Demo showing live updates
const LiveUpdateDemo = () => {
  const [startTime] = useState(() => Date.now());
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <p>This demo started at: <strong>{new Date(startTime).toLocaleTimeString()}</strong></p>
      <p>Current relative time: <RelativeTime timestamp={startTime} format="long" /></p>
      <p style={{ fontSize: '12px', color: 'var(--base-fg-softer)' }}>
        Watch as the time updates automatically. Try hovering to see the tooltip.
      </p>
    </div>
  );
};

export const LiveUpdate: Story = {
  render: () => <LiveUpdateDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Watch the timestamp update automatically as time passes.',
      },
    },
  },
};

// Static mode (no updates)
export const Static: Story = {
  args: {
    timestamp: Date.now() - 5 * 60 * 1000,
    static: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Use `static` prop to disable auto-updates for timestamps that won\'t change.',
      },
    },
  },
};

// Various timestamp ages
export const TimestampAges: Story = {
  render: () => {
    const now = Date.now();
    const timestamps = [
      { label: 'Just now', time: now - 30 * 1000 },
      { label: '5 minutes ago', time: now - 5 * 60 * 1000 },
      { label: '1 hour ago', time: now - 60 * 60 * 1000 },
      { label: '3 hours ago', time: now - 3 * 60 * 60 * 1000 },
      { label: 'Yesterday', time: now - 24 * 60 * 60 * 1000 },
      { label: '3 days ago', time: now - 3 * 24 * 60 * 60 * 1000 },
      { label: '1 week ago', time: now - 7 * 24 * 60 * 60 * 1000 },
      { label: '1 month ago', time: now - 30 * 24 * 60 * 60 * 1000 },
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {timestamps.map(({ label, time }) => (
          <div key={label} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <span style={{ width: '120px', color: 'var(--base-fg-softer)' }}>{label}:</span>
            <RelativeTime timestamp={time} />
          </div>
        ))}
      </div>
    );
  },
};

// Size variants
export const Sizes: Story = {
  render: () => {
    const timestamp = Date.now() - 5 * 60 * 1000;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div><strong>xs:</strong> <RelativeTime timestamp={timestamp} size="xs" /></div>
        <div><strong>sm:</strong> <RelativeTime timestamp={timestamp} size="sm" /></div>
        <div><strong>base:</strong> <RelativeTime timestamp={timestamp} size="base" /></div>
        <div><strong>lg:</strong> <RelativeTime timestamp={timestamp} size="lg" /></div>
      </div>
    );
  },
};

// Color variants
export const Colors: Story = {
  render: () => {
    const timestamp = Date.now() - 5 * 60 * 1000;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div><strong>default:</strong> <RelativeTime timestamp={timestamp} color="default" /></div>
        <div><strong>soft:</strong> <RelativeTime timestamp={timestamp} color="soft" /></div>
        <div style={{ color: 'blue' }}><strong>inherit:</strong> <RelativeTime timestamp={timestamp} color="inherit" /></div>
      </div>
    );
  },
};

// Without tooltip
export const WithoutTooltip: Story = {
  args: {
    timestamp: Date.now() - 5 * 60 * 1000,
    showTooltip: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Use `showTooltip={false}` to hide the hover tooltip.',
      },
    },
  },
};

// Custom tooltip format
export const CustomTooltipFormat: Story = {
  args: {
    timestamp: Date.now() - 5 * 60 * 1000,
    tooltipFormat: (date) => `Created on ${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`,
  },
  parameters: {
    docs: {
      description: {
        story: 'Use `tooltipFormat` prop to customize the tooltip content.',
      },
    },
  },
};

// In context - message timestamp
export const InMessageContext: Story = {
  render: () => {
    const messages = [
      { id: 1, user: 'Alice', text: 'Hey, how are you?', time: Date.now() - 2 * 60 * 1000 },
      { id: 2, user: 'Bob', text: 'I\'m good! Working on the new feature.', time: Date.now() - 90 * 1000 },
      { id: 3, user: 'Alice', text: 'Nice! Let me know if you need help.', time: Date.now() - 30 * 1000 },
    ];

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        maxWidth: '400px',
        padding: '16px',
        background: 'var(--soft-bg)',
        borderRadius: '8px',
      }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>{msg.user}</strong>
              <RelativeTime timestamp={msg.time} size="xs" color="soft" />
            </div>
            <p style={{ margin: 0 }}>{msg.text}</p>
          </div>
        ))}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Example of RelativeTime used in a chat message list context.',
      },
    },
  },
};

// Future timestamps
export const FutureTimestamps: Story = {
  render: () => {
    const now = Date.now();
    const timestamps = [
      { label: 'In a moment', time: now + 30 * 1000 },
      { label: 'In 5 minutes', time: now + 5 * 60 * 1000 },
      { label: 'Tomorrow', time: now + 24 * 60 * 60 * 1000 },
      { label: 'In 3 days', time: now + 3 * 24 * 60 * 60 * 1000 },
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {timestamps.map(({ label, time }) => (
          <div key={label} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <span style={{ width: '120px', color: 'var(--base-fg-softer)' }}>{label}:</span>
            <RelativeTime timestamp={time} />
          </div>
        ))}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'RelativeTime also handles future timestamps gracefully.',
      },
    },
  },
};
