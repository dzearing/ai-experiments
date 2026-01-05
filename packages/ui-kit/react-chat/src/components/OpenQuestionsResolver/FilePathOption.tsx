import { useCallback } from 'react';
import { Input, Text } from '@ui-kit/react';
import styles from './OpenQuestionsResolver.module.css';

export interface FilePathOptionProps {
  /** Current file path value */
  value: string;
  /** Called when file path changes */
  onChange: (path: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Hint text to show below input */
  hint?: string;
  /** Whether this is for a folder (vs file) */
  isFolder?: boolean;
}

/**
 * FilePathOption - Component for entering a file or folder path
 *
 * Provides a simple text input with monospace font for path entry.
 * Could be extended with file browser integration in the future.
 */
export function FilePathOption({
  value,
  onChange,
  placeholder = 'Enter file or folder path...',
  hint = 'Enter an absolute path to a file or folder',
  isFolder: _isFolder,
}: FilePathOptionProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  return (
    <div className={styles.filePathContainer}>
      <Input
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        className={styles.filePathInput}
        aria-label="File path"
      />
      <Text size="sm" color="soft" className={styles.filePathHint}>
        {hint}
      </Text>
    </div>
  );
}

FilePathOption.displayName = 'FilePathOption';
