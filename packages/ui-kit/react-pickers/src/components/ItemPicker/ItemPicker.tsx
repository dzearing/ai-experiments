import { useState, useCallback, useRef, useEffect, type ChangeEvent, type KeyboardEvent } from 'react';
import { Input, Button } from '@ui-kit/react';
import { FolderIcon } from '@ui-kit/icons/FolderIcon';
import { ItemPickerDialog, type FolderEntry } from '../ItemPickerDialog';
import styles from './ItemPicker.module.css';

export interface ItemPickerProps {
  /** Current path value */
  value?: string;
  /** Callback when path changes */
  onChange: (path: string) => void;
  /** Placeholder text when editing */
  placeholder?: string;
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** Label for the picker */
  label?: string;
  /** Error message to display */
  error?: string;
  /** Whether to validate the path exists (requires server validation) */
  validatePath?: (path: string) => Promise<boolean>;
  /** Callback to browse for folder (for Electron/native contexts) */
  onBrowse?: () => Promise<string | null>;
  /** Callback to list directory contents - enables the item picker dialog */
  onListDirectory?: (path: string) => Promise<FolderEntry[]>;
  /** Root paths for the item picker dialog */
  rootPaths?: FolderEntry[];
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional class name */
  className?: string;
  /** Button label when no path is set */
  selectLabel?: string;
  /** Dialog title */
  dialogTitle?: string;
}

/**
 * ItemPicker component
 *
 * A specialized input for selecting file/folder paths with:
 * - "Select path" button when no value is set
 * - Clear visual indication of purpose (folder icon)
 * - Optional browse button for native file dialogs
 * - Path validation support
 * - Consistent styling with Input component
 */
export function ItemPicker({
  value = '',
  onChange,
  placeholder = '/path/to/item',
  disabled = false,
  label,
  error,
  validatePath,
  onBrowse,
  onListDirectory,
  rootPaths,
  size = 'md',
  className,
  selectLabel = 'Select path',
  dialogTitle = 'Select Item',
}: ItemPickerProps) {
  const [localValue, setLocalValue] = useState(value);
  const [isEditing, setIsEditing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const validateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local value with prop value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  // Debounced validation
  const validatePathDebounced = useCallback(
    async (path: string) => {
      if (!validatePath || !path.trim()) {
        setValidationError(null);
        return;
      }

      setIsValidating(true);
      try {
        const isValid = await validatePath(path);
        if (!isValid) {
          setValidationError('Path does not exist');
        } else {
          setValidationError(null);
        }
      } catch {
        setValidationError('Unable to validate path');
      } finally {
        setIsValidating(false);
      }
    },
    [validatePath]
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue);

      // Clear existing validation timeout
      if (validateTimeoutRef.current) {
        clearTimeout(validateTimeoutRef.current);
      }

      // Debounce validation
      if (validatePath) {
        validateTimeoutRef.current = setTimeout(() => {
          validatePathDebounced(newValue);
        }, 500);
      }
    },
    [validatePath, validatePathDebounced]
  );

  const handleBlur = useCallback(() => {
    // Commit value on blur
    if (localValue !== value) {
      onChange(localValue);
    }
    // Exit edit mode if there's no value
    if (!localValue.trim()) {
      setIsEditing(false);
    }
  }, [localValue, value, onChange]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (localValue !== value) {
          onChange(localValue);
        }
        inputRef.current?.blur();
        if (!localValue.trim()) {
          setIsEditing(false);
        }
      } else if (e.key === 'Escape') {
        setLocalValue(value);
        setIsEditing(false);
        inputRef.current?.blur();
      }
    },
    [localValue, value, onChange]
  );

  const handleSelectClick = useCallback(() => {
    if (disabled) return;

    // If onListDirectory is provided, open the item picker dialog
    if (onListDirectory) {
      setDialogOpen(true);
      return;
    }

    // If onBrowse is provided, use it to open native picker
    if (onBrowse) {
      onBrowse().then((selectedPath) => {
        if (selectedPath) {
          setLocalValue(selectedPath);
          onChange(selectedPath);
          setValidationError(null);
        }
      }).catch(() => {
        // Browse was cancelled or failed, fall back to editing mode
        setIsEditing(true);
      });
      return;
    }

    // Otherwise, just enter editing mode
    setIsEditing(true);
  }, [onBrowse, onListDirectory, disabled, onChange]);

  const handleDialogClose = useCallback(() => {
    setDialogOpen(false);
  }, []);

  const handleDialogSelect = useCallback((path: string) => {
    setLocalValue(path);
    onChange(path);
    setValidationError(null);
    setDialogOpen(false);
  }, [onChange]);

  const displayError = error || validationError;
  const hasValue = !!value.trim();
  const showInput = isEditing || hasValue;

  return (
    <div className={`${styles.itemPicker} ${className || ''}`}>
      {label && <label className={styles.label}>{label}</label>}

      {showInput ? (
        <div className={styles.inputWrapper}>
          <span className={styles.leadingIcon}>
            <FolderIcon size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />
          </span>
          <Input
            ref={inputRef}
            type="text"
            value={localValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            size={size}
            className={styles.input}
            aria-invalid={!!displayError}
            aria-describedby={displayError ? 'item-picker-error' : undefined}
          />
        </div>
      ) : (
        <Button
          variant="ghost"
          size={size}
          icon={<FolderIcon />}
          onClick={handleSelectClick}
          disabled={disabled}
          className={styles.selectButton}
        >
          {selectLabel}
        </Button>
      )}

      {displayError && (
        <span id="item-picker-error" className={styles.error}>
          {displayError}
        </span>
      )}
      {isValidating && <span className={styles.validating}>Validating...</span>}

      {/* Item picker dialog */}
      {onListDirectory && (
        <ItemPickerDialog
          open={dialogOpen}
          onClose={handleDialogClose}
          onSelect={handleDialogSelect}
          onListDirectory={onListDirectory}
          initialPath={value}
          rootPaths={rootPaths}
          title={dialogTitle}
        />
      )}
    </div>
  );
}

ItemPicker.displayName = 'ItemPicker';
