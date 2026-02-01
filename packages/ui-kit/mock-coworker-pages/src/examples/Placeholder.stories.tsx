import type { Meta, StoryObj } from '@storybook/react';

/**
 * Placeholder story to bootstrap the mock-coworker-pages Storybook.
 * Replace this with actual coworker interaction mockups.
 */
const PlaceholderComponent = () => {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Mock Coworker Pages</h1>
      <p>Add your coworker interaction mockups here.</p>
    </div>
  );
};

const meta: Meta<typeof PlaceholderComponent> = {
  title: 'Example Pages/Placeholder',
  component: PlaceholderComponent,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof PlaceholderComponent>;

export const Default: Story = {};
