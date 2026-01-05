import { useState, useCallback, useEffect, useRef } from 'react';
import { Input, Text } from '@ui-kit/react';
import { FolderIcon } from '@ui-kit/icons/FolderIcon';
import { CodeIcon } from '@ui-kit/icons/CodeIcon';
import { PackageIcon } from '@ui-kit/icons/PackageIcon';
import type { ThingPickerData } from './types';
import styles from './OpenQuestionsResolver.module.css';

export interface ThingSearchResult {
  thingId: string;
  name: string;
  type: string;
  keyProperties?: {
    localPath?: string;
    remoteUrl?: string;
    branch?: string;
  };
}

export interface ThingPickerOptionProps {
  /** Current selected thing data */
  value?: ThingPickerData;
  /** Called when a thing is selected or path entered */
  onChange: (thing: ThingPickerData) => void;
  /** Optional callback to search for things - if not provided, only path input is available */
  onSearch?: (query: string) => Promise<ThingSearchResult[]>;
  /** Placeholder text */
  placeholder?: string;
  /** Types of things to filter for */
  filterTypes?: string[];
}

/**
 * Get icon for thing type
 */
function getThingIcon(type: string) {
  switch (type) {
    case 'folder':
      return <FolderIcon />;
    case 'git-repo':
    case 'git-package':
      return <PackageIcon />;
    default:
      return <CodeIcon />;
  }
}

/**
 * ThingPickerOption - Component for selecting a thing or entering a path
 *
 * Provides:
 * - Text input for searching or entering a path directly
 * - Autocomplete dropdown when search results are available
 * - Display of selected thing with key properties
 */
export function ThingPickerOption({
  value,
  onChange,
  onSearch,
  placeholder = 'Search for a project or enter a path...',
  filterTypes,
}: ThingPickerOptionProps) {
  const [inputValue, setInputValue] = useState(value?.name || '');
  const [searchResults, setSearchResults] = useState<ThingSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update input value when external value changes
  useEffect(() => {
    if (value?.name) {
      setInputValue(value.name);
    }
  }, [value?.name]);

  // Debounced search
  useEffect(() => {
    if (!onSearch || !inputValue.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        let results = await onSearch(inputValue);
        // Filter by type if specified
        if (filterTypes && filterTypes.length > 0) {
          results = results.filter((r) => filterTypes.includes(r.type));
        }
        setSearchResults(results);
        setSelectedIndex(0);
        setShowResults(true);
      } catch (error) {
        console.error('Thing search failed:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue, onSearch, filterTypes]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);

      // If no search callback, treat as direct path input
      if (!onSearch && newValue.trim()) {
        onChange({
          thingId: '',
          name: newValue,
          type: 'folder',
          keyProperties: {
            localPath: newValue,
          },
        });
      }
    },
    [onSearch, onChange]
  );

  const handleSelectThing = useCallback(
    (thing: ThingSearchResult) => {
      setInputValue(thing.name);
      setShowResults(false);
      onChange({
        thingId: thing.thingId,
        name: thing.name,
        type: thing.type,
        keyProperties: thing.keyProperties,
      });
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showResults || searchResults.length === 0) {
        // Enter submits the path directly if no dropdown
        if (e.key === 'Enter' && inputValue.trim() && !onSearch) {
          onChange({
            thingId: '',
            name: inputValue,
            type: 'folder',
            keyProperties: {
              localPath: inputValue,
            },
          });
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, searchResults.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (searchResults[selectedIndex]) {
            handleSelectThing(searchResults[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setShowResults(false);
          break;
      }
    },
    [showResults, searchResults, selectedIndex, handleSelectThing, inputValue, onSearch, onChange]
  );

  return (
    <div ref={containerRef} className={styles.thingPickerContainer}>
      <div className={styles.thingPickerInputWrapper}>
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => searchResults.length > 0 && setShowResults(true)}
          className={styles.thingPickerInput}
          aria-label="Search things or enter path"
          aria-autocomplete={onSearch ? 'list' : undefined}
          aria-expanded={showResults}
        />
        {isSearching && <Text size="sm" color="soft">Searching...</Text>}
      </div>

      {/* Search results dropdown */}
      {showResults && searchResults.length > 0 && (
        <div className={styles.thingPickerDropdown} role="listbox">
          {searchResults.map((thing, index) => (
            <button
              key={thing.thingId}
              type="button"
              role="option"
              aria-selected={index === selectedIndex}
              className={`${styles.thingPickerItem} ${index === selectedIndex ? styles.thingPickerItemSelected : ''}`}
              onClick={() => handleSelectThing(thing)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <span className={styles.thingPickerItemIcon}>{getThingIcon(thing.type)}</span>
              <div className={styles.thingPickerItemContent}>
                <Text weight="medium">{thing.name}</Text>
                {thing.keyProperties?.localPath && (
                  <Text size="sm" color="soft" className={styles.thingPickerItemPath}>
                    {thing.keyProperties.localPath}
                  </Text>
                )}
              </div>
              <Text size="sm" color="soft">{thing.type}</Text>
            </button>
          ))}
        </div>
      )}

      {/* Selected thing display */}
      {value?.thingId && (
        <div className={styles.selectedThing}>
          <div className={styles.selectedThingHeader}>
            {getThingIcon(value.type)}
            <Text weight="medium">{value.name}</Text>
          </div>
          {value.keyProperties?.localPath && (
            <Text size="sm" color="soft">{value.keyProperties.localPath}</Text>
          )}
          {value.keyProperties?.remoteUrl && !value.keyProperties.localPath && (
            <Text size="sm" color="soft">{value.keyProperties.remoteUrl} (requires clone)</Text>
          )}
        </div>
      )}

      <Text size="sm" color="soft" className={styles.thingPickerHint}>
        {onSearch
          ? 'Search for a project, package, or folder'
          : 'Enter an absolute path to a folder'}
      </Text>
    </div>
  );
}

ThingPickerOption.displayName = 'ThingPickerOption';
