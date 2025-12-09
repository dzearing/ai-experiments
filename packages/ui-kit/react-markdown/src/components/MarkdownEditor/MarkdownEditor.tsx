/**
 * MarkdownEditor component
 *
 * Plain text markdown editor for editing raw markdown content.
 * Designed for simplicity and easy co-authoring cursor support.
 *
 * Surfaces used:
 * - inset (editor background)
 *
 * Tokens used:
 * - --inset-bg, --inset-border, --inset-text
 * - --font-mono
 * - --space-*, --radius-*
 */

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react';
import styles from './MarkdownEditor.module.css';

export interface MarkdownEditorProps {
  /** Initial markdown content (uncontrolled) */
  defaultValue?: string;
  /** Controlled markdown content */
  value?: string;
  /** Change handler for markdown output */
  onChange?: (markdown: string) => void;
  /** Editor height */
  height?: string | number;
  /** Min height */
  minHeight?: string | number;
  /** Max height */
  maxHeight?: string | number;
  /** Read-only mode */
  readOnly?: boolean;
  /** Auto-focus on mount */
  autoFocus?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Editor ready callback */
  onEditorReady?: (editor: MarkdownEditorRef) => void;
  /** Focus callback */
  onFocus?: () => void;
  /** Blur callback */
  onBlur?: () => void;
  /** Selection change callback (for cursor position) */
  onSelectionChange?: (start: number, end: number) => void;
  /** Show line numbers */
  showLineNumbers?: boolean;
  /** Tab size (spaces) */
  tabSize?: number;
  /** Additional class name */
  className?: string;
}

export interface MarkdownEditorRef {
  /** Get current markdown */
  getMarkdown: () => string;
  /** Set markdown content */
  setMarkdown: (markdown: string) => void;
  /** Focus editor */
  focus: () => void;
  /** Blur editor */
  blur: () => void;
  /** Get selection range */
  getSelection: () => { start: number; end: number };
  /** Set selection range */
  setSelection: (start: number, end: number) => void;
  /** Insert text at cursor */
  insertText: (text: string) => void;
  /** Get the textarea element */
  getElement: () => HTMLTextAreaElement | null;
}

export const MarkdownEditor = forwardRef<MarkdownEditorRef, MarkdownEditorProps>(
  function MarkdownEditor(
    {
      defaultValue = '',
      value,
      onChange,
      height,
      minHeight = '200px',
      maxHeight,
      readOnly = false,
      autoFocus = false,
      placeholder = 'Enter markdown...',
      onEditorReady,
      onFocus,
      onBlur,
      onSelectionChange,
      showLineNumbers = true,
      tabSize = 2,
      className,
    },
    ref
  ) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const lineNumbersRef = useRef<HTMLDivElement>(null);
    const [internalValue, setInternalValue] = useState(defaultValue);
    const [lineCount, setLineCount] = useState(1);

    // Determine if controlled
    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : internalValue;

    // Calculate line count
    useEffect(() => {
      const lines = currentValue.split('\n').length;
      setLineCount(lines);
    }, [currentValue]);

    // Handle text change
    const handleChange = useCallback(
      (e: ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        if (!isControlled) {
          setInternalValue(newValue);
        }
        onChange?.(newValue);
      },
      [isControlled, onChange]
    );

    // Handle tab key for indentation
    const handleKeyDown = useCallback(
      (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Tab') {
          e.preventDefault();
          const textarea = textareaRef.current;
          if (!textarea) return;

          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const spaces = ' '.repeat(tabSize);

          if (e.shiftKey) {
            // Outdent: Remove leading spaces from selected lines
            const afterSelection = currentValue.substring(end);

            // Find the start of the current line
            const lineStart = currentValue.substring(0, start).lastIndexOf('\n') + 1;
            const beforeLine = currentValue.substring(0, lineStart);
            const lineContent = currentValue.substring(lineStart, end);

            // Remove indentation from each line
            const outdentedLines = lineContent
              .split('\n')
              .map((line) => {
                if (line.startsWith(spaces)) {
                  return line.substring(tabSize);
                } else if (line.startsWith('\t')) {
                  return line.substring(1);
                }
                return line.replace(/^ +/, (match) =>
                  match.substring(0, Math.max(0, match.length - tabSize))
                );
              })
              .join('\n');

            const newValue = beforeLine + outdentedLines + afterSelection;
            if (!isControlled) {
              setInternalValue(newValue);
            }
            onChange?.(newValue);

            // Restore cursor position
            requestAnimationFrame(() => {
              if (textarea) {
                const diff = lineContent.length - outdentedLines.length;
                textarea.selectionStart = Math.max(lineStart, start - Math.min(diff, tabSize));
                textarea.selectionEnd = end - diff;
              }
            });
          } else {
            // Indent: Add spaces at cursor or indent selected lines
            if (start === end) {
              // No selection: insert spaces at cursor
              const newValue =
                currentValue.substring(0, start) + spaces + currentValue.substring(end);
              if (!isControlled) {
                setInternalValue(newValue);
              }
              onChange?.(newValue);

              // Move cursor after inserted spaces
              requestAnimationFrame(() => {
                if (textarea) {
                  textarea.selectionStart = textarea.selectionEnd = start + tabSize;
                }
              });
            } else {
              // Selection: indent each line
              const beforeSelection = currentValue.substring(0, start);
              const lineStart = beforeSelection.lastIndexOf('\n') + 1;
              const beforeLine = currentValue.substring(0, lineStart);
              const selectedText = currentValue.substring(lineStart, end);
              const afterSelection = currentValue.substring(end);

              const indentedLines = selectedText
                .split('\n')
                .map((line) => spaces + line)
                .join('\n');

              const newValue = beforeLine + indentedLines + afterSelection;
              if (!isControlled) {
                setInternalValue(newValue);
              }
              onChange?.(newValue);

              // Adjust selection
              requestAnimationFrame(() => {
                if (textarea) {
                  const lineCount = selectedText.split('\n').length;
                  textarea.selectionStart = start + tabSize;
                  textarea.selectionEnd = end + tabSize * lineCount;
                }
              });
            }
          }
        }
      },
      [currentValue, isControlled, onChange, tabSize]
    );

    // Handle scroll sync for line numbers
    const handleScroll = useCallback(() => {
      if (textareaRef.current && lineNumbersRef.current) {
        lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
      }
    }, []);

    // Handle selection change
    const handleSelect = useCallback(() => {
      if (textareaRef.current && onSelectionChange) {
        onSelectionChange(
          textareaRef.current.selectionStart,
          textareaRef.current.selectionEnd
        );
      }
    }, [onSelectionChange]);

    // Imperative handle
    const editorRef: MarkdownEditorRef = {
      getMarkdown: () => currentValue,
      setMarkdown: (markdown: string) => {
        if (!isControlled) {
          setInternalValue(markdown);
        }
      },
      focus: () => textareaRef.current?.focus(),
      blur: () => textareaRef.current?.blur(),
      getSelection: () => ({
        start: textareaRef.current?.selectionStart ?? 0,
        end: textareaRef.current?.selectionEnd ?? 0,
      }),
      setSelection: (start: number, end: number) => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = start;
          textareaRef.current.selectionEnd = end;
        }
      },
      insertText: (text: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newValue =
          currentValue.substring(0, start) + text + currentValue.substring(end);

        if (!isControlled) {
          setInternalValue(newValue);
        }
        onChange?.(newValue);

        requestAnimationFrame(() => {
          if (textarea) {
            textarea.selectionStart = textarea.selectionEnd = start + text.length;
          }
        });
      },
      getElement: () => textareaRef.current,
    };

    useImperativeHandle(ref, () => editorRef, [currentValue, isControlled, onChange]);

    // Notify when editor is ready
    useEffect(() => {
      if (onEditorReady) {
        onEditorReady(editorRef);
      }
    }, []);

    // Auto-focus
    useEffect(() => {
      if (autoFocus && textareaRef.current) {
        textareaRef.current.focus();
      }
    }, [autoFocus]);

    // Calculate style
    const containerStyle: React.CSSProperties = {
      height,
      minHeight,
      maxHeight,
    };

    // Generate line numbers
    const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

    const containerClasses = [
      styles.editorContainer,
      showLineNumbers && styles.hasLineNumbers,
      className,
    ].filter(Boolean).join(' ');

    return (
      <div
        className={containerClasses}
        style={containerStyle}
      >
        {showLineNumbers && (
          <div className={styles.lineNumbers} ref={lineNumbersRef} aria-hidden="true">
            {lineNumbers.map((num) => (
              <div key={num} className={styles.lineNumber}>
                {num}
              </div>
            ))}
          </div>
        )}
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          value={currentValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          onSelect={handleSelect}
          onFocus={onFocus}
          onBlur={onBlur}
          readOnly={readOnly}
          placeholder={placeholder}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          data-gramm="false"
        />
      </div>
    );
  }
);

export default MarkdownEditor;
