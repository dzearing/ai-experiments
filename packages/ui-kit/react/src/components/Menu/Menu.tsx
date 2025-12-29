import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  cloneElement,
  isValidElement,
  type ReactNode,
  type ReactElement,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { SurfaceAnimation, getAnimationDirection } from '../Animation';
import styles from './Menu.module.css';

/**
 * Menu component - action menu with submenus, groups, and context menu support
 *
 * Surfaces used:
 * - popout (menu container)
 * - controlSubtle (items on hover)
 * - controlPrimary (focused items)
 * - danger (danger items)
 *
 * Tokens used:
 * - --popout-bg, --popout-border, --popout-text, --popout-text-soft
 * - --controlSubtle-bg-hover
 * - --controlPrimary-bg, --controlPrimary-text
 * - --danger-text, --danger-bg
 * - --shadow-lg
 * - --radius-md
 * - --duration-fast
 *
 * Keyboard navigation:
 * - Enter/Space: Open menu, select item, expand submenu
 * - Escape: Close menu or submenu
 * - ArrowDown: Move to next item
 * - ArrowUp: Move to previous item
 * - ArrowRight (LTR) / ArrowLeft (RTL): Expand submenu
 * - ArrowLeft (LTR) / ArrowRight (RTL): Close submenu
 * - Home: Move to first item
 * - End: Move to last item
 * - PageUp: Move up 10 items
 * - PageDown: Move down 10 items
 */

export interface MenuItem {
  /** Unique identifier (for backward compatibility) */
  id?: string;
  /** Item value - used in onSelect callback */
  value: string;
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
  /** Submenu items */
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
  onSelect: (value: string) => void;
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
  /** Anchor position for programmatic positioning (overrides trigger-based positioning) */
  anchorPosition?: { top: number; left: number };
}

/** Time to wait before expanding submenu on hover (ms) */
const HOVER_DELAY = 250;
/** Time to ignore clicks after hover-expand (ms) */
const CLICK_IGNORE_DELAY = 500;
/** Number of items to skip with PageUp/PageDown */
const PAGE_SIZE = 10;

interface SubmenuState {
  /** Index of parent item with open submenu */
  parentIndex: number;
  /** Focused index within the submenu */
  focusedIndex: number;
  /** Timestamp when submenu was opened via hover */
  hoverOpenedAt: number | null;
}

// Type guards
function isMenuItem(item: MenuItemType): item is MenuItem {
  return !('type' in item);
}

function isDivider(item: MenuItemType): item is MenuDivider {
  return 'type' in item && item.type === 'divider';
}

function isGroup(item: MenuItemType): item is MenuGroup {
  return 'type' in item && item.type === 'group';
}

// Flatten items for navigation (extracts all MenuItem from groups)
function flattenMenuItems(items: MenuItemType[]): MenuItem[] {
  const result: MenuItem[] = [];
  for (const item of items) {
    if (isMenuItem(item)) {
      result.push(item);
    } else if (isGroup(item)) {
      for (const groupItem of item.items) {
        if (isMenuItem(groupItem)) {
          result.push(groupItem);
        }
      }
    }
  }
  return result;
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
  anchorPosition,
}: MenuProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [submenu, setSubmenu] = useState<SubmenuState | null>(null);
  const [detectedDir, setDetectedDir] = useState<'ltr' | 'rtl'>('ltr');
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const wrapperRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const submenuItemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Controlled vs uncontrolled state
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
  const flatItems = flattenMenuItems(items);

  // Detect direction from DOM for JS logic (keyboard nav, submenu indicator, submenu positioning)
  useEffect(() => {
    const detectDirection = () => {
      const element = wrapperRef.current;
      if (element) {
        const computedDir = getComputedStyle(element).direction;
        setDetectedDir(computedDir === 'rtl' ? 'rtl' : 'ltr');
      }
    };

    detectDirection();

    // Re-detect on DOM changes (e.g., if dir attribute changes on ancestor)
    const observer = new MutationObserver(detectDirection);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['dir'],
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  const effectiveDir = detectedDir;

  // Filter to get only focusable items (non-disabled)
  const getFocusableItems = useCallback((itemList: MenuItem[]) => {
    return itemList
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => !item.disabled);
  }, []);

  const focusableItems = getFocusableItems(flatItems);

  // Get focusable items for current submenu if open
  const submenuItems =
    submenu !== null ? flatItems[submenu.parentIndex]?.items ?? [] : [];
  const focusableSubmenuItems = getFocusableItems(submenuItems);

  // Calculate menu position for portal rendering
  const calculatePosition = useCallback((menuElement?: HTMLDivElement | null) => {
    // Use actual menu dimensions if available, otherwise estimate
    const menuWidth = menuElement?.offsetWidth ?? 220;
    const menuHeight = menuElement?.offsetHeight ?? 400;

    let top = 0;
    let left = 0;

    // If anchorPosition is provided, use it directly (for programmatic context menus)
    if (anchorPosition) {
      top = anchorPosition.top;
      left = anchorPosition.left;
    } else {
      // Otherwise, calculate from trigger element
      const trigger = triggerRef.current;
      if (!trigger) return;

      const triggerRect = trigger.getBoundingClientRect();

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
  }, [position, anchorPosition]);

  // Callback ref to position menu after it mounts with actual dimensions
  const menuCallbackRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      // Store ref for other uses
      (menuRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      // Reposition with actual dimensions
      calculatePosition(node);
    }
  }, [calculatePosition]);

  // Close menu with exit animation
  const closeMenu = useCallback(() => {
    setExiting(true);
    setFocusedIndex(-1);
    setSubmenu(null);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  }, []);

  // Handle exit animation complete
  const handleExitComplete = useCallback(() => {
    setExiting(false);
    setIsOpen(false);
  }, [setIsOpen]);

  // Close submenu
  const closeSubmenu = useCallback(() => {
    setSubmenu(null);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  }, []);

  // Open submenu for item at index
  const openSubmenu = useCallback(
    (parentIndex: number, viaHover = false) => {
      const item = flatItems[parentIndex];
      if (!item?.items?.length || item.disabled) return;

      setSubmenu({
        parentIndex,
        focusedIndex: viaHover ? -1 : 0, // Don't auto-focus on hover
        hoverOpenedAt: viaHover ? Date.now() : null,
      });
    },
    [flatItems]
  );

  // Open menu and focus first item
  const openMenu = useCallback(() => {
    calculatePosition();
    setIsOpen(true);
    const firstFocusable = focusableItems[0];
    setFocusedIndex(firstFocusable?.index ?? -1);
  }, [calculatePosition, setIsOpen, focusableItems]);

  // Toggle menu
  const toggleMenu = useCallback(() => {
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  }, [isOpen, closeMenu, openMenu]);

  // Handle item selection
  const handleSelect = useCallback(
    (item: MenuItem, _event?: ReactMouseEvent) => {
      if (item.disabled) return;

      // If item has submenu, check if we should ignore the click
      if (item.items?.length) {
        // If submenu is open and was opened via hover, check timing
        if (submenu && submenu.hoverOpenedAt) {
          const timeSinceHoverOpen = Date.now() - submenu.hoverOpenedAt;
          if (timeSinceHoverOpen < CLICK_IGNORE_DELAY) {
            return;
          }
        }
        // Find this item's index and open/close submenu
        const itemIndex = flatItems.findIndex((i) => i.value === item.value);
        if (submenu?.parentIndex === itemIndex) {
          closeSubmenu();
        } else {
          openSubmenu(itemIndex, false);
        }
        return;
      }

      onSelect(item.value);
      closeMenu();
    },
    [flatItems, submenu, onSelect, closeMenu, closeSubmenu, openSubmenu]
  );

  // Navigate to item by offset in main menu
  const navigateMainMenu = useCallback(
    (offset: number) => {
      if (focusableItems.length === 0) return;

      const currentFocusableIndex = focusableItems.findIndex(
        (fi) => fi.index === focusedIndex
      );
      let newFocusableIndex: number;

      if (currentFocusableIndex === -1) {
        newFocusableIndex = offset > 0 ? 0 : focusableItems.length - 1;
      } else {
        newFocusableIndex = currentFocusableIndex + offset;
        // Wrap around
        if (newFocusableIndex < 0) newFocusableIndex = focusableItems.length - 1;
        if (newFocusableIndex >= focusableItems.length) newFocusableIndex = 0;
      }

      setFocusedIndex(focusableItems[newFocusableIndex].index);
      closeSubmenu();
    },
    [focusableItems, focusedIndex, closeSubmenu]
  );

  // Navigate to item by offset in submenu
  const navigateSubmenu = useCallback(
    (offset: number) => {
      if (!submenu || focusableSubmenuItems.length === 0) return;

      const currentFocusableIndex = focusableSubmenuItems.findIndex(
        (fi) => fi.index === submenu.focusedIndex
      );
      let newFocusableIndex: number;

      if (currentFocusableIndex === -1) {
        newFocusableIndex = offset > 0 ? 0 : focusableSubmenuItems.length - 1;
      } else {
        newFocusableIndex = currentFocusableIndex + offset;
        // Wrap around
        if (newFocusableIndex < 0)
          newFocusableIndex = focusableSubmenuItems.length - 1;
        if (newFocusableIndex >= focusableSubmenuItems.length)
          newFocusableIndex = 0;
      }

      setSubmenu({
        ...submenu,
        focusedIndex: focusableSubmenuItems[newFocusableIndex].index,
      });
    },
    [submenu, focusableSubmenuItems]
  );

  // Navigate to first/last item
  const navigateToEdge = useCallback(
    (toEnd: boolean, inSubmenu: boolean) => {
      if (inSubmenu && submenu) {
        const targetItems = focusableSubmenuItems;
        if (targetItems.length === 0) return;
        const targetIndex = toEnd ? targetItems.length - 1 : 0;
        setSubmenu({
          ...submenu,
          focusedIndex: targetItems[targetIndex].index,
        });
      } else {
        if (focusableItems.length === 0) return;
        const targetIndex = toEnd ? focusableItems.length - 1 : 0;
        setFocusedIndex(focusableItems[targetIndex].index);
        closeSubmenu();
      }
    },
    [focusableItems, focusableSubmenuItems, submenu, closeSubmenu]
  );

  // Handle keyboard in menu
  const handleMenuKeyDown = useCallback(
    (event: ReactKeyboardEvent) => {
      const inSubmenu = submenu !== null && submenu.focusedIndex >= 0;
      const expandKey = effectiveDir === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
      const collapseKey = effectiveDir === 'rtl' ? 'ArrowRight' : 'ArrowLeft';

      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          event.stopPropagation();
          if (submenu) {
            closeSubmenu();
            itemRefs.current[submenu.parentIndex]?.focus();
          } else {
            closeMenu();
          }
          break;

        case 'ArrowDown':
          event.preventDefault();
          if (inSubmenu) {
            navigateSubmenu(1);
          } else {
            navigateMainMenu(1);
          }
          break;

        case 'ArrowUp':
          event.preventDefault();
          if (inSubmenu) {
            navigateSubmenu(-1);
          } else {
            navigateMainMenu(-1);
          }
          break;

        case expandKey:
          event.preventDefault();
          if (!inSubmenu && focusedIndex >= 0) {
            const item = flatItems[focusedIndex];
            if (item?.items?.length && !item.disabled) {
              openSubmenu(focusedIndex, false);
            }
          }
          break;

        case collapseKey:
          event.preventDefault();
          if (submenu) {
            closeSubmenu();
            itemRefs.current[submenu.parentIndex]?.focus();
          }
          break;

        case 'Home':
          event.preventDefault();
          navigateToEdge(false, inSubmenu);
          break;

        case 'End':
          event.preventDefault();
          navigateToEdge(true, inSubmenu);
          break;

        case 'PageUp':
          event.preventDefault();
          if (inSubmenu) {
            for (let i = 0; i < PAGE_SIZE; i++) {
              navigateSubmenu(-1);
            }
          } else {
            for (let i = 0; i < PAGE_SIZE; i++) {
              navigateMainMenu(-1);
            }
          }
          break;

        case 'PageDown':
          event.preventDefault();
          if (inSubmenu) {
            for (let i = 0; i < PAGE_SIZE; i++) {
              navigateSubmenu(1);
            }
          } else {
            for (let i = 0; i < PAGE_SIZE; i++) {
              navigateMainMenu(1);
            }
          }
          break;

        case 'Enter':
        case ' ':
          event.preventDefault();
          if (inSubmenu && submenu) {
            const subItem = submenuItems[submenu.focusedIndex];
            if (subItem && !subItem.disabled) {
              onSelect(subItem.value);
              closeMenu();
            }
          } else if (focusedIndex >= 0) {
            const item = flatItems[focusedIndex];
            if (item) {
              if (item.items?.length && !item.disabled) {
                openSubmenu(focusedIndex, false);
              } else if (!item.disabled) {
                onSelect(item.value);
                closeMenu();
              }
            }
          }
          break;

        case 'Tab':
          closeMenu();
          break;
      }
    },
    [
      effectiveDir,
      submenu,
      focusedIndex,
      flatItems,
      submenuItems,
      navigateMainMenu,
      navigateSubmenu,
      navigateToEdge,
      openSubmenu,
      closeSubmenu,
      closeMenu,
      onSelect,
    ]
  );

  // Handle trigger keyboard
  const handleTriggerKeyDown = useCallback(
    (event: ReactKeyboardEvent) => {
      switch (event.key) {
        case 'Enter':
        case ' ':
        case 'ArrowDown':
          event.preventDefault();
          if (!isOpen) {
            openMenu();
          }
          break;
        case 'ArrowUp':
          event.preventDefault();
          if (!isOpen) {
            calculatePosition();
            setIsOpen(true);
            // Focus last item when opening with ArrowUp
            const lastFocusable = focusableItems[focusableItems.length - 1];
            setFocusedIndex(lastFocusable?.index ?? -1);
          }
          break;
      }
    },
    [isOpen, openMenu, calculatePosition, setIsOpen, focusableItems]
  );

  // Handle trigger click
  const handleTriggerClick = useCallback(() => {
    if (!contextMenu) {
      toggleMenu();
    }
  }, [contextMenu, toggleMenu]);

  // Handle context menu (right-click)
  const handleContextMenu = useCallback(
    (e: ReactMouseEvent) => {
      if (contextMenu) {
        e.preventDefault();
        setMenuPosition({ top: e.clientY, left: e.clientX });
        setIsOpen(true);
        setFocusedIndex(-1);
      }
    },
    [contextMenu, setIsOpen]
  );

  // Handle mouse enter on item
  const handleItemMouseEnter = useCallback(
    (index: number) => {
      setFocusedIndex(index);

      const item = flatItems[index];
      if (item?.items?.length && !item.disabled) {
        // Clear any existing timeout
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
        }
        // Set timeout to open submenu
        hoverTimeoutRef.current = setTimeout(() => {
          openSubmenu(index, true);
        }, HOVER_DELAY);
      } else {
        // No submenu, close any open submenu after delay
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
        }
        hoverTimeoutRef.current = setTimeout(() => {
          closeSubmenu();
        }, HOVER_DELAY);
      }
    },
    [flatItems, openSubmenu, closeSubmenu]
  );

  // Handle mouse enter on submenu item
  const handleSubmenuItemMouseEnter = useCallback(
    (index: number) => {
      if (submenu) {
        setSubmenu({
          ...submenu,
          focusedIndex: index,
        });
      }
    },
    [submenu]
  );

  // Handle click outside
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

  // Focus management
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && !submenu) {
      itemRefs.current[focusedIndex]?.focus();
    }
  }, [isOpen, focusedIndex, submenu]);

  useEffect(() => {
    if (submenu && submenu.focusedIndex >= 0) {
      submenuItemRefs.current[submenu.focusedIndex]?.focus();
    }
  }, [submenu]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Check if any items have icons (for alignment)
  const hasAnyIcons = flatItems.some((item) => item.icon);
  const submenuHasAnyIcons = submenuItems.some((item) => item.icon);

  // Compute animation direction from position
  const animationDirection = useMemo(() => {
    return getAnimationDirection(position);
  }, [position]);

  // Compute submenu animation direction
  const submenuAnimationDirection = useMemo(() => {
    return effectiveDir === 'rtl' ? 'left' : 'right';
  }, [effectiveDir]);

  // Track item index for ref assignment
  let itemRefIndex = 0;

  const renderMenuItem = (
    item: MenuItem,
    index: number,
    refs: React.MutableRefObject<(HTMLButtonElement | null)[]>,
    isFocused: boolean,
    onMouseEnter: (index: number) => void,
    onItemSelect: (item: MenuItem, event?: ReactMouseEvent) => void,
    showSubmenuIndicator = false,
    reserveIconSpace = false
  ) => {
    const hasSubmenu = item.items && item.items.length > 0;
    const submenuIndicator = hasSubmenu ? (
      <span className={styles.submenuIndicator} aria-hidden="true">
        {effectiveDir === 'rtl' ? '◀' : '▶'}
      </span>
    ) : null;

    return (
      <button
        key={item.value}
        ref={(el) => {
          refs.current[index] = el;
        }}
        type="button"
        className={`${styles.item} ${item.disabled ? styles.disabled : ''} ${
          isFocused ? styles.focused : ''
        } ${hasSubmenu ? styles.hasSubmenu : ''} ${
          item.danger ? styles.danger : ''
        }`}
        onClick={(e) => onItemSelect(item, e)}
        onMouseEnter={() => onMouseEnter(index)}
        disabled={item.disabled}
        role="menuitem"
        aria-haspopup={hasSubmenu ? 'menu' : undefined}
        aria-expanded={
          hasSubmenu && submenu?.parentIndex === index ? 'true' : undefined
        }
        tabIndex={isFocused ? 0 : -1}
      >
        {item.icon ? (
          <span className={styles.icon}>{item.icon}</span>
        ) : reserveIconSpace ? (
          <span className={styles.iconPlaceholder} aria-hidden="true" />
        ) : null}
        <span className={styles.label}>{item.label}</span>
        {item.shortcut && (
          <span className={styles.shortcut}>{item.shortcut}</span>
        )}
        {showSubmenuIndicator && submenuIndicator}
      </button>
    );
  };

  const renderMenuItems = (menuItems: MenuItemType[]) => {
    const elements: React.ReactNode[] = [];

    for (let i = 0; i < menuItems.length; i++) {
      const item = menuItems[i];

      if (isDivider(item)) {
        elements.push(
          <div
            key={`divider-${i}`}
            className={styles.divider}
            role="separator"
          />
        );
      } else if (isGroup(item)) {
        elements.push(
          <div key={`group-${item.label}`} className={styles.group}>
            <div className={styles.groupLabel}>{item.label}</div>
            {item.items.map((groupItem, groupIndex) => {
              if (isDivider(groupItem)) {
                return (
                  <div
                    key={`group-divider-${groupIndex}`}
                    className={styles.divider}
                    role="separator"
                  />
                );
              }
              const menuItem = groupItem as MenuItem;
              const currentRefIndex = itemRefIndex++;
              return renderMenuItem(
                menuItem,
                currentRefIndex,
                itemRefs,
                focusedIndex === currentRefIndex,
                handleItemMouseEnter,
                handleSelect,
                true,
                hasAnyIcons
              );
            })}
          </div>
        );
      } else {
        const currentRefIndex = itemRefIndex++;
        elements.push(
          renderMenuItem(
            item,
            currentRefIndex,
            itemRefs,
            focusedIndex === currentRefIndex,
            handleItemMouseEnter,
            handleSelect,
            true,
            hasAnyIcons
          )
        );
      }
    }

    return elements;
  };

  // Reset itemRefIndex before each render
  itemRefIndex = 0;

  // Show menu when open or during exit animation
  const shouldShowMenu = isOpen || exiting;

  const menuContent = shouldShowMenu && (
    <SurfaceAnimation
      isVisible={isOpen && !exiting}
      direction={animationDirection}
      onExitComplete={handleExitComplete}
      style={{
        position: 'fixed',
        zIndex: 10000,
        top: menuPosition.top,
        left: menuPosition.left,
      }}
    >
      <div
        ref={menuCallbackRef}
        className={`${styles.menu} ${className || ''}`}
        role="menu"
        aria-orientation="vertical"
        onKeyDown={handleMenuKeyDown}
      >
        {renderMenuItems(items)}

        {/* Submenu */}
        {submenu !== null && submenuItems.length > 0 && (
          <SurfaceAnimation
            isVisible={true}
            direction={submenuAnimationDirection}
            style={{
              position: 'fixed',
              zIndex: 10001,
              top:
                (itemRefs.current[submenu.parentIndex]?.offsetTop ?? 0) +
                menuPosition.top,
              left:
                effectiveDir === 'rtl'
                  ? menuPosition.left - 220
                  : menuPosition.left + 220,
            }}
          >
            <div
              className={`${styles.submenu} ${
                effectiveDir === 'rtl' ? styles.submenuRtl : styles.submenuLtr
              }`}
              role="menu"
              aria-label={flatItems[submenu.parentIndex]?.label}
            >
              {submenuItems.map((subItem, subIndex) =>
                renderMenuItem(
                  subItem,
                  subIndex,
                  submenuItemRefs,
                  submenu.focusedIndex === subIndex,
                  handleSubmenuItemMouseEnter,
                  (item) => {
                    if (!item.disabled) {
                      onSelect(item.value);
                      closeMenu();
                    }
                  },
                  false,
                  submenuHasAnyIcons
                )
              )}
            </div>
          </SurfaceAnimation>
        )}
      </div>
    </SurfaceAnimation>
  );

  // Clone child to pass data-state for pressed styling
  const triggerChild = isValidElement(children)
    ? cloneElement(children as ReactElement<{ 'data-state'?: string }>, {
        'data-state': isOpen ? 'open' : undefined,
      })
    : children;

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <div
        ref={triggerRef}
        className={styles.trigger}
        onClick={handleTriggerClick}
        onContextMenu={handleContextMenu}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        {triggerChild}
      </div>
      {typeof document !== 'undefined' && createPortal(menuContent, document.body)}
    </div>
  );
}

Menu.displayName = 'Menu';
