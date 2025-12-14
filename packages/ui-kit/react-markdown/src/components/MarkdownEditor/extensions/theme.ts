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
 * - --inset-bg: Editor background (darker/indented surfaces)
 * - --inset-text: Editor text color
 * - --inset-border: Editor borders
 * - --page-text: Primary text color
 * - --page-text-soft: Secondary/muted text
 * - --card-bg: Panel/card backgrounds
 * - --card-border: Panel/card borders
 */
export const editorTheme = EditorView.theme({
  // Root editor container
  '&': {
    backgroundColor: 'var(--inset-bg, #f8f9fa)',
    color: 'var(--inset-text, var(--page-text, #24292e))',
    height: '100%',
  },

  // Content area
  '.cm-content': {
    fontFamily: 'var(--font-mono, ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace)',
    fontSize: 'var(--text-sm, 13px)',
    lineHeight: '1.5',
    padding: 'var(--space-2, 8px) 0',
    caretColor: 'var(--page-text, #24292e)',
  },

  // Editor container that allows focus
  '&.cm-focused': {
    outline: 'none',
  },

  // Gutters (line numbers, fold markers)
  '.cm-gutters': {
    backgroundColor: 'var(--card-bg, rgba(0, 0, 0, 0.03))',
    color: 'var(--page-text-soft, rgba(0, 0, 0, 0.4))',
    borderRight: '1px solid var(--inset-border, var(--page-border, #e1e4e8))',
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
    color: 'var(--page-text-softer, var(--page-text-soft, rgba(0, 0, 0, 0.3)))',
    transition: 'color var(--duration-fast, 100ms)',
  },

  '.cm-foldGutter .cm-gutterElement:hover': {
    color: 'var(--page-text, #24292e)',
  },

  // Cursor
  '.cm-cursor': {
    borderLeftColor: 'var(--page-text, #24292e)',
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
    backgroundColor: 'var(--inset-bg-hover, rgba(0, 0, 0, 0.02))',
  },

  '.cm-activeLineGutter': {
    backgroundColor: 'var(--inset-bg-hover, rgba(0, 0, 0, 0.05))',
  },

  // Search panel
  '.cm-panels': {
    backgroundColor: 'var(--card-bg, #ffffff)',
    borderBottom: '1px solid var(--card-border, #e1e4e8)',
    fontFamily: 'var(--font-sans, system-ui, -apple-system, sans-serif)',
    fontSize: 'var(--text-sm, 13px)',
  },

  '.cm-panels.cm-panels-top': {
    borderBottom: '1px solid var(--card-border, #e1e4e8)',
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
    backgroundColor: 'var(--popout-bg, #ffffff)',
    border: '1px solid var(--popout-border, #e1e4e8)',
    borderRadius: 'var(--radius-sm, 4px)',
    boxShadow: 'var(--popout-shadow, 0 4px 6px rgba(0, 0, 0, 0.1))',
  },

  // Placeholder
  '.cm-placeholder': {
    color: 'var(--page-text-softer, var(--page-text-soft, rgba(0, 0, 0, 0.4)))',
    fontStyle: 'italic',
  },

  // Fold placeholder
  '.cm-foldPlaceholder': {
    backgroundColor: 'var(--card-bg, #f6f8fa)',
    border: '1px solid var(--card-border, #e1e4e8)',
    borderRadius: 'var(--radius-sm, 2px)',
    color: 'var(--page-text-soft, #6a737d)',
    padding: '0 4px',
    margin: '0 2px',
    fontSize: '0.85em',
  },

  // Scrollbar styling
  '.cm-scroller': {
    scrollbarWidth: 'thin',
    scrollbarColor: 'var(--page-text-softer, rgba(0, 0, 0, 0.2)) transparent',
  },

  '.cm-scroller::-webkit-scrollbar': {
    width: '8px',
    height: '8px',
  },

  '.cm-scroller::-webkit-scrollbar-track': {
    background: 'transparent',
  },

  '.cm-scroller::-webkit-scrollbar-thumb': {
    background: 'var(--page-text-softer, rgba(0, 0, 0, 0.2))',
    borderRadius: '4px',
  },

  '.cm-scroller::-webkit-scrollbar-thumb:hover': {
    background: 'var(--page-text-soft, rgba(0, 0, 0, 0.3))',
  },

  // Line wrap indicator
  '.cm-lineWrapping': {
    wordBreak: 'break-word',
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
    backgroundColor: 'var(--card-bg, rgba(0, 0, 0, 0.05))',
    borderRadius: '3px',
    padding: '1px 4px',
  },

  // Links
  { tag: tags.link, color: 'var(--link-text, #0066cc)', textDecoration: 'underline' },
  { tag: tags.url, color: 'var(--link-text, #0066cc)' },

  // Lists
  { tag: tags.list, color: 'var(--page-text-soft, #6a737d)' },

  // Quotes
  { tag: tags.quote, fontStyle: 'italic', color: 'var(--page-text-soft, #6a737d)' },

  // Meta (markdown symbols like #, *, etc.)
  { tag: tags.processingInstruction, color: 'var(--page-text-softer, var(--page-text-soft, #959da5))' },
  { tag: tags.meta, color: 'var(--page-text-softer, var(--page-text-soft, #959da5))' },

  // Code block highlighting - uses CSS custom properties for dark mode adaptation
  // These vars are defined in MarkdownEditor.module.css with dark mode overrides
  { tag: tags.keyword, color: 'var(--syntax-keyword, #d73a49)' },
  { tag: tags.operator, color: 'var(--syntax-keyword, #d73a49)' },
  { tag: tags.variableName, color: 'var(--page-text, #24292e)' },
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
  { tag: tags.angleBracket, color: 'var(--page-text, #24292e)' },
  { tag: tags.bracket, color: 'var(--page-text, #24292e)' },
  { tag: tags.paren, color: 'var(--page-text, #24292e)' },
  { tag: tags.brace, color: 'var(--page-text, #24292e)' },
  { tag: tags.squareBracket, color: 'var(--page-text, #24292e)' },
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
