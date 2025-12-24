import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  Avatar,
  AvatarGroup,
  Button,
  Chip,
  Divider,
  Heading,
  IconButton,
  Input,
  Panel,
  Progress,
  Stack,
  Tabs,
  Text,
  Tooltip,
} from '@ui-kit/react';
import { AddIcon } from '@ui-kit/icons/AddIcon';
import { ChatIcon } from '@ui-kit/icons/ChatIcon';
import { ChevronDownIcon } from '@ui-kit/icons/ChevronDownIcon';
import { CloseIcon } from '@ui-kit/icons/CloseIcon';
import { DownloadIcon } from '@ui-kit/icons/DownloadIcon';
import { EditIcon } from '@ui-kit/icons/EditIcon';
import { ExpandIcon } from '@ui-kit/icons/ExpandIcon';
import { FileIcon } from '@ui-kit/icons/FileIcon';
import { GearIcon } from '@ui-kit/icons/GearIcon';
import { LinkIcon } from '@ui-kit/icons/LinkIcon';
import { MaximizeIcon } from '@ui-kit/icons/MaximizeIcon';
import { MinimizeIcon } from '@ui-kit/icons/MinimizeIcon';
import { PlayIcon } from '@ui-kit/icons/PlayIcon';
import { RefreshIcon } from '@ui-kit/icons/RefreshIcon';
import { RemoveIcon } from '@ui-kit/icons/RemoveIcon';
import { SearchIcon } from '@ui-kit/icons/SearchIcon';
import { ShareIcon } from '@ui-kit/icons/ShareIcon';
import { StarIcon } from '@ui-kit/icons/StarIcon';
import { TrashIcon } from '@ui-kit/icons/TrashIcon';
import { UsersIcon } from '@ui-kit/icons/UsersIcon';
import { ZoomInIcon } from '@ui-kit/icons/ZoomInIcon';
import { ZoomOutIcon } from '@ui-kit/icons/ZoomOutIcon';
import styles from './MindMap.module.css';

/**
 * # Collaborative Mind Mapping
 *
 * A revolutionary visual brainstorming tool combining multi-user collaboration
 * with AI-powered insights for enhanced creative ideation sessions.
 *
 * ## Key Features
 * - **Real-time Collaboration**: Multiple users editing simultaneously with live cursors
 * - **AI-Powered Insights**: Concept expansion, pattern recognition, gap analysis
 * - **Infinite Canvas**: Zoom/pan with rich media support
 * - **Smart Clustering**: Auto-detection of themes and relationships
 *
 * ## Components Used
 * - **Canvas**: Custom SVG-based node graph rendering
 * - **Toolbar**: Quick actions for node operations
 * - **Sidebar**: AI insights, themes, and participant management
 * - **Presence**: Real-time user cursors and avatars
 */

// Sample data for mind map nodes
const sampleNodes = [
  { id: 'central', label: 'Product Launch', x: 0, y: 0, type: 'central' },
  { id: 'marketing', label: 'Marketing', x: -200, y: -100, type: 'primary' },
  { id: 'features', label: 'Key Features', x: 200, y: -100, type: 'primary' },
  { id: 'timeline', label: 'Timeline', x: 0, y: 150, type: 'primary' },
  { id: 'social', label: 'Social Media', x: -280, y: -180, type: 'secondary' },
  { id: 'email', label: 'Email Campaign', x: -280, y: -60, type: 'secondary' },
  { id: 'influencers', label: 'Influencer Outreach', x: -120, y: -180, type: 'secondary' },
  { id: 'performance', label: 'Performance', x: 280, y: -180, type: 'secondary' },
  { id: 'ux', label: 'User Experience', x: 280, y: -60, type: 'secondary' },
  { id: 'ai', label: 'AI Integration', x: 120, y: -180, type: 'secondary' },
  { id: 'beta', label: 'Beta Launch', x: -80, y: 220, type: 'secondary' },
  { id: 'ga', label: 'General Availability', x: 80, y: 220, type: 'secondary' },
  // AI suggested nodes
  { id: 'pr', label: 'Press Release', x: -360, y: -120, type: 'ai-suggested' },
  { id: 'analytics', label: 'Analytics Dashboard', x: 360, y: -120, type: 'ai-suggested' },
];

const sampleConnections = [
  { from: 'central', to: 'marketing' },
  { from: 'central', to: 'features' },
  { from: 'central', to: 'timeline' },
  { from: 'marketing', to: 'social' },
  { from: 'marketing', to: 'email' },
  { from: 'marketing', to: 'influencers' },
  { from: 'features', to: 'performance' },
  { from: 'features', to: 'ux' },
  { from: 'features', to: 'ai' },
  { from: 'timeline', to: 'beta' },
  { from: 'timeline', to: 'ga' },
  { from: 'marketing', to: 'pr', isAi: true },
  { from: 'features', to: 'analytics', isAi: true },
];

const sampleUsers = [
  { id: 'u1', name: 'Sarah J.', color: '#3B82F6', x: 150, y: 80 },
  { id: 'u2', name: 'Mike T.', color: '#10B981', x: -100, y: -50 },
  { id: 'u3', name: 'Alex K.', color: '#F59E0B', x: 50, y: 180 },
];

// Helper to get node position
const getNodeById = (id: string) => sampleNodes.find((n) => n.id === id);

// Basic Canvas Component
function MindMapCanvas({
  showAiSuggestions = true,
  showCursors = true,
  selectedNode = null as string | null,
}) {
  return (
    <div className={styles.canvas}>
      <div className={styles.canvasGrid} />

      {/* SVG Connections */}
      <svg className={styles.connections} viewBox="-500 -300 1000 600" preserveAspectRatio="xMidYMid meet">
        {sampleConnections
          .filter((c) => showAiSuggestions || !c.isAi)
          .map((conn) => {
            const from = getNodeById(conn.from);
            const to = getNodeById(conn.to);
            if (!from || !to) return null;

            const midX = (from.x + to.x) / 2;
            const midY = (from.y + to.y) / 2;
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const ctrlOffset = Math.min(Math.abs(dx), Math.abs(dy)) * 0.3;

            return (
              <path
                key={`${conn.from}-${conn.to}`}
                d={`M ${from.x} ${from.y} Q ${midX} ${midY - ctrlOffset} ${to.x} ${to.y}`}
                stroke={conn.isAi ? '#a855f7' : '#9ca3af'}
                strokeWidth={2}
                strokeDasharray={conn.isAi ? '5 5' : undefined}
                fill="none"
              />
            );
          })}
      </svg>

      {/* Nodes */}
      <div className={styles.nodeGroup}>
        {sampleNodes
          .filter((n) => showAiSuggestions || n.type !== 'ai-suggested')
          .map((node) => (
            <div
              key={node.id}
              className={`${styles.node} ${
                node.type === 'central'
                  ? styles.nodeCentral
                  : node.type === 'secondary'
                    ? styles.nodeSecondary
                    : node.type === 'ai-suggested'
                      ? styles.nodeAiSuggested
                      : ''
              } ${selectedNode === node.id ? styles.nodeSelected : ''}`}
              style={{
                left: node.x,
                top: node.y,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <span className={styles.nodeLabel}>{node.label}</span>
            </div>
          ))}
      </div>

      {/* User Cursors */}
      {showCursors &&
        sampleUsers.map((user) => (
          <div
            key={user.id}
            className={styles.userCursor}
            style={{ left: `calc(50% + ${user.x}px)`, top: `calc(50% + ${user.y}px)` }}
          >
            <div className={styles.cursorPointer} style={{ background: user.color }} />
            <div className={styles.cursorLabel} style={{ background: user.color }}>
              {user.name}
            </div>
          </div>
        ))}
    </div>
  );
}

// AI Insights Panel Component
function AiInsightsPanel() {
  return (
    <div className={styles.sidebarSection}>
      <div className={styles.sidebarSectionTitle}>
        <StarIcon size={14} />
        AI Insights
      </div>

      <div className={styles.aiInsight}>
        <div className={styles.aiInsightHeader}>
          <LinkIcon size={14} className={styles.aiInsightIcon} />
          <span className={styles.aiInsightTitle}>Missing Connection</span>
        </div>
        <p className={styles.aiInsightDescription}>
          Consider linking "Email Campaign" to "Analytics Dashboard" for tracking campaign
          performance.
        </p>
      </div>

      <div className={styles.aiInsight}>
        <div className={styles.aiInsightHeader}>
          <ExpandIcon size={14} className={styles.aiInsightIcon} />
          <span className={styles.aiInsightTitle}>Concept Expansion</span>
        </div>
        <p className={styles.aiInsightDescription}>
          "Social Media" could branch into specific platforms: Twitter, LinkedIn, Instagram.
        </p>
      </div>

      <div className={styles.aiInsight}>
        <div className={styles.aiInsightHeader}>
          <SearchIcon size={14} className={styles.aiInsightIcon} />
          <span className={styles.aiInsightTitle}>Gap Analysis</span>
        </div>
        <p className={styles.aiInsightDescription}>
          No budget or resource allocation nodes detected. Consider adding financial planning.
        </p>
      </div>
    </div>
  );
}

// Themes/Clusters Panel Component
function ThemesPanel() {
  return (
    <div className={styles.sidebarSection}>
      <div className={styles.sidebarSectionTitle}>
        <FileIcon size={14} />
        Detected Themes
      </div>

      <div className={styles.clusterCard}>
        <div className={styles.clusterHeader}>
          <span className={styles.clusterName}>Go-to-Market</span>
          <span className={styles.clusterCount}>5 ideas</span>
        </div>
        <div className={styles.clusterTags}>
          <Chip size="sm" variant="default">
            Marketing
          </Chip>
          <Chip size="sm" variant="default">
            Social Media
          </Chip>
          <Chip size="sm" variant="default">
            Email
          </Chip>
        </div>
      </div>

      <div className={styles.clusterCard}>
        <div className={styles.clusterHeader}>
          <span className={styles.clusterName}>Product</span>
          <span className={styles.clusterCount}>4 ideas</span>
        </div>
        <div className={styles.clusterTags}>
          <Chip size="sm" variant="default">
            Features
          </Chip>
          <Chip size="sm" variant="default">
            UX
          </Chip>
          <Chip size="sm" variant="default">
            AI
          </Chip>
        </div>
      </div>

      <div className={styles.clusterCard}>
        <div className={styles.clusterHeader}>
          <span className={styles.clusterName}>Timeline</span>
          <span className={styles.clusterCount}>3 ideas</span>
        </div>
        <div className={styles.clusterTags}>
          <Chip size="sm" variant="default">
            Beta
          </Chip>
          <Chip size="sm" variant="default">
            GA
          </Chip>
        </div>
      </div>
    </div>
  );
}

// Basic Mind Map Page
function BasicMindMap() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Product Launch Brainstorm</h1>
          <Chip variant="success" size="sm">
            Active
          </Chip>
        </div>
        <div className={styles.headerActions}>
          <Button variant="ghost" size="sm" icon={<ShareIcon />}>
            Share
          </Button>
          <Button variant="ghost" size="sm" icon={<DownloadIcon />}>
            Export
          </Button>
        </div>
      </div>

      <div className={styles.canvasArea}>
        <MindMapCanvas showAiSuggestions={false} showCursors={false} />

        {/* Zoom Controls */}
        <div className={styles.zoomControls}>
          <IconButton icon={<ZoomInIcon />} size="sm" variant="default" />
          <IconButton icon={<ZoomOutIcon />} size="sm" variant="default" />
          <IconButton icon={<MaximizeIcon />} size="sm" variant="default" />
        </div>

        {/* Floating Toolbar */}
        <div className={`${styles.toolbar} ${styles.toolbarFloating}`}>
          <Tooltip content="Add Node">
            <IconButton icon={<AddIcon />} size="sm" variant="primary" />
          </Tooltip>
          <Divider orientation="vertical" style={{ height: 24 }} />
          <Tooltip content="Connect">
            <IconButton icon={<LinkIcon />} size="sm" variant="ghost" />
          </Tooltip>
          <Tooltip content="Edit">
            <IconButton icon={<EditIcon />} size="sm" variant="ghost" />
          </Tooltip>
          <Tooltip content="Delete">
            <IconButton icon={<TrashIcon />} size="sm" variant="ghost" />
          </Tooltip>
          <Divider orientation="vertical" style={{ height: 24 }} />
          <Tooltip content="AI Assist">
            <IconButton icon={<StarIcon />} size="sm" variant="ghost" />
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

// Collaborative Session View
function CollaborativeMindMap() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Q1 Strategy Planning</h1>
          <Chip variant="info" size="sm">
            Collaborative
          </Chip>
        </div>

        <div className={styles.presenceBar}>
          <AvatarGroup max={4}>
            <Avatar size="sm" fallback="SJ" style={{ background: '#3B82F6' }} />
            <Avatar size="sm" fallback="MT" style={{ background: '#10B981' }} />
            <Avatar size="sm" fallback="AK" style={{ background: '#F59E0B' }} />
            <Avatar size="sm" fallback="LR" style={{ background: '#8B5CF6' }} />
            <Avatar size="sm" fallback="JD" style={{ background: '#EC4899' }} />
          </AvatarGroup>
          <span className={styles.presenceCount}>5 collaborating</span>
        </div>

        <div className={styles.headerActions}>
          <Button variant="ghost" size="sm" icon={<UsersIcon />}>
            Invite
          </Button>
          <Button variant="ghost" size="sm" icon={<ShareIcon />}>
            Share
          </Button>
        </div>
      </div>

      {/* Session Info Bar */}
      <div className={styles.sessionInfo}>
        <div className={styles.sessionTimer}>
          <PlayIcon size={14} />
          <span>Session: 23:45</span>
        </div>
        <Chip variant="success" size="sm">
          14 ideas generated
        </Chip>
        <div className={styles.sessionParticipants}>
          <Text size="sm" color="soft">
            Sarah is editing "Marketing"
          </Text>
        </div>
      </div>

      <div className={styles.canvasArea}>
        <MindMapCanvas showAiSuggestions={false} showCursors={true} />

        <div className={styles.zoomControls}>
          <IconButton icon={<ZoomInIcon />} size="sm" variant="default" />
          <IconButton icon={<ZoomOutIcon />} size="sm" variant="default" />
          <IconButton icon={<MaximizeIcon />} size="sm" variant="default" />
        </div>

        {/* Mini Map */}
        <div className={styles.miniMap}>
          <div
            className={styles.miniMapViewport}
            style={{ width: 60, height: 40, left: 45, top: 30 }}
          />
          {sampleNodes.slice(0, 6).map((node, i) => (
            <div
              key={node.id}
              className={styles.miniMapNode}
              style={{
                left: 75 + node.x * 0.1,
                top: 50 + node.y * 0.1,
              }}
            />
          ))}
        </div>

        <div className={`${styles.toolbar} ${styles.toolbarFloating}`}>
          <Tooltip content="Add Node">
            <IconButton icon={<AddIcon />} size="sm" variant="primary" />
          </Tooltip>
          <Divider orientation="vertical" style={{ height: 24 }} />
          <Tooltip content="Connect">
            <IconButton icon={<LinkIcon />} size="sm" variant="ghost" />
          </Tooltip>
          <Tooltip content="Edit">
            <IconButton icon={<EditIcon />} size="sm" variant="ghost" />
          </Tooltip>
          <Tooltip content="Delete">
            <IconButton icon={<TrashIcon />} size="sm" variant="ghost" />
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

// AI-Powered Insights View
function AiInsightsMindMap() {
  const [activeTab, setActiveTab] = useState('insights');

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Innovation Workshop</h1>
          <Chip variant="info" size="sm">
            AI-Enhanced
          </Chip>
        </div>

        <div className={styles.presenceBar}>
          <AvatarGroup max={3}>
            <Avatar size="sm" fallback="SJ" style={{ background: '#3B82F6' }} />
            <Avatar size="sm" fallback="MT" style={{ background: '#10B981' }} />
            <Avatar size="sm" fallback="AK" style={{ background: '#F59E0B' }} />
          </AvatarGroup>
          <span className={styles.presenceCount}>3 collaborating</span>
        </div>

        <div className={styles.headerActions}>
          <Button variant="primary" size="sm" icon={<StarIcon />}>
            AI Suggest
          </Button>
          <Button variant="ghost" size="sm" icon={<ShareIcon />}>
            Share
          </Button>
        </div>
      </div>

      <div className={styles.mainLayout}>
        <div className={styles.canvasArea}>
          <MindMapCanvas showAiSuggestions={true} showCursors={true} />

          <div className={styles.zoomControls}>
            <IconButton icon={<ZoomInIcon />} size="sm" variant="default" />
            <IconButton icon={<ZoomOutIcon />} size="sm" variant="default" />
            <IconButton icon={<MaximizeIcon />} size="sm" variant="default" />
          </div>

          <div className={`${styles.toolbar} ${styles.toolbarFloating}`}>
            <Tooltip content="Add Node">
              <IconButton icon={<AddIcon />} size="sm" variant="primary" />
            </Tooltip>
            <Divider orientation="vertical" style={{ height: 24 }} />
            <Tooltip content="Connect">
              <IconButton icon={<LinkIcon />} size="sm" variant="ghost" />
            </Tooltip>
            <Tooltip content="Edit">
              <IconButton icon={<EditIcon />} size="sm" variant="ghost" />
            </Tooltip>
            <Tooltip content="Delete">
              <IconButton icon={<TrashIcon />} size="sm" variant="ghost" />
            </Tooltip>
            <Divider orientation="vertical" style={{ height: 24 }} />
            <Tooltip content="AI Expand">
              <IconButton icon={<StarIcon />} size="sm" variant="ghost" />
            </Tooltip>
            <Tooltip content="Find Connections">
              <IconButton icon={<RefreshIcon />} size="sm" variant="ghost" />
            </Tooltip>
          </div>
        </div>

        {/* Sidebar */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <Tabs
              items={[
                { value: 'insights', label: 'AI Insights', content: null },
                { value: 'themes', label: 'Themes', content: null },
                { value: 'history', label: 'History', content: null },
              ]}
              value={activeTab}
              onChange={setActiveTab}
              variant="underline"
            />
          </div>

          <div className={styles.sidebarContent}>
            {activeTab === 'insights' && <AiInsightsPanel />}
            {activeTab === 'themes' && <ThemesPanel />}
            {activeTab === 'history' && (
              <div className={styles.sidebarSection}>
                <Text size="sm" color="soft">
                  Recent changes will appear here...
                </Text>
              </div>
            )}
          </div>

          {/* AI Chat at bottom */}
          <div className={styles.aiChat}>
            <div className={styles.aiChatHeader}>
              <ChatIcon size={16} />
              <span className={styles.aiChatTitle}>AI Facilitator</span>
            </div>
            <p className={styles.aiChatMessage}>
              I noticed the "Marketing" branch has strong momentum. Would you like me to suggest
              additional tactics based on your industry?
            </p>
            <div className={styles.aiChatActions}>
              <Button size="sm" variant="primary">
                Yes, suggest
              </Button>
              <Button size="sm" variant="ghost">
                Not now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Full Featured Mind Map with all capabilities
function FullFeaturedMindMap() {
  const [activeTab, setActiveTab] = useState('insights');

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Annual Planning 2025</h1>
          <Chip variant="success" size="sm">
            Live Session
          </Chip>
        </div>

        <div className={styles.presenceBar}>
          <AvatarGroup max={4}>
            <Avatar size="sm" fallback="SJ" style={{ background: '#3B82F6' }} />
            <Avatar size="sm" fallback="MT" style={{ background: '#10B981' }} />
            <Avatar size="sm" fallback="AK" style={{ background: '#F59E0B' }} />
            <Avatar size="sm" fallback="LR" style={{ background: '#8B5CF6' }} />
          </AvatarGroup>
          <span className={styles.presenceCount}>4 collaborating</span>
        </div>

        <div className={styles.headerActions}>
          <Button variant="ghost" size="sm" icon={<UsersIcon />}>
            Invite
          </Button>
          <Button variant="primary" size="sm" icon={<StarIcon />}>
            AI Assist
          </Button>
          <IconButton icon={<GearIcon />} size="sm" variant="ghost" />
        </div>
      </div>

      {/* Session Info Bar */}
      <div className={styles.sessionInfo}>
        <div className={styles.sessionTimer}>
          <PlayIcon size={14} />
          <span>Session: 45:23</span>
        </div>

        <div className={styles.energyIndicator}>
          <span className={styles.energyLabel}>Energy</span>
          <div className={styles.energyBar}>
            <div className={styles.energyFill} style={{ width: '72%' }} />
          </div>
        </div>

        <Chip variant="info" size="sm">
          <StarIcon size={12} /> 6 AI suggestions
        </Chip>

        <div className={styles.sessionParticipants}>
          <Text size="sm" color="soft">
            All participants active
          </Text>
        </div>
      </div>

      <div className={styles.mainLayout}>
        <div className={styles.canvasArea}>
          <MindMapCanvas showAiSuggestions={true} showCursors={true} selectedNode="marketing" />

          <div className={styles.zoomControls}>
            <IconButton icon={<ZoomInIcon />} size="sm" variant="default" />
            <IconButton icon={<ZoomOutIcon />} size="sm" variant="default" />
            <IconButton icon={<MaximizeIcon />} size="sm" variant="default" />
          </div>

          <div className={styles.miniMap}>
            <div
              className={styles.miniMapViewport}
              style={{ width: 60, height: 40, left: 45, top: 30 }}
            />
            {sampleNodes.slice(0, 8).map((node) => (
              <div
                key={node.id}
                className={styles.miniMapNode}
                style={{
                  left: 75 + node.x * 0.1,
                  top: 50 + node.y * 0.1,
                }}
              />
            ))}
          </div>

          <div className={`${styles.toolbar} ${styles.toolbarFloating}`}>
            <Tooltip content="Add Node (N)">
              <IconButton icon={<AddIcon />} size="sm" variant="primary" />
            </Tooltip>
            <Divider orientation="vertical" style={{ height: 24 }} />
            <Tooltip content="Connect (C)">
              <IconButton icon={<LinkIcon />} size="sm" variant="ghost" />
            </Tooltip>
            <Tooltip content="Edit (E)">
              <IconButton icon={<EditIcon />} size="sm" variant="ghost" />
            </Tooltip>
            <Tooltip content="Delete (Del)">
              <IconButton icon={<TrashIcon />} size="sm" variant="ghost" />
            </Tooltip>
            <Divider orientation="vertical" style={{ height: 24 }} />
            <Tooltip content="AI Expand">
              <IconButton icon={<StarIcon />} size="sm" variant="ghost" />
            </Tooltip>
            <Tooltip content="Find Patterns">
              <IconButton icon={<SearchIcon />} size="sm" variant="ghost" />
            </Tooltip>
            <Tooltip content="Refresh Suggestions">
              <IconButton icon={<RefreshIcon />} size="sm" variant="ghost" />
            </Tooltip>
          </div>
        </div>

        {/* Sidebar */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <Tabs
              items={[
                { value: 'insights', label: 'AI Insights', content: null },
                { value: 'themes', label: 'Themes', content: null },
                { value: 'stats', label: 'Stats', content: null },
              ]}
              value={activeTab}
              onChange={setActiveTab}
              variant="underline"
            />
          </div>

          <div className={styles.sidebarContent}>
            {/* Quick Add */}
            <div className={styles.quickAdd}>
              <AddIcon size={16} />
              <input
                type="text"
                placeholder="Quick add idea..."
                className={styles.quickAddInput}
              />
            </div>

            {activeTab === 'insights' && <AiInsightsPanel />}
            {activeTab === 'themes' && <ThemesPanel />}
            {activeTab === 'stats' && (
              <div className={styles.sidebarSection}>
                <div className={styles.sidebarSectionTitle}>Session Statistics</div>
                <div className={styles.collabStats}>
                  <div className={styles.statCard}>
                    <div className={styles.statValue}>14</div>
                    <div className={styles.statLabel}>Ideas</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statValue}>3</div>
                    <div className={styles.statLabel}>Themes</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statValue}>89%</div>
                    <div className={styles.statLabel}>Engagement</div>
                  </div>
                </div>

                <div style={{ marginTop: 'var(--spacing)' }}>
                  <Text size="sm" weight="medium" style={{ marginBottom: 4 }}>
                    Participation Balance
                  </Text>
                  <Progress value={78} size="sm" />
                  <Text size="xs" color="soft" style={{ marginTop: 4 }}>
                    All participants contributing evenly
                  </Text>
                </div>

                <div style={{ marginTop: 'var(--spacing)' }}>
                  <Text size="sm" weight="medium" style={{ marginBottom: 4 }}>
                    AI Suggestion Adoption
                  </Text>
                  <Progress value={45} size="sm" variant="info" />
                  <Text size="xs" color="soft" style={{ marginTop: 4 }}>
                    3 of 6 suggestions accepted
                  </Text>
                </div>
              </div>
            )}
          </div>

          {/* AI Chat */}
          <div className={styles.aiChat}>
            <div className={styles.aiChatHeader}>
              <ChatIcon size={16} />
              <span className={styles.aiChatTitle}>AI Facilitator</span>
            </div>
            <p className={styles.aiChatMessage}>
              Great progress! I detected potential groupthink around "Social Media" ideas. Consider
              exploring alternative marketing channels for diversification.
            </p>
            <div className={styles.aiChatActions}>
              <Button size="sm" variant="primary">
                Show alternatives
              </Button>
              <Button size="sm" variant="ghost">
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Empty State
function EmptyMindMap() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>New Mind Map</h1>
        </div>
        <div className={styles.headerActions}>
          <Button variant="ghost" size="sm" icon={<ShareIcon />}>
            Share
          </Button>
        </div>
      </div>

      <div className={styles.canvasArea}>
        <div className={styles.canvasGrid} />

        <div className={styles.emptyCanvas}>
          <div className={styles.emptyCanvasIcon}>
            <StarIcon size={64} />
          </div>
          <h2 className={styles.emptyCanvasTitle}>Start Your Mind Map</h2>
          <p className={styles.emptyCanvasDescription}>
            Click anywhere on the canvas to add your first idea, or let AI help you get started
            with intelligent suggestions based on your topic.
          </p>
          <Stack direction="horizontal" gap="sm" justify="center">
            <Button variant="primary" icon={<AddIcon />}>
              Add First Idea
            </Button>
            <Button variant="default" icon={<StarIcon />}>
              AI Kickstart
            </Button>
          </Stack>
        </div>

        <div className={styles.zoomControls}>
          <IconButton icon={<ZoomInIcon />} size="sm" variant="default" disabled />
          <IconButton icon={<ZoomOutIcon />} size="sm" variant="default" disabled />
          <IconButton icon={<MaximizeIcon />} size="sm" variant="default" />
        </div>
      </div>
    </div>
  );
}

const meta: Meta = {
  title: 'Example Pages/Mind Map',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
## Collaborative Mind Mapping with Real-time AI Insights

A revolutionary visual brainstorming tool that combines multi-user collaborative
mind mapping with AI-powered insights to dramatically enhance creative ideation
sessions and strategic planning.

### Core Capabilities

#### Real-time Collaborative Canvas
- **Multi-user simultaneous editing** with live cursors and user presence indicators
- **Infinite canvas** with zoom and pan capabilities for large idea maps
- **Rich media support** including text, images, links, and embedded content

#### AI-Powered Insight Engine
- **Concept expansion** - AI suggests related ideas, themes, and connections
- **Pattern recognition** - Identifies emerging themes and clusters automatically
- **Gap analysis** - Identifies missing perspectives or unexplored areas
- **Bias detection** - Alerts when groupthink or anchoring bias is detected

### Components Demonstrated

| Component | Purpose |
|-----------|---------|
| \`Avatar\`, \`AvatarGroup\` | User presence and collaboration indicators |
| \`Button\`, \`IconButton\` | Actions and toolbar controls |
| \`Chip\` | Status indicators, tags, themes |
| \`Tabs\` | Sidebar navigation between panels |
| \`Tooltip\` | Contextual help for toolbar actions |
| \`Progress\` | Session statistics and completion metrics |
| \`Panel\` | Content containers for insights |
| \`Stack\` | Flexible layouts throughout |

### Design Patterns Used

1. **Floating Toolbar** - Contextual actions that follow user focus
2. **Sidebar Panels** - Secondary information and AI insights
3. **Mini Map** - Navigation aid for large canvases
4. **Presence Indicators** - Real-time collaboration awareness
5. **AI Integration** - Suggested nodes with dashed borders
        `,
      },
    },
  },
};

export default meta;

type Story = StoryObj;

export const Basic: Story = {
  render: () => <BasicMindMap />,
  parameters: {
    docs: {
      description: {
        story:
          'Basic mind map canvas with nodes, connections, and essential toolbar. Suitable for individual brainstorming sessions.',
      },
    },
  },
};

export const Collaborative: Story = {
  render: () => <CollaborativeMindMap />,
  parameters: {
    docs: {
      description: {
        story:
          'Collaborative session view with multiple user cursors, presence indicators, session timer, and mini-map navigation.',
      },
    },
  },
};

export const WithAIInsights: Story = {
  render: () => <AiInsightsMindMap />,
  parameters: {
    docs: {
      description: {
        story:
          'AI-enhanced mind mapping with insight sidebar, suggested nodes (dashed borders), theme detection, and AI facilitator chat.',
      },
    },
  },
};

export const FullFeatured: Story = {
  render: () => <FullFeaturedMindMap />,
  parameters: {
    docs: {
      description: {
        story:
          'Complete mind mapping experience with all features: collaboration, AI insights, statistics, energy tracking, and participation metrics.',
      },
    },
  },
};

export const Empty: Story = {
  render: () => <EmptyMindMap />,
  parameters: {
    docs: {
      description: {
        story:
          'Empty state for new mind maps with helpful onboarding and AI kickstart option.',
      },
    },
  },
};
