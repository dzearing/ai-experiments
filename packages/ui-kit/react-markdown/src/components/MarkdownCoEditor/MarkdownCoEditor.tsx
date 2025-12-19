/**
 * MarkdownCoEditor component
 *
 * A combined markdown editor and renderer with three view modes:
 * - Edit: Shows only the plain text markdown editor
 * - Preview: Shows only the rendered markdown
 * - Split: Shows both editor and preview side by side
 *
 * Uses Segmented for mode switching.
 * Uses plain text editor for easy co-authoring cursor support.
 *
 * Surfaces used:
 * - panel (container)
 * - inset (editor)
 *
 * Tokens used:
 * - --panel-bg, --panel-border
 * - --inset-bg, --inset-border
 * - --space-*, --radius-*
 */

import { useState, useRef, useImperativeHandle, forwardRef, useCallback, useEffect } from 'react';
import { Segmented, SplitPane, type SegmentOption, type SplitPaneOrientation } from '@ui-kit/react';
import { MarkdownEditor, type MarkdownEditorRef, type CoAuthor } from '../MarkdownEditor';
import { MarkdownRenderer } from '../MarkdownRenderer';
import styles from './MarkdownCoEditor.module.css';

export type { CoAuthor } from '../MarkdownEditor';

export type ViewMode = 'edit' | 'preview' | 'split';

// Scroll sync helper - sets scroll from percentage (0-1)
function setScrollPercent(element: HTMLElement, percent: number): void {
  const maxScroll = element.scrollHeight - element.clientHeight;
  element.scrollTop = percent * maxScroll;
}

// Scroll sync helper - gets scroll percentage (0-1)
function getScrollPercent(element: HTMLElement): number {
  const maxScroll = element.scrollHeight - element.clientHeight;
  return maxScroll > 0 ? element.scrollTop / maxScroll : 0;
}

export interface MarkdownCoEditorProps {
  /** Initial markdown content (uncontrolled) */
  defaultValue?: string;
  /** Controlled markdown content */
  value?: string;
  /** Change handler for markdown output */
  onChange?: (markdown: string) => void;
  /** Default view mode (uncontrolled) */
  defaultMode?: ViewMode;
  /** Controlled view mode */
  mode?: ViewMode;
  /** Callback when view mode changes */
  onModeChange?: (mode: ViewMode) => void;
  /** Show the mode switcher toolbar */
  showModeSwitch?: boolean;
  /** Content to render at the start (left) of the toolbar */
  toolbarStart?: React.ReactNode;
  /** Content to render at the end (right) of the toolbar */
  toolbarEnd?: React.ReactNode;
  /** Height of the editor container */
  height?: string | number;
  /** Min height */
  minHeight?: string | number;
  /** Max height */
  maxHeight?: string | number;
  /** Read-only mode (hides edit functionality) */
  readOnly?: boolean;
  /** Auto-focus on mount */
  autoFocus?: boolean;
  /** Placeholder text for the editor */
  placeholder?: string;
  /** Editor ready callback */
  onEditorReady?: (editor: MarkdownEditorRef) => void;
  /** Selection change callback (for cursor tracking) */
  onSelectionChange?: (start: number, end: number) => void;
  /** Show line numbers in editor */
  showLineNumbers?: boolean;
  /** Enable streaming in preview mode */
  streaming?: boolean;
  /** Streaming speed */
  streamingSpeed?: number;
  /** Split pane orientation (horizontal = side-by-side, vertical = stacked) */
  splitOrientation?: SplitPaneOrientation;
  /** Co-authors with their cursor positions */
  coAuthors?: CoAuthor[];
  /** Callback when co-author positions change (e.g., due to user typing) */
  onCoAuthorsChange?: (coAuthors: CoAuthor[]) => void;
  /** Full page mode - removes card styling for edge-to-edge layouts */
  fullPage?: boolean;
  /** Additional class name */
  className?: string;
}

export interface MarkdownCoEditorRef {
  /** Get editor ref */
  getEditor: () => MarkdownEditorRef | null;
  /** Get current markdown */
  getMarkdown: () => string;
  /** Set markdown content */
  setMarkdown: (markdown: string) => void;
  /** Focus editor */
  focus: () => void;
  /** Get current view mode */
  getMode: () => ViewMode;
  /** Set view mode */
  setMode: (mode: ViewMode) => void;
}

const VIEW_MODE_OPTIONS: SegmentOption[] = [
  { value: 'edit', label: 'Edit' },
  { value: 'split', label: 'Split' },
  { value: 'preview', label: 'Preview' },
];

export const MarkdownCoEditor = forwardRef<MarkdownCoEditorRef, MarkdownCoEditorProps>(
  function MarkdownCoEditor(
    {
      defaultValue = '',
      value,
      onChange,
      defaultMode = 'edit',
      mode: controlledMode,
      onModeChange,
      showModeSwitch = true,
      toolbarStart,
      toolbarEnd,
      height,
      minHeight = '300px',
      maxHeight,
      readOnly = false,
      autoFocus = false,
      placeholder = 'Enter markdown...',
      onEditorReady,
      onSelectionChange,
      showLineNumbers = true,
      streaming = false,
      streamingSpeed,
      splitOrientation = 'horizontal',
      coAuthors = [],
      onCoAuthorsChange,
      fullPage = false,
      className,
    },
    ref
  ) {
    // Internal markdown state for uncontrolled mode
    const [internalMarkdown, setInternalMarkdown] = useState(defaultValue);
    const [internalMode, setInternalMode] = useState<ViewMode>(defaultMode);

    const editorRef = useRef<MarkdownEditorRef>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const editorPaneRef = useRef<HTMLDivElement>(null);
    const scrollSourceRef = useRef<'editor' | 'preview' | null>(null);
    const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Determine if controlled
    const isValueControlled = value !== undefined;
    const isModeControlled = controlledMode !== undefined;

    const currentMarkdown = isValueControlled ? value : internalMarkdown;
    const currentMode = isModeControlled ? controlledMode : internalMode;

    // Handle markdown changes
    const handleMarkdownChange = useCallback((markdown: string) => {
      if (!isValueControlled) {
        setInternalMarkdown(markdown);
      }
      onChange?.(markdown);
    }, [isValueControlled, onChange]);

    // Handle mode changes
    const handleModeChange = useCallback((newMode: string) => {
      const mode = newMode as ViewMode;
      if (!isModeControlled) {
        setInternalMode(mode);
      }
      onModeChange?.(mode);
    }, [isModeControlled, onModeChange]);

    // Sync internal markdown when controlled value changes
    useEffect(() => {
      if (isValueControlled && value !== internalMarkdown) {
        setInternalMarkdown(value);
      }
    }, [value, isValueControlled]);

    // Scroll sync for split mode
    // Uses line-based sync for editor->preview (handles folded sections)
    // Uses direct scroll manipulation for smooth performance
    useEffect(() => {
      if (currentMode !== 'split') return;

      let cmScroller: HTMLElement | null = null;
      let previewPane: HTMLElement | null = null;
      let setupTimeoutId: ReturnType<typeof setTimeout> | null = null;
      let rafId: number | null = null;

      // Handle editor scroll -> sync preview using LINE-BASED approach
      // This correctly handles folded sections by using document line numbers
      const handleEditorScroll = () => {
        if (!previewPane || scrollSourceRef.current === 'preview') return;
        if (!editorRef.current) return;

        scrollSourceRef.current = 'editor';

        // Cancel any pending RAF to prevent buildup
        if (rafId) cancelAnimationFrame(rafId);

        rafId = requestAnimationFrame(() => {
          if (!previewPane || !editorRef.current) return;

          // Get visible line range in the editor (accounts for folded sections)
          const firstVisibleLine = editorRef.current.getFirstVisibleLine();
          const lastVisibleLine = editorRef.current.getLastVisibleLine();
          const totalLines = editorRef.current.getLineCount();

          // Use the center of the visible range for better alignment
          const centerLine = (firstVisibleLine + lastVisibleLine) / 2;

          // Calculate what percentage through the document this line is
          const linePercent = totalLines > 1 ? (centerLine - 1) / (totalLines - 1) : 0;

          // Scroll preview to same percentage through its content
          setScrollPercent(previewPane, linePercent);

          // Clear scroll source after a short delay
          if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
          scrollTimeoutRef.current = setTimeout(() => {
            scrollSourceRef.current = null;
          }, 16);
        });
      };

      // Handle preview scroll -> sync editor
      // Uses direct scroll manipulation for smooth performance
      const handlePreviewScroll = () => {
        if (!cmScroller || scrollSourceRef.current === 'editor') return;

        scrollSourceRef.current = 'preview';

        // Cancel any pending RAF
        if (rafId) cancelAnimationFrame(rafId);

        rafId = requestAnimationFrame(() => {
          if (!cmScroller || !previewPane) return;

          // Get preview scroll percentage and apply directly to editor
          const percent = getScrollPercent(previewPane);
          setScrollPercent(cmScroller, percent);

          // Clear scroll source after a short delay
          if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
          scrollTimeoutRef.current = setTimeout(() => {
            scrollSourceRef.current = null;
          }, 16);
        });
      };

      // Setup scroll listeners after DOM is ready
      const setupScrollSync = () => {
        const editorPane = editorPaneRef.current;
        previewPane = previewRef.current;

        if (!editorPane || !previewPane) {
          // Retry setup if refs aren't ready yet
          setupTimeoutId = setTimeout(setupScrollSync, 50);
          return;
        }

        cmScroller = editorPane.querySelector('.cm-scroller') as HTMLElement | null;
        if (!cmScroller) {
          setupTimeoutId = setTimeout(setupScrollSync, 50);
          return;
        }

        cmScroller.addEventListener('scroll', handleEditorScroll, { passive: true });
        previewPane.addEventListener('scroll', handlePreviewScroll, { passive: true });
      };

      // Use requestAnimationFrame to ensure DOM is painted
      requestAnimationFrame(() => {
        setupScrollSync();
      });

      return () => {
        if (setupTimeoutId) clearTimeout(setupTimeoutId);
        if (rafId) cancelAnimationFrame(rafId);
        if (cmScroller) cmScroller.removeEventListener('scroll', handleEditorScroll);
        if (previewPane) previewPane.removeEventListener('scroll', handlePreviewScroll);
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      };
    }, [currentMode]);

    // Imperative handle
    useImperativeHandle(ref, () => ({
      getEditor: () => editorRef.current,
      getMarkdown: () => currentMarkdown,
      setMarkdown: (md: string) => {
        if (!isValueControlled) {
          setInternalMarkdown(md);
        }
        editorRef.current?.setMarkdown(md);
      },
      focus: () => editorRef.current?.focus(),
      getMode: () => currentMode,
      setMode: (mode: ViewMode) => {
        if (!isModeControlled) {
          setInternalMode(mode);
        }
        onModeChange?.(mode);
      },
    }), [currentMarkdown, currentMode, isValueControlled, isModeControlled, onModeChange]);

    // Calculate container style
    // In fullPage mode, rely on flex to fill container instead of explicit heights
    const containerStyle: React.CSSProperties = fullPage
      ? { maxHeight }
      : { height, minHeight, maxHeight };

    const showEditor = currentMode === 'edit' || currentMode === 'split';
    const showPreview = currentMode === 'preview' || currentMode === 'split';

    // Filter mode options in read-only mode
    const modeOptions = readOnly
      ? VIEW_MODE_OPTIONS.filter(opt => opt.value !== 'edit')
      : VIEW_MODE_OPTIONS;

    // Build class names
    const containerClasses = [
      styles.coEditor,
      fullPage && styles.fullPage,
      className,
    ].filter(Boolean).join(' ');

    return (
      <div className={containerClasses} style={containerStyle}>
        {/* Mode switcher toolbar */}
        {(showModeSwitch || toolbarStart || toolbarEnd) && (
          <div className={styles.toolbar}>
            {/* Start section */}
            <div className={styles.toolbarStart}>
              {toolbarStart}
            </div>

            {/* Center section with mode switcher and co-author avatars */}
            <div className={styles.toolbarCenter}>
              {/* Co-author avatars */}
              {coAuthors.length > 0 && (
                <div className={styles.coAuthorAvatars}>
                  {coAuthors.map((author) => (
                    <div
                      key={author.id}
                      className={`${styles.avatar} ${author.isAI ? styles.aiAvatar : ''}`}
                      style={{ '--avatar-color': author.color } as React.CSSProperties}
                      title={author.name}
                    >
                      {author.isAI ? '✦' : author.name.charAt(0).toUpperCase()}
                    </div>
                  ))}
                </div>
              )}
              {showModeSwitch && (
                <div className={styles.modeSwitcher}>
                  <Segmented
                    options={modeOptions}
                    value={currentMode}
                    onChange={handleModeChange}
                    aria-label="Editor view mode"
                  />
                </div>
              )}
            </div>

            {/* End section */}
            <div className={styles.toolbarEnd}>
              {toolbarEnd}
            </div>
          </div>
        )}

        {/* Content area */}
        <div className={`${styles.content} ${styles[currentMode]}`}>
          {/* Split mode uses SplitPane for resizing */}
          {currentMode === 'split' ? (
            <SplitPane
              first={
                <div ref={editorPaneRef} className={styles.editorPane}>
                  <MarkdownEditor
                    ref={editorRef}
                    value={currentMarkdown}
                    onChange={handleMarkdownChange}
                    readOnly={readOnly}
                    autoFocus={autoFocus}
                    placeholder={placeholder}
                    onEditorReady={onEditorReady}
                    onSelectionChange={onSelectionChange}
                    showLineNumbers={showLineNumbers}
                    coAuthors={coAuthors}
                    onCoAuthorsChange={onCoAuthorsChange}
                  />
                </div>
              }
              second={
                <div className={styles.previewPane}>
                  <div ref={previewRef} className={styles.previewContent}>
                    <MarkdownRenderer
                      content={currentMarkdown}
                      showLineNumbers={showLineNumbers}
                      streaming={streaming}
                      streamingSpeed={streamingSpeed}
                    />
                  </div>
                </div>
              }
              orientation={splitOrientation}
              defaultSize="50%"
              minSize={150}
            />
          ) : (
            <>
              {/* Editor pane (edit mode only) */}
              {showEditor && (
                <div className={styles.editorPane}>
                  <MarkdownEditor
                    ref={editorRef}
                    value={currentMarkdown}
                    onChange={handleMarkdownChange}
                    readOnly={readOnly}
                    autoFocus={autoFocus}
                    placeholder={placeholder}
                    onEditorReady={onEditorReady}
                    onSelectionChange={onSelectionChange}
                    showLineNumbers={showLineNumbers}
                    coAuthors={coAuthors}
                    onCoAuthorsChange={onCoAuthorsChange}
                  />
                </div>
              )}

              {/* Preview pane (preview mode only) */}
              {showPreview && (
                <div className={styles.previewPane}>
                  <div className={styles.previewContent}>
                    <MarkdownRenderer
                      content={currentMarkdown}
                      showLineNumbers={showLineNumbers}
                      streaming={streaming}
                      streamingSpeed={streamingSpeed}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }
);

export default MarkdownCoEditor;
