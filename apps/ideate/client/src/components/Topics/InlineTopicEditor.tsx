import { useRef, useEffect, useCallback } from 'react';
import { Input } from '@ui-kit/react';
import styles from './InlineTopicEditor.module.css';

export interface PendingTopic {
  /** Temporary ID for tracking */
  tempId: string;
  /** Topic name being edited */
  name: string;
  /** Parent ID (null = root level) */
  parentId: string | null;
  /** Indent level for visual display */
  depth: number;
}

interface InlineTopicEditorProps {
  /** The pending topic being edited */
  item: PendingTopic;
  /** Whether this input should have focus */
  isFocused: boolean;
  /** Called when the name changes */
  onChange: (tempId: string, name: string) => void;
  /** Called when Enter is pressed (save and create next) */
  onCommit: (tempId: string) => void;
  /** Called when Escape is pressed or Enter on empty */
  onCancel: (tempId: string) => void;
  /** Called when Shift+Right is pressed (demote/indent) */
  onDemote: (tempId: string) => void;
  /** Called when Shift+Left is pressed (promote/outdent) */
  onPromote: (tempId: string) => void;
  /** Called when the input receives focus */
  onFocus: (tempId: string) => void;
}

export function InlineTopicEditor({
  item,
  isFocused,
  onChange,
  onCommit,
  onCancel,
  onDemote,
  onPromote,
  onFocus,
}: InlineTopicEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the input when isFocused changes to true
  useEffect(() => {
    if (isFocused && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isFocused]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (item.name.trim()) {
        onCommit(item.tempId);
      } else {
        onCancel(item.tempId);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel(item.tempId);
    } else if (e.key === 'ArrowRight' && e.shiftKey) {
      e.preventDefault();
      onDemote(item.tempId);
    } else if (e.key === 'ArrowLeft' && e.shiftKey) {
      e.preventDefault();
      onPromote(item.tempId);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        onPromote(item.tempId);
      } else {
        onDemote(item.tempId);
      }
    }
  }, [item.tempId, item.name, onCommit, onCancel, onDemote, onPromote]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(item.tempId, e.target.value);
  }, [item.tempId, onChange]);

  const handleFocus = useCallback(() => {
    onFocus(item.tempId);
  }, [item.tempId, onFocus]);

  return (
    <div
      className={styles.editor}
      style={{ paddingLeft: `${item.depth * 20}px` }}
    >
      <Input
        ref={inputRef}
        value={item.name}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        placeholder="New topic..."
        aria-label="New topic name"
        autoFocus={isFocused}
        fullWidth
      />
    </div>
  );
}
