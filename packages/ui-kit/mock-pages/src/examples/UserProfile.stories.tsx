import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  Avatar,
  Button,
  Chip,
  Divider,
  Heading,
  Panel,
  Stack,
  Tabs,
  Text,
  Progress,
} from '@ui-kit/react';

/**
 * # User Profile Page
 *
 * A typical user profile page demonstrating how components work together.
 *
 * ## Components Used
 * - **Avatar**: User profile image with fallback initials
 * - **Chip**: Status indicators (online/offline, verification), skill tags
 * - **Button**: Primary action (Edit Profile), default action (Follow), ghost action (Message)
 * - **Panel**: Content sections
 * - **Tabs**: Navigation between profile sections
 * - **Progress**: Profile completion indicator
 */

function UserProfilePage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem' }}>
      <Panel padding="lg">
        {/* Profile Header */}
        <Stack direction="horizontal" gap="lg" align="start">
          <div style={{ position: 'relative' }}>
            <Avatar
              size="xl"
              src="https://i.pravatar.cc/150?u=sarah"
              alt="Sarah Johnson"
              fallback="SJ"
            />
            <div style={{
              position: 'absolute',
              bottom: 4,
              right: 4,
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: 'var(--success-icon)',
              border: '2px solid var(--page-bg)',
            }} />
          </div>

          <Stack gap="sm" style={{ flex: 1 }}>
            <Stack direction="horizontal" align="center" gap="sm">
              <Heading level={2}>Sarah Johnson</Heading>
              <Chip variant="info" size="sm">Pro</Chip>
            </Stack>

            <Text color="soft">Senior Software Engineer at TechCorp</Text>
            <Text size="sm" color="soft">San Francisco, CA</Text>

            <Stack direction="horizontal" gap="md" style={{ marginTop: '0.5rem' }}>
              <Text size="sm"><strong>1,234</strong> followers</Text>
              <Text size="sm"><strong>567</strong> following</Text>
              <Text size="sm"><strong>89</strong> projects</Text>
            </Stack>
          </Stack>

          <Stack direction="horizontal" gap="sm">
            <Button variant="primary">Edit Profile</Button>
            <Button variant="default">Share</Button>
          </Stack>
        </Stack>

        <Divider style={{ margin: '1.5rem 0' }} />

        {/* Profile Completion */}
        <Stack gap="sm">
          <Stack direction="horizontal" justify="between" align="center">
            <Text size="sm" weight="medium">Profile Completion</Text>
            <Text size="sm" color="soft">85%</Text>
          </Stack>
          <Progress value={85} size="sm" />
          <Text size="xs" color="soft">Add a bio to complete your profile</Text>
        </Stack>
      </Panel>

      <div style={{ marginTop: '1.5rem' }}>
        <Tabs
          items={[
            { value: 'overview', label: 'Overview', content: null },
            { value: 'projects', label: 'Projects (12)', content: null },
            { value: 'activity', label: 'Activity', content: null },
            { value: 'connections', label: 'Connections', content: null },
          ]}
          value={activeTab}
          onChange={setActiveTab}
        />

        <Panel style={{ marginTop: '1rem' }} padding="lg">
          {activeTab === 'overview' && (
            <Stack gap="xl">
              <Stack gap="sm">
                <Heading level={3}>About</Heading>
                <Text>
                  Passionate software engineer with 8+ years of experience building
                  scalable web applications. I love working with React, TypeScript,
                  and exploring new technologies.
                </Text>
              </Stack>

              <Stack gap="sm">
                <Heading level={4}>Skills</Heading>
                <Stack direction="horizontal" gap="sm" wrap>
                  <Chip variant="default" onRemove={() => {}}>React</Chip>
                  <Chip variant="default" onRemove={() => {}}>TypeScript</Chip>
                  <Chip variant="default" onRemove={() => {}}>Node.js</Chip>
                  <Chip variant="default" onRemove={() => {}}>GraphQL</Chip>
                  <Chip variant="default" onRemove={() => {}}>AWS</Chip>
                  <Chip variant="outline">+ Add Skill</Chip>
                </Stack>
              </Stack>

              <Stack gap="sm">
                <Heading level={4}>Experience</Heading>
                <Stack gap="md">
                  <Stack direction="horizontal" gap="md" align="start">
                    <Avatar size="sm" fallback="TC" />
                    <Stack gap="xs">
                      <Text weight="medium">Senior Software Engineer</Text>
                      <Text size="sm" color="soft">TechCorp Inc.</Text>
                      <Stack direction="horizontal" gap="sm" align="center">
                        <Chip variant="success" size="sm">Current</Chip>
                        <Text size="xs" color="soft">2020 - Present</Text>
                      </Stack>
                    </Stack>
                  </Stack>

                  <Stack direction="horizontal" gap="md" align="start">
                    <Avatar size="sm" fallback="SI" />
                    <Stack gap="xs">
                      <Text weight="medium">Software Engineer</Text>
                      <Text size="sm" color="soft">StartupInc</Text>
                      <Text size="xs" color="soft">2017 - 2020</Text>
                    </Stack>
                  </Stack>
                </Stack>
              </Stack>
            </Stack>
          )}

          {activeTab === 'projects' && (
            <Stack gap="lg">
              <Heading level={3}>Projects</Heading>
              <Stack gap="md">
                {[
                  { name: 'E-commerce Platform', tech: 'React, Node.js', status: 'Active' },
                  { name: 'Task Management App', tech: 'TypeScript, GraphQL', status: 'Active' },
                  { name: 'Design System', tech: 'React, CSS', status: 'Completed' },
                  { name: 'API Gateway', tech: 'Node.js, AWS', status: 'Completed' },
                ].map((project) => (
                  <div
                    key={project.name}
                    style={{
                      padding: 'var(--space-3)',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--inset-bg)',
                    }}
                  >
                    <Stack direction="horizontal" justify="between" align="center">
                      <Stack gap="xs">
                        <Text weight="medium">{project.name}</Text>
                        <Text size="sm" color="soft">{project.tech}</Text>
                      </Stack>
                      <Chip
                        variant={project.status === 'Active' ? 'success' : 'default'}
                        size="sm"
                      >
                        {project.status}
                      </Chip>
                    </Stack>
                  </div>
                ))}
              </Stack>
            </Stack>
          )}

          {activeTab === 'activity' && (
            <Stack gap="lg">
              <Heading level={3}>Recent Activity</Heading>
              <Stack gap="md">
                {[
                  { action: 'Pushed to', target: 'main branch', time: '2 hours ago' },
                  { action: 'Commented on', target: 'PR #234', time: '5 hours ago' },
                  { action: 'Created issue', target: '#456', time: '1 day ago' },
                  { action: 'Merged', target: 'PR #231', time: '2 days ago' },
                  { action: 'Started following', target: 'React Team', time: '3 days ago' },
                ].map((activity, index) => (
                  <Stack key={index} direction="horizontal" gap="sm" align="center">
                    <Avatar size="sm" fallback="SJ" />
                    <Stack gap="xs" style={{ flex: 1 }}>
                      <Text size="sm">
                        <Text as="span" color="soft">{activity.action} </Text>
                        <Text as="span" weight="medium">{activity.target}</Text>
                      </Text>
                      <Text size="xs" color="soft">{activity.time}</Text>
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            </Stack>
          )}

          {activeTab === 'connections' && (
            <Stack gap="lg">
              <Heading level={3}>Connections</Heading>
              <Stack gap="md">
                {[
                  { name: 'John Doe', role: 'Tech Lead', mutual: 12 },
                  { name: 'Emily Chen', role: 'Designer', mutual: 8 },
                  { name: 'Mike Wilson', role: 'Backend Engineer', mutual: 15 },
                  { name: 'Lisa Park', role: 'Product Manager', mutual: 6 },
                ].map((connection) => (
                  <Stack key={connection.name} direction="horizontal" gap="md" align="center" justify="between">
                    <Stack direction="horizontal" gap="md" align="center">
                      <Avatar fallback={connection.name.split(' ').map(n => n[0]).join('')} />
                      <Stack gap="xs">
                        <Text weight="medium">{connection.name}</Text>
                        <Text size="sm" color="soft">{connection.role}</Text>
                        <Text size="xs" color="soft">{connection.mutual} mutual connections</Text>
                      </Stack>
                    </Stack>
                    <Button variant="default" size="sm">Message</Button>
                  </Stack>
                ))}
              </Stack>
            </Stack>
          )}
        </Panel>
      </div>
    </div>
  );
}

const meta: Meta = {
  title: 'Example Pages/User Profile',
  component: UserProfilePage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
## When to Use These Components

### Avatar
- **Use for**: Profile pictures, user identification
- **With status dot**: Show online status using positioned div
- **Sizes**: Use \`xl\` for profile headers, \`md\` for lists, \`sm\` for compact views

### Chip
- **Use for**: Status indicators, counts, labels, tags
- **Variants**:
  - \`success\` for positive states (online, verified, active)
  - \`info\` for informational labels (Pro, Premium)
  - \`warning\` for caution states
  - \`error\` for negative states (offline, error)
  - \`default\` for neutral tags
  - \`outline\` for subtle tags

### Button
- **Primary**: Main action on the page (Edit Profile, Save, Submit)
- **Default**: Secondary actions (Share, Cancel)
- **Ghost**: Tertiary actions, less prominent
- **Danger**: Destructive actions (Delete, Remove)

### Chip
- **Use for**: Tags, filters, removable items
- **With onRemove**: For tags that can be removed
- **Outline variant**: For "add" actions

### Progress
- **Use for**: Completion indicators, loading states
- **With label**: Show percentage or step count
        `,
      },
    },
  },
};

export default meta;

type Story = StoryObj;

export const Default: Story = {};
