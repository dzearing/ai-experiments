/**
 * Search and navigation extensions for CodeMirror
 *
 * Provides search state management and keybindings.
 * The search UI is handled by a custom React component (SearchPanel).
 */

import {
  search,
  highlightSelectionMatches,
  gotoLine,
  findNext,
  findPrevious,
} from '@codemirror/search';
import { keymap } from '@codemirror/view';
import type { Extension } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';

/**
 * Callback type for when search panel should open
 */
export type SearchPanelOpenCallback = (showReplace: boolean) => void;

/**
 * Creates a custom search panel that returns nothing (empty panel).
 * This prevents CodeMirror's default panel while keeping search state active.
 */
function createEmptyPanel() {
  // Return a minimal panel that won't be visible
  const dom = document.createElement('div');
  dom.style.display = 'none';
  return { dom, top: true };
}

/**
 * Search configuration.
 * Uses an empty panel creator to disable the default UI.
 */
const searchConfig = search({
  top: true,
  caseSensitive: false,
  literal: false,
  wholeWord: false,
  createPanel: createEmptyPanel,
});

/**
 * Creates keybindings for search and navigation.
 * Ctrl+F and Ctrl+H are handled by the React component via callbacks.
 *
 * @param onOpenSearch - Callback when Ctrl+F is pressed
 * @param onOpenReplace - Callback when Ctrl+H is pressed
 */
export function createSearchKeybindings(
  onOpenSearch?: SearchPanelOpenCallback,
  onOpenReplace?: SearchPanelOpenCallback
): Extension {
  return keymap.of([
    // Override Ctrl+F to use our custom panel
    {
      key: 'Mod-f',
      run: (_view: EditorView) => {
        if (onOpenSearch) {
          onOpenSearch(false);
          return true;
        }
        return false;
      },
    },
    // Override Ctrl+H to open with replace
    {
      key: 'Mod-h',
      run: (_view: EditorView) => {
        if (onOpenReplace) {
          onOpenReplace(true);
          return true;
        }
        return false;
      },
    },
    // F3 for find next (works without opening panel)
    {
      key: 'F3',
      run: findNext,
    },
    // Shift+F3 for find previous
    {
      key: 'Shift-F3',
      run: findPrevious,
    },
    // Go to line with Ctrl+G
    {
      key: 'Mod-g',
      run: gotoLine,
    },
  ]);
}

/**
 * Base search extension without custom keybindings.
 * Includes search state and selection match highlighting.
 */
export const baseSearchExtension: Extension = [
  searchConfig,
  highlightSelectionMatches(),
];

/**
 * Combined search extension with default (no-op) keybindings.
 * Use createSearchKeybindings() to add custom Ctrl+F handling.
 *
 * @deprecated Use baseSearchExtension + createSearchKeybindings() instead
 */
export const searchExtension: Extension = [
  baseSearchExtension,
  createSearchKeybindings(),
];

export default searchExtension;
