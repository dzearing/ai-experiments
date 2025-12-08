import type { Meta, StoryObj } from '@storybook/react';
import { Toast, ToastProvider, useToast } from './Toast';
import { Button } from '../Button';

const meta = {
  title: 'Feedback/Toast',
  component: Toast,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Brief, non-blocking notification that appears temporarily.

## When to Use

- Success confirmations ("Saved!")
- Non-critical errors
- Status updates
- Action feedback

## Toast vs Banner

| Component | Use Case |
|-----------|----------|
| **Toast** | Temporary, auto-dismisses |
| **Banner** | Persistent, requires action |

## Setup

Wrap your app with \`ToastProvider\` and use the \`useToast\` hook:

\`\`\`jsx
<ToastProvider position="bottom-right">
  <App />
</ToastProvider>

// In component:
const { showToast } = useToast();
showToast({ variant: 'success', message: 'Saved!' });
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

// Component for demonstrating ToastProvider with multiple toasts
const MultipleToastsDemo = () => {
  const { showToast } = useToast();

  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <Button onClick={() => showToast({ variant: 'default', title: 'Default', message: 'This is a default toast.' })}>
        Show Default
      </Button>
      <Button onClick={() => showToast({ variant: 'info', title: 'Info', message: 'This is an informational message.' })}>
        Show Info
      </Button>
      <Button variant="primary" onClick={() => showToast({ variant: 'success', title: 'Success', message: 'Your changes have been saved.' })}>
        Show Success
      </Button>
      <Button onClick={() => showToast({ variant: 'warning', title: 'Warning', message: 'Please review your input.' })}>
        Show Warning
      </Button>
      <Button variant="danger" onClick={() => showToast({ variant: 'error', title: 'Error', message: 'Something went wrong.' })}>
        Show Error
      </Button>
    </div>
  );
};

export const MultipleToasts: Story = {
  render: () => (
    <ToastProvider position="bottom-right">
      <div>
        <p style={{ marginBottom: '16px' }}>Click buttons multiple times to see multiple toasts stack:</p>
        <MultipleToastsDemo />
      </div>
    </ToastProvider>
  ),
};

export const Default: Story = {
  render: () => (
    <ToastProvider>
      <ToastDemo />
    </ToastProvider>
  ),
};

const ToastDemo = () => {
  const { showToast } = useToast();
  return (
    <Button onClick={() => showToast({ variant: 'default', message: 'This is a toast notification.' })}>
      Show Toast
    </Button>
  );
};

export const Info: Story = {
  render: () => (
    <ToastProvider>
      <InfoDemo />
    </ToastProvider>
  ),
};

const InfoDemo = () => {
  const { showToast } = useToast();
  return (
    <Button onClick={() => showToast({ variant: 'info', title: 'Info', message: 'This is an informational message.' })}>
      Show Info Toast
    </Button>
  );
};

export const Success: Story = {
  render: () => (
    <ToastProvider>
      <SuccessDemo />
    </ToastProvider>
  ),
};

const SuccessDemo = () => {
  const { showToast } = useToast();
  return (
    <Button variant="primary" onClick={() => showToast({ variant: 'success', title: 'Success', message: 'Your changes have been saved.' })}>
      Show Success Toast
    </Button>
  );
};

export const Warning: Story = {
  render: () => (
    <ToastProvider>
      <WarningDemo />
    </ToastProvider>
  ),
};

const WarningDemo = () => {
  const { showToast } = useToast();
  return (
    <Button onClick={() => showToast({ variant: 'warning', title: 'Warning', message: 'Please review your input.' })}>
      Show Warning Toast
    </Button>
  );
};

export const Error: Story = {
  render: () => (
    <ToastProvider>
      <ErrorDemo />
    </ToastProvider>
  ),
};

const ErrorDemo = () => {
  const { showToast } = useToast();
  return (
    <Button variant="danger" onClick={() => showToast({ variant: 'error', title: 'Error', message: 'Something went wrong.' })}>
      Show Error Toast
    </Button>
  );
};

export const Positions: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <ToastProvider position="top-left">
        <PositionDemo position="Top Left" />
      </ToastProvider>
      <ToastProvider position="top-center">
        <PositionDemo position="Top Center" />
      </ToastProvider>
      <ToastProvider position="top-right">
        <PositionDemo position="Top Right" />
      </ToastProvider>
      <ToastProvider position="bottom-left">
        <PositionDemo position="Bottom Left" />
      </ToastProvider>
      <ToastProvider position="bottom-center">
        <PositionDemo position="Bottom Center" />
      </ToastProvider>
      <ToastProvider position="bottom-right">
        <PositionDemo position="Bottom Right" />
      </ToastProvider>
    </div>
  ),
};

const PositionDemo = ({ position }: { position: string }) => {
  const { showToast } = useToast();
  return (
    <Button onClick={() => showToast({ variant: 'info', title: position, message: `Toast positioned at ${position.toLowerCase()}.` })}>
      {position}
    </Button>
  );
};

export const LongDuration: Story = {
  render: () => (
    <ToastProvider>
      <LongDurationDemo />
    </ToastProvider>
  ),
};

const LongDurationDemo = () => {
  const { showToast } = useToast();
  return (
    <Button onClick={() => showToast({ variant: 'info', title: 'Long Duration', message: 'This toast stays for 10 seconds.', duration: 10000 })}>
      Show Long Duration Toast
    </Button>
  );
};
