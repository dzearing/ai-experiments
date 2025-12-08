import type { Meta, StoryObj } from '@storybook/react';
import { ECommerce } from './ECommerce';

const meta: Meta<typeof ECommerce> = {
  title: 'Pages/ECommerce',
  component: ECommerce,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof ECommerce>;

export const Default: Story = {};
