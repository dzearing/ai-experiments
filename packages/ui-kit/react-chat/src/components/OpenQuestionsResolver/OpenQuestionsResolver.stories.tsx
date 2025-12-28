import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { useState } from 'react';
import { OpenQuestionsResolver } from './OpenQuestionsResolver';
import type { OpenQuestion, OpenQuestionsResult } from './types';

const sampleQuestions: OpenQuestion[] = [
  {
    id: 'q1',
    question: 'What notification/reminder system would be most helpful?',
    context: 'This will help determine the complexity of the notification feature and what integrations are needed.',
    selectionType: 'single',
    options: [
      { id: 'push', label: 'Push notifications', description: 'Native mobile and browser notifications' },
      { id: 'email', label: 'Email reminders', description: 'Daily or weekly digest emails' },
      { id: 'in-app', label: 'In-app notifications only', description: 'Bell icon with notification center' },
      { id: 'sms', label: 'SMS alerts', description: 'Text messages for urgent items' },
    ],
    allowCustom: true,
  },
  {
    id: 'q2',
    question: 'Should there be any gamification elements?',
    context: 'Gamification can increase engagement but adds complexity. Select all that appeal to you.',
    selectionType: 'multiple',
    options: [
      { id: 'streaks', label: 'Streaks', description: 'Track consecutive days of activity' },
      { id: 'points', label: 'Points system', description: 'Earn points for completing tasks' },
      { id: 'achievements', label: 'Achievements/badges', description: 'Unlock badges for milestones' },
      { id: 'leaderboard', label: 'Leaderboards', description: 'Compare with team members' },
    ],
    allowCustom: true,
  },
  {
    id: 'q3',
    question: 'What level of task hierarchy do you need?',
    context: 'This affects how tasks can be organized and broken down.',
    selectionType: 'single',
    options: [
      { id: 'flat', label: 'Flat list', description: 'Simple list with no nesting' },
      { id: 'single', label: 'Single level subtasks', description: 'Tasks can have one level of subtasks' },
      { id: 'unlimited', label: 'Unlimited nesting', description: 'Tasks can be nested to any depth' },
    ],
    allowCustom: false,
  },
];

const meta = {
  title: 'Chat/OpenQuestionsResolver',
  component: OpenQuestionsResolver,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Present open questions to users and collect structured answers. Designed for AI agents
that need clarification on ambiguous requirements.

## When to Use

- When an AI agent generates questions that need user input
- For surveys or questionnaires within a chat interface
- For progressive disclosure of configuration options

## Features

- Single and multiple choice questions
- Optional custom "Other" text input per question
- Keyboard navigation (Arrow keys, Space/Enter)
- Focus memory per question
- Progress indication with dots or stepper

## Variants

| Variant | Use Case |
|---------|----------|
| \`centered\` | Modal-like overlay for focused interaction |
| \`fullscreen\` | Full-screen takeover with progress stepper |

## Keyboard Navigation

- **ArrowUp/Down**: Navigate between options
- **Space/Enter**: Toggle option selection
- **ArrowLeft/Right**: Navigate between questions
- **Ctrl/Cmd+Enter**: Exit textarea focus

## Usage

\`\`\`tsx
import { OpenQuestionsResolver } from '@ui-kit/react-chat';
import type { OpenQuestion, OpenQuestionsResult } from '@ui-kit/react-chat';

const questions: OpenQuestion[] = [
  {
    id: 'q1',
    question: 'Which framework do you prefer?',
    selectionType: 'single',
    options: [
      { id: 'react', label: 'React' },
      { id: 'vue', label: 'Vue' },
    ],
    allowCustom: true,
  },
];

function MyComponent() {
  const handleComplete = (result: OpenQuestionsResult) => {
    console.log('Answers:', result.answers);
    console.log('Completed:', result.completed);
  };

  return (
    <OpenQuestionsResolver
      questions={questions}
      onComplete={handleComplete}
    />
  );
}
\`\`\`
        `,
      },
    },
  },
  args: {
    onComplete: fn(),
    onDismiss: fn(),
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['centered', 'fullscreen'],
      description: 'Layout variant',
    },
    initialIndex: {
      control: { type: 'number', min: 0, max: 2 },
      description: 'Starting question index',
    },
  },
} satisfies Meta<typeof OpenQuestionsResolver>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CenteredVariant: Story = {
  args: {
    questions: sampleQuestions,
    variant: 'centered',
  },
  parameters: {
    docs: {
      description: {
        story: 'Modal-like card centered over the page. Good for focused question flows.',
      },
    },
  },
};

export const FullscreenVariant: Story = {
  args: {
    questions: sampleQuestions,
    variant: 'fullscreen',
  },
  parameters: {
    docs: {
      description: {
        story: 'Full-screen takeover with progress stepper. Good for complex question flows.',
      },
    },
  },
};

export const MultipleChoice: Story = {
  args: {
    questions: sampleQuestions,
    variant: 'centered',
    initialIndex: 1,
  },
  parameters: {
    docs: {
      description: {
        story: 'Multiple choice question with checkboxes. Users can select multiple options.',
      },
    },
  },
};

export const NoCustomOption: Story = {
  args: {
    questions: sampleQuestions,
    variant: 'centered',
    initialIndex: 2,
  },
  parameters: {
    docs: {
      description: {
        story: 'Question without the custom "Other" option.',
      },
    },
  },
};

export const CustomLabels: Story = {
  args: {
    questions: sampleQuestions,
    variant: 'centered',
    labels: {
      next: 'Continue',
      previous: 'Back',
      done: 'Submit',
      dismiss: 'Cancel',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Customized button labels for localization or branding.',
      },
    },
  },
};

// Controlled example showing result handling
const ControlledExample = () => {
  const [result, setResult] = useState<OpenQuestionsResult | null>(null);
  const [isOpen, setIsOpen] = useState(true);

  const handleComplete = (res: OpenQuestionsResult) => {
    setResult(res);
    setIsOpen(false);
  };

  const handleReopen = () => {
    setResult(null);
    setIsOpen(true);
  };

  if (!isOpen) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
        <h2>Result</h2>
        <pre style={{
          background: 'var(--soft-bg)',
          padding: '1rem',
          borderRadius: '8px',
          overflow: 'auto',
        }}>
          {JSON.stringify(result, null, 2)}
        </pre>
        <button
          onClick={handleReopen}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            border: '1px solid var(--soft-border)',
            background: 'var(--strong-bg)',
            cursor: 'pointer',
          }}
        >
          Reopen Questions
        </button>
      </div>
    );
  }

  return (
    <OpenQuestionsResolver
      questions={sampleQuestions}
      onComplete={handleComplete}
      variant="centered"
    />
  );
};

export const Controlled: Story = {
  render: () => <ControlledExample />,
  parameters: {
    docs: {
      description: {
        story: 'Interactive example showing how to handle the result. Complete the questions to see the structured output.',
      },
    },
  },
};

// Single question example
const singleQuestion: OpenQuestion[] = [
  {
    id: 'single',
    question: 'Would you like to enable dark mode?',
    selectionType: 'single',
    options: [
      { id: 'yes', label: 'Yes', description: 'Use dark theme' },
      { id: 'no', label: 'No', description: 'Keep light theme' },
      { id: 'auto', label: 'Auto', description: 'Follow system preference' },
    ],
    allowCustom: false,
  },
];

export const SingleQuestion: Story = {
  args: {
    questions: singleQuestion,
    variant: 'centered',
  },
  parameters: {
    docs: {
      description: {
        story: 'Single question flow - shows "Done" button instead of "Next".',
      },
    },
  },
};
