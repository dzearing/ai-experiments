import { useCallback, useRef, useEffect, type KeyboardEvent } from 'react';
import { useTheme } from '../../contexts/ThemeContextV2';
import type { ClaudeMode } from '../../contexts/ClaudeCodeContext';

interface ClaudeInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onModeChange: (mode: ClaudeMode) => void;
  mode: ClaudeMode;
  contextUsage: number;
  isSubmitting: boolean;
  isConnected: boolean;
}

export function ClaudeInput({
  value,
  onChange,
  onSubmit,
  onModeChange,
  mode,
  contextUsage,
  isSubmitting,
  isConnected
}: ClaudeInputProps) {
  const { currentStyles } = useTheme();
  const styles = currentStyles;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [value]);
  
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Shift+Tab to cycle modes
    if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault();
      const modes: ClaudeMode[] = ['default', 'plan', 'auto-accept'];
      const currentIndex = modes.indexOf(mode);
      const nextIndex = (currentIndex + 1) % modes.length;
      onModeChange(modes[nextIndex]);
      return;
    }
    
    // Enter to submit (Shift+Enter for new line)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isSubmitting && isConnected) {
        onSubmit(value);
      }
    }
  }, [mode, onModeChange, value, isSubmitting, isConnected, onSubmit]);
  
  const getModeColor = () => {
    switch (mode) {
      case 'auto-accept':
        return 'text-green-600 dark:text-green-400';
      case 'plan':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return styles.mutedText;
    }
  };
  
  const getModeIcon = () => {
    switch (mode) {
      case 'auto-accept':
        return '✅';
      case 'plan':
        return '📋';
      default:
        return '💬';
    }
  };
  
  const getContextColor = () => {
    if (contextUsage >= 90) return 'text-red-600 dark:text-red-400';
    if (contextUsage >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return styles.mutedText;
  };
  
  return (
    <div className="p-4">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isConnected ? "Type a message... (Enter to send, Shift+Enter for new line)" : "Connecting..."}
          disabled={!isConnected || isSubmitting}
          className={`
            w-full px-4 py-3 pr-24
            ${styles.inputBg} ${styles.inputBorder} ${styles.inputText}
            ${styles.borderRadius} border
            focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500
            resize-none overflow-hidden
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          style={{ minHeight: '56px' }}
        />
        
        {/* Submit button */}
        <button
          onClick={() => value.trim() && !isSubmitting && isConnected && onSubmit(value)}
          disabled={!value.trim() || isSubmitting || !isConnected}
          className={`
            absolute right-2 top-3 px-3 py-1.5
            ${styles.primaryButton} ${styles.primaryButtonText}
            ${styles.buttonRadius}
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors duration-200
          `}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 bg-current rounded-full animate-pulse" />
              <span className="inline-block w-2 h-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '100ms' }} />
              <span className="inline-block w-2 h-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
            </span>
          ) : (
            'Send'
          )}
        </button>
      </div>
      
      {/* Status bar */}
      <div className="mt-2 flex items-center justify-between text-xs">
        {/* Mode indicator */}
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-1.5 ${getModeColor()}`}>
            <span>{getModeIcon()}</span>
            <span className="font-medium">
              {mode === 'auto-accept' ? 'Auto-accept' : mode === 'plan' ? 'Plan mode' : 'Default mode'}
            </span>
          </div>
          <span className={styles.mutedText}>
            Shift+Tab to change mode
          </span>
        </div>
        
        {/* Context usage */}
        <div className={`flex items-center gap-2 ${getContextColor()}`}>
          <span>Context:</span>
          <div className="flex items-center gap-1">
            <div className={`w-24 h-2 ${styles.contentBg} ${styles.contentBorder} border ${styles.borderRadius} overflow-hidden`}>
              <div 
                className={`h-full transition-all duration-300 ${
                  contextUsage >= 90 ? 'bg-red-500' : 
                  contextUsage >= 70 ? 'bg-yellow-500' : 
                  'bg-green-500'
                }`}
                style={{ width: `${contextUsage}%` }}
              />
            </div>
            <span className="font-medium">{contextUsage}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}