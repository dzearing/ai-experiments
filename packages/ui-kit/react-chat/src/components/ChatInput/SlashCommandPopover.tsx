import { useEffect, useRef, useCallback, type KeyboardEvent } from 'react';
import type { SlashCommand } from './SlashCommand.types';
import styles from './SlashCommandPopover.module.css';

export interface SlashCommandPopoverProps {
  /** Whether the popover is visible */
  isOpen: boolean;

  /** Current search query (text after /) */
  query: string;

  /** Available commands to show */
  commands: SlashCommand[];

  /** Currently selected index */
  selectedIndex: number;

  /** Called when selection changes */
  onSelectionChange: (index: number) => void;

  /** Called when a command is selected (click or Enter) */
  onSelect: (command: SlashCommand) => void;

  /** Called when popover should close */
  onClose: () => void;

  /** Position anchor element */
  anchorRef?: React.RefObject<HTMLElement>;
}

/**
 * Filter commands based on query
 */
export function filterCommands(commands: SlashCommand[], query: string): SlashCommand[] {
  const lowerQuery = query.toLowerCase();

  return commands.filter((cmd) => {
    if (cmd.hidden) return false;

    // Match by name
    if (cmd.name.toLowerCase().startsWith(lowerQuery)) return true;

    // Match by aliases
    if (cmd.aliases?.some((alias) => alias.toLowerCase().startsWith(lowerQuery))) return true;

    return false;
  });
}

/**
 * SlashCommandPopover
 *
 * Displays a list of available slash commands with filtering and keyboard navigation.
 */
export function SlashCommandPopover({
  isOpen,
  query,
  commands,
  selectedIndex,
  onSelectionChange,
  onSelect,
  onClose,
}: SlashCommandPopoverProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const filteredCommands = filterCommands(commands, query);

  // Scroll selected item into view
  useEffect(() => {
    if (!isOpen || !listRef.current) return;

    const selectedItem = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
    if (selectedItem) {
      selectedItem.scrollIntoView({ block: 'nearest' });
    }
  }, [isOpen, selectedIndex]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen || filteredCommands.length === 0) return;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          onSelectionChange(
            selectedIndex <= 0 ? filteredCommands.length - 1 : selectedIndex - 1
          );
          break;

        case 'ArrowDown':
          e.preventDefault();
          onSelectionChange(
            selectedIndex >= filteredCommands.length - 1 ? 0 : selectedIndex + 1
          );
          break;

        case 'Enter':
        case 'Tab':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            onSelect(filteredCommands[selectedIndex]);
          }
          break;

        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    },
    [isOpen, filteredCommands, selectedIndex, onSelectionChange, onSelect, onClose]
  );

  if (!isOpen || filteredCommands.length === 0) {
    return null;
  }

  return (
    <div
      className={styles.popover}
      role="listbox"
      aria-label="Slash commands"
      onKeyDown={handleKeyDown}
    >
      <div className={styles.header}>
        <span className={styles.headerText}>Commands</span>
        <span className={styles.headerHint}>↑↓ to navigate, Enter to select</span>
      </div>

      <div ref={listRef} className={styles.list}>
        {filteredCommands.map((cmd, index) => (
          <button
            key={cmd.name}
            type="button"
            role="option"
            aria-selected={index === selectedIndex}
            data-index={index}
            className={`${styles.item} ${index === selectedIndex ? styles.selected : ''}`}
            onClick={() => onSelect(cmd)}
            onMouseEnter={() => onSelectionChange(index)}
          >
            {cmd.icon && <span className={styles.icon}>{cmd.icon}</span>}
            <div className={styles.content}>
              <div className={styles.nameRow}>
                <span className={styles.name}>/{cmd.name}</span>
                {cmd.usage && cmd.usage !== `/${cmd.name}` && (
                  <span className={styles.usage}>{cmd.usage}</span>
                )}
              </div>
              <span className={styles.description}>{cmd.description}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

SlashCommandPopover.displayName = 'SlashCommandPopover';
