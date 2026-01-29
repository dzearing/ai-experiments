/**
 * Git Repository Topic - Source code repository management
 */
import { useState } from 'react';
import {
  Avatar,
  Button,
  Chip,
  Heading,
  IconButton,
  Stack,
  Tabs,
  Text,
} from '@ui-kit/react';
import { AddIcon } from '@ui-kit/icons/AddIcon';
import { ArrowRightIcon } from '@ui-kit/icons/ArrowRightIcon';
import { ChatIcon } from '@ui-kit/icons/ChatIcon';
import { CodeIcon } from '@ui-kit/icons/CodeIcon';
import { EditIcon } from '@ui-kit/icons/EditIcon';
import { FileIcon } from '@ui-kit/icons/FileIcon';
import { FolderIcon } from '@ui-kit/icons/FolderIcon';
import { InfoCircleIcon } from '@ui-kit/icons/InfoCircleIcon';
import { LinkIcon } from '@ui-kit/icons/LinkIcon';
import { PackageIcon } from '@ui-kit/icons/PackageIcon';
import { ShareIcon } from '@ui-kit/icons/ShareIcon';
import { StarIcon } from '@ui-kit/icons/StarIcon';
import type { BaseTopic } from '../shared/types';
import styles from '../shared/styles.module.css';

export interface GitRepoTopic extends BaseTopic {
  type: 'git-repo';
  heroImage?: string;
  repoUrl: string;
  owner: string;
  defaultBranch: string;
  language: string;
  stars: number;
  forks: number;
  openIssues: number;
  lastCommit: Date;
  contributors: { name: string; avatar?: string; commits: number }[];
  readme?: string;
  structure: { name: string; type: 'folder' | 'file'; path: string }[];
  packages?: { name: string; version: string; path: string }[];
  activity: { date: Date; type: string; message: string; author: string }[];
  localClones?: { path: string; branch: string; lastPull: Date; hasChanges: boolean }[];
}

export const sampleRepo: GitRepoTopic = {
  id: 'repo-1',
  type: 'git-repo',
  name: 'claude-flow',
  description: 'Modern project management platform with AI-powered features. Monorepo using pnpm workspaces with React frontend and Express backend.',
  tags: ['typescript', 'react', 'monorepo', 'ai', 'pnpm'],
  heroImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80',
  repoUrl: 'https://github.com/org/claude-flow',
  owner: 'org',
  defaultBranch: 'main',
  language: 'TypeScript',
  stars: 1247,
  forks: 89,
  openIssues: 23,
  lastCommit: new Date('2024-01-20'),
  contributors: [
    { name: 'Alice Chen', commits: 342 },
    { name: 'Bob Smith', commits: 187 },
    { name: 'Carol Wu', commits: 156 },
    { name: 'David Kim', commits: 98 },
  ],
  structure: [
    { name: 'apps', type: 'folder', path: '/apps' },
    { name: 'packages', type: 'folder', path: '/packages' },
    { name: 'docs', type: 'folder', path: '/docs' },
    { name: 'package.json', type: 'file', path: '/package.json' },
    { name: 'pnpm-workspace.yaml', type: 'file', path: '/pnpm-workspace.yaml' },
    { name: 'README.md', type: 'file', path: '/README.md' },
  ],
  packages: [
    { name: '@claude-flow/ui-kit', version: '1.2.0', path: '/packages/ui-kit' },
    { name: '@claude-flow/core', version: '0.8.0', path: '/packages/core' },
    { name: 'v1-client', version: '2.1.0', path: '/apps/v1/client' },
    { name: 'v1-server', version: '2.1.0', path: '/apps/v1/server' },
  ],
  activity: [
    { date: new Date('2024-01-20'), type: 'commit', message: 'fix: resolve token rendering issue', author: 'Alice' },
    { date: new Date('2024-01-19'), type: 'pr', message: 'feat: add dark mode support', author: 'Bob' },
    { date: new Date('2024-01-18'), type: 'commit', message: 'chore: update dependencies', author: 'Carol' },
  ],
  localClones: [
    { path: '~/dev/claude-flow', branch: 'main', lastPull: new Date('2024-01-20'), hasChanges: false },
    { path: '~/work/claude-flow', branch: 'feature/dark-mode', lastPull: new Date('2024-01-19'), hasChanges: true },
    { path: '/projects/claude-flow-test', branch: 'fix/auth-bug', lastPull: new Date('2024-01-15'), hasChanges: false },
  ],
  createdAt: new Date('2023-06-15'),
  updatedAt: new Date('2024-01-20'),
  chatCount: 34,
  documentCount: 12,
  ideaCount: 28,
};

export function GitRepoTopicDetail({ topic }: { topic: GitRepoTopic }) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <div className={styles.heroSection}>
        <div className={styles.heroImage} style={{ backgroundImage: `url(${topic.heroImage})` }}>
          <div className={styles.heroActions}>
            <Button variant="primary" icon={<ChatIcon />} className={`${styles.heroActionButton} ${styles.askButton}`}>Chat about this repo</Button>
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
            <StarIcon className={styles.statIcon} />
            <span className={styles.statValue}>{topic.stars.toLocaleString()}</span>
            <span className={styles.statLabel}>stars</span>
          </div>
          <div className={styles.statItem}>
            <FolderIcon className={styles.statIcon} />
            <span className={styles.statValue}>{topic.forks}</span>
            <span className={styles.statLabel}>forks</span>
          </div>
          <div className={styles.statItem}>
            <InfoCircleIcon className={styles.statIcon} />
            <span className={styles.statValue}>{topic.openIssues}</span>
            <span className={styles.statLabel}>issues</span>
          </div>
        </div>
        <div className={styles.commandBarActions}>
          <Button variant="primary" size="sm" icon={<ChatIcon />}>Ask about this</Button>
          <Button variant="ghost" size="sm" icon={<LinkIcon />}>GitHub</Button>
          <IconButton variant="ghost" size="sm" icon={<EditIcon />} aria-label="Edit topic" />
          <IconButton variant="ghost" size="sm" icon={<ShareIcon />} aria-label="Share" />
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        variant="underline"
        items={[
          { value: 'overview', label: 'Overview', content: null },
          { value: 'structure', label: 'Structure', content: null },
          { value: 'packages', label: 'Packages', content: null },
          { value: 'local-clones', label: 'Local Clones', content: null },
          { value: 'contributors', label: 'Contributors', content: null },
          { value: 'activity', label: 'Activity', content: null },
        ]}
        className={styles.tabs}
      />

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === 'overview' && (
          <div className={styles.repoOverview}>
            <div className={styles.readmePreview}>
              <div className={styles.readmeHeader}>
                <FileIcon />
                <Text weight="medium">README.md</Text>
              </div>
              <div className={styles.readmeContent}>
                <Text color="soft">Click to view full README...</Text>
              </div>
            </div>

            <div className={styles.actionsCard}>
              <Heading level={3} size={5}>Actions</Heading>
              <div className={styles.actionButtons}>
                <Button variant="primary" icon={<ChatIcon />}>Ask about this repo</Button>
                <Button variant="default" icon={<LinkIcon />} iconAfter={<ArrowRightIcon />}>
                  Open on GitHub
                </Button>
                <Button variant="ghost" icon={<CodeIcon />}>Clone command</Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'structure' && (
          <div className={styles.fileTree}>
            {topic.structure.map((item, i) => (
              <div key={i} className={styles.fileTreeItem}>
                {item.type === 'folder' ? <FolderIcon /> : <FileIcon />}
                <span>{item.name}</span>
                <span className={styles.filePath}>{item.path}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'packages' && topic.packages && (
          <div className={styles.packageList}>
            {topic.packages.map((pkg, i) => (
              <div key={i} className={styles.packageItem}>
                <PackageIcon className={styles.packageIcon} />
                <Stack direction="vertical" gap="none" className={styles.packageInfo}>
                  <Text weight="medium">{pkg.name}</Text>
                  <Text size="sm" color="soft">{pkg.path}</Text>
                </Stack>
                <Chip size="sm" variant="default">v{pkg.version}</Chip>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'local-clones' && (
          <div className={styles.localClonesTable}>
            <div className={styles.tableHeader}>
              <span className={styles.tableHeaderCell}>Location</span>
              <span className={styles.tableHeaderCell}>Branch</span>
              <span className={styles.tableHeaderCell}>Status</span>
            </div>
            {topic.localClones?.map((clone, i) => (
              <div key={i} className={styles.tableRow}>
                <span className={styles.tableCell}>
                  <FolderIcon className={styles.tableCellIcon} />
                  {clone.path}
                </span>
                <span className={styles.tableCell}>
                  <Chip size="sm" variant={clone.branch === 'main' ? 'success' : 'default'}>
                    {clone.branch}
                  </Chip>
                </span>
                <span className={styles.tableCell}>
                  {clone.hasChanges ? (
                    <Text size="sm" color="default">Modified</Text>
                  ) : (
                    <Text size="sm" color="soft">Clean</Text>
                  )}
                </span>
              </div>
            ))}
            <Button variant="ghost" icon={<AddIcon />} className={styles.addCloneButton}>
              Add local clone
            </Button>
          </div>
        )}

        {activeTab === 'contributors' && (
          <div className={styles.contributorList}>
            {topic.contributors.map((contributor, i) => (
              <div key={i} className={styles.contributorItem}>
                <Avatar fallback={contributor.name} size="md" />
                <Stack direction="vertical" gap="none" className={styles.contributorInfo}>
                  <Text weight="medium">{contributor.name}</Text>
                  <Text size="sm" color="soft">{contributor.commits} commits</Text>
                </Stack>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className={styles.activityList}>
            {topic.activity.map((item, i) => (
              <div key={i} className={styles.activityItem}>
                <div className={styles.activityDot} />
                <div className={styles.activityContent}>
                  <Text size="sm">{item.message}</Text>
                  <Text size="sm" color="soft">{item.author} · {item.date.toLocaleDateString()}</Text>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
