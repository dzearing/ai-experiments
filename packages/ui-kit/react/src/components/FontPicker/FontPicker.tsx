import { useState, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import { Dropdown, type DropdownOption, type OptionState } from '../Dropdown';
import { IconButton } from '../IconButton';
import { DraggableReorder } from '../DraggableReorder';
import { CloseIcon } from '@ui-kit/icons';
import styles from './FontPicker.module.css';

/**
 * FontPicker - A specialized dropdown for selecting fonts
 *
 * Surfaces used:
 * - inset (trigger)
 * - popout (menu)
 * - controlPrimary (selected/focused options)
 *
 * Features:
 * - Renders each font option using its own font family
 * - Searchable font list
 * - Supports custom fonts and Google Fonts
 * - Groups fonts by category (System, Sans-Serif, Serif, Monospace, Display)
 * - Stack mode for font-family fallback lists with reordering
 */

export interface FontOption {
  /** Font family value (CSS font-family string) */
  value: string;
  /** Display label */
  label: string;
  /** Font category for grouping */
  category?: 'system' | 'sans-serif' | 'serif' | 'monospace' | 'display';
  /** Whether this is a Google Font (requires loading) */
  isGoogleFont?: boolean;
}

/** Props for single select mode */
interface SingleModeProps {
  /** Single select mode (default) */
  mode?: 'single';
  /** Currently selected font value */
  value?: string;
  /** Called when font selection changes */
  onChange?: (value: string) => void;
  /** Default value (uncontrolled mode) */
  defaultValue?: string;
}

/** Props for stack/multi-select mode */
interface StackModeProps {
  /** Stack mode for font-family fallback lists */
  mode: 'stack';
  /** Currently selected font values (ordered) */
  value?: string[];
  /** Called when font selection changes */
  onChange?: (value: string[]) => void;
  /** Default value (uncontrolled mode) */
  defaultValue?: string[];
}

/** Common props for both modes */
interface CommonProps {
  /** Placeholder text when no font is selected */
  placeholder?: string;
  /** Custom fonts to add to the list */
  customFonts?: FontOption[];
  /** Whether to include Google Fonts */
  includeGoogleFonts?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Full width mode */
  fullWidth?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Additional class name */
  className?: string;
  /** Aria label */
  'aria-label'?: string;
}

export type FontPickerProps = CommonProps & (SingleModeProps | StackModeProps);

// System/Web-Safe fonts - always available
const SYSTEM_FONTS: FontOption[] = [
  { value: 'system-ui', label: 'System UI', category: 'system' },
  { value: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', label: 'System Default', category: 'system' },
  { value: 'Arial, sans-serif', label: 'Arial', category: 'sans-serif' },
  { value: 'Helvetica, Arial, sans-serif', label: 'Helvetica', category: 'sans-serif' },
  { value: '"Segoe UI", Tahoma, Geneva, sans-serif', label: 'Segoe UI', category: 'sans-serif' },
  { value: 'Verdana, Geneva, sans-serif', label: 'Verdana', category: 'sans-serif' },
  { value: 'Tahoma, Geneva, sans-serif', label: 'Tahoma', category: 'sans-serif' },
  { value: '"Trebuchet MS", Helvetica, sans-serif', label: 'Trebuchet MS', category: 'sans-serif' },
  { value: 'Georgia, serif', label: 'Georgia', category: 'serif' },
  { value: '"Times New Roman", Times, serif', label: 'Times New Roman', category: 'serif' },
  { value: '"Palatino Linotype", "Book Antiqua", Palatino, serif', label: 'Palatino', category: 'serif' },
  { value: '"Courier New", Courier, monospace', label: 'Courier New', category: 'monospace' },
  { value: 'Consolas, Monaco, "Lucida Console", monospace', label: 'Consolas', category: 'monospace' },
  { value: '"Lucida Console", Monaco, monospace', label: 'Lucida Console', category: 'monospace' },
];

// Popular Google Fonts
const GOOGLE_FONTS: FontOption[] = [
  // Sans-Serif
  { value: '"Inter", sans-serif', label: 'Inter', category: 'sans-serif', isGoogleFont: true },
  { value: '"Roboto", sans-serif', label: 'Roboto', category: 'sans-serif', isGoogleFont: true },
  { value: '"Open Sans", sans-serif', label: 'Open Sans', category: 'sans-serif', isGoogleFont: true },
  { value: '"Lato", sans-serif', label: 'Lato', category: 'sans-serif', isGoogleFont: true },
  { value: '"Montserrat", sans-serif', label: 'Montserrat', category: 'sans-serif', isGoogleFont: true },
  { value: '"Poppins", sans-serif', label: 'Poppins', category: 'sans-serif', isGoogleFont: true },
  { value: '"Source Sans 3", sans-serif', label: 'Source Sans 3', category: 'sans-serif', isGoogleFont: true },
  { value: '"Nunito", sans-serif', label: 'Nunito', category: 'sans-serif', isGoogleFont: true },
  { value: '"Work Sans", sans-serif', label: 'Work Sans', category: 'sans-serif', isGoogleFont: true },
  { value: '"DM Sans", sans-serif', label: 'DM Sans', category: 'sans-serif', isGoogleFont: true },
  { value: '"Plus Jakarta Sans", sans-serif', label: 'Plus Jakarta Sans', category: 'sans-serif', isGoogleFont: true },
  { value: '"Manrope", sans-serif', label: 'Manrope', category: 'sans-serif', isGoogleFont: true },
  // Serif
  { value: '"Merriweather", serif', label: 'Merriweather', category: 'serif', isGoogleFont: true },
  { value: '"Playfair Display", serif', label: 'Playfair Display', category: 'serif', isGoogleFont: true },
  { value: '"Lora", serif', label: 'Lora', category: 'serif', isGoogleFont: true },
  { value: '"PT Serif", serif', label: 'PT Serif', category: 'serif', isGoogleFont: true },
  { value: '"Source Serif 4", serif', label: 'Source Serif 4', category: 'serif', isGoogleFont: true },
  { value: '"Libre Baskerville", serif', label: 'Libre Baskerville', category: 'serif', isGoogleFont: true },
  // Monospace
  { value: '"JetBrains Mono", monospace', label: 'JetBrains Mono', category: 'monospace', isGoogleFont: true },
  { value: '"Fira Code", monospace', label: 'Fira Code', category: 'monospace', isGoogleFont: true },
  { value: '"Source Code Pro", monospace', label: 'Source Code Pro', category: 'monospace', isGoogleFont: true },
  { value: '"IBM Plex Mono", monospace', label: 'IBM Plex Mono', category: 'monospace', isGoogleFont: true },
  { value: '"Roboto Mono", monospace', label: 'Roboto Mono', category: 'monospace', isGoogleFont: true },
  // Display
  { value: '"Oswald", sans-serif', label: 'Oswald', category: 'display', isGoogleFont: true },
  { value: '"Raleway", sans-serif', label: 'Raleway', category: 'display', isGoogleFont: true },
  { value: '"Bebas Neue", sans-serif', label: 'Bebas Neue', category: 'display', isGoogleFont: true },
  { value: '"Archivo", sans-serif', label: 'Archivo', category: 'display', isGoogleFont: true },
];

// Track loaded Google Fonts to avoid duplicate loading
const loadedFonts = new Set<string>();

/**
 * Load a Google Font dynamically
 */
function loadGoogleFont(fontName: string): void {
  if (loadedFonts.has(fontName)) return;

  // Create the Google Fonts link
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName.replace(/"/g, ''))}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);

  loadedFonts.add(fontName);
}

/**
 * Extract font name from font-family value
 */
function extractFontName(fontFamily: string): string {
  // Extract the first font name, removing quotes
  const match = fontFamily.match(/^["']?([^"',]+)/);
  return match ? match[1] : fontFamily;
}

/**
 * Get label for a font value
 */
function getFontLabel(fontValue: string, allFonts: FontOption[]): string {
  const font = allFonts.find(f => f.value === fontValue);
  return font?.label || extractFontName(fontValue);
}

export function FontPicker(props: FontPickerProps) {
  const {
    mode = 'single',
    placeholder = 'Select font...',
    customFonts = [],
    includeGoogleFonts = true,
    size = 'md',
    fullWidth = false,
    disabled = false,
    className,
    'aria-label': ariaLabel,
  } = props;

  const [loadedGoogleFonts, setLoadedGoogleFonts] = useState<Set<string>>(new Set());

  // Build the complete font list
  const allFonts = useMemo(() => {
    const fonts: FontOption[] = [...customFonts, ...SYSTEM_FONTS];
    if (includeGoogleFonts) {
      fonts.push(...GOOGLE_FONTS);
    }
    return fonts;
  }, [customFonts, includeGoogleFonts]);

  // Convert to Dropdown options with category grouping
  const options: DropdownOption<string>[] = useMemo(() => {
    const grouped: Record<string, FontOption[]> = {
      system: [],
      'sans-serif': [],
      serif: [],
      monospace: [],
      display: [],
    };

    allFonts.forEach(font => {
      const category = font.category || 'sans-serif';
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(font);
    });

    const result: DropdownOption<string>[] = [];
    const categoryLabels: Record<string, string> = {
      system: 'System Fonts',
      'sans-serif': 'Sans-Serif',
      serif: 'Serif',
      monospace: 'Monospace',
      display: 'Display',
    };

    Object.entries(grouped).forEach(([category, fonts], index) => {
      if (fonts.length === 0) return;

      // Add category separator (except for first)
      if (index > 0 && result.length > 0) {
        result.push({
          value: `divider-${category}`,
          label: '─'.repeat(20),
          disabled: true,
        });
      }

      // Add category header
      result.push({
        value: `header-${category}`,
        label: categoryLabels[category] || category,
        disabled: true,
        data: { isHeader: true },
      });

      // Add fonts in this category
      fonts.forEach(font => {
        result.push({
          value: font.value,
          label: font.label,
          data: {
            fontFamily: font.value,
            isGoogleFont: font.isGoogleFont,
            category: font.category,
          },
        });
      });
    });

    return result;
  }, [allFonts]);

  // Load Google Fonts for selected values
  useEffect(() => {
    if (!includeGoogleFonts) return;

    const values = mode === 'stack'
      ? (props as StackModeProps).value || []
      : [(props as SingleModeProps).value].filter(Boolean) as string[];

    values.forEach(fontValue => {
      const fontName = extractFontName(fontValue);
      const isGoogleFont = GOOGLE_FONTS.some(f => f.value === fontValue);
      if (isGoogleFont && !loadedGoogleFonts.has(fontName)) {
        loadGoogleFont(fontName);
        setLoadedGoogleFonts(prev => new Set(prev).add(fontName));
      }
    });
  }, [mode, props, includeGoogleFonts, loadedGoogleFonts]);

  // Custom option renderer - shows font in its own typeface
  const renderOption = useCallback((option: DropdownOption<string>, _state: OptionState): ReactNode => {
    const data = option.data as { fontFamily?: string; isGoogleFont?: boolean; isHeader?: boolean } | undefined;

    // Render category headers differently
    if (data?.isHeader) {
      return (
        <span className={styles.categoryHeader}>
          {option.label}
        </span>
      );
    }

    // Load Google Font when rendering
    if (data?.isGoogleFont && data.fontFamily) {
      const fontName = extractFontName(data.fontFamily);
      if (!loadedGoogleFonts.has(fontName)) {
        loadGoogleFont(fontName);
        setLoadedGoogleFonts(prev => new Set(prev).add(fontName));
      }
    }

    return (
      <span
        className={styles.fontOption}
        style={{ fontFamily: data?.fontFamily || 'inherit' }}
      >
        {option.label}
      </span>
    );
  }, [loadedGoogleFonts]);

  // Custom filter function
  const filterFn = useCallback((option: DropdownOption<string>, query: string): boolean => {
    // Hide headers and dividers when searching
    if (option.disabled) {
      return !query; // Only show when no search query
    }
    return option.label.toLowerCase().includes(query.toLowerCase());
  }, []);

  // Single mode handling
  if (mode === 'single') {
    const { value, onChange, defaultValue } = props as SingleModeProps;

    const handleChange = (newValue: string | string[]) => {
      const selectedValue = Array.isArray(newValue) ? newValue[0] : newValue;
      // Skip if user clicked a header or divider
      if (selectedValue?.startsWith('header-') || selectedValue?.startsWith('divider-')) {
        return;
      }
      onChange?.(selectedValue);
    };

    const renderValue = (selected: DropdownOption<string> | DropdownOption<string>[]): ReactNode => {
      const option = Array.isArray(selected) ? selected[0] : selected;
      if (!option) return null;

      const data = option.data as { fontFamily?: string } | undefined;

      return (
        <span
          className={styles.selectedFont}
          style={{ fontFamily: data?.fontFamily || 'inherit' }}
        >
          {option.label}
        </span>
      );
    };

    return (
      <Dropdown
        options={options}
        value={value}
        defaultValue={defaultValue}
        onChange={handleChange}
        renderOption={renderOption}
        renderValue={renderValue}
        filterFn={filterFn}
        searchable
        searchPlaceholder="Search fonts..."
        placeholder={placeholder}
        size={size}
        fullWidth={fullWidth}
        disabled={disabled}
        className={className}
        aria-label={ariaLabel || 'Select font'}
      />
    );
  }

  // Stack mode handling
  const { value = [], onChange, defaultValue } = props as StackModeProps;
  const [internalValue, setInternalValue] = useState<string[]>(defaultValue || []);
  const selectedFonts = value.length > 0 ? value : internalValue;

  const handleAddFont = (newValue: string | string[]) => {
    const selectedValue = Array.isArray(newValue) ? newValue[0] : newValue;
    // Skip if user clicked a header or divider
    if (selectedValue?.startsWith('header-') || selectedValue?.startsWith('divider-')) {
      return;
    }
    // Don't add duplicates
    if (selectedFonts.includes(selectedValue)) {
      return;
    }
    const newFonts = [...selectedFonts, selectedValue];
    if (onChange) {
      onChange(newFonts);
    } else {
      setInternalValue(newFonts);
    }
  };

  const handleRemoveFont = (fontValue: string) => {
    const newFonts = selectedFonts.filter(f => f !== fontValue);
    if (onChange) {
      onChange(newFonts);
    } else {
      setInternalValue(newFonts);
    }
  };

  const handleReorder = (newFonts: string[]) => {
    if (onChange) {
      onChange(newFonts);
    } else {
      setInternalValue(newFonts);
    }
  };

  // Filter out already selected fonts from options
  const availableOptions = useMemo(() => {
    return options.filter(opt => {
      if (opt.disabled) return true; // Keep headers and dividers
      return !selectedFonts.includes(opt.value);
    });
  }, [options, selectedFonts]);

  return (
    <div className={`${styles.stackContainer} ${fullWidth ? styles.fullWidth : ''} ${className || ''}`}>
      {/* Selected fonts list with drag reordering */}
      {selectedFonts.length > 0 && (
        <DraggableReorder
          items={selectedFonts}
          onReorder={handleReorder}
          keyExtractor={(fontValue) => fontValue}
          disabled={disabled}
          gap={4}
          renderItem={(fontValue, index) => (
            <div className={styles.selectedItem}>
              <span className={styles.itemIndex}>{index + 1}.</span>
              <span
                className={styles.itemLabel}
                style={{ fontFamily: fontValue }}
              >
                {getFontLabel(fontValue, allFonts)}
              </span>
              <IconButton
                icon={<CloseIcon />}
                size="sm"
                variant="ghost"
                onClick={() => handleRemoveFont(fontValue)}
                disabled={disabled}
                aria-label="Remove font"
              />
            </div>
          )}
        />
      )}

      {/* Add font dropdown */}
      <Dropdown
        options={availableOptions}
        value=""
        onChange={handleAddFont}
        renderOption={renderOption}
        filterFn={filterFn}
        searchable
        searchPlaceholder="Search fonts..."
        placeholder={selectedFonts.length > 0 ? 'Add fallback font...' : placeholder}
        size={size}
        fullWidth
        disabled={disabled}
        aria-label={ariaLabel || 'Add font'}
      />

      {/* Generated font-family CSS */}
      {selectedFonts.length > 0 && (
        <div className={styles.cssPreview}>
          <span className={styles.cssLabel}>font-family:</span>
          <code className={styles.cssValue}>
            {selectedFonts.map(f => extractFontName(f)).join(', ')}
          </code>
        </div>
      )}
    </div>
  );
}

FontPicker.displayName = 'FontPicker';
