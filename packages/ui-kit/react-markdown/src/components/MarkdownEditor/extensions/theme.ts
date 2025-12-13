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
 */
export const editorTheme = EditorView.theme({
  // Root editor container
  '&': {
    backgroundColor: 'var(--color-inset-background, var(--color-body-background))',
    color: 'var(--color-inset-text, var(--color-body-text))',
    height: '100%',
  },

  // Content area
  '.cm-content': {
    fontFamily: 'var(--font-mono, ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace)',
    fontSize: 'var(--font-size-sm, 13px)',
    lineHeight: '1.5',
    padding: 'var(--spacing-small10, 8px) 0',
    caretColor: 'var(--color-body-text)',
  },

  // Editor container that allows focus
  '&.cm-focused': {
    outline: 'none',
  },

  // Gutters (line numbers, fold markers)
  '.cm-gutters': {
    backgroundColor: 'var(--color-panel-background, rgba(0, 0, 0, 0.03))',
    color: 'var(--color-body-textSoft20, rgba(0, 0, 0, 0.4))',
    borderRight: '1px solid var(--color-inset-border, var(--color-body-border))',
    fontFamily: 'var(--font-mono, ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace)',
    fontSize: 'var(--font-size-sm, 13px)',
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
    color: 'var(--color-body-textSoft20)',
    transition: 'color var(--duration-fast, 100ms)',
  },

  '.cm-foldGutter .cm-gutterElement:hover': {
    color: 'var(--color-body-text)',
  },

  // Cursor
  '.cm-cursor': {
    borderLeftColor: 'var(--color-body-text)',
    borderLeftWidth: '2px',
  },

  // Selection
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: 'var(--color-selection-background, rgba(0, 120, 212, 0.2))',
  },

  '.cm-selectionMatch': {
    backgroundColor: 'var(--color-selection-background, rgba(0, 120, 212, 0.15))',
  },

  // Active line highlight
  '.cm-activeLine': {
    backgroundColor: 'var(--color-panel-background, rgba(0, 0, 0, 0.02))',
  },

  '.cm-activeLineGutter': {
    backgroundColor: 'var(--color-panel-background, rgba(0, 0, 0, 0.05))',
  },

  // Search panel
  '.cm-panels': {
    backgroundColor: 'var(--color-panel-background)',
    borderBottom: '1px solid var(--color-panel-border)',
    fontFamily: 'var(--font-sans, system-ui, -apple-system, sans-serif)',
    fontSize: 'var(--font-size-sm, 13px)',
  },

  '.cm-panels.cm-panels-top': {
    borderBottom: '1px solid var(--color-panel-border)',
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
    backgroundColor: 'var(--color-panel-background)',
    border: '1px solid var(--color-panel-border)',
    borderRadius: 'var(--radius-sm, 4px)',
    boxShadow: 'var(--shadow-card)',
  },

  // Placeholder
  '.cm-placeholder': {
    color: 'var(--color-body-textSoft20, rgba(0, 0, 0, 0.4))',
    fontStyle: 'italic',
  },

  // Fold placeholder
  '.cm-foldPlaceholder': {
    backgroundColor: 'var(--color-panel-background)',
    border: '1px solid var(--color-panel-border)',
    borderRadius: 'var(--radius-xs, 2px)',
    color: 'var(--color-body-textSoft10)',
    padding: '0 4px',
    margin: '0 2px',
    fontSize: '0.85em',
  },

  // Scrollbar styling
  '.cm-scroller': {
    scrollbarWidth: 'thin',
    scrollbarColor: 'var(--color-body-textSoft20) transparent',
  },

  '.cm-scroller::-webkit-scrollbar': {
    width: '8px',
    height: '8px',
  },

  '.cm-scroller::-webkit-scrollbar-track': {
    background: 'transparent',
  },

  '.cm-scroller::-webkit-scrollbar-thumb': {
    background: 'var(--color-body-textSoft20, rgba(0, 0, 0, 0.2))',
    borderRadius: '4px',
  },

  '.cm-scroller::-webkit-scrollbar-thumb:hover': {
    background: 'var(--color-body-textSoft10, rgba(0, 0, 0, 0.3))',
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
    backgroundColor: 'var(--color-panel-background, rgba(0, 0, 0, 0.05))',
    borderRadius: '3px',
    padding: '1px 4px',
  },

  // Links
  { tag: tags.link, color: 'var(--color-body-link, #0066cc)', textDecoration: 'underline' },
  { tag: tags.url, color: 'var(--color-body-link, #0066cc)' },

  // Lists
  { tag: tags.list, color: 'var(--color-body-textSoft10)' },

  // Quotes
  { tag: tags.quote, fontStyle: 'italic', color: 'var(--color-body-textSoft10)' },

  // Meta (markdown symbols like #, *, etc.)
  { tag: tags.processingInstruction, color: 'var(--color-body-textSoft20)' },
  { tag: tags.meta, color: 'var(--color-body-textSoft20)' },

  // Code block highlighting
  { tag: tags.keyword, color: '#d73a49' },
  { tag: tags.operator, color: '#d73a49' },
  { tag: tags.variableName, color: '#24292e' },
  { tag: tags.propertyName, color: '#005cc5' },
  { tag: tags.function(tags.variableName), color: '#6f42c1' },
  { tag: tags.function(tags.propertyName), color: '#6f42c1' },
  { tag: tags.string, color: '#22863a' },
  { tag: tags.number, color: '#005cc5' },
  { tag: tags.bool, color: '#005cc5' },
  { tag: tags.null, color: '#005cc5' },
  { tag: tags.comment, color: '#6a737d', fontStyle: 'italic' },
  { tag: tags.className, color: '#6f42c1' },
  { tag: tags.typeName, color: '#6f42c1' },
  { tag: tags.attributeName, color: '#6f42c1' },
  { tag: tags.attributeValue, color: '#22863a' },
  { tag: tags.regexp, color: '#032f62' },
  { tag: tags.tagName, color: '#22863a' },
  { tag: tags.angleBracket, color: '#24292e' },
  { tag: tags.bracket, color: '#24292e' },
  { tag: tags.paren, color: '#24292e' },
  { tag: tags.brace, color: '#24292e' },
  { tag: tags.squareBracket, color: '#24292e' },
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
