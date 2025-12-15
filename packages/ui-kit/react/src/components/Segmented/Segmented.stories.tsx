import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { useState } from 'react';
import { Segmented } from './Segmented';
import {
  ListViewIcon,
  GridViewIcon,
  BoardIcon,
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
} from '@ui-kit/icons';

const meta: Meta<typeof Segmented> = {
  title: 'Navigation/Segmented',
  component: Segmented,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A segmented control presents a set of mutually exclusive options with a smooth sliding indicator animation.

## When to Use

- **Mode switching**: Toggle between edit/preview/split views
- **View selection**: Switch between list/grid/board layouts
- **Filter options**: Select time ranges, categories, or data views
- **Settings toggles**: Choose between related configuration options

## Variants

| Variant | Use Case |
|---------|----------|
| \`pill\` | Default, fully rounded ends for a modern look |
| \`rounded\` | Subtle corner rounding for a more traditional appearance |

## Sizes

Heights match other controls for consistent alignment:

- **sm** (28px): Compact toolbars, dense UIs
- **md** (36px): Default size for most use cases
- **lg** (44px): Prominent selections, touch-friendly interfaces

## Accessibility

- Full keyboard navigation (Arrow keys, Home, End)
- ARIA radiogroup semantics
- RTL layout support
- Focus ring for keyboard users
- Respects \`prefers-reduced-motion\`
        `,
      },
    },
  },
  args: {
    onChange: fn(),
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['pill', 'rounded'],
      description: 'Shape variant for the control',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size variant matching control heights',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Expand to fill container width',
    },
    iconOnly: {
      control: 'boolean',
      description: 'Hide labels, show only icons',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable all segments',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Segmented>;

const basicOptions = [
  { value: 'edit', label: 'Edit' },
  { value: 'preview', label: 'Preview' },
  { value: 'split', label: 'Split' },
];

export const Default: Story = {
  args: {
    options: basicOptions,
    defaultValue: 'edit',
  },
  parameters: {
    docs: {
      description: {
        story: 'The default segmented control with pill variant and medium size.',
      },
    },
  },
};

export const Pill: Story = {
  args: {
    options: basicOptions,
    defaultValue: 'edit',
    variant: 'pill',
  },
};

export const Rounded: Story = {
  args: {
    options: basicOptions,
    defaultValue: 'edit',
    variant: 'rounded',
  },
};

export const Small: Story = {
  args: {
    options: basicOptions,
    defaultValue: 'edit',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    options: basicOptions,
    defaultValue: 'edit',
    size: 'lg',
  },
};

export const FullWidth: Story = {
  args: {
    options: basicOptions,
    defaultValue: 'edit',
    fullWidth: true,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '400px' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Full-width mode distributes segments evenly across the container width.',
      },
    },
  },
};

export const WithIcons: Story = {
  args: {
    options: [
      { value: 'list', label: 'List', icon: <ListViewIcon size={16} /> },
      { value: 'grid', label: 'Grid', icon: <GridViewIcon size={16} /> },
      { value: 'board', label: 'Board', icon: <BoardIcon size={16} /> },
    ],
    defaultValue: 'list',
  },
  parameters: {
    docs: {
      description: {
        story: 'Segments with leading icons enhance visual recognition for common actions.',
      },
    },
  },
};

export const IconOnly: Story = {
  args: {
    options: [
      { value: 'align-left', label: 'Align Left', icon: <AlignLeftIcon size={16} /> },
      { value: 'align-center', label: 'Align Center', icon: <AlignCenterIcon size={16} /> },
      { value: 'align-right', label: 'Align Right', icon: <AlignRightIcon size={16} /> },
    ],
    defaultValue: 'align-left',
    iconOnly: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Icon-only mode for compact toolbars. Labels are visually hidden but still accessible to screen readers.',
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    options: basicOptions,
    defaultValue: 'edit',
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Disabled state prevents all interactions.',
      },
    },
  },
};

export const DisabledOption: Story = {
  args: {
    options: [
      { value: 'daily', label: 'Daily' },
      { value: 'weekly', label: 'Weekly', disabled: true },
      { value: 'monthly', label: 'Monthly' },
    ],
    defaultValue: 'daily',
  },
  parameters: {
    docs: {
      description: {
        story: 'Individual segments can be disabled while others remain interactive.',
      },
    },
  },
};

export const TwoOptions: Story = {
  args: {
    options: [
      { value: 'on', label: 'On' },
      { value: 'off', label: 'Off' },
    ],
    defaultValue: 'on',
  },
  parameters: {
    docs: {
      description: {
        story: 'Binary choices work well with the segmented control as an alternative to a toggle switch.',
      },
    },
  },
};

export const ManyOptions: Story = {
  args: {
    options: [
      { value: 'sun', label: 'Sun' },
      { value: 'mon', label: 'Mon' },
      { value: 'tue', label: 'Tue' },
      { value: 'wed', label: 'Wed' },
      { value: 'thu', label: 'Thu' },
      { value: 'fri', label: 'Fri' },
      { value: 'sat', label: 'Sat' },
    ],
    defaultValue: 'mon',
  },
  parameters: {
    docs: {
      description: {
        story: 'Multiple options are supported. For more than 5-7 options, consider using a dropdown instead.',
      },
    },
  },
};

// Controlled example
const ControlledStory = () => {
  const [value, setValue] = useState('preview');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
      <Segmented
        options={basicOptions}
        value={value}
        onChange={setValue}
      />
      <div style={{ fontSize: '14px', color: 'var(--color-body-textSoft10)' }}>
        Selected: <strong>{value}</strong>
      </div>
    </div>
  );
};

export const Controlled: Story = {
  render: () => <ControlledStory />,
  parameters: {
    docs: {
      description: {
        story: 'Use `value` and `onChange` props for controlled state management.',
      },
    },
  },
};

// All variants comparison
const AllVariantsStory = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'flex-start' }}>
    <div>
      <div style={{ fontSize: '12px', color: 'var(--color-body-textSoft20)', marginBottom: '8px' }}>
        Pill (default)
      </div>
      <Segmented options={basicOptions} defaultValue="edit" variant="pill" />
    </div>
    <div>
      <div style={{ fontSize: '12px', color: 'var(--color-body-textSoft20)', marginBottom: '8px' }}>
        Rounded
      </div>
      <Segmented options={basicOptions} defaultValue="edit" variant="rounded" />
    </div>
  </div>
);

export const AllVariants: Story = {
  render: () => <AllVariantsStory />,
};

// All sizes comparison
const AllSizesStory = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'flex-start' }}>
    <div>
      <div style={{ fontSize: '12px', color: 'var(--color-body-textSoft20)', marginBottom: '8px' }}>
        Small
      </div>
      <Segmented options={basicOptions} defaultValue="edit" size="sm" />
    </div>
    <div>
      <div style={{ fontSize: '12px', color: 'var(--color-body-textSoft20)', marginBottom: '8px' }}>
        Medium (default)
      </div>
      <Segmented options={basicOptions} defaultValue="edit" size="md" />
    </div>
    <div>
      <div style={{ fontSize: '12px', color: 'var(--color-body-textSoft20)', marginBottom: '8px' }}>
        Large
      </div>
      <Segmented options={basicOptions} defaultValue="edit" size="lg" />
    </div>
  </div>
);

export const AllSizes: Story = {
  render: () => <AllSizesStory />,
};
