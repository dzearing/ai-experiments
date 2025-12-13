import {
  createContext,
  useContext,
  useCallback,
  useState,
  useId,
  type ReactNode,
} from 'react';
import { Collapse } from '../Animation';
import styles from './Accordion.module.css';

/**
 * Accordion component - collapsible content panels
 *
 * Surfaces used:
 * - controlSubtle (header on hover)
 * - panel (content area)
 *
 * Tokens used:
 * - --controlSubtle-bg-hover
 * - --page-border
 * - --duration-normal (animation)
 */

export type AccordionVariant = 'default' | 'bordered' | 'separated';

// Context for Accordion state
interface AccordionContextValue {
  expandedItems: string[];
  toggleItem: (id: string) => void;
  allowMultiple: boolean;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

function useAccordionContext() {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error('AccordionItem must be used within an Accordion');
  }
  return context;
}

export interface AccordionProps {
  /** Accordion items */
  children: ReactNode;
  /** Allow multiple items to be expanded simultaneously */
  allowMultiple?: boolean;
  /** Controlled expanded items */
  expandedItems?: string[];
  /** Default expanded items */
  defaultExpandedItems?: string[];
  /** Callback when expansion changes */
  onExpandedChange?: (expandedItems: string[]) => void;
  /** Accordion variant */
  variant?: AccordionVariant;
  /** Additional class name */
  className?: string;
}

export function Accordion({
  children,
  allowMultiple = false,
  expandedItems: controlledItems,
  defaultExpandedItems = [],
  onExpandedChange,
  variant = 'default',
  className,
}: AccordionProps) {
  const [internalItems, setInternalItems] = useState<string[]>(defaultExpandedItems);

  const isControlled = controlledItems !== undefined;
  const expandedItems = isControlled ? controlledItems : internalItems;

  const toggleItem = useCallback(
    (id: string) => {
      let newItems: string[];

      if (expandedItems.includes(id)) {
        // Collapse
        newItems = expandedItems.filter((item) => item !== id);
      } else {
        // Expand
        if (allowMultiple) {
          newItems = [...expandedItems, id];
        } else {
          newItems = [id];
        }
      }

      if (!isControlled) {
        setInternalItems(newItems);
      }
      onExpandedChange?.(newItems);
    },
    [expandedItems, allowMultiple, isControlled, onExpandedChange]
  );

  const contextValue: AccordionContextValue = {
    expandedItems,
    toggleItem,
    allowMultiple,
  };

  const classNames = [styles.accordion, styles[variant], className]
    .filter(Boolean)
    .join(' ');

  return (
    <AccordionContext.Provider value={contextValue}>
      <div className={classNames}>{children}</div>
    </AccordionContext.Provider>
  );
}
Accordion.displayName = 'Accordion';

// AccordionItem Component
export interface AccordionItemProps {
  /** Unique identifier */
  id: string;
  /** Item content */
  children: ReactNode;
  /** Item is disabled */
  disabled?: boolean;
  /** Additional class name */
  className?: string;
}

export function AccordionItem({
  id,
  children,
  disabled = false,
  className,
}: AccordionItemProps) {
  const { expandedItems } = useAccordionContext();
  const isExpanded = expandedItems.includes(id);

  const classNames = [
    styles.item,
    isExpanded && styles.expanded,
    disabled && styles.disabled,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames} data-expanded={isExpanded}>
      {children}
    </div>
  );
}
AccordionItem.displayName = 'AccordionItem';

// AccordionHeader Component
export interface AccordionHeaderProps {
  /** Parent item ID */
  itemId: string;
  /** Header content */
  children: ReactNode;
  /** Icon to display before content */
  icon?: ReactNode;
  /** Disable the header */
  disabled?: boolean;
  /** Additional class name */
  className?: string;
}

export function AccordionHeader({
  itemId,
  children,
  icon,
  disabled = false,
  className,
}: AccordionHeaderProps) {
  const { expandedItems, toggleItem } = useAccordionContext();
  const isExpanded = expandedItems.includes(itemId);
  const contentId = useId();
  const headerId = useId();

  const handleClick = () => {
    if (!disabled) {
      toggleItem(itemId);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleItem(itemId);
    }
  };

  const classNames = [
    styles.header,
    isExpanded && styles.expanded,
    disabled && styles.disabled,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      id={headerId}
      className={classNames}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      aria-expanded={isExpanded}
      aria-controls={contentId}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      <span className={styles.headerContent}>{children}</span>
      <span className={`${styles.chevron} ${isExpanded ? styles.expanded : ''}`}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M4 6L8 10L12 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </button>
  );
}
AccordionHeader.displayName = 'AccordionHeader';

// AccordionContent Component
export interface AccordionContentProps {
  /** Parent item ID */
  itemId: string;
  /** Content */
  children: ReactNode;
  /** Additional class name */
  className?: string;
}

export function AccordionContent({
  itemId,
  children,
  className,
}: AccordionContentProps) {
  const { expandedItems } = useAccordionContext();
  const isExpanded = expandedItems.includes(itemId);

  return (
    <Collapse isOpen={isExpanded}>
      <div className={`${styles.content} ${className || ''}`}>
        {children}
      </div>
    </Collapse>
  );
}
AccordionContent.displayName = 'AccordionContent';
