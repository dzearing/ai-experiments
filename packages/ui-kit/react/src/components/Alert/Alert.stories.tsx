import type { Meta, StoryObj } from '@storybook/react';
import { Alert } from './Alert';

const meta: Meta<typeof Alert> = {
  title: 'Feedback/Alert',
  component: Alert,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Alert component for displaying important messages to users.

## When to Use

- System messages and notifications
- Validation feedback
- Important warnings
- Success confirmations
- Informational messages

## Variants

| Variant | Use Case |
|---------|----------|
| \`info\` | General information, tips, neutral messages (default) |
| \`success\` | Successful operations, confirmations |
| \`warning\` | Warnings, potential issues that need attention |
| \`danger\` | Errors, critical issues, destructive actions |

## Alert vs Toast

| Component | Use Case |
|-----------|----------|
| **Alert** | Persistent messages, inline with content |
| **Toast** | Temporary notifications, overlays on content |

## Accessibility

- Uses \`role="alert"\` for screen readers
- Automatically announced by assistive technology
- Uses semantic color tokens for accessibility

## Usage

\`\`\`tsx
import { Alert } from '@claude-flow/ui-kit-react';

<Alert variant="success">
  Your changes have been saved successfully.
</Alert>

<Alert variant="danger">
  Unable to save changes. Please try again.
</Alert>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['info', 'success', 'warning', 'danger'],
      description: 'Visual style variant based on message type',
      table: {
        defaultValue: { summary: 'info' },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: 'info',
    children: 'This is an informational message.',
  },
};

export const Info: Story = {
  args: {
    variant: 'info',
    children: 'Did you know? You can customize your preferences in the settings panel.',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Your changes have been saved successfully.',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    children: 'Your session will expire in 5 minutes. Please save your work.',
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'Unable to save changes. Please check your connection and try again.',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px' }}>
      <Alert variant="info">
        This is an informational message with helpful tips.
      </Alert>
      <Alert variant="success">
        Operation completed successfully!
      </Alert>
      <Alert variant="warning">
        Please review the changes before proceeding.
      </Alert>
      <Alert variant="danger">
        An error occurred while processing your request.
      </Alert>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All alert variants displayed together for comparison.',
      },
    },
  },
};

export const WithComplexContent: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px' }}>
      <Alert variant="info">
        <strong>New features available!</strong>
        <p style={{ margin: '8px 0 0 0' }}>
          Check out our latest updates including dark mode and keyboard shortcuts.
        </p>
      </Alert>

      <Alert variant="success">
        <strong>Upload complete</strong>
        <p style={{ margin: '8px 0 0 0' }}>
          3 files uploaded successfully. View them in your <a href="#files">files panel</a>.
        </p>
      </Alert>

      <Alert variant="warning">
        <strong>Storage limit approaching</strong>
        <p style={{ margin: '8px 0 0 0' }}>
          You have used 90% of your storage quota. Consider upgrading your plan.
        </p>
      </Alert>

      <Alert variant="danger">
        <strong>Connection lost</strong>
        <p style={{ margin: '8px 0 0 0' }}>
          Unable to connect to the server. Changes may not be saved.
        </p>
      </Alert>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Alerts can contain rich content including headings, paragraphs, and links.',
      },
    },
  },
};

export const WithActions: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px' }}>
      <Alert variant="warning">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Your trial expires in 3 days.</span>
          <button style={{ marginLeft: '16px' }}>Upgrade now</button>
        </div>
      </Alert>

      <Alert variant="danger">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div>
            <strong>Security alert</strong>
            <p style={{ margin: '8px 0 0 0' }}>
              Unusual activity detected on your account.
            </p>
          </div>
          <button style={{ marginLeft: '16px', flexShrink: 0 }}>Review</button>
        </div>
      </Alert>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Alerts can include action buttons for user response.',
      },
    },
  },
};

export const FullWidth: Story = {
  render: () => (
    <div style={{ width: '100%' }}>
      <Alert variant="info">
        This alert spans the full width of its container, useful for page-level messages.
      </Alert>
    </div>
  ),
  decorators: [
    (Story) => (
      <div style={{ width: '100%', maxWidth: '1200px' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Alerts naturally expand to fill their container width.',
      },
    },
  },
};

export const CustomStyling: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px' }}>
      <Alert variant="success" style={{ borderLeft: '4px solid currentColor' }}>
        Alert with custom border styling
      </Alert>

      <Alert variant="warning" className="custom-alert">
        Alert with custom className for additional styling
      </Alert>

      <Alert variant="info" id="important-notice" data-testid="alert-message">
        Alert with data attributes and ID for testing
      </Alert>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Alerts support standard HTML attributes including className, style, id, and data attributes for customization.',
      },
    },
  },
};
