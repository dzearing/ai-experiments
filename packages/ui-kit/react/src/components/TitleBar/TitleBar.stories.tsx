import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { TitleBar } from './TitleBar';
import { Button } from '../Button/Button';
import { Avatar } from '../Avatar/Avatar';

const meta = {
  title: 'Layout/TitleBar',
  component: TitleBar,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
App-level navigation bar with logo, title, tabs, and actions.

## When to Use

- Top of the application as the main navigation header
- When you need centered tab navigation (e.g., Work/Web modes)
- When you need to display app branding alongside navigation

## Best Practices

- Keep the logo small (24-32px) and recognizable
- Limit tabs to 2-4 for clarity
- Use the actions slot for user profile, settings, or quick actions

## Usage

\`\`\`jsx
const [activeTab, setActiveTab] = useState('work');

<TitleBar
  logo={<Logo />}
  title="My App"
  tabs={[
    { value: 'work', label: 'Work' },
    { value: 'web', label: 'Web' },
  ]}
  activeTab={activeTab}
  onTabChange={setActiveTab}
  actions={<Avatar name="John Doe" size="sm" />}
/>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TitleBar>;

export default meta;
type Story = StoryObj<typeof meta>;

// Simple logo component for stories
const LogoIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeWidth="2" stroke="currentColor" fill="none" />
  </svg>
);

export const Default: Story = {
  args: {
    logo: <LogoIcon />,
    title: 'My Application',
  },
};

export const WithTabs: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState('work');

    return (
      <TitleBar
        logo={<LogoIcon />}
        title="Coworker"
        tabs={[
          { value: 'work', label: 'Work' },
          { value: 'web', label: 'Web' },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    );
  },
};

export const WithTabIcons: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState('work');

    const WorkIcon = () => (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="4" width="12" height="10" rx="1" />
        <path d="M5 4V3a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1" />
      </svg>
    );

    const WebIcon = () => (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="8" cy="8" r="6" />
        <path d="M2 8h12M8 2a10 10 0 0 1 0 12M8 2a10 10 0 0 0 0 12" />
      </svg>
    );

    return (
      <TitleBar
        logo={<LogoIcon />}
        title="Coworker"
        tabs={[
          { value: 'work', label: 'Work', icon: <WorkIcon /> },
          { value: 'web', label: 'Web', icon: <WebIcon /> },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    );
  },
};

export const WithActions: Story = {
  args: {
    logo: <LogoIcon />,
    title: 'Dashboard',
    actions: (
      <>
        <Button variant="ghost" size="sm">Help</Button>
        <Avatar name="John Doe" size="sm" />
      </>
    ),
  },
};

export const Complete: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState('work');

    return (
      <TitleBar
        logo={<LogoIcon />}
        title="Coworker"
        tabs={[
          { value: 'work', label: 'Work' },
          { value: 'web', label: 'Web' },
          { value: 'chat', label: 'Chat' },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <>
            <Button variant="ghost" size="sm">Settings</Button>
            <Avatar name="Jane Smith" size="sm" />
          </>
        }
      />
    );
  },
};

export const LogoOnly: Story = {
  args: {
    logo: <LogoIcon />,
  },
};

export const TitleOnly: Story = {
  args: {
    title: 'Simple App',
  },
};
