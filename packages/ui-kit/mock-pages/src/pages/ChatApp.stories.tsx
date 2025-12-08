import type { Meta, StoryObj } from '@storybook/react';
import { ChatApp } from './ChatApp';

const meta: Meta<typeof ChatApp> = {
  title: 'Pages/ChatApp',
  component: ChatApp,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof ChatApp>;

export const Default: Story = {};
