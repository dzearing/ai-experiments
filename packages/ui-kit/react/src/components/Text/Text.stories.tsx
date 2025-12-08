import type { Meta, StoryObj } from '@storybook/react';
import { Text } from './Text';

const meta = {
  title: 'Typography/Text',
  component: Text,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Body text component with consistent styling and semantic flexibility.

## When to Use

- Body text, paragraphs, descriptions
- Labels and captions
- Any text that isn't a heading

## Text vs Heading

| Component | Use Case |
|-----------|----------|
| **Text** | Body content, labels, descriptions |
| **Heading** | Section titles, page headers |

## Features

- **size**: Control text size (xs through xl)
- **weight**: Font weight (normal, medium, semibold, bold)
- **color**: Text color (default, soft, inherit)
- **as**: Render as different HTML element (span, p, etc.)
- **truncate**: Single-line with ellipsis overflow
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'This is body text.',
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <Text size="xs">Extra small text (xs)</Text>
      <Text size="sm">Small text (sm)</Text>
      <Text size="base">Base text (base)</Text>
      <Text size="lg">Large text (lg)</Text>
      <Text size="xl">Extra large text (xl)</Text>
    </div>
  ),
};

export const Weights: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <Text weight="normal">Normal weight</Text>
      <Text weight="medium">Medium weight</Text>
      <Text weight="semibold">Semibold weight</Text>
      <Text weight="bold">Bold weight</Text>
    </div>
  ),
};

export const Colors: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <Text color="default">Default color</Text>
      <Text color="soft">Soft color</Text>
      <Text color="inherit">Inherit color (inherits from parent)</Text>
    </div>
  ),
};

export const AsParagraph: Story = {
  args: {
    as: 'p',
    children: 'This is rendered as a paragraph element. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  },
};

export const Truncated: Story = {
  render: () => (
    <div style={{ width: '200px' }}>
      <Text truncate>
        This is a very long text that will be truncated with an ellipsis when it exceeds the container width.
      </Text>
    </div>
  ),
};
