import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { CopyButton } from './CopyButton';
import { Stack } from '../Stack';
import { Text } from '../Text';
import { Card } from '../Card';

const meta = {
  title: 'Actions/CopyButton',
  component: CopyButton,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A button that copies content to the clipboard with visual feedback.

## When to Use

- Copying code snippets or text blocks
- Copying URLs, IDs, or other short values
- Any scenario where users need to copy content to clipboard

## Modes

| Mode | Props | Description |
|------|-------|-------------|
| Icon-only | No \`children\` | Renders as IconButton with tooltip |
| Labeled | With \`children\` | Renders as Button with icon and label |

## Variants

Inherits variants from Button:

| Variant | Use Case |
|---------|----------|
| \`ghost\` | Default, subtle appearance for inline use |
| \`default\` | Standard button appearance |
| \`primary\` | Emphasized copy action |

## Content Sources

| Prop | Description |
|------|-------------|
| \`content\` | Static string to copy |
| \`getContent\` | Callback that returns string (sync or async) |

## Feedback

After copying:
- Icon changes from copy to checkmark
- Tooltip shows "Copied!"
- Reverts after \`feedbackDuration\` ms (default: 2000)

## Accessibility

- Uses \`aria-label\` for icon-only mode (defaults to "Copy to clipboard")
- Tooltip shows current state
- Keyboard accessible (Enter/Space to activate)

## Usage

\`\`\`tsx
import { CopyButton } from '@ui-kit/react';

// Icon-only mode
<CopyButton content="Text to copy" aria-label="Copy code" />

// With label
<CopyButton content="Text to copy">Copy</CopyButton>

// Dynamic content
<CopyButton getContent={() => generateContent()}>Copy All</CopyButton>

// With callbacks
<CopyButton
  content="text"
  onCopy={() => console.log('Copied!')}
  onError={(err) => console.error(err)}
/>
\`\`\`
        `,
      },
    },
  },
  args: {
    onCopy: fn(),
    onError: fn(),
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['ghost', 'default', 'primary', 'danger'],
      description: 'Visual style variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size variant matching control heights',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled',
    },
    content: {
      control: 'text',
      description: 'Static content to copy',
    },
    feedbackDuration: {
      control: 'number',
      description: 'Duration to show "Copied!" feedback in milliseconds',
    },
    onCopy: {
      table: { disable: true },
    },
    onError: {
      table: { disable: true },
    },
  },
} satisfies Meta<typeof CopyButton>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default story - icon-only mode
export const Default: Story = {
  args: {
    content: 'Hello, World!',
    'aria-label': 'Copy to clipboard',
  },
};

// With label
export const WithLabel: Story = {
  args: {
    content: 'Hello, World!',
    children: 'Copy',
  },
};

// Copy All variant
export const CopyAll: Story = {
  args: {
    content: 'Line 1\nLine 2\nLine 3',
    children: 'Copy All',
  },
  parameters: {
    docs: {
      description: {
        story: 'Common pattern for copying multiple items or lines of content.',
      },
    },
  },
};

// All sizes
export const Sizes: Story = {
  render: () => (
    <Stack direction="horizontal" gap="md" align="center">
      <CopyButton content="Small" size="sm" aria-label="Copy (small)" />
      <CopyButton content="Medium" size="md" aria-label="Copy (medium)" />
      <CopyButton content="Large" size="lg" aria-label="Copy (large)" />
    </Stack>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Heights match other controls (28px/36px/44px) for consistent alignment.',
      },
    },
  },
};

// Sizes with labels
export const SizesWithLabels: Story = {
  render: () => (
    <Stack direction="horizontal" gap="md" align="center">
      <CopyButton content="Small" size="sm">Copy</CopyButton>
      <CopyButton content="Medium" size="md">Copy</CopyButton>
      <CopyButton content="Large" size="lg">Copy</CopyButton>
    </Stack>
  ),
};

// All variants
export const Variants: Story = {
  render: () => (
    <Stack direction="horizontal" gap="md" align="center">
      <CopyButton content="Ghost" variant="ghost">Ghost</CopyButton>
      <CopyButton content="Default" variant="default">Default</CopyButton>
      <CopyButton content="Primary" variant="primary">Primary</CopyButton>
    </Stack>
  ),
};

// Disabled state
export const Disabled: Story = {
  render: () => (
    <Stack direction="horizontal" gap="md" align="center">
      <CopyButton content="Disabled" disabled aria-label="Copy (disabled)" />
      <CopyButton content="Disabled" disabled>Copy</CopyButton>
    </Stack>
  ),
};

// Dynamic content with getContent
export const DynamicContent: Story = {
  render: () => (
    <CopyButton
      getContent={() => `Copied at ${new Date().toISOString()}`}
    >
      Copy Timestamp
    </CopyButton>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Use `getContent` callback to generate content dynamically when the button is clicked.',
      },
    },
  },
};

// Async content
export const AsyncContent: Story = {
  render: () => (
    <CopyButton
      getContent={async () => {
        // Simulate async operation
        await new Promise((resolve) => setTimeout(resolve, 100));
        return 'Async content loaded!';
      }}
    >
      Copy (Async)
    </CopyButton>
  ),
  parameters: {
    docs: {
      description: {
        story: 'The `getContent` callback can return a Promise for async content generation.',
      },
    },
  },
};

// In context - code block
export const InCodeBlock: Story = {
  render: () => (
    <Card style={{ position: 'relative', padding: 'var(--space-4)' }}>
      <div style={{ position: 'absolute', top: 'var(--space-2)', right: 'var(--space-2)' }}>
        <CopyButton
          content={`const greeting = "Hello, World!";\nconsole.log(greeting);`}
          aria-label="Copy code"
        />
      </div>
      <pre style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}>
        <code>{`const greeting = "Hello, World!";\nconsole.log(greeting);`}</code>
      </pre>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Common use case: copy button positioned in the corner of a code block.',
      },
    },
  },
};

// In context - inline with content
export const InlineWithContent: Story = {
  render: () => (
    <Stack direction="horizontal" gap="sm" align="center">
      <Text size="sm" color="soft">ID:</Text>
      <Text size="sm" weight="medium" style={{ fontFamily: 'var(--font-mono)' }}>
        abc-123-def-456
      </Text>
      <CopyButton content="abc-123-def-456" aria-label="Copy ID" size="sm" />
    </Stack>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Icon-only copy button inline with content, using small size for compact UI.',
      },
    },
  },
};

// Custom feedback duration
export const CustomFeedbackDuration: Story = {
  args: {
    content: 'Quick feedback',
    feedbackDuration: 500,
    children: 'Copy (500ms feedback)',
  },
  parameters: {
    docs: {
      description: {
        story: 'Customize how long the "Copied!" feedback is shown with `feedbackDuration` prop.',
      },
    },
  },
};
