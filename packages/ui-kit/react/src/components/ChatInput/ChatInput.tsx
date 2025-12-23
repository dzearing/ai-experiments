import {
  forwardRef,
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
  type KeyboardEvent,
  type ClipboardEvent,
  type DragEvent,
  type ChangeEvent,
  type MouseEvent,
} from 'react';
import { Button } from '../Button';
import { IconButton } from '../IconButton';
import { Spinner } from '../Spinner';
import { Tooltip } from '../Tooltip';
import { SendIcon } from '@ui-kit/icons/SendIcon';
import { BoldIcon } from '@ui-kit/icons/BoldIcon';
import { ItalicIcon } from '@ui-kit/icons/ItalicIcon';
import { LinkIcon } from '@ui-kit/icons/LinkIcon';
import { CodeIcon } from '@ui-kit/icons/CodeIcon';
import { QuoteIcon } from '@ui-kit/icons/QuoteIcon';
import { ListBulletIcon } from '@ui-kit/icons/ListBulletIcon';
import { ImageIcon } from '@ui-kit/icons/ImageIcon';
import { UnderlineIcon } from '@ui-kit/icons/UnderlineIcon';
import { StrikethroughIcon } from '@ui-kit/icons/StrikethroughIcon';
import { useMessageHistory } from './useMessageHistory';
import styles from './ChatInput.module.css';

export type ChatInputSize = 'sm' | 'md' | 'lg';

export interface ChatInputImage {
  /** Unique identifier for the image */
  id: string;
  /** Display name (e.g., "Image #1") */
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
  /** Markdown text with image placeholders like [Image #1] */
  content: string;
  /** Array of images referenced in the message */
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

// Content segment types
type ContentSegment =
  | { type: 'text'; content: string }
  | { type: 'image'; imageId: string; imageName: string };

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
    // Internal refs
    const internalRef = useRef<HTMLDivElement>(null);
    const editorRef = (ref as React.RefObject<HTMLDivElement>) || internalRef;
    const imageCounterRef = useRef(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // State
    const [segments, setSegments] = useState<ContentSegment[]>([{ type: 'text', content: '' }]);
    const [images, setImages] = useState<ChatInputImage[]>([]);
    const [isMultilineMode, setIsMultilineMode] = useState(initialMultiline);
    const [isDragging, setIsDragging] = useState(false);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [draftSegments, setDraftSegments] = useState<ContentSegment[]>([]);
    const [isFocused, setIsFocused] = useState(false);

    // Flag to skip DOM sync when change came from user input (DOM is already correct)
    const skipDomSyncRef = useRef(false);

    // History hook
    const { getHistory, addToHistory } = useMessageHistory(historyKey, maxHistoryItems);

    // Convert segments to plain text (for history and submission)
    const segmentsToText = useCallback((segs: ContentSegment[]): string => {
      return segs
        .map((seg) => (seg.type === 'text' ? seg.content : `[${seg.imageName}]`))
        .join('');
    }, []);

    // Convert plain text to segments (for history restoration)
    const textToSegments = useCallback((text: string): ContentSegment[] => {
      // Simple conversion - just text, no image chips
      return [{ type: 'text', content: text }];
    }, []);

    // Get plain text value
    const getTextValue = useCallback(() => segmentsToText(segments), [segments, segmentsToText]);

    // Check if content is empty
    const isEmpty = useCallback(() => {
      return segments.every((seg) => seg.type === 'text' && seg.content.trim() === '');
    }, [segments]);

    // Handle submit
    const handleSubmit = useCallback(() => {
      const textValue = getTextValue().trim();
      if (!textValue && images.length === 0) return;

      // Add to history
      if (textValue) {
        addToHistory(textValue);
      }

      // Call onSubmit
      onSubmit?.({
        content: textValue,
        images: [...images],
      });

      // Reset state
      setSegments([{ type: 'text', content: '' }]);
      setImages([]);
      setHistoryIndex(-1);
      setDraftSegments([]);
      imageCounterRef.current = 0;

      // Revoke blob URLs
      images.forEach((img) => URL.revokeObjectURL(img.thumbnailUrl));

      // Clear editor content
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }
    }, [getTextValue, images, addToHistory, onSubmit, editorRef]);

    // Navigate history
    const navigateHistory = useCallback(
      (direction: -1 | 1) => {
        const history = getHistory();
        if (history.length === 0) return;

        if (historyIndex === -1 && direction === -1) {
          // Save current draft before navigating
          setDraftSegments(segments);
        }

        const newIndex = historyIndex + direction;

        if (newIndex < -1) return;
        if (newIndex >= history.length) return;

        if (newIndex === -1) {
          // Return to draft
          setSegments(draftSegments.length > 0 ? draftSegments : [{ type: 'text', content: '' }]);
          setHistoryIndex(-1);
        } else {
          setSegments(textToSegments(history[newIndex]));
          setHistoryIndex(newIndex);
        }
      },
      [getHistory, historyIndex, segments, draftSegments, textToSegments]
    );

    // Sync segments to editor DOM (only when needed, e.g., history navigation)
    useEffect(() => {
      // Skip if change came from user input - DOM is already correct
      if (skipDomSyncRef.current) {
        skipDomSyncRef.current = false;
        return;
      }

      const editor = editorRef.current;
      if (!editor) return;

      // Build new content
      const fragment = document.createDocumentFragment();

      segments.forEach((seg, index) => {
        if (seg.type === 'text') {
          // Split by newlines to handle multiline
          const lines = seg.content.split('\n');
          lines.forEach((line, lineIndex) => {
            if (line) {
              fragment.appendChild(document.createTextNode(line));
            }
            if (lineIndex < lines.length - 1) {
              fragment.appendChild(document.createElement('br'));
            }
          });
        } else {
          // Create chip element
          const chip = document.createElement('span');
          chip.className = styles.imageChip;
          chip.contentEditable = 'false';
          chip.dataset.imageId = seg.imageId;
          chip.dataset.imageName = seg.imageName;
          chip.dataset.segmentIndex = String(index);

          const label = document.createElement('span');
          label.className = styles.imageChipLabel;
          label.textContent = seg.imageName;
          chip.appendChild(label);

          const removeBtn = document.createElement('button');
          removeBtn.className = styles.imageChipRemove;
          removeBtn.type = 'button';
          removeBtn.innerHTML =
            '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
          removeBtn.setAttribute('aria-label', `Remove ${seg.imageName}`);
          chip.appendChild(removeBtn);

          fragment.appendChild(chip);
        }
      });

      // Only update if content differs
      const currentHTML = editor.innerHTML;
      const tempDiv = document.createElement('div');
      tempDiv.appendChild(fragment.cloneNode(true));
      const newHTML = tempDiv.innerHTML;

      if (currentHTML !== newHTML) {
        // Save selection
        const selection = window.getSelection();
        const hadFocus = document.activeElement === editor;

        editor.innerHTML = '';
        editor.appendChild(fragment);

        // Restore focus and move cursor to end
        if (hadFocus && selection) {
          const range = document.createRange();
          range.selectNodeContents(editor);
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    }, [segments, editorRef]);

    // Parse editor content back to segments
    const parseEditorContent = useCallback((): ContentSegment[] => {
      const editor = editorRef.current;
      if (!editor) return [{ type: 'text', content: '' }];

      const newSegments: ContentSegment[] = [];
      let currentText = '';

      const processNode = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          currentText += node.textContent || '';
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          const tagName = element.tagName;

          if (tagName === 'BR') {
            currentText += '\n';
          } else if (element.classList.contains(styles.imageChip)) {
            // Flush current text
            if (currentText) {
              newSegments.push({ type: 'text', content: currentText });
              currentText = '';
            }
            // Add image segment
            newSegments.push({
              type: 'image',
              imageId: element.dataset.imageId || '',
              imageName: element.dataset.imageName || '',
            });
          } else if (tagName === 'DIV' || tagName === 'P') {
            // Block elements create new lines if there's content before them
            if (currentText !== '' && !currentText.endsWith('\n')) {
              currentText += '\n';
            }
            // Process children
            element.childNodes.forEach(processNode);
          } else {
            // Process children for other elements (spans, etc.)
            element.childNodes.forEach(processNode);
          }
        }
      };

      editor.childNodes.forEach(processNode);

      // Flush remaining text
      if (currentText || newSegments.length === 0) {
        newSegments.push({ type: 'text', content: currentText });
      }

      return newSegments;
    }, [editorRef]);

    // Renumber images sequentially and update chips in editor
    const renumberImages = useCallback(() => {
      const editor = editorRef.current;
      if (!editor) return;

      // Get all chips in DOM order
      const chips = editor.querySelectorAll(`.${styles.imageChip}`);
      const orderedIds: string[] = [];
      const renameMap = new Map<string, string>(); // oldId -> newName

      // Build rename map and ordered list based on DOM order
      chips.forEach((chip, index) => {
        const imageId = (chip as HTMLElement).dataset.imageId;
        if (imageId) {
          orderedIds.push(imageId);
          renameMap.set(imageId, `Image #${index + 1}`);
        }
      });

      // Update chip labels in DOM
      chips.forEach((chip) => {
        const imageId = (chip as HTMLElement).dataset.imageId;
        const newName = imageId ? renameMap.get(imageId) : undefined;
        if (newName) {
          const label = chip.querySelector(`.${styles.imageChipLabel}`);
          if (label) {
            label.textContent = newName;
          }
          (chip as HTMLElement).dataset.imageName = newName;
          const removeBtn = chip.querySelector(`.${styles.imageChipRemove}`);
          if (removeBtn) {
            removeBtn.setAttribute('aria-label', `Remove ${newName}`);
          }
        }
      });

      // Update images array: rename and reorder based on DOM order
      setImages((prev) => {
        const imageMap = new Map(prev.map((img) => [img.id, img]));
        return orderedIds
          .map((id) => {
            const img = imageMap.get(id);
            const newName = renameMap.get(id);
            return img && newName ? { ...img, name: newName } : null;
          })
          .filter((img): img is ChatInputImage => img !== null);
      });

      // Update segments with new names
      setSegments((prev) => {
        return prev.map((seg) => {
          if (seg.type === 'image') {
            const newName = renameMap.get(seg.imageId);
            return newName ? { ...seg, imageName: newName } : seg;
          }
          return seg;
        });
      });

      // Update counter to match current count
      imageCounterRef.current = chips.length;
    }, [editorRef]);

    // Handle editor input
    const handleInput = useCallback(() => {
      const newSegments = parseEditorContent();

      // Sync images array with chips in editor - remove images whose chips were deleted
      const imageIdsInEditor = new Set(
        newSegments
          .filter((seg): seg is { type: 'image'; imageId: string; imageName: string } => seg.type === 'image')
          .map((seg) => seg.imageId)
      );

      setImages((prev) => {
        const removed = prev.filter((img) => !imageIdsInEditor.has(img.id));
        // Revoke blob URLs for removed images
        removed.forEach((img) => URL.revokeObjectURL(img.thumbnailUrl));
        return prev.filter((img) => imageIdsInEditor.has(img.id));
      });

      // Renumber remaining images sequentially (synchronously to avoid cursor issues)
      renumberImages();

      // Skip DOM sync since we're updating from user input - DOM is already correct
      skipDomSyncRef.current = true;
      setSegments(newSegments);

      // Reset history navigation when typing
      if (historyIndex !== -1) {
        setHistoryIndex(-1);
      }
    }, [parseEditorContent, historyIndex, renumberImages]);

    // Insert text at cursor
    const insertTextAtCursor = useCallback((text: string) => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(text));
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }, []);

    // Insert image chip at cursor
    const insertImageChip = useCallback(
      (imageId: string, imageName: string) => {
        const editor = editorRef.current;
        if (!editor) return;

        // Get current selection or move to end
        const selection = window.getSelection();
        let range: Range;

        if (selection && selection.rangeCount > 0 && editor.contains(selection.anchorNode)) {
          range = selection.getRangeAt(0);
        } else {
          // Create range at end
          range = document.createRange();
          range.selectNodeContents(editor);
          range.collapse(false);
        }

        // Create chip
        const chip = document.createElement('span');
        chip.className = styles.imageChip;
        chip.contentEditable = 'false';
        chip.dataset.imageId = imageId;
        chip.dataset.imageName = imageName;

        const label = document.createElement('span');
        label.className = styles.imageChipLabel;
        label.textContent = imageName;
        chip.appendChild(label);

        const removeBtn = document.createElement('button');
        removeBtn.className = styles.imageChipRemove;
        removeBtn.type = 'button';
        removeBtn.innerHTML =
          '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
        removeBtn.setAttribute('aria-label', `Remove ${imageName}`);
        chip.appendChild(removeBtn);

        // Insert chip
        range.deleteContents();
        range.insertNode(chip);

        // Move cursor after chip
        range.setStartAfter(chip);
        range.setEndAfter(chip);
        selection?.removeAllRanges();
        selection?.addRange(range);

        // Skip DOM sync since we just modified it directly - cursor is already positioned
        skipDomSyncRef.current = true;

        // Update segments
        setSegments(parseEditorContent());

        // Focus editor
        editor.focus();
      },
      [editorRef, parseEditorContent]
    );

    // Wrap selection with prefix/suffix
    const wrapSelection = useCallback((prefix: string, suffix: string) => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const selectedText = range.toString();

      // Create the text node with wrapped content
      const textNode = document.createTextNode(prefix + selectedText + suffix);

      range.deleteContents();
      range.insertNode(textNode);

      // Position cursor: after wrapped text if selection existed, or between prefix/suffix if not
      const newRange = document.createRange();
      if (selectedText) {
        // Move cursor after the entire wrapped text
        newRange.setStartAfter(textNode);
        newRange.setEndAfter(textNode);
      } else {
        // Move cursor between prefix and suffix (where user would type)
        newRange.setStart(textNode, prefix.length);
        newRange.setEnd(textNode, prefix.length);
      }
      selection.removeAllRanges();
      selection.addRange(newRange);
    }, []);

    // Insert markdown link
    const insertLink = useCallback(() => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const selectedText = range.toString() || 'link text';
      const linkMarkdown = `[${selectedText}](https://url)`;

      range.deleteContents();
      const textNode = document.createTextNode(linkMarkdown);
      range.insertNode(textNode);

      // Select "url" for easy replacement (after "https://")
      const urlStart = selectedText.length + 3 + 8; // +3 for "](", +8 for "https://"
      range.setStart(textNode, urlStart);
      range.setEnd(textNode, urlStart + 3); // select "url"
      selection.removeAllRanges();
      selection.addRange(range);
    }, []);

    // Handle keyboard events
    const handleKeyDown = useCallback(
      (e: KeyboardEvent<HTMLDivElement>) => {
        const { key, ctrlKey, metaKey, shiftKey } = e;
        const modKey = ctrlKey || metaKey;

        // Escape handling
        if (key === 'Escape') {
          e.preventDefault();
          const selection = window.getSelection();

          // If text is selected, unselect it
          if (selection && !selection.isCollapsed) {
            selection.collapseToEnd();
            return;
          }

          // Otherwise, clear content and reset to single-line mode
          setSegments([{ type: 'text', content: '' }]);
          setImages((prev) => {
            prev.forEach((img) => URL.revokeObjectURL(img.thumbnailUrl));
            return [];
          });
          imageCounterRef.current = 0;
          if (editorRef.current) {
            editorRef.current.innerHTML = '';
          }
          if (isMultilineMode) {
            setIsMultilineMode(false);
          }
          return;
        }

        // Submit handling
        if (key === 'Enter') {
          if (isMultilineMode) {
            // Multiline: Ctrl/Cmd+Enter submits and resets to single-line mode
            if (modKey) {
              e.preventDefault();
              handleSubmit();
              setIsMultilineMode(false);
            }
            // Plain Enter creates newline (default behavior via contenteditable)
          } else {
            // Single-line mode: Meta/Ctrl+Enter enters multiline mode and adds newline
            if (modKey && !shiftKey) {
              e.preventDefault();
              setIsMultilineMode(true);
              // Insert a newline at cursor
              document.execCommand('insertLineBreak');
              handleInput();
              return;
            }
            // Enter submits, Shift+Enter creates newline
            if (!shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }
          return;
        }

        // History navigation (only when content is empty or at boundaries)
        const editor = editorRef.current;
        if (editor && historyKey) {
          const selection = window.getSelection();
          const isAtStart =
            selection &&
            selection.isCollapsed &&
            selection.anchorOffset === 0 &&
            (!selection.anchorNode ||
              selection.anchorNode === editor ||
              selection.anchorNode === editor.firstChild);

          const isAtEnd =
            selection &&
            selection.isCollapsed &&
            (!selection.anchorNode ||
              selection.anchorNode === editor ||
              (selection.anchorNode.nodeType === Node.TEXT_NODE &&
                selection.anchorOffset === (selection.anchorNode.textContent?.length || 0)));

          if (key === 'ArrowUp' && isAtStart) {
            e.preventDefault();
            navigateHistory(1); // Go back in history (older messages)
            return;
          }
          if (key === 'ArrowDown' && isAtEnd) {
            e.preventDefault();
            navigateHistory(-1); // Go forward in history (newer messages / draft)
            return;
          }
        }

        // Markdown formatting shortcuts
        if (modKey) {
          switch (key.toLowerCase()) {
            case 'b': // Bold
              e.preventDefault();
              wrapSelection('**', '**');
              handleInput();
              break;
            case 'i': // Italic
              e.preventDefault();
              wrapSelection('*', '*');
              handleInput();
              break;
            case 'u': // Underline (using HTML tag for markdown compatibility)
              e.preventDefault();
              wrapSelection('<u>', '</u>');
              handleInput();
              break;
            case 's': // Strikethrough (Ctrl+Shift+S)
              if (shiftKey) {
                e.preventDefault();
                wrapSelection('~~', '~~');
                handleInput();
              }
              break;
            case 'k': // Link
              e.preventDefault();
              insertLink();
              handleInput();
              break;
            case '`': // Inline code
              e.preventDefault();
              wrapSelection('`', '`');
              handleInput();
              break;
          }
        }
      },
      [
        isMultilineMode,
        handleSubmit,
        editorRef,
        historyKey,
        navigateHistory,
        wrapSelection,
        insertLink,
        handleInput,
      ]
    );

    // Handle chip remove button click
    const handleEditorClick = useCallback(
      (e: MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;

        // Check if clicked on remove button
        if (target.closest(`.${styles.imageChipRemove}`)) {
          e.preventDefault();
          e.stopPropagation();

          const chip = target.closest(`.${styles.imageChip}`) as HTMLElement;
          if (chip) {
            const imageId = chip.dataset.imageId;

            // Remove from images array
            if (imageId) {
              setImages((prev) => {
                const image = prev.find((img) => img.id === imageId);
                if (image) {
                  URL.revokeObjectURL(image.thumbnailUrl);
                }
                return prev.filter((img) => img.id !== imageId);
              });
            }

            // Remove chip from DOM and update segments
            chip.remove();
            setSegments(parseEditorContent());
          }
        }
      },
      [parseEditorContent]
    );

    // Add image
    const addImage = useCallback(
      async (file: File) => {
        if (images.length >= maxImages) {
          return;
        }

        imageCounterRef.current += 1;
        const imageNumber = imageCounterRef.current;
        const imageName = `Image #${imageNumber}`;
        const imageId = `img-${Date.now()}-${imageNumber}`;

        const newImage: ChatInputImage = {
          id: imageId,
          name: imageName,
          thumbnailUrl: URL.createObjectURL(file),
          file,
          status: 'pending',
        };

        setImages((prev) => [...prev, newImage]);

        // Insert chip at cursor
        insertImageChip(imageId, imageName);

        // Renumber all images based on their position in the content
        renumberImages();

        // Upload if callback provided
        if (onImageUpload) {
          setImages((prev) =>
            prev.map((img) => (img.id === imageId ? { ...img, status: 'uploading' } : img))
          );

          try {
            const uploadedUrl = await onImageUpload(file);
            setImages((prev) =>
              prev.map((img) =>
                img.id === imageId ? { ...img, status: 'uploaded', uploadedUrl } : img
              )
            );
          } catch {
            setImages((prev) =>
              prev.map((img) => (img.id === imageId ? { ...img, status: 'error' } : img))
            );
          }
        }
      },
      [images.length, maxImages, onImageUpload, insertImageChip, renumberImages]
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

        // For text paste, let default behavior handle it, then sync
        setTimeout(() => handleInput(), 0);
      },
      [addImage, handleInput]
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

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      },
      [addImage]
    );

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

    const textValue = getTextValue();
    const canSubmit = (textValue.trim() || images.length > 0) && !disabled && !loading;
    const showPlaceholder = isEmpty() && !isFocused;

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

        {/* Image well - shows thumbnails of attached images */}
        {images.length > 0 && (
          <div className={styles.imageWell}>
            {images.map((image) => (
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
                  onClick={() => {
                    // Find and select the chip in the editor
                    const editor = editorRef.current;
                    if (!editor) return;
                    const chip = editor.querySelector(
                      `.${styles.imageChip}[data-image-id="${image.id}"]`
                    );
                    if (chip) {
                      const selection = window.getSelection();
                      const range = document.createRange();
                      range.selectNode(chip);
                      selection?.removeAllRanges();
                      selection?.addRange(range);
                      editor.focus();
                    }
                  }}
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
        {isMultilineMode && (
          <div className={styles.toolbar}>
            <Tooltip content="Bold (Ctrl+B)" position="top">
              <IconButton
                icon={<BoldIcon />}
                size="sm"
                variant="ghost"
                onClick={() => {
                  wrapSelection('**', '**');
                  handleInput();
                }}
                disabled={disabled}
                aria-label="Bold"
              />
            </Tooltip>
            <Tooltip content="Italic (Ctrl+I)" position="top">
              <IconButton
                icon={<ItalicIcon />}
                size="sm"
                variant="ghost"
                onClick={() => {
                  wrapSelection('*', '*');
                  handleInput();
                }}
                disabled={disabled}
                aria-label="Italic"
              />
            </Tooltip>
            <Tooltip content="Underline (Ctrl+U)" position="top">
              <IconButton
                icon={<UnderlineIcon />}
                size="sm"
                variant="ghost"
                onClick={() => {
                  wrapSelection('<u>', '</u>');
                  handleInput();
                }}
                disabled={disabled}
                aria-label="Underline"
              />
            </Tooltip>
            <Tooltip content="Strikethrough (Ctrl+Shift+S)" position="top">
              <IconButton
                icon={<StrikethroughIcon />}
                size="sm"
                variant="ghost"
                onClick={() => {
                  wrapSelection('~~', '~~');
                  handleInput();
                }}
                disabled={disabled}
                aria-label="Strikethrough"
              />
            </Tooltip>
            <Tooltip content="Code (Ctrl+`)" position="top">
              <IconButton
                icon={<CodeIcon />}
                size="sm"
                variant="ghost"
                onClick={() => {
                  wrapSelection('`', '`');
                  handleInput();
                }}
                disabled={disabled}
                aria-label="Inline code"
              />
            </Tooltip>
            <Tooltip content="Link (Ctrl+K)" position="top">
              <IconButton
                icon={<LinkIcon />}
                size="sm"
                variant="ghost"
                onClick={() => {
                  insertLink();
                  handleInput();
                }}
                disabled={disabled}
                aria-label="Insert link"
              />
            </Tooltip>
            <Tooltip content="Quote" position="top">
              <IconButton
                icon={<QuoteIcon />}
                size="sm"
                variant="ghost"
                onClick={() => {
                  insertTextAtCursor('> ');
                  handleInput();
                }}
                disabled={disabled}
                aria-label="Quote"
              />
            </Tooltip>
            <Tooltip content="List" position="top">
              <IconButton
                icon={<ListBulletIcon />}
                size="sm"
                variant="ghost"
                onClick={() => {
                  insertTextAtCursor('- ');
                  handleInput();
                }}
                disabled={disabled}
                aria-label="List"
              />
            </Tooltip>
            <div className={styles.toolbarDivider} />
            <Tooltip content="Add image" position="top">
              <IconButton
                icon={<ImageIcon />}
                size="sm"
                variant="ghost"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || images.length >= maxImages}
                aria-label="Add image"
              />
            </Tooltip>
          </div>
        )}

        {/* Input wrapper */}
        <div className={styles.inputWrapper}>
          <div className={styles.editorContainer}>
            {showPlaceholder && <div className={styles.placeholder}>{placeholder}</div>}
            <div
              ref={editorRef}
              className={styles.editor}
              contentEditable={!disabled}
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onClick={handleEditorClick}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              role="textbox"
              aria-multiline={isMultilineMode}
              aria-placeholder={placeholder}
              aria-disabled={disabled}
              suppressContentEditableWarning
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
      </div>
    );
  }
);

ChatInput.displayName = 'ChatInput';
