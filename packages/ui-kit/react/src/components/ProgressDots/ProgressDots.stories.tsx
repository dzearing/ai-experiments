import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ProgressDots } from './ProgressDots';
import { Button } from '../Button/Button';

const meta = {
  title: 'Feedback/ProgressDots',
  component: ProgressDots,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Visual indicator for multi-step progress, commonly used in wizards, onboarding flows, and carousels.

## When to Use

- Multi-step forms or wizards
- Onboarding flows
- Image carousels or slideshows
- Any sequential process with discrete steps

## Visual States

| State | Appearance |
|-------|------------|
| Pending | Dimmed dot (soft border color) |
| Current | Primary color with ring highlight |
| Complete | Primary color filled |

## Sizes

- **sm** (6px): Compact UI, inline indicators
- **md** (8px): Default size for most use cases
- **lg** (10px): Prominent progress indicators

## Accessibility

- Uses \`role="progressbar"\` for screen readers
- \`aria-valuenow\`, \`aria-valuemin\`, \`aria-valuemax\` indicate progress
- Custom \`aria-label\` supported for context

## Usage

\`\`\`tsx
import { ProgressDots } from '@claude-flow/ui-kit-react';

// Basic usage - show step 2 of 5
<ProgressDots current={1} total={5} />

// With custom label
<ProgressDots
  current={2}
  total={4}
  aria-label="Onboarding progress"
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    current: {
      control: { type: 'number', min: 0, max: 10 },
      description: 'Current step index (0-based)',
    },
    total: {
      control: { type: 'number', min: 1, max: 10 },
      description: 'Total number of steps',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the dots',
    },
    'aria-label': {
      control: 'text',
      description: 'Accessible label for the progress indicator',
    },
  },
} satisfies Meta<typeof ProgressDots>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    current: 1,
    total: 5,
    size: 'md',
  },
};

export const FirstStep: Story = {
  args: {
    current: 0,
    total: 5,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the first step as current with no completed steps.',
      },
    },
  },
};

export const MiddleStep: Story = {
  args: {
    current: 2,
    total: 5,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows progress in the middle of a flow with some completed steps.',
      },
    },
  },
};

export const LastStep: Story = {
  args: {
    current: 4,
    total: 5,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the final step as current with all previous steps completed.',
      },
    },
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ width: '40px', fontSize: '14px' }}>sm</span>
        <ProgressDots size="sm" current={2} total={5} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ width: '40px', fontSize: '14px' }}>md</span>
        <ProgressDots size="md" current={2} total={5} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ width: '40px', fontSize: '14px' }}>lg</span>
        <ProgressDots size="lg" current={2} total={5} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Available sizes for different contexts. Use sm for compact UI, md for standard usage, lg for prominent indicators.',
      },
    },
  },
};

export const FewSteps: Story = {
  args: {
    current: 1,
    total: 3,
  },
  parameters: {
    docs: {
      description: {
        story: 'A simple 3-step flow, common for quick wizards or confirmation dialogs.',
      },
    },
  },
};

export const ManySteps: Story = {
  args: {
    current: 4,
    total: 10,
  },
  parameters: {
    docs: {
      description: {
        story: 'Extended flow with many steps. Consider if dots are still the best indicator for very long flows.',
      },
    },
  },
};

const InteractiveExample = () => {
  const [current, setCurrent] = useState(0);
  const total = 5;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
      <ProgressDots current={current} total={total} size="lg" />
      <div style={{ display: 'flex', gap: '8px' }}>
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
      </div>
      <p style={{ fontSize: '14px', margin: 0 }}>
        Step {current + 1} of {total}
      </p>
    </div>
  );
};

export const Interactive: Story = {
  render: () => <InteractiveExample />,
  parameters: {
    docs: {
      description: {
        story: 'Interactive example showing how the dots animate between steps.',
      },
    },
  },
};

export const InContext: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        background: 'var(--soft-bg)',
        borderRadius: 'var(--radius-lg)',
        minWidth: '300px',
      }}
    >
      <span style={{ fontSize: '14px', fontWeight: 500 }}>Setup Wizard</span>
      <ProgressDots current={1} total={4} size="sm" />
      <span style={{ fontSize: '12px', color: 'var(--soft-fg-soft)' }}>Step 2 of 4</span>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'ProgressDots used in a header context alongside text labels.',
      },
    },
  },
};
