/**
 * Code folding extensions for CodeMirror
 *
 * Provides folding for:
 * - Fenced code blocks (``` to ```)
 * - Markdown headings (section folding to next heading of same/higher level)
 */

import {
  foldGutter,
  codeFolding,
  foldKeymap,
  foldAll,
  unfoldAll,
  foldEffect,
  unfoldEffect,
  foldService,
} from '@codemirror/language';
import { keymap, EditorView } from '@codemirror/view';
import { type Extension } from '@codemirror/state';

/**
 * Custom fold service for markdown content.
 * Handles:
 * - Fenced code blocks: folds from opening ``` to closing ```
 * - Headings: folds from heading to next heading of same or higher level
 */
const markdownFoldService = foldService.of((state, lineStart, _lineEnd) => {
  const line = state.doc.lineAt(lineStart);
  const lineText = line.text;

  // Check for fenced code block opening (```)
  const codeBlockMatch = lineText.match(/^(\s*)(`{3,}|~{3,})/);
  if (codeBlockMatch) {
    const fence = codeBlockMatch[2];
    const fenceChar = fence[0];
    const fenceLen = fence.length;

    // Find the closing fence
    let pos = line.to + 1;
    while (pos < state.doc.length) {
      const nextLine = state.doc.lineAt(pos);
      const closingMatch = nextLine.text.match(new RegExp(`^\\s*${fenceChar}{${fenceLen},}\\s*$`));
      if (closingMatch) {
        // Fold from end of opening line to end of closing line
        return { from: line.to, to: nextLine.to };
      }
      pos = nextLine.to + 1;
    }
    return null;
  }

  // Check for markdown heading (# to ######)
  const headingMatch = lineText.match(/^(#{1,6})\s+/);
  if (headingMatch) {
    const headingLevel = headingMatch[1].length;

    // Find the end of this section (next heading of same or higher level, or end of doc)
    let pos = line.to + 1;
    let lastContentLine = line;

    while (pos < state.doc.length) {
      const nextLine = state.doc.lineAt(pos);
      const nextHeadingMatch = nextLine.text.match(/^(#{1,6})\s+/);

      if (nextHeadingMatch) {
        const nextHeadingLevel = nextHeadingMatch[1].length;
        // Stop at same level or higher (lower number = higher level)
        if (nextHeadingLevel <= headingLevel) {
          break;
        }
      }

      // Track last non-empty line for fold end
      if (nextLine.text.trim().length > 0) {
        lastContentLine = nextLine;
      }

      pos = nextLine.to + 1;
    }

    // Only fold if there's content after the heading
    if (lastContentLine.number > line.number) {
      return { from: line.to, to: lastContentLine.to };
    }
    return null;
  }

  return null;
});

/**
 * Fold gutter configuration.
 * Shows fold indicators in the gutter with custom markers.
 */
const foldGutterConfig = foldGutter({
  markerDOM: (open: boolean) => {
    const marker = document.createElement('span');
    marker.className = open ? 'cm-fold-open' : 'cm-fold-closed';
    marker.textContent = open ? '▼' : '▶';
    marker.style.cssText = `
      cursor: pointer;
      font-size: 10px;
      opacity: 0.6;
      transition: opacity 100ms;
    `;
    marker.addEventListener('mouseenter', () => {
      marker.style.opacity = '1';
    });
    marker.addEventListener('mouseleave', () => {
      marker.style.opacity = '0.6';
    });
    return marker;
  },
  openText: '▼',
  closedText: '▶',
});

/**
 * Code folding configuration with custom placeholder.
 */
const codeFoldingConfig = codeFolding({
  placeholderText: '…',
  placeholderDOM: () => {
    const placeholder = document.createElement('span');
    placeholder.className = 'cm-foldPlaceholder';
    placeholder.textContent = '…';
    placeholder.title = 'Click to unfold';
    return placeholder;
  },
});

/**
 * Custom keybindings for folding.
 * Standard shortcuts plus additional commands.
 */
const foldingKeybindings = keymap.of([
  ...foldKeymap,
  // Fold all: Ctrl+Shift+[ (or Cmd+Shift+[ on Mac)
  {
    key: 'Mod-Shift-[',
    run: (view: EditorView) => {
      foldAll(view);
      return true;
    },
  },
  // Unfold all: Ctrl+Shift+] (or Cmd+Shift+] on Mac)
  {
    key: 'Mod-Shift-]',
    run: (view: EditorView) => {
      unfoldAll(view);
      return true;
    },
  },
]);

/**
 * Combined folding extension.
 * Includes custom fold service, fold gutter, folding logic, and keybindings.
 */
export const foldingExtension: Extension = [
  markdownFoldService,
  foldGutterConfig,
  codeFoldingConfig,
  foldingKeybindings,
];

// Re-export for programmatic access
export { foldAll, unfoldAll, foldEffect, unfoldEffect };

export default foldingExtension;
