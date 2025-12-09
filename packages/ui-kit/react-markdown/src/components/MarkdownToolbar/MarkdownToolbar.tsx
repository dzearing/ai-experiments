/**
 * MarkdownToolbar component
 *
 * Standalone toolbar for markdown editing with TipTap.
 * Can be placed anywhere and connected to an editor instance.
 *
 * Surfaces used:
 * - popout (toolbar background)
 * - controlSubtle (buttons)
 *
 * Tokens used:
 * - --popout-bg, --popout-border
 * - --controlSubtle-bg, --controlSubtle-bg-hover
 * - --space-1, --space-2
 * - --radius-sm
 */

import { type ReactNode } from 'react';
import type { Editor } from '@tiptap/react';
import type { ToolbarButton } from '../../types/editor';
import styles from './MarkdownToolbar.module.css';

export interface MarkdownToolbarProps {
  /** TipTap editor instance */
  editor: Editor | null;
  /** Features to show */
  features?: {
    formatting?: boolean;
    headings?: boolean;
    lists?: boolean;
    blocks?: boolean;
    links?: boolean;
    undo?: boolean;
  };
  /** Toolbar size */
  size?: 'sm' | 'md' | 'lg';
  /** Toolbar variant */
  variant?: 'default' | 'bordered' | 'floating';
  /** Custom buttons to add */
  customButtons?: ToolbarButton[];
  /** Additional class name */
  className?: string;
}

// SVG Icons as components
const BoldIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M4 2h5.5a3.5 3.5 0 0 1 2.45 6A3.5 3.5 0 0 1 9.5 14H4V2zm2 5h3.5a1.5 1.5 0 0 0 0-3H6v3zm0 2v3h3.5a1.5 1.5 0 0 0 0-3H6z"/>
  </svg>
);

const ItalicIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M6 2h6v2h-2.18l-2.64 8H10v2H4v-2h2.18l2.64-8H6V2z"/>
  </svg>
);

const StrikethroughIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8.5 3C6.5 3 5 4.5 5 6.5c0 .5.1 1 .3 1.5H3v2h10v-2h-2.3c.2-.5.3-1 .3-1.5 0-2-1.5-3.5-3.5-3.5zm0 2c.8 0 1.5.7 1.5 1.5S9.3 8 8.5 8 7 7.3 7 6.5 7.7 5 8.5 5zm0 6c-2 0-3.5 1.5-3.5 3.5h2c0-.8.7-1.5 1.5-1.5s1.5.7 1.5 1.5h2c0-2-1.5-3.5-3.5-3.5z"/>
  </svg>
);

const CodeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M5.854 4.146a.5.5 0 0 1 0 .708L2.707 8l3.147 3.146a.5.5 0 0 1-.708.708l-3.5-3.5a.5.5 0 0 1 0-.708l3.5-3.5a.5.5 0 0 1 .708 0zm4.292 0a.5.5 0 0 0 0 .708L13.293 8l-3.147 3.146a.5.5 0 0 0 .708.708l3.5-3.5a.5.5 0 0 0 0-.708l-3.5-3.5a.5.5 0 0 0-.708 0z"/>
  </svg>
);

const Heading1Icon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 4v8m-4-4h8M2 2h2v12H2V2zm10 0h2v12h-2V2z"/>
    <text x="8" y="12" fontSize="8" textAnchor="middle">H1</text>
  </svg>
);

const Heading2Icon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <text x="8" y="12" fontSize="10" textAnchor="middle">H2</text>
  </svg>
);

const Heading3Icon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <text x="8" y="12" fontSize="10" textAnchor="middle">H3</text>
  </svg>
);

const BulletListIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <circle cx="3" cy="4" r="1.5"/>
    <circle cx="3" cy="8" r="1.5"/>
    <circle cx="3" cy="12" r="1.5"/>
    <rect x="6" y="3" width="8" height="2" rx="0.5"/>
    <rect x="6" y="7" width="8" height="2" rx="0.5"/>
    <rect x="6" y="11" width="8" height="2" rx="0.5"/>
  </svg>
);

const OrderedListIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <text x="3" y="5" fontSize="5">1.</text>
    <text x="3" y="9" fontSize="5">2.</text>
    <text x="3" y="13" fontSize="5">3.</text>
    <rect x="6" y="3" width="8" height="2" rx="0.5"/>
    <rect x="6" y="7" width="8" height="2" rx="0.5"/>
    <rect x="6" y="11" width="8" height="2" rx="0.5"/>
  </svg>
);

const BlockquoteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M2 4h3v3H2V4zm0 5h3v3H2V9zm6-5h3v3H8V4zm0 5h3v3H8V9z"/>
  </svg>
);

const CodeBlockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <rect x="1" y="2" width="14" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M5 6l-2 2 2 2M11 6l2 2-2 2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
  </svg>
);

const DividerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <rect x="1" y="7" width="14" height="2" rx="0.5"/>
  </svg>
);

const LinkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M6.354 5.354l-3 3a2.5 2.5 0 0 0 3.536 3.536l.707-.707-1.414-1.414-.707.707a.5.5 0 0 1-.707-.707l3-3a.5.5 0 0 1 .707.707l-.707.707 1.414 1.414.707-.707a2.5 2.5 0 0 0-3.536-3.536z"/>
    <path d="M9.646 10.646l3-3a2.5 2.5 0 0 0-3.536-3.536l-.707.707 1.414 1.414.707-.707a.5.5 0 0 1 .707.707l-3 3a.5.5 0 0 1-.707-.707l.707-.707-1.414-1.414-.707.707a2.5 2.5 0 0 0 3.536 3.536z"/>
  </svg>
);

const UndoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 3a5 5 0 0 1 5 5 5 5 0 0 1-5 5v-2a3 3 0 0 0 3-3 3 3 0 0 0-3-3H5v3L1 5l4-4v2h3z"/>
  </svg>
);

const RedoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 3a5 5 0 0 0-5 5 5 5 0 0 0 5 5v-2a3 3 0 0 1-3-3 3 3 0 0 1 3-3h3v3l4-3-4-4v2H8z"/>
  </svg>
);

export function MarkdownToolbar({
  editor,
  features = {},
  size = 'md',
  variant = 'default',
  customButtons = [],
  className,
}: MarkdownToolbarProps) {
  const {
    formatting = true,
    headings = true,
    lists = true,
    blocks = true,
    links = true,
    undo = true,
  } = features;

  if (!editor) {
    return null;
  }

  const toolbarClass = [
    styles.toolbar,
    styles[variant],
    styles[size],
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={toolbarClass} role="toolbar" aria-label="Formatting options">
      {/* Undo/Redo */}
      {undo && (
        <div className={styles.group}>
          <ToolbarBtn
            icon={<UndoIcon />}
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            tooltip="Undo (Ctrl+Z)"
            size={size}
          />
          <ToolbarBtn
            icon={<RedoIcon />}
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            tooltip="Redo (Ctrl+Shift+Z)"
            size={size}
          />
        </div>
      )}

      {undo && formatting && <Divider />}

      {/* Formatting */}
      {formatting && (
        <div className={styles.group}>
          <ToolbarBtn
            icon={<BoldIcon />}
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            tooltip="Bold (Ctrl+B)"
            size={size}
          />
          <ToolbarBtn
            icon={<ItalicIcon />}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            tooltip="Italic (Ctrl+I)"
            size={size}
          />
          <ToolbarBtn
            icon={<StrikethroughIcon />}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            tooltip="Strikethrough"
            size={size}
          />
          <ToolbarBtn
            icon={<CodeIcon />}
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive('code')}
            tooltip="Inline Code (Ctrl+E)"
            size={size}
          />
        </div>
      )}

      {formatting && headings && <Divider />}

      {/* Headings */}
      {headings && (
        <div className={styles.group}>
          <ToolbarBtn
            icon={<Heading1Icon />}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            tooltip="Heading 1"
            size={size}
          />
          <ToolbarBtn
            icon={<Heading2Icon />}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            tooltip="Heading 2"
            size={size}
          />
          <ToolbarBtn
            icon={<Heading3Icon />}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            tooltip="Heading 3"
            size={size}
          />
        </div>
      )}

      {headings && lists && <Divider />}

      {/* Lists */}
      {lists && (
        <div className={styles.group}>
          <ToolbarBtn
            icon={<BulletListIcon />}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            tooltip="Bullet List"
            size={size}
          />
          <ToolbarBtn
            icon={<OrderedListIcon />}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            tooltip="Numbered List"
            size={size}
          />
        </div>
      )}

      {lists && blocks && <Divider />}

      {/* Blocks */}
      {blocks && (
        <div className={styles.group}>
          <ToolbarBtn
            icon={<BlockquoteIcon />}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            tooltip="Blockquote"
            size={size}
          />
          <ToolbarBtn
            icon={<CodeBlockIcon />}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={editor.isActive('codeBlock')}
            tooltip="Code Block"
            size={size}
          />
          <ToolbarBtn
            icon={<DividerIcon />}
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            tooltip="Divider"
            size={size}
          />
        </div>
      )}

      {blocks && links && <Divider />}

      {/* Links */}
      {links && (
        <div className={styles.group}>
          <ToolbarBtn
            icon={<LinkIcon />}
            onClick={() => {
              const url = window.prompt('Enter URL:');
              if (url) {
                editor.chain().focus().setLink({ href: url }).run();
              }
            }}
            isActive={editor.isActive('link')}
            tooltip="Insert Link"
            size={size}
          />
        </div>
      )}

      {/* Custom buttons */}
      {customButtons.length > 0 && (
        <>
          <Divider />
          <div className={styles.group}>
            {customButtons.map((btn, index) => (
              <ToolbarBtn
                key={index}
                icon={btn.icon}
                onClick={btn.onClick}
                isActive={btn.isActive}
                disabled={btn.disabled}
                tooltip={btn.tooltip}
                size={size}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Toolbar button component
interface ToolbarBtnProps {
  icon: ReactNode;
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  tooltip?: string;
  size: 'sm' | 'md' | 'lg';
}

function ToolbarBtn({
  icon,
  onClick,
  isActive,
  disabled,
  tooltip,
  size,
}: ToolbarBtnProps) {
  return (
    <button
      className={`${styles.button} ${styles[size]} ${isActive ? styles.active : ''}`}
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
      aria-pressed={isActive}
      type="button"
    >
      {icon}
    </button>
  );
}

// Divider component
function Divider() {
  return <div className={styles.divider} role="separator" />;
}

export default MarkdownToolbar;
