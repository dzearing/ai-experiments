import { createContext, useContext, useCallback, useState, type ReactNode } from 'react';
import styles from './List.module.css';

/**
 * List component - display collections of items
 *
 * Surfaces used:
 * - controlSubtle (interactive items on hover)
 * - controlPrimary (selected items)
 *
 * Tokens used:
 * - --controlSubtle-bg-hover
 * - --controlPrimary-bg, --controlPrimary-text
 * - --page-border
 */

export type ListDensity = 'compact' | 'comfortable' | 'spacious';
export type ListVariant = 'default' | 'bordered' | 'divided';

// Context for List state
interface ListContextValue {
  selectedValue: string | string[] | null;
  onSelect: (value: string) => void;
  selectable: boolean;
  multiSelect: boolean;
  density: ListDensity;
}

const ListContext = createContext<ListContextValue | null>(null);

function useListContext() {
  return useContext(ListContext);
}

export interface ListProps {
  /** List items */
  children: ReactNode;
  /** List density */
  density?: ListDensity;
  /** List variant */
  variant?: ListVariant;
  /** Whether items are selectable */
  selectable?: boolean;
  /** Allow multiple selections */
  multiSelect?: boolean;
  /** Selected value(s) */
  value?: string | string[];
  /** Default selected value(s) */
  defaultValue?: string | string[];
  /** Callback when selection changes */
  onSelectionChange?: (value: string | string[]) => void;
  /** Additional class name */
  className?: string;
  /** Accessible label */
  'aria-label'?: string;
}

export function List({
  children,
  density = 'comfortable',
  variant = 'default',
  selectable = false,
  multiSelect = false,
  value,
  defaultValue,
  onSelectionChange,
  className,
  'aria-label': ariaLabel,
}: ListProps) {
  const [internalValue, setInternalValue] = useState<string | string[]>(
    defaultValue ?? (multiSelect ? [] : '')
  );

  const isControlled = value !== undefined;
  const selectedValue = isControlled ? value : internalValue;

  const handleSelect = useCallback(
    (itemValue: string) => {
      if (!selectable) return;

      let newValue: string | string[];

      if (multiSelect) {
        const currentArray = Array.isArray(selectedValue) ? selectedValue : [];
        if (currentArray.includes(itemValue)) {
          newValue = currentArray.filter((v) => v !== itemValue);
        } else {
          newValue = [...currentArray, itemValue];
        }
      } else {
        newValue = itemValue;
      }

      if (!isControlled) {
        setInternalValue(newValue);
      }
      onSelectionChange?.(newValue);
    },
    [selectable, multiSelect, selectedValue, isControlled, onSelectionChange]
  );

  const contextValue: ListContextValue = {
    selectedValue,
    onSelect: handleSelect,
    selectable,
    multiSelect,
    density,
  };

  const classNames = [
    styles.list,
    styles[density],
    styles[variant],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <ListContext.Provider value={contextValue}>
      <ul
        className={classNames}
        role={selectable ? 'listbox' : 'list'}
        aria-label={ariaLabel}
        aria-multiselectable={multiSelect || undefined}
      >
        {children}
      </ul>
    </ListContext.Provider>
  );
}

// ListItem Component
export interface ListItemProps {
  /** Unique value for selection */
  value?: string;
  /** Item content */
  children: ReactNode;
  /** Leading content (icon, avatar, etc.) */
  leading?: ReactNode;
  /** Trailing content (icon, badge, action, etc.) */
  trailing?: ReactNode;
  /** Item is disabled */
  disabled?: boolean;
  /** Click handler (for non-selectable lists) */
  onClick?: () => void;
  /** Additional class name */
  className?: string;
}

export function ListItem({
  value,
  children,
  leading,
  trailing,
  disabled = false,
  onClick,
  className,
}: ListItemProps) {
  const context = useListContext();

  const isSelected =
    context?.selectable && value
      ? Array.isArray(context.selectedValue)
        ? context.selectedValue.includes(value)
        : context.selectedValue === value
      : false;

  const handleClick = () => {
    if (disabled) return;
    if (context?.selectable && value) {
      context.onSelect(value);
    }
    onClick?.();
  };

  const isInteractive = context?.selectable || onClick;

  const classNames = [
    styles.item,
    context?.density && styles[context.density],
    isInteractive && styles.interactive,
    isSelected && styles.selected,
    disabled && styles.disabled,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {leading && <span className={styles.leading}>{leading}</span>}
      <span className={styles.content}>{children}</span>
      {trailing && <span className={styles.trailing}>{trailing}</span>}
    </>
  );

  if (isInteractive) {
    return (
      <li
        className={classNames}
        role={context?.selectable ? 'option' : undefined}
        aria-selected={context?.selectable ? isSelected : undefined}
        aria-disabled={disabled || undefined}
        onClick={handleClick}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        {content}
      </li>
    );
  }

  return <li className={classNames}>{content}</li>;
}

// ListItemText Component
export interface ListItemTextProps {
  /** Primary text */
  primary: ReactNode;
  /** Secondary text */
  secondary?: ReactNode;
  /** Additional class name */
  className?: string;
}

export function ListItemText({ primary, secondary, className }: ListItemTextProps) {
  return (
    <div className={`${styles.text} ${className || ''}`}>
      <span className={styles.primary}>{primary}</span>
      {secondary && <span className={styles.secondary}>{secondary}</span>}
    </div>
  );
}

// ListGroup Component
export interface ListGroupProps {
  /** Group label */
  label: string;
  /** Group items */
  children: ReactNode;
  /** Collapsible */
  collapsible?: boolean;
  /** Default collapsed state */
  defaultCollapsed?: boolean;
  /** Additional class name */
  className?: string;
}

export function ListGroup({
  label,
  children,
  collapsible = false,
  defaultCollapsed = false,
  className,
}: ListGroupProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <li className={`${styles.group} ${className || ''}`} role="group">
      <div
        className={`${styles.groupHeader} ${collapsible ? styles.collapsible : ''}`}
        onClick={collapsible ? () => setIsCollapsed(!isCollapsed) : undefined}
        role={collapsible ? 'button' : undefined}
        tabIndex={collapsible ? 0 : undefined}
        aria-expanded={collapsible ? !isCollapsed : undefined}
        onKeyDown={
          collapsible
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsCollapsed(!isCollapsed);
                }
              }
            : undefined
        }
      >
        <span className={styles.groupLabel}>{label}</span>
        {collapsible && (
          <span className={`${styles.groupChevron} ${isCollapsed ? styles.collapsed : ''}`}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M3 4.5L6 7.5L9 4.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        )}
      </div>
      {!isCollapsed && <ul className={styles.groupContent}>{children}</ul>}
    </li>
  );
}

// ListDivider Component
export function ListDivider() {
  return <li className={styles.divider} role="separator" />;
}
