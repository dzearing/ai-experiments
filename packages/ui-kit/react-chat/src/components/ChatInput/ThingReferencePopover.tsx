import { useEffect, useRef } from 'react';
import { FolderIcon } from '@ui-kit/icons/FolderIcon';
import { FileIcon } from '@ui-kit/icons/FileIcon';
import { CodeIcon } from '@ui-kit/icons/CodeIcon';
import { GearIcon } from '@ui-kit/icons/GearIcon';
import styles from './ThingReferencePopover.module.css';

/**
 * A Thing reference that can be used in chat messages
 */
export interface ThingReference {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Thing type */
  type: 'category' | 'project' | 'feature' | 'item';
  /** Optional tags */
  tags?: string[];
  /** Optional parent path for display */
  path?: string;
}

export interface ThingReferencePopoverProps {
  /** Whether the popover is visible */
  isOpen: boolean;

  /** Current search query (text after ^) */
  query: string;

  /** Available things to show */
  things: ThingReference[];

  /** Recently used things (shown when query is empty) */
  recentThings?: ThingReference[];

  /** Currently selected index */
  selectedIndex: number;

  /** Called when selection changes */
  onSelectionChange: (index: number) => void;

  /** Called when a thing is selected (click or Enter) */
  onSelect: (thing: ThingReference) => void;

  /** Called when popover should close */
  onClose: () => void;
}

/**
 * Filter and sort things based on query
 * Sorting priority:
 * 1. Exact name match
 * 2. Name starts with query
 * 3. Name contains query
 * 4. Tag or path matches
 */
export function filterThings(things: ThingReference[], query: string): ThingReference[] {
  if (!query) return things;

  const lowerQuery = query.toLowerCase();

  // Filter first
  const filtered = things.filter((thing) => {
    // Match by name
    if (thing.name.toLowerCase().includes(lowerQuery)) return true;

    // Match by tags
    if (thing.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))) return true;

    // Match by path
    if (thing.path?.toLowerCase().includes(lowerQuery)) return true;

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
 * Get icon for thing type
 */
function getThingIcon(type: ThingReference['type']) {
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
 * ThingReferencePopover
 *
 * Displays a list of available things for referencing in chat with ^ syntax.
 * Similar to slash command popover but for thing references.
 */
export function ThingReferencePopover({
  isOpen,
  query,
  things,
  recentThings = [],
  selectedIndex,
  onSelectionChange,
  onSelect,
  onClose: _onClose,
}: ThingReferencePopoverProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // Show filtered things, or recent things if query is empty
  const displayThings = query ? filterThings(things, query) : (recentThings.length > 0 ? recentThings : things.slice(0, 10));
  const showRecentHeader = !query && recentThings.length > 0;

  // Scroll selected item into view
  useEffect(() => {
    if (!isOpen || !listRef.current) return;

    const selectedItem = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
    if (selectedItem) {
      selectedItem.scrollIntoView({ block: 'nearest' });
    }
  }, [isOpen, selectedIndex]);

  if (!isOpen || displayThings.length === 0) {
    return null;
  }

  return (
    <div
      className={styles.popover}
      role="listbox"
      aria-label="Thing references"
    >
      <div className={styles.header}>
        <span className={styles.headerText}>
          {showRecentHeader ? 'Recent Things' : 'Things'}
        </span>
        <span className={styles.headerHint}>↑↓ to navigate, Enter to select</span>
      </div>

      <div ref={listRef} className={styles.list}>
        {displayThings.map((thing, index) => (
          <button
            key={thing.id}
            type="button"
            role="option"
            aria-selected={index === selectedIndex}
            data-index={index}
            className={`${styles.item} ${index === selectedIndex ? styles.selected : ''}`}
            onClick={() => onSelect(thing)}
            onMouseEnter={() => onSelectionChange(index)}
          >
            <span className={styles.icon}>{getThingIcon(thing.type)}</span>
            <div className={styles.content}>
              <div className={styles.nameRow}>
                <span className={styles.name}>^{thing.name}</span>
                {thing.type && (
                  <span className={styles.type}>{thing.type}</span>
                )}
              </div>
              {thing.path && (
                <span className={styles.path}>{thing.path}</span>
              )}
              {thing.tags && thing.tags.length > 0 && (
                <span className={styles.tags}>
                  {thing.tags.slice(0, 3).map(tag => `#${tag}`).join(' ')}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

ThingReferencePopover.displayName = 'ThingReferencePopover';
