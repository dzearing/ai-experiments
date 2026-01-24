import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { useState } from 'react';
import { Stepper } from './Stepper';
import { Button } from '../Button/Button';
import { Stack } from '../Stack/Stack';

const basicSteps = [
  { label: 'Account' },
  { label: 'Profile' },
  { label: 'Review' },
  { label: 'Complete' },
];

const stepsWithDescriptions = [
  { label: 'Account', description: 'Create your account' },
  { label: 'Profile', description: 'Add your details' },
  { label: 'Preferences', description: 'Set your preferences' },
  { label: 'Complete', description: 'Review and finish' },
];

const meta = {
  title: 'Feedback/Stepper',
  component: Stepper,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Visual indicator for multi-step processes with labels. Shows numbered or labeled steps in a sequence with connectors between them.

## When to Use

- Multi-step forms or wizards
- Checkout flows
- Onboarding processes
- Any sequential workflow where users need to see their progress

## Orientation

| Orientation | Use Case |
|-------------|----------|
| \`horizontal\` | Wide layouts, wizard headers, desktop views |
| \`vertical\` | Narrow layouts, sidebars, mobile views |

## Sizes

Heights for step indicators:

- **sm** (24px): Compact UI, embedded in headers
- **md** (32px): Default size for most use cases
- **lg** (40px): Prominent progress indicators

## Visual States

| State | Appearance |
|-------|------------|
| Pending | Dimmed with border |
| Current | Primary color with ring highlight |
| Complete | Primary color with checkmark |
| Error | Danger color |

## Accessibility

- Uses \`role="list"\` and \`role="listitem"\` for screen readers
- \`aria-current="step"\` marks the current step
- Keyboard navigation when clickable (Enter/Space to activate)
- Focus visible with standard focus ring

## Usage

\`\`\`tsx
import { Stepper } from '@claude-flow/ui-kit-react';

const steps = [
  { label: 'Account' },
  { label: 'Profile' },
  { label: 'Review' },
];

// Basic usage
<Stepper steps={steps} current={1} />

// Vertical with descriptions
<Stepper
  steps={[
    { label: 'Account', description: 'Create your account' },
    { label: 'Profile', description: 'Add your details' },
    { label: 'Review', description: 'Confirm and submit' },
  ]}
  current={1}
  orientation="vertical"
/>

// Clickable for navigation
<Stepper
  steps={steps}
  current={current}
  clickable
  onStepClick={(index) => setCurrent(index)}
/>
\`\`\`
        `,
      },
    },
  },
  args: {
    onStepClick: fn(),
  },
  argTypes: {
    steps: {
      description: 'Array of step items with label, optional description, and status',
    },
    current: {
      control: { type: 'number', min: 0, max: 10 },
      description: 'Current step index (0-based)',
    },
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'Layout orientation',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the step indicators',
    },
    clickable: {
      control: 'boolean',
      description: 'Whether steps are clickable for navigation',
    },
    showNumbers: {
      control: 'boolean',
      description: 'Whether to show step numbers',
    },
    showCheckOnComplete: {
      control: 'boolean',
      description: 'Show checkmark on completed steps',
    },
    onStepClick: {
      table: { disable: true },
    },
  },
} satisfies Meta<typeof Stepper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    steps: basicSteps,
    current: 1,
    orientation: 'horizontal',
    size: 'md',
  },
};

export const Horizontal: Story = {
  args: {
    steps: basicSteps,
    current: 1,
    orientation: 'horizontal',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '500px' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Horizontal orientation is ideal for wide layouts and wizard headers.',
      },
    },
  },
};

export const Vertical: Story = {
  args: {
    steps: stepsWithDescriptions,
    current: 1,
    orientation: 'vertical',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '300px' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Vertical orientation works well in sidebars and narrow layouts. Descriptions are more readable in this layout.',
      },
    },
  },
};

export const WithDescriptions: Story = {
  args: {
    steps: stepsWithDescriptions,
    current: 1,
    orientation: 'horizontal',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '600px' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Steps can include descriptions to provide more context about each step.',
      },
    },
  },
};

export const Sizes: Story = {
  render: () => (
    <Stack gap="lg">
      <Stack gap="xs">
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--base-fg-soft)' }}>Small</span>
        <div style={{ width: '400px' }}>
          <Stepper steps={basicSteps} current={1} size="sm" />
        </div>
      </Stack>
      <Stack gap="xs">
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--base-fg-soft)' }}>Medium</span>
        <div style={{ width: '400px' }}>
          <Stepper steps={basicSteps} current={1} size="md" />
        </div>
      </Stack>
      <Stack gap="xs">
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--base-fg-soft)' }}>Large</span>
        <div style={{ width: '400px' }}>
          <Stepper steps={basicSteps} current={1} size="lg" />
        </div>
      </Stack>
    </Stack>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Available sizes for different contexts. Use sm for compact UI, md for standard usage, lg for prominent indicators.',
      },
    },
  },
};

export const FirstStep: Story = {
  args: {
    steps: basicSteps,
    current: 0,
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
        story: 'First step highlighted with no completed steps.',
      },
    },
  },
};

export const LastStep: Story = {
  args: {
    steps: basicSteps,
    current: 3,
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
        story: 'Final step with all previous steps completed.',
      },
    },
  },
};

export const WithErrorState: Story = {
  args: {
    steps: [
      { label: 'Account', status: 'complete' },
      { label: 'Payment', status: 'error' },
      { label: 'Review' },
      { label: 'Complete' },
    ],
    current: 1,
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
        story: 'Steps can have an error status to indicate issues that need attention.',
      },
    },
  },
};

export const WithDisabledSteps: Story = {
  args: {
    steps: [
      { label: 'Account' },
      { label: 'Profile' },
      { label: 'Premium', disabled: true },
      { label: 'Complete' },
    ],
    current: 1,
    clickable: true,
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
        story: 'Individual steps can be disabled to prevent navigation.',
      },
    },
  },
};

export const NoNumbers: Story = {
  args: {
    steps: basicSteps,
    current: 1,
    showNumbers: false,
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
        story: 'Hide step numbers for a cleaner appearance. Completed steps still show checkmarks.',
      },
    },
  },
};

const InteractiveExample = () => {
  const [current, setCurrent] = useState(0);
  const total = basicSteps.length;

  return (
    <Stack gap="lg" style={{ width: '500px' }}>
      <Stepper
        steps={basicSteps}
        current={current}
        clickable
        onStepClick={setCurrent}
      />
      <Stack direction="horizontal" gap="sm" justify="center">
        <Button
          variant="default"
          size="sm"
          disabled={current === 0}
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
        >
          Previous
        </Button>
        <Button
          variant="primary"
          size="sm"
          disabled={current === total - 1}
          onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))}
        >
          Next
        </Button>
      </Stack>
      <p style={{ textAlign: 'center', fontSize: 'var(--text-sm)', margin: 0 }}>
        Step {current + 1} of {total}: <strong>{basicSteps[current].label}</strong>
      </p>
    </Stack>
  );
};

export const Interactive: Story = {
  render: () => <InteractiveExample />,
  parameters: {
    docs: {
      description: {
        story: 'Interactive example with clickable steps and navigation buttons.',
      },
    },
  },
};

const VerticalInteractiveExample = () => {
  const [current, setCurrent] = useState(0);
  const total = stepsWithDescriptions.length;

  return (
    <Stack direction="horizontal" gap="xl" style={{ width: '600px' }}>
      <div style={{ width: '250px' }}>
        <Stepper
          steps={stepsWithDescriptions}
          current={current}
          orientation="vertical"
          clickable
          onStepClick={setCurrent}
        />
      </div>
      <Stack gap="md" style={{ flex: 1 }}>
        <div
          style={{
            padding: 'var(--space-4)',
            background: 'var(--soft-bg)',
            borderRadius: 'var(--radius-lg)',
            minHeight: '150px',
          }}
        >
          <h3 style={{ margin: '0 0 var(--space-2) 0', fontSize: 'var(--text-lg)' }}>
            {stepsWithDescriptions[current].label}
          </h3>
          <p style={{ margin: 0, color: 'var(--base-fg-soft)' }}>
            {stepsWithDescriptions[current].description}
          </p>
        </div>
        <Stack direction="horizontal" gap="sm" justify="end">
          <Button
            variant="default"
            size="sm"
            disabled={current === 0}
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          >
            Back
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))}
          >
            {current === total - 1 ? 'Finish' : 'Continue'}
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
};

export const VerticalWithContent: Story = {
  render: () => <VerticalInteractiveExample />,
  parameters: {
    docs: {
      description: {
        story: 'Vertical stepper used as sidebar navigation alongside content area.',
      },
    },
  },
};

export const ManySteps: Story = {
  args: {
    steps: [
      { label: 'Start' },
      { label: 'Info' },
      { label: 'Address' },
      { label: 'Payment' },
      { label: 'Shipping' },
      { label: 'Review' },
      { label: 'Confirm' },
    ],
    current: 3,
    size: 'sm',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '700px' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'For flows with many steps, consider using a smaller size or vertical orientation.',
      },
    },
  },
};

export const InContext: Story = {
  render: () => (
    <div
      style={{
        padding: 'var(--space-4)',
        background: 'var(--soft-bg)',
        borderRadius: 'var(--radius-lg)',
        width: '500px',
      }}
    >
      <Stack gap="md">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)' }}>
            Account Setup
          </h2>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--soft-fg-soft)' }}>
            Step 2 of 4
          </span>
        </div>
        <Stepper steps={basicSteps} current={1} size="sm" />
      </Stack>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Stepper used in a card header context with title and step count.',
      },
    },
  },
};

export const RTLSupport: Story = {
  render: () => (
    <div dir="rtl" style={{ textAlign: 'right', width: '500px' }}>
      <Stepper
        steps={[
          { label: 'الحساب', description: 'إنشاء حساب' },
          { label: 'الملف الشخصي', description: 'إضافة تفاصيل' },
          { label: 'المراجعة', description: 'تأكيد وإرسال' },
        ]}
        current={1}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'RTL support with Arabic labels. The layout automatically adapts to right-to-left direction.',
      },
    },
  },
};
