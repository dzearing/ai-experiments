import type { Meta, StoryObj } from '@storybook/react';
import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Button,
  Chip,
  Heading,
  IconButton,
  List,
  ListItem,
  RotatingCarousel,
  SearchInput,
  Segmented,
  Text,
  TreeView,
  type TreeNode,
} from '@ui-kit/react';
import {
  injectSurfaceStyles,
  getSurfaceClassName,
  getRandomSurfaceName,
} from '@ui-kit/core';
import { AddIcon } from '@ui-kit/icons/AddIcon';
import { ArrowRightIcon } from '@ui-kit/icons/ArrowRightIcon';
import { ChatIcon } from '@ui-kit/icons/ChatIcon';
import { CheckCircleIcon } from '@ui-kit/icons/CheckCircleIcon';
import { ChevronRightIcon } from '@ui-kit/icons/ChevronRightIcon';
import { ClockIcon } from '@ui-kit/icons/ClockIcon';
import { CloseIcon } from '@ui-kit/icons/CloseIcon';
import { CodeIcon } from '@ui-kit/icons/CodeIcon';
import { EditIcon } from '@ui-kit/icons/EditIcon';
import { FileIcon } from '@ui-kit/icons/FileIcon';
import { FilterIcon } from '@ui-kit/icons/FilterIcon';
import { FolderIcon } from '@ui-kit/icons/FolderIcon';
import { HomeIcon } from '@ui-kit/icons/HomeIcon';
import { IndentIcon } from '@ui-kit/icons/IndentIcon';
import { LinkIcon } from '@ui-kit/icons/LinkIcon';
import { ListViewIcon } from '@ui-kit/icons/ListViewIcon';
import { StarIcon } from '@ui-kit/icons/StarIcon';
import styles from './IdeateThings.module.css';

/**
 * # Ideate Things
 *
 * Contextual organization system for ideas. Things represent the context
 * in which ideas are created - projects, features, sub-features, repos,
 * books, homework, etc.
 *
 * ## Graph Model
 *
 * Things form a **graph**, not a strict tree:
 * - A thing can have **multiple parents** (e.g., a repo can be both personal and work)
 * - A thing can have **multiple children**
 * - The same node can appear in multiple hierarchies when viewed as a tree
 * - Roots are nodes without parents, or nodes matching the current filter
 *
 * ## Views
 *
 * - **Tree view**: Hierarchical navigation, same node may appear multiple places
 * - **Flat list**: All things matching filter, sorted by recent access or name
 */

// ============================================
// DATA TYPES
// ============================================

type ViewType = 'tree' | 'list';

interface Thing {
  id: string;
  name: string;
  description?: string;
  type: 'category' | 'project' | 'feature' | 'item';
  tags: string[];
  /** Multiple parents supported - graph model */
  parentIds: string[];
  /** Children computed from parentIds relationships */
  childIds?: string[];
  ideaCount?: {
    new: number;
    exploring: number;
    ready: number;
    archived: number;
  };
  lastAccessed?: Date;
}

// ============================================
// SAMPLE DATA (Flat graph structure)
// ============================================

const sampleThings: Thing[] = [
  // Root categories
  { id: 'work', name: 'Work Projects', type: 'category', tags: ['work'], parentIds: [], ideaCount: { new: 12, exploring: 8, ready: 5, archived: 3 } },
  { id: 'personal', name: 'Personal Projects', type: 'category', tags: ['personal'], parentIds: [], ideaCount: { new: 8, exploring: 5, ready: 2, archived: 4 } },

  // Work projects
  { id: 'claude-flow', name: 'claude-flow', description: 'Modern project management platform with AI-powered features', type: 'project', tags: ['react', 'typescript', 'github-repo', 'monorepo'], parentIds: ['work'], ideaCount: { new: 6, exploring: 4, ready: 2, archived: 1 } },
  { id: 'api-service', name: 'api-service', description: 'Backend API service for data management', type: 'project', tags: ['node', 'typescript', 'github-repo', 'api'], parentIds: ['work'], ideaCount: { new: 3, exploring: 2, ready: 2, archived: 1 } },
  { id: 'shared-utils', name: 'shared-utils', description: 'Shared utility functions and helpers', type: 'project', tags: ['typescript', 'github-repo', 'utilities'], parentIds: ['work', 'personal'], ideaCount: { new: 3, exploring: 2, ready: 1, archived: 1 } }, // Note: shared-utils has TWO parents!

  // claude-flow features
  { id: 'ui-kit', name: 'ui-kit package', description: 'Design system and component library', type: 'feature', tags: ['react', 'design-system', 'components'], parentIds: ['claude-flow'], ideaCount: { new: 3, exploring: 2, ready: 1, archived: 0 } },
  { id: 'v1-app', name: 'V1 Application', description: 'React + Express application', type: 'feature', tags: ['react', 'express', 'fullstack'], parentIds: ['claude-flow'], ideaCount: { new: 2, exploring: 1, ready: 1, archived: 1 } },
  { id: 'docs', name: 'Documentation', description: 'Project documentation and guides', type: 'feature', tags: ['docs', 'markdown'], parentIds: ['claude-flow'], ideaCount: { new: 1, exploring: 1, ready: 0, archived: 0 } },

  // ui-kit features
  { id: 'component-library', name: 'Component Library', description: 'Reusable React components with design tokens', type: 'feature', tags: ['react', 'components', 'storybook'], parentIds: ['ui-kit'], ideaCount: { new: 2, exploring: 1, ready: 1, archived: 0 } },
  { id: 'design-tokens', name: 'Design Tokens', description: 'CSS custom properties for theming', type: 'feature', tags: ['css', 'theming', 'tokens'], parentIds: ['ui-kit'], ideaCount: { new: 1, exploring: 1, ready: 0, archived: 0 } },

  // component-library items
  { id: 'button-component', name: 'Button component', description: 'Primary action button with multiple variants', type: 'item', tags: ['component', 'interactive'], parentIds: ['component-library'], ideaCount: { new: 1, exploring: 0, ready: 0, archived: 0 } },
  { id: 'card-component', name: 'Card component', description: 'Container for displaying content', type: 'item', tags: ['component', 'layout'], parentIds: ['component-library'], ideaCount: { new: 0, exploring: 1, ready: 0, archived: 0 } },

  // api-service features
  { id: 'auth-module', name: 'Authentication', description: 'User authentication and authorization', type: 'feature', tags: ['security', 'jwt', 'oauth'], parentIds: ['api-service'], ideaCount: { new: 2, exploring: 1, ready: 1, archived: 0 } },
  { id: 'data-layer', name: 'Data Layer', description: 'Database models and queries', type: 'feature', tags: ['database', 'postgres', 'orm'], parentIds: ['api-service'], ideaCount: { new: 1, exploring: 1, ready: 1, archived: 1 } },

  // Personal categories
  { id: 'books', name: 'Books', description: 'Books I am reading or writing', type: 'category', tags: ['reading', 'writing'], parentIds: ['personal'], ideaCount: { new: 3, exploring: 2, ready: 0, archived: 2 } },
  { id: 'learning', name: 'Learning', description: 'Courses and learning materials', type: 'category', tags: ['learning', 'education'], parentIds: ['personal'], ideaCount: { new: 3, exploring: 2, ready: 1, archived: 1 } },
  { id: 'side-projects', name: 'Side Projects', description: 'Personal coding projects', type: 'category', tags: ['coding', 'hobby'], parentIds: ['personal'], ideaCount: { new: 2, exploring: 1, ready: 1, archived: 1 } },

  // Book items
  { id: 'art-of-systems', name: 'The Art of Systems', description: 'Notes and ideas from reading this systems thinking book', type: 'item', tags: ['reading', 'non-fiction', 'systems-thinking'], parentIds: ['books'], ideaCount: { new: 2, exploring: 1, ready: 0, archived: 1 } },
  { id: 'design-patterns', name: 'Design Patterns', description: 'Classic software design patterns book', type: 'item', tags: ['reading', 'programming', 'patterns'], parentIds: ['books', 'learning'], ideaCount: { new: 1, exploring: 1, ready: 0, archived: 1 } }, // Note: in both Books AND Learning!

  // Learning items
  { id: 'typescript-course', name: 'TypeScript Deep Dive', description: 'Advanced TypeScript concepts and patterns', type: 'item', tags: ['learning', 'typescript', 'programming'], parentIds: ['learning'], ideaCount: { new: 2, exploring: 1, ready: 1, archived: 0 } },
  { id: 'rust-basics', name: 'Rust Fundamentals', description: 'Learning the Rust programming language', type: 'item', tags: ['learning', 'rust', 'programming'], parentIds: ['learning'], ideaCount: { new: 1, exploring: 1, ready: 0, archived: 1 } },

  // Side project items
  { id: 'recipe-app', name: 'Recipe Tracker', description: 'App for tracking and organizing recipes', type: 'project', tags: ['react-native', 'mobile', 'cooking'], parentIds: ['side-projects'], ideaCount: { new: 1, exploring: 1, ready: 0, archived: 0 } },
  { id: 'budget-tool', name: 'Budget Tool', description: 'Personal finance tracking tool', type: 'project', tags: ['finance', 'svelte', 'webapp'], parentIds: ['side-projects'], ideaCount: { new: 1, exploring: 0, ready: 1, archived: 1 } },
];

/** Recent things by ID */
const recentThingIds = ['component-library', 'claude-flow', 'typescript-course', 'api-service'];

// ============================================
// HELPER FUNCTIONS (Graph operations)
// ============================================

function getThingIcon(thing: Thing) {
  const isFolder = thing.type === 'category' || thing.type === 'project';
  return isFolder ? <FolderIcon className={styles.thingIcon} /> : <FileIcon className={styles.thingIcon} />;
}

/** Find a Thing by ID in flat list */
function getThingById(things: Thing[], id: string): Thing | undefined {
  return things.find(t => t.id === id);
}

/** Get all children of a thing (things that have this ID in their parentIds) */
function getChildren(things: Thing[], parentId: string): Thing[] {
  return things.filter(t => t.parentIds.includes(parentId));
}

/** Get all parents of a thing */
function getParents(things: Thing[], thing: Thing): Thing[] {
  return thing.parentIds.map(id => getThingById(things, id)).filter((t): t is Thing => t !== undefined);
}

/** Get root things (no parents) */
function getRoots(things: Thing[]): Thing[] {
  return things.filter(t => t.parentIds.length === 0);
}

/** Filter things by search query and/or tag */
function filterThings(things: Thing[], query: string, tagFilter?: string): Thing[] {
  const lowerQuery = query.toLowerCase();
  return things.filter(thing => {
    const matchesQuery = !query ||
      thing.name.toLowerCase().includes(lowerQuery) ||
      thing.tags.some(tag => tag.toLowerCase().includes(lowerQuery));
    const matchesTag = !tagFilter || thing.tags.includes(tagFilter);
    return matchesQuery && matchesTag;
  });
}

/** Collect all unique tags */
function collectAllTags(things: Thing[]): string[] {
  const tags = new Set<string>();
  things.forEach(t => t.tags.forEach(tag => tags.add(tag)));
  return Array.from(tags).sort();
}

/** Build tree structure from flat graph for TreeView */
interface TreeThingNode {
  thing: Thing;
  children: TreeThingNode[];
}

function buildTreeFromGraph(things: Thing[], rootIds?: string[]): TreeThingNode[] {
  const roots = rootIds
    ? rootIds.map(id => getThingById(things, id)).filter((t): t is Thing => t !== undefined)
    : getRoots(things);

  const buildNode = (thing: Thing, visited: Set<string>): TreeThingNode | null => {
    // Prevent infinite loops in cyclic graphs
    if (visited.has(thing.id)) return null;
    visited.add(thing.id);

    const children = getChildren(things, thing.id);
    const childNodes = children
      .map(child => buildNode(child, new Set(visited)))
      .filter((n): n is TreeThingNode => n !== null);

    return { thing, children: childNodes };
  };

  return roots
    .map(root => buildNode(root, new Set()))
    .filter((n): n is TreeThingNode => n !== null);
}

/** Convert TreeThingNode[] to TreeNode[] for TreeView component */
function treeThingNodesToTreeNodes(nodes: TreeThingNode[]): TreeNode[] {
  return nodes.map((node): TreeNode => {
    const { thing } = node;
    const totalIdeas = thing.ideaCount
      ? thing.ideaCount.new + thing.ideaCount.exploring + thing.ideaCount.ready
      : 0;

    return {
      id: thing.id,
      type: thing.type === 'category' || thing.type === 'project' ? 'folder' : 'file',
      label: (
        <div className={styles.treeNodeLabel}>
          <span className={styles.thingName}>{thing.name}</span>
          {thing.tags.length > 0 && (
            <span className={styles.tagPreview}>
              {thing.tags.slice(0, 2).map(tag => (
                <span key={tag} className={styles.miniTag}>#{tag}</span>
              ))}
              {thing.tags.length > 2 && (
                <span className={styles.moreTag}>+{thing.tags.length - 2}</span>
              )}
            </span>
          )}
          {totalIdeas > 0 && (
            <span className={styles.ideaCountBadge}>{totalIdeas}</span>
          )}
        </div>
      ),
      children: node.children.length > 0 ? treeThingNodesToTreeNodes(node.children) : undefined,
      data: thing,
    };
  });
}

// ============================================
// ONBOARDING EMPTY STATES
// ============================================

type EmptyStateVariant = 'minimal' | 'welcome' | 'quickstart' | 'examples' | 'chat-first';

interface OnboardingProps {
  onCreateThing?: () => void;
  onImportFromGit?: () => void;
  onStartChat?: () => void;
  onSkip?: () => void;
}

/** Minimal empty state - just a prompt to create */
function EmptyStateMinimal({ onCreateThing }: OnboardingProps) {
  return (
    <div className={styles.emptyState}>
      <FolderIcon className={styles.emptyIcon} />
      <Text size="sm" color="soft">No things yet</Text>
      <Button variant="primary" icon={<AddIcon />} onClick={onCreateThing}>
        Create Thing
      </Button>
    </div>
  );
}

/** Welcome state - warm, visual, engaging */
function EmptyStateWelcome({ onCreateThing, onStartChat }: OnboardingProps) {
  const [inputValue, setInputValue] = useState('');

  const exampleThings = [
    { icon: <CodeIcon />, name: 'My React App', tag: '#github' },
    { icon: <FileIcon />, name: 'Learning Rust', tag: '#learning' },
    { icon: <FolderIcon />, name: 'Q1 Goals', tag: '#work' },
  ];

  return (
    <div className={styles.welcomeContainer}>
      {/* Warm hero with gradient */}
      <div className={styles.welcomeHero}>
        <div className={styles.welcomeGreeting}>
          <Text size="lg" className={styles.welcomeWave}>👋</Text>
          <Heading level={1} size={2}>What are you working on?</Heading>
        </div>

        {/* Quick input to get started immediately */}
        <div className={styles.welcomeInputWrapper}>
          <input
            type="text"
            className={styles.welcomeInput}
            placeholder="e.g., My side project, Learning TypeScript, Reading list..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <Button variant="primary" disabled={!inputValue.trim()} onClick={onCreateThing}>
            Add Thing
          </Button>
        </div>
      </div>

      {/* Visual preview of what Things look like */}
      <div className={styles.welcomePreview}>
        <Text size="sm" color="soft" className={styles.welcomePreviewLabel}>
          Here's what your Things could look like:
        </Text>
        <div className={styles.welcomePreviewCards}>
          {exampleThings.map((thing, i) => (
            <div key={i} className={styles.welcomePreviewCard}>
              <span className={styles.welcomePreviewIcon}>{thing.icon}</span>
              <span className={styles.welcomePreviewName}>{thing.name}</span>
              <span className={styles.welcomePreviewTag}>{thing.tag}</span>
            </div>
          ))}
          <div className={styles.welcomePreviewCardAdd}>
            <AddIcon />
            <span>Your thing here</span>
          </div>
        </div>
      </div>

      {/* Subtle feature hints - not walls of text */}
      <div className={styles.welcomeHints}>
        <div className={styles.welcomeHint}>
          <ChatIcon className={styles.welcomeHintIcon} />
          <Text size="sm">
            Mention in chat with <code className={styles.inlineCode}>^name</code>
          </Text>
        </div>
        <div className={styles.welcomeHintDivider} />
        <div className={styles.welcomeHint}>
          <IndentIcon className={styles.welcomeHintIcon} />
          <Text size="sm">Nest things inside each other</Text>
        </div>
        <div className={styles.welcomeHintDivider} />
        <div className={styles.welcomeHint}>
          <LinkIcon className={styles.welcomeHintIcon} />
          <Text size="sm">Attach URLs &amp; docs for context</Text>
        </div>
      </div>

      {/* Alternative action */}
      <div className={styles.welcomeAlt}>
        <Text size="sm" color="soft">Prefer to chat?</Text>
        <Button variant="ghost" icon={<ChatIcon />} onClick={onStartChat}>
          Tell me what you're working on
        </Button>
      </div>
    </div>
  );
}

/** Quick start state - shows import options */
function EmptyStateQuickStart({ onCreateThing, onImportFromGit, onStartChat }: OnboardingProps) {
  return (
    <div className={styles.onboardingContainer}>
      <div className={styles.onboardingHero}>
        <Heading level={2} size={3}>Get started quickly</Heading>
        <Text size="base" color="soft" className={styles.onboardingSubtitle}>
          Choose how you'd like to populate your Things
        </Text>
      </div>

      <div className={styles.quickStartGrid}>
        <button className={styles.quickStartCard} onClick={onStartChat}>
          <div className={styles.quickStartIcon}>
            <ChatIcon />
          </div>
          <div className={styles.quickStartContent}>
            <Text weight="medium">Tell me about it</Text>
            <Text size="sm" color="soft">
              Describe what you're working on in chat. I'll create and organize Things for you.
            </Text>
          </div>
          <ArrowRightIcon className={styles.quickStartArrow} />
        </button>

        <button className={styles.quickStartCard} onClick={onImportFromGit}>
          <div className={styles.quickStartIcon}>
            <CodeIcon />
          </div>
          <div className={styles.quickStartContent}>
            <Text weight="medium">Import from Git</Text>
            <Text size="sm" color="soft">
              Connect a repository and I'll analyze its structure to create Things.
            </Text>
          </div>
          <ArrowRightIcon className={styles.quickStartArrow} />
        </button>

        <button className={styles.quickStartCard} onClick={onCreateThing}>
          <div className={styles.quickStartIcon}>
            <AddIcon />
          </div>
          <div className={styles.quickStartContent}>
            <Text weight="medium">Create manually</Text>
            <Text size="sm" color="soft">
              Build your Thing structure step by step with full control.
            </Text>
          </div>
          <ArrowRightIcon className={styles.quickStartArrow} />
        </button>
      </div>

      <div className={`${styles.onboardingTip} surface warning`}>
        <StarIcon className={styles.tipIcon} />
        <Text size="sm">
          <strong>Tip:</strong> Things can have rich context — URLs, markdown docs, and more.
          This helps agents understand exactly what you're referring to.
        </Text>
      </div>
    </div>
  );
}

// ============================================
// CAROUSEL CARD COMPONENTS
// ============================================

interface ExampleThingCard {
  name: string;
  type: 'project' | 'category';
  tags: string[];
  description: string;
  children: string[];
  surfaceClass?: string;
}

/** Single card component for the carousel */
function CarouselCard({
  example,
  className,
  style
}: {
  example: ExampleThingCard;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`${styles.exampleCard} ${example.surfaceClass || ''} ${className || ''}`}
      style={style}
    >
      <div className={styles.exampleHeader}>
        <FolderIcon className={styles.exampleIcon} />
        <Text weight="medium">{example.name}</Text>
      </div>
      <div className={styles.exampleTags}>
        {example.tags.map(tag => (
          <Chip key={tag} size="xs" variant="outline">{tag}</Chip>
        ))}
      </div>
      <Text size="sm" color="soft" className={styles.exampleDescription}>
        {example.description}
      </Text>
      <div className={styles.exampleChildren}>
        <Text size="xs" color="soft">Contains:</Text>
        <div className={styles.exampleChildList}>
          {example.children.map(child => (
            <span key={child} className={styles.exampleChild}>
              <FileIcon className={styles.exampleChildIcon} />
              {child}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Examples state - shows visual samples */
function EmptyStateExamples({ onCreateThing, onStartChat }: OnboardingProps) {
  // Register dynamic surface CSS classes on mount
  useEffect(() => {
    injectSurfaceStyles();
  }, []);

  // Multiple sets of example things to rotate through - with random surfaces assigned
  const exampleThingSets: ExampleThingCard[][] = useMemo(() => {
    // Base data without surfaces
    const baseSets: Omit<ExampleThingCard, 'surfaceClass'>[][] = [
      // Set 1: Developer-focused
      [
        {
          name: 'my-app',
          type: 'project',
          tags: ['#github', '#react'],
          description: 'Git repo with README attached',
          children: ['components', 'api', 'docs'],
        },
        {
          name: 'Learning Rust',
          type: 'category',
          tags: ['#learning', '#programming'],
          description: 'A learning path with course links and notes',
          children: ['Rust Book', 'Exercises', 'Projects'],
        },
        {
          name: 'Q1 Planning',
          type: 'project',
          tags: ['#work', '#planning'],
          description: 'Goals and initiatives with team context',
          children: ['OKRs', 'Roadmap', 'Retros'],
        },
      ],
      // Set 2: Creative/Personal
      [
        {
          name: 'Novel Draft',
          type: 'project',
          tags: ['#writing', '#creative'],
          description: 'My sci-fi novel in progress',
          children: ['Outline', 'Characters', 'Chapter 1'],
        },
        {
          name: 'Home Renovation',
          type: 'category',
          tags: ['#personal', '#planning'],
          description: 'Kitchen remodel project tracking',
          children: ['Budget', 'Contractors', 'Timeline'],
        },
        {
          name: 'Recipe Collection',
          type: 'category',
          tags: ['#cooking', '#reference'],
          description: 'Favorite recipes with notes',
          children: ['Italian', 'Desserts', 'Quick Meals'],
        },
      ],
      // Set 3: Business/Professional
      [
        {
          name: 'Product Launch',
          type: 'project',
          tags: ['#marketing', '#launch'],
          description: 'V2 launch campaign assets',
          children: ['Press Kit', 'Social', 'Email'],
        },
        {
          name: 'Team Onboarding',
          type: 'category',
          tags: ['#hr', '#process'],
          description: 'New hire documentation',
          children: ['Checklist', 'Resources', 'Training'],
        },
        {
          name: 'Client Projects',
          type: 'category',
          tags: ['#clients', '#active'],
          description: 'Active client engagements',
          children: ['Acme Corp', 'StartupX', 'BigCo'],
        },
      ],
      // Set 4: Research/Learning
      [
        {
          name: 'AI Research',
          type: 'category',
          tags: ['#research', '#ai'],
          description: 'Papers and experiments',
          children: ['Papers', 'Notes', 'Experiments'],
        },
        {
          name: 'Course Notes',
          type: 'category',
          tags: ['#learning', '#courses'],
          description: 'Online course materials',
          children: ['ML Basics', 'System Design', 'AWS'],
        },
        {
          name: 'Book Club',
          type: 'category',
          tags: ['#reading', '#social'],
          description: 'Monthly book discussions',
          children: ['Current', 'Archive', 'Wishlist'],
        },
      ],
    ];

    // Assign random surfaces to each card
    return baseSets.map(set =>
      set.map(card => ({
        ...card,
        surfaceClass: getSurfaceClassName(getRandomSurfaceName()),
      }))
    );
  }, []);

  return (
    <div className={styles.onboardingContainer}>
      <div className={styles.onboardingHero}>
        <Heading level={2} size={2}>Things can be anything</Heading>
        <Text color="soft">Here are some examples of Things you can make:</Text>
      </div>

      <RotatingCarousel
        className={styles.examplesGrid}
        sets={exampleThingSets}
        interval={3000}
        staggerDelay={150}
        renderItem={(card, index) => (
          <CarouselCard key={index} example={card} />
        )}
      />

      <div className={`${styles.exampleContextBox} surface strong`}>
        <div className={styles.contextHeader}>
          <LinkIcon className={styles.contextIcon} />
          <Text weight="medium">Things carry context</Text>
        </div>
        <Text size="sm">
          Attach URLs, markdown docs, or any context. When you mention <code className={styles.inlineCode}>^thing</code> in chat, the agent has access to all that context.
        </Text>
      </div>

      <div className={styles.onboardingActions}>
        <Button variant="primary" icon={<AddIcon />} onClick={onCreateThing}>
          Create your first Thing
        </Button>
        <Button variant="ghost" icon={<ChatIcon />} onClick={onStartChat}>
          Or describe it in chat
        </Button>
      </div>
    </div>
  );
}

/** Chat-first state - encourages conversational setup */
function EmptyStateChatFirst({ onStartChat, onCreateThing }: OnboardingProps) {
  return (
    <div className={styles.onboardingContainer}>
      <div className={styles.chatFirstHero}>
        <div className={styles.chatBubbleStack}>
          <div className={styles.chatBubbleUser}>
            "I'm working on a React component library for our design system"
          </div>
          <div className={styles.chatBubbleAgent}>
            <CheckCircleIcon className={styles.chatBubbleIcon} />
            <div>
              <Text size="sm">I've created a Thing for your component library. Would you like me to add it under a "Work" category?</Text>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.onboardingHero}>
        <Heading level={2} size={3}>Just describe what matters to you</Heading>
        <Text size="base" color="soft" className={styles.onboardingSubtitle}>
          Tell me about your projects, interests, or what you're learning.
          I'll create and organize Things for you automatically.
        </Text>
      </div>

      <div className={styles.chatPromptExamples}>
        <Text size="sm" weight="medium" color="soft">Try saying things like:</Text>
        <div className={styles.promptList}>
          <div className={styles.promptExample}>
            "I'm reading The Art of Systems Thinking"
          </div>
          <div className={styles.promptExample}>
            "My main project is github.com/user/repo"
          </div>
          <div className={styles.promptExample}>
            "I'm learning TypeScript and Rust this quarter"
          </div>
        </div>
      </div>

      <div className={styles.onboardingActions}>
        <Button variant="primary" icon={<ChatIcon />} onClick={onStartChat}>
          Start a conversation
        </Button>
        <Button variant="ghost" icon={<AddIcon />} onClick={onCreateThing}>
          Or create manually
        </Button>
      </div>

      <div className={`${styles.onboardingTip} surface warning`}>
        <StarIcon className={styles.tipIcon} />
        <Text size="sm">
          <strong>Remember it:</strong> Whenever you describe something in chat,
          ask me to "remember this" and I'll document it as a Thing.
        </Text>
      </div>
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

interface ThingDetailProps {
  thing: Thing;
  allThings: Thing[];
  onClose: () => void;
  onSelectThing?: (thing: Thing) => void;
}

function ThingDetail({ thing, allThings, onClose, onSelectThing }: ThingDetailProps) {
  const parents = getParents(allThings, thing);
  const children = getChildren(allThings, thing.id);
  const totalIdeas = thing.ideaCount
    ? thing.ideaCount.new + thing.ideaCount.exploring + thing.ideaCount.ready + thing.ideaCount.archived
    : 0;

  return (
    <div className={styles.detailPanel}>
      <div className={styles.detailHeader}>
        <div className={styles.detailTitle}>
          {getThingIcon(thing)}
          <Heading level={3} size={4}>{thing.name}</Heading>
        </div>
        <IconButton variant="ghost" icon={<CloseIcon />} onClick={onClose} aria-label="Close" />
      </div>

      {/* Breadcrumb for single parent, or Parents section for multiple */}
      {parents.length === 1 ? (
        <div className={styles.breadcrumb}>
          <HomeIcon className={styles.breadcrumbIcon} />
          <span
            className={styles.breadcrumbItem}
            onClick={() => onSelectThing?.(parents[0])}
          >
            {parents[0].name}
          </span>
          <ChevronRightIcon className={styles.breadcrumbSeparator} />
          <span className={styles.breadcrumbCurrent}>{thing.name}</span>
        </div>
      ) : parents.length > 1 ? (
        <div className={styles.parentsBar}>
          <Text size="sm" color="soft">In:</Text>
          {parents.map((parent, i) => (
            <span key={parent.id}>
              {i > 0 && <span className={styles.parentSeparator}>·</span>}
              <span
                className={styles.parentLink}
                onClick={() => onSelectThing?.(parent)}
              >
                {parent.name}
              </span>
            </span>
          ))}
        </div>
      ) : null}

      <div className={styles.detailContent}>
        {/* Description */}
        {thing.description && (
          <div className={styles.detailSection}>
            <div className={styles.sectionLabel}>
              <Text size="sm" color="soft">DESCRIPTION</Text>
            </div>
            <Text>{thing.description}</Text>
          </div>
        )}

        {/* Tags */}
        <div className={styles.detailSection}>
          <div className={styles.sectionHeader}>
            <Text size="sm" color="soft">TAGS</Text>
            <IconButton variant="ghost" icon={<EditIcon />} aria-label="Edit tags" />
          </div>
          <div className={styles.tagList}>
            {thing.tags.map(tag => (
              <Chip key={tag} size="sm" variant="default">#{tag}</Chip>
            ))}
            {thing.tags.length === 0 && (
              <Text size="sm" color="soft">No tags yet</Text>
            )}
          </div>
        </div>

        {/* Children */}
        {children.length > 0 && (
          <div className={styles.detailSection}>
            <div className={styles.sectionLabel}>
              <Text size="sm" color="soft">CONTAINS ({children.length})</Text>
            </div>
            <div className={styles.childList}>
              {children.map(child => (
                <div
                  key={child.id}
                  className={styles.childItem}
                  onClick={() => onSelectThing?.(child)}
                >
                  {getThingIcon(child)}
                  <span>{child.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ideas Summary */}
        <div className={styles.detailSection}>
          <div className={styles.sectionLabel}>
            <Text size="sm" color="soft">IDEAS ({totalIdeas})</Text>
          </div>
          <div className={styles.ideaSummary}>
            <div className={styles.ideaStat}>
              <span className={styles.ideaStatValue}>{thing.ideaCount?.new || 0}</span>
              <span className={styles.ideaStatLabel}>New</span>
            </div>
            <div className={styles.ideaStat}>
              <span className={styles.ideaStatValue}>{thing.ideaCount?.exploring || 0}</span>
              <span className={styles.ideaStatLabel}>Exploring</span>
            </div>
            <div className={styles.ideaStat}>
              <span className={styles.ideaStatValue}>{thing.ideaCount?.ready || 0}</span>
              <span className={styles.ideaStatLabel}>Ready</span>
            </div>
            <div className={styles.ideaStat}>
              <span className={styles.ideaStatValue}>{thing.ideaCount?.archived || 0}</span>
              <span className={styles.ideaStatLabel}>Archived</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ThingSelectorModalProps {
  things: Thing[];
  recentThings: Thing[];
  currentContextId?: string;
  onSelect: (thing: Thing) => void;
  onClose: () => void;
}

function ThingSelectorModal({
  things,
  recentThings,
  currentContextId,
  onSelect,
  onClose,
}: ThingSelectorModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<string[]>(things.map(t => t.id));

  const filteredThings = useMemo(() => {
    if (!searchQuery) return things;
    return filterThings(things, searchQuery);
  }, [things, searchQuery]);

  const currentThing = useMemo(() => {
    return getThingById(things, currentContextId || '');
  }, [things, currentContextId]);

  // Build tree from graph for TreeView
  const treeData = useMemo(() => {
    if (searchQuery) {
      const matchingIds = filteredThings.map(t => t.id);
      const tree = buildTreeFromGraph(things, matchingIds);
      return treeThingNodesToTreeNodes(tree);
    }
    const tree = buildTreeFromGraph(things);
    return treeThingNodesToTreeNodes(tree);
  }, [things, filteredThings, searchQuery]);

  const handleNodeSelect = useCallback((id: string | null) => {
    if (id) {
      const thing = getThingById(things, id);
      if (thing) onSelect(thing);
    }
  }, [things, onSelect]);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.selectorModal} onClick={e => e.stopPropagation()}>
        <div className={styles.selectorHeader}>
          <Heading level={2} size={5}>Select Context</Heading>
          <IconButton variant="ghost" icon={<CloseIcon />} onClick={onClose} aria-label="Close" />
        </div>

        {currentThing && (
          <div className={styles.currentContext}>
            <Text size="sm" color="soft">Current context:</Text>
            <div className={styles.currentContextValue}>
              {getThingIcon(currentThing)}
              <Text size="sm" weight="medium">{currentThing.name}</Text>
            </div>
          </div>
        )}

        <div className={styles.selectorSearch}>
          <SearchInput
            placeholder="Search by name or tag..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            fullWidth
          />
        </div>

        {!searchQuery && recentThings.length > 0 && (
          <div className={styles.recentSection}>
            <div className={styles.recentHeader}>
              <ClockIcon className={styles.recentIcon} />
              <Text size="sm" color="soft" weight="medium">Recent</Text>
            </div>
            <div className={styles.recentList}>
              {recentThings.map(thing => (
                <button key={thing.id} className={styles.recentItem} onClick={() => onSelect(thing)}>
                  {getThingIcon(thing)}
                  <span>{thing.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={styles.selectorTree}>
          <TreeView
            data={treeData}
            height={300}
            selectable
            selectedId={currentContextId}
            onSelect={handleNodeSelect}
            expandedIds={expandedIds}
            onExpandedChange={setExpandedIds}
            defaultExpandAll
            aria-label="Thing selector"
          />
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

interface IdeateThingsProps {
  things?: Thing[];
  selectedThingId?: string;
  showDetail?: boolean;
  showSelector?: boolean;
  searchQuery?: string;
  activeTagFilter?: string | null;
  initialViewType?: ViewType;
  /** Which empty state to show when there are no things */
  emptyStateVariant?: EmptyStateVariant;
}

function IdeateThingsComponent({
  things = [],
  selectedThingId,
  showDetail = false,
  showSelector = false,
  searchQuery: initialSearch = '',
  activeTagFilter: initialTagFilter = null,
  initialViewType = 'tree',
  emptyStateVariant = 'minimal',
}: IdeateThingsProps) {
  const [viewType, setViewType] = useState<ViewType>(initialViewType);
  const [expandedIds, setExpandedIds] = useState<string[]>(() => getRoots(things).map(t => t.id));
  const [selectedId, setSelectedId] = useState<string | undefined>(selectedThingId);
  const [localSearch, setLocalSearch] = useState(initialSearch);
  const [tagFilter, setTagFilter] = useState<string | null>(initialTagFilter);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectorOpen, setSelectorOpen] = useState(showSelector);

  const filteredThings = useMemo(() => {
    if (!localSearch && !tagFilter) return things;
    return filterThings(things, localSearch, tagFilter || undefined);
  }, [things, localSearch, tagFilter]);

  const allTags = useMemo(() => collectAllTags(things), [things]);

  const selectedThing = useMemo(() => {
    return getThingById(things, selectedId || '');
  }, [things, selectedId]);

  // Compute recent things from IDs
  const recentThings = useMemo(() => {
    return recentThingIds
      .map(id => getThingById(things, id))
      .filter((t): t is Thing => t !== undefined);
  }, [things]);

  // Build tree from graph for TreeView
  const treeData = useMemo(() => {
    if (localSearch || tagFilter) {
      // When filtering, show matching items as roots
      const matchingIds = filteredThings.map(t => t.id);
      const tree = buildTreeFromGraph(things, matchingIds);
      return treeThingNodesToTreeNodes(tree);
    }
    const tree = buildTreeFromGraph(things);
    return treeThingNodesToTreeNodes(tree);
  }, [things, filteredThings, localSearch, tagFilter]);

  const handleNodeSelect = useCallback((id: string | null) => {
    setSelectedId(id || undefined);
  }, []);

  const handleSelectThing = useCallback((thing: Thing) => {
    setSelectedId(thing.id);
  }, []);

  // Show FRE in detail panel when no things (except minimal which shows in tree panel)
  const showFREInDetailPanel = things.length === 0 && emptyStateVariant !== 'minimal';

  return (
    <div className={styles.container}>
      {/* Left Panel - Tree/List */}
      <div className={styles.treePanel}>
        <div className={styles.treePanelHeader}>
          <Heading level={1} size={4}>Things</Heading>
          <Segmented
            value={viewType}
            onChange={(val) => setViewType(val as ViewType)}
            options={[
              { value: 'tree', label: <IndentIcon />, 'aria-label': 'Tree view' },
              { value: 'list', label: <ListViewIcon />, 'aria-label': 'List view' },
            ]}
          />
        </div>

        {/* Search + Filter */}
        <div className={styles.searchRow}>
          <SearchInput
            placeholder="Search by name or #tag..."
            value={localSearch}
            onChange={e => setLocalSearch(e.target.value)}
            aria-label="Search things"
            fullWidth
            wrapperClassName={styles.searchWrapper}
          />
          <IconButton
            variant={tagFilter ? 'primary' : 'ghost'}
            icon={<FilterIcon />}
            aria-label="Filter by tag"
            onClick={() => setFilterOpen(!filterOpen)}
          />
        </div>

        {/* New Thing button */}
        <div className={styles.newButtonRow}>
          <Button variant="primary" icon={<AddIcon />} className={styles.newButton}>New Thing</Button>
        </div>

        {/* Tag filter dropdown (shown when filter button clicked) */}
        {filterOpen && allTags.length > 0 && (
          <div className={styles.tagFilterDropdown}>
            <div className={styles.tagFilterList}>
              {allTags.map(tag => (
                <button
                  key={tag}
                  className={`${styles.tagFilterItem} ${tagFilter === tag ? styles.tagFilterActive : ''}`}
                  onClick={() => {
                    setTagFilter(tagFilter === tag ? null : tag);
                    setFilterOpen(false);
                  }}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Active filter indicator */}
        {tagFilter && (
          <div className={styles.activeFilter}>
            <Chip size="sm" variant="primary" onRemove={() => setTagFilter(null)}>
              #{tagFilter}
            </Chip>
          </div>
        )}

        <div className={styles.treeContainer}>
          {filteredThings.length === 0 ? (
            // Show search/filter empty state or minimal empty state
            localSearch || tagFilter ? (
              <div className={styles.emptyState}>
                <FolderIcon className={styles.emptyIcon} />
                <Text size="sm" color="soft">No things match your search</Text>
              </div>
            ) : (
              <EmptyStateMinimal />
            )
          ) : viewType === 'tree' ? (
            <TreeView
              data={treeData}
              height={500}
              selectable
              selectedId={selectedId}
              onSelect={handleNodeSelect}
              expandedIds={expandedIds}
              onExpandedChange={setExpandedIds}
              defaultExpandAll
              aria-label="Things hierarchy"
            />
          ) : (
            <List
              aria-label="Things list"
              selectable
              value={selectedId}
              onSelectionChange={(val) => setSelectedId(val as string)}
            >
              {filteredThings.map(thing => {
                const totalIdeas = thing.ideaCount
                  ? thing.ideaCount.new + thing.ideaCount.exploring + thing.ideaCount.ready
                  : 0;
                return (
                  <ListItem key={thing.id} value={thing.id}>
                    <div className={styles.treeNodeLabel}>
                      {getThingIcon(thing)}
                      <span className={styles.thingName}>{thing.name}</span>
                      {thing.tags.length > 0 && (
                        <span className={styles.tagPreview}>
                          {thing.tags.slice(0, 2).map(tag => (
                            <span key={tag} className={styles.miniTag}>#{tag}</span>
                          ))}
                          {thing.tags.length > 2 && (
                            <span className={styles.moreTag}>+{thing.tags.length - 2}</span>
                          )}
                        </span>
                      )}
                      {totalIdeas > 0 && (
                        <span className={styles.ideaCountBadge}>{totalIdeas}</span>
                      )}
                    </div>
                  </ListItem>
                );
              })}
            </List>
          )}
        </div>
      </div>

      {/* Right Panel - Detail or FRE */}
      {showDetail && selectedThing ? (
        <ThingDetail
          thing={selectedThing}
          allThings={things}
          onClose={() => setSelectedId(undefined)}
          onSelectThing={handleSelectThing}
        />
      ) : showFREInDetailPanel ? (
        <div className={styles.detailPanel}>
          <div className={styles.freDetailContent}>
            {emptyStateVariant === 'welcome' ? (
              <EmptyStateWelcome />
            ) : emptyStateVariant === 'quickstart' ? (
              <EmptyStateQuickStart />
            ) : emptyStateVariant === 'examples' ? (
              <EmptyStateExamples />
            ) : emptyStateVariant === 'chat-first' ? (
              <EmptyStateChatFirst />
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Selector Modal */}
      {selectorOpen && (
        <ThingSelectorModal
          things={things}
          recentThings={recentThings}
          currentContextId={selectedId}
          onSelect={t => {
            setSelectedId(t.id);
            setSelectorOpen(false);
          }}
          onClose={() => setSelectorOpen(false)}
        />
      )}
    </div>
  );
}

// ============================================
// STORYBOOK CONFIG
// ============================================

const meta: Meta<typeof IdeateThingsComponent> = {
  title: 'Example Pages/Ideate Things',
  component: IdeateThingsComponent,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof IdeateThingsComponent>;

export const Empty: Story = {
  args: {
    things: [],
    showDetail: false,
  },
};

export const PopulatedTree: Story = {
  args: {
    things: sampleThings,
    showDetail: false,
  },
};

export const WithSelection: Story = {
  args: {
    things: sampleThings,
    selectedThingId: 'claude-flow',
    showDetail: false,
  },
};

export const WithDetailPanel: Story = {
  args: {
    things: sampleThings,
    selectedThingId: 'component-library',
    showDetail: true,
  },
};

export const SearchResults: Story = {
  args: {
    things: sampleThings,
    searchQuery: 'typescript',
    showDetail: false,
  },
};

export const TagFiltered: Story = {
  args: {
    things: sampleThings,
    activeTagFilter: 'react',
    showDetail: false,
  },
};

export const WithSelectorModal: Story = {
  args: {
    things: sampleThings,
    selectedThingId: 'component-library',
    showSelector: true,
  },
};

// ============================================
// ONBOARDING STORIES
// ============================================

export const EmptyMinimal: Story = {
  name: 'Empty: Minimal',
  args: {
    things: [],
    emptyStateVariant: 'minimal',
  },
};

export const EmptyWelcome: Story = {
  name: 'Empty: Welcome',
  args: {
    things: [],
    emptyStateVariant: 'welcome',
  },
};

export const EmptyQuickStart: Story = {
  name: 'Empty: Quick Start',
  args: {
    things: [],
    emptyStateVariant: 'quickstart',
  },
};

export const EmptyExamples: Story = {
  name: 'Empty: Examples',
  args: {
    things: [],
    emptyStateVariant: 'examples',
  },
};

export const EmptyChatFirst: Story = {
  name: 'Empty: Chat First',
  args: {
    things: [],
    emptyStateVariant: 'chat-first',
  },
};
