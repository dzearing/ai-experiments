import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDownIcon } from '@claude-flow/ui-kit-icons';
import styles from './Dropdown.module.css';
import cx from 'clsx';

export interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface DropdownProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Dropdown options */
  options: DropdownOption[];
  /** Current value (controlled) */
  value?: string;
  /** Default value (uncontrolled) */
  defaultValue?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Change handler */
  onChange?: (value: string) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Error state */
  error?: boolean;
  /** Full width */
  fullWidth?: boolean;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Label text */
  label?: string;
  /** Helper text */
  helperText?: string;
  /** Error message */
  errorMessage?: string;
  /** Required field */
  required?: boolean;
}

export const Dropdown = React.forwardRef<HTMLSelectElement, DropdownProps>((
  {
    options,
    value,
    defaultValue,
    placeholder = 'Select an option',
    onChange,
    disabled = false,
    error = false,
    fullWidth = false,
    size = 'medium',
    label,
    helperText,
    errorMessage,
    required = false,
    className,
    ...props
  }, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0, isAbove: false });
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  const [searchString, setSearchString] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Use controlled value if provided, otherwise use internal state
  const currentValue = value !== undefined ? value : internalValue;
  const selectedOption = options.find(opt => opt.value === currentValue);
  const selectedIndex = options.findIndex(opt => opt.value === currentValue);

  // Clean up typeahead timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchString('');
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault();
        setIsOpen(false);
        setFocusedIndex(-1);
        buttonRef.current?.focus();
      }
    };

    const handleScroll = (event: Event) => {
      // Only close dropdown if the scroll is not within the menu itself
      if (menuRef.current && menuRef.current.contains(event.target as Node)) {
        return; // Don't close if scrolling within the menu
      }
      // Close dropdown on external scroll to avoid positioning issues
      setIsOpen(false);
      setFocusedIndex(-1);
      setSearchString('');
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      window.addEventListener('scroll', handleScroll, true);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const updatePosition = () => {
        if (!buttonRef.current) return;
        
        const rect = buttonRef.current.getBoundingClientRect();
        const spacing = 4; // spacing-small5 equivalent
        
        // Calculate menu height more accurately
        const optionHeight = 36; // Approximate height per option based on padding
        const maxMenuHeight = 300; // From CSS max-height
        const estimatedMenuHeight = Math.min(options.length * optionHeight, maxMenuHeight);
        
        // Check if dropdown would go off screen bottom
        const viewportHeight = window.innerHeight;
        const spaceBelow = viewportHeight - rect.bottom - spacing;
        const spaceAbove = rect.top - spacing;
        const wouldOverflowBottom = estimatedMenuHeight > spaceBelow;
        
        // Position menu above if it would overflow and there's more space above
        const shouldPositionAbove = wouldOverflowBottom && spaceAbove > spaceBelow;
        
        setMenuPosition({
          top: shouldPositionAbove ? rect.top - spacing : rect.bottom + spacing,
          left: rect.left,
          width: rect.width,
          isAbove: shouldPositionAbove,
        });
      };
      
      updatePosition();
      
      // Update position on window resize
      window.addEventListener('resize', updatePosition);
      
      // Set initial focus (skip disabled options)
      let initialIndex = selectedIndex >= 0 && !options[selectedIndex]?.disabled ? selectedIndex : 0;
      while (initialIndex < options.length && options[initialIndex]?.disabled) {
        initialIndex++;
      }
      if (initialIndex < options.length) {
        setFocusedIndex(initialIndex);
      }
      
      return () => {
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen, selectedIndex, options.length]);

  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && optionRefs.current[focusedIndex]) {
      // Small delay to ensure the portal is rendered
      setTimeout(() => {
        const option = optionRefs.current[focusedIndex];
        option?.focus();
        // Ensure the focused option is visible in the scrollable menu
        option?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }, 0);
    }
  }, [isOpen, focusedIndex]);

  const handleSelect = (option: DropdownOption) => {
    if (!option.disabled) {
      // Update internal state for uncontrolled mode
      if (value === undefined) {
        setInternalValue(option.value);
      }
      // Always call onChange if provided
      onChange?.(option.value);
      setIsOpen(false);
      setFocusedIndex(-1);
      setSearchString('');
      buttonRef.current?.focus();
    }
  };

  const handleTypeahead = (key: string) => {
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Update search string
    const newSearchString = searchString + key.toLowerCase();
    setSearchString(newSearchString);

    // Find first matching option
    const matchIndex = options.findIndex((option, index) => {
      // Skip disabled options
      if (option.disabled) return false;
      // Check if label starts with search string
      return option.label.toLowerCase().startsWith(newSearchString);
    });

    if (matchIndex >= 0) {
      setFocusedIndex(matchIndex);
      // If dropdown is closed, select the item directly
      if (!isOpen) {
        handleSelect(options[matchIndex]);
      }
    }

    // Reset search string after 1 second of inactivity
    searchTimeoutRef.current = setTimeout(() => {
      setSearchString('');
    }, 1000);
  };

  const containerClasses = cx(
    styles.root,
    fullWidth && styles.fullWidth,
    className
  );

  const buttonClasses = cx(
    styles.button,
    styles[size],
    error && styles.error,
    disabled && styles.disabled,
    isOpen && styles.open,
    isOpen && styles.menuOpen
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        }
        break;
      default:
        // Handle typeahead for single character keys
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          event.preventDefault();
          handleTypeahead(event.key);
        }
        break;
    }
  };

  const handleOptionKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        handleSelect(options[index]);
        break;
      case 'ArrowDown':
        event.preventDefault();
        let nextIndex = index + 1;
        while (nextIndex < options.length && options[nextIndex].disabled) {
          nextIndex++;
        }
        if (nextIndex < options.length) {
          setFocusedIndex(nextIndex);
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        let prevIndex = index - 1;
        while (prevIndex >= 0 && options[prevIndex].disabled) {
          prevIndex--;
        }
        if (prevIndex >= 0) {
          setFocusedIndex(prevIndex);
        }
        break;
      case 'Home':
        event.preventDefault();
        let firstIndex = 0;
        while (firstIndex < options.length && options[firstIndex].disabled) {
          firstIndex++;
        }
        if (firstIndex < options.length) {
          setFocusedIndex(firstIndex);
        }
        break;
      case 'End':
        event.preventDefault();
        let lastIndex = options.length - 1;
        while (lastIndex >= 0 && options[lastIndex].disabled) {
          lastIndex--;
        }
        if (lastIndex >= 0) {
          setFocusedIndex(lastIndex);
        }
        break;
      case 'Tab':
        event.preventDefault();
        if (event.shiftKey) {
          // Shift+Tab: if on first item, go back to dropdown button
          if (index === 0 || options.slice(0, index).every(opt => opt.disabled)) {
            setIsOpen(false);
            setFocusedIndex(-1);
            setSearchString('');
            buttonRef.current?.focus();
          } else {
            // Move to previous non-disabled option
            let prevIndex = index - 1;
            while (prevIndex >= 0 && options[prevIndex].disabled) {
              prevIndex--;
            }
            if (prevIndex >= 0) {
              setFocusedIndex(prevIndex);
            }
          }
        } else {
          // Tab: if on last item, go back to dropdown button
          const lastEnabledIndex = options.findLastIndex(opt => !opt.disabled);
          if (index === lastEnabledIndex) {
            setIsOpen(false);
            setFocusedIndex(-1);
            setSearchString('');
            buttonRef.current?.focus();
          } else {
            // Move to next non-disabled option
            let nextIndex = index + 1;
            while (nextIndex < options.length && options[nextIndex].disabled) {
              nextIndex++;
            }
            if (nextIndex < options.length) {
              setFocusedIndex(nextIndex);
            }
          }
        }
        break;
      case 'Escape':
        event.preventDefault();
        setIsOpen(false);
        setFocusedIndex(-1);
        setSearchString('');
        buttonRef.current?.focus();
        break;
      default:
        // Handle typeahead for single character keys
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          event.preventDefault();
          handleTypeahead(event.key);
        }
        break;
    }
  };

  return (
    <div className={containerClasses} {...props}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      
      <div className={styles.dropdown} ref={dropdownRef}>
        <button
          ref={buttonRef}
          type="button"
          className={buttonClasses}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className={styles.value}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDownIcon className={styles.icon} size={20} />
        </button>
      </div>
      
      {/* Hidden select for ref and form support */}
      <select
        ref={ref}
        value={currentValue}
        onChange={(e) => {
          if (value === undefined) {
            setInternalValue(e.target.value);
          }
          onChange?.(e.target.value);
        }}
        disabled={disabled}
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
        aria-hidden="true"
        tabIndex={-1}
      >
        <option value="">{placeholder}</option>
        {options.map(option => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>

      {isOpen && createPortal(
        <div 
          ref={menuRef}
          className={cx(styles.menu, menuPosition.isAbove && styles.menuAbove)} 
          role="listbox"
          style={{
            position: 'fixed',
            top: menuPosition.isAbove ? 'auto' : `${menuPosition.top}px`,
            bottom: menuPosition.isAbove ? `${window.innerHeight - menuPosition.top}px` : 'auto',
            left: `${menuPosition.left}px`,
            width: `${menuPosition.width}px`,
          }}
        >
          {options.map((option, index) => (
            <button
              key={option.value}
              ref={(el) => { optionRefs.current[index] = el; }}
              type="button"
              className={cx(
                styles.option,
                option.disabled && styles.optionDisabled,
                option.value === currentValue && styles.selected,
                focusedIndex === index && styles.focused
              )}
              onClick={() => handleSelect(option)}
              onKeyDown={(e) => handleOptionKeyDown(e, index)}
              disabled={option.disabled}
              role="option"
              aria-selected={option.value === currentValue}
              tabIndex={focusedIndex === index ? 0 : -1}
            >
              {option.label}
            </button>
          ))}
        </div>,
        document.body
      )}

      {(helperText || (error && errorMessage)) && (
        <div className={cx(
          styles.helperText,
          error && styles.errorText
        )}>
          {error && errorMessage ? errorMessage : helperText}
        </div>
      )}
    </div>
  );
});

Dropdown.displayName = 'Dropdown';