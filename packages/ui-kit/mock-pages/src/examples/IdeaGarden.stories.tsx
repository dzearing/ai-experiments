import type { Meta, StoryObj } from '@storybook/react';
import {
  Avatar,
  AvatarGroup,
  Button,
  Card,
  Chip,
  Divider,
  Heading,
  IconButton,
  Input,
  Text,
} from '@ui-kit/react';
import { ChevronRightIcon } from '@ui-kit/icons/ChevronRightIcon';
import { CloseIcon } from '@ui-kit/icons/CloseIcon';
import { ExpandIcon } from '@ui-kit/icons/ExpandIcon';
import { SendIcon } from '@ui-kit/icons/SendIcon';
import { ShareIcon } from '@ui-kit/icons/ShareIcon';
import { UsersIcon } from '@ui-kit/icons/UsersIcon';
import styles from './IdeaGarden.module.css';

/**
 * # Idea Garden
 *
 * A collaborative ideation space where ideas grow organically through conversation.
 *
 * ## Component Gap Analysis
 *
 * Components that would improve this implementation:
 *
 * 1. **ChatInput** - A specialized input for chat/prompt interfaces
 * 2. **EmptyState** - A standardized empty state component
 * 3. **PresenceIndicator** - For showing online/collaborator status
 * 4. **SuggestionGroup** - Grouped clickable suggestion chips
 * 5. **SidePanel** - A non-modal slide-in panel
 */

interface Idea {
  id: string;
  text: string;
  description?: string;
  refinement: 1 | 2 | 3 | 4;
  isNew?: boolean;
  collaborator?: { name: string; color: string };
}

const sampleIdeas: Idea[] = [
  {
    id: '1',
    text: 'Product Launch Strategy',
    description: 'Core go-to-market approach including channels, timing, and positioning.',
    refinement: 4,
    collaborator: { name: 'Sarah', color: '#3B82F6' },
  },
  {
    id: '2',
    text: 'Social media campaign',
    description: 'Multi-platform content strategy targeting early adopters.',
    refinement: 3,
    collaborator: { name: 'Alex', color: '#F59E0B' },
  },
  {
    id: '3',
    text: 'Influencer partnerships',
    description: 'Partner with tech reviewers for launch coverage.',
    refinement: 2,
  },
  {
    id: '4',
    text: 'Email newsletter',
    description: 'Build anticipation with a drip campaign.',
    refinement: 2,
  },
  {
    id: '5',
    text: 'Beta user feedback',
    description: 'Collect testimonials and case studies from beta users.',
    refinement: 3,
    collaborator: { name: 'Mike', color: '#10B981' },
  },
  {
    id: '6',
    text: 'Press outreach',
    description: 'Media kit and press release strategy.',
    refinement: 2,
  },
  {
    id: '7',
    text: 'Pricing strategy',
    description: 'Evaluate freemium vs paid tiers.',
    refinement: 3,
  },
  {
    id: '8',
    text: 'Freemium model?',
    refinement: 1,
    isNew: true,
  },
];

// Mic icon for voice input
function MicIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

// Lightbulb icon
function LightbulbIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 21h6" />
      <path d="M9 18h6" />
      <path d="M12 2a7 7 0 0 0-4 12.7V16h8v-1.3A7 7 0 0 0 12 2z" />
    </svg>
  );
}

// Refinement indicator with dots
function RefinementIndicator({ level }: { level: number }) {
  const labels = ['Just started', 'Early stage', 'In progress', 'Well developed'];
  const variants: Array<'default' | 'info' | 'success'> = ['default', 'default', 'info', 'success'];
  return (
    <div className={styles.refinementIndicator}>
      <div className={styles.refinementDots}>
        {[1, 2, 3, 4].map((dot) => (
          <div
            key={dot}
            className={`${styles.refinementDot} ${dot <= level ? styles.refinementDotFilled : ''}`}
          />
        ))}
      </div>
      <Chip size="sm" variant={variants[level - 1]}>{labels[level - 1]}</Chip>
    </div>
  );
}

// Presence dot
function PresenceDot({ color, name }: { color: string; name: string }) {
  return (
    <div className={styles.presenceDot}>
      <div className={styles.presenceDotCircle} style={{ background: color }} />
      <span className={styles.presenceDotName}>{name}</span>
    </div>
  );
}

// Single idea card
function IdeaCard({
  idea,
  focused,
  onClick,
}: {
  idea: Idea;
  focused?: boolean;
  onClick?: () => void;
}) {
  return (
    <Card
      onClick={onClick}
      padding="md"
      className={`${styles.ideaCard} ${focused ? styles.ideaCardFocused : ''} ${idea.isNew ? styles.ideaCardNew : ''}`}
    >
      <div className={styles.cardContent}>
        <div className={styles.cardHeader}>
          <Text weight="medium" className={styles.cardTitle}>{idea.text}</Text>
          {idea.isNew && <Chip size="sm" variant="primary">New</Chip>}
        </div>

        {idea.description && (
          <Text size="small" color="secondary" className={styles.cardDescription}>
            {idea.description}
          </Text>
        )}

        <div className={styles.cardFooter}>
          <RefinementIndicator level={idea.refinement} />
          {idea.collaborator && (
            <PresenceDot color={idea.collaborator.color} name={idea.collaborator.name} />
          )}
        </div>
      </div>
    </Card>
  );
}

// Empty state
function EmptyState() {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>
        <LightbulbIcon size={64} />
      </div>
      <Heading level={2} size="h3">Start Growing Ideas</Heading>
      <Text color="secondary" className={styles.emptyDescription}>
        Type or speak your first thought below. AI will help expand it into
        a garden of connected ideas that grow as you explore.
      </Text>
    </div>
  );
}

// Input area
function IdeaInputArea({
  placeholder = "Type an idea or question...",
  focusedIdea,
  onClearFocus,
  isRecording = false,
  isProcessing = false,
}: {
  placeholder?: string;
  focusedIdea?: string;
  onClearFocus?: () => void;
  isRecording?: boolean;
  isProcessing?: boolean;
}) {
  return (
    <div className={styles.inputArea}>
      <div className={styles.inputContainer}>
        {/* Focus context bar */}
        {focusedIdea && (
          <div className={styles.focusContext}>
            <span className={styles.focusLabel}>Extending:</span>
            <span className={styles.focusIdea}>{focusedIdea}</span>
            <Button variant="ghost" onClick={onClearFocus} icon={<CloseIcon />}>
              Clear
            </Button>
          </div>
        )}

        {/* AI Processing indicator */}
        {isProcessing && (
          <div className={styles.aiProcessing}>
            <div className={styles.aiDots}>
              <div className={styles.aiDot} />
              <div className={styles.aiDot} />
              <div className={styles.aiDot} />
            </div>
            <span>AI is thinking...</span>
          </div>
        )}

        {/* Input row */}
        <div className={styles.inputWrapper}>
          <Input
            placeholder={focusedIdea ? `How would you extend "${focusedIdea}"?` : placeholder}
            aria-label="Idea input"
            className={styles.input}
          />
          <IconButton
            variant="ghost"
            icon={<SendIcon />}
            aria-label="Send"
          />
          <IconButton
            variant={isRecording ? 'primary' : 'secondary'}
            icon={<MicIcon size={18} />}
            aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
            className={isRecording ? styles.voiceButtonRecording : ''}
          />
        </div>

        {/* Suggestions */}
        <div className={styles.suggestions}>
          <Button variant="default" size="sm" shape="pill">Expand on marketing</Button>
          <Button variant="default" size="sm" shape="pill">What about pricing?</Button>
          <Button variant="default" size="sm" shape="pill">Competitor analysis</Button>
        </div>
      </div>
    </div>
  );
}

// Detail panel (non-modal sidebar)
function DetailPanel({ idea, onClose }: { idea: Idea; onClose: () => void }) {
  return (
    <div className={styles.detailPanel}>
      <div className={styles.detailHeader}>
        <Heading level={3} size="h5">{idea.text}</Heading>
        <IconButton variant="ghost" icon={<CloseIcon />} onClick={onClose} aria-label="Close" />
      </div>

      <div className={styles.detailContent}>
        <div className={styles.detailSection}>
          <Text size="small" weight="medium" color="secondary" className={styles.sectionLabel}>
            Refinement Level
          </Text>
          <div className={styles.sectionContent}>
            <RefinementIndicator level={idea.refinement} />
          </div>
        </div>

        <Divider />

        <div className={styles.detailSection}>
          <Text size="small" weight="medium" color="secondary" className={styles.sectionLabel}>
            Related Ideas
          </Text>
          <div className={styles.relatedIdeas}>
            {['Social media campaign', 'Press outreach', 'Beta user feedback'].map((item) => (
              <Button key={item} variant="ghost" className={styles.relatedIdea}>
                {item}
              </Button>
            ))}
          </div>
        </div>

        <Divider />

        <div className={styles.detailSection}>
          <Text size="small" weight="medium" color="secondary" className={styles.sectionLabel}>
            Evolution
          </Text>
          <div className={styles.evolutionThread}>
            {[
              { time: '2 min ago', user: 'Sarah', text: 'Added pricing strategy angle' },
              { time: '5 min ago', user: 'Mike', text: 'Connected to beta feedback' },
              { time: '8 min ago', user: 'You', text: 'Initial idea: "launch strategy"' },
            ].map((item, i) => (
              <div key={i} className={styles.evolutionItem}>
                <Text size="small" color="secondary">{item.time} - {item.user}</Text>
                <Text size="small">{item.text}</Text>
              </div>
            ))}
          </div>
        </div>

        <Divider />

        <div className={styles.detailSection}>
          <Text size="small" weight="medium" color="secondary" className={styles.sectionLabel}>
            Actions
          </Text>
          <div className={styles.actionButtons}>
            <Button variant="default" icon={<ExpandIcon />}>Expand</Button>
            <Button variant="default" icon={<ChevronRightIcon />}>Simplify</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main component
function IdeaGardenComponent({
  title = 'Idea Garden',
  status = 'Active',
  ideas = [] as Idea[],
  collaborators = [] as { initials: string; name: string }[],
  focusedIdeaId,
  showDetailPanel = false,
  isRecording = false,
  isProcessing = false,
}: {
  title?: string;
  status?: 'Active' | 'Recording' | 'AI Processing';
  ideas?: Idea[];
  collaborators?: { initials: string; name: string }[];
  focusedIdeaId?: string;
  showDetailPanel?: boolean;
  isRecording?: boolean;
  isProcessing?: boolean;
}) {
  const focusedIdea = ideas.find((i) => i.id === focusedIdeaId);

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Heading level={1} size="h4">{title}</Heading>
          <Chip
            size="sm"
            variant={status === 'Recording' ? 'success' : status === 'AI Processing' ? 'info' : 'default'}
          >
            {status}
          </Chip>
        </div>

        <div className={styles.headerRight}>
          {collaborators.length > 0 && (
            <>
              <AvatarGroup max={3}>
                {collaborators.map((c) => (
                  <Avatar key={c.initials} fallback={c.name} size="sm" />
                ))}
              </AvatarGroup>
              <Text size="small" color="secondary">{collaborators.length} collaborating</Text>
              <Divider orientation="vertical" className={styles.headerDivider} />
            </>
          )}
          <Button variant="default" icon={<UsersIcon />}>Invite</Button>
          <Button variant="default" icon={<ShareIcon />}>Share</Button>
        </div>
      </header>

      {/* Main content area */}
      <div className={styles.mainContent}>
        {/* Garden Area - card grid */}
        <div className={`${styles.gardenArea} ${showDetailPanel && focusedIdea ? styles.gardenAreaWithPanel : ''}`}>
          {ideas.length === 0 ? (
            <EmptyState />
          ) : (
            <div className={styles.cardGrid}>
              {ideas.map((idea) => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  focused={idea.id === focusedIdeaId}
                />
              ))}
            </div>
          )}
        </div>

        {/* Detail Panel (non-modal) */}
        {showDetailPanel && focusedIdea && (
          <DetailPanel idea={focusedIdea} onClose={() => {}} />
        )}
      </div>

      {/* Input Area */}
      <IdeaInputArea
        focusedIdea={focusedIdea?.text}
        isRecording={isRecording}
        isProcessing={isProcessing}
        placeholder={isRecording ? 'Listening...' : 'Type an idea or question...'}
      />
    </div>
  );
}

const meta: Meta<typeof IdeaGardenComponent> = {
  title: 'Example Pages/Idea Garden',
  component: IdeaGardenComponent,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof IdeaGardenComponent>;

export const Empty: Story = {
  args: {
    title: 'New Ideation Session',
    status: 'Active',
    ideas: [],
    collaborators: [],
  },
};

export const Recording: Story = {
  args: {
    title: 'Product Launch Planning',
    status: 'Recording',
    ideas: [sampleIdeas[0]],
    collaborators: [{ initials: 'SJ', name: 'Sarah' }],
    isRecording: true,
  },
};

export const Growing: Story = {
  args: {
    title: 'Product Launch Planning',
    status: 'Active',
    ideas: sampleIdeas,
    collaborators: [
      { initials: 'SJ', name: 'Sarah' },
      { initials: 'MT', name: 'Mike' },
      { initials: 'AK', name: 'Alex' },
    ],
  },
};

export const Processing: Story = {
  args: {
    title: 'Product Launch Planning',
    status: 'AI Processing',
    ideas: sampleIdeas.slice(0, 5),
    collaborators: [
      { initials: 'SJ', name: 'Sarah' },
      { initials: 'MT', name: 'Mike' },
    ],
    isProcessing: true,
  },
};

export const Focused: Story = {
  args: {
    title: 'Product Launch Planning',
    status: 'Active',
    ideas: sampleIdeas,
    collaborators: [
      { initials: 'SJ', name: 'Sarah' },
      { initials: 'MT', name: 'Mike' },
      { initials: 'AK', name: 'Alex' },
    ],
    focusedIdeaId: '1',
    showDetailPanel: true,
  },
};
