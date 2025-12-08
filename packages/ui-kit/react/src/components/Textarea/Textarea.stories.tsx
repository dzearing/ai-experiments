import type { Meta, StoryObj } from '@storybook/react';
import { Textarea } from './Textarea';

const meta: Meta<typeof Textarea> = {
  title: 'Inputs/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Multi-line text input for longer content like comments, descriptions, or messages.

## When to Use

- Collecting multi-line text (comments, descriptions, feedback)
- Content that typically spans multiple lines
- Free-form text entry

## Input vs Textarea

| Component | Use Case |
|-----------|----------|
| **Input** | Single-line text (names, emails, short answers) |
| **Textarea** | Multi-line text (comments, descriptions, messages) |

## Features

- **Auto-resize**: Set \`autoResize\` to grow with content
- **Custom rows**: Control initial height with \`rows\` prop
- **Full width**: Expand to container with \`fullWidth\`
        `,
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    error: {
      control: 'boolean',
    },
    fullWidth: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
    autoResize: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter your message...',
    size: 'md',
  },
};

export const WithValue: Story = {
  args: {
    value: 'This is a multi-line\ntextarea with some\ncontent in it.',
    size: 'md',
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Textarea size="sm" placeholder="Small textarea" />
      <Textarea size="md" placeholder="Medium textarea" />
      <Textarea size="lg" placeholder="Large textarea" />
    </div>
  ),
};

export const Error: Story = {
  args: {
    placeholder: 'Invalid input',
    error: true,
  },
};

export const Disabled: Story = {
  args: {
    placeholder: 'Disabled textarea',
    disabled: true,
  },
};

export const FullWidth: Story = {
  args: {
    placeholder: 'Full width textarea',
    fullWidth: true,
  },
};

export const CustomRows: Story = {
  args: {
    placeholder: 'Textarea with 6 rows',
    rows: 6,
  },
};
