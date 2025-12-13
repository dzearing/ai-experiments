import type { Meta, StoryObj } from '@storybook/react';
import { IconButton } from './IconButton';

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

const HeartIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M8 14s-6-4-6-8c0-2.21 1.79-4 4-4 1.26 0 2.38.59 3.12 1.5.74-.91 1.86-1.5 3.12-1.5 2.21 0 4 1.79 4 4 0 4-6 8-6 8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M3 4h10M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1M6 7v4M10 7v4M4 4l.5 9a1 1 0 001 1h5a1 1 0 001-1L12 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M7 3H3v10h10V9M10 2l4 4-6 6H4v-4l6-6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="7" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
    <path d="M10 10l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const MenuIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const meta: Meta<typeof IconButton> = {
  title: 'Actions/IconButton',
  component: IconButton,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Square button designed specifically for icon-only use cases. Wrapper around the Button component with \`iconOnly\` mode enabled.

## When to Use

- Toolbar actions (edit, delete, settings)
- Compact UI where space is limited
- Secondary actions that don't need labels
- Icon-based navigation
- Modal/dialog close buttons

## Accessibility Requirements

**CRITICAL:** IconButton requires an \`aria-label\` prop for accessibility. This is enforced by TypeScript.

\`\`\`tsx
// ✅ Correct - includes aria-label
<IconButton icon={<CloseIcon />} aria-label="Close" />

// ❌ TypeScript Error - missing aria-label
<IconButton icon={<CloseIcon />} />
\`\`\`

The aria-label provides a text alternative for screen readers since the button has no visible text.

## Variants

| Variant | Use Case |
|---------|----------|
| \`default\` | Standard actions |
| \`primary\` | Primary action in a group |
| \`danger\` | Destructive actions (delete, remove) |
| \`ghost\` | Minimal visual weight, tertiary actions |
| \`outline\` | Alternative to default with border emphasis |

## Sizes

IconButton uses square dimensions to accommodate the icon:

- **sm** (28px × 28px): Compact toolbars, table actions
- **md** (36px × 36px): Default size for most use cases
- **lg** (44px × 44px): Touch-friendly, prominent actions

## Usage

\`\`\`tsx
import { IconButton } from '@claude-flow/ui-kit-react';
import { CloseIcon, EditIcon, DeleteIcon } from './icons';

<IconButton
  icon={<CloseIcon />}
  aria-label="Close dialog"
  onClick={handleClose}
/>

<IconButton
  icon={<EditIcon />}
  aria-label="Edit item"
  variant="primary"
  onClick={handleEdit}
/>

<IconButton
  icon={<DeleteIcon />}
  aria-label="Delete item"
  variant="danger"
  onClick={handleDelete}
/>
\`\`\`

## Alternative: Button with iconOnly

IconButton is a convenience wrapper. You can also use:

\`\`\`tsx
<Button icon={<CloseIcon />} iconOnly aria-label="Close" />
\`\`\`

Both approaches are equivalent. Use IconButton for clearer intent.
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
      description: 'Accessible label for the button (REQUIRED)',
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
    icon: <PlusIcon />,
    'aria-label': 'Add item',
    variant: 'default',
    size: 'md',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <IconButton icon={<PlusIcon />} aria-label="Default" variant="default" />
      <IconButton icon={<PlusIcon />} aria-label="Primary" variant="primary" />
      <IconButton icon={<TrashIcon />} aria-label="Danger" variant="danger" />
      <IconButton icon={<SettingsIcon />} aria-label="Ghost" variant="ghost" />
      <IconButton icon={<EditIcon />} aria-label="Outline" variant="outline" />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <IconButton icon={<PlusIcon />} aria-label="Small" size="sm" />
      <IconButton icon={<PlusIcon />} aria-label="Medium" size="md" />
      <IconButton icon={<PlusIcon />} aria-label="Large" size="lg" />
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
      <IconButton icon={<PlusIcon />} aria-label="Default disabled" variant="default" disabled />
      <IconButton icon={<PlusIcon />} aria-label="Primary disabled" variant="primary" disabled />
      <IconButton icon={<TrashIcon />} aria-label="Danger disabled" variant="danger" disabled />
      <IconButton icon={<SettingsIcon />} aria-label="Ghost disabled" variant="ghost" disabled />
      <IconButton icon={<EditIcon />} aria-label="Outline disabled" variant="outline" disabled />
    </div>
  ),
};

export const CommonActions: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px' }}>
      <IconButton icon={<EditIcon />} aria-label="Edit" />
      <IconButton icon={<TrashIcon />} aria-label="Delete" variant="danger" />
      <IconButton icon={<SettingsIcon />} aria-label="Settings" />
      <IconButton icon={<CloseIcon />} aria-label="Close" variant="ghost" />
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
      <IconButton icon={<EditIcon />} aria-label="Edit" size="sm" variant="ghost" />
      <IconButton icon={<CloseIcon />} aria-label="Delete" size="sm" variant="ghost" />
      <IconButton icon={<SettingsIcon />} aria-label="Settings" size="sm" variant="ghost" />
      <div style={{ width: '1px', background: 'var(--panel-border)', margin: '4px 4px' }} />
      <IconButton icon={<SearchIcon />} aria-label="Search" size="sm" variant="ghost" />
      <IconButton icon={<HeartIcon />} aria-label="Favorite" size="sm" variant="ghost" />
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
          <IconButton icon={<EditIcon />} aria-label="Edit card" size="sm" variant="ghost" />
          <IconButton icon={<TrashIcon />} aria-label="Delete card" size="sm" variant="ghost" />
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
        <IconButton icon={<CloseIcon />} aria-label="Close dialog" variant="ghost" />
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
        <IconButton icon={<PlusIcon />} aria-label="Add new item" variant="primary" size="lg" />
        <IconButton icon={<SearchIcon />} aria-label="Search" variant="default" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Large IconButtons work well as floating action buttons for primary actions.',
      },
    },
  },
};

export const WithTooltip: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px' }}>
      <IconButton
        icon={<EditIcon />}
        aria-label="Edit"
        title="Edit (Ctrl+E)"
      />
      <IconButton
        icon={<TrashIcon />}
        aria-label="Delete"
        variant="danger"
        title="Delete (Del)"
      />
      <IconButton
        icon={<SettingsIcon />}
        aria-label="Settings"
        title="Settings (Ctrl+,)"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Use the native title attribute for simple tooltips. For rich tooltips, wrap IconButton with a Tooltip component.',
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
        <IconButton icon={<MenuIcon />} aria-label="Open menu" size="lg" variant="ghost" />
        <h1 style={{ margin: 0, fontSize: '18px' }}>Mobile App</h1>
        <IconButton icon={<SearchIcon />} aria-label="Search" size="lg" variant="ghost" />
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
        icon={<PlusIcon />}
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
