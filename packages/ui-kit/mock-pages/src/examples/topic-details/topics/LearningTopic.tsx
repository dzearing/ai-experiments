/**
 * Learning Topic - Educational path and course tracking
 */
import { useState } from 'react';
import {
  Button,
  Chip,
  Heading,
  IconButton,
  Progress,
  Stack,
  Tabs,
  Text,
} from '@ui-kit/react';
import { AddIcon } from '@ui-kit/icons/AddIcon';
import { ChatIcon } from '@ui-kit/icons/ChatIcon';
import { CheckCircleIcon } from '@ui-kit/icons/CheckCircleIcon';
import { EditIcon } from '@ui-kit/icons/EditIcon';
import { FileIcon } from '@ui-kit/icons/FileIcon';
import { GlobeIcon } from '@ui-kit/icons/GlobeIcon';
import { LinkIcon } from '@ui-kit/icons/LinkIcon';
import { PlayIcon } from '@ui-kit/icons/PlayIcon';
import { ShareIcon } from '@ui-kit/icons/ShareIcon';
import type { BaseTopic } from '../shared/types';
import styles from '../shared/styles.module.css';

export interface LearningTopic extends BaseTopic {
  type: 'learning';
  heroImage?: string;
  subject: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  totalHours: number;
  completedHours: number;
  courses: {
    id: string;
    title: string;
    provider: string;
    duration: number;
    progress: number;
    status: 'not-started' | 'in-progress' | 'completed';
  }[];
  skills: { name: string; level: number }[];
  certificates?: { name: string; issuer: string; date: Date }[];
  resources: { title: string; type: string; url: string }[];
}

export const sampleLearning: LearningTopic = {
  id: 'learning-1',
  type: 'learning',
  name: 'Machine Learning Fundamentals',
  description: 'Comprehensive learning path covering ML basics, neural networks, and practical applications with Python.',
  heroImage: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&q=80',
  subject: 'Machine Learning',
  level: 'intermediate',
  tags: ['ml', 'python', 'ai', 'data-science'],
  totalHours: 120,
  completedHours: 45,
  courses: [
    { id: 'c1', title: 'Python for Data Science', provider: 'Coursera', duration: 20, progress: 100, status: 'completed' },
    { id: 'c2', title: 'Machine Learning Basics', provider: 'Coursera', duration: 30, progress: 60, status: 'in-progress' },
    { id: 'c3', title: 'Deep Learning Specialization', provider: 'DeepLearning.AI', duration: 40, progress: 0, status: 'not-started' },
    { id: 'c4', title: 'Practical ML Projects', provider: 'Udemy', duration: 30, progress: 0, status: 'not-started' },
  ],
  skills: [
    { name: 'Python', level: 75 },
    { name: 'NumPy', level: 60 },
    { name: 'Pandas', level: 55 },
    { name: 'Scikit-learn', level: 40 },
    { name: 'TensorFlow', level: 20 },
  ],
  certificates: [
    { name: 'Python for Data Science', issuer: 'Coursera', date: new Date('2024-01-10') },
  ],
  resources: [
    { title: 'Hands-On ML Book', type: 'Book', url: '#' },
    { title: 'ML Cheat Sheet', type: 'PDF', url: '#' },
    { title: 'Kaggle Datasets', type: 'Website', url: 'https://kaggle.com' },
  ],
  createdAt: new Date('2023-10-01'),
  updatedAt: new Date('2024-01-18'),
  chatCount: 22,
  documentCount: 15,
  ideaCount: 10,
};

export function LearningTopicDetail({ topic }: { topic: LearningTopic }) {
  const [activeTab, setActiveTab] = useState('overview');

  const overallProgress = Math.round((topic.completedHours / topic.totalHours) * 100);

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <div className={styles.heroSection}>
        <div className={styles.heroImage} style={{ backgroundImage: `url(${topic.heroImage})` }}>
          <div className={styles.heroActions}>
            <Button variant="primary" icon={<ChatIcon />} className={`${styles.heroActionButton} ${styles.askButton}`}>Chat about this topic</Button>
            <IconButton variant="ghost" icon={<EditIcon />} aria-label="Edit topic" className={styles.heroActionButton} />
            <IconButton variant="ghost" icon={<ShareIcon />} aria-label="Share" className={styles.heroActionButton} />
          </div>
          <div className={styles.heroOverlay}>
            <div className={styles.heroTags}>
              {topic.tags.map(tag => (
                <span key={tag} className={styles.heroTag}>#{tag}</span>
              ))}
            </div>
            <Heading level={1} size={1} className={styles.heroTitle}>{topic.name}</Heading>
            <Text className={styles.heroSubtitle}>{topic.description}</Text>
          </div>
        </div>
      </div>

      {/* Command Bar */}
      <div className={styles.commandBar}>
        <div className={styles.commandBarStats}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{overallProgress}%</span>
            <span className={styles.statLabel}>complete</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{topic.completedHours}h</span>
            <span className={styles.statLabel}>of {topic.totalHours}h</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{topic.courses.length}</span>
            <span className={styles.statLabel}>courses</span>
          </div>
        </div>
        <div className={styles.commandBarActions}>
          <Button variant="primary" size="sm" icon={<ChatIcon />}>Ask about this</Button>
          <Button variant="ghost" size="sm" icon={<PlayIcon />}>Continue learning</Button>
          <IconButton variant="ghost" size="sm" icon={<EditIcon />} aria-label="Edit topic" />
          <IconButton variant="ghost" size="sm" icon={<ShareIcon />} aria-label="Share" />
        </div>
      </div>

      {/* Progress Overview */}
      <div className={styles.learningProgress}>
        <div className={styles.progressRing}>
          <svg viewBox="0 0 100 100" className={styles.progressRingSvg}>
            <circle cx="50" cy="50" r="40" className={styles.progressRingBg} />
            <circle
              cx="50"
              cy="50"
              r="40"
              className={styles.progressRingFill}
              style={{
                strokeDasharray: `${overallProgress * 2.51} 251`,
                transform: 'rotate(-90deg)',
                transformOrigin: 'center',
              }}
            />
          </svg>
          <div className={styles.progressRingText}>
            <span className={styles.progressRingValue}>{overallProgress}%</span>
            <span className={styles.progressRingLabel}>Complete</span>
          </div>
        </div>
        <div className={styles.progressStats}>
          <div className={styles.progressStat}>
            <span className={styles.progressStatValue}>{topic.completedHours}h</span>
            <span className={styles.progressStatLabel}>completed</span>
          </div>
          <div className={styles.progressStat}>
            <span className={styles.progressStatValue}>{topic.totalHours - topic.completedHours}h</span>
            <span className={styles.progressStatLabel}>remaining</span>
          </div>
          <div className={styles.progressStat}>
            <span className={styles.progressStatValue}>{topic.certificates?.length || 0}</span>
            <span className={styles.progressStatLabel}>certificates</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        variant="underline"
        items={[
          { value: 'overview', label: 'Overview', content: null },
          { value: 'courses', label: 'Courses', content: null },
          { value: 'skills', label: 'Skills', content: null },
          { value: 'resources', label: 'Resources', content: null },
        ]}
        className={styles.tabs}
      />

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === 'overview' && (
          <div className={styles.learningOverview}>
            {topic.certificates && topic.certificates.length > 0 && (
              <div className={styles.certificatesSection}>
                <Heading level={3} size={5}>Certificates</Heading>
                {topic.certificates.map((cert, i) => (
                  <div key={i} className={styles.certificateItem}>
                    <CheckCircleIcon className={styles.certificateIcon} />
                    <Stack direction="vertical" gap="none" className={styles.certificateInfo}>
                      <Text weight="medium">{cert.name}</Text>
                      <Text size="sm" color="soft">{cert.issuer} · {cert.date.toLocaleDateString()}</Text>
                    </Stack>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.actionsCard}>
              <Heading level={3} size={5}>Actions</Heading>
              <div className={styles.actionButtons}>
                <Button variant="primary" icon={<ChatIcon />}>Ask about this topic</Button>
                <Button variant="default" icon={<PlayIcon />}>Continue learning</Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className={styles.coursesList}>
            {topic.courses.map((course) => (
              <div key={course.id} className={styles.courseItem}>
                <Stack direction="vertical" gap="none" className={styles.courseInfo}>
                  <Text weight="medium">{course.title}</Text>
                  <Text size="sm" color="soft">{course.provider} · {course.duration}h</Text>
                </Stack>
                <div className={styles.courseProgress}>
                  <Progress value={course.progress} size="sm" />
                  <Text size="sm" color="soft">{course.progress}%</Text>
                </div>
                <Chip
                  size="sm"
                  variant={course.status === 'completed' ? 'success' : course.status === 'in-progress' ? 'primary' : 'default'}
                >
                  {course.status.replace('-', ' ')}
                </Chip>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'skills' && (
          <div className={styles.skillsList}>
            {topic.skills.map((skill, i) => (
              <div key={i} className={styles.skillItem}>
                <Text weight="medium">{skill.name}</Text>
                <div className={styles.skillBar}>
                  <Progress value={skill.level} size="sm" />
                  <Text size="sm" color="soft">{skill.level}%</Text>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'resources' && (
          <div className={styles.resourcesList}>
            {topic.resources.map((resource, i) => (
              <div key={i} className={styles.resourceItem}>
                {resource.type === 'Book' ? <FileIcon /> : resource.type === 'Website' ? <GlobeIcon /> : <FileIcon />}
                <Stack direction="vertical" gap="none" className={styles.resourceInfo}>
                  <Text weight="medium">{resource.title}</Text>
                  <Text size="sm" color="soft">{resource.type}</Text>
                </Stack>
                <IconButton variant="ghost" icon={<LinkIcon />} aria-label="Open resource" />
              </div>
            ))}
            <Button variant="ghost" icon={<AddIcon />} className={styles.addResourceButton}>
              Add resource
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
