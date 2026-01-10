import { useState, useCallback, forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import { Input, IconButton } from '@ui-kit/react';
import { TrashIcon } from '@ui-kit/icons/TrashIcon';
import styles from './TopicProperties.module.css';

export interface TopicPropertiesRef {
  startAdd: () => void;
}

interface TopicPropertiesProps {
  properties: Record<string, string>;
  onChange: (properties: Record<string, string>) => Promise<void>;
  disabled?: boolean;
}

interface PropertyEntry {
  key: string;
  value: string;
  isNew?: boolean;
}

export const TopicProperties = forwardRef<TopicPropertiesRef, TopicPropertiesProps>(
  function TopicProperties({ properties, onChange, disabled }, ref) {
  const [entries, setEntries] = useState<PropertyEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const newKeyInputRef = useRef<HTMLInputElement>(null);
  const newValueInputRef = useRef<HTMLInputElement>(null);

  // Sync entries from props
  useEffect(() => {
    setEntries(
      Object.entries(properties).map(([key, value]) => ({ key, value }))
    );
  }, [properties]);

  // Add a new empty row
  const handleStartAdd = useCallback(() => {
    setEntries(prev => [...prev, { key: '', value: '', isNew: true }]);
    // Focus the new key input after render
    setTimeout(() => newKeyInputRef.current?.focus(), 0);
  }, []);

  // Expose startAdd method via ref
  useImperativeHandle(ref, () => ({
    startAdd: handleStartAdd,
  }), [handleStartAdd]);

  const handleRemove = useCallback(async (index: number) => {
    const entry = entries[index];

    // If it's a new unsaved row, just remove it locally
    if (entry.isNew) {
      setEntries(prev => prev.filter((_, i) => i !== index));
      return;
    }

    setIsSubmitting(true);
    try {
      const { [entry.key]: _, ...rest } = properties;
      await onChange(rest);
    } finally {
      setIsSubmitting(false);
    }
  }, [entries, properties, onChange]);

  const handleKeyChange = useCallback((index: number, newKey: string) => {
    // Update local state immediately for responsiveness
    setEntries(prev => prev.map((e, i) =>
      i === index ? { ...e, key: newKey } : e
    ));
  }, []);

  const handleValueChange = useCallback((index: number, newValue: string) => {
    // Update local state immediately for responsiveness
    setEntries(prev => prev.map((e, i) =>
      i === index ? { ...e, value: newValue } : e
    ));
  }, []);

  const handleKeyBlur = useCallback(async (index: number) => {
    const entry = entries[index];

    // Don't save if key is empty
    if (!entry.key.trim()) {
      // Remove empty new entries
      if (entry.isNew) {
        setEntries(prev => prev.filter((_, i) => i !== index));
      }
      return;
    }

    // Save to server
    setIsSubmitting(true);
    try {
      const newProps = { ...properties };
      // If key changed for an existing entry, remove old key
      const oldKey = Object.keys(properties).find((k, i) => i === index && k !== entry.key.trim());
      if (oldKey) {
        delete newProps[oldKey];
      }
      newProps[entry.key.trim()] = entry.value;
      await onChange(newProps);
    } finally {
      setIsSubmitting(false);
    }
  }, [entries, properties, onChange]);

  const handleValueBlur = useCallback(async (index: number) => {
    const entry = entries[index];

    // Don't save if key is empty
    if (!entry.key.trim()) return;

    // Save to server
    setIsSubmitting(true);
    try {
      await onChange({
        ...properties,
        [entry.key.trim()]: entry.value,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [entries, properties, onChange]);

  const handleKeyKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      // Move focus to value input
      e.preventDefault();
      newValueInputRef.current?.focus();
    } else if (e.key === 'Escape') {
      const entry = entries[index];
      if (entry.isNew && !entry.key.trim()) {
        setEntries(prev => prev.filter((_, i) => i !== index));
      }
    }
  }, [entries]);

  const handleValueKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Escape') {
      const entry = entries[index];
      if (entry.isNew && !entry.key.trim()) {
        setEntries(prev => prev.filter((_, i) => i !== index));
      }
    }
  }, [entries]);

  return (
    <div className={styles.container}>
      {entries.length > 0 && (
        <div className={styles.grid}>
          {entries.map((entry, index) => (
            <div key={entry.isNew ? `new-${index}` : entry.key} className={styles.row}>
              <Input
                ref={entry.isNew ? newKeyInputRef : undefined}
                value={entry.key}
                onChange={(e) => handleKeyChange(index, e.target.value)}
                onBlur={() => handleKeyBlur(index)}
                onKeyDown={(e) => handleKeyKeyDown(e, index)}
                placeholder="Key"
                disabled={disabled || isSubmitting}
                className={styles.keyInput}
              />
              <Input
                ref={entry.isNew ? newValueInputRef : undefined}
                value={entry.value}
                onChange={(e) => handleValueChange(index, e.target.value)}
                onBlur={() => handleValueBlur(index)}
                onKeyDown={(e) => handleValueKeyDown(e, index)}
                placeholder="Value"
                disabled={disabled || isSubmitting}
                className={styles.valueInput}
              />
              <IconButton
                icon={<TrashIcon />}
                variant="ghost"
                onClick={() => handleRemove(index)}
                disabled={disabled || isSubmitting}
                aria-label={`Remove ${entry.key || 'property'}`}
              />
            </div>
          ))}
        </div>
      )}
      {entries.length === 0 && (
        <p className={styles.empty}>No properties defined</p>
      )}
    </div>
  );
});
