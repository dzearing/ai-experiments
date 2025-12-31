import {
  forwardRef,
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  useImperativeHandle,
  type ReactNode,
  type KeyboardEvent,
  type ClipboardEvent,
  type DragEvent,
  type ChangeEvent,
} from 'react';
import { EditorContent } from '@tiptap/react';
import { Button, IconButton, Spinner, Tooltip, ImagePreview } from '@ui-kit/react';
import { SendIcon } from '@ui-kit/icons/SendIcon';
import { BoldIcon } from '@ui-kit/icons/BoldIcon';
import { ItalicIcon } from '@ui-kit/icons/ItalicIcon';
import { LinkIcon } from '@ui-kit/icons/LinkIcon';
import { CodeIcon } from '@ui-kit/icons/CodeIcon';
import { QuoteIcon } from '@ui-kit/icons/QuoteIcon';
import { ListBulletIcon } from '@ui-kit/icons/ListBulletIcon';
import { ImageIcon } from '@ui-kit/icons/ImageIcon';
import { StrikethroughIcon } from '@ui-kit/icons/StrikethroughIcon';
import { UnderlineIcon } from '@ui-kit/icons/UnderlineIcon';
import { useMessageHistory } from './useMessageHistory';
import { useChatEditor } from './useChatEditor';
import { getImageChipsInOrder } from './ImageChipExtension';
import { getThingChipsInOrder } from './ThingChipExtension';
import { LinkDialog } from './LinkDialog';
import { SlashCommandPopover, filterCommands } from './SlashCommandPopover';
import { ThingReferencePopover, filterThings, type ThingReference } from './ThingReferencePopover';
import type { SlashCommand, SlashCommandResult } from './SlashCommand.types';
import styles from './ChatInput.module.css';

export type ChatInputSize = 'sm' | 'md' | 'lg';

export interface ChatInputImage {
  /** Unique identifier for the image */
  id: string;
  /** Display name (e.g., "Image #1") - based on position in content */
  name: string;
  /** Thumbnail URL or data URL for preview */
  thumbnailUrl: string;
  /** Original file reference for upload */
  file: File;
  /** Upload status */
  status: 'pending' | 'uploading' | 'uploaded' | 'error';
  /** Server-assigned URL after upload */
  uploadedUrl?: string;
}

/** Thing reference extracted from chat input */
export interface ChatInputThingReference {
  /** Thing ID */
  id: string;
  /** Thing display name */
  name: string;
}

export interface ChatInputSubmitData {
  /** Markdown text content */
  content: string;
  /** Array of images referenced in the message (in content order) */
  images: ChatInputImage[];
  /** Array of Thing references from ^thing chips (in content order) */
  thingReferences: ChatInputThingReference[];
}

/**
 * Ref handle exposed by ChatInput
 */
export interface ChatInputRef {
  /** Focus the editor */
  focus: () => void;
  /** Clear the editor content */
  clear: () => void;
}

export interface ChatInputProps {
  /** Input size */
  size?: ChatInputSize;

  /** Callback when user submits (Enter or button click) */
  onSubmit?: (data: ChatInputSubmitData) => void;

  /** Called when image is pasted or dropped - return Promise<string> with uploaded URL */
  onImageUpload?: (file: File) => Promise<string>;

  /** Enable multiline mode by default (Enter creates newline, Ctrl+Enter submits) */
  multiline?: boolean;

  /** Custom send button content */
  sendButtonContent?: ReactNode;

  /** Loading state - shows spinner on send button */
  loading?: boolean;

  /** Error state for validation */
  error?: boolean;

  /** Full width (100%) */
  fullWidth?: boolean;

  /** localStorage key prefix for message history (enables history if provided) */
  historyKey?: string;

  /** Maximum history items to store */
  maxHistoryItems?: number;

  /** Maximum number of images allowed */
  maxImages?: number;

  /** Placeholder text */
  placeholder?: string;

  /** Disabled state */
  disabled?: boolean;

  /** Auto focus the editor on mount */
  autoFocus?: boolean;

  /** Initial content to populate the editor with */
  initialContent?: string;

  /** Custom class name */
  className?: string;

  /** Available slash commands */
  commands?: SlashCommand[];

  /**
   * Called when a slash command is executed.
   * Return SlashCommandResult or true if handled, false if not.
   */
  onCommand?: (command: string, args: string) => SlashCommandResult | boolean | void;

  /**
   * Called when content changes.
   * Receives isEmpty flag and plain text content.
   */
  onChange?: (isEmpty: boolean, content: string) => void;

  /** Available things for ^ reference autocomplete */
  things?: ThingReference[];

  /** Recently used things (shown when ^ is typed without query) */
  recentThings?: ThingReference[];

  /**
   * Called when a thing reference is selected.
   * The thing will be inserted as [[thing:id]] in the content.
   */
  onThingSelect?: (thing: ThingReference) => void;

  /**
   * Queued messages waiting to be sent.
   * When user presses Up at cursor position 0 with queued messages,
   * they will be concatenated and moved to the input for editing.
   */
  queuedMessages?: string[];

  /**
   * Called when user wants to edit queued messages (Up arrow at position 0).
   * Receives concatenated content of all queued messages.
   * Parent should clear the queue and let the user edit.
   */
  onEditQueue?: (concatenatedContent: string) => void;
}

export const ChatInput = forwardRef<ChatInputRef, ChatInputProps>(
  (
    {
      size = 'md',
      onSubmit,
      onImageUpload,
      multiline: initialMultiline = false,
      sendButtonContent,
      loading = false,
      error = false,
      fullWidth = false,
      historyKey,
      maxHistoryItems = 50,
      maxImages = 10,
      disabled = false,
      autoFocus = false,
      initialContent,
      placeholder = 'Type a message...',
      className = '',
      commands = [],
      onCommand,
      onChange,
      things = [],
      recentThings = [],
      onThingSelect,
      queuedMessages = [],
      onEditQueue,
    },
    ref
  ) => {
    // State - images is a Map keyed by ID for fast lookup
    const [imagesMap, setImagesMap] = useState<Map<string, Omit<ChatInputImage, 'id' | 'name'>>>(new Map());
    const [isMultilineMode, setIsMultilineMode] = useState(initialMultiline);
    const [isDragging, setIsDragging] = useState(false);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [draftContent, setDraftContent] = useState('');
    const [isEmpty, setIsEmpty] = useState(true);
    const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
    const [selectedText, setSelectedText] = useState('');
    const [escapePressed, setEscapePressed] = useState(false);
    const [previewImage, setPreviewImage] = useState<ChatInputImage | null>(null);

    // Slash command state
    const [isCommandPopoverOpen, setIsCommandPopoverOpen] = useState(false);
    const [commandQuery, setCommandQuery] = useState('');
    const [commandSelectedIndex, setCommandSelectedIndex] = useState(0);

    // Thing reference state (^ autocomplete)
    const [isThingPopoverOpen, setIsThingPopoverOpen] = useState(false);
    const [thingQuery, setThingQuery] = useState('');
    const [thingSelectedIndex, setThingSelectedIndex] = useState(0);
    const [thingCaretPosition, setThingCaretPosition] = useState<number | null>(null);

    // Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const editorRef = useRef<ReturnType<typeof useChatEditor>>(null);

    // History hook
    const { getHistory, addToHistory } = useMessageHistory(historyKey, maxHistoryItems);

    // Ref to hold current executeCommand to avoid dependency issues
    const executeCommandRef = useRef<((cmd: SlashCommand) => void) | null>(null);

    // Ref to hold current executeThingSelect to avoid dependency issues
    const executeThingSelectRef = useRef<((thing: ThingReference) => void) | null>(null);

    // Handle Tab key at TipTap level (for autocomplete selection)
    const handleTabKey = useCallback(
      (): boolean => {
        // If command popover is open, select the highlighted command
        if (isCommandPopoverOpen && commands.length > 0) {
          const filteredCmds = filterCommands(commands, commandQuery);
          if (filteredCmds.length > 0 && filteredCmds[commandSelectedIndex]) {
            executeCommandRef.current?.(filteredCmds[commandSelectedIndex]);
            return true; // Prevent default
          }
        }

        // If thing popover is open, select the highlighted thing
        if (isThingPopoverOpen && things.length > 0) {
          const displayThings = thingQuery ? filterThings(things, thingQuery) : (recentThings.length > 0 ? recentThings : things.slice(0, 10));
          if (displayThings.length > 0 && displayThings[thingSelectedIndex]) {
            executeThingSelectRef.current?.(displayThings[thingSelectedIndex]);
            return true; // Prevent default
          }
        }

        return false; // Let default Tab behavior happen
      },
      [isCommandPopoverOpen, commands, commandQuery, commandSelectedIndex, isThingPopoverOpen, things, recentThings, thingQuery, thingSelectedIndex]
    );

    // Handle Enter key at TipTap level (before newline insertion)
    const handleEnterKey = useCallback(
      (event: { shiftKey: boolean; ctrlKey: boolean; metaKey: boolean }): boolean => {
        const { shiftKey, ctrlKey, metaKey } = event;
        const modKey = ctrlKey || metaKey;

        // If command popover is open, select the highlighted command
        if (isCommandPopoverOpen && commands.length > 0) {
          const filteredCmds = filterCommands(commands, commandQuery);
          if (filteredCmds.length > 0 && filteredCmds[commandSelectedIndex]) {
            executeCommandRef.current?.(filteredCmds[commandSelectedIndex]);
            return true; // Prevent default
          }
        }

        // If thing popover is open, select the highlighted thing
        if (isThingPopoverOpen && things.length > 0) {
          const displayThings = thingQuery ? filterThings(things, thingQuery) : (recentThings.length > 0 ? recentThings : things.slice(0, 10));
          if (displayThings.length > 0 && displayThings[thingSelectedIndex]) {
            executeThingSelectRef.current?.(displayThings[thingSelectedIndex]);
            return true; // Prevent default
          }
        }

        if (isMultilineMode) {
          if (modKey) {
            handleSubmitRef.current?.();
            setIsMultilineMode(false);
            return true; // Prevent newline
          }
          // In multiline mode without mod key, allow newline
          return false;
        } else {
          if (modKey && !shiftKey) {
            setIsMultilineMode(true);
            return false; // Allow newline insertion when entering multiline mode
          }
          if (!shiftKey) {
            handleSubmitRef.current?.();
            return true; // Prevent newline
          }
          // Shift+Enter in single-line mode, allow newline (switches to multiline implicitly)
          return false;
        }
      },
      [isMultilineMode, isCommandPopoverOpen, commands, commandQuery, commandSelectedIndex, isThingPopoverOpen, things, recentThings, thingQuery, thingSelectedIndex]
    );

    // Ref to hold current handleSubmit to avoid dependency issues
    const handleSubmitRef = useRef<(() => void) | null>(null);

    // TipTap editor
    const editor = useChatEditor({
      placeholder,
      disabled,
      onChange: (editorIsEmpty, content) => {
        setIsEmpty(editorIsEmpty);
        // Reset history navigation when typing
        if (historyIndex !== -1) {
          setHistoryIndex(-1);
        }

        // Slash command detection
        if (commands.length > 0 && content) {
          const trimmedContent = content.trim();
          if (trimmedContent.startsWith('/')) {
            // Extract the command query (text after /)
            const spaceIndex = trimmedContent.indexOf(' ');
            const query = spaceIndex === -1
              ? trimmedContent.slice(1)
              : trimmedContent.slice(1, spaceIndex);

            setCommandQuery(query);

            // Check if there are matching commands
            const matchingCommands = filterCommands(commands, query);
            if (matchingCommands.length > 0) {
              setIsCommandPopoverOpen(true);
              // Reset selection when query changes
              setCommandSelectedIndex(0);
            } else {
              setIsCommandPopoverOpen(false);
            }
          } else {
            setIsCommandPopoverOpen(false);
            setCommandQuery('');
          }
        } else {
          setIsCommandPopoverOpen(false);
          setCommandQuery('');
        }

        // Thing reference detection (^)
        if (things.length > 0 && content) {
          // Find the last ^ character and check if we're in a thing reference
          const lastCaretPos = content.lastIndexOf('^');
          if (lastCaretPos !== -1) {
            // Check if ^ is at the start or after a space (not part of a word)
            const charBefore = lastCaretPos > 0 ? content[lastCaretPos - 1] : ' ';
            if (charBefore === ' ' || charBefore === '\n' || lastCaretPos === 0) {
              // Extract the query after ^
              const afterCaret = content.slice(lastCaretPos + 1);
              // Query ends at space or end of string
              const spaceIndex = afterCaret.search(/\s/);
              const query = spaceIndex === -1 ? afterCaret : afterCaret.slice(0, spaceIndex);

              // Only show if cursor is still in the query (no space after yet in the query part)
              if (spaceIndex === -1 || afterCaret.length === spaceIndex) {
                setThingQuery(query);
                setThingCaretPosition(lastCaretPos);

                // Check if there are matching things
                const matchingThings = query ? filterThings(things, query) : (recentThings.length > 0 ? recentThings : things.slice(0, 10));
                if (matchingThings.length > 0) {
                  setIsThingPopoverOpen(true);
                  setThingSelectedIndex(0);
                } else {
                  setIsThingPopoverOpen(false);
                }
              } else {
                setIsThingPopoverOpen(false);
                setThingQuery('');
                setThingCaretPosition(null);
              }
            } else {
              setIsThingPopoverOpen(false);
              setThingQuery('');
              setThingCaretPosition(null);
            }
          } else {
            setIsThingPopoverOpen(false);
            setThingQuery('');
            setThingCaretPosition(null);
          }
        } else {
          setIsThingPopoverOpen(false);
          setThingQuery('');
          setThingCaretPosition(null);
        }

        // Call external onChange handler
        onChange?.(editorIsEmpty, content);
      },
      onEnterKey: handleEnterKey,
      onTabKey: handleTabKey,
    });

    // Keep editorRef updated for use in imperative handle
    useEffect(() => {
      editorRef.current = editor;
    }, [editor]);

    // Expose focus and clear methods via ref
    useImperativeHandle(
      ref,
      () => ({
        focus: () => {
          // Try to focus, with retry for when editor isn't ready yet
          const attemptFocus = (retries = 10) => {
            const currentEditor = editorRef.current;
            if (currentEditor) {
              currentEditor.commands.focus('end');
            } else if (retries > 0) {
              // Editor not ready yet, retry after a short delay
              setTimeout(() => attemptFocus(retries - 1), 50);
            }
          };
          attemptFocus();
        },
        clear: () => {
          editorRef.current?.commands.clearContent();
          setIsEmpty(true);
        },
      }),
      [] // No dependencies - uses refs which are always current
    );

    // Execute a slash command
    const executeCommand = useCallback(
      (cmd: SlashCommand) => {
        if (!editor || !onCommand) return;

        // Get full content to extract args
        const content = editor.getText().trim();
        const spaceIndex = content.indexOf(' ');
        const args = spaceIndex !== -1 ? content.slice(spaceIndex + 1).trim() : '';

        // Execute the command
        const result = onCommand(cmd.name, args);

        // Handle result
        const shouldClearInput =
          result === true ||
          (typeof result === 'object' && result.clearInput !== false && result.handled);

        if (shouldClearInput) {
          editor.commands.clearContent();
          setIsEmpty(true);
        }

        // Close popover
        setIsCommandPopoverOpen(false);
        setCommandQuery('');
        setCommandSelectedIndex(0);
      },
      [editor, onCommand]
    );

    // Keep executeCommandRef current
    executeCommandRef.current = executeCommand;

    // Execute a thing selection - replace ^query with a colored chip
    const executeThingSelect = useCallback(
      (thing: ThingReference) => {
        if (!editor) return;

        // Get current content
        const content = editor.getText();

        // Find the ^ trigger position we're responding to
        if (thingCaretPosition !== null) {
          // Calculate the end of the current query
          const afterCaret = content.slice(thingCaretPosition + 1);
          const spaceIndex = afterCaret.search(/\s/);
          const queryLength = spaceIndex === -1 ? afterCaret.length : spaceIndex;

          // TipTap positions start at 1 (position 0 is document start), so add 1
          const from = thingCaretPosition + 1;
          const to = thingCaretPosition + 1 + 1 + queryLength;

          // Delete the ^query text and insert the thing chip
          editor.chain()
            .focus()
            .deleteRange({ from, to })
            .run();

          // Insert the thing chip using our custom command
          editor.commands.insertThingChip({
            id: thing.id,
            name: thing.name,
            type: thing.type,
          });
        }

        // Call external handler
        onThingSelect?.(thing);

        // Close popover
        setIsThingPopoverOpen(false);
        setThingQuery('');
        setThingSelectedIndex(0);
        setThingCaretPosition(null);
      },
      [editor, thingCaretPosition, onThingSelect]
    );

    // Keep executeThingSelectRef current
    executeThingSelectRef.current = executeThingSelect;

    // Handle command selection from popover
    const handleCommandSelect = useCallback(
      (cmd: SlashCommand) => {
        executeCommand(cmd);
      },
      [executeCommand]
    );

    // Get images sorted by their position in content
    const imagesInContentOrder = useMemo((): ChatInputImage[] => {
      if (!editor) return [];

      const chipsInOrder = getImageChipsInOrder(editor);
      return chipsInOrder
        .map((chip, index) => {
          const imageData = imagesMap.get(chip.id);
          if (!imageData) return null;
          return {
            ...imageData,
            id: chip.id,
            name: `Image #${index + 1}`,
          };
        })
        .filter((img): img is ChatInputImage => img !== null);
    }, [editor, imagesMap]);

    // Helper to renumber all chips based on their position in the document
    const renumberAllChips = useCallback(() => {
      if (!editor) return;

      const chipsInOrder = getImageChipsInOrder(editor);
      chipsInOrder.forEach((chip, index) => {
        const expectedName = `Image #${index + 1}`;
        editor.commands.updateImageChipName(chip.id, expectedName);
      });
    }, [editor]);

    // Listen for editor updates to handle chip deletions and renumbering
    useEffect(() => {
      if (!editor) return;

      const handleUpdate = () => {
        const chipsInOrder = getImageChipsInOrder(editor);
        const chipIds = new Set(chipsInOrder.map(c => c.id));

        // Remove images that no longer have chips
        setImagesMap((prev) => {
          const newMap = new Map(prev);
          let changed = false;
          for (const id of prev.keys()) {
            if (!chipIds.has(id)) {
              newMap.delete(id);
              changed = true;
            }
          }
          return changed ? newMap : prev;
        });

        // Renumber all chips based on current positions
        renumberAllChips();
      };

      editor.on('update', handleUpdate);
      return () => {
        editor.off('update', handleUpdate);
      };
    }, [editor, renumberAllChips]);

    // Get content from editor as markdown
    // Uses tiptap-markdown extension to serialize editor content to markdown
    const getContent = useCallback((): string => {
      if (!editor) return '';
      // Use tiptap-markdown's getMarkdown() for proper markdown serialization
      // This handles line breaks, formatting, etc. correctly
      const markdownStorage = editor.storage.markdown;
      if (markdownStorage && typeof markdownStorage.getMarkdown === 'function') {
        // Call with proper this context
        const markdown = markdownStorage.getMarkdown() as string;
        // Normalize double newlines (paragraph breaks) to single newlines
        // This keeps multiline input as simple line breaks, not paragraph spacing
        return markdown.replace(/\n\n+/g, '\n');
      }
      // Fallback to HTML if markdown extension not available
      return editor.getHTML();
    }, [editor]);

    // Handle submit
    const handleSubmit = useCallback(() => {
      const content = getContent().trim();
      if (!content && imagesInContentOrder.length === 0) return;

      // Add to history
      if (content) {
        addToHistory(content);
      }

      // Get Thing references from the editor
      const thingRefs = editor ? getThingChipsInOrder(editor) : [];

      // Call onSubmit with images and thing references
      onSubmit?.({
        content,
        images: [...imagesInContentOrder],
        thingReferences: thingRefs,
      });

      // Reset state
      editor?.commands.clearContent();
      setImagesMap(new Map());

      setHistoryIndex(-1);
      setDraftContent('');
      setIsEmpty(true);
    }, [getContent, imagesInContentOrder, addToHistory, onSubmit, editor]);

    // Keep handleSubmitRef current
    handleSubmitRef.current = handleSubmit;

    // Navigate history
    const navigateHistory = useCallback(
      (direction: -1 | 1) => {
        const history = getHistory();
        if (history.length === 0 || !editor) return;

        // Save draft when first navigating back into history
        if (historyIndex === -1 && direction === 1) {
          setDraftContent(getContent());
        }

        const newIndex = historyIndex + direction;

        if (newIndex < -1) return;
        if (newIndex >= history.length) return;

        if (newIndex === -1) {
          editor.commands.setContent(draftContent);
          setHistoryIndex(-1);
        } else {
          editor.commands.setContent(history[newIndex]);
          setHistoryIndex(newIndex);
        }
      },
      [getHistory, historyIndex, draftContent, getContent, editor]
    );

    // Open link dialog with current selection
    const openLinkDialog = useCallback(() => {
      if (!editor) return;

      // Get selected text to use as display name
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to, '');
      setSelectedText(text);
      setIsLinkDialogOpen(true);
    }, [editor]);

    // Handle keyboard events
    const handleKeyDown = useCallback(
      (e: KeyboardEvent<HTMLDivElement>) => {
        const { key, ctrlKey, metaKey } = e;
        const modKey = ctrlKey || metaKey;

        // Command popover keyboard navigation
        if (isCommandPopoverOpen && commands.length > 0) {
          const filteredCmds = filterCommands(commands, commandQuery);

          if (key === 'ArrowUp') {
            e.preventDefault();
            setCommandSelectedIndex((prev) =>
              prev <= 0 ? filteredCmds.length - 1 : prev - 1
            );
            return;
          }

          if (key === 'ArrowDown') {
            e.preventDefault();
            setCommandSelectedIndex((prev) =>
              prev >= filteredCmds.length - 1 ? 0 : prev + 1
            );
            return;
          }

          if (key === 'Tab') {
            e.preventDefault();
            if (filteredCmds[commandSelectedIndex]) {
              executeCommandRef.current?.(filteredCmds[commandSelectedIndex]);
            }
            return;
          }

          if (key === 'Escape') {
            e.preventDefault();
            setIsCommandPopoverOpen(false);
            setCommandQuery('');
            setCommandSelectedIndex(0);
            return;
          }
        }

        // Thing popover keyboard navigation
        if (isThingPopoverOpen && things.length > 0) {
          const displayThings = thingQuery ? filterThings(things, thingQuery) : (recentThings.length > 0 ? recentThings : things.slice(0, 10));

          if (key === 'ArrowUp') {
            e.preventDefault();
            setThingSelectedIndex((prev) =>
              prev <= 0 ? displayThings.length - 1 : prev - 1
            );
            return;
          }

          if (key === 'ArrowDown') {
            e.preventDefault();
            setThingSelectedIndex((prev) =>
              prev >= displayThings.length - 1 ? 0 : prev + 1
            );
            return;
          }

          if (key === 'Tab') {
            e.preventDefault();
            if (displayThings[thingSelectedIndex]) {
              executeThingSelectRef.current?.(displayThings[thingSelectedIndex]);
            }
            return;
          }

          if (key === 'Escape') {
            e.preventDefault();
            setIsThingPopoverOpen(false);
            setThingQuery('');
            setThingSelectedIndex(0);
            setThingCaretPosition(null);
            return;
          }
        }

        // Escape handling - requires two consecutive presses to clear
        if (key === 'Escape') {
          e.preventDefault();
          if (escapePressed) {
            // Second consecutive Escape - clear content
            editor?.commands.clearContent();
            setImagesMap(new Map());
            if (isMultilineMode) {
              setIsMultilineMode(false);
            }
            setEscapePressed(false);
          } else {
            // First Escape - just mark it
            setEscapePressed(true);
          }
          return;
        }

        // Reset escape flag on any other key
        if (escapePressed) {
          setEscapePressed(false);
        }

        // Enter key is now handled at the TipTap level via onEnterKey callback
        // to prevent newline insertion before we can intercept it

        // History navigation with smart cursor behavior
        if (editor && historyKey) {
          const { from } = editor.state.selection;
          const docSize = editor.state.doc.content.size;
          const isAtStart = from === 0 || from === 1;
          const isAtEnd = from >= docSize - 1;

          // Check if on first/last line for multiline mode
          const $from = editor.state.selection.$from;
          // Guard against depth 0 which has no "before" position
          const isOnFirstLine = $from.depth === 0 || $from.before($from.depth) <= 1;
          const isOnLastLine = $from.depth === 0 || $from.after($from.depth) >= docSize - 1;

          if (key === 'ArrowUp') {
            // In single-line mode, or on first line in multiline mode
            if (!isMultilineMode || isOnFirstLine) {
              e.preventDefault();
              if (isAtStart) {
                // Check for queued messages first - if present, edit them instead of history
                if (queuedMessages.length > 0 && onEditQueue) {
                  const concatenated = queuedMessages.join('\n').trim();
                  onEditQueue(concatenated);
                  // Convert newlines to paragraphs for TipTap (it treats plain \n as spaces)
                  const lines = concatenated.split('\n');
                  const htmlContent = lines.length > 1
                    ? lines.map(line => `<p>${line}</p>`).join('')
                    : concatenated;
                  // Set the editor content with proper paragraph structure
                  editor.commands.setContent(htmlContent);
                  // Enter multiline mode if there are multiple lines
                  if (concatenated.includes('\n')) {
                    setIsMultilineMode(true);
                  }
                  // Move cursor to end
                  setTimeout(() => {
                    const newDocSize = editor.state.doc.content.size;
                    editor.commands.setTextSelection(newDocSize);
                  }, 0);
                  return;
                }
                // No queued messages - navigate history, keep cursor at start
                navigateHistory(1);
                // Move cursor to start after content change
                setTimeout(() => editor.commands.setTextSelection(0), 0);
              } else {
                // Move cursor to start first
                editor.commands.setTextSelection(0);
              }
              return;
            }
          }

          if (key === 'ArrowDown') {
            // In single-line mode, or on last line in multiline mode
            if (!isMultilineMode || isOnLastLine) {
              e.preventDefault();
              if (isAtEnd) {
                // Already at end - navigate history forward
                navigateHistory(-1);
                // Move cursor to end after content change
                setTimeout(() => {
                  const newDocSize = editor.state.doc.content.size;
                  editor.commands.setTextSelection(newDocSize);
                }, 0);
              } else {
                // Move cursor to end first
                editor.commands.setTextSelection(docSize);
              }
              return;
            }
          }
        }

        // Link shortcut (Ctrl+K)
        if (modKey && key.toLowerCase() === 'k') {
          e.preventDefault();
          openLinkDialog();
        }
      },
      [isMultilineMode, editor, historyKey, navigateHistory, openLinkDialog, escapePressed, isCommandPopoverOpen, commands, commandQuery, commandSelectedIndex, isThingPopoverOpen, things, recentThings, thingQuery, thingSelectedIndex, queuedMessages, onEditQueue]
    );

    // Convert file to base64 data URL for persistence
    const fileToDataUrl = useCallback((file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }, []);

    // Add image and insert chip inline
    const addImage = useCallback(
      async (file: File) => {
        if (imagesMap.size >= maxImages) {
          return;
        }

        const imageId = `img-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

        // Convert to base64 data URL for persistence (blob URLs don't survive serialization)
        const thumbnailUrl = await fileToDataUrl(file);

        // Add to images map (without name - name is determined by position)
        setImagesMap((prev) => {
          const newMap = new Map(prev);
          newMap.set(imageId, {
            thumbnailUrl,
            file,
            status: 'pending',
          });
          return newMap;
        });

        // Insert inline image chip at cursor position
        // The name will be determined by position and updated by the effect
        if (editor) {
          const tempName = `Image #${imagesMap.size + 1}`;
          editor.commands.insertImageChip({ id: imageId, name: tempName, thumbnailUrl });
        }

        // Upload if callback provided
        if (onImageUpload) {
          setImagesMap((prev) => {
            const newMap = new Map(prev);
            const img = prev.get(imageId);
            if (img) {
              newMap.set(imageId, { ...img, status: 'uploading' });
            }
            return newMap;
          });

          try {
            const uploadedUrl = await onImageUpload(file);
            setImagesMap((prev) => {
              const newMap = new Map(prev);
              const img = prev.get(imageId);
              if (img) {
                newMap.set(imageId, { ...img, status: 'uploaded', uploadedUrl });
              }
              return newMap;
            });
          } catch {
            setImagesMap((prev) => {
              const newMap = new Map(prev);
              const img = prev.get(imageId);
              if (img) {
                newMap.set(imageId, { ...img, status: 'error' });
              }
              return newMap;
            });
          }
        }
      },
      [imagesMap.size, maxImages, onImageUpload, editor, fileToDataUrl]
    );

    // Handle well item click - open image preview
    const handleWellItemClick = useCallback(
      (image: ChatInputImage) => {
        setPreviewImage(image);
      },
      []
    );

    // Handle link insertion from dialog
    const handleLinkSubmit = useCallback(
      (url: string, displayText: string) => {
        if (!editor) return;

        const { from, to } = editor.state.selection;
        const hasSelection = from !== to;

        if (hasSelection) {
          // If text was selected, replace it with the link
          editor
            .chain()
            .focus()
            .deleteSelection()
            .insertContent({
              type: 'text',
              marks: [{ type: 'link', attrs: { href: url } }],
              text: displayText,
            })
            .run();
        } else {
          // No selection - insert link with display text
          editor
            .chain()
            .focus()
            .insertContent({
              type: 'text',
              marks: [{ type: 'link', attrs: { href: url } }],
              text: displayText,
            })
            .run();
        }
      },
      [editor]
    );

    // Handle paste
    const handlePaste = useCallback(
      async (e: ClipboardEvent<HTMLDivElement>) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (const item of Array.from(items)) {
          if (item.type.startsWith('image/')) {
            e.preventDefault();
            const file = item.getAsFile();
            if (file) {
              await addImage(file);
            }
            return;
          }
        }
      },
      [addImage]
    );

    // Handle drop
    const handleDrop = useCallback(
      async (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);

        const files = e.dataTransfer?.files;
        if (!files) return;

        for (const file of Array.from(files)) {
          if (file.type.startsWith('image/')) {
            await addImage(file);
          }
        }
      },
      [addImage]
    );

    // Handle drag events
    const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!containerRef.current?.contains(e.relatedTarget as Node)) {
        setIsDragging(false);
      }
    }, []);

    // Handle file input change
    const handleFileInputChange = useCallback(
      async (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        for (const file of Array.from(files)) {
          if (file.type.startsWith('image/')) {
            await addImage(file);
          }
        }

        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      },
      [addImage]
    );

    // Update editor editable state when disabled changes
    useEffect(() => {
      if (editor) {
        editor.setEditable(!disabled);
      }
    }, [editor, disabled]);

    // Set initial content when provided
    useEffect(() => {
      if (editor && initialContent) {
        editor.commands.setContent(initialContent);
        setIsEmpty(false);
      }
    }, [editor, initialContent]);

    // Auto focus when enabled
    useEffect(() => {
      if (editor && autoFocus) {
        editor.commands.focus('end');
      }
    }, [editor, autoFocus]);

    // Build class names
    const containerClasses = [
      styles.container,
      styles[size],
      error && styles.error,
      disabled && styles.disabled,
      fullWidth && styles.fullWidth,
      isDragging && styles.dragging,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const canSubmit = (!isEmpty || imagesInContentOrder.length > 0) && !disabled && !loading;

    return (
      <div
        ref={containerRef}
        className={containerClasses}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {/* Hidden file input for image selection */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileInputChange}
          className={styles.hiddenFileInput}
          tabIndex={-1}
        />

        {/* Slash command popover */}
        {commands.length > 0 && (
          <SlashCommandPopover
            isOpen={isCommandPopoverOpen}
            query={commandQuery}
            commands={commands}
            selectedIndex={commandSelectedIndex}
            onSelectionChange={setCommandSelectedIndex}
            onSelect={handleCommandSelect}
            onClose={() => {
              setIsCommandPopoverOpen(false);
              setCommandQuery('');
              setCommandSelectedIndex(0);
            }}
          />
        )}

        {/* Thing reference popover (^ autocomplete) */}
        {things.length > 0 && (
          <ThingReferencePopover
            isOpen={isThingPopoverOpen}
            query={thingQuery}
            things={things}
            recentThings={recentThings}
            selectedIndex={thingSelectedIndex}
            onSelectionChange={setThingSelectedIndex}
            onSelect={executeThingSelect}
            onClose={() => {
              setIsThingPopoverOpen(false);
              setThingQuery('');
              setThingSelectedIndex(0);
              setThingCaretPosition(null);
            }}
          />
        )}

        {/* Image well - shows thumbnails in content order, no remove buttons */}
        {imagesInContentOrder.length > 0 && (
          <div className={styles.imageWell}>
            {imagesInContentOrder.map((image) => (
              <Tooltip
                key={image.id}
                content={
                  <img
                    src={image.thumbnailUrl}
                    alt={image.name}
                    className={styles.imagePreviewLarge}
                  />
                }
                position="top"
                multiline
              >
                <button
                  type="button"
                  className={styles.imageThumbnail}
                  onClick={() => handleWellItemClick(image)}
                  aria-label={`Preview ${image.name}`}
                >
                  <img src={image.thumbnailUrl} alt={image.name} />
                  <span className={styles.imageThumbnailName}>
                    {image.name}
                    {image.status === 'uploading' && <Spinner size="sm" />}
                    {image.status === 'error' && <span className={styles.imageError}>!</span>}
                  </span>
                </button>
              </Tooltip>
            ))}
          </div>
        )}

        {/* Toolbar - only visible in multiline mode */}
        {isMultilineMode && editor && (
          <div className={styles.toolbar}>
            <Tooltip content="Bold (Ctrl+B)" position="top">
              <IconButton
                icon={<BoldIcon />}
                size="sm"
                variant="ghost"
                onClick={() => editor.chain().focus().toggleBold().run()}
                disabled={disabled}
                aria-label="Bold"
                aria-pressed={editor.isActive('bold')}
                className={editor.isActive('bold') ? styles.toolbarButtonActive : undefined}
              />
            </Tooltip>
            <Tooltip content="Italic (Ctrl+I)" position="top">
              <IconButton
                icon={<ItalicIcon />}
                size="sm"
                variant="ghost"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                disabled={disabled}
                aria-label="Italic"
                aria-pressed={editor.isActive('italic')}
                className={editor.isActive('italic') ? styles.toolbarButtonActive : undefined}
              />
            </Tooltip>
            <Tooltip content="Underline (Ctrl+U)" position="top">
              <IconButton
                icon={<UnderlineIcon />}
                size="sm"
                variant="ghost"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                disabled={disabled}
                aria-label="Underline"
                aria-pressed={editor.isActive('underline')}
                className={editor.isActive('underline') ? styles.toolbarButtonActive : undefined}
              />
            </Tooltip>
            <Tooltip content="Strikethrough" position="top">
              <IconButton
                icon={<StrikethroughIcon />}
                size="sm"
                variant="ghost"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                disabled={disabled}
                aria-label="Strikethrough"
                aria-pressed={editor.isActive('strike')}
                className={editor.isActive('strike') ? styles.toolbarButtonActive : undefined}
              />
            </Tooltip>
            <Tooltip content="Code (Ctrl+E)" position="top">
              <IconButton
                icon={<CodeIcon />}
                size="sm"
                variant="ghost"
                onClick={() => editor.chain().focus().toggleCode().run()}
                disabled={disabled}
                aria-label="Inline code"
                aria-pressed={editor.isActive('code')}
                className={editor.isActive('code') ? styles.toolbarButtonActive : undefined}
              />
            </Tooltip>
            <Tooltip content="Link (Ctrl+K)" position="top">
              <IconButton
                icon={<LinkIcon />}
                size="sm"
                variant="ghost"
                onClick={openLinkDialog}
                disabled={disabled}
                aria-label="Insert link"
                aria-pressed={editor.isActive('link')}
                className={editor.isActive('link') ? styles.toolbarButtonActive : undefined}
              />
            </Tooltip>
            <Tooltip content="Quote" position="top">
              <IconButton
                icon={<QuoteIcon />}
                size="sm"
                variant="ghost"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                disabled={disabled}
                aria-label="Quote"
                aria-pressed={editor.isActive('blockquote')}
                className={editor.isActive('blockquote') ? styles.toolbarButtonActive : undefined}
              />
            </Tooltip>
            <Tooltip content="Bullet List" position="top">
              <IconButton
                icon={<ListBulletIcon />}
                size="sm"
                variant="ghost"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                disabled={disabled}
                aria-label="Bullet list"
                aria-pressed={editor.isActive('bulletList')}
                className={editor.isActive('bulletList') ? styles.toolbarButtonActive : undefined}
              />
            </Tooltip>
            <div className={styles.toolbarDivider} />
            <Tooltip content="Add image" position="top">
              <IconButton
                icon={<ImageIcon />}
                size="sm"
                variant="ghost"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || imagesMap.size >= maxImages}
                aria-label="Add image"
              />
            </Tooltip>
          </div>
        )}

        {/* Input wrapper */}
        <div className={styles.inputWrapper}>
          <div
            className={styles.editorContainer}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
          >
            <EditorContent
              editor={editor}
              className={styles.editor}
            />
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <Tooltip
              content={
                isMultilineMode ? 'Multiline mode (Ctrl+Enter to send)' : 'Single line (Enter to send)'
              }
              position="top"
            >
              <button
                type="button"
                className={`${styles.multilineToggle} ${isMultilineMode ? styles.active : ''}`}
                onClick={() => setIsMultilineMode(!isMultilineMode)}
                aria-label={isMultilineMode ? 'Switch to single line mode' : 'Switch to multiline mode'}
                disabled={disabled}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M2 4h12v1H2V4zm0 3h8v1H2V7zm0 3h10v1H2v-1zm0 3h6v1H2v-1z" />
                </svg>
              </button>
            </Tooltip>

            <Button
              variant="primary"
              size={size}
              onClick={handleSubmit}
              disabled={!canSubmit}
              aria-label="Send message"
              icon={loading ? <Spinner size="sm" /> : sendButtonContent || <SendIcon />}
            />
          </div>
        </div>

        {/* Drop overlay */}
        {isDragging && <div className={styles.dropOverlay}>Drop images here</div>}

        {/* Link dialog */}
        <LinkDialog
          open={isLinkDialogOpen}
          onClose={() => setIsLinkDialogOpen(false)}
          onSubmit={handleLinkSubmit}
          initialDisplayText={selectedText}
        />

        {/* Image preview */}
        <ImagePreview
          open={previewImage !== null}
          onClose={() => setPreviewImage(null)}
          src={previewImage?.thumbnailUrl || ''}
          name={previewImage?.name}
        />
      </div>
    );
  }
);

ChatInput.displayName = 'ChatInput';
