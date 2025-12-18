import type { Meta, StoryObj } from '@storybook/react';
import { Auth } from './Auth';

const meta = {
  title: 'Pages/Auth',
  component: Auth,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Auth>;

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
