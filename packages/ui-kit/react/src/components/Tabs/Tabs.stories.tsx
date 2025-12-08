import type { Meta, StoryObj } from '@storybook/react';
import { Tabs } from './Tabs';

const meta = {
  title: 'Navigation/Tabs',
  component: Tabs,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Tabbed interface for switching between related views or content sections.

## When to Use

- Organizing related content into sections
- Switching between views without navigation
- Settings pages with multiple categories

## Variants

| Variant | Use Case |
|---------|----------|
| **default** | Standard tab appearance |
| **pills** | Rounded, button-like tabs |
| **underline** | Minimal, underlined active state |

## Usage

\`\`\`jsx
<Tabs
  items={[
    { value: 'tab1', label: 'First', content: <div>Content 1</div> },
    { value: 'tab2', label: 'Second', content: <div>Content 2</div> },
  ]}
  defaultValue="tab1"
/>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

const items = [
  { value: 'overview', label: 'Overview', content: <div>Overview content goes here.</div> },
  { value: 'features', label: 'Features', content: <div>Features content goes here.</div> },
  { value: 'pricing', label: 'Pricing', content: <div>Pricing content goes here.</div> },
];

export const Default: Story = {
  args: {
    items,
    defaultValue: 'overview',
  },
};

export const Pills: Story = {
  args: {
    items,
    defaultValue: 'overview',
    variant: 'pills',
  },
};

export const Underline: Story = {
  args: {
    items,
    defaultValue: 'features',
    variant: 'underline',
  },
};

export const WithDisabled: Story = {
  args: {
    items: [
      ...items,
      { value: 'settings', label: 'Settings', content: <div>Settings</div>, disabled: true },
    ],
    defaultValue: 'overview',
  },
};

export const ManyTabs: Story = {
  args: {
    items: [
      { value: 'tab1', label: 'Tab 1', content: <div>Content 1</div> },
      { value: 'tab2', label: 'Tab 2', content: <div>Content 2</div> },
      { value: 'tab3', label: 'Tab 3', content: <div>Content 3</div> },
      { value: 'tab4', label: 'Tab 4', content: <div>Content 4</div> },
      { value: 'tab5', label: 'Tab 5', content: <div>Content 5</div> },
    ],
    defaultValue: 'tab1',
  },
};
