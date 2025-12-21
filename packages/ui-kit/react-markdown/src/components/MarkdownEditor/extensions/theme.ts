/**
 * CodeMirror theme using design system tokens
 *
 * Creates a theme that integrates with CSS custom properties
 * for consistent theming across light/dark modes.
 */

import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

/**
 * Editor theme using CSS custom properties from the design system.
 * All colors adapt automatically when theme changes.
 *
 * Token mapping from ui-kit/core themes:
 * - --softer-bg: Editor background (darker/indented surfaces)
 * - --softer-fg: Editor text color
 * - --softer-border: Editor borders
 * - --base-fg: Primary text color
 * - --base-fg-soft: Secondary/muted text
 * - --soft-bg: Panel/card backgrounds
 * - --soft-border: Panel/card borders
 */
export const editorTheme = EditorView.theme({
  // Root editor container
  '&': {
    backgroundColor: 'var(--softer-bg, #f8f9fa)',
    color: 'var(--softer-fg, var(--base-fg, #24292e))',
    height: '100%',
  },

  // Content area
  '.cm-content': {
    fontFamily: 'var(--font-mono, ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace)',
    fontSize: 'var(--text-sm, 13px)',
    lineHeight: '1.5',
    padding: 'var(--space-2, 8px) 0',
    caretColor: 'var(--base-fg, #24292e)',
  },

  // Editor container that allows focus
  '&.cm-focused': {
    outline: 'none',
  },

  // Gutters (line numbers, fold markers)
  '.cm-gutters': {
    backgroundColor: 'var(--soft-bg, rgba(0, 0, 0, 0.03))',
    color: 'var(--base-fg-soft, rgba(0, 0, 0, 0.4))',
    borderRight: '1px solid var(--softer-border, var(--base-border, #e1e4e8))',
    fontFamily: 'var(--font-mono, ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace)',
    fontSize: 'var(--text-sm, 13px)',
  },

  // Line numbers gutter
  '.cm-lineNumbers': {
    minWidth: '40px',
  },

  '.cm-lineNumbers .cm-gutterElement': {
    padding: '0 8px 0 12px',
    minWidth: '32px',
    textAlign: 'right',
  },

  // Fold gutter
  '.cm-foldGutter': {
    width: '16px',
  },

  '.cm-foldGutter .cm-gutterElement': {
    padding: '0 2px',
    cursor: 'pointer',
    color: 'var(--base-fg-softer, var(--base-fg-soft, rgba(0, 0, 0, 0.3)))',
    transition: 'color var(--duration-fast, 100ms)',
  },

  '.cm-foldGutter .cm-gutterElement:hover': {
    color: 'var(--base-fg, #24292e)',
  },

  // Cursor
  '.cm-cursor': {
    borderLeftColor: 'var(--base-fg, #24292e)',
    borderLeftWidth: '2px',
  },

  // Selection
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: 'var(--selection-bg, rgba(0, 120, 212, 0.2))',
  },

  '.cm-selectionMatch': {
    backgroundColor: 'var(--selection-bg, rgba(0, 120, 212, 0.15))',
  },

  // Active line highlight
  '.cm-activeLine': {
    backgroundColor: 'var(--softer-bg-hover, rgba(0, 0, 0, 0.02))',
  },

  '.cm-activeLineGutter': {
    backgroundColor: 'var(--softer-bg-hover, rgba(0, 0, 0, 0.05))',
  },

  // Search panel
  '.cm-panels': {
    backgroundColor: 'var(--soft-bg, #ffffff)',
    borderBottom: '1px solid var(--soft-border, #e1e4e8)',
    fontFamily: 'var(--font-sans, system-ui, -apple-system, sans-serif)',
    fontSize: 'var(--text-sm, 13px)',
  },

  '.cm-panels.cm-panels-top': {
    borderBottom: '1px solid var(--soft-border, #e1e4e8)',
  },

  // Search matches - soft yellow highlight
  '.cm-searchMatch': {
    backgroundColor: 'rgba(255, 220, 0, 0.25)',
    borderRadius: '2px',
  },

  // Currently selected search match - prominent orange with border
  '.cm-searchMatch.cm-searchMatch-selected': {
    backgroundColor: 'rgba(255, 140, 0, 0.5)',
    outline: '2px solid rgba(255, 100, 0, 0.8)',
    borderRadius: '2px',
  },

  // Tooltip (autocomplete, etc.)
  '.cm-tooltip': {
    backgroundColor: 'var(--strong-bg, #ffffff)',
    border: '1px solid var(--strong-border, #e1e4e8)',
    borderRadius: 'var(--radius-sm, 4px)',
    boxShadow: 'var(--shadow-lg, 0 4px 6px rgba(0, 0, 0, 0.1))',
  },

  // Placeholder
  '.cm-placeholder': {
    color: 'var(--base-fg-softer, var(--base-fg-soft, rgba(0, 0, 0, 0.4)))',
    fontStyle: 'italic',
  },

  // Fold placeholder
  '.cm-foldPlaceholder': {
    backgroundColor: 'var(--soft-bg, #f6f8fa)',
    border: '1px solid var(--soft-border, #e1e4e8)',
    borderRadius: 'var(--radius-sm, 2px)',
    color: 'var(--base-fg-soft, #6a737d)',
    padding: '0 4px',
    margin: '0 2px',
    fontSize: '0.85em',
  },

  // Scrollbar styling
  '.cm-scroller': {
    scrollbarWidth: 'thin',
    scrollbarColor: 'var(--base-fg-softer, rgba(0, 0, 0, 0.2)) transparent',
  },

  '.cm-scroller::-webkit-scrollbar': {
    width: '8px',
    height: '8px',
  },

  '.cm-scroller::-webkit-scrollbar-track': {
    background: 'transparent',
  },

  '.cm-scroller::-webkit-scrollbar-thumb': {
    background: 'var(--base-fg-softer, rgba(0, 0, 0, 0.2))',
    borderRadius: '4px',
  },

  '.cm-scroller::-webkit-scrollbar-thumb:hover': {
    background: 'var(--base-fg-soft, rgba(0, 0, 0, 0.3))',
  },

  // Line wrap indicator
  '.cm-lineWrapping': {
    wordBreak: 'break-word',
  },

  // =========================================================================
  // yCollab remote cursor styles (y-codemirror.next)
  // These styles are used when collaborative editing with Yjs
  // =========================================================================

  // Remote user selection highlight
  '.yRemoteSelection': {
    backgroundColor: 'var(--yCollab-selection-color, rgba(100, 150, 250, 0.3))',
    borderRadius: '2px',
  },

  // Remote user cursor caret
  '.yRemoteSelectionHead': {
    position: 'absolute',
    borderLeft: '2px solid var(--yCollab-cursor-color, #3b82f6)',
    borderTop: 'none',
    borderBottom: 'none',
    height: '1em',
    boxSizing: 'border-box',
  },

  // Remote user cursor label (name tag)
  '.yRemoteSelectionHead::after': {
    content: 'attr(data-name)',
    position: 'absolute',
    bottom: '100%',
    left: '-2px',
    backgroundColor: 'var(--yCollab-cursor-color, #3b82f6)',
    color: 'white',
    fontSize: '11px',
    fontFamily: 'var(--font-sans, system-ui, -apple-system, sans-serif)',
    fontWeight: '600',
    padding: '2px 6px',
    borderRadius: '4px',
    whiteSpace: 'nowrap',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
    zIndex: '10',
    pointerEvents: 'none',
  },
});

/**
 * Syntax highlighting using design tokens.
 * Colors adapt to light/dark mode via CSS custom properties.
 */
export const syntaxHighlightStyle = HighlightStyle.define([
  // Headings
  { tag: tags.heading1, fontWeight: 'bold', fontSize: '1.4em' },
  { tag: tags.heading2, fontWeight: 'bold', fontSize: '1.25em' },
  { tag: tags.heading3, fontWeight: 'bold', fontSize: '1.1em' },
  { tag: tags.heading4, fontWeight: 'bold' },
  { tag: tags.heading5, fontWeight: 'bold' },
  { tag: tags.heading6, fontWeight: 'bold' },

  // Emphasis
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.strong, fontWeight: 'bold' },
  { tag: tags.strikethrough, textDecoration: 'line-through' },

  // Code
  {
    tag: tags.monospace,
    fontFamily: 'var(--font-mono, ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace)',
    backgroundColor: 'var(--soft-bg, rgba(0, 0, 0, 0.05))',
    borderRadius: '3px',
    padding: '1px 4px',
  },

  // Links
  { tag: tags.link, color: 'var(--link, #0066cc)', textDecoration: 'underline' },
  { tag: tags.url, color: 'var(--link, #0066cc)' },

  // Lists
  { tag: tags.list, color: 'var(--base-fg-soft, #6a737d)' },

  // Quotes
  { tag: tags.quote, fontStyle: 'italic', color: 'var(--base-fg-soft, #6a737d)' },

  // Meta (markdown symbols like #, *, etc.)
  { tag: tags.processingInstruction, color: 'var(--base-fg-softer, var(--base-fg-soft, #959da5))' },
  { tag: tags.meta, color: 'var(--base-fg-softer, var(--base-fg-soft, #959da5))' },

  // Code block highlighting - uses CSS custom properties for dark mode adaptation
  // These vars are defined in MarkdownEditor.module.css with dark mode overrides
  { tag: tags.keyword, color: 'var(--syntax-keyword, #d73a49)' },
  { tag: tags.operator, color: 'var(--syntax-keyword, #d73a49)' },
  { tag: tags.variableName, color: 'var(--base-fg, #24292e)' },
  { tag: tags.propertyName, color: 'var(--syntax-property, #005cc5)' },
  { tag: tags.function(tags.variableName), color: 'var(--syntax-function, #6f42c1)' },
  { tag: tags.function(tags.propertyName), color: 'var(--syntax-function, #6f42c1)' },
  { tag: tags.string, color: 'var(--syntax-string, #22863a)' },
  { tag: tags.number, color: 'var(--syntax-number, #005cc5)' },
  { tag: tags.bool, color: 'var(--syntax-number, #005cc5)' },
  { tag: tags.null, color: 'var(--syntax-number, #005cc5)' },
  { tag: tags.comment, color: 'var(--syntax-comment, #6a737d)', fontStyle: 'italic' },
  { tag: tags.className, color: 'var(--syntax-class, #6f42c1)' },
  { tag: tags.typeName, color: 'var(--syntax-class, #6f42c1)' },
  { tag: tags.attributeName, color: 'var(--syntax-function, #6f42c1)' },
  { tag: tags.attributeValue, color: 'var(--syntax-string, #22863a)' },
  { tag: tags.regexp, color: 'var(--syntax-regexp, #032f62)' },
  { tag: tags.tagName, color: 'var(--syntax-tag, #22863a)' },
  { tag: tags.angleBracket, color: 'var(--base-fg, #24292e)' },
  { tag: tags.bracket, color: 'var(--base-fg, #24292e)' },
  { tag: tags.paren, color: 'var(--base-fg, #24292e)' },
  { tag: tags.brace, color: 'var(--base-fg, #24292e)' },
  { tag: tags.squareBracket, color: 'var(--base-fg, #24292e)' },
]);

/**
 * Combined theme extension for CodeMirror.
 * Use this as the main theme extension.
 */
export const theme = [
  editorTheme,
  syntaxHighlighting(syntaxHighlightStyle),
];

export default theme;
