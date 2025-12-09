import { useState, useRef, useEffect, useCallback, type ReactNode, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import styles from './Menu.module.css';

/**
 * Menu component - context menu / dropdown menu
 *
 * Surfaces used:
 * - popout (menu container)
 * - controlSubtle (menu items on hover)
 *
 * Tokens used:
 * - --popout-bg, --popout-border, --popout-text
 * - --controlSubtle-bg-hover
 * - --shadow-lg
 * - --radius-md
 * - --duration-fast
 */

export interface MenuItem {
  /** Unique identifier for the item */
  id: string;
  /** Display label */
  label: string;
  /** Item is disabled */
  disabled?: boolean;
  /** Icon to display before label */
  icon?: ReactNode;
  /** Keyboard shortcut display text */
  shortcut?: string;
  /** Whether this is a danger/destructive action */
  danger?: boolean;
  /** Sub-items for nested menus */
  items?: MenuItem[];
}

export interface MenuDivider {
  /** Type discriminator */
  type: 'divider';
}

export interface MenuGroup {
  /** Type discriminator */
  type: 'group';
  /** Group label */
  label: string;
  /** Group items */
  items: (MenuItem | MenuDivider)[];
}

export type MenuItemType = MenuItem | MenuDivider | MenuGroup;

export type MenuPosition =
  | 'bottom-start'
  | 'bottom-end'
  | 'top-start'
  | 'top-end'
  | 'right-start'
  | 'right-end'
  | 'left-start'
  | 'left-end';

export interface MenuProps {
  /** Menu items */
  items: MenuItemType[];
  /** Callback when item is selected */
  onSelect: (id: string) => void;
  /** Position relative to trigger */
  position?: MenuPosition;
  /** The element that triggers the menu */
  children: ReactNode;
  /** Whether the menu is controlled externally */
  isOpen?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (isOpen: boolean) => void;
  /** Trigger on right-click (context menu mode) */
  contextMenu?: boolean;
  /** Additional class name for the menu */
  className?: string;
}

function isMenuItem(item: MenuItemType): item is MenuItem {
  return !('type' in item);
}

function isDivider(item: MenuItemType): item is MenuDivider {
  return 'type' in item && item.type === 'divider';
}

function isGroup(item: MenuItemType): item is MenuGroup {
  return 'type' in item && item.type === 'group';
}

export function Menu({
  items,
  onSelect,
  position = 'bottom-start',
  children,
  isOpen: controlledIsOpen,
  onOpenChange,
  contextMenu = false,
  className,
}: MenuProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const setIsOpen = useCallback(
    (open: boolean) => {
      if (!isControlled) {
        setInternalIsOpen(open);
      }
      onOpenChange?.(open);
    },
    [isControlled, onOpenChange]
  );

  // Flatten items for keyboard navigation
  const flattenItems = useCallback((menuItems: MenuItemType[]): MenuItem[] => {
    const result: MenuItem[] = [];
    for (const item of menuItems) {
      if (isMenuItem(item) && !item.disabled) {
        result.push(item);
      } else if (isGroup(item)) {
        for (const groupItem of item.items) {
          if (isMenuItem(groupItem) && !groupItem.disabled) {
            result.push(groupItem);
          }
        }
      }
    }
    return result;
  }, []);

  const navigableItems = flattenItems(items);

  const calculatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const triggerRect = trigger.getBoundingClientRect();
    const menuWidth = 200; // Approximate menu width
    const menuHeight = 300; // Approximate max menu height

    let top = 0;
    let left = 0;

    switch (position) {
      case 'bottom-start':
        top = triggerRect.bottom + 4;
        left = triggerRect.left;
        break;
      case 'bottom-end':
        top = triggerRect.bottom + 4;
        left = triggerRect.right - menuWidth;
        break;
      case 'top-start':
        top = triggerRect.top - menuHeight - 4;
        left = triggerRect.left;
        break;
      case 'top-end':
        top = triggerRect.top - menuHeight - 4;
        left = triggerRect.right - menuWidth;
        break;
      case 'right-start':
        top = triggerRect.top;
        left = triggerRect.right + 4;
        break;
      case 'right-end':
        top = triggerRect.bottom - menuHeight;
        left = triggerRect.right + 4;
        break;
      case 'left-start':
        top = triggerRect.top;
        left = triggerRect.left - menuWidth - 4;
        break;
      case 'left-end':
        top = triggerRect.bottom - menuHeight;
        left = triggerRect.left - menuWidth - 4;
        break;
    }

    // Ensure menu stays within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left + menuWidth > viewportWidth) {
      left = viewportWidth - menuWidth - 8;
    }
    if (left < 8) {
      left = 8;
    }
    if (top + menuHeight > viewportHeight) {
      top = viewportHeight - menuHeight - 8;
    }
    if (top < 8) {
      top = 8;
    }

    setMenuPosition({ top, left });
  }, [position]);

  const openMenu = useCallback(() => {
    calculatePosition();
    setIsOpen(true);
    setFocusedIndex(-1);
  }, [calculatePosition, setIsOpen]);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    setFocusedIndex(-1);
  }, [setIsOpen]);

  const handleSelect = useCallback(
    (item: MenuItem) => {
      if (!item.disabled) {
        onSelect(item.id);
        closeMenu();
      }
    },
    [onSelect, closeMenu]
  );

  const handleTriggerClick = useCallback(() => {
    if (!contextMenu) {
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    }
  }, [contextMenu, isOpen, openMenu, closeMenu]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (contextMenu) {
        e.preventDefault();
        setMenuPosition({ top: e.clientY, left: e.clientX });
        setIsOpen(true);
        setFocusedIndex(-1);
      }
    },
    [contextMenu, setIsOpen]
  );

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node) &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        closeMenu();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, closeMenu]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (!isOpen) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault();
          openMenu();
        }
        return;
      }

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          closeMenu();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((prev) =>
            prev < navigableItems.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((prev) =>
            prev > 0 ? prev - 1 : navigableItems.length - 1
          );
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < navigableItems.length) {
            handleSelect(navigableItems[focusedIndex]);
          }
          break;
        case 'Tab':
          closeMenu();
          break;
      }
    },
    [isOpen, openMenu, closeMenu, focusedIndex, navigableItems, handleSelect]
  );

  const renderMenuItem = (item: MenuItem) => {
    const isFocused = navigableItems.indexOf(item) === focusedIndex;

    return (
      <button
        key={item.id}
        type="button"
        className={`${styles.item} ${item.disabled ? styles.disabled : ''} ${item.danger ? styles.danger : ''} ${isFocused ? styles.focused : ''}`}
        onClick={() => handleSelect(item)}
        disabled={item.disabled}
        role="menuitem"
        tabIndex={-1}
        onMouseEnter={() => setFocusedIndex(navigableItems.indexOf(item))}
      >
        {item.icon && <span className={styles.icon}>{item.icon}</span>}
        <span className={styles.label}>{item.label}</span>
        {item.shortcut && <span className={styles.shortcut}>{item.shortcut}</span>}
      </button>
    );
  };

  const renderItems = (menuItems: MenuItemType[]) => {
    return menuItems.map((item, index) => {
      if (isDivider(item)) {
        return <div key={`divider-${index}`} className={styles.divider} role="separator" />;
      }

      if (isGroup(item)) {
        return (
          <div key={`group-${item.label}`} className={styles.group}>
            <div className={styles.groupLabel}>{item.label}</div>
            {item.items.map((groupItem, groupIndex) => {
              if (isDivider(groupItem)) {
                return <div key={`group-divider-${groupIndex}`} className={styles.divider} role="separator" />;
              }
              return renderMenuItem(groupItem as MenuItem);
            })}
          </div>
        );
      }

      return renderMenuItem(item);
    });
  };

  const menuContent = isOpen && (
    <div
      ref={menuRef}
      className={`${styles.menu} ${className || ''}`}
      style={{ top: menuPosition.top, left: menuPosition.left }}
      role="menu"
      aria-orientation="vertical"
    >
      {renderItems(items)}
    </div>
  );

  return (
    <div
      ref={wrapperRef}
      className={styles.wrapper}
      onKeyDown={handleKeyDown}
    >
      <div
        ref={triggerRef}
        onClick={handleTriggerClick}
        onContextMenu={handleContextMenu}
        role="button"
        tabIndex={0}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        {children}
      </div>
      {typeof document !== 'undefined' && createPortal(menuContent, document.body)}
    </div>
  );
}
