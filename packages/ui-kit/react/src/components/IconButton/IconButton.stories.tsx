import type { Meta, StoryObj } from '@storybook/react';
import { IconButton } from './IconButton';
import {
  AddIcon,
  CloseIcon,
  GearIcon,
  HeartIcon,
  TrashIcon,
  EditIcon,
  SearchIcon,
  MenuIcon,
} from '@ui-kit/icons';

const meta: Meta<typeof IconButton> = {
  title: 'Actions/IconButton',
  component: IconButton,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Icon-only button with automatic tooltip. The \`aria-label\` is required for accessibility and is automatically displayed as a tooltip on hover.

## When to Use

- Toolbar actions (edit, delete, settings)
- Compact UI where space is limited
- Secondary actions that don't need labels
- Icon-based navigation
- Modal/dialog close buttons

## Key Features

- **Automatic Tooltip**: The \`aria-label\` value is shown as a tooltip on hover
- **Required Accessibility**: TypeScript enforces \`aria-label\` to ensure screen reader support
- **Two Shapes**: \`square\` (default) or \`round\` (circular)

## Accessibility

\`\`\`tsx
// ✅ Correct - aria-label is required and shown as tooltip
<IconButton icon={<CloseIcon size={16} />} aria-label="Close" />

// ❌ TypeScript Error - missing aria-label
<IconButton icon={<CloseIcon size={16} />} />
\`\`\`

## Shapes

| Shape | Description |
|-------|-------------|
| \`square\` | Default - maintains button border radius |
| \`round\` | Fully circular (9999px radius), great for FABs |

## Variants

| Variant | Use Case |
|---------|----------|
| \`default\` | Standard actions |
| \`primary\` | Primary action in a group |
| \`danger\` | Destructive actions (delete, remove) |
| \`ghost\` | Minimal visual weight, tertiary actions |
| \`outline\` | Alternative to default with border emphasis |

## Sizes

- **sm** (28px × 28px): Compact toolbars, table actions
- **md** (36px × 36px): Default size for most use cases
- **lg** (44px × 44px): Touch-friendly, prominent actions

## Usage

\`\`\`tsx
import { IconButton } from '@claude-flow/ui-kit-react';

// Basic - tooltip shows "Close dialog" on hover
<IconButton
  icon={<CloseIcon size={16} />}
  aria-label="Close dialog"
  onClick={handleClose}
/>

// Round shape for floating action buttons
<IconButton
  icon={<AddIcon size={16} />}
  aria-label="Add item"
  shape="round"
  variant="primary"
/>

// Customize tooltip position
<IconButton
  icon={<EditIcon size={16} />}
  aria-label="Edit"
  tooltipPosition="bottom"
/>

// Disable tooltip (aria-label still works for screen readers)
<IconButton
  icon={<GearIcon size={16} />}
  aria-label="Settings"
  hideTooltip
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    icon: {
      description: 'The icon element to display',
    },
    'aria-label': {
      control: 'text',
      description: 'Accessible label for the button (REQUIRED). Also displayed as tooltip.',
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
      description: 'Button size (square dimensions)',
      table: {
        defaultValue: { summary: 'md' },
      },
    },
    shape: {
      control: 'select',
      options: ['square', 'round'],
      description: 'Button shape: square (default) or round (circular)',
      table: {
        defaultValue: { summary: 'square' },
      },
    },
    tooltipPosition: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right'],
      description: 'Position of the tooltip',
      table: {
        defaultValue: { summary: 'top' },
      },
    },
    hideTooltip: {
      control: 'boolean',
      description: 'Disable the tooltip (aria-label still applies for accessibility)',
      table: {
        defaultValue: { summary: 'false' },
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
    icon: <AddIcon size={16} />,
    'aria-label': 'Add item',
    variant: 'default',
    size: 'md',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <IconButton icon={<AddIcon size={16} />} aria-label="Default" variant="default" />
      <IconButton icon={<AddIcon size={16} />} aria-label="Primary" variant="primary" />
      <IconButton icon={<TrashIcon size={16} />} aria-label="Danger" variant="danger" />
      <IconButton icon={<GearIcon size={16} />} aria-label="Ghost" variant="ghost" />
      <IconButton icon={<EditIcon size={16} />} aria-label="Outline" variant="outline" />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <IconButton icon={<AddIcon size={16} />} aria-label="Small" size="sm" />
      <IconButton icon={<AddIcon size={16} />} aria-label="Medium" size="md" />
      <IconButton icon={<AddIcon size={16} />} aria-label="Large" size="lg" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'IconButton maintains square proportions at all sizes for consistent icon display.',
      },
    },
  },
};

export const Disabled: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <IconButton icon={<AddIcon size={16} />} aria-label="Default disabled" variant="default" disabled />
      <IconButton icon={<AddIcon size={16} />} aria-label="Primary disabled" variant="primary" disabled />
      <IconButton icon={<TrashIcon size={16} />} aria-label="Danger disabled" variant="danger" disabled />
      <IconButton icon={<GearIcon size={16} />} aria-label="Ghost disabled" variant="ghost" disabled />
      <IconButton icon={<EditIcon size={16} />} aria-label="Outline disabled" variant="outline" disabled />
    </div>
  ),
};

export const CommonActions: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px' }}>
      <IconButton icon={<EditIcon size={16} />} aria-label="Edit" />
      <IconButton icon={<TrashIcon size={16} />} aria-label="Delete" variant="danger" />
      <IconButton icon={<GearIcon size={16} />} aria-label="Settings" />
      <IconButton icon={<CloseIcon size={16} />} aria-label="Close" variant="ghost" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Common icon button patterns for typical application actions.',
      },
    },
  },
};

export const Toolbar: Story = {
  render: () => (
    <div style={{
      display: 'flex',
      gap: '4px',
      padding: '8px',
      background: 'var(--panel-bg)',
      border: '1px solid var(--panel-border)',
      borderRadius: '6px',
      width: 'fit-content'
    }}>
      <IconButton icon={<EditIcon size={16} />} aria-label="Edit" size="sm" variant="ghost" />
      <IconButton icon={<CloseIcon size={16} />} aria-label="Delete" size="sm" variant="ghost" />
      <IconButton icon={<GearIcon size={16} />} aria-label="Settings" size="sm" variant="ghost" />
      <div style={{ width: '1px', background: 'var(--panel-border)', margin: '4px 4px' }} />
      <IconButton icon={<SearchIcon size={16} />} aria-label="Search" size="sm" variant="ghost" />
      <IconButton icon={<HeartIcon size={16} />} aria-label="Favorite" size="sm" variant="ghost" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'IconButtons with ghost variant and small size work well in toolbars and compact interfaces.',
      },
    },
  },
};

export const CardActions: Story = {
  render: () => (
    <div style={{
      maxWidth: '300px',
      padding: '16px',
      background: 'var(--card-bg)',
      border: '1px solid var(--card-border)',
      borderRadius: '8px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
        <h3 style={{ margin: 0 }}>Card Title</h3>
        <div style={{ display: 'flex', gap: '4px' }}>
          <IconButton icon={<EditIcon size={16} />} aria-label="Edit card" size="sm" variant="ghost" />
          <IconButton icon={<TrashIcon size={16} />} aria-label="Delete card" size="sm" variant="ghost" />
        </div>
      </div>
      <p style={{ margin: 0, color: 'var(--card-text-soft)' }}>
        Card content with action buttons in the header.
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Small ghost IconButtons are perfect for card header actions without overwhelming the content.',
      },
    },
  },
};

export const DialogHeader: Story = {
  render: () => (
    <div style={{
      width: '400px',
      background: 'var(--panel-bg)',
      border: '1px solid var(--panel-border)',
      borderRadius: '8px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px',
        borderBottom: '1px solid var(--panel-border)'
      }}>
        <h2 style={{ margin: 0, fontSize: '18px' }}>Dialog Title</h2>
        <IconButton icon={<CloseIcon size={16} />} aria-label="Close dialog" variant="ghost" />
      </div>
      <div style={{ padding: '16px' }}>
        Dialog content goes here...
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'IconButton with ghost variant is commonly used for dialog/modal close buttons.',
      },
    },
  },
};

export const FloatingActions: Story = {
  render: () => (
    <div style={{ position: 'relative', height: '300px', background: 'var(--page-bg)', borderRadius: '8px', padding: '16px' }}>
      <p>Page content here...</p>

      <div style={{
        position: 'absolute',
        bottom: '16px',
        right: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <IconButton icon={<AddIcon size={16} />} aria-label="Add new item" variant="primary" size="lg" shape="round" />
        <IconButton icon={<SearchIcon size={16} />} aria-label="Search" variant="default" shape="round" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Use `shape="round"` with large size for floating action buttons (FABs).',
      },
    },
  },
};

export const Shapes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <IconButton icon={<AddIcon size={16} />} aria-label="Add (square)" shape="square" />
        <div style={{ fontSize: '12px', marginTop: '8px', color: 'var(--page-text-soft)' }}>square</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <IconButton icon={<AddIcon size={16} />} aria-label="Add (round)" shape="round" />
        <div style={{ fontSize: '12px', marginTop: '8px', color: 'var(--page-text-soft)' }}>round</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <IconButton icon={<AddIcon size={16} />} aria-label="Add primary" shape="round" variant="primary" />
        <div style={{ fontSize: '12px', marginTop: '8px', color: 'var(--page-text-soft)' }}>round primary</div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'IconButton supports two shapes: `square` (default) with standard border radius, and `round` for circular buttons.',
      },
    },
  },
};

export const AutomaticTooltip: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <IconButton
        icon={<EditIcon size={16} />}
        aria-label="Edit document"
      />
      <IconButton
        icon={<TrashIcon size={16} />}
        aria-label="Delete item"
        variant="danger"
      />
      <IconButton
        icon={<GearIcon size={16} />}
        aria-label="Open settings"
      />
      <span style={{ color: 'var(--page-text-soft)', fontSize: '14px' }}>
        Hover to see tooltips
      </span>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'IconButton automatically displays the `aria-label` as a tooltip on hover. No additional configuration needed!',
      },
    },
  },
};

export const TooltipPositions: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', padding: '3rem' }}>
      <IconButton icon={<AddIcon size={16} />} aria-label="Top (default)" tooltipPosition="top" />
      <IconButton icon={<AddIcon size={16} />} aria-label="Bottom" tooltipPosition="bottom" />
      <IconButton icon={<AddIcon size={16} />} aria-label="Left" tooltipPosition="left" />
      <IconButton icon={<AddIcon size={16} />} aria-label="Right" tooltipPosition="right" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Control tooltip position with the `tooltipPosition` prop.',
      },
    },
  },
};

export const HiddenTooltip: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <IconButton
        icon={<EditIcon size={16} />}
        aria-label="Edit (tooltip visible)"
      />
      <IconButton
        icon={<EditIcon size={16} />}
        aria-label="Edit (tooltip hidden)"
        hideTooltip
      />
      <span style={{ color: 'var(--page-text-soft)', fontSize: '14px' }}>
        Second button has no tooltip but still has aria-label
      </span>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Use `hideTooltip` to disable the tooltip while keeping the aria-label for screen readers.',
      },
    },
  },
};

export const MobileActions: Story = {
  render: () => (
    <div style={{
      width: '375px',
      background: 'var(--panel-bg)',
      border: '1px solid var(--panel-border)',
      borderRadius: '8px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: '1px solid var(--panel-border)'
      }}>
        <IconButton icon={<MenuIcon size={16} />} aria-label="Open menu" size="lg" variant="ghost" />
        <h1 style={{ margin: 0, fontSize: '18px' }}>Mobile App</h1>
        <IconButton icon={<SearchIcon size={16} />} aria-label="Search" size="lg" variant="ghost" />
      </div>
      <div style={{ padding: '16px' }}>
        Mobile content...
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Use large size IconButtons for mobile interfaces to ensure adequate touch targets (44px).',
      },
    },
  },
};

export const LoadingState: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <IconButton
        icon={<AddIcon size={16} />}
        aria-label="Adding..."
        disabled
      />
      <span style={{ color: 'var(--page-text-soft)' }}>
        Disabled state can indicate loading...
      </span>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Use disabled state to indicate loading. For better UX, consider showing a spinner icon.',
      },
    },
  },
};
