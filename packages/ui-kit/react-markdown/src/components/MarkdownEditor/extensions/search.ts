/**
 * Search and navigation extensions for CodeMirror
 *
 * Provides Ctrl+F search, Ctrl+H replace, Ctrl+G go-to-line,
 * and all standard search/replace functionality.
 */

import { search, searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { gotoLine } from '@codemirror/search';
import { keymap } from '@codemirror/view';
import type { Extension } from '@codemirror/state';

/**
 * Search panel configuration.
 * Configures the search panel to appear at the top of the editor.
 */
const searchConfig = search({
  top: true,
  caseSensitive: false,
  literal: false,
  wholeWord: false,
  // Custom search panel class for styling
  createPanel: undefined, // Use default panel
});

/**
 * Custom keybindings for search and navigation.
 * Extends the default searchKeymap with additional shortcuts.
 */
const searchKeybindings = keymap.of([
  // Default search keybindings are included
  ...searchKeymap,
  // Go to line with Ctrl+G (or Cmd+G on Mac)
  { key: 'Mod-g', run: gotoLine },
]);

/**
 * Combined search extension.
 * Includes search panel, keybindings, and selection match highlighting.
 */
export const searchExtension: Extension = [
  searchConfig,
  searchKeybindings,
  highlightSelectionMatches(),
];

export default searchExtension;
