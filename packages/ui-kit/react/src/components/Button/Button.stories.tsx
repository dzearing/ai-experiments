import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';
import { AddIcon } from '@ui-kit/icons/AddIcon';
import { CloseIcon } from '@ui-kit/icons/CloseIcon';
import { ArrowRightIcon } from '@ui-kit/icons/ArrowRightIcon';

const meta: Meta<typeof Button> = {
  title: 'Actions/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Clickable elements that trigger actions or navigate to different pages.

## When to Use

- Triggering actions like submitting forms, opening dialogs
- Primary and secondary actions in toolbars and forms
- Destructive actions requiring user confirmation
- Navigation to other pages when styled as a link

## Variants

| Variant | Use Case |
|---------|----------|
| \`primary\` | Main call-to-action, one per section |
| \`default\` | Secondary actions, less emphasis than primary |
| \`danger\` | Destructive actions (delete, remove, cancel) |
| \`ghost\` | Tertiary actions, minimal visual weight |
| \`outline\` | Alternative to default with border emphasis |

## Sizes

- **sm** (28px): Compact UI, toolbars, inline actions, tight spaces
- **md** (36px): Default size for most use cases and forms
- **lg** (44px): Hero sections, prominent CTAs, touch-friendly interfaces

## Shapes

| Shape | Description |
|-------|-------------|
| \`pill\` | Fully rounded corners (9999px radius) |

For icon-only buttons, use the \`IconButton\` component instead.

## Accessibility

- Uses semantic \`<button>\` element by default with proper type attribute
- Focus visible indicator for keyboard navigation (Tab to focus)
- Disabled state prevents interaction and updates ARIA state
- Icon-only buttons require \`aria-label\` for screen readers
- When used as link (\`as="a"\`), supports standard anchor behaviors

## Usage

\`\`\`tsx
import { Button } from '@ui-kit/react';

// Basic button
<Button onClick={handleClick}>
  Click Me
</Button>

// Primary action
<Button variant="primary" onClick={handleSubmit}>
  Submit
</Button>

// With icon
<Button icon={<AddIcon size={16} />} variant="primary">
  Add Item
</Button>

// Pill shape
<Button shape="pill">Pill Shape</Button>

// As navigation link
<Button as="a" href="/dashboard" variant="primary">
  Go to Dashboard
</Button>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    as: {
      control: 'select',
      options: ['button', 'a'],
      description: 'HTML element to render. Use "a" with href for navigation links styled as buttons.',
      table: {
        defaultValue: { summary: 'button' },
      },
    },
    variant: {
      control: 'select',
      options: ['default', 'primary', 'danger', 'ghost', 'outline'],
      description: 'Visual style variant',
      table: {
        defaultValue: { summary: 'default' },
      },
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Button size',
      table: {
        defaultValue: { summary: 'md' },
      },
    },
    fullWidth: {
      control: 'boolean',
      description: 'Expand button to fill container width',
    },
    shape: {
      control: 'select',
      options: [undefined, 'pill'],
      description: 'Button shape: pill (fully rounded). For icon-only buttons, use IconButton.',
      table: {
        defaultValue: { summary: 'undefined' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Disable button interaction',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Button',
    variant: 'default',
    size: 'md',
  },
};

export const Primary: Story = {
  args: {
    children: 'Primary Button',
    variant: 'primary',
  },
};

export const Danger: Story = {
  args: {
    children: 'Delete',
    variant: 'danger',
  },
};

export const Ghost: Story = {
  args: {
    children: 'Ghost Button',
    variant: 'ghost',
  },
};

export const Outline: Story = {
  args: {
    children: 'Outline Button',
    variant: 'outline',
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <Button variant="default">Default</Button>
      <Button variant="primary">Primary</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="outline">Outline</Button>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <Button disabled variant="default">Default</Button>
      <Button disabled variant="primary">Primary</Button>
      <Button disabled variant="danger">Danger</Button>
      <Button disabled variant="ghost">Ghost</Button>
      <Button disabled variant="outline">Outline</Button>
    </div>
  ),
};

export const FullWidth: Story = {
  args: {
    children: 'Full Width Button',
    fullWidth: true,
  },
};

// Icon examples

export const WithIcon: Story = {
  args: {
    children: 'Add Item',
    icon: <AddIcon size={16} />,
    variant: 'primary',
  },
};

export const WithIconAfter: Story = {
  args: {
    children: 'Continue',
    iconAfter: <ArrowRightIcon size={16} />,
    variant: 'primary',
  },
};

export const ButtonsWithIcons: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Button icon={<AddIcon size={16} />}>Add Item</Button>
        <Button icon={<AddIcon size={16} />} variant="primary">Add Item</Button>
        <Button icon={<CloseIcon size={16} />} variant="danger">Delete</Button>
      </div>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Button iconAfter={<ArrowRightIcon size={16} />}>Next</Button>
        <Button iconAfter={<ArrowRightIcon size={16} />} variant="primary">Continue</Button>
      </div>
    </div>
  ),
};

// As Link

export const AsLink: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <Button as="a" href="#dashboard" variant="primary">
        Go to Dashboard
      </Button>
      <Button as="a" href="#settings" variant="default">
        Settings
      </Button>
      <Button as="a" href="#docs" variant="ghost" iconAfter={<ArrowRightIcon size={16} />}>
        View Docs
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Use `as="a"` with `href` to render Button as a navigation link. Preserves all button styling while providing proper anchor semantics for navigation.',
      },
    },
  },
};

// Shape examples

export const PillShape: Story = {
  args: {
    children: 'Pill Button',
    shape: 'pill',
    variant: 'primary',
  },
};
