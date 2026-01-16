/**
 * Whiteboard Topic - Collaborative visual workspace with shapes, notes, and connections
 */
import { useState } from 'react';
import {
  Avatar,
  AvatarGroup,
  Button,
  Chip,
  Heading,
  IconButton,
  Tabs,
  Text,
} from '@ui-kit/react';
import { AddIcon } from '@ui-kit/icons/AddIcon';
import { ChatIcon } from '@ui-kit/icons/ChatIcon';
import { EditIcon } from '@ui-kit/icons/EditIcon';
import { ImageIcon } from '@ui-kit/icons/ImageIcon';
import { PlayIcon } from '@ui-kit/icons/PlayIcon';
import { ShareIcon } from '@ui-kit/icons/ShareIcon';
import { UsersIcon } from '@ui-kit/icons/UsersIcon';
import { type BaseTopic, styles } from '../shared';

// ============================================
// TYPES
// ============================================

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

interface WhiteboardElement {
  id: string;
  type: 'sticky' | 'shape' | 'text' | 'image' | 'frame' | 'connector';
  position: Position;
  size?: Size;
  zIndex: number;
  locked?: boolean;
  createdBy: string;
  createdAt: Date;
}

interface StickyNote extends WhiteboardElement {
  type: 'sticky';
  content: string;
  color: 'yellow' | 'pink' | 'blue' | 'green' | 'orange' | 'purple';
  votes?: number;
  votedBy?: string[];
}

interface Shape extends WhiteboardElement {
  type: 'shape';
  shape: 'rectangle' | 'circle' | 'diamond' | 'triangle' | 'arrow';
  fill?: string;
  stroke?: string;
  label?: string;
}

interface TextBox extends WhiteboardElement {
  type: 'text';
  content: string;
  fontSize?: 'sm' | 'md' | 'lg' | 'xl';
  fontWeight?: 'normal' | 'bold';
}

interface ImageElement extends WhiteboardElement {
  type: 'image';
  url: string;
  alt?: string;
}

interface Frame extends WhiteboardElement {
  type: 'frame';
  title: string;
  color?: string;
  children: string[]; // IDs of contained elements
}

interface Connector extends WhiteboardElement {
  type: 'connector';
  from: string; // Element ID
  to: string; // Element ID
  fromAnchor?: 'top' | 'right' | 'bottom' | 'left' | 'center';
  toAnchor?: 'top' | 'right' | 'bottom' | 'left' | 'center';
  style?: 'solid' | 'dashed' | 'dotted';
  label?: string;
}

interface Collaborator {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  cursor?: Position;
  online: boolean;
  lastActive?: Date;
}

interface WhiteboardTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
}

interface WhiteboardSection {
  id: string;
  title: string;
  description?: string;
  elements: string[]; // IDs of elements in this section
  color?: string;
}

export interface WhiteboardTopic extends BaseTopic {
  type: 'whiteboard';
  heroImage?: string;
  status: 'active' | 'archived' | 'template';
  elements: (StickyNote | Shape | TextBox | ImageElement | Frame | Connector)[];
  collaborators: Collaborator[];
  sections?: WhiteboardSection[];
  canvasSize?: Size;
  backgroundColor?: string;
  gridEnabled?: boolean;
  template?: WhiteboardTemplate;
}

// ============================================
// SAMPLE DATA
// ============================================

export const sampleWhiteboard: WhiteboardTopic = {
  id: 'whiteboard-1',
  type: 'whiteboard',
  name: 'Product Brainstorm Session',
  description: 'Collaborative ideation board for Q2 feature planning. Collecting ideas, voting on priorities, and mapping dependencies.',
  tags: ['brainstorm', 'product', 'q2-planning', 'collaboration'],
  heroImage: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&q=80',
  status: 'active',
  canvasSize: { width: 3000, height: 2000 },
  backgroundColor: '#fafafa',
  gridEnabled: true,
  sections: [
    { id: 'sec-1', title: 'User Pain Points', description: 'What problems are users facing?', elements: ['s1', 's2', 's3'], color: '#fee2e2' },
    { id: 'sec-2', title: 'Feature Ideas', description: 'Potential solutions', elements: ['s4', 's5', 's6', 's7'], color: '#dbeafe' },
    { id: 'sec-3', title: 'Quick Wins', description: 'Low effort, high impact', elements: ['s8', 's9'], color: '#dcfce7' },
    { id: 'sec-4', title: 'Future Vision', description: 'Long-term roadmap items', elements: ['s10', 's11'], color: '#fef3c7' },
  ],
  elements: [
    // Pain Points Section
    {
      id: 's1',
      type: 'sticky',
      position: { x: 100, y: 150 },
      size: { width: 200, height: 150 },
      zIndex: 1,
      content: 'Search results are slow and often irrelevant',
      color: 'pink',
      votes: 8,
      votedBy: ['u1', 'u2', 'u3'],
      createdBy: 'Sarah Chen',
      createdAt: new Date('2024-01-20T10:00:00'),
    },
    {
      id: 's2',
      type: 'sticky',
      position: { x: 320, y: 150 },
      size: { width: 200, height: 150 },
      zIndex: 1,
      content: 'Onboarding takes too long - users drop off',
      color: 'pink',
      votes: 12,
      votedBy: ['u1', 'u2', 'u4'],
      createdBy: 'Mike Johnson',
      createdAt: new Date('2024-01-20T10:05:00'),
    },
    {
      id: 's3',
      type: 'sticky',
      position: { x: 540, y: 150 },
      size: { width: 200, height: 150 },
      zIndex: 1,
      content: 'Mobile app crashes frequently on Android',
      color: 'pink',
      votes: 5,
      votedBy: ['u3'],
      createdBy: 'Emily Davis',
      createdAt: new Date('2024-01-20T10:10:00'),
    },
    // Feature Ideas Section
    {
      id: 's4',
      type: 'sticky',
      position: { x: 100, y: 400 },
      size: { width: 200, height: 150 },
      zIndex: 1,
      content: 'AI-powered search with natural language',
      color: 'blue',
      votes: 15,
      votedBy: ['u1', 'u2', 'u3', 'u4'],
      createdBy: 'David Zearing',
      createdAt: new Date('2024-01-20T10:15:00'),
    },
    {
      id: 's5',
      type: 'sticky',
      position: { x: 320, y: 400 },
      size: { width: 200, height: 150 },
      zIndex: 1,
      content: 'Interactive onboarding with progress tracking',
      color: 'blue',
      votes: 9,
      votedBy: ['u2', 'u4'],
      createdBy: 'Sarah Chen',
      createdAt: new Date('2024-01-20T10:20:00'),
    },
    {
      id: 's6',
      type: 'sticky',
      position: { x: 540, y: 400 },
      size: { width: 200, height: 150 },
      zIndex: 1,
      content: 'Real-time collaboration features',
      color: 'blue',
      votes: 7,
      votedBy: ['u1', 'u3'],
      createdBy: 'Mike Johnson',
      createdAt: new Date('2024-01-20T10:25:00'),
    },
    {
      id: 's7',
      type: 'sticky',
      position: { x: 760, y: 400 },
      size: { width: 200, height: 150 },
      zIndex: 1,
      content: 'Dark mode support across all platforms',
      color: 'blue',
      votes: 6,
      votedBy: ['u4'],
      createdBy: 'Emily Davis',
      createdAt: new Date('2024-01-20T10:30:00'),
    },
    // Quick Wins Section
    {
      id: 's8',
      type: 'sticky',
      position: { x: 100, y: 650 },
      size: { width: 200, height: 150 },
      zIndex: 1,
      content: 'Add keyboard shortcuts for power users',
      color: 'green',
      votes: 4,
      votedBy: ['u1'],
      createdBy: 'David Zearing',
      createdAt: new Date('2024-01-20T10:35:00'),
    },
    {
      id: 's9',
      type: 'sticky',
      position: { x: 320, y: 650 },
      size: { width: 200, height: 150 },
      zIndex: 1,
      content: 'Improve error messages with actionable guidance',
      color: 'green',
      votes: 3,
      votedBy: ['u2'],
      createdBy: 'Sarah Chen',
      createdAt: new Date('2024-01-20T10:40:00'),
    },
    // Future Vision Section
    {
      id: 's10',
      type: 'sticky',
      position: { x: 100, y: 900 },
      size: { width: 200, height: 150 },
      zIndex: 1,
      content: 'Voice interface for hands-free operation',
      color: 'orange',
      votes: 2,
      votedBy: [],
      createdBy: 'Mike Johnson',
      createdAt: new Date('2024-01-20T10:45:00'),
    },
    {
      id: 's11',
      type: 'sticky',
      position: { x: 320, y: 900 },
      size: { width: 200, height: 150 },
      zIndex: 1,
      content: 'AR/VR workspace for immersive collaboration',
      color: 'orange',
      votes: 1,
      votedBy: [],
      createdBy: 'Emily Davis',
      createdAt: new Date('2024-01-20T10:50:00'),
    },
    // Connectors showing relationships
    {
      id: 'c1',
      type: 'connector',
      position: { x: 0, y: 0 },
      zIndex: 0,
      from: 's1',
      to: 's4',
      style: 'dashed',
      label: 'solves',
      createdBy: 'David Zearing',
      createdAt: new Date('2024-01-20T11:00:00'),
    },
    {
      id: 'c2',
      type: 'connector',
      position: { x: 0, y: 0 },
      zIndex: 0,
      from: 's2',
      to: 's5',
      style: 'dashed',
      label: 'solves',
      createdBy: 'Sarah Chen',
      createdAt: new Date('2024-01-20T11:05:00'),
    },
  ],
  collaborators: [
    { id: 'u1', name: 'David Zearing', color: '#3b82f6', online: true, cursor: { x: 450, y: 300 } },
    { id: 'u2', name: 'Sarah Chen', avatar: 'https://i.pravatar.cc/150?u=sarah', color: '#ec4899', online: true, cursor: { x: 200, y: 500 } },
    { id: 'u3', name: 'Mike Johnson', avatar: 'https://i.pravatar.cc/150?u=mike', color: '#10b981', online: false, lastActive: new Date('2024-01-22T16:30:00') },
    { id: 'u4', name: 'Emily Davis', avatar: 'https://i.pravatar.cc/150?u=emily', color: '#f59e0b', online: true, cursor: { x: 600, y: 700 } },
  ],
  createdAt: new Date('2024-01-20'),
  updatedAt: new Date('2024-01-22'),
  chatCount: 28,
  documentCount: 2,
  ideaCount: 11,
};

// ============================================
// COMPONENT
// ============================================

export function WhiteboardTopicDetail({ topic }: { topic: WhiteboardTopic }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [sortBy, setSortBy] = useState<'votes' | 'recent'>('votes');

  const onlineCollaborators = topic.collaborators.filter(c => c.online);
  const stickyNotes = topic.elements.filter(e => e.type === 'sticky') as StickyNote[];
  const totalVotes = stickyNotes.reduce((sum, note) => sum + (note.votes || 0), 0);

  const getStickyColor = (color: string) => {
    const colors: Record<string, string> = {
      yellow: '#fef3c7',
      pink: '#fce7f3',
      blue: '#dbeafe',
      green: '#dcfce7',
      orange: '#ffedd5',
      purple: '#f3e8ff',
    };

    return colors[color] || colors.yellow;
  };

  const sortedNotes = [...stickyNotes].sort((a, b) => {
    if (sortBy === 'votes') {
      return (b.votes || 0) - (a.votes || 0);
    }

    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const getNotesForSection = (sectionId: string) => {
    const section = topic.sections?.find(s => s.id === sectionId);
    if (!section) return [];

    return stickyNotes
      .filter(note => section.elements.includes(note.id))
      .sort((a, b) => (b.votes || 0) - (a.votes || 0));
  };

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <div className={styles.heroSection}>
        {topic.heroImage ? (
          <div className={styles.heroImage} style={{ backgroundImage: `url(${topic.heroImage})` }}>
            <div className={styles.heroActions}>
              <Button variant="primary" icon={<ChatIcon />} className={`${styles.heroActionButton} ${styles.askButton}`}>Chat about this board</Button>
              <IconButton variant="ghost" icon={<EditIcon />} aria-label="Edit board" className={styles.heroActionButton} />
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
                <Chip variant="success" size="sm">{onlineCollaborators.length} online</Chip>
                <span className={styles.heroSubtitle}>
                  {stickyNotes.length} notes • {totalVotes} votes
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
            <span className={styles.statValue}>{stickyNotes.length}</span>
            <span className={styles.statLabel}>notes</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{totalVotes}</span>
            <span className={styles.statLabel}>votes</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{topic.sections?.length || 0}</span>
            <span className={styles.statLabel}>sections</span>
          </div>
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
          <div className={styles.liveCursors}>
            {onlineCollaborators.slice(0, 3).map(c => (
              <div key={c.id} className={styles.liveCursor} style={{ backgroundColor: c.color }}>
                <Text size="xs">{c.name.split(' ')[0]}</Text>
              </div>
            ))}
            {onlineCollaborators.length > 3 && (
              <Text size="xs" color="soft">+{onlineCollaborators.length - 3} more</Text>
            )}
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
          { value: 'notes', label: 'All Notes', content: null },
          { value: 'sections', label: 'Sections', content: null },
          { value: 'activity', label: 'Activity', content: null },
        ]}
        className={styles.tabs}
      />

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === 'overview' && (
          <div className={styles.whiteboardOverview}>
            <Text className={styles.description}>{topic.description}</Text>

            <div className={styles.whiteboardOverviewColumns}>
              {/* Left Column - Board Preview */}
              <div className={styles.whiteboardPreviewArea}>
                {/* Mini Canvas Preview */}
                <div className={styles.canvasPreview}>
                  <div className={styles.canvasPreviewHeader}>
                    <Text weight="semibold">Board Preview</Text>
                    <Button variant="primary" size="sm" icon={<PlayIcon />}>Open Full Board</Button>
                  </div>
                  <div className={styles.canvasPreviewContent}>
                    {/* Simplified representation of the board */}
                    <div className={styles.miniCanvas}>
                      {topic.sections?.map(section => (
                        <div
                          key={section.id}
                          className={styles.miniSection}
                          style={{ backgroundColor: section.color }}
                        >
                          <Text size="xs" weight="semibold" color="inherit">{section.title}</Text>
                          <Text size="xs" color="inherit">{section.elements.length} items</Text>
                        </div>
                      ))}
                    </div>
                    {/* Live cursors indicator */}
                    <div className={styles.canvasLiveCursors}>
                      {onlineCollaborators.map(c => (
                        <div
                          key={c.id}
                          className={styles.miniCursor}
                          style={{
                            backgroundColor: c.color,
                            left: `${(c.cursor?.x || 0) / 30}%`,
                            top: `${(c.cursor?.y || 0) / 20}%`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Top Voted Notes */}
                <div className={styles.topVotedNotes}>
                  <div className={styles.sectionHeader}>
                    <Heading level={3} size={5}>Top Voted Ideas</Heading>
                  </div>
                  <div className={styles.votedNotesList}>
                    {sortedNotes.slice(0, 5).map((note, index) => (
                      <div key={note.id} className={styles.votedNoteItem}>
                        <div className={styles.voteRank}>#{index + 1}</div>
                        <div
                          className={styles.votedNoteContent}
                          style={{ backgroundColor: getStickyColor(note.color) }}
                        >
                          <Text size="sm" color="inherit">{note.content}</Text>
                        </div>
                        <div className={styles.voteCount}>
                          <Text weight="bold">{note.votes}</Text>
                          <Text size="xs" color="soft">votes</Text>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - Info Cards */}
              <div className={styles.whiteboardSidebar}>
                {/* Quick Stats Card */}
                <div className={styles.actionsCard}>
                  <Heading level={3} size={5}>Session Stats</Heading>
                  <div className={styles.whiteboardStats}>
                    <div className={styles.whiteboardStatItem}>
                      <Text size="lg" weight="bold">{stickyNotes.length}</Text>
                      <Text size="xs" color="soft">Total Notes</Text>
                    </div>
                    <div className={styles.whiteboardStatItem}>
                      <Text size="lg" weight="bold">{totalVotes}</Text>
                      <Text size="xs" color="soft">Total Votes</Text>
                    </div>
                    <div className={styles.whiteboardStatItem}>
                      <Text size="lg" weight="bold">{topic.collaborators.length}</Text>
                      <Text size="xs" color="soft">Contributors</Text>
                    </div>
                    <div className={styles.whiteboardStatItem}>
                      <Text size="lg" weight="bold">{topic.sections?.length || 0}</Text>
                      <Text size="xs" color="soft">Sections</Text>
                    </div>
                  </div>
                </div>

                {/* Active Collaborators */}
                <div className={styles.actionsCard}>
                  <div className={styles.sectionHeader}>
                    <Heading level={3} size={5}>Collaborators</Heading>
                    <IconButton variant="ghost" size="sm" icon={<AddIcon />} aria-label="Invite" />
                  </div>
                  <div className={styles.collaboratorsList}>
                    {topic.collaborators.map(collaborator => (
                      <div key={collaborator.id} className={styles.collaboratorItem}>
                        <div className={styles.collaboratorInfo}>
                          <div style={{ position: 'relative' }}>
                            <Avatar fallback={collaborator.name} src={collaborator.avatar} size="sm" />
                            {collaborator.online && (
                              <div
                                className={styles.cursorColorDot}
                                style={{ backgroundColor: collaborator.color }}
                              />
                            )}
                          </div>
                          <div>
                            <Text size="sm" weight="medium">{collaborator.name}</Text>
                            <Text size="xs" color="soft">
                              {collaborator.online ? 'Active now' : `Last active ${collaborator.lastActive?.toLocaleDateString()}`}
                            </Text>
                          </div>
                        </div>
                        {collaborator.online && <div className={styles.onlineIndicator} />}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className={styles.actionButtons}>
                  <Button variant="primary" icon={<ChatIcon />}>Chat about this board</Button>
                  <Button variant="default" icon={<ShareIcon />}>Share</Button>
                  <Button variant="ghost" icon={<ChatIcon />}>Discuss</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className={styles.allNotesView}>
            <div className={styles.notesViewHeader}>
              <Text weight="semibold">{stickyNotes.length} notes</Text>
              <div className={styles.sortButtons}>
                <Button
                  variant={sortBy === 'votes' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSortBy('votes')}
                >
                  By Votes
                </Button>
                <Button
                  variant={sortBy === 'recent' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSortBy('recent')}
                >
                  Recent
                </Button>
              </div>
            </div>
            <div className={styles.notesGrid}>
              {sortedNotes.map(note => (
                <div
                  key={note.id}
                  className={styles.noteCard}
                  style={{ backgroundColor: getStickyColor(note.color) }}
                >
                  <Text className={styles.noteContent} color="inherit">{note.content}</Text>
                  <div className={styles.noteFooter}>
                    <Text size="xs" color="inherit">{note.createdBy}</Text>
                    <div className={styles.noteVotes}>
                      <span className={styles.voteIcon}>▲</span>
                      <Text size="sm" weight="bold" color="inherit">{note.votes || 0}</Text>
                    </div>
                  </div>
                </div>
              ))}
              <button className={styles.addNoteButton}>
                <AddIcon />
                <Text size="sm">Add Note</Text>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'sections' && topic.sections && (
          <div className={styles.sectionsView}>
            {topic.sections.map(section => {
              const sectionNotes = getNotesForSection(section.id);
              const sectionVotes = sectionNotes.reduce((sum, n) => sum + (n.votes || 0), 0);

              return (
                <div key={section.id} className={styles.sectionCard}>
                  <div
                    className={styles.sectionHeader}
                    style={{ backgroundColor: section.color }}
                  >
                    <div>
                      <Text weight="semibold" color="inherit">{section.title}</Text>
                      {section.description && <Text size="sm" color="inherit">{section.description}</Text>}
                    </div>
                    <div className={styles.sectionStats}>
                      <Chip size="sm" variant="default">{sectionNotes.length} notes</Chip>
                      <Chip size="sm" variant="default">{sectionVotes} votes</Chip>
                    </div>
                  </div>
                  <div className={styles.sectionNotes}>
                    {sectionNotes.slice(0, 3).map(note => (
                      <div
                        key={note.id}
                        className={styles.miniNoteCard}
                        style={{ backgroundColor: getStickyColor(note.color) }}
                      >
                        <Text size="sm" color="inherit">{note.content}</Text>
                        <Text size="xs" color="inherit">{note.votes} votes</Text>
                      </div>
                    ))}
                    {sectionNotes.length > 3 && (
                      <Text size="sm" color="soft">+{sectionNotes.length - 3} more</Text>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className={styles.activityFeed}>
            {[...stickyNotes]
              .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
              .slice(0, 10)
              .map(note => (
                <div key={note.id} className={styles.activityItem}>
                  <Avatar fallback={note.createdBy} size="sm" />
                  <div className={styles.activityContent}>
                    <Text size="sm">
                      <strong>{note.createdBy}</strong> added a note
                    </Text>
                    <div
                      className={styles.activityNotePreview}
                      style={{ backgroundColor: getStickyColor(note.color) }}
                    >
                      <Text size="sm" color="inherit">{note.content}</Text>
                    </div>
                    <Text size="xs" color="soft">
                      {note.createdAt.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </Text>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
