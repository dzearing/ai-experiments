import type { Meta, StoryObj } from '@storybook/react';
import { Settings } from './Settings';
import { AuthProvider } from '../contexts/AuthContext';

// Wrapper component to provide required context
function SettingsWrapper() {
  return (
    <AuthProvider>
      <Settings />
    </AuthProvider>
  );
}

const meta = {
  title: 'Pages/Settings',
  component: SettingsWrapper,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SettingsWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const DarkMode: Story = {
  decorators: [
    (Story) => {
      document.documentElement.setAttribute('data-theme-mode', 'dark');
      return <Story />;
    },
  ],
};
