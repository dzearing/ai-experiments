import type { Meta, StoryObj } from '@storybook/react';
import { Avatar } from './Avatar';

const meta = {
  title: 'Data Display/Avatar',
  component: Avatar,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Visual representation of a user or entity.

## When to Use

- User profile displays
- Comment/message authors
- Team member lists
- Account menus

## Types

- **person** (default): Circular avatar for human users
- **bot**: Octagonal avatar for AI/bot entities

## Fallback Behavior

1. **Image**: Displays if \`src\` is provided and loads successfully
2. **Initials**: Extracted from \`fallback\` prop (e.g., "John Doe" → "JD")
3. **Custom**: Pass JSX (like an icon) to \`fallback\`

## Sizes

| Size | Use Case |
|------|----------|
| **xs** | Dense lists, inline mentions |
| **sm** | Comments, compact views |
| **md** | Standard lists (default) |
| **lg** | Profile cards |
| **xl** | Profile pages, hero sections |
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    fallback: 'John Doe',
  },
};

export const WithImage: Story = {
  args: {
    src: 'https://i.pravatar.cc/150?u=john',
    alt: 'John Doe',
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <Avatar size="xs" fallback="JD" />
      <Avatar size="sm" fallback="JD" />
      <Avatar size="md" fallback="JD" />
      <Avatar size="lg" fallback="JD" />
      <Avatar size="xl" fallback="JD" />
    </div>
  ),
};

export const SquareAvatar: Story = {
  args: {
    fallback: 'AB',
    rounded: false,
  },
};

export const WithIcon: Story = {
  args: {
    fallback: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 10a4 4 0 100-8 4 4 0 000 8zm0 2c-4 0-7 2-7 4v2h14v-2c0-2-3-4-7-4z" />
      </svg>
    ),
  },
};

export const Group: Story = {
  render: () => (
    <div style={{ display: 'flex' }}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} style={{ marginLeft: i > 1 ? '-12px' : 0 }}>
          <Avatar
            src={`https://i.pravatar.cc/150?u=user${i}`}
            alt={`User ${i}`}
            size="md"
          />
        </div>
      ))}
    </div>
  ),
};

// Collaboration colors that exercise text contrast
const COLLABORATION_COLORS = [
  { color: '#FF6B6B', name: 'Red', initials: 'RD' },
  { color: '#4ECDC4', name: 'Teal', initials: 'TL' },
  { color: '#45B7D1', name: 'Blue', initials: 'BL' },
  { color: '#96CEB4', name: 'Green', initials: 'GR' },
  { color: '#FFEAA7', name: 'Yellow', initials: 'YW' },  // Light - needs dark text
  { color: '#DDA0DD', name: 'Plum', initials: 'PL' },
  { color: '#98D8C8', name: 'Mint', initials: 'MT' },
  { color: '#F7DC6F', name: 'Gold', initials: 'GD' },    // Light - needs dark text
];

export const CustomColors: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <p style={{ marginBottom: '12px', fontWeight: 500 }}>Collaboration Colors (auto-contrast text)</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {COLLABORATION_COLORS.map(({ color, name, initials }) => (
            <div key={color} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <Avatar color={color} fallback={initials} size="lg" />
              <span style={{ fontSize: '12px', opacity: 0.7 }}>{name}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p style={{ marginBottom: '12px', fontWeight: 500 }}>Size variations with color</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar size="xs" fallback="AB" color="#FF6B6B" />
          <Avatar size="sm" fallback="AB" color="#4ECDC4" />
          <Avatar size="md" fallback="AB" color="#FFEAA7" />
          <Avatar size="lg" fallback="AB" color="#45B7D1" />
          <Avatar size="xl" fallback="AB" color="#F7DC6F" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
The \`color\` prop allows custom background colors for avatars, useful for:
- Collaboration/multiplayer cursors and presence
- User-assigned colors in team settings
- Status indicators

**Auto-contrast text**: The component automatically calculates whether to use
white or black text based on the background color's luminance (WCAG formula).
Light backgrounds like Yellow and Gold will show dark text for readability.
        `,
      },
    },
  },
};

export const BotAvatar: Story = {
  args: {
    type: 'bot',
    fallback: 'AI',
  },
  parameters: {
    docs: {
      description: {
        story: 'Bot avatars use an octagonal shape to visually distinguish AI/bot entities from human users.',
      },
    },
  },
};

export const BotSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <Avatar type="bot" size="xs" fallback="AI" />
      <Avatar type="bot" size="sm" fallback="AI" />
      <Avatar type="bot" size="md" fallback="AI" />
      <Avatar type="bot" size="lg" fallback="AI" />
      <Avatar type="bot" size="xl" fallback="AI" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Bot avatars scale consistently across all size variants.',
      },
    },
  },
};

export const BotWithEmoji: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <Avatar type="bot" size="lg" fallback="🤖" />
      <Avatar type="bot" size="lg" fallback="🦉" />
      <Avatar type="bot" size="lg" fallback="💡" />
      <Avatar type="bot" size="lg" fallback="🧠" />
      <Avatar type="bot" size="lg" fallback="⭐" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Bot avatars work well with emoji fallbacks for visual variety.',
      },
    },
  },
};

export const PersonVsBot: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <p style={{ marginBottom: '12px', fontWeight: 500 }}>Person (circular)</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar type="person" size="lg" fallback="JD" />
          <Avatar type="person" size="lg" fallback="AB" color="#4ECDC4" />
          <Avatar type="person" size="lg" src="https://i.pravatar.cc/150?u=person" />
        </div>
      </div>
      <div>
        <p style={{ marginBottom: '12px', fontWeight: 500 }}>Bot (octagonal)</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar type="bot" size="lg" fallback="AI" />
          <Avatar type="bot" size="lg" fallback="🤖" color="#6366f1" />
          <Avatar type="bot" size="lg" fallback="FA" color="#10b981" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comparison of person (circular) and bot (octagonal) avatar types. The distinct shapes help users quickly identify human vs AI participants in conversations.',
      },
    },
  },
};
