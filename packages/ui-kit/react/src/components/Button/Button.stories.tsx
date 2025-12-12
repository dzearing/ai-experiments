import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

// Simple icon components for stories
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8 1v2M8 13v2M1 8h2M13 8h2M2.93 2.93l1.41 1.41M11.66 11.66l1.41 1.41M2.93 13.07l1.41-1.41M11.66 4.34l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const meta: Meta<typeof Button> = {
  title: 'Actions/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Buttons trigger actions or events. Use them for form submissions, dialog triggers, and navigation actions.

## Variants

| Variant | Use Case |
|---------|----------|
| \`primary\` | Main call-to-action, one per section |
| \`default\` | Secondary actions |
| \`danger\` | Destructive actions (delete, remove) |
| \`ghost\` | Tertiary actions, minimal visual weight |
| \`outline\` | Alternative to default with border emphasis |

## Sizes

- **sm**: Compact UI, toolbars, inline actions
- **md**: Default size for most use cases
- **lg**: Hero sections, prominent CTAs

## With Icons

- Use \`icon\` prop for leading icons (add, create actions)
- Use \`iconAfter\` for trailing icons (arrows, external links)
- Use \`iconOnly\` with \`aria-label\` for icon-only buttons

## As Link

Use \`as="a"\` with \`href\` to render the button as a navigation link while preserving button styling:

\`\`\`tsx
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
    iconOnly: {
      control: 'boolean',
      description: 'Icon-only mode (square button, requires aria-label)',
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
    icon: <PlusIcon />,
    variant: 'primary',
  },
};

export const WithIconAfter: Story = {
  args: {
    children: 'Continue',
    iconAfter: <ArrowRightIcon />,
    variant: 'primary',
  },
};

export const IconOnly: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <Button iconOnly icon={<PlusIcon />} aria-label="Add" />
      <Button iconOnly icon={<PlusIcon />} variant="primary" aria-label="Add" />
      <Button iconOnly icon={<CloseIcon />} variant="danger" aria-label="Delete" />
      <Button iconOnly icon={<SettingsIcon />} variant="ghost" aria-label="Settings" />
    </div>
  ),
};

export const IconOnlySizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <Button iconOnly size="sm" icon={<PlusIcon />} aria-label="Small" />
      <Button iconOnly size="md" icon={<PlusIcon />} aria-label="Medium" />
      <Button iconOnly size="lg" icon={<PlusIcon />} aria-label="Large" />
    </div>
  ),
};

export const ButtonsWithIcons: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Button icon={<PlusIcon />}>Add Item</Button>
        <Button icon={<PlusIcon />} variant="primary">Add Item</Button>
        <Button icon={<CloseIcon />} variant="danger">Delete</Button>
      </div>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Button iconAfter={<ArrowRightIcon />}>Next</Button>
        <Button iconAfter={<ArrowRightIcon />} variant="primary">Continue</Button>
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
      <Button as="a" href="#docs" variant="ghost" iconAfter={<ArrowRightIcon />}>
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
