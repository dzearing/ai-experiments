import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardTitle, CardDescription } from './Card';
import { Button } from '../Button';

const meta: Meta<typeof Card> = {
  title: 'Layout/Card',
  component: Card,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Card component for grouping related content with consistent styling.

## When to Use

- Grouping related information
- Creating visual hierarchy
- Displaying summaries or previews
- Building dashboard layouts
- List items with rich content

## Compound Components

The Card component includes helper components for consistent structure:

| Component | Purpose |
|-----------|---------|
| \`Card\` | Main container with surface styling |
| \`CardTitle\` | Semantic heading for card content |
| \`CardDescription\` | Secondary text with reduced emphasis |

## Padding Sizes

Control the internal spacing of cards:

- **sm**: Compact spacing for dense layouts
- **md**: Default spacing for most use cases
- **lg**: Generous spacing for prominent content

## Card Surface

Cards use the \`card\` surface which provides:
- Background color with subtle elevation
- Border for definition
- Shadow for depth
- Text colors with proper contrast

## Usage

\`\`\`tsx
import { Card, CardTitle, CardDescription } from '@claude-flow/ui-kit-react';

<Card padding="md">
  <CardTitle>Card Title</CardTitle>
  <CardDescription>
    This is a description that provides additional context.
  </CardDescription>
  <p>More card content here...</p>
</Card>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    padding: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Internal padding size',
      table: {
        defaultValue: { summary: 'md' },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    padding: 'md',
    children: (
      <>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>
          This is a card with default medium padding.
        </CardDescription>
      </>
    ),
  },
};

export const WithTitle: Story = {
  render: () => (
    <Card>
      <CardTitle>Project Overview</CardTitle>
      <p style={{ margin: '12px 0 0 0' }}>
        This card demonstrates the basic structure with a title.
      </p>
    </Card>
  ),
};

export const WithTitleAndDescription: Story = {
  render: () => (
    <Card>
      <CardTitle>User Profile</CardTitle>
      <CardDescription>
        Manage your personal information and preferences
      </CardDescription>
      <div style={{ marginTop: '16px' }}>
        <Button size="sm">Edit profile</Button>
      </div>
    </Card>
  ),
};

export const PaddingSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
      <Card padding="sm">
        <CardTitle>Small Padding</CardTitle>
        <CardDescription>
          Compact spacing for dense layouts
        </CardDescription>
      </Card>

      <Card padding="md">
        <CardTitle>Medium Padding</CardTitle>
        <CardDescription>
          Default spacing for most use cases
        </CardDescription>
      </Card>

      <Card padding="lg">
        <CardTitle>Large Padding</CardTitle>
        <CardDescription>
          Generous spacing for prominent content
        </CardDescription>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Cards support three padding sizes to match different layout needs.',
      },
    },
  },
};

export const ComplexContent: Story = {
  render: () => (
    <Card style={{ maxWidth: '400px' }}>
      <CardTitle>Feature Announcement</CardTitle>
      <CardDescription>
        New capabilities added this week
      </CardDescription>

      <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <strong>Dark Mode</strong>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--card-text-soft)' }}>
            Toggle between light and dark themes
          </p>
        </div>

        <div>
          <strong>Keyboard Shortcuts</strong>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--card-text-soft)' }}>
            Navigate faster with keyboard commands
          </p>
        </div>

        <div>
          <strong>Export Options</strong>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--card-text-soft)' }}>
            Export your data in multiple formats
          </p>
        </div>
      </div>

      <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
        <Button size="sm">Learn more</Button>
        <Button size="sm">Dismiss</Button>
      </div>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Cards can contain complex layouts with multiple sections and interactive elements.',
      },
    },
  },
};

export const CardGrid: Story = {
  render: () => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
      gap: '16px',
    }}>
      <Card>
        <CardTitle>Total Users</CardTitle>
        <div style={{ fontSize: '32px', fontWeight: 'bold', margin: '12px 0' }}>
          1,284
        </div>
        <CardDescription>
          +12% from last month
        </CardDescription>
      </Card>

      <Card>
        <CardTitle>Revenue</CardTitle>
        <div style={{ fontSize: '32px', fontWeight: 'bold', margin: '12px 0' }}>
          $45,231
        </div>
        <CardDescription>
          +8% from last month
        </CardDescription>
      </Card>

      <Card>
        <CardTitle>Active Projects</CardTitle>
        <div style={{ fontSize: '32px', fontWeight: 'bold', margin: '12px 0' }}>
          23
        </div>
        <CardDescription>
          4 completed this week
        </CardDescription>
      </Card>

      <Card>
        <CardTitle>Avg Response Time</CardTitle>
        <div style={{ fontSize: '32px', fontWeight: 'bold', margin: '12px 0' }}>
          2.4s
        </div>
        <CardDescription>
          -15% from last month
        </CardDescription>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Cards work well in grid layouts for dashboards and data displays.',
      },
    },
  },
};

export const InteractiveCard: Story = {
  render: () => (
    <Card
      style={{
        maxWidth: '400px',
        cursor: 'pointer',
        transition: 'transform 150ms ease',
      }}
      onClick={() => alert('Card clicked!')}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <CardTitle>Clickable Card</CardTitle>
      <CardDescription>
        This card is interactive. Click anywhere to trigger an action.
      </CardDescription>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Cards can be made interactive by adding event handlers. Use semantic HTML (button/link) for accessibility when appropriate.',
      },
    },
  },
};

export const WithCustomStyling: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
      <Card style={{ borderLeft: '4px solid var(--success-border)' }}>
        <CardTitle>Success</CardTitle>
        <CardDescription>
          Card with custom border accent
        </CardDescription>
      </Card>

      <Card className="custom-card" data-testid="user-card" id="user-123">
        <CardTitle>Custom Card</CardTitle>
        <CardDescription>
          Supports className, style, id, and data attributes
        </CardDescription>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Cards support all standard HTML attributes for customization and testing.',
      },
    },
  },
};

export const ListOfCards: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '600px' }}>
      {[
        { title: 'Setup your profile', status: 'completed' },
        { title: 'Invite team members', status: 'completed' },
        { title: 'Create your first project', status: 'pending' },
        { title: 'Configure integrations', status: 'pending' },
      ].map((item, index) => (
        <Card key={index} padding="sm">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: item.status === 'completed'
                  ? 'var(--success-bg)'
                  : 'var(--control-bg)',
                border: '2px solid',
                borderColor: item.status === 'completed'
                  ? 'var(--success-border)'
                  : 'var(--control-border)',
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{
                textDecoration: item.status === 'completed' ? 'line-through' : 'none',
                opacity: item.status === 'completed' ? 0.7 : 1,
              }}>
                {item.title}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Cards can be used in lists to create structured, scannable content.',
      },
    },
  },
};
