import type { Meta, StoryObj } from '@storybook/react';
import { Slider } from './Slider';

const meta: Meta<typeof Slider> = {
  title: 'Inputs/Slider',
  component: Slider,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Slider for selecting a numeric value within a range.

## When to Use

- Selecting a value within a continuous range
- Volume, brightness, or percentage controls
- When visual feedback of position is helpful

## Slider vs Input[type="number"]

| Component | Use Case |
|-----------|----------|
| **Slider** | Approximate values, visual feedback needed |
| **Number Input** | Precise values, keyboard entry preferred |

## Configuration

- **min/max**: Define the value range
- **step**: Control increment precision (default: 1)
- **fullWidth**: Expand to fill container
        `,
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    fullWidth: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
    min: {
      control: 'number',
    },
    max: {
      control: 'number',
    },
    step: {
      control: 'number',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    defaultValue: 50,
    min: 0,
    max: 100,
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '300px' }}>
      <Slider size="sm" defaultValue={30} />
      <Slider size="md" defaultValue={50} />
      <Slider size="lg" defaultValue={70} />
    </div>
  ),
};

export const WithSteps: Story = {
  args: {
    defaultValue: 50,
    min: 0,
    max: 100,
    step: 10,
  },
};

export const Disabled: Story = {
  args: {
    defaultValue: 50,
    disabled: true,
  },
};

export const FullWidth: Story = {
  args: {
    defaultValue: 50,
    fullWidth: true,
  },
};

export const MinMax: Story = {
  args: {
    defaultValue: 25,
    min: 0,
    max: 50,
  },
};

export const VolumeControl: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '300px' }}>
      <span>Volume</span>
      <Slider fullWidth defaultValue={75} min={0} max={100} />
      <span>75%</span>
    </div>
  ),
};
