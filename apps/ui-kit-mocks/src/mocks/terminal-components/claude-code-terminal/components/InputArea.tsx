import React, { KeyboardEvent } from 'react';
import styles from './InputArea.module.css';

interface InputAreaProps {
  input: string;
  inputMode: 'single-line' | 'multi-line';
  currentMode: 'default' | 'plan';
  isRememberMode: boolean;
  autoComplete: string[];
  autoCompleteIndex: number;
  isMac: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  onInputChange: (value: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
}

export const InputArea: React.FC<InputAreaProps> = ({
  input,
  inputMode,
  currentMode,
  isRememberMode,
  autoComplete,
  autoCompleteIndex,
  isMac,
  inputRef,
  onInputChange,
  onKeyDown,
}) => {
  return (
    <>
      {autoComplete.length > 0 && (
        <div className={styles.autoComplete}>
          {autoComplete.map((cmd, idx) => (
            <div 
              key={cmd}
              className={`${styles.autoCompleteItem} ${idx === autoCompleteIndex ? styles.selected : ''}`}
            >
              /{cmd}
            </div>
          ))}
        </div>
      )}
      <div className={styles.inputArea}>
        <div className={styles.inputWrapper}>
          <span className={`${styles.modeBadge} ${
            isRememberMode ? styles.modeBadgeRemember : 
            currentMode === 'plan' ? styles.modeBadgePlan : 
            styles.modeBadgeExecute
          }`}>
            {isRememberMode ? 'Remember' : currentMode === 'plan' ? 'Plan' : 'Execute'} {inputMode === 'multi-line' ? '↵' : '↲'}
          </span>
          <textarea
            ref={inputRef}
            className={`${styles.input} ${
              isRememberMode ? styles.inputRemember : 
              currentMode === 'plan' ? styles.inputPlan : 
              styles.inputExecute
            }`}
            value={isRememberMode && input.startsWith('#') ? input.slice(1) : input}
            onChange={(e) => {
              const newValue = e.target.value;
              if (isRememberMode) {
                // In remember mode, prepend # to the actual stored value
                onInputChange('#' + newValue);
              } else {
                onInputChange(newValue);
              }
            }}
            onKeyDown={onKeyDown}
            placeholder="Type a prompt or /help for commands"
            disabled={false}
            aria-label="Terminal input"
            rows={1}
          />
        </div>
        <div className={styles.helperText}>
          {inputMode === 'single-line' ? 'Enter to submit' : `${isMac ? '⌘' : 'Ctrl'}-Enter to submit`} • {isMac ? '⌘' : 'Ctrl'}↓ to toggle input mode • Shift-Tab to change modes
        </div>
      </div>
    </>
  );
};