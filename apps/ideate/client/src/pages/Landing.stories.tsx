import type { Meta, StoryObj } from '@storybook/react';
import { Landing } from './Landing';

const meta = {
  title: 'Pages/Landing',
  component: Landing,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Landing>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const DarkMode: Story = {
  decorators: [
    (Story) => {
      // Set dark mode
      document.documentElement.setAttribute('data-theme-mode', 'dark');
      return <Story />;
    },
  ],
};
