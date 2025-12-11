/**
 * SearchPanel - Custom search/replace panel for MarkdownEditor
 *
 * Renders a floating search panel anchored to top-right of the editor.
 * Uses ui-kit components for consistent styling.
 */

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type KeyboardEvent,
} from 'react';
import {
  SearchQuery,
  setSearchQuery,
  getSearchQuery,
  findNext,
  findPrevious,
  replaceNext,
  replaceAll,
  selectMatches,
} from '@codemirror/search';
import type { EditorView } from '@codemirror/view';
import { Input, Checkbox, Button, IconButton, Stack, Text } from '@ui-kit/react';
import styles from './SearchPanel.module.css';

// Icons
const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const ChevronUpIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M4 10l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ReplaceIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M2 8h8M7 5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 4v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export interface SearchPanelProps {
  /** The CodeMirror EditorView instance */
  view: EditorView | null;
  /** Whether the panel is visible */
  isOpen: boolean;
  /** Called when the panel should close */
  onClose: () => void;
  /** Whether to show replace controls */
  showReplace?: boolean;
}

export function SearchPanel({
  view,
  isOpen,
  onClose,
  showReplace: initialShowReplace = false,
}: SearchPanelProps) {
  const [searchText, setSearchText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [showReplace, setShowReplace] = useState(initialShowReplace);
  const [matchInfo, setMatchInfo] = useState<{ current: number; total: number } | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Focus search input when panel opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
      searchInputRef.current.select();
    }
  }, [isOpen]);

  // Sync with CodeMirror's search query on open
  useEffect(() => {
    if (isOpen && view) {
      const query = getSearchQuery(view.state);
      if (query.search) {
        setSearchText(query.search);
        setCaseSensitive(query.caseSensitive);
        setWholeWord(query.wholeWord);
        setUseRegex(query.regexp);
        if (query.replace) {
          setReplaceText(query.replace);
          setShowReplace(true);
        }
      }
    }
  }, [isOpen, view]);

  // Update CodeMirror search query when our state changes
  const updateSearch = useCallback(() => {
    if (!view || !searchText) {
      setMatchInfo(null);
      return;
    }

    const query = new SearchQuery({
      search: searchText,
      replace: replaceText,
      caseSensitive,
      wholeWord,
      regexp: useRegex,
    });

    view.dispatch({
      effects: setSearchQuery.of(query),
    });

    // Count matches
    if (query.valid) {
      const cursor = query.getCursor(view.state.doc);
      let total = 0;
      let current = 0;
      const mainSelection = view.state.selection.main;

      // Count total matches using .next()
      let result = cursor.next();
      while (!result.done) {
        total++;
        result = cursor.next();
      }

      // Find current match index
      if (total > 0) {
        const cursor2 = query.getCursor(view.state.doc);
        let index = 0;
        let result2 = cursor2.next();
        while (!result2.done) {
          index++;
          const match = result2.value;
          if (match.from <= mainSelection.from && match.to >= mainSelection.from) {
            current = index;
            break;
          }
          if (match.from > mainSelection.from) {
            current = index;
            break;
          }
          result2 = cursor2.next();
        }
      }

      setMatchInfo({ current, total });
    } else {
      setMatchInfo(null);
    }
  }, [view, searchText, replaceText, caseSensitive, wholeWord, useRegex]);

  // Debounced search update
  useEffect(() => {
    const timer = setTimeout(updateSearch, 100);
    return () => clearTimeout(timer);
  }, [updateSearch]);

  const handleFindNext = useCallback(() => {
    if (view) {
      findNext(view);
      // Update match info after navigation
      setTimeout(updateSearch, 10);
    }
  }, [view, updateSearch]);

  const handleFindPrevious = useCallback(() => {
    if (view) {
      findPrevious(view);
      setTimeout(updateSearch, 10);
    }
  }, [view, updateSearch]);

  const handleReplaceNext = useCallback(() => {
    if (view) {
      replaceNext(view);
      setTimeout(updateSearch, 10);
    }
  }, [view, updateSearch]);

  const handleReplaceAll = useCallback(() => {
    if (view) {
      replaceAll(view);
      setTimeout(updateSearch, 10);
    }
  }, [view, updateSearch]);

  const handleSelectAll = useCallback(() => {
    if (view) {
      selectMatches(view);
    }
  }, [view]);

  const handleClose = useCallback(() => {
    onClose();
    // Return focus to editor
    if (view) {
      view.focus();
    }
  }, [onClose, view]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) {
          handleFindPrevious();
        } else {
          handleFindNext();
        }
      } else if (e.key === 'F3') {
        e.preventDefault();
        if (e.shiftKey) {
          handleFindPrevious();
        } else {
          handleFindNext();
        }
      }
    },
    [handleClose, handleFindNext, handleFindPrevious]
  );

  if (!isOpen) {
    return null;
  }

  return (
    <div
      ref={panelRef}
      className={styles.panel}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-label="Find and Replace"
    >
      <div className={styles.content}>
        {/* Search row */}
        <div className={styles.row}>
          <div className={styles.inputWrapper}>
            <Input
              ref={searchInputRef}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Find"
              size="sm"
              className={styles.searchInput}
              aria-label="Search"
            />
            {matchInfo && (
              <Text size="sm" className={styles.matchCount}>
                {matchInfo.total === 0
                  ? 'No results'
                  : `${matchInfo.current} of ${matchInfo.total}`}
              </Text>
            )}
          </div>

          <div className={styles.actions}>
            <IconButton
              icon={<ChevronUpIcon />}
              size="sm"
              variant="ghost"
              aria-label="Previous match (Shift+Enter)"
              onClick={handleFindPrevious}
              disabled={!searchText || matchInfo?.total === 0}
            />
            <IconButton
              icon={<ChevronDownIcon />}
              size="sm"
              variant="ghost"
              aria-label="Next match (Enter)"
              onClick={handleFindNext}
              disabled={!searchText || matchInfo?.total === 0}
            />
            <IconButton
              icon={<ReplaceIcon />}
              size="sm"
              variant={showReplace ? 'default' : 'ghost'}
              aria-label="Toggle replace"
              onClick={() => setShowReplace(!showReplace)}
            />
            <IconButton
              icon={<CloseIcon />}
              size="sm"
              variant="ghost"
              aria-label="Close (Escape)"
              onClick={handleClose}
            />
          </div>
        </div>

        {/* Replace row */}
        {showReplace && (
          <div className={styles.row}>
            <div className={styles.inputWrapper}>
              <Input
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                placeholder="Replace"
                size="sm"
                className={styles.searchInput}
                aria-label="Replace with"
              />
            </div>

            <div className={styles.actions}>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleReplaceNext}
                disabled={!searchText || matchInfo?.total === 0}
              >
                Replace
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleReplaceAll}
                disabled={!searchText || matchInfo?.total === 0}
              >
                All
              </Button>
            </div>
          </div>
        )}

        {/* Options row */}
        <div className={styles.optionsRow}>
          <Stack direction="horizontal" gap="sm">
            <Checkbox
              size="sm"
              label="Match case"
              checked={caseSensitive}
              onChange={(e) => setCaseSensitive(e.target.checked)}
            />
            <Checkbox
              size="sm"
              label="Whole word"
              checked={wholeWord}
              onChange={(e) => setWholeWord(e.target.checked)}
            />
            <Checkbox
              size="sm"
              label="Regex"
              checked={useRegex}
              onChange={(e) => setUseRegex(e.target.checked)}
            />
          </Stack>

          {matchInfo && matchInfo.total > 1 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSelectAll}
            >
              Select all
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default SearchPanel;
