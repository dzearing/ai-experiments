import { useEffect, useMemo } from 'react';
import { Button, Chip, Heading, RotatingCarousel, Text } from '@ui-kit/react';
import {
  injectSurfaceStyles,
  getSurfaceClassName,
  getRandomSurfaceName,
} from '@ui-kit/core';
import { AddIcon } from '@ui-kit/icons/AddIcon';
import { ChatIcon } from '@ui-kit/icons/ChatIcon';
import { FolderIcon } from '@ui-kit/icons/FolderIcon';
import { IndentIcon } from '@ui-kit/icons/IndentIcon';
import { LinkIcon } from '@ui-kit/icons/LinkIcon';
import styles from './ThingsEmptyState.module.css';

interface ThingsEmptyStateProps {
  /** Whether there are any things in the system */
  hasThings: boolean;
  /** Callback when user wants to create a new thing */
  onCreateThing: () => void;
  /** Callback when user wants to start chat */
  onStartChat: () => void;
}

interface ExampleThingCard {
  name: string;
  type: 'project' | 'category';
  tags: string[];
  description: string;
  children: string[];
  surfaceClass?: string;
}

/**
 * Single card component for the carousel
 */
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
              <IndentIcon className={styles.exampleChildIcon} />
              {child}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * FRE - First Run Experience for new users
 * Shows examples of what Things can be and how they work
 */
function FirstRunExperience({ onCreateThing, onStartChat }: Omit<ThingsEmptyStateProps, 'hasThings'>) {
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
    <div className={styles.container}>
      <div className={styles.hero}>
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

      <div className={`${styles.contextBox} surface strong`}>
        <div className={styles.contextHeader}>
          <LinkIcon className={styles.contextIcon} />
          <Text weight="medium">Things carry context</Text>
        </div>
        <Text size="sm">
          Attach URLs, markdown docs, or any context. When you mention <code className={styles.inlineCode}>^thing</code> in chat, the agent has access to all that context.
        </Text>
      </div>

      <div className={styles.actions}>
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

/**
 * Simple empty state when things exist but none are selected
 */
function NoSelectionState({ onCreateThing }: Pick<ThingsEmptyStateProps, 'onCreateThing'>) {
  return (
    <div className={styles.noSelection}>
      <div className={styles.noSelectionContent}>
        <FolderIcon className={styles.noSelectionIcon} />
        <Text size="lg" color="soft">Select a thing to view details</Text>
        <Button variant="ghost" icon={<AddIcon />} onClick={onCreateThing}>
          Or create a new thing
        </Button>
      </div>
    </div>
  );
}

/**
 * ThingsEmptyState - Shows either:
 * 1. First Run Experience (FRE) when user has no things
 * 2. Simple "select a thing" message when things exist but none selected
 */
export function ThingsEmptyState({ hasThings, onCreateThing, onStartChat }: ThingsEmptyStateProps) {
  if (hasThings) {
    return <NoSelectionState onCreateThing={onCreateThing} />;
  }
  return <FirstRunExperience onCreateThing={onCreateThing} onStartChat={onStartChat} />;
}
