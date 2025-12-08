import type { Meta, StoryObj } from '@storybook/react';
import {
  Avatar,
  Button,
  Chip,
  Divider,
  Grid,
  Heading,
  Panel,
  Progress,
  Stack,
  Text,
} from '../index';

/**
 * # Dashboard
 *
 * A project management dashboard demonstrating data visualization
 * and summary components.
 *
 * ## Components Used
 * - **Panel**: Metric cards, sections
 * - **Progress**: Completion indicators
 * - **Chip**: Status labels, tags, filters
 * - **Avatar**: Team members
 * - **Grid**: Card layout
 * - **Dropdown**: Action menus
 */

function DashboardPage() {
  const metrics = [
    { label: 'Total Projects', value: '24', change: '+3', trend: 'up' },
    { label: 'Active Tasks', value: '142', change: '+12', trend: 'up' },
    { label: 'Completed', value: '89', change: '+8', trend: 'up' },
    { label: 'Team Members', value: '16', change: '0', trend: 'neutral' },
  ];

  const projects = [
    {
      id: '1',
      name: 'Website Redesign',
      progress: 75,
      status: 'on-track',
      team: ['JD', 'SK', 'MR'],
      dueDate: 'Dec 15',
      priority: 'high',
    },
    {
      id: '2',
      name: 'Mobile App v2.0',
      progress: 45,
      status: 'at-risk',
      team: ['AB', 'CD'],
      dueDate: 'Dec 20',
      priority: 'high',
    },
    {
      id: '3',
      name: 'API Integration',
      progress: 90,
      status: 'on-track',
      team: ['EF', 'GH', 'IJ', 'KL'],
      dueDate: 'Dec 10',
      priority: 'medium',
    },
    {
      id: '4',
      name: 'Documentation Update',
      progress: 30,
      status: 'behind',
      team: ['MN'],
      dueDate: 'Dec 25',
      priority: 'low',
    },
  ];

  const recentActivity = [
    { user: 'John Doe', action: 'completed task', target: 'Update homepage hero', time: '2 min ago' },
    { user: 'Sarah Kim', action: 'commented on', target: 'API endpoints review', time: '15 min ago' },
    { user: 'Mike Ross', action: 'created task', target: 'Add unit tests', time: '1 hour ago' },
    { user: 'Anna Bell', action: 'moved', target: 'Design review to Done', time: '2 hours ago' },
  ];

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'on-track':
        return <Chip variant="success" size="sm">On Track</Chip>;
      case 'at-risk':
        return <Chip variant="warning" size="sm">At Risk</Chip>;
      case 'behind':
        return <Chip variant="error" size="sm">Behind</Chip>;
      default:
        return <Chip size="sm">{status}</Chip>;
    }
  };

  const getPriorityChip = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Chip size="sm" variant="default">High</Chip>;
      case 'medium':
        return <Chip size="sm" variant="outline">Medium</Chip>;
      case 'low':
        return <Chip size="sm" variant="outline">Low</Chip>;
      default:
        return null;
    }
  };

  return (
    <div style={{ padding: '2rem', height: '100vh', overflow: 'auto' }}>
      {/* Header */}
      <Stack direction="row" justify="between" align="center">
        <div>
          <Heading level={1}>Dashboard</Heading>
          <Text color="soft">Welcome back, John. Here's what's happening.</Text>
        </div>
        <Stack direction="row" gap="sm">
          <Button variant="default">Export</Button>
          <Button variant="primary">+ New Project</Button>
        </Stack>
      </Stack>

      {/* Metrics Grid */}
      <Grid columns={4} gap="md" style={{ marginTop: '2rem' }}>
        {metrics.map((metric) => (
          <Panel key={metric.label} padding="lg">
            <Text size="sm" color="soft">{metric.label}</Text>
            <Stack direction="row" align="end" gap="sm" style={{ marginTop: '0.5rem' }}>
              <Text size="2xl" weight="bold">{metric.value}</Text>
              {metric.change !== '0' && (
                <Text
                  size="sm"
                  style={{
                    color: metric.trend === 'up' ? 'var(--success-icon)' : 'var(--danger-icon)',
                    marginBottom: '4px',
                  }}
                >
                  {metric.change}
                </Text>
              )}
            </Stack>
          </Panel>
        ))}
      </Grid>

      {/* Main Content */}
      <Grid columns={3} gap="lg" style={{ marginTop: '2rem' }}>
        {/* Projects Section */}
        <div style={{ gridColumn: 'span 2' }}>
          <Panel padding="lg">
            <Stack direction="row" justify="between" align="center">
              <Heading level={3}>Active Projects</Heading>
              <Button variant="ghost" size="sm">View All</Button>
            </Stack>

            <Divider style={{ margin: '1rem 0' }} />

            <Stack gap="md">
              {projects.map((project) => (
                <div
                  key={project.id}
                  style={{
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--inset-bg)',
                  }}
                >
                  <Stack direction="row" justify="between" align="start">
                    <div style={{ flex: 1 }}>
                      <Stack direction="row" align="center" gap="sm">
                        <Text weight="medium">{project.name}</Text>
                        {getStatusChip(project.status)}
                        {getPriorityChip(project.priority)}
                      </Stack>

                      <Stack direction="row" align="center" gap="md" style={{ marginTop: '0.75rem' }}>
                        <div style={{ flex: 1, maxWidth: 200 }}>
                          <Progress value={project.progress} size="sm" />
                        </div>
                        <Text size="sm" color="soft">{project.progress}%</Text>
                      </Stack>

                      <Stack direction="row" align="center" gap="md" style={{ marginTop: '0.75rem' }}>
                        <Stack direction="row" gap="xs">
                          {project.team.slice(0, 3).map((member, i) => (
                            <Avatar
                              key={i}
                              size="sm"
                              fallback={member}
                              style={{ marginLeft: i > 0 ? '-8px' : 0 }}
                            />
                          ))}
                          {project.team.length > 3 && (
                            <Avatar
                              size="sm"
                              fallback={`+${project.team.length - 3}`}
                              style={{ marginLeft: '-8px' }}
                            />
                          )}
                        </Stack>
                        <Text size="xs" color="softer">Due {project.dueDate}</Text>
                      </Stack>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Project actions"
                    >
                      ⋮
                    </Button>
                  </Stack>
                </div>
              ))}
            </Stack>
          </Panel>
        </div>

        {/* Activity Feed */}
        <div>
          <Panel padding="lg">
            <Heading level={3}>Recent Activity</Heading>

            <Divider style={{ margin: '1rem 0' }} />

            <Stack gap="md">
              {recentActivity.map((activity, index) => (
                <Stack key={index} direction="row" gap="sm" align="start">
                  <Avatar size="sm" fallback={activity.user.split(' ').map(n => n[0]).join('')} />
                  <Stack gap="xs" style={{ flex: 1 }}>
                    <Text size="sm">
                      <Text as="span" weight="medium">{activity.user}</Text>
                      <Text as="span" color="soft">{' '}{activity.action}{' '}</Text>
                      <Text as="span" weight="medium">{activity.target}</Text>
                    </Text>
                    <Text size="xs" color="softer">{activity.time}</Text>
                  </Stack>
                </Stack>
              ))}
            </Stack>

            <Button variant="ghost" style={{ width: '100%', marginTop: '1rem' }}>
              View All Activity
            </Button>
          </Panel>

          {/* Quick Actions */}
          <Panel padding="lg" style={{ marginTop: '1rem' }}>
            <Heading level={4}>Quick Actions</Heading>

            <Divider style={{ margin: '1rem 0' }} />

            <Stack gap="sm">
              <Button variant="default" style={{ width: '100%', justifyContent: 'flex-start' }}>
                + Create Task
              </Button>
              <Button variant="default" style={{ width: '100%', justifyContent: 'flex-start' }}>
                + Add Team Member
              </Button>
              <Button variant="default" style={{ width: '100%', justifyContent: 'flex-start' }}>
                + Schedule Meeting
              </Button>
            </Stack>
          </Panel>
        </div>
      </Grid>

      {/* Team Overview */}
      <Panel padding="lg" style={{ marginTop: '2rem' }}>
        <Stack direction="row" justify="between" align="center">
          <Heading level={3}>Team Overview</Heading>
          <Stack direction="row" gap="sm">
            <Chip variant="default">All</Chip>
            <Chip variant="outline">Engineering</Chip>
            <Chip variant="outline">Design</Chip>
            <Chip variant="outline">Product</Chip>
          </Stack>
        </Stack>

        <Divider style={{ margin: '1rem 0' }} />

        <Grid columns={4} gap="md">
          {[
            { name: 'John Doe', role: 'Team Lead', tasks: 12, avatar: 'JD' },
            { name: 'Sarah Kim', role: 'Designer', tasks: 8, avatar: 'SK' },
            { name: 'Mike Ross', role: 'Developer', tasks: 15, avatar: 'MR' },
            { name: 'Anna Bell', role: 'Developer', tasks: 10, avatar: 'AB' },
          ].map((member) => (
            <Stack key={member.name} direction="row" gap="md" align="center">
              <Avatar fallback={member.avatar} />
              <Stack gap="xs">
                <Text weight="medium">{member.name}</Text>
                <Text size="sm" color="soft">{member.role}</Text>
                <Chip variant="info" size="sm">{member.tasks} tasks</Chip>
              </Stack>
            </Stack>
          ))}
        </Grid>
      </Panel>
    </div>
  );
}

const meta: Meta = {
  title: 'Example Pages/Dashboard',
  component: DashboardPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
## Building a Dashboard

This example demonstrates how to build a project management dashboard with metrics, project cards, and activity feeds.

### Dashboard Patterns

#### Metric Cards
- Use **Panel** for each metric card
- Display the metric value prominently with \`size="2xl" weight="bold"\`
- Show trends with colored text (green for positive, red for negative)
- Use **Grid** with 4 columns for responsive layout

#### Project Cards
- Use **Chip** for both status (semantic variants) and priority
- Use **Progress** to show completion percentage
- Stack **Avatar** components with negative margins for team display
- Add action **Button** for menus

#### Activity Feed
- Use **Avatar** + **Stack** for each activity item
- Highlight usernames and targets with \`weight="medium"\`
- Show relative timestamps in \`color="softer"\`

#### Quick Actions
- Group common actions in a sidebar panel
- Use full-width buttons with \`justifyContent: flex-start\`

### Chip Variants

| Variant | Use Case |
|---------|----------|
| **success/warning/error** | Status indicators (On Track, At Risk, Behind) |
| **default/outline** | Filters, tags, categories (High, Medium, Low) |
| **info** | Informational badges (task counts, labels) |

### Avatar Stacking
Stack team member avatars by using negative margins:
\`\`\`jsx
{team.map((member, i) => (
  <Avatar
    key={i}
    size="sm"
    fallback={member}
    style={{ marginLeft: i > 0 ? '-8px' : 0 }}
  />
))}
\`\`\`

### Components Used

| Component | Purpose |
|-----------|---------|
| Panel | Metric cards, sections |
| Progress | Project completion |
| Chip | Status labels, priority tags, filters |
| Avatar | Team members |
| Grid | Responsive layouts |
| Button | Actions |
| Divider | Section separators |
        `,
      },
    },
  },
};

export default meta;

type Story = StoryObj;

export const Default: Story = {};
