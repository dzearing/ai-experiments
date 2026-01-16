/**
 * Slide Deck Topic - Presentation slides with speaker notes and collaboration
 */
import { useState } from 'react';
import {
  Avatar,
  AvatarGroup,
  Button,
  Chip,
  Heading,
  IconButton,
  Stack,
  Tabs,
  Text,
} from '@ui-kit/react';
import { AddIcon } from '@ui-kit/icons/AddIcon';
import { ChatIcon } from '@ui-kit/icons/ChatIcon';
import { CheckIcon } from '@ui-kit/icons/CheckIcon';
import { ChevronLeftIcon } from '@ui-kit/icons/ChevronLeftIcon';
import { ChevronRightIcon } from '@ui-kit/icons/ChevronRightIcon';
import { ClockIcon } from '@ui-kit/icons/ClockIcon';
import { EditIcon } from '@ui-kit/icons/EditIcon';
import { ImageIcon } from '@ui-kit/icons/ImageIcon';
import { PlayIcon } from '@ui-kit/icons/PlayIcon';
import { ShareIcon } from '@ui-kit/icons/ShareIcon';
import { UsersIcon } from '@ui-kit/icons/UsersIcon';
import { type BaseTopic, styles } from '../shared';

// ============================================
// TYPES
// ============================================

interface SlideContent {
  type: 'title' | 'bullets' | 'image' | 'quote' | 'code' | 'two-column' | 'comparison';
  title?: string;
  subtitle?: string;
  bullets?: string[];
  imageUrl?: string;
  imageCaption?: string;
  quote?: string;
  quoteAuthor?: string;
  code?: string;
  codeLanguage?: string;
  leftColumn?: { title: string; bullets: string[] };
  rightColumn?: { title: string; bullets: string[] };
}

interface Slide {
  id: string;
  order: number;
  content: SlideContent;
  speakerNotes?: string;
  duration?: number; // estimated duration in seconds
  transition?: 'fade' | 'slide' | 'zoom' | 'none';
  comments?: SlideComment[];
}

interface SlideComment {
  id: string;
  author: string;
  avatar?: string;
  content: string;
  timestamp: Date;
  resolved?: boolean;
}

interface Collaborator {
  id: string;
  name: string;
  avatar?: string;
  role: 'owner' | 'editor' | 'viewer';
  lastActive?: Date;
  online?: boolean;
}

interface PresentationVersion {
  id: string;
  name: string;
  createdAt: Date;
  createdBy: string;
  slideCount: number;
}

export interface SlideDeckTopic extends BaseTopic {
  type: 'slide-deck';
  heroImage?: string;
  status: 'draft' | 'review' | 'final' | 'presented';
  presentationDate?: Date;
  audience?: string;
  slides: Slide[];
  collaborators: Collaborator[];
  versions?: PresentationVersion[];
  totalDuration?: number; // in minutes
  theme?: 'light' | 'dark' | 'corporate' | 'creative';
}

// ============================================
// SAMPLE DATA
// ============================================

export const sampleSlideDeck: SlideDeckTopic = {
  id: 'slide-deck-1',
  type: 'slide-deck',
  name: 'Q1 2024 Product Strategy',
  description: 'Quarterly product roadmap presentation for stakeholders covering key initiatives, metrics, and upcoming features.',
  tags: ['product', 'strategy', 'q1-2024', 'roadmap'],
  heroImage: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80',
  status: 'review',
  presentationDate: new Date('2024-01-25T14:00:00'),
  audience: 'Executive Team & Product Leads',
  theme: 'corporate',
  totalDuration: 45,
  slides: [
    {
      id: 's1',
      order: 1,
      content: {
        type: 'title',
        title: 'Q1 2024 Product Strategy',
        subtitle: 'Building the Future Together',
      },
      speakerNotes: 'Welcome everyone. Today we\'ll cover our Q1 initiatives and how they align with our annual goals.',
      duration: 30,
      transition: 'fade',
    },
    {
      id: 's2',
      order: 2,
      content: {
        type: 'bullets',
        title: 'Agenda',
        bullets: [
          'Q4 2023 Review & Learnings',
          'Q1 2024 Key Initiatives',
          'Resource Allocation',
          'Success Metrics & KPIs',
          'Timeline & Milestones',
          'Q&A',
        ],
      },
      speakerNotes: 'Quick overview of what we\'ll cover. Feel free to save questions for the end, but happy to clarify as we go.',
      duration: 45,
      transition: 'slide',
    },
    {
      id: 's3',
      order: 3,
      content: {
        type: 'two-column',
        title: 'Q4 2023 Highlights',
        leftColumn: {
          title: 'Wins',
          bullets: [
            'Launched mobile app v2.0',
            'Achieved 98% uptime SLA',
            '40% increase in user engagement',
            'Closed 3 enterprise deals',
          ],
        },
        rightColumn: {
          title: 'Learnings',
          bullets: [
            'Need faster iteration cycles',
            'More customer research upfront',
            'Better cross-team coordination',
            'Technical debt slowing features',
          ],
        },
      },
      speakerNotes: 'Before we look ahead, let\'s acknowledge what worked and what we can improve.',
      duration: 90,
      transition: 'slide',
      comments: [
        {
          id: 'c1',
          author: 'Sarah Chen',
          content: 'Should we add specific metrics for the engagement increase?',
          timestamp: new Date('2024-01-20T10:30:00'),
          resolved: false,
        },
      ],
    },
    {
      id: 's4',
      order: 4,
      content: {
        type: 'bullets',
        title: 'Q1 2024 Key Initiatives',
        bullets: [
          'AI-Powered Search & Recommendations',
          'Enterprise SSO & Admin Dashboard',
          'Performance Optimization Sprint',
          'New Onboarding Experience',
          'API v3 Launch',
        ],
      },
      speakerNotes: 'These five initiatives represent our main focus areas. Each has a dedicated team lead and clear success criteria.',
      duration: 60,
      transition: 'slide',
    },
    {
      id: 's5',
      order: 5,
      content: {
        type: 'comparison',
        title: 'Resource Allocation',
        leftColumn: {
          title: 'Current State',
          bullets: [
            '60% feature development',
            '25% maintenance',
            '15% innovation/R&D',
          ],
        },
        rightColumn: {
          title: 'Q1 Target',
          bullets: [
            '50% feature development',
            '20% maintenance',
            '30% innovation/R&D',
          ],
        },
      },
      speakerNotes: 'We\'re shifting more resources to innovation to stay ahead of the market. This requires reducing tech debt first.',
      duration: 75,
      transition: 'fade',
      comments: [
        {
          id: 'c2',
          author: 'Mike Johnson',
          content: 'The engineering team has concerns about reducing maintenance allocation',
          timestamp: new Date('2024-01-21T15:45:00'),
          resolved: true,
        },
      ],
    },
    {
      id: 's6',
      order: 6,
      content: {
        type: 'bullets',
        title: 'Success Metrics',
        bullets: [
          'User activation rate: 45% → 60%',
          'Feature adoption: 30% → 50%',
          'NPS score: 42 → 50',
          'API response time: < 200ms p95',
          'Enterprise pipeline: +$2M ARR',
        ],
      },
      speakerNotes: 'These are our north star metrics. Each initiative maps to one or more of these goals.',
      duration: 60,
      transition: 'slide',
    },
    {
      id: 's7',
      order: 7,
      content: {
        type: 'image',
        title: 'Q1 Timeline',
        imageUrl: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&q=80',
        imageCaption: 'Key milestones and delivery dates',
      },
      speakerNotes: 'Here\'s our high-level timeline. January focuses on planning and architecture, February on core development, March on polish and launch.',
      duration: 90,
      transition: 'zoom',
    },
    {
      id: 's8',
      order: 8,
      content: {
        type: 'quote',
        quote: 'The best way to predict the future is to create it.',
        quoteAuthor: 'Peter Drucker',
      },
      speakerNotes: 'As we wrap up, remember that our roadmap isn\'t just a plan—it\'s our commitment to building something great together.',
      duration: 30,
      transition: 'fade',
    },
    {
      id: 's9',
      order: 9,
      content: {
        type: 'title',
        title: 'Questions?',
        subtitle: 'Let\'s discuss',
      },
      speakerNotes: 'Open floor for questions. If we run out of time, I\'m available after the meeting or via Slack.',
      duration: 300,
      transition: 'fade',
    },
  ],
  collaborators: [
    { id: 'u1', name: 'David Zearing', role: 'owner', online: true },
    { id: 'u2', name: 'Sarah Chen', avatar: 'https://i.pravatar.cc/150?u=sarah', role: 'editor', online: true, lastActive: new Date() },
    { id: 'u3', name: 'Mike Johnson', avatar: 'https://i.pravatar.cc/150?u=mike', role: 'editor', online: false, lastActive: new Date('2024-01-22T16:30:00') },
    { id: 'u4', name: 'Emily Davis', avatar: 'https://i.pravatar.cc/150?u=emily', role: 'viewer', online: false },
  ],
  versions: [
    { id: 'v1', name: 'Initial Draft', createdAt: new Date('2024-01-15'), createdBy: 'David Zearing', slideCount: 6 },
    { id: 'v2', name: 'Added metrics section', createdAt: new Date('2024-01-18'), createdBy: 'David Zearing', slideCount: 8 },
    { id: 'v3', name: 'Incorporated feedback', createdAt: new Date('2024-01-22'), createdBy: 'Sarah Chen', slideCount: 9 },
  ],
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-22'),
  chatCount: 12,
  documentCount: 3,
  ideaCount: 5,
};

// ============================================
// COMPONENT
// ============================================

export function SlideDeckTopicDetail({ topic }: { topic: SlideDeckTopic }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showSpeakerNotes] = useState(true);

  const statusColors: Record<string, 'default' | 'primary' | 'success' | 'warning'> = {
    draft: 'default',
    review: 'warning',
    final: 'success',
    presented: 'primary',
  };

  const currentSlide = topic.slides[currentSlideIndex];
  const unresolvedComments = topic.slides.reduce((count, slide) => {
    return count + (slide.comments?.filter(c => !c.resolved).length || 0);
  }, 0);

  const goToNextSlide = () => {
    if (currentSlideIndex < topic.slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  const goToPrevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  const renderSlideContent = (content: SlideContent) => {
    switch (content.type) {
      case 'title':
        return (
          <div className={styles.slideTitleContent}>
            <Heading level={1} size={1}>{content.title}</Heading>
            {content.subtitle && <Text size="lg" color="soft">{content.subtitle}</Text>}
          </div>
        );
      case 'bullets':
        return (
          <div className={styles.slideBulletsContent}>
            {content.title && <Heading level={2} size={3}>{content.title}</Heading>}
            <ul className={styles.slideBulletList}>
              {content.bullets?.map((bullet, i) => (
                <li key={i}><Text>{bullet}</Text></li>
              ))}
            </ul>
          </div>
        );
      case 'two-column':
      case 'comparison':
        return (
          <div className={styles.slideComparisonContent}>
            {content.title && <Heading level={2} size={3}>{content.title}</Heading>}
            <div className={styles.slideColumns}>
              <div className={styles.slideColumn}>
                {content.leftColumn?.title && <Text weight="semibold" size="lg">{content.leftColumn.title}</Text>}
                <ul className={styles.slideBulletList}>
                  {content.leftColumn?.bullets.map((bullet, i) => (
                    <li key={i}><Text>{bullet}</Text></li>
                  ))}
                </ul>
              </div>
              <div className={styles.slideColumn}>
                {content.rightColumn?.title && <Text weight="semibold" size="lg">{content.rightColumn.title}</Text>}
                <ul className={styles.slideBulletList}>
                  {content.rightColumn?.bullets.map((bullet, i) => (
                    <li key={i}><Text>{bullet}</Text></li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );
      case 'image':
        return (
          <div className={styles.slideImageContent}>
            {content.title && <Heading level={2} size={3}>{content.title}</Heading>}
            <div className={styles.slideImageWrapper}>
              <div className={styles.slideImage} style={{ backgroundImage: `url(${content.imageUrl})` }} />
            </div>
            {content.imageCaption && <Text size="sm" color="soft">{content.imageCaption}</Text>}
          </div>
        );
      case 'quote':
        return (
          <div className={styles.slideQuoteContent}>
            <blockquote className={styles.slideQuote}>
              <Text size="xl">"{content.quote}"</Text>
            </blockquote>
            {content.quoteAuthor && <Text color="soft">— {content.quoteAuthor}</Text>}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <div className={styles.heroSection}>
        {topic.heroImage ? (
          <div className={styles.heroImage} style={{ backgroundImage: `url(${topic.heroImage})` }}>
            <div className={styles.heroActions}>
              <Button variant="primary" icon={<PlayIcon />} className={`${styles.heroActionButton} ${styles.askButton}`}>Present</Button>
              <IconButton variant="ghost" icon={<EditIcon />} aria-label="Edit presentation" className={styles.heroActionButton} />
              <IconButton variant="ghost" icon={<ShareIcon />} aria-label="Share" className={styles.heroActionButton} />
            </div>
            <div className={styles.heroOverlay}>
              <div className={styles.heroTags}>
                {topic.tags.map(tag => (
                  <span key={tag} className={styles.heroTag}>#{tag}</span>
                ))}
              </div>
              <Heading level={1} size={1} className={styles.heroTitle}>{topic.name}</Heading>
              <div className={styles.heroMeta}>
                <Chip variant={statusColors[topic.status]} size="sm">{topic.status}</Chip>
                <span className={styles.heroSubtitle}>
                  {topic.slides.length} slides • {topic.totalDuration} min
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.heroPlaceholder}>
            <ImageIcon className={styles.heroPlaceholderIcon} />
            <Heading level={1} size={2}>{topic.name}</Heading>
          </div>
        )}
      </div>

      {/* Stats Bar */}
      <div className={styles.commandBar}>
        <div className={styles.commandBarStats}>
          <div className={styles.statItem}>
            <ClockIcon className={styles.statIcon} />
            <span className={styles.statValue}>{topic.totalDuration}</span>
            <span className={styles.statLabel}>min</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{topic.slides.length}</span>
            <span className={styles.statLabel}>slides</span>
          </div>
          {unresolvedComments > 0 && (
            <div className={styles.statItem}>
              <ChatIcon className={styles.statIcon} />
              <span className={styles.statValue}>{unresolvedComments}</span>
              <span className={styles.statLabel}>comments</span>
            </div>
          )}
          <div className={styles.statItem}>
            <UsersIcon className={styles.statIcon} />
            <AvatarGroup size="sm" max={4}>
              {topic.collaborators.map(c => (
                <Avatar key={c.id} fallback={c.name} src={c.avatar} size="sm" />
              ))}
            </AvatarGroup>
          </div>
        </div>
        <div className={styles.commandBarActions}>
          {topic.presentationDate && (
            <Text size="sm" color="soft">
              Presenting: {topic.presentationDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </Text>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        variant="underline"
        items={[
          { value: 'overview', label: 'Overview', content: null },
          { value: 'slides', label: 'All Slides', content: null },
          { value: 'comments', label: `Comments ${unresolvedComments > 0 ? `(${unresolvedComments})` : ''}`, content: null },
          { value: 'versions', label: 'History', content: null },
        ]}
        className={styles.tabs}
      />

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === 'overview' && (
          <div className={styles.slideDeckOverview}>
            <Text className={styles.description}>{topic.description}</Text>

            <div className={styles.slideDeckOverviewColumns}>
              {/* Left Column - Slide Preview */}
              <div className={styles.slideDeckPreviewArea}>
                {/* Current Slide Display */}
                <div className={styles.slidePreviewContainer}>
                  <div className={styles.slidePreview}>
                    {renderSlideContent(currentSlide.content)}
                  </div>
                  <div className={styles.slideNavigation}>
                    <IconButton
                      variant="ghost"
                      icon={<ChevronLeftIcon />}
                      onClick={goToPrevSlide}
                      disabled={currentSlideIndex === 0}
                      aria-label="Previous slide"
                    />
                    <Text size="sm">
                      {currentSlideIndex + 1} / {topic.slides.length}
                    </Text>
                    <IconButton
                      variant="ghost"
                      icon={<ChevronRightIcon />}
                      onClick={goToNextSlide}
                      disabled={currentSlideIndex === topic.slides.length - 1}
                      aria-label="Next slide"
                    />
                  </div>
                </div>

                {/* Speaker Notes */}
                {showSpeakerNotes && currentSlide.speakerNotes && (
                  <div className={styles.speakerNotesCard}>
                    <div className={styles.speakerNotesHeader}>
                      <Text weight="semibold" size="sm">Speaker Notes</Text>
                      {currentSlide.duration && (
                        <Chip size="sm" variant="default">
                          <ClockIcon /> {formatDuration(currentSlide.duration)}
                        </Chip>
                      )}
                    </div>
                    <Text size="sm" color="soft">{currentSlide.speakerNotes}</Text>
                  </div>
                )}

                {/* Comments on current slide */}
                {currentSlide.comments && currentSlide.comments.length > 0 && (
                  <div className={styles.slideCommentsCard}>
                    <Text weight="semibold" size="sm">Comments on this slide</Text>
                    <div className={styles.slideCommentsList}>
                      {currentSlide.comments.map(comment => (
                        <div key={comment.id} className={`${styles.slideComment} ${comment.resolved ? styles.resolved : ''}`}>
                          <div className={styles.slideCommentHeader}>
                            <Text weight="medium" size="sm">{comment.author}</Text>
                            {comment.resolved && <CheckIcon className={styles.resolvedIcon} />}
                          </div>
                          <Text size="sm" color="soft">{comment.content}</Text>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Info Cards */}
              <div className={styles.slideDeckSidebar}>
                {/* Presentation Info */}
                <div className={styles.actionsCard}>
                  <Heading level={3} size={5}>Presentation Details</Heading>
                  <div className={styles.presentationDetails}>
                    {topic.presentationDate && (
                      <div className={styles.presentationDetailItem}>
                        <Text size="sm" color="soft">Date</Text>
                        <Text size="sm" weight="medium">
                          {topic.presentationDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </Text>
                      </div>
                    )}
                    {topic.audience && (
                      <div className={styles.presentationDetailItem}>
                        <Text size="sm" color="soft">Audience</Text>
                        <Text size="sm" weight="medium">{topic.audience}</Text>
                      </div>
                    )}
                    <div className={styles.presentationDetailItem}>
                      <Text size="sm" color="soft">Duration</Text>
                      <Text size="sm" weight="medium">{topic.totalDuration} minutes</Text>
                    </div>
                    <div className={styles.presentationDetailItem}>
                      <Text size="sm" color="soft">Theme</Text>
                      <Text size="sm" weight="medium">{topic.theme}</Text>
                    </div>
                  </div>
                </div>

                {/* Collaborators */}
                <div className={styles.actionsCard}>
                  <div className={styles.sectionHeader}>
                    <Heading level={3} size={5}>Collaborators</Heading>
                    <IconButton variant="ghost" size="sm" icon={<AddIcon />} aria-label="Add collaborator" />
                  </div>
                  <div className={styles.collaboratorsList}>
                    {topic.collaborators.map(collaborator => (
                      <div key={collaborator.id} className={styles.collaboratorItem}>
                        <div className={styles.collaboratorInfo}>
                          <Avatar fallback={collaborator.name} src={collaborator.avatar} size="sm" />
                          <Stack direction="vertical" gap="none">
                            <Text size="sm" weight="medium">{collaborator.name}</Text>
                            <Text size="xs" color="soft">{collaborator.role}</Text>
                          </Stack>
                        </div>
                        {collaborator.online && <div className={styles.onlineIndicator} />}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className={styles.actionButtons}>
                  <Button variant="primary" icon={<PlayIcon />}>Present</Button>
                  <Button variant="default" icon={<ShareIcon />}>Share</Button>
                  <Button variant="ghost" icon={<ChatIcon />}>Discuss</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'slides' && (
          <div className={styles.slideThumbnailGrid}>
            {topic.slides.map((slide, index) => (
              <button
                key={slide.id}
                className={`${styles.slideThumbnail} ${index === currentSlideIndex ? styles.active : ''}`}
                onClick={() => {
                  setCurrentSlideIndex(index);
                  setActiveTab('overview');
                }}
              >
                <div className={styles.slideThumbnailNumber}>{index + 1}</div>
                <div className={styles.slideThumbnailContent}>
                  <Text weight="medium" size="sm">{slide.content.title || `Slide ${index + 1}`}</Text>
                  <Text size="xs" color="soft">{slide.content.type}</Text>
                </div>
                {slide.comments && slide.comments.filter(c => !c.resolved).length > 0 && (
                  <div className={styles.slideThumbnailComments}>
                    <ChatIcon />
                    <span>{slide.comments.filter(c => !c.resolved).length}</span>
                  </div>
                )}
              </button>
            ))}
            <button className={styles.addSlideButton}>
              <AddIcon />
              <Text size="sm">Add Slide</Text>
            </button>
          </div>
        )}

        {activeTab === 'comments' && (
          <div className={styles.allCommentsList}>
            {topic.slides.map((slide, index) => {
              if (!slide.comments || slide.comments.length === 0) return null;

              return (
                <div key={slide.id} className={styles.slideCommentsSection}>
                  <div className={styles.slideCommentsSectionHeader}>
                    <Text weight="semibold">Slide {index + 1}: {slide.content.title || 'Untitled'}</Text>
                  </div>
                  {slide.comments.map(comment => (
                    <div key={comment.id} className={`${styles.commentCard} ${comment.resolved ? styles.resolved : ''}`}>
                      <div className={styles.commentHeader}>
                        <Avatar fallback={comment.author} src={comment.avatar} size="sm" />
                        <div>
                          <Text weight="medium" size="sm">{comment.author}</Text>
                          <Text size="xs" color="soft">
                            {comment.timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                          </Text>
                        </div>
                        {comment.resolved && <Chip size="sm" variant="success">Resolved</Chip>}
                      </div>
                      <Text size="sm">{comment.content}</Text>
                      {!comment.resolved && (
                        <div className={styles.commentActions}>
                          <Button variant="ghost" size="sm">Reply</Button>
                          <Button variant="ghost" size="sm">Resolve</Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
            {unresolvedComments === 0 && (
              <div className={styles.emptyState}>
                <CheckIcon className={styles.emptyStateIcon} />
                <Text>All comments resolved</Text>
              </div>
            )}
          </div>
        )}

        {activeTab === 'versions' && topic.versions && (
          <div className={styles.versionsList}>
            {topic.versions.slice().reverse().map((version, index) => (
              <div key={version.id} className={`${styles.versionItem} ${index === 0 ? styles.current : ''}`}>
                <div className={styles.versionInfo}>
                  <Text weight="medium">{version.name}</Text>
                  <Text size="sm" color="soft">
                    {version.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} by {version.createdBy}
                  </Text>
                </div>
                <div className={styles.versionMeta}>
                  <Chip size="sm" variant="default">{version.slideCount} slides</Chip>
                  {index === 0 && <Chip size="sm" variant="primary">Current</Chip>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
