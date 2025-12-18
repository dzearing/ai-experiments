import type { Meta, StoryObj } from '@storybook/react';
import { Dashboard } from './Dashboard';
import { AuthProvider } from '../contexts/AuthContext';
import { DocumentProvider } from '../contexts/DocumentContext';
import { NetworkProvider } from '../contexts/NetworkContext';

// Wrapper component to provide required context
function DashboardWrapper() {
  return (
    <AuthProvider>
      <DocumentProvider>
        <NetworkProvider>
          <Dashboard />
        </NetworkProvider>
      </DocumentProvider>
    </AuthProvider>
  );
}

const meta = {
  title: 'Pages/Dashboard',
  component: DashboardWrapper,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DashboardWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithDocuments: Story = {
  // Note: In a real implementation, we'd use mock data providers
};

export const EmptyState: Story = {
  // Note: In a real implementation, we'd use mock data providers with empty data
};

export const WithNetworkDocuments: Story = {
  // Note: In a real implementation, we'd mock network discovery
};
