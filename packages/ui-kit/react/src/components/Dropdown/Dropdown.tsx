import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import styles from './Dropdown.module.css';

/**
 * Dropdown component - menu list with items and submenus
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
  /** Submenu items */
  items?: DropdownItem[];
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

export function Dropdown({
  items,
  onSelect,
  position = 'bottom-start',
  children,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [submenu, setSubmenu] = useState<SubmenuState | null>(null);
  const [detectedDir, setDetectedDir] = useState<'ltr' | 'rtl'>('ltr');

  const wrapperRef = useRef<HTMLDivElement>(null);

  // Detect direction from DOM for JS logic (keyboard nav, submenu indicator, submenu positioning)
  // CSS logical properties handle positioning automatically via inheritance
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

  // Use detected direction for JS logic
  const effectiveDir = detectedDir;
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const submenuItemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Filter to get only focusable items (non-disabled)
  const getFocusableItems = useCallback(
    (itemList: DropdownItem[]) => {
      return itemList
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => !item.disabled);
    },
    []
  );

  const focusableItems = getFocusableItems(items);

  // Get focusable items for current submenu if open
  const submenuItems = submenu !== null ? items[submenu.parentIndex]?.items ?? [] : [];
  const focusableSubmenuItems = getFocusableItems(submenuItems);

  // Close dropdown
  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setFocusedIndex(-1);
    setSubmenu(null);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    // Focus the button inside the trigger wrapper
    const triggerButton = triggerRef.current?.querySelector('button');
    triggerButton?.focus();
  }, []);

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
      const item = items[parentIndex];
      if (!item?.items?.length || item.disabled) return;

      setSubmenu({
        parentIndex,
        focusedIndex: viaHover ? -1 : 0, // Don't auto-focus on hover
        hoverOpenedAt: viaHover ? Date.now() : null,
      });
    },
    [items]
  );

  // Open dropdown and focus first item
  const openDropdown = useCallback(() => {
    setIsOpen(true);
    const firstFocusable = focusableItems[0];
    setFocusedIndex(firstFocusable?.index ?? -1);
  }, [focusableItems]);

  // Toggle dropdown
  const toggleDropdown = useCallback(() => {
    if (isOpen) {
      closeDropdown();
    } else {
      openDropdown();
    }
  }, [isOpen, closeDropdown, openDropdown]);

  // Handle item selection
  const handleSelect = useCallback(
    (item: DropdownItem, _event?: ReactMouseEvent) => {
      if (item.disabled) return;

      // If item has submenu, check if we should ignore the click
      if (item.items?.length) {
        // If submenu is open and was opened via hover, check timing
        if (submenu && submenu.hoverOpenedAt) {
          const timeSinceHoverOpen = Date.now() - submenu.hoverOpenedAt;
          if (timeSinceHoverOpen < CLICK_IGNORE_DELAY) {
            // Ignore click, just keep submenu open
            return;
          }
        }
        // Find this item's index and open/close submenu
        const itemIndex = items.findIndex((i) => i.value === item.value);
        if (submenu?.parentIndex === itemIndex) {
          closeSubmenu();
        } else {
          openSubmenu(itemIndex, false);
        }
        return;
      }

      onSelect(item.value);
      closeDropdown();
    },
    [items, submenu, onSelect, closeDropdown, closeSubmenu, openSubmenu]
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
        if (newFocusableIndex < 0) newFocusableIndex = focusableSubmenuItems.length - 1;
        if (newFocusableIndex >= focusableSubmenuItems.length) newFocusableIndex = 0;
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
            // Re-focus the parent item
            itemRefs.current[submenu.parentIndex]?.focus();
          } else {
            closeDropdown();
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
            const item = items[focusedIndex];
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
            // Navigate up by PAGE_SIZE
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
              closeDropdown();
            }
          } else if (focusedIndex >= 0) {
            const item = items[focusedIndex];
            if (item) {
              if (item.items?.length && !item.disabled) {
                openSubmenu(focusedIndex, false);
              } else if (!item.disabled) {
                onSelect(item.value);
                closeDropdown();
              }
            }
          }
          break;

        case 'Tab':
          // Close on tab and let focus move naturally
          closeDropdown();
          break;
      }
    },
    [
      effectiveDir,
      submenu,
      focusedIndex,
      items,
      submenuItems,
      navigateMainMenu,
      navigateSubmenu,
      navigateToEdge,
      openSubmenu,
      closeSubmenu,
      closeDropdown,
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
            openDropdown();
          }
          break;
        case 'ArrowUp':
          event.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
            // Focus last item when opening with ArrowUp
            const lastFocusable = focusableItems[focusableItems.length - 1];
            setFocusedIndex(lastFocusable?.index ?? -1);
          }
          break;
      }
    },
    [isOpen, openDropdown, focusableItems]
  );

  // Handle mouse enter on item
  const handleItemMouseEnter = useCallback(
    (index: number) => {
      setFocusedIndex(index);

      const item = items[index];
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
    [items, openSubmenu, closeSubmenu]
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
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        closeDropdown();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, closeDropdown]);

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
  const hasAnyIcons = items.some((item) => item.icon);
  const submenuHasAnyIcons = submenuItems.some((item) => item.icon);

  const renderMenuItem = (
    item: DropdownItem,
    index: number,
    refs: React.MutableRefObject<(HTMLButtonElement | null)[]>,
    isFocused: boolean,
    onMouseEnter: (index: number) => void,
    onItemSelect: (item: DropdownItem, event?: ReactMouseEvent) => void,
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
      <div key={item.value}>
        <button
          ref={(el) => {
            refs.current[index] = el;
          }}
          type="button"
          className={`${styles.item} ${item.disabled ? styles.disabled : ''} ${
            isFocused ? styles.focused : ''
          } ${hasSubmenu ? styles.hasSubmenu : ''}`}
          onClick={(e) => onItemSelect(item, e)}
          onMouseEnter={() => onMouseEnter(index)}
          disabled={item.disabled}
          role="menuitem"
          aria-haspopup={hasSubmenu ? 'menu' : undefined}
          aria-expanded={hasSubmenu && submenu?.parentIndex === index ? 'true' : undefined}
          tabIndex={isFocused ? 0 : -1}
        >
          {item.icon ? (
            <span className={styles.icon}>{item.icon}</span>
          ) : reserveIconSpace ? (
            <span className={styles.iconPlaceholder} aria-hidden="true" />
          ) : null}
          <span className={styles.label}>{item.label}</span>
          {item.shortcut && <span className={styles.shortcut}>{item.shortcut}</span>}
          {showSubmenuIndicator && submenuIndicator}
        </button>
        {item.divider && index < items.length - 1 && (
          <div className={styles.divider} role="separator" />
        )}
      </div>
    );
  };

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <div
        ref={triggerRef}
        className={styles.trigger}
        onClick={toggleDropdown}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        {children}
      </div>
      {isOpen && (
        <div
          ref={menuRef}
          className={`${styles.menu} ${styles[position]}`}
          role="menu"
          aria-orientation="vertical"
          onKeyDown={handleMenuKeyDown}
        >
          {items.map((item, index) =>
            renderMenuItem(
              item,
              index,
              itemRefs,
              focusedIndex === index,
              handleItemMouseEnter,
              handleSelect,
              true,
              hasAnyIcons
            )
          )}

          {/* Submenu */}
          {submenu !== null && submenuItems.length > 0 && (
            <div
              className={`${styles.submenu} ${
                effectiveDir === 'rtl' ? styles.submenuRtl : styles.submenuLtr
              }`}
              role="menu"
              aria-label={items[submenu.parentIndex]?.label}
              style={{
                top: itemRefs.current[submenu.parentIndex]?.offsetTop ?? 0,
              }}
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
                      closeDropdown();
                    }
                  },
                  false,
                  submenuHasAnyIcons
                )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
