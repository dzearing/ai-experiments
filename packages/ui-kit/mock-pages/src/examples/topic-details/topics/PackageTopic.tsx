/**
 * Package Topic - NPM/library package management and documentation
 */
import { useState } from 'react';
import {
  Button,
  Chip,
  Heading,
  IconButton,
  SplitPane,
  Tabs,
  Text,
} from '@ui-kit/react';
import { ChatIcon } from '@ui-kit/icons/ChatIcon';
import { CodeIcon } from '@ui-kit/icons/CodeIcon';
import { EditIcon } from '@ui-kit/icons/EditIcon';
import { FileIcon } from '@ui-kit/icons/FileIcon';
import { LinkIcon } from '@ui-kit/icons/LinkIcon';
import { PlayIcon } from '@ui-kit/icons/PlayIcon';
import { RefreshIcon } from '@ui-kit/icons/RefreshIcon';
import { ShareIcon } from '@ui-kit/icons/ShareIcon';
import type { BaseTopic } from '../shared/types';
import styles from '../shared/styles.module.css';

export interface PackageExport {
  name: string;
  type: 'component' | 'hook' | 'utility' | 'object' | 'type';
  path: string;
  description?: string;
  codeSnippet?: string;
  notes?: string;
  lastAnalyzed?: Date;
}

export interface PackageTopic extends BaseTopic {
  type: 'package';
  heroImage?: string;
  packageName: string;
  version: string;
  repoPath: string;
  parentRepo?: string;
  dependencies: { name: string; version: string; type: 'prod' | 'dev' | 'peer' }[];
  exports: PackageExport[];
  sourceFiles: { name: string; lines: number; path: string }[];
  scripts: { name: string; command: string }[];
  readme?: string;
}

export const samplePackage: PackageTopic = {
  id: 'pkg-1',
  type: 'package',
  name: '@claude-flow/ui-kit',
  packageName: '@claude-flow/ui-kit',
  description: 'Design system and component library with theming support, design tokens, and accessible React components.',
  heroImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80',
  version: '1.2.0',
  repoPath: '/packages/ui-kit',
  parentRepo: 'claude-flow',
  tags: ['react', 'design-system', 'components', 'tokens'],
  dependencies: [
    { name: 'react', version: '^18.2.0', type: 'peer' },
    { name: 'react-dom', version: '^18.2.0', type: 'peer' },
    { name: 'clsx', version: '^2.0.0', type: 'prod' },
    { name: 'typescript', version: '^5.0.0', type: 'dev' },
    { name: '@storybook/react', version: '^7.6.0', type: 'dev' },
  ],
  exports: [
    {
      name: 'Button',
      type: 'component',
      path: '/src/components/Button',
      description: 'Primary interactive element for triggering actions. Supports multiple variants, sizes, and states.',
      codeSnippet: `<Button variant="primary" icon={<SaveIcon />}>
  Save Changes
</Button>`,
      notes: 'Uses design tokens for consistent styling. Forwards ref to underlying button element.',
      lastAnalyzed: new Date('2024-01-15'),
    },
    {
      name: 'Card',
      type: 'component',
      path: '/src/components/Card',
      description: 'Container component for grouping related content with consistent padding and borders.',
      codeSnippet: `<Card variant="elevated">
  <Card.Header>Title</Card.Header>
  <Card.Body>Content</Card.Body>
</Card>`,
      notes: 'Compound component pattern with Card.Header, Card.Body, Card.Footer subcomponents.',
      lastAnalyzed: new Date('2024-01-14'),
    },
    {
      name: 'Input',
      type: 'component',
      path: '/src/components/Input',
      description: 'Form input field with label, validation, and error state support.',
      codeSnippet: `<Input
  label="Email"
  type="email"
  error={errors.email}
/>`,
      notes: 'Integrates with react-hook-form. Supports prefix/suffix icons.',
      lastAnalyzed: new Date('2024-01-12'),
    },
    {
      name: 'Modal',
      type: 'component',
      path: '/src/components/Modal',
      description: 'Overlay dialog for focused interactions. Handles focus trap and escape key.',
      codeSnippet: `<Modal open={isOpen} onClose={handleClose}>
  <Modal.Title>Confirm</Modal.Title>
  <Modal.Content>Are you sure?</Modal.Content>
</Modal>`,
      notes: 'Uses React Portal. Implements WAI-ARIA dialog pattern.',
      lastAnalyzed: new Date('2024-01-10'),
    },
    {
      name: 'useTheme',
      type: 'hook',
      path: '/src/hooks/useTheme',
      description: 'Hook for accessing and toggling the current theme (light/dark mode).',
      codeSnippet: `const { theme, setTheme, toggleTheme } = useTheme();`,
      notes: 'Persists preference to localStorage. Respects system preference on first load.',
      lastAnalyzed: new Date('2024-01-08'),
    },
    {
      name: 'tokens',
      type: 'object',
      path: '/src/tokens',
      description: 'Design token definitions including colors, spacing, typography, and shadows.',
      codeSnippet: `import { tokens } from '@claude-flow/ui-kit';
console.log(tokens.colors.primary);`,
      notes: 'Generated from Figma. Supports CSS custom properties and JS object access.',
      lastAnalyzed: new Date('2024-01-05'),
    },
  ],
  sourceFiles: [
    { name: 'Button.tsx', lines: 142, path: '/src/components/Button' },
    { name: 'Card.tsx', lines: 89, path: '/src/components/Card' },
    { name: 'Input.tsx', lines: 156, path: '/src/components/Input' },
    { name: 'Modal.tsx', lines: 234, path: '/src/components/Modal' },
    { name: 'tokens.ts', lines: 312, path: '/src/tokens' },
  ],
  scripts: [
    { name: 'build', command: 'tsup src/index.ts' },
    { name: 'dev', command: 'storybook dev -p 6006' },
    { name: 'test', command: 'vitest' },
    { name: 'lint', command: 'eslint src' },
  ],
  createdAt: new Date('2023-08-01'),
  updatedAt: new Date('2024-01-19'),
  chatCount: 18,
  documentCount: 6,
  ideaCount: 12,
};

export function PackageTopicDetail({ topic }: { topic: PackageTopic }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedExport, setSelectedExport] = useState<PackageExport | null>(topic.exports[0] || null);

  const totalLines = topic.sourceFiles.reduce((sum, f) => sum + f.lines, 0);

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <div className={styles.heroSection}>
        <div className={styles.heroImage} style={{ backgroundImage: `url(${topic.heroImage})` }}>
          <div className={styles.heroActions}>
            <Button variant="primary" icon={<ChatIcon />} className={`${styles.heroActionButton} ${styles.askButton}`}>Chat about this package</Button>
            <IconButton variant="ghost" icon={<EditIcon />} aria-label="Edit topic" className={styles.heroActionButton} />
            <IconButton variant="ghost" icon={<ShareIcon />} aria-label="Share" className={styles.heroActionButton} />
          </div>
          <div className={styles.heroOverlay}>
            <div className={styles.heroTags}>
              {topic.tags.map(tag => (
                <span key={tag} className={styles.heroTag}>#{tag}</span>
              ))}
            </div>
            <Heading level={1} size={1} className={styles.heroTitle}>{topic.packageName}</Heading>
            <Text className={styles.heroSubtitle}>v{topic.version}</Text>
          </div>
        </div>
      </div>

      {/* Command Bar */}
      <div className={styles.commandBar}>
        <div className={styles.commandBarStats}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{topic.exports.length}</span>
            <span className={styles.statLabel}>exports</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{topic.dependencies.length}</span>
            <span className={styles.statLabel}>deps</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{topic.sourceFiles.length}</span>
            <span className={styles.statLabel}>files</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{totalLines.toLocaleString()}</span>
            <span className={styles.statLabel}>lines</span>
          </div>
        </div>
        <div className={styles.commandBarActions}>
          <Button variant="primary" size="sm" icon={<ChatIcon />}>Ask about this</Button>
          <Button variant="ghost" size="sm" icon={<LinkIcon />}>npm</Button>
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
          { value: 'exports', label: 'Exports', content: null },
          { value: 'dependencies', label: 'Dependencies', content: null },
          { value: 'files', label: 'Files', content: null },
          { value: 'scripts', label: 'Scripts', content: null },
        ]}
        className={styles.tabs}
      />

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === 'overview' && (
          <div className={styles.packageOverview}>
            <div className={styles.actionsCard}>
              <Heading level={3} size={5}>Actions</Heading>
              <div className={styles.actionButtons}>
                <Button variant="primary" icon={<ChatIcon />}>Ask about this package</Button>
                <Button variant="default" icon={<CodeIcon />}>View source</Button>
                <Button variant="ghost" icon={<PlayIcon />}>Run storybook</Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'exports' && (
          <SplitPane
            orientation="horizontal"
            defaultSize={240}
            minSize={180}
            maxSize={400}
            className={styles.masterDetailSplitPane}
            first={
              <div className={styles.masterList}>
                <div className={styles.masterListHeader}>
                  <Text weight="medium" size="sm">{topic.exports.length} exports</Text>
                  <IconButton
                    variant="ghost"
                    size="sm"
                    icon={<RefreshIcon />}
                    aria-label="Refresh exports"
                  />
                </div>
                <div className={styles.masterListScroll}>
                  {topic.exports.map((exp, i) => (
                    <button
                      key={i}
                      className={`${styles.masterListItem} ${selectedExport?.name === exp.name ? `${styles.masterListItemSelected} surface primary` : ''}`}
                      onClick={() => setSelectedExport(exp)}
                    >
                      <CodeIcon className={styles.masterListIcon} />
                      <Text weight="medium" size="sm" className={styles.masterListItemName}>{exp.name}</Text>
                      <Chip
                        size="sm"
                        variant={
                          exp.type === 'component' ? 'primary' :
                          exp.type === 'hook' ? 'success' :
                          exp.type === 'utility' ? 'warning' :
                          'default'
                        }
                      >
                        {exp.type}
                      </Chip>
                    </button>
                  ))}
                </div>
              </div>
            }
            second={
              <div className={styles.detailPanelScroll}>
                {selectedExport ? (
                  <div className={styles.detailPanel}>
                    <div className={styles.detailHeader}>
                      <div className={styles.detailTitleRow}>
                        <Heading level={3} size={4}>{selectedExport.name}</Heading>
                        <Chip size="sm" variant="primary">{selectedExport.type}</Chip>
                      </div>
                      <Text size="sm" color="soft" className={styles.detailPath}>
                        {topic.packageName}{selectedExport.path}
                      </Text>
                    </div>

                    {selectedExport.description && (
                      <div className={styles.detailSection}>
                        <Text size="sm" weight="medium" color="soft">Description</Text>
                        <Text>{selectedExport.description}</Text>
                      </div>
                    )}

                    {selectedExport.codeSnippet && (
                      <div className={styles.detailSection}>
                        <Text size="sm" weight="medium" color="soft">Usage Example</Text>
                        <pre className={styles.codeSnippet}>
                          <code>{selectedExport.codeSnippet}</code>
                        </pre>
                      </div>
                    )}

                    {selectedExport.notes && (
                      <div className={styles.detailSection}>
                        <Text size="sm" weight="medium" color="soft">Architecture Notes</Text>
                        <Text color="soft">{selectedExport.notes}</Text>
                      </div>
                    )}

                    <div className={styles.detailActions}>
                      <Button variant="primary" size="sm" icon={<ChatIcon />}>
                        Ask about {selectedExport.name}
                      </Button>
                      <Button variant="ghost" size="sm" icon={<RefreshIcon />}>
                        Re-analyze
                      </Button>
                    </div>

                    {selectedExport.lastAnalyzed && (
                      <Text size="xs" color="soft" className={styles.detailMeta}>
                        Last analyzed: {selectedExport.lastAnalyzed.toLocaleDateString()}
                      </Text>
                    )}
                  </div>
                ) : (
                  <div className={styles.detailEmpty}>
                    <Text color="soft">Select an export to view details</Text>
                  </div>
                )}
              </div>
            }
          />
        )}

        {activeTab === 'dependencies' && (
          <div className={styles.dependenciesList}>
            {['prod', 'peer', 'dev'].map(type => {
              const deps = topic.dependencies.filter(d => d.type === type);

              if (deps.length === 0) return null;

              return (
                <div key={type} className={styles.dependencyGroup}>
                  <Text size="sm" weight="medium" color="soft" className={styles.dependencyGroupTitle}>
                    {type === 'prod' ? 'Production' : type === 'peer' ? 'Peer' : 'Development'}
                  </Text>
                  {deps.map((dep, i) => (
                    <div key={i} className={styles.dependencyItem}>
                      <Text>{dep.name}</Text>
                      <Text size="sm" color="soft">{dep.version}</Text>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'files' && (
          <div className={styles.sourceFilesList}>
            {topic.sourceFiles.map((file, i) => (
              <div key={i} className={styles.sourceFileItem}>
                <FileIcon />
                <div className={styles.sourceFileInfo}>
                  <Text weight="medium">{file.name}</Text>
                  <Text size="sm" color="soft">{file.path}</Text>
                </div>
                <Text size="sm" color="soft">{file.lines} lines</Text>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'scripts' && (
          <div className={styles.scriptsList}>
            {topic.scripts.map((script, i) => (
              <div key={i} className={styles.scriptItem}>
                <Text weight="medium" className={styles.scriptName}>{script.name}</Text>
                <code className={styles.scriptCommand}>{script.command}</code>
                <IconButton variant="ghost" icon={<PlayIcon />} aria-label="Run script" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
