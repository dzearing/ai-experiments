/**
 * Project Topic - Project management with tasks, milestones, and team
 */
import { useState } from 'react';
import {
  Avatar,
  Button,
  Chip,
  Divider,
  Heading,
  IconButton,
  Progress,
  Tabs,
  Text,
} from '@ui-kit/react';
import { AddIcon } from '@ui-kit/icons/AddIcon';
import { CalendarIcon } from '@ui-kit/icons/CalendarIcon';
import { ChatIcon } from '@ui-kit/icons/ChatIcon';
import { CheckCircleIcon } from '@ui-kit/icons/CheckCircleIcon';
import { ClockIcon } from '@ui-kit/icons/ClockIcon';
import { CloseIcon } from '@ui-kit/icons/CloseIcon';
import { EditIcon } from '@ui-kit/icons/EditIcon';
import { PlayIcon } from '@ui-kit/icons/PlayIcon';
import { ShareIcon } from '@ui-kit/icons/ShareIcon';
import { UsersIcon } from '@ui-kit/icons/UsersIcon';
import { WarningIcon } from '@ui-kit/icons/WarningIcon';
import type { BaseTopic } from '../shared/types';
import styles from '../shared/styles.module.css';

export interface ProjectTask {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'review' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: { name: string; avatar?: string };
  dueDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
}

export interface ProjectMilestone {
  id: string;
  title: string;
  dueDate: Date;
  status: 'upcoming' | 'in-progress' | 'completed' | 'overdue';
  tasks: string[];
}

export interface ProjectAlert {
  id: string;
  type: 'overdue' | 'at-risk' | 'blocked' | 'deadline';
  title: string;
  description: string;
  taskId?: string;
  severity: 'info' | 'warning' | 'danger';
  createdAt: Date;
}

export interface ProjectTeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  tasksAssigned: number;
  tasksCompleted: number;
}

export interface ProjectTopic extends BaseTopic {
  type: 'project';
  heroImage?: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed';
  startDate: Date;
  targetDate: Date;
  tasks: ProjectTask[];
  milestones: ProjectMilestone[];
  alerts: ProjectAlert[];
  team: ProjectTeamMember[];
  progress: number;
}

export const sampleProject: ProjectTopic = {
  id: 'project-1',
  type: 'project',
  name: 'Website Redesign',
  description: 'Complete overhaul of the company website with new branding, improved UX, and modern tech stack.',
  tags: ['design', 'frontend', 'q1-2024', 'high-priority'],
  heroImage: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&q=80',
  status: 'active',
  startDate: new Date('2024-01-01'),
  targetDate: new Date('2024-03-31'),
  progress: 45,
  tasks: [
    { id: 't1', title: 'Design system setup', status: 'done', priority: 'high', assignee: { name: 'Sarah Chen' }, dueDate: new Date('2024-01-15'), estimatedHours: 40, actualHours: 38, tags: ['design'] },
    { id: 't2', title: 'Homepage wireframes', status: 'done', priority: 'high', assignee: { name: 'Sarah Chen' }, dueDate: new Date('2024-01-22'), estimatedHours: 24, actualHours: 28, tags: ['design', 'ux'] },
    { id: 't3', title: 'Component library', status: 'in-progress', priority: 'high', assignee: { name: 'Mike Johnson' }, dueDate: new Date('2024-02-15'), estimatedHours: 60, actualHours: 32, tags: ['frontend', 'components'] },
    { id: 't4', title: 'API integration', status: 'in-progress', priority: 'medium', assignee: { name: 'Alex Kim' }, dueDate: new Date('2024-02-20'), estimatedHours: 40, tags: ['backend', 'api'] },
    { id: 't5', title: 'Content migration', status: 'todo', priority: 'medium', assignee: { name: 'Emily Davis' }, dueDate: new Date('2024-02-28'), estimatedHours: 32, tags: ['content'] },
    { id: 't6', title: 'SEO optimization', status: 'todo', priority: 'low', dueDate: new Date('2024-03-10'), estimatedHours: 16, tags: ['seo'] },
    { id: 't7', title: 'Performance audit', status: 'blocked', priority: 'high', assignee: { name: 'Mike Johnson' }, dueDate: new Date('2024-02-10'), estimatedHours: 16, description: 'Waiting on component library completion', tags: ['performance'] },
    { id: 't8', title: 'Accessibility review', status: 'review', priority: 'high', assignee: { name: 'Sarah Chen' }, dueDate: new Date('2024-02-05'), estimatedHours: 20, actualHours: 18, tags: ['a11y'] },
  ],
  milestones: [
    { id: 'm1', title: 'Design Phase Complete', dueDate: new Date('2024-01-31'), status: 'completed', tasks: ['t1', 't2'] },
    { id: 'm2', title: 'Development Sprint 1', dueDate: new Date('2024-02-15'), status: 'in-progress', tasks: ['t3', 't7', 't8'] },
    { id: 'm3', title: 'Content & Integration', dueDate: new Date('2024-02-29'), status: 'upcoming', tasks: ['t4', 't5'] },
    { id: 'm4', title: 'Launch Preparation', dueDate: new Date('2024-03-31'), status: 'upcoming', tasks: ['t6'] },
  ],
  alerts: [
    { id: 'a1', type: 'blocked', title: 'Task Blocked', description: 'Performance audit is blocked by component library', taskId: 't7', severity: 'warning', createdAt: new Date('2024-02-08') },
    { id: 'a2', type: 'at-risk', title: 'Milestone At Risk', description: 'Development Sprint 1 may not complete on time', severity: 'warning', createdAt: new Date('2024-02-10') },
    { id: 'a3', type: 'deadline', title: 'Deadline Approaching', description: 'API integration due in 5 days', taskId: 't4', severity: 'info', createdAt: new Date('2024-02-15') },
  ],
  team: [
    { id: 'u1', name: 'Sarah Chen', role: 'Lead Designer', tasksAssigned: 3, tasksCompleted: 2 },
    { id: 'u2', name: 'Mike Johnson', role: 'Senior Developer', tasksAssigned: 2, tasksCompleted: 0 },
    { id: 'u3', name: 'Alex Kim', role: 'Backend Developer', tasksAssigned: 1, tasksCompleted: 0 },
    { id: 'u4', name: 'Emily Davis', role: 'Content Manager', tasksAssigned: 1, tasksCompleted: 0 },
  ],
  createdAt: new Date('2023-12-15'),
  updatedAt: new Date('2024-02-12'),
  chatCount: 24,
  documentCount: 12,
  ideaCount: 8,
};

export function ProjectTopicDetail({ topic }: { topic: ProjectTopic }) {
  const [activeTab, setActiveTab] = useState('overview');

  const statusColors: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error'> = {
    'todo': 'default',
    'in-progress': 'primary',
    'review': 'warning',
    'done': 'success',
    'blocked': 'error',
  };

  const priorityColors: Record<string, 'default' | 'primary' | 'warning' | 'error'> = {
    'low': 'default',
    'medium': 'primary',
    'high': 'warning',
    'critical': 'error',
  };

  const completedTasks = topic.tasks.filter(t => t.status === 'done').length;
  const inProgressTasks = topic.tasks.filter(t => t.status === 'in-progress').length;
  const blockedTasks = topic.tasks.filter(t => t.status === 'blocked').length;

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <div className={styles.heroSection}>
        {topic.heroImage ? (
          <div className={styles.heroImage} style={{ backgroundImage: `url(${topic.heroImage})` }}>
            <div className={styles.heroActions}>
              <Button variant="primary" icon={<ChatIcon />} className={`${styles.heroActionButton} ${styles.askButton}`}>Chat about this project</Button>
              <IconButton variant="ghost" icon={<EditIcon />} aria-label="Edit topic" className={styles.heroActionButton} />
              <IconButton variant="ghost" icon={<ShareIcon />} aria-label="Share" className={styles.heroActionButton} />
            </div>
            <div className={styles.heroOverlay}>
              {topic.tags.length > 0 && (
                <div className={styles.heroTags}>
                  {topic.tags.map(tag => (
                    <span key={tag} className={styles.heroTag}>#{tag}</span>
                  ))}
                </div>
              )}
              <Heading level={1} size={1} className={styles.heroTitle}>{topic.name}</Heading>
              <div className={styles.heroSubtitle}>
                {topic.startDate.toLocaleDateString()} - {topic.targetDate.toLocaleDateString()}
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.heroPlaceholder}>
            <CalendarIcon className={styles.heroPlaceholderIcon} />
            <Heading level={1} size={2}>{topic.name}</Heading>
          </div>
        )}
      </div>

      {/* Project Progress Bar */}
      <div className={styles.projectProgress}>
        <div className={styles.progressHeader}>
          <Text weight="medium">{topic.progress}% Complete</Text>
          <Text size="sm" color="soft">
            {completedTasks} of {topic.tasks.length} tasks done
          </Text>
        </div>
        <Progress value={topic.progress} max={100} />
      </div>

      {/* Alerts Section */}
      {topic.alerts.length > 0 && (
        <div className={styles.alertsSection}>
          {topic.alerts.map(alert => (
            <div key={alert.id} className={`${styles.alertItem} surface ${alert.severity}`}>
              <WarningIcon className={styles.alertIcon} />
              <div className={styles.alertContent}>
                <Text weight="medium">{alert.title}</Text>
                <Text size="sm">{alert.description}</Text>
              </div>
              <IconButton variant="ghost" size="sm" icon={<CloseIcon />} aria-label="Dismiss" />
            </div>
          ))}
        </div>
      )}

      {/* Quick Stats */}
      <div className={styles.quickStats}>
        <div className={styles.statItem}>
          <CheckCircleIcon className={styles.statIcon} />
          <span className={styles.statValue}>{completedTasks}</span>
          <span className={styles.statLabel}>Completed</span>
        </div>
        <div className={styles.statItem}>
          <PlayIcon className={styles.statIcon} />
          <span className={styles.statValue}>{inProgressTasks}</span>
          <span className={styles.statLabel}>In Progress</span>
        </div>
        <div className={styles.statItem}>
          <CloseIcon className={styles.statIcon} />
          <span className={styles.statValue}>{blockedTasks}</span>
          <span className={styles.statLabel}>Blocked</span>
        </div>
        <div className={styles.statItem}>
          <UsersIcon className={styles.statIcon} />
          <span className={styles.statValue}>{topic.team.length}</span>
          <span className={styles.statLabel}>Team Members</span>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <Tabs
          value={activeTab}
          onChange={setActiveTab}
          items={[
            { value: 'overview', label: 'Overview', content: null },
            { value: 'tasks', label: 'Tasks', content: null },
            { value: 'schedule', label: 'Schedule', content: null },
            { value: 'team', label: 'Team', content: null },
          ]}
        />
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === 'overview' && (
          <div className={styles.projectOverview}>
            <div className={styles.descriptionSection}>
              <Text className={styles.description}>{topic.description}</Text>
            </div>

            <Divider />

            <div className={styles.milestonesSection}>
              <Heading level={3} size={4}>Milestones</Heading>
              <div className={styles.milestonesList}>
                {topic.milestones.map(milestone => {
                  const milestoneProgress = milestone.status === 'completed' ? 100 :
                    milestone.status === 'in-progress' ? 50 : 0;

                  return (
                    <div key={milestone.id} className={styles.milestoneItem}>
                      <div className={styles.milestoneHeader}>
                        <Text weight="medium">{milestone.title}</Text>
                        <Chip
                          size="sm"
                          variant={milestone.status === 'completed' ? 'success' :
                            milestone.status === 'overdue' ? 'error' :
                            milestone.status === 'in-progress' ? 'primary' : 'default'}
                        >
                          {milestone.status}
                        </Chip>
                      </div>
                      <Progress value={milestoneProgress} max={100} size="sm" />
                      <Text size="xs" color="soft">
                        Due: {milestone.dueDate.toLocaleDateString()} · {milestone.tasks.length} tasks
                      </Text>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className={styles.tasksList}>
            {topic.tasks.map(task => (
              <div key={task.id} className={styles.taskItem}>
                <div className={styles.taskHeader}>
                  <div className={styles.taskTitleRow}>
                    <Chip size="sm" variant={statusColors[task.status]}>{task.status}</Chip>
                    <Text weight="medium">{task.title}</Text>
                  </div>
                  <Chip size="sm" variant={priorityColors[task.priority]}>{task.priority}</Chip>
                </div>
                {task.description && (
                  <Text size="sm" color="soft">{task.description}</Text>
                )}
                <div className={styles.taskMeta}>
                  {task.assignee && (
                    <div className={styles.taskAssignee}>
                      <Avatar size="xs" fallback={task.assignee.name} />
                      <Text size="xs">{task.assignee.name}</Text>
                    </div>
                  )}
                  {task.dueDate && (
                    <Text size="xs" color="soft">
                      <CalendarIcon className={styles.taskMetaIcon} />
                      {task.dueDate.toLocaleDateString()}
                    </Text>
                  )}
                  {task.estimatedHours && (
                    <Text size="xs" color="soft">
                      <ClockIcon className={styles.taskMetaIcon} />
                      {task.actualHours ?? 0}/{task.estimatedHours}h
                    </Text>
                  )}
                </div>
                {task.tags && task.tags.length > 0 && (
                  <div className={styles.taskTags}>
                    {task.tags.map(tag => (
                      <Chip key={tag} size="sm" variant="default">#{tag}</Chip>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <Button variant="ghost" icon={<AddIcon />} className={styles.addTaskButton}>
              Add Task
            </Button>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className={styles.scheduleSection}>
            <div className={styles.scheduleTimeline}>
              {topic.milestones.map((milestone, index) => (
                <div key={milestone.id} className={styles.scheduleItem}>
                  <div className={styles.scheduleMarker}>
                    <div className={`${styles.scheduleNode} ${milestone.status === 'completed' ? styles.scheduleNodeComplete : ''}`}>
                      {milestone.status === 'completed' ? <CheckCircleIcon /> : (index + 1)}
                    </div>
                    {index < topic.milestones.length - 1 && <div className={styles.scheduleLine} />}
                  </div>
                  <div className={styles.scheduleContent}>
                    <div className={styles.scheduleHeader}>
                      <Text weight="medium">{milestone.title}</Text>
                      <Text size="sm" color="soft">{milestone.dueDate.toLocaleDateString()}</Text>
                    </div>
                    <div className={styles.scheduleTasks}>
                      {milestone.tasks.map(taskId => {
                        const task = topic.tasks.find(t => t.id === taskId);

                        if (!task) return null;

                        return (
                          <div key={taskId} className={styles.scheduleTaskItem}>
                            <Chip size="sm" variant={statusColors[task.status]}>{task.status}</Chip>
                            <Text size="sm">{task.title}</Text>
                            {task.assignee && (
                              <Avatar size="xs" fallback={task.assignee.name} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'team' && (
          <div className={styles.teamSection}>
            <div className={styles.teamList}>
              {topic.team.map(member => (
                <div key={member.id} className={styles.teamMemberCard}>
                  <Avatar size="lg" fallback={member.name} />
                  <div className={styles.teamMemberInfo}>
                    <Text weight="medium">{member.name}</Text>
                    <Text size="sm" color="soft">{member.role}</Text>
                  </div>
                  <div className={styles.teamMemberStats}>
                    <div className={styles.teamMemberStat}>
                      <Text size="lg" weight="semibold">{member.tasksAssigned}</Text>
                      <Text size="xs" color="soft">Assigned</Text>
                    </div>
                    <div className={styles.teamMemberStat}>
                      <Text size="lg" weight="semibold">{member.tasksCompleted}</Text>
                      <Text size="xs" color="soft">Done</Text>
                    </div>
                  </div>
                  <Progress
                    value={member.tasksAssigned > 0 ? (member.tasksCompleted / member.tasksAssigned) * 100 : 0}
                    max={100}
                    size="sm"
                  />
                </div>
              ))}
            </div>
            <Button variant="ghost" icon={<AddIcon />} className={styles.addTeamButton}>
              Add Team Member
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
