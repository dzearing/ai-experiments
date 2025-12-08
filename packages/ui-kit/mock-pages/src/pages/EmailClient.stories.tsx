import type { Meta, StoryObj } from '@storybook/react';
import { EmailClient } from './EmailClient';

const meta: Meta<typeof EmailClient> = {
  title: 'Pages/EmailClient',
  component: EmailClient,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof EmailClient>;

export const Default: Story = {};
