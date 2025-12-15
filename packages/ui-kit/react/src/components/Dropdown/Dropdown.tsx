import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { Chip } from '../Chip';
import { useTypeToSelect } from './useTypeToSelect';
import styles from './Dropdown.module.css';

/**
 * Dropdown component - select-like component with single/multi-select, search, and type-to-select
 *
 * Surfaces used:
 * - inset (trigger)
 * - popout (menu)
 * - controlPrimary (selected/focused options)
 *
 * Tokens used:
 * - --inset-bg, --inset-border, --inset-text
 * - --popout-bg, --popout-border, --popout-text
 * - --controlPrimary-bg, --controlPrimary-text
 * - --shadow-md
 * - --radius-md
 *
 * Features:
 * - Single and multi-select modes
 * - Searchable/filterable options
 * - Type-to-select (native select behavior when not searching)
 * - Custom option and value rendering
 * - Chip display for multi-select
 * - Full keyboard navigation
 */

export interface DropdownOption<T = string> {
  /** Option value */
  value: T;
  /** Display label */
  label: string;
  /** Option is disabled */
  disabled?: boolean;
  /** Optional icon */
  icon?: ReactNode;
  /** Additional data for custom rendering */
  data?: Record<string, unknown>;
}

export interface OptionState {
  /** Option is selected */
  selected: boolean;
  /** Option is focused */
  focused: boolean;
  /** Option is disabled */
  disabled: boolean;
}

export interface DropdownProps<T = string> {
  /** Available options */
  options: DropdownOption<T>[];

  /** Selection mode */
  mode?: 'single' | 'multi';

  /** Current value (controlled) */
  value?: T | T[];
  /** Change handler */
  onChange?: (value: T | T[]) => void;
  /** Default value (uncontrolled) */
  defaultValue?: T | T[];

  /** Enable search input */
  searchable?: boolean;
  /** Search input placeholder */
  searchPlaceholder?: string;
  /** External search handler (for async) */
  onSearch?: (query: string) => void;
  /** Custom filter function */
  filterFn?: (option: DropdownOption<T>, query: string) => boolean;

  /** Placeholder text when no selection */
  placeholder?: string;
  /** Custom option renderer */
  renderOption?: (option: DropdownOption<T>, state: OptionState) => ReactNode;
  /** Custom selected value renderer */
  renderValue?: (selected: DropdownOption<T> | DropdownOption<T>[]) => ReactNode;

  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Full width */
  fullWidth?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Error state */
  error?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Show clear button */
  clearable?: boolean;

  /** Menu position */
  position?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';

  /** Close menu after selection (default: true for single, false for multi) */
  closeOnSelect?: boolean;

  /** Additional class name */
  className?: string;
  /** ID for accessibility */
  id?: string;
  /** Name for form submission */
  name?: string;
  /** Aria label */
  'aria-label'?: string;
}

// Chevron icon
const ChevronIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M4.47 5.47a.75.75 0 011.06 0L8 7.94l2.47-2.47a.75.75 0 111.06 1.06l-3 3a.75.75 0 01-1.06 0l-3-3a.75.75 0 010-1.06z" />
  </svg>
);

// Clear icon
const ClearIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M4 4l6 6M10 4l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// Check icon for multi-select
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
    <path d="M11.354 4.354a.5.5 0 00-.708-.708L5.5 8.793 3.354 6.646a.5.5 0 10-.708.708l2.5 2.5a.5.5 0 00.708 0l5.5-5.5z" />
  </svg>
);

// Spinner for loading state
const LoadingSpinner = () => (
  <svg className={styles.spinner} width="16" height="16" viewBox="0 0 16 16">
    <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="32" strokeLinecap="round" />
  </svg>
);

export function Dropdown<T = string>({
  options,
  mode = 'single',
  value: controlledValue,
  onChange,
  defaultValue,
  searchable = false,
  searchPlaceholder = 'Search...',
  onSearch,
  filterFn,
  placeholder = 'Select...',
  renderOption,
  renderValue,
  size = 'md',
  fullWidth = false,
  disabled = false,
  error = false,
  loading = false,
  clearable = false,
  position = 'bottom-start',
  closeOnSelect,
  className,
  id,
  name,
  'aria-label': ariaLabel,
}: DropdownProps<T>) {
  // Controlled vs uncontrolled value
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState<T | T[] | undefined>(defaultValue);
  const value = isControlled ? controlledValue : internalValue;

  // State
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuPosition, setMenuPosition] = useState<{ top: number; left?: number; right?: number; width: number }>({ top: 0, left: 0, width: 0 });

  // Refs
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Determine if we should close on select
  const shouldCloseOnSelect = closeOnSelect ?? mode === 'single';

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery) return options;

    const defaultFilter = (opt: DropdownOption<T>, query: string) =>
      opt.label.toLowerCase().includes(query.toLowerCase());

    const filter = filterFn || defaultFilter;
    return options.filter((opt) => filter(opt, searchQuery));
  }, [options, searchQuery, filterFn]);

  // Get selected options
  const selectedOptions = useMemo(() => {
    if (value === undefined) return [];
    const values = Array.isArray(value) ? value : [value];
    return options.filter((opt) => values.includes(opt.value));
  }, [options, value]);

  // Handle value change
  const handleValueChange = useCallback(
    (newValue: T | T[]) => {
      if (!isControlled) {
        setInternalValue(newValue);
      }
      onChange?.(newValue);
    },
    [isControlled, onChange]
  );

  // Handle option select
  const handleSelect = useCallback(
    (option: DropdownOption<T>) => {
      if (option.disabled) return;

      if (mode === 'single') {
        handleValueChange(option.value);
        if (shouldCloseOnSelect) {
          setIsOpen(false);
          setSearchQuery('');
          triggerRef.current?.focus();
        }
      } else {
        // Multi-select: toggle option
        const currentValues = Array.isArray(value) ? value : value !== undefined ? [value] : [];
        const isSelected = currentValues.includes(option.value);

        const newValues = isSelected
          ? currentValues.filter((v) => v !== option.value)
          : [...currentValues, option.value];

        handleValueChange(newValues as T[]);

        if (shouldCloseOnSelect) {
          setIsOpen(false);
          setSearchQuery('');
          triggerRef.current?.focus();
        }
      }
    },
    [mode, value, handleValueChange, shouldCloseOnSelect]
  );

  // Handle clear
  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      handleValueChange(mode === 'single' ? (undefined as unknown as T) : ([] as unknown as T[]));
      triggerRef.current?.focus();
    },
    [mode, handleValueChange]
  );

  // Handle chip remove (multi-select)
  const handleChipRemove = useCallback(
    (optionValue: T) => {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.filter((v) => v !== optionValue);
      handleValueChange(newValues as T[]);
    },
    [value, handleValueChange]
  );

  // Calculate menu position
  const calculatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const menuHeight = 300; // Approximate max-height from CSS
    const estimatedMenuWidth = Math.max(rect.width, 200); // For collision detection only
    const gap = 4;
    const viewportPadding = 8;
    // Use clientWidth to exclude scrollbar from calculations
    const viewportWidth = document.documentElement.clientWidth;

    // Determine vertical position
    let top: number;
    let verticalPlacement = position.startsWith('bottom') ? 'bottom' : 'top';

    // Check if preferred vertical placement fits
    if (verticalPlacement === 'bottom') {
      const bottomSpace = window.innerHeight - rect.bottom - gap;
      if (bottomSpace < menuHeight && rect.top - gap > bottomSpace) {
        // Flip to top if more space above
        verticalPlacement = 'top';
      }
    } else {
      const topSpace = rect.top - gap;
      if (topSpace < menuHeight && window.innerHeight - rect.bottom - gap > topSpace) {
        // Flip to bottom if more space below
        verticalPlacement = 'bottom';
      }
    }

    top = verticalPlacement === 'bottom' ? rect.bottom + gap : rect.top - menuHeight - gap;

    // Vertical safety bounds
    if (top < viewportPadding) {
      top = viewportPadding;
    }

    // Determine horizontal position
    // Use 'right' CSS property for end alignment, 'left' for start alignment
    const preferEnd = position.endsWith('end');

    if (preferEnd) {
      // For 'end' alignment: use CSS 'right' so menu's right edge aligns with trigger's right edge
      const right = viewportWidth - rect.right;

      // Check for left overflow - if menu would extend past left edge, fall back to left positioning
      if (rect.right - estimatedMenuWidth < viewportPadding) {
        setMenuPosition({ top, left: viewportPadding, right: undefined, width: rect.width });
      } else {
        setMenuPosition({ top, left: undefined, right, width: rect.width });
      }
    } else {
      // For 'start' alignment: use CSS 'left'
      let left = rect.left;

      // Check for right overflow
      if (left + estimatedMenuWidth > viewportWidth - viewportPadding) {
        // Try end alignment instead (use right positioning)
        const right = viewportWidth - rect.right;
        if (rect.right - estimatedMenuWidth >= viewportPadding) {
          setMenuPosition({ top, left: undefined, right, width: rect.width });
          return;
        }
        // Both would overflow, pin to right edge
        left = viewportWidth - estimatedMenuWidth - viewportPadding;
      }

      setMenuPosition({ top, left, right: undefined, width: rect.width });
    }
  }, [position]);

  // Open dropdown
  const openDropdown = useCallback(() => {
    if (disabled) return;
    calculatePosition();
    setIsOpen(true);
    setFocusedIndex(0);
  }, [disabled, calculatePosition]);

  // Close dropdown
  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setFocusedIndex(-1);
    setSearchQuery('');
  }, []);

  // Toggle dropdown
  const toggleDropdown = useCallback(() => {
    if (isOpen) {
      closeDropdown();
    } else {
      openDropdown();
    }
  }, [isOpen, closeDropdown, openDropdown]);

  // Type-to-select hook
  const { handleKeyPress: handleTypeToSelect } = useTypeToSelect({
    options: filteredOptions,
    isOpen,
    searchable,
    onMatch: (index) => {
      setFocusedIndex(index);
      if (!isOpen) {
        // When closed, also select the option
        const option = filteredOptions[index];
        if (option && !option.disabled) {
          handleSelect(option);
        }
      }
    },
    enabled: !disabled,
  });

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent) => {
      // Handle type-to-select for printable characters
      if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        if (!isOpen || !searchable) {
          handleTypeToSelect(event.key);
          if (!isOpen) return;
        }
      }

      switch (event.key) {
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (!isOpen) {
            openDropdown();
          } else if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
            handleSelect(filteredOptions[focusedIndex]);
          }
          break;

        case 'Escape':
          event.preventDefault();
          closeDropdown();
          triggerRef.current?.focus();
          break;

        case 'ArrowDown':
          event.preventDefault();
          if (!isOpen) {
            openDropdown();
          } else {
            const nextIndex = focusedIndex < filteredOptions.length - 1 ? focusedIndex + 1 : 0;
            // Skip disabled options
            let idx = nextIndex;
            while (filteredOptions[idx]?.disabled && idx !== focusedIndex) {
              idx = idx < filteredOptions.length - 1 ? idx + 1 : 0;
            }
            setFocusedIndex(idx);
          }
          break;

        case 'ArrowUp':
          event.preventDefault();
          if (!isOpen) {
            openDropdown();
          } else {
            const prevIndex = focusedIndex > 0 ? focusedIndex - 1 : filteredOptions.length - 1;
            // Skip disabled options
            let idx = prevIndex;
            while (filteredOptions[idx]?.disabled && idx !== focusedIndex) {
              idx = idx > 0 ? idx - 1 : filteredOptions.length - 1;
            }
            setFocusedIndex(idx);
          }
          break;

        case 'Home':
          event.preventDefault();
          if (isOpen) {
            const firstEnabled = filteredOptions.findIndex((opt) => !opt.disabled);
            if (firstEnabled >= 0) setFocusedIndex(firstEnabled);
          }
          break;

        case 'End':
          event.preventDefault();
          if (isOpen) {
            for (let i = filteredOptions.length - 1; i >= 0; i--) {
              if (!filteredOptions[i].disabled) {
                setFocusedIndex(i);
                break;
              }
            }
          }
          break;

        case 'Backspace':
          // In multi-select, remove last selected item if search is empty
          if (mode === 'multi' && searchable && !searchQuery && selectedOptions.length > 0) {
            event.preventDefault();
            const lastOption = selectedOptions[selectedOptions.length - 1];
            handleChipRemove(lastOption.value);
          }
          break;

        case 'Tab':
          closeDropdown();
          break;
      }
    },
    [
      isOpen,
      searchable,
      focusedIndex,
      filteredOptions,
      mode,
      searchQuery,
      selectedOptions,
      openDropdown,
      closeDropdown,
      handleSelect,
      handleTypeToSelect,
      handleChipRemove,
    ]
  );

  // Handle search input change
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      setSearchQuery(query);
      setFocusedIndex(0);
      onSearch?.(query);
    },
    [onSearch]
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

  // Focus search input when opening
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  // Scroll focused option into view
  useEffect(() => {
    if (isOpen && focusedIndex >= 0) {
      optionRefs.current[focusedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [isOpen, focusedIndex]);

  // Check if option is selected
  const isOptionSelected = useCallback(
    (option: DropdownOption<T>) => {
      if (value === undefined) return false;
      const values = Array.isArray(value) ? value : [value];
      return values.includes(option.value);
    },
    [value]
  );

  // Render selected value display
  const renderSelectedValue = () => {
    if (selectedOptions.length === 0) {
      return <span className={styles.placeholder}>{placeholder}</span>;
    }

    if (renderValue) {
      return renderValue(mode === 'single' ? selectedOptions[0] : selectedOptions);
    }

    if (mode === 'single') {
      const opt = selectedOptions[0];
      return (
        <span className={styles.selectedValue}>
          {opt.icon && <span className={styles.valueIcon}>{opt.icon}</span>}
          {opt.label}
        </span>
      );
    }

    // Multi-select: show chips
    return (
      <div className={styles.chips}>
        {selectedOptions.map((opt) => (
          <Chip
            key={String(opt.value)}
            size="sm"
            onRemove={() => handleChipRemove(opt.value)}
          >
            {opt.label}
          </Chip>
        ))}
      </div>
    );
  };

  // Render option
  const renderOptionItem = (option: DropdownOption<T>, index: number) => {
    const isSelected = isOptionSelected(option);
    const isFocused = index === focusedIndex;
    const state: OptionState = {
      selected: isSelected,
      focused: isFocused,
      disabled: !!option.disabled,
    };

    if (renderOption) {
      return (
        <button
          key={String(option.value)}
          ref={(el) => {
            optionRefs.current[index] = el;
          }}
          type="button"
          className={`${styles.option} ${isSelected ? styles.selected : ''} ${
            isFocused ? styles.focused : ''
          } ${option.disabled ? styles.disabled : ''}`}
          onClick={() => handleSelect(option)}
          disabled={option.disabled}
          role="option"
          aria-selected={isSelected}
          tabIndex={-1}
        >
          {renderOption(option, state)}
        </button>
      );
    }

    return (
      <button
        key={String(option.value)}
        ref={(el) => {
          optionRefs.current[index] = el;
        }}
        type="button"
        className={`${styles.option} ${isSelected ? styles.selected : ''} ${
          isFocused ? styles.focused : ''
        } ${option.disabled ? styles.disabled : ''}`}
        onClick={() => handleSelect(option)}
        onMouseEnter={() => setFocusedIndex(index)}
        disabled={option.disabled}
        role="option"
        aria-selected={isSelected}
        tabIndex={-1}
      >
        {mode === 'multi' && (
          <span className={`${styles.checkbox} ${isSelected ? styles.checked : ''}`}>
            {isSelected && <CheckIcon />}
          </span>
        )}
        {option.icon && <span className={styles.optionIcon}>{option.icon}</span>}
        <span className={styles.optionLabel}>{option.label}</span>
      </button>
    );
  };

  const hasValue = selectedOptions.length > 0;
  const showClearButton = clearable && hasValue && !disabled;

  const menuContent = isOpen && (
    <div
      ref={menuRef}
      className={styles.menu}
      style={{
        top: menuPosition.top,
        left: menuPosition.left,
        right: menuPosition.right,
        minWidth: menuPosition.width,
      }}
      role="listbox"
      aria-multiselectable={mode === 'multi'}
    >
      {searchable && (
        <div className={styles.searchWrapper}>
          <input
            ref={searchInputRef}
            type="text"
            className={styles.searchInput}
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            aria-label="Search options"
          />
        </div>
      )}
      <div className={styles.optionsList}>
        {loading ? (
          <div className={styles.loading}>
            <LoadingSpinner />
            <span>Loading...</span>
          </div>
        ) : filteredOptions.length === 0 ? (
          <div className={styles.empty}>No options found</div>
        ) : (
          filteredOptions.map((option, index) => renderOptionItem(option, index))
        )}
      </div>
    </div>
  );

  return (
    <div
      ref={wrapperRef}
      className={`${styles.wrapper} ${styles[size]} ${fullWidth ? styles.fullWidth : ''} ${
        error ? styles.error : ''
      } ${disabled ? styles.disabled : ''} ${className || ''}`}
    >
      <button
        ref={triggerRef}
        type="button"
        id={id}
        name={name}
        className={`${styles.trigger} ${isOpen ? styles.open : ''}`}
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
      >
        <div className={styles.valueContainer}>{renderSelectedValue()}</div>
        <div className={styles.indicators}>
          {loading && <LoadingSpinner />}
          {showClearButton && (
            <button
              type="button"
              className={styles.clearButton}
              onClick={handleClear}
              aria-label="Clear selection"
              tabIndex={-1}
            >
              <ClearIcon />
            </button>
          )}
          <span className={`${styles.arrow} ${isOpen ? styles.arrowOpen : ''}`}>
            <ChevronIcon />
          </span>
        </div>
      </button>
      {typeof document !== 'undefined' && createPortal(menuContent, document.body)}
    </div>
  );
}

Dropdown.displayName = 'Dropdown';
