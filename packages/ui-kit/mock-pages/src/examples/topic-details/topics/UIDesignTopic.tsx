/**
 * UI Design Topic - Design explorations and component management
 */
import { useState } from 'react';
import {
  Button,
  Chip,
  Divider,
  Heading,
  IconButton,
  Stack,
  Tabs,
  Text,
} from '@ui-kit/react';
import { AddIcon } from '@ui-kit/icons/AddIcon';
import { ChatIcon } from '@ui-kit/icons/ChatIcon';
import { EditIcon } from '@ui-kit/icons/EditIcon';
import { LinkIcon } from '@ui-kit/icons/LinkIcon';
import { ShareIcon } from '@ui-kit/icons/ShareIcon';
import type { BaseTopic } from '../shared/types';
import styles from '../shared/styles.module.css';

export interface DesignExploration {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  version: number;
  status: 'exploring' | 'iterating' | 'refined' | 'approved';
  createdAt: Date;
  updatedAt: Date;
  feedback?: { author: string; comment: string; date: Date }[];
}

export interface DesignComponent {
  id: string;
  name: string;
  category: string;
  variants: number;
  status: 'draft' | 'review' | 'done';
}

export interface UIDesignTopic extends BaseTopic {
  type: 'ui-design';
  heroImage?: string;
  projectName: string;
  designSystem?: string;
  explorations: DesignExploration[];
  components: DesignComponent[];
  colorPalette: { name: string; value: string }[];
  references: { id: string; title: string; url: string; image?: string }[];
  categories: string[];
}

export const sampleUIDesign: UIDesignTopic = {
  id: 'ui-design-1',
  type: 'ui-design',
  name: 'Dashboard Redesign',
  description: 'Exploring modern dashboard designs with improved data visualization, cleaner layouts, and better user flows.',
  heroImage: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80',
  projectName: 'Analytics Dashboard v2',
  designSystem: 'Custom Design System',
  tags: ['dashboard', 'analytics', 'data-viz', 'ui', 'ux'],
  categories: ['Layout', 'Charts', 'Navigation', 'Cards', 'Forms'],
  explorations: [
    {
      id: 'e1',
      name: 'Dark Mode Dashboard',
      description: 'Exploring a dark-themed dashboard with vibrant accent colors for data visualization.',
      thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=60',
      version: 3,
      status: 'refined',
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-18'),
      feedback: [
        { author: 'Sarah', comment: 'Love the contrast. Consider softer shadows.', date: new Date('2024-01-15') },
        { author: 'Mike', comment: 'Charts look great in dark mode!', date: new Date('2024-01-17') },
      ],
    },
    {
      id: 'e2',
      name: 'Minimal Light Theme',
      description: 'Clean, minimal approach with lots of whitespace and subtle borders.',
      thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=60',
      version: 2,
      status: 'iterating',
      createdAt: new Date('2024-01-12'),
      updatedAt: new Date('2024-01-19'),
      feedback: [
        { author: 'Sarah', comment: 'Might be too minimal. Add more visual hierarchy.', date: new Date('2024-01-18') },
      ],
    },
    {
      id: 'e3',
      name: 'Glassmorphism Cards',
      description: 'Experimenting with frosted glass effect for card components.',
      thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=60',
      version: 1,
      status: 'exploring',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
    },
    {
      id: 'e4',
      name: 'Sidebar Navigation',
      description: 'New collapsible sidebar with icon-only mode and grouped sections.',
      thumbnail: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=400&q=60',
      version: 4,
      status: 'approved',
      createdAt: new Date('2024-01-08'),
      updatedAt: new Date('2024-01-20'),
    },
  ],
  components: [
    { id: 'c1', name: 'MetricCard', category: 'Cards', variants: 4, status: 'done' },
    { id: 'c2', name: 'LineChart', category: 'Charts', variants: 3, status: 'done' },
    { id: 'c3', name: 'BarChart', category: 'Charts', variants: 2, status: 'review' },
    { id: 'c4', name: 'DataTable', category: 'Layout', variants: 2, status: 'draft' },
    { id: 'c5', name: 'FilterBar', category: 'Navigation', variants: 1, status: 'draft' },
    { id: 'c6', name: 'DatePicker', category: 'Forms', variants: 2, status: 'review' },
  ],
  colorPalette: [
    { name: 'Primary', value: '#3B82F6' },
    { name: 'Secondary', value: '#8B5CF6' },
    { name: 'Success', value: '#10B981' },
    { name: 'Warning', value: '#F59E0B' },
    { name: 'Error', value: '#EF4444' },
    { name: 'Neutral', value: '#6B7280' },
  ],
  references: [
    { id: 'r1', title: 'Linear App', url: 'https://linear.app', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&q=60' },
    { id: 'r2', title: 'Stripe Dashboard', url: 'https://stripe.com', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=200&q=60' },
    { id: 'r3', title: 'Figma', url: 'https://figma.com', image: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=200&q=60' },
  ],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-20'),
  chatCount: 18,
  documentCount: 8,
  ideaCount: 24,
};

export function UIDesignTopicDetail({ topic }: { topic: UIDesignTopic }) {
  const [activeTab, setActiveTab] = useState('explorations');
  const [selectedExploration, setSelectedExploration] = useState<DesignExploration | null>(null);

  const statusColors: Record<string, 'default' | 'primary' | 'success' | 'warning'> = {
    exploring: 'warning',
    iterating: 'primary',
    refined: 'success',
    approved: 'success',
    draft: 'default',
    review: 'warning',
    done: 'success',
  };

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <div className={styles.heroSection}>
        <div className={styles.heroImage} style={{ backgroundImage: `url(${topic.heroImage})` }}>
          <div className={styles.heroActions}>
            <Button variant="primary" icon={<ChatIcon />} className={`${styles.heroActionButton} ${styles.askButton}`}>Chat about this design</Button>
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
            <span className={styles.statValue}>{topic.explorations.length}</span>
            <span className={styles.statLabel}>explorations</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{topic.components.length}</span>
            <span className={styles.statLabel}>components</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{topic.explorations.filter(e => e.status === 'approved').length}</span>
            <span className={styles.statLabel}>approved</span>
          </div>
        </div>
        <div className={styles.commandBarActions}>
          <Button variant="primary" size="sm" icon={<AddIcon />}>New Exploration</Button>
          <Button variant="ghost" size="sm" icon={<ChatIcon />}>Design Review</Button>
          <IconButton variant="ghost" size="sm" icon={<ShareIcon />} aria-label="Share" />
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        variant="underline"
        items={[
          { value: 'explorations', label: 'Explorations', content: null },
          { value: 'components', label: 'Components', content: null },
          { value: 'tokens', label: 'Tokens', content: null },
          { value: 'references', label: 'References', content: null },
        ]}
        className={styles.tabs}
      />

      <div className={styles.tabContent}>
        {activeTab === 'explorations' && (
          <div className={styles.explorationsGrid}>
            {topic.explorations.map(exploration => (
              <div
                key={exploration.id}
                className={`${styles.explorationCard} ${selectedExploration?.id === exploration.id ? styles.explorationCardSelected : ''}`}
                onClick={() => setSelectedExploration(exploration)}
              >
                {exploration.thumbnail && (
                  <div
                    className={styles.explorationThumbnail}
                    style={{ backgroundImage: `url(${exploration.thumbnail})` }}
                  />
                )}
                <div className={styles.explorationContent}>
                  <div className={styles.explorationHeader}>
                    <Text weight="medium">{exploration.name}</Text>
                    <Chip size="sm" variant={statusColors[exploration.status]}>{exploration.status}</Chip>
                  </div>
                  {exploration.description && (
                    <Text size="sm" color="soft" className={styles.explorationDescription}>
                      {exploration.description}
                    </Text>
                  )}
                  <div className={styles.explorationMeta}>
                    <Text size="xs" color="soft">v{exploration.version}</Text>
                    <Text size="xs" color="soft">•</Text>
                    <Text size="xs" color="soft">{exploration.updatedAt.toLocaleDateString()}</Text>
                    {exploration.feedback && exploration.feedback.length > 0 && (
                      <>
                        <Text size="xs" color="soft">•</Text>
                        <Text size="xs" color="soft">{exploration.feedback.length} comments</Text>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <button className={styles.addExplorationCard}>
              <AddIcon className={styles.addExplorationIcon} />
              <Text weight="medium">New Exploration</Text>
              <Text size="sm" color="soft">Start a new design direction</Text>
            </button>
          </div>
        )}

        {activeTab === 'components' && (
          <div className={styles.componentsSection}>
            <div className={styles.componentsList}>
              {topic.categories.map(category => {
                const categoryComponents = topic.components.filter(c => c.category === category);

                if (categoryComponents.length === 0) return null;

                return (
                  <div key={category} className={styles.componentCategory}>
                    <Heading level={4} size={5}>{category}</Heading>
                    <div className={styles.componentCards}>
                      {categoryComponents.map(component => (
                        <div key={component.id} className={styles.componentCard}>
                          <Stack direction="vertical" gap="none" className={styles.componentInfo}>
                            <Text weight="medium">{component.name}</Text>
                            <Text size="sm" color="soft">{component.variants} variants</Text>
                          </Stack>
                          <Chip size="sm" variant={statusColors[component.status]}>{component.status}</Chip>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <Button variant="ghost" icon={<AddIcon />} className={styles.addComponentButton}>
              Add Component
            </Button>
          </div>
        )}

        {activeTab === 'tokens' && (
          <div className={styles.tokensSection}>
            <Heading level={3} size={4}>Color Palette</Heading>
            <div className={styles.colorPalette}>
              {topic.colorPalette.map(color => (
                <div key={color.name} className={styles.colorSwatch}>
                  <div
                    className={styles.colorSwatchPreview}
                    style={{ backgroundColor: color.value }}
                  />
                  <Text size="sm" weight="medium">{color.name}</Text>
                  <Text size="xs" color="soft">{color.value}</Text>
                </div>
              ))}
              <button className={styles.addColorSwatch}>
                <AddIcon />
              </button>
            </div>

            <Divider />

            <div className={styles.tokenActions}>
              <Button variant="primary" icon={<ChatIcon />}>Discuss Tokens</Button>
              <Button variant="ghost" icon={<ShareIcon />}>Export Tokens</Button>
            </div>
          </div>
        )}

        {activeTab === 'references' && (
          <div className={styles.referencesSection}>
            <div className={styles.referencesGrid}>
              {topic.references.map(ref => (
                <div key={ref.id} className={styles.referenceCard}>
                  {ref.image && (
                    <div
                      className={styles.referenceThumbnail}
                      style={{ backgroundImage: `url(${ref.image})` }}
                    />
                  )}
                  <div className={styles.referenceContent}>
                    <Text weight="medium">{ref.title}</Text>
                    <Text size="sm" color="soft">{new URL(ref.url).hostname}</Text>
                  </div>
                  <IconButton variant="ghost" size="sm" icon={<LinkIcon />} aria-label="Open link" />
                </div>
              ))}

              <button className={styles.addReferenceCard}>
                <AddIcon />
                <Text size="sm">Add Reference</Text>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
