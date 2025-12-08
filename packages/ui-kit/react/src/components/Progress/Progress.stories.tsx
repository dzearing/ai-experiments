import type { Meta, StoryObj } from '@storybook/react';
import { Progress } from './Progress';

const meta = {
  title: 'Feedback/Progress',
  component: Progress,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Progress bar showing completion status of an operation.

## When to Use

- File uploads
- Form completion
- Multi-step processes
- Loading large data sets

## Progress vs Spinner

| Component | Use Case |
|-----------|----------|
| **Progress** | Known duration, show percentage |
| **Spinner** | Unknown duration, indeterminate |

## Features

- **showLabel**: Display percentage or custom label
- **indeterminate**: Animated bar for unknown duration
- **variants**: Color coding for success/warning/error states
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: 60,
  },
};

export const WithLabel: Story = {
  args: {
    value: 75,
    showLabel: true,
  },
};

export const Small: Story = {
  args: {
    value: 40,
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    value: 80,
    size: 'lg',
  },
};

export const Success: Story = {
  args: {
    value: 100,
    variant: 'success',
    showLabel: true,
  },
};

export const Warning: Story = {
  args: {
    value: 50,
    variant: 'warning',
  },
};

export const Error: Story = {
  args: {
    value: 25,
    variant: 'error',
  },
};

export const Indeterminate: Story = {
  args: {
    value: 0,
    indeterminate: true,
  },
};

export const CustomFormat: Story = {
  args: {
    value: 750,
    max: 1000,
    showLabel: true,
    formatLabel: (value, max) => `${value} / ${max} MB`,
  },
};

export const ZeroProgress: Story = {
  args: {
    value: 0,
    showLabel: true,
  },
};

export const FullProgress: Story = {
  args: {
    value: 100,
    showLabel: true,
  },
};
