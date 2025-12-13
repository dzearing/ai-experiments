import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Chip } from './Chip';
import { Button } from '../Button';

const meta = {
  title: 'Data/Chip',
  component: Chip,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Compact element for tags, filters, or selections.

## When to Use

- Tags on content items
- Filter selections
- Multi-select values
- Category labels

## Variants

| Variant | Use Case |
|---------|----------|
| **default** | Subtle, standard tags |
| **primary** | Emphasized selections |
| **outline** | Bordered, minimal style |

## Interactive Features

- **onClick**: Make chip selectable/toggleable
- **onRemove**: Add dismiss button for removable chips
- **selected**: Visual state for selected chips
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Chip',
  },
};

export const Primary: Story = {
  args: {
    children: 'Primary',
    variant: 'primary',
  },
};

export const Outline: Story = {
  args: {
    children: 'Outline',
    variant: 'outline',
  },
};

export const Clickable: Story = {
  render: () => {
    const [selected, setSelected] = useState(false);
    return (
      <Chip selected={selected} onClick={() => setSelected(!selected)}>
        Click me
      </Chip>
    );
  },
};

export const Removable: Story = {
  render: () => {
    const [visible, setVisible] = useState(true);
    if (!visible) return <Button size="sm" onClick={() => setVisible(true)}>Reset</Button>;
    return (
      <Chip onRemove={() => setVisible(false)}>
        Remove me
      </Chip>
    );
  },
};

export const WithIcon: Story = {
  args: {
    children: 'Settings',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
        <path d="M7 0l.9 2.6L10.5 2l-.6 2.5L12.5 5l-2 1.5.6 2.5L8.5 8l-.6 2.5L7 8l-1 2.5L5.5 8l-2.6 1 .6-2.5L1.5 5l2.5-.5L3.5 2l2.6.6L7 0z" />
      </svg>
    ),
  },
};

export const ChipGroup: Story = {
  render: () => {
    const [selected, setSelected] = useState<string[]>(['react']);
    const options = ['react', 'vue', 'angular', 'svelte'];
    return (
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {options.map((opt) => (
          <Chip
            key={opt}
            selected={selected.includes(opt)}
            onClick={() =>
              setSelected((prev) =>
                prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt]
              )
            }
          >
            {opt}
          </Chip>
        ))}
      </div>
    );
  },
};

export const Disabled: Story = {
  args: {
    children: 'Disabled',
    disabled: true,
  },
};
