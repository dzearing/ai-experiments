import {
  forwardRef,
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
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
import { LinkDialog } from './LinkDialog';
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

export interface ChatInputSubmitData {
  /** Markdown text content */
  content: string;
  /** Array of images referenced in the message (in content order) */
  images: ChatInputImage[];
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

  /** Custom class name */
  className?: string;
}

export const ChatInput = forwardRef<HTMLDivElement, ChatInputProps>(
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
      placeholder = 'Type a message...',
      className = '',
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

    // Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // History hook
    const { getHistory, addToHistory } = useMessageHistory(historyKey, maxHistoryItems);

    // TipTap editor
    const editor = useChatEditor({
      placeholder,
      disabled,
      onChange: (editorIsEmpty) => {
        setIsEmpty(editorIsEmpty);
        // Reset history navigation when typing
        if (historyIndex !== -1) {
          setHistoryIndex(-1);
        }
      },
    });

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

    // Get content from editor
    // Use getHTML() to preserve HTML formatting like <u> for underline
    // The MarkdownRenderer uses rehypeRaw to handle HTML in markdown
    const getContent = useCallback((): string => {
      if (!editor) return '';
      // Get HTML content and convert to a format suitable for markdown rendering
      const html = editor.getHTML();
      // Remove wrapper <p> tags if it's a single paragraph
      const singleParagraph = html.match(/^<p>(.*)<\/p>$/s);
      if (singleParagraph) {
        return singleParagraph[1];
      }
      return html;
    }, [editor]);

    // Handle submit
    const handleSubmit = useCallback(() => {
      const content = getContent().trim();
      if (!content && imagesInContentOrder.length === 0) return;

      // Add to history
      if (content) {
        addToHistory(content);
      }

      // Call onSubmit with images in content order
      onSubmit?.({
        content,
        images: [...imagesInContentOrder],
      });

      // Reset state
      editor?.commands.clearContent();
      setImagesMap(new Map());

      setHistoryIndex(-1);
      setDraftContent('');
      setIsEmpty(true);
    }, [getContent, imagesInContentOrder, addToHistory, onSubmit, editor]);

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
        const { key, ctrlKey, metaKey, shiftKey } = e;
        const modKey = ctrlKey || metaKey;

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

        // Submit handling
        if (key === 'Enter') {
          if (isMultilineMode) {
            if (modKey) {
              e.preventDefault();
              handleSubmit();
              setIsMultilineMode(false);
            }
          } else {
            if (modKey && !shiftKey) {
              e.preventDefault();
              setIsMultilineMode(true);
              return;
            }
            if (!shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }
          return;
        }

        // History navigation with smart cursor behavior
        if (editor && historyKey) {
          const { from } = editor.state.selection;
          const docSize = editor.state.doc.content.size;
          const isAtStart = from === 0 || from === 1;
          const isAtEnd = from >= docSize - 1;

          // Check if on first/last line for multiline mode
          const $from = editor.state.selection.$from;
          const isOnFirstLine = $from.before($from.depth) <= 1;
          const isOnLastLine = $from.after($from.depth) >= docSize - 1;

          if (key === 'ArrowUp') {
            // In single-line mode, or on first line in multiline mode
            if (!isMultilineMode || isOnFirstLine) {
              e.preventDefault();
              if (isAtStart) {
                // Already at start - navigate history, keep cursor at start
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
      [isMultilineMode, handleSubmit, editor, historyKey, navigateHistory, openLinkDialog, escapePressed]
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
        ref={(node) => {
          containerRef.current = node;
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
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
