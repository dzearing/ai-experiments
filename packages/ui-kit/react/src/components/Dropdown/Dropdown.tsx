import { useState, useRef, useEffect, type ReactNode } from 'react';
import styles from './Dropdown.module.css';

/**
 * Dropdown component - menu list with items
 *
 * Surfaces used:
 * - panel
 * - controlSubtle (items on hover)
 *
 * Tokens used:
 * - --panel-bg, --panel-border, --panel-text
 * - --controlSubtle-bg-hover
 * - --shadow-md
 * - --radius-md
 */

export interface DropdownItem {
  /** Item label */
  label: string;
  /** Item value */
  value: string;
  /** Item is disabled */
  disabled?: boolean;
  /** Item icon */
  icon?: ReactNode;
  /** Keyboard shortcut display text */
  shortcut?: string;
  /** Divider below this item */
  divider?: boolean;
}

export interface DropdownProps {
  /** Dropdown items */
  items: DropdownItem[];
  /** Callback when item is selected */
  onSelect: (value: string) => void;
  /** Position relative to trigger */
  position?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
  /** The element that triggers the dropdown */
  children: ReactNode;
}

export function Dropdown({
  items,
  onSelect,
  position = 'bottom-start',
  children,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleSelect = (item: DropdownItem) => {
    if (!item.disabled) {
      onSelect(item.value);
      setIsOpen(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <div onClick={toggleDropdown}>{children}</div>
      {isOpen && (
        <div className={`${styles.menu} ${styles[position]}`} role="menu">
          {items.map((item, index) => (
            <div key={item.value}>
              <button
                type="button"
                className={`${styles.item} ${item.disabled ? styles.disabled : ''}`}
                onClick={() => handleSelect(item)}
                disabled={item.disabled}
                role="menuitem"
              >
                {item.icon && <span className={styles.icon}>{item.icon}</span>}
                <span className={styles.label}>{item.label}</span>
                {item.shortcut && <span className={styles.shortcut}>{item.shortcut}</span>}
              </button>
              {item.divider && index < items.length - 1 && <div className={styles.divider} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
