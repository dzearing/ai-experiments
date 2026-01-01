import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  Button,
  Chip,
  Divider,
  Heading,
  IconButton,
  Input,
  Segmented,
  Spinner,
  Text,
  ShimmerText,
  RelativeTime,
} from '@ui-kit/react';
import { AddIcon } from '@ui-kit/icons/AddIcon';
import { ChevronRightIcon } from '@ui-kit/icons/ChevronRightIcon';
import { CloseIcon } from '@ui-kit/icons/CloseIcon';
import { EditIcon } from '@ui-kit/icons/EditIcon';
import { ExpandIcon } from '@ui-kit/icons/ExpandIcon';
import { FileIcon } from '@ui-kit/icons/FileIcon';
import { FilterIcon } from '@ui-kit/icons/FilterIcon';
import { SearchIcon } from '@ui-kit/icons/SearchIcon';
import { SendIcon } from '@ui-kit/icons/SendIcon';
import { StarIcon } from '@ui-kit/icons/StarIcon';
import { TrashIcon } from '@ui-kit/icons/TrashIcon';
import styles from './IdeateIdeas.module.css';

/**
 * # Ideate Ideas Board
 *
 * Kanban-style board for capturing, exploring, and promoting ideas.
 * Ideas can be created by users or suggested by AI, and can be expanded
 * with AI-generated analysis including approach, effort, and related ideas.
 *
 * ## Component Gap Analysis
 *
 * Components that would improve this implementation:
 *
 * 1. **KanbanBoard** - Drag-drop kanban with columns and cards
 * 2. **QuickCapture** - Simplified chat-like input for rapid idea entry
 * 3. **IdeaCard** - Standardized card with refinement indicator and AI badge
 * 4. **AIExpansionPanel** - Collapsible AI analysis display
 * 5. **TagInput** - Multi-select tag input with autocomplete
 * 6. **DetailDrawer** - Slide-in detail panel (could use Drawer but needs customization)
 */

// ============================================
// DATA TYPES
// ============================================

type IdeaStatus = 'new' | 'exploring' | 'ready' | 'archived';
type IdeaSource = 'user' | 'ai-suggested';
type Priority = 'low' | 'medium' | 'high';

interface AIExpansion {
  summary: string;
  suggestedApproach: string;
  estimatedEffort: string;
  risks?: string[];
  relatedIdeas?: string[];
}

interface Idea {
  id: string;
  title: string;
  description?: string;
  source: IdeaSource;
  status: IdeaStatus;
  priority?: Priority;
  tags: string[];
  refinement: 1 | 2 | 3 | 4;
  aiExpansion?: AIExpansion;
  linkedPlanId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// SAMPLE DATA
// ============================================

const sampleIdeas: Idea[] = [
  {
    id: '1',
    title: 'Add dark mode support',
    description: 'Users have requested a dark theme option for the application to reduce eye strain.',
    source: 'user',
    status: 'ready',
    priority: 'high',
    tags: ['ui', 'accessibility', 'theme'],
    refinement: 4,
    aiExpansion: {
      summary: 'Implement a theme switching system with persistent user preferences.',
      suggestedApproach: 'Use CSS custom properties for theming. Create a ThemeProvider context to manage state. Store preference in localStorage and respect system preference as default.',
      estimatedEffort: '4-6 hours',
      risks: ['May need to audit all color usages', 'Third-party components may not support theming'],
      relatedIdeas: ['Accessibility improvements', 'User preferences system'],
    },
    linkedPlanId: 'plan-1',
    createdAt: new Date(Date.now() - 86400000 * 3),
    updatedAt: new Date(Date.now() - 3600000),
  },
  {
    id: '2',
    title: 'Implement real-time collaboration',
    description: 'Allow multiple users to work on the same document simultaneously with presence indicators.',
    source: 'user',
    status: 'exploring',
    priority: 'high',
    tags: ['collaboration', 'websocket', 'feature'],
    refinement: 3,
    aiExpansion: {
      summary: 'Add WebSocket-based real-time sync with conflict resolution.',
      suggestedApproach: 'Use Yjs for CRDT-based conflict resolution. Implement WebSocket server for real-time updates. Add cursor presence and user avatars.',
      estimatedEffort: '2-3 days',
      risks: ['Complex conflict resolution', 'Server scaling considerations'],
    },
    createdAt: new Date(Date.now() - 86400000 * 2),
    updatedAt: new Date(Date.now() - 7200000),
  },
  {
    id: '3',
    title: 'Add keyboard shortcuts',
    description: 'Power users want keyboard shortcuts for common actions.',
    source: 'user',
    status: 'new',
    priority: 'medium',
    tags: ['ux', 'productivity'],
    refinement: 1,
    createdAt: new Date(Date.now() - 86400000),
    updatedAt: new Date(Date.now() - 86400000),
  },
  {
    id: '4',
    title: 'Consider adding AI code review',
    description: 'Automatically review code changes and suggest improvements before commit.',
    source: 'ai-suggested',
    status: 'new',
    tags: ['ai', 'code-quality'],
    refinement: 1,
    createdAt: new Date(Date.now() - 3600000),
    updatedAt: new Date(Date.now() - 3600000),
  },
  {
    id: '5',
    title: 'Export to Markdown',
    description: 'Allow exporting ideas and plans to markdown format for documentation.',
    source: 'user',
    status: 'exploring',
    priority: 'low',
    tags: ['export', 'documentation'],
    refinement: 2,
    createdAt: new Date(Date.now() - 86400000 * 4),
    updatedAt: new Date(Date.now() - 86400000),
  },
  {
    id: '6',
    title: 'Integrate with GitHub Issues',
    description: 'Sync ideas with GitHub issues for better project management.',
    source: 'ai-suggested',
    status: 'exploring',
    tags: ['integration', 'github'],
    refinement: 2,
    aiExpansion: {
      summary: 'Two-way sync between ideas and GitHub issues.',
      suggestedApproach: 'Use GitHub API for CRUD operations. Implement webhooks for real-time sync. Map idea fields to issue fields.',
      estimatedEffort: '1-2 days',
    },
    createdAt: new Date(Date.now() - 86400000 * 2),
    updatedAt: new Date(Date.now() - 43200000),
  },
  {
    id: '7',
    title: 'Mobile-responsive design',
    description: 'Optimize the interface for tablet and mobile devices.',
    source: 'user',
    status: 'ready',
    priority: 'medium',
    tags: ['ui', 'mobile', 'responsive'],
    refinement: 3,
    createdAt: new Date(Date.now() - 86400000 * 5),
    updatedAt: new Date(Date.now() - 86400000 * 2),
  },
  {
    id: '8',
    title: 'Offline support',
    description: 'Allow basic functionality when internet connection is unavailable.',
    source: 'user',
    status: 'archived',
    tags: ['pwa', 'offline'],
    refinement: 2,
    createdAt: new Date(Date.now() - 86400000 * 10),
    updatedAt: new Date(Date.now() - 86400000 * 5),
  },
];

const aiSuggestions = [
  'What about unit test coverage?',
  'Consider performance optimization',
  'Add error boundary handling',
];

// ============================================
// HELPER COMPONENTS
// ============================================

function RefinementDots({ level }: { level: number }) {
  return (
    <div className={styles.refinement}>
      {[1, 2, 3, 4].map((dot) => (
        <div
          key={dot}
          className={`${styles.refinementDot} ${dot <= level ? styles.refinementDotFilled : ''}`}
        />
      ))}
    </div>
  );
}

function AIBadge() {
  return (
    <span className={styles.aiBadge}>
      <StarIcon />
      AI
    </span>
  );
}

function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`${styles.priorityBadge} ${styles[priority]}`}>
      {priority}
    </span>
  );
}

function IdeaCard({
  idea,
  selected,
  onClick,
}: {
  idea: Idea;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      className={`${styles.ideaCard} ${selected ? styles.ideaCardSelected : ''} ${idea.source === 'ai-suggested' ? styles.ideaCardAI : ''}`}
      onClick={onClick}
    >
      <div className={styles.ideaCardHeader}>
        <Text className={styles.ideaCardTitle}>{idea.title}</Text>
        {idea.source === 'ai-suggested' && <AIBadge />}
      </div>

      {idea.description && (
        <Text size="small" color="secondary" className={styles.ideaCardDescription}>
          {idea.description}
        </Text>
      )}

      <div className={styles.ideaCardFooter}>
        <div className={styles.ideaCardTags}>
          {idea.priority && <PriorityBadge priority={idea.priority} />}
          {idea.tags.slice(0, 2).map((tag) => (
            <Chip key={tag} size="sm" variant="default">{tag}</Chip>
          ))}
          {idea.tags.length > 2 && (
            <Chip size="sm" variant="default">+{idea.tags.length - 2}</Chip>
          )}
        </div>
        <div className={styles.ideaCardMeta}>
          <RefinementDots level={idea.refinement} />
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({
  title,
  ideas,
  selectedId,
  onSelectIdea,
}: {
  title: string;
  ideas: Idea[];
  selectedId?: string;
  onSelectIdea: (idea: Idea) => void;
}) {
  const statusColors: Record<IdeaStatus, 'default' | 'info' | 'success' | 'warning'> = {
    new: 'default',
    exploring: 'info',
    ready: 'success',
    archived: 'warning',
  };

  return (
    <div className={styles.column}>
      <div className={styles.columnHeader}>
        <div className={styles.columnTitle}>
          <Text weight="medium">{title}</Text>
          <span className={styles.columnCount}>{ideas.length}</span>
        </div>
        <IconButton variant="ghost" size="sm" icon={<AddIcon />} aria-label={`Add to ${title}`} />
      </div>
      <div className={styles.columnContent}>
        {ideas.length === 0 ? (
          <div className={styles.emptyColumn}>
            <FileIcon className={styles.emptyColumnIcon} />
            <Text size="small" color="secondary">No ideas here</Text>
          </div>
        ) : (
          ideas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              selected={idea.id === selectedId}
              onClick={() => onSelectIdea(idea)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function DetailPanel({
  idea,
  onClose,
  isExpanding,
}: {
  idea: Idea;
  onClose: () => void;
  isExpanding?: boolean;
}) {
  return (
    <div className={styles.detailDrawer}>
      <div className={styles.detailHeader}>
        <Heading level={3} size="h5">{idea.title}</Heading>
        <IconButton variant="ghost" icon={<CloseIcon />} onClick={onClose} aria-label="Close" />
      </div>

      <div className={styles.detailContent}>
        {/* Description */}
        <div className={styles.detailSection}>
          <div className={styles.detailSectionTitle}>Description</div>
          <Text className={styles.detailDescription}>
            {idea.description || 'No description provided.'}
          </Text>
        </div>

        {/* Tags */}
        <div className={styles.detailSection}>
          <div className={styles.detailSectionTitle}>Tags</div>
          <div className={styles.detailTags}>
            {idea.tags.map((tag) => (
              <Chip key={tag} size="sm" variant="default" onRemove={() => {}}>{tag}</Chip>
            ))}
            <Button variant="ghost" size="sm">+ Add tag</Button>
          </div>
        </div>

        {/* Meta */}
        <div className={styles.detailSection}>
          <div className={styles.detailSectionTitle}>Details</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text size="small" color="secondary">Source</Text>
              <Text size="small">{idea.source === 'ai-suggested' ? 'AI Suggested' : 'User Created'}</Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text size="small" color="secondary">Refinement</Text>
              <RefinementDots level={idea.refinement} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text size="small" color="secondary">Created</Text>
              <RelativeTime timestamp={idea.createdAt} size="sm" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text size="small" color="secondary">Updated</Text>
              <RelativeTime timestamp={idea.updatedAt} size="sm" />
            </div>
          </div>
        </div>

        <Divider />

        {/* AI Expansion */}
        <div className={styles.detailSection}>
          <div className={styles.detailSectionTitle}>AI Analysis</div>
          {isExpanding ? (
            <div className={styles.aiThinking}>
              <Spinner size="md" />
              <ShimmerText className={styles.aiThinkingText}>Analyzing idea...</ShimmerText>
            </div>
          ) : idea.aiExpansion ? (
            <div className={styles.aiExpansion}>
              <div className={styles.aiExpansionHeader}>
                <StarIcon />
                <Text size="small" weight="medium">AI Insights</Text>
              </div>
              <div className={styles.aiExpansionContent}>
                <div className={styles.aiExpansionItem}>
                  <span className={styles.aiExpansionLabel}>Summary</span>
                  <span className={styles.aiExpansionValue}>{idea.aiExpansion.summary}</span>
                </div>
                <div className={styles.aiExpansionItem}>
                  <span className={styles.aiExpansionLabel}>Suggested Approach</span>
                  <span className={styles.aiExpansionValue}>{idea.aiExpansion.suggestedApproach}</span>
                </div>
                <div className={styles.aiExpansionItem}>
                  <span className={styles.aiExpansionLabel}>Estimated Effort</span>
                  <span className={styles.aiExpansionValue}>{idea.aiExpansion.estimatedEffort}</span>
                </div>
                {idea.aiExpansion.risks && idea.aiExpansion.risks.length > 0 && (
                  <div className={styles.aiExpansionItem}>
                    <span className={styles.aiExpansionLabel}>Risks</span>
                    <ul style={{ margin: 0, paddingLeft: 'var(--space-4)' }}>
                      {idea.aiExpansion.risks.map((risk, i) => (
                        <li key={i}><Text size="small">{risk}</Text></li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Button variant="default" icon={<ExpandIcon />}>
              Expand with AI
            </Button>
          )}
        </div>
      </div>

      <div className={styles.detailActions}>
        <Button variant="primary" icon={<ChevronRightIcon />}>
          Create Plan
        </Button>
        <Button variant="default" icon={<EditIcon />}>
          Edit
        </Button>
        <IconButton variant="ghost" icon={<TrashIcon />} aria-label="Delete idea" />
      </div>
    </div>
  );
}

function CaptureBar({
  suggestions,
  onCapture,
}: {
  suggestions: string[];
  onCapture?: (text: string) => void;
}) {
  return (
    <div className={styles.captureBar}>
      <div className={styles.captureContent}>
        <div className={styles.captureInput}>
          <Input
            placeholder="Describe an idea..."
            aria-label="Capture new idea"
          />
          <IconButton variant="primary" icon={<SendIcon />} aria-label="Submit idea" />
        </div>
        <div className={styles.captureSuggestions}>
          <span className={styles.suggestionLabel}>
            <StarIcon /> AI suggestions:
          </span>
          {suggestions.map((suggestion, i) => (
            <Button key={i} variant="default" size="sm" shape="pill">
              {suggestion}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

interface IdeateIdeasProps {
  ideas?: Idea[];
  selectedIdeaId?: string;
  showDetail?: boolean;
  isExpanding?: boolean;
  filter?: 'all' | 'user' | 'ai';
}

function IdeateIdeasComponent({
  ideas = [],
  selectedIdeaId,
  showDetail = false,
  isExpanding = false,
  filter: initialFilter = 'all',
}: IdeateIdeasProps) {
  const [selectedId, setSelectedId] = useState<string | undefined>(selectedIdeaId);
  const [filter, setFilter] = useState(initialFilter);

  const filteredIdeas = ideas.filter((idea) => {
    if (filter === 'user') return idea.source === 'user';
    if (filter === 'ai') return idea.source === 'ai-suggested';
    return true;
  });

  const columns: { status: IdeaStatus; title: string }[] = [
    { status: 'new', title: 'New' },
    { status: 'exploring', title: 'Planning' },
    { status: 'ready', title: 'In Progress' },
    { status: 'archived', title: 'Archived' },
  ];

  const selectedIdea = ideas.find((i) => i.id === selectedId);
  const showDetailPanel = showDetail && selectedIdea;

  const userCount = ideas.filter((i) => i.source === 'user').length;
  const aiCount = ideas.filter((i) => i.source === 'ai-suggested').length;

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Heading level={1} size="h4">Ideas</Heading>
          <Chip size="sm" variant="default">{ideas.length} total</Chip>
        </div>
        <div className={styles.headerRight}>
          <Segmented
            value={filter}
            onChange={(v) => setFilter(v as 'all' | 'user' | 'ai')}
            options={[
              { value: 'all', label: `All (${ideas.length})` },
              { value: 'user', label: `User (${userCount})` },
              { value: 'ai', label: `AI (${aiCount})` },
            ]}
          />
          <IconButton variant="ghost" icon={<FilterIcon />} aria-label="More filters" />
          <IconButton variant="ghost" icon={<SearchIcon />} aria-label="Search ideas" />
          <Button variant="primary" icon={<AddIcon />}>
            New Idea
          </Button>
        </div>
      </header>

      {/* Capture Bar */}
      <CaptureBar suggestions={aiSuggestions} />

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Kanban Board */}
        <div className={styles.board}>
          {columns.map((col) => (
            <KanbanColumn
              key={col.status}
              title={col.title}
              ideas={filteredIdeas.filter((i) => i.status === col.status)}
              selectedId={selectedId}
              onSelectIdea={(idea) => setSelectedId(idea.id)}
            />
          ))}
        </div>

        {/* Detail Panel */}
        {showDetailPanel && (
          <DetailPanel
            idea={selectedIdea}
            onClose={() => setSelectedId(undefined)}
            isExpanding={isExpanding}
          />
        )}
      </div>
    </div>
  );
}

// ============================================
// STORYBOOK CONFIG
// ============================================

const meta: Meta<typeof IdeateIdeasComponent> = {
  title: 'Example Pages/Ideate Ideas/Board',
  component: IdeateIdeasComponent,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof IdeateIdeasComponent>;

export const Empty: Story = {
  args: {
    ideas: [],
    showDetail: false,
  },
};

export const Populated: Story = {
  args: {
    ideas: sampleIdeas,
    showDetail: false,
  },
};

export const WithDetail: Story = {
  args: {
    ideas: sampleIdeas,
    selectedIdeaId: '1',
    showDetail: true,
  },
};

export const AIExpanding: Story = {
  args: {
    ideas: sampleIdeas,
    selectedIdeaId: '3',
    showDetail: true,
    isExpanding: true,
  },
};

export const FilteredAI: Story = {
  args: {
    ideas: sampleIdeas,
    filter: 'ai',
    showDetail: false,
  },
};
