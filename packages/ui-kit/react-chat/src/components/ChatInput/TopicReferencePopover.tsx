import { useEffect, useRef } from 'react';
import { FolderIcon } from '@ui-kit/icons/FolderIcon';
import { FileIcon } from '@ui-kit/icons/FileIcon';
import { CodeIcon } from '@ui-kit/icons/CodeIcon';
import { GearIcon } from '@ui-kit/icons/GearIcon';
import styles from './TopicReferencePopover.module.css';

/**
 * A Topic reference that can be used in chat messages
 */
export interface TopicReference {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Topic type */
  type: 'category' | 'project' | 'feature' | 'item';
  /** Optional tags */
  tags?: string[];
  /** Optional parent path for display */
  path?: string;
}

export interface TopicReferencePopoverProps {
  /** Whether the popover is visible */
  isOpen: boolean;

  /** Current search query (text after ^) */
  query: string;

  /** Available topics to show */
  topics: TopicReference[];

  /** Recently used topics (shown when query is empty) */
  recentTopics?: TopicReference[];

  /** Currently selected index */
  selectedIndex: number;

  /** Called when selection changes */
  onSelectionChange: (index: number) => void;

  /** Called when a topic is selected (click or Enter) */
  onSelect: (topic: TopicReference) => void;

  /** Called when popover should close */
  onClose: () => void;
}

/**
 * Filter and sort topics based on query
 * Sorting priority:
 * 1. Exact name match
 * 2. Name starts with query
 * 3. Name contains query
 * 4. Tag or path matches
 */
export function filterTopics(topics: TopicReference[], query: string): TopicReference[] {
  if (!query) return topics;

  const lowerQuery = query.toLowerCase();

  // Filter first
  const filtered = topics.filter((topic) => {
    // Match by name
    if (topic.name.toLowerCase().includes(lowerQuery)) return true;

    // Match by tags
    if (topic.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))) return true;

    // Match by path
    if (topic.path?.toLowerCase().includes(lowerQuery)) return true;

    return false;
  });

  // Sort by match quality
  return filtered.sort((a, b) => {
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();

    // Exact match first
    const aExact = aName === lowerQuery;
    const bExact = bName === lowerQuery;
    if (aExact && !bExact) return -1;
    if (bExact && !aExact) return 1;

    // Starts with query second
    const aStarts = aName.startsWith(lowerQuery);
    const bStarts = bName.startsWith(lowerQuery);
    if (aStarts && !bStarts) return -1;
    if (bStarts && !aStarts) return 1;

    // Name contains query third
    const aContains = aName.includes(lowerQuery);
    const bContains = bName.includes(lowerQuery);
    if (aContains && !bContains) return -1;
    if (bContains && !aContains) return 1;

    // Otherwise alphabetical
    return aName.localeCompare(bName);
  });
}

/**
 * Get icon for topic type
 */
function getTopicIcon(type: TopicReference['type']) {
  switch (type) {
    case 'category':
      return <FolderIcon />;
    case 'project':
      return <CodeIcon />;
    case 'feature':
      return <GearIcon />;
    case 'item':
    default:
      return <FileIcon />;
  }
}

/**
 * TopicReferencePopover
 *
 * Displays a list of available topics for referencing in chat with ^ syntax.
 * Similar to slash command popover but for topic references.
 */
export function TopicReferencePopover({
  isOpen,
  query,
  topics,
  recentTopics = [],
  selectedIndex,
  onSelectionChange,
  onSelect,
  onClose: _onClose,
}: TopicReferencePopoverProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // Show filtered topics, or recent topics if query is empty
  const displayTopics = query ? filterTopics(topics, query) : (recentTopics.length > 0 ? recentTopics : topics.slice(0, 10));
  const showRecentHeader = !query && recentTopics.length > 0;

  // Scroll selected item into view
  useEffect(() => {
    if (!isOpen || !listRef.current) return;

    const selectedItem = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
    if (selectedItem) {
      selectedItem.scrollIntoView({ block: 'nearest' });
    }
  }, [isOpen, selectedIndex]);

  if (!isOpen || displayTopics.length === 0) {
    return null;
  }

  return (
    <div
      className={styles.popover}
      role="listbox"
      aria-label="Topic references"
    >
      <div className={styles.header}>
        <span className={styles.headerText}>
          {showRecentHeader ? 'Recent Topics' : 'Topics'}
        </span>
        <span className={styles.headerHint}>↑↓ to navigate, Enter to select</span>
      </div>

      <div ref={listRef} className={styles.list}>
        {displayTopics.map((topic, index) => (
          <button
            key={topic.id}
            type="button"
            role="option"
            aria-selected={index === selectedIndex}
            data-index={index}
            className={`${styles.item} ${index === selectedIndex ? styles.selected : ''}`}
            onClick={() => onSelect(topic)}
            onMouseEnter={() => onSelectionChange(index)}
          >
            <span className={styles.icon}>{getTopicIcon(topic.type)}</span>
            <div className={styles.content}>
              <div className={styles.nameRow}>
                <span className={styles.name}>^{topic.name}</span>
                {topic.type && (
                  <span className={styles.type}>{topic.type}</span>
                )}
              </div>
              {topic.path && (
                <span className={styles.path}>{topic.path}</span>
              )}
              {topic.tags && topic.tags.length > 0 && (
                <span className={styles.tags}>
                  {topic.tags.slice(0, 3).map(tag => `#${tag}`).join(' ')}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

TopicReferencePopover.displayName = 'TopicReferencePopover';
