import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { SplitPane, Segmented, Button, Accordion, AccordionItem, AccordionHeader, AccordionContent, Dropdown, Tabs, Card, Input, Select, Alert, Switch, Checkbox, useToast, useTheme } from '@ui-kit/react';
import {
  generateRuntimeThemeTokens,
  contrastRatio,
  getThemeById,
  type RuntimeThemeConfig,
  type RadiiStyle,
  type AccessibilityLevel,
} from '@ui-kit/core';
import styles from './ThemeDesignerPage.module.css';
import {
  saveTheme,
  getStoredTheme,
  getStoredThemes,
  createThemeId,
  getAllThemeOptions,
  type StoredTheme,
} from '../../utils/themeStorage';
import { THEME_SAVED_EVENT } from '../../components/ThemeSwitcher/ThemeSwitcher';

const DEFAULT_CONFIG: RuntimeThemeConfig = {
  primary: '#2563eb',
  secondary: '#06b6d4',
  accent: '#8b5cf6',
  neutral: '#64748b',
  lightBg: '#fafafa',
  darkBg: '#0f0f0f',
  saturation: 0,
  temperature: 0,
  radiusScale: 1,
  radiusStyle: 'rounded',
  sizeScale: 1,
  glowIntensity: 0.5,
  accessibilityLevel: 'AA',
};

// Token roles for the Surface Inspector
const SURFACE_INFO: Record<string, { label: string; description: string; category: 'container' | 'control' | 'feedback' }> = {
  page: { label: 'Page', description: 'Main application background', category: 'container' },
  card: { label: 'Card', description: 'Elevated content containers', category: 'container' },
  overlay: { label: 'Overlay', description: 'Modals, dialogs, sheets', category: 'container' },
  popout: { label: 'Popout', description: 'Dropdowns, menus, tooltips', category: 'container' },
  inset: { label: 'Inset', description: 'Input fields, wells', category: 'container' },
  control: { label: 'Control', description: 'Default buttons', category: 'control' },
  controlPrimary: { label: 'Primary', description: 'Primary action buttons', category: 'control' },
  controlDanger: { label: 'Danger', description: 'Destructive actions', category: 'control' },
  controlSubtle: { label: 'Subtle', description: 'Ghost buttons', category: 'control' },
  controlDisabled: { label: 'Disabled', description: 'Non-interactive', category: 'control' },
  success: { label: 'Success', description: 'Positive feedback', category: 'feedback' },
  warning: { label: 'Warning', description: 'Caution alerts', category: 'feedback' },
  danger: { label: 'Danger', description: 'Error states', category: 'feedback' },
  info: { label: 'Info', description: 'Informational', category: 'feedback' },
};

// Surface groups for the Surface Preview section
const SURFACE_GROUPS = [
  {
    title: 'Standard Surfaces',
    description: 'Core tonal variations from the page background',
    surfaces: [
      { name: 'softer', label: 'Softer', description: 'Most subtle, toward extreme' },
      { name: 'soft', label: 'Soft', description: 'Subtle background' },
      { name: 'base', label: 'Base', description: 'Page defaults' },
      { name: 'strong', label: 'Strong', description: 'Emphasized' },
      { name: 'stronger', label: 'Stronger', description: 'Maximum emphasis' },
    ],
  },
  {
    title: 'Elevation Surfaces',
    description: 'Depth perception relative to the user (light source)',
    surfaces: [
      { name: 'raised', label: 'Raised', description: 'Elevated, closer to user' },
      { name: 'sunken', label: 'Sunken', description: 'Recessed, farther from user' },
    ],
  },
  {
    title: 'Feedback Surfaces',
    description: 'Semantic feedback states',
    surfaces: [
      { name: 'info', label: 'Info', description: 'Informational' },
      { name: 'success', label: 'Success', description: 'Positive outcome' },
      { name: 'warning', label: 'Warning', description: 'Caution needed' },
      { name: 'danger', label: 'Danger', description: 'Error or destructive' },
    ],
  },
  {
    title: 'Special Surfaces',
    description: 'Branded and inverted contexts',
    surfaces: [
      { name: 'inverted', label: 'Inverted', description: 'Opposite color scheme' },
      { name: 'primary', label: 'Primary', description: 'Branded sections' },
    ],
  },
] as const;

// Helper to parse hex color to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

// Helper to convert RGB to hex
function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`;
}

// Helper to adjust hex color lightness
function adjustLightness(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r + amount, g + amount, b + amount);
}

// Map tonal surface names to distinct visual colors for the preview
// Uses the actual token naming: base, soft, softer, strong, stronger, primary, etc.
//
// Surface logic:
// - Light source = user (always)
// - Raised: BRIGHTER (closer to light source) - always positive lightness
// - Sunken: DIMMER (farther from light source) - always negative lightness
// - Soft/Softer: Closer to target extreme (white in light, black in dark)
//   - Each level is a fixed step from Base, controlled by surfaceContrast
//   - Softer = 2 steps, Soft = 1 step toward extreme
// - Strong/Stronger: More contrast from page (darker in light, lighter in dark)
//   - Stronger = 2 steps, Strong = 1 step toward contrast
function getSurfaceTokenMapping(surfaceName: string, tokens: Record<string, string>, isDark: boolean, surfaceContrast = 0.5) {
  const baseBg = tokens['--base-bg'] || (isDark ? '#0f0f0f' : '#fafafa');
  const baseFg = tokens['--base-fg'] || (isDark ? '#e5e5e5' : '#171717');
  const baseBorder = tokens['--base-border'] || (isDark ? '#2a2a2a' : '#e5e5e5');

  // Step size scales with surfaceContrast (0.0 = 10 RGB, 1.0 = 50 RGB)
  // At 0.5 default, step is ~30 RGB
  const minStep = 10;
  const maxStep = 50;
  const stepSize = Math.round(minStep + (maxStep - minStep) * surfaceContrast);

  // Direction for soft (toward extreme: white in light, black in dark)
  const softDir = isDark ? -1 : 1;
  // Direction for strong (toward contrast: black in light, white in dark)
  const strongDir = isDark ? 1 : -1;

  // Calculate surface backgrounds using fixed steps
  // Soft: 1 step toward extreme
  const softBg = adjustLightness(baseBg, softDir * stepSize);
  // Softer: 2 steps toward extreme
  const softerBg = adjustLightness(baseBg, softDir * stepSize * 2);
  // Strong: 1 step toward contrast
  const strongBg = adjustLightness(baseBg, strongDir * stepSize);
  // Stronger: 2 steps toward contrast
  const strongerBg = adjustLightness(baseBg, strongDir * stepSize * 2);

  // Border colors follow the same pattern but with half intensity
  const softerBorder = adjustLightness(baseBorder, softDir * stepSize);
  const strongBorder = adjustLightness(baseBorder, strongDir * stepSize * 0.5);
  const strongerBorder = adjustLightness(baseBorder, strongDir * stepSize);

  // Raised/Sunken: Light source is always the user
  // Raised = brighter (positive), Sunken = dimmer (negative) in BOTH modes
  const raisedStep = 15;  // Always brighter
  const sunkenStep = -12; // Always dimmer

  switch (surfaceName) {
    case 'base':
      return { bg: baseBg, text: baseFg, border: baseBorder, buttonBg: strongBg, buttonText: baseFg, buttonBorder: strongBorder };
    case 'raised':
      return { bg: adjustLightness(baseBg, raisedStep), text: baseFg, border: adjustLightness(baseBorder, raisedStep / 2), buttonBg: strongBg, buttonText: baseFg, buttonBorder: strongBorder };
    case 'sunken':
      return { bg: adjustLightness(baseBg, sunkenStep), text: baseFg, border: adjustLightness(baseBorder, sunkenStep / 2), buttonBg: strongBg, buttonText: baseFg, buttonBorder: strongBorder };
    case 'soft':
      return { bg: softBg, text: baseFg, border: baseBorder, buttonBg: strongBg, buttonText: baseFg, buttonBorder: strongBorder };
    case 'softer':
      return { bg: softerBg, text: baseFg, border: softerBorder, buttonBg: strongBg, buttonText: baseFg, buttonBorder: strongBorder };
    case 'strong':
      return { bg: strongBg, text: baseFg, border: strongBorder, buttonBg: baseBg, buttonText: baseFg, buttonBorder: baseBorder };
    case 'stronger':
      return { bg: strongerBg, text: baseFg, border: strongerBorder, buttonBg: baseBg, buttonText: baseFg, buttonBorder: baseBorder };
    case 'inverted':
      return { bg: isDark ? '#fafafa' : '#0f0f0f', text: isDark ? '#171717' : '#e5e5e5', border: isDark ? '#e5e5e5' : '#2a2a2a', buttonBg: isDark ? '#e5e5e5' : '#2a2a2a', buttonText: isDark ? '#171717' : '#e5e5e5', buttonBorder: isDark ? '#d4d4d4' : '#404040' };
    case 'primary':
      return { bg: tokens['--primary-bg'], text: tokens['--primary-fg'], border: tokens['--primary-bg'], buttonBg: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.3)', buttonText: tokens['--primary-fg'], buttonBorder: 'transparent', textSoft: tokens['--primary-fg-soft'] || 'rgba(255,255,255,0.85)' };
    // Feedback surfaces
    case 'info':
      return { bg: tokens['--feedback-info-bg'] || (isDark ? '#131e37' : '#e0e8f8'), text: tokens['--feedback-info-fg'] || tokens['--primary-bg'], border: tokens['--feedback-info-border'] || tokens['--primary-bg'], buttonBg: tokens['--primary-bg'], buttonText: tokens['--primary-fg'], buttonBorder: 'transparent', textSoft: tokens['--feedback-info-fg'] };
    case 'success':
      return { bg: tokens['--feedback-success-bg'] || (isDark ? '#0f2918' : '#e6f4ea'), text: tokens['--feedback-success-fg'] || '#16a34a', border: tokens['--feedback-success-border'] || '#16a34a', buttonBg: tokens['--success-bg'] || '#16a34a', buttonText: tokens['--success-fg'] || '#ffffff', buttonBorder: 'transparent', textSoft: tokens['--feedback-success-fg'] };
    case 'warning':
      return { bg: tokens['--feedback-warning-bg'] || (isDark ? '#2d1f0d' : '#fef3e0'), text: tokens['--feedback-warning-fg'] || '#d97706', border: tokens['--feedback-warning-border'] || '#f59e0b', buttonBg: tokens['--warning-bg'] || '#f59e0b', buttonText: tokens['--warning-fg'] || '#000000', buttonBorder: 'transparent', textSoft: tokens['--feedback-warning-fg'] };
    case 'danger':
      return { bg: tokens['--feedback-danger-bg'] || (isDark ? '#341313' : '#f6e1e1'), text: tokens['--feedback-danger-fg'] || '#dc2626', border: tokens['--feedback-danger-border'] || '#dc2626', buttonBg: tokens['--danger-bg'] || '#dc2626', buttonText: tokens['--danger-fg'] || '#ffffff', buttonBorder: 'transparent', textSoft: tokens['--feedback-danger-fg'] };
    default:
      return { bg: baseBg, text: baseFg, border: baseBorder, buttonBg: strongBg, buttonText: baseFg, buttonBorder: strongBorder, textSoft: tokens['--base-fg-soft'] || baseFg };
  }
}

// Storage key for active custom theme (must match ThemeSwitcher)
const ACTIVE_CUSTOM_THEME_KEY = 'uikit-active-custom-theme';

// Surface token property suffixes
const SURFACE_PROPS = ['bg', 'bg-hover', 'bg-pressed', 'bg-focus', 'text', 'text-soft', 'text-softer', 'text-strong', 'text-stronger', 'text-hover', 'text-pressed', 'border', 'border-soft', 'border-strong', 'border-stronger', 'border-hover', 'border-pressed', 'border-focus', 'shadow', 'icon'] as const;

// Token name mapping for different surface names
const SURFACE_TOKEN_PREFIX: Record<string, string> = {
  page: 'base',
  card: 'soft',
  overlay: 'overlay',
  popout: 'popout',
  inset: 'softer',
  control: 'strong',
  controlPrimary: 'primary',
  controlDanger: 'feedback-danger',
  controlSubtle: 'base',
  controlDisabled: 'base',
  success: 'feedback-success',
  warning: 'feedback-warning',
  danger: 'feedback-danger',
  info: 'feedback-info',
};

// Extract surface object from flat tokens
function extractSurfaceFromTokens(surfaceKey: string, tokens: Record<string, string>): Record<string, string | undefined> {
  const prefix = SURFACE_TOKEN_PREFIX[surfaceKey] || surfaceKey;
  const surface: Record<string, string | undefined> = {};

  for (const prop of SURFACE_PROPS) {
    const tokenName = `--${prefix}-${prop}`;
    if (tokens[tokenName]) {
      surface[prop] = tokens[tokenName];
    }
  }

  // Fallback for basic properties using fg instead of text
  if (!surface.text && tokens[`--${prefix}-fg`]) {
    surface.text = tokens[`--${prefix}-fg`];
  }
  if (!surface.bg && tokens[`--${prefix}-bg`]) {
    surface.bg = tokens[`--${prefix}-bg`];
  }
  if (!surface.border && tokens[`--${prefix}-border`]) {
    surface.border = tokens[`--${prefix}-border`];
  }

  return surface;
}

export function ThemeDesignerPage() {
  const [config, setConfig] = useState<RuntimeThemeConfig>(DEFAULT_CONFIG);
  const [previewMode, setPreviewMode] = useState<'light' | 'dark'>('light');
  const [themeName, setThemeName] = useState('My Theme');
  const [baseTheme, setBaseTheme] = useState<string>('default');
  const [activeSurface, setActiveSurface] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [surfaceContrast, setSurfaceContrast] = useState(0.5); // Controls tonal surface step size
  const previewRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();
  const { theme: currentTheme } = useTheme();

  // Load a theme by its dropdown value (handles both custom: and built-in themes)
  const loadBaseTheme = useCallback((themeValue: string) => {
    // Handle custom themes (prefixed with 'custom:')
    if (themeValue.startsWith('custom:')) {
      const customThemeId = themeValue.replace('custom:', '');
      const storedTheme = getStoredTheme(customThemeId);
      if (storedTheme) {
        setConfig(storedTheme.config);
        setThemeName(storedTheme.name);
        setBaseTheme(themeValue);
        return;
      }
    }

    // Check if we have a stored version in localStorage (for built-in themes)
    const storedTheme = getStoredTheme(themeValue);
    if (storedTheme) {
      setConfig(storedTheme.config);
      setThemeName(storedTheme.name);
      setBaseTheme(themeValue);
      return;
    }

    // Load from built-in themes using the core package
    const themeData = getThemeById(themeValue);
    if (themeData) {
      // Map theme data to config (use defaults for properties not in ThemeDefinition)
      const newConfig: RuntimeThemeConfig = {
        primary: themeData.colors?.primary || DEFAULT_CONFIG.primary,
        secondary: themeData.colors?.secondary,
        accent: themeData.colors?.accent,
        neutral: themeData.colors?.neutral,
        lightBg: DEFAULT_CONFIG.lightBg,
        darkBg: DEFAULT_CONFIG.darkBg,
        saturation: themeData.config?.saturation ?? DEFAULT_CONFIG.saturation,
        temperature: themeData.config?.temperature ?? DEFAULT_CONFIG.temperature,
        radiusScale: themeData.radii?.scale ?? DEFAULT_CONFIG.radiusScale,
        radiusStyle: themeData.radii?.style ?? DEFAULT_CONFIG.radiusStyle,
        sizeScale: themeData.spacing?.scale ?? DEFAULT_CONFIG.sizeScale,
        glowIntensity: DEFAULT_CONFIG.glowIntensity,
        accessibilityLevel: themeData.accessibility?.level ?? DEFAULT_CONFIG.accessibilityLevel,
      };

      setConfig(newConfig);
      setThemeName(themeData.name || 'My Theme');
      setBaseTheme(themeValue);
    } else {
      console.warn('Theme not found:', themeValue);
    }
  }, []);

  // Initialize with the currently active theme
  useEffect(() => {
    if (initialized) return;

    // Check if there's an active custom theme
    const activeCustomThemeId = localStorage.getItem(ACTIVE_CUSTOM_THEME_KEY);
    if (activeCustomThemeId) {
      const customTheme = getStoredThemes().find(t => t.id === activeCustomThemeId);
      if (customTheme) {
        loadBaseTheme(`custom:${activeCustomThemeId}`);
        setInitialized(true);
        return;
      }
    }

    // Otherwise load the current built-in theme
    if (currentTheme && currentTheme !== 'default') {
      loadBaseTheme(currentTheme);
    }
    setInitialized(true);
  }, [currentTheme, loadBaseTheme, initialized]);

  // Handle base theme selection
  const handleBaseThemeChange = (value: string | string[]) => {
    const themeValue = Array.isArray(value) ? value[0] : value;
    if (themeValue && themeValue !== 'divider') {
      loadBaseTheme(themeValue);
    }
  };

  // Generate theme whenever config or mode changes
  const generatedTokens = useMemo(() => {
    return generateRuntimeThemeTokens(config, previewMode === 'dark' ? 'dark' : 'light');
  }, [config, previewMode]);

  // Apply tokens to preview element
  useEffect(() => {
    if (previewRef.current) {
      for (const [name, value] of Object.entries(generatedTokens)) {
        previewRef.current.style.setProperty(name, value);
      }
    }
  }, [generatedTokens]);

  const handleConfigChange = <K extends keyof RuntimeThemeConfig>(key: K, value: RuntimeThemeConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleCopyToken = (tokenName: string, tokenValue: string) => {
    navigator.clipboard.writeText(`${tokenName}: ${tokenValue};`);
    setCopiedToken(tokenName);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleExportJSON = () => {
    const exportData = {
      id: themeName.toLowerCase().replace(/\s+/g, '-'),
      name: themeName,
      colors: { primary: config.primary, secondary: config.secondary, accent: config.accent, neutral: config.neutral },
      config: { saturation: config.saturation, temperature: config.temperature },
      radii: { style: config.radiusStyle, scale: config.radiusScale },
      accessibility: { level: config.accessibilityLevel },
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exportData.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSS = () => {
    const lightTokens = generateRuntimeThemeTokens(config, 'light');
    const darkTokens = generateRuntimeThemeTokens(config, 'dark');
    const themeId = themeName.toLowerCase().replace(/\s+/g, '-');
    let css = `/* ${themeName} - Generated by UI-Kit Theme Designer */\n\n`;
    css += '/* Light Mode */\n';
    css += `[data-theme="${themeId}"], [data-theme="${themeId}"][data-mode="light"] {\n`;
    for (const [name, value] of Object.entries(lightTokens)) {
      css += `  ${name}: ${value};\n`;
    }
    css += '}\n\n/* Dark Mode */\n';
    css += `[data-theme="${themeId}"][data-mode="dark"] {\n`;
    for (const [name, value] of Object.entries(darkTokens)) {
      css += `  ${name}: ${value};\n`;
    }
    css += '}\n';
    const blob = new Blob([css], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${themeId}.css`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveTheme = () => {
    const themeId = createThemeId(themeName);
    const storedTheme: StoredTheme = {
      id: themeId,
      name: themeName,
      version: 1,
      baseTheme: baseTheme !== 'default' ? baseTheme : undefined,
      config,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      saveTheme(storedTheme);

      // Dispatch event to notify ThemeSwitcher to update and select this theme
      window.dispatchEvent(new CustomEvent(THEME_SAVED_EVENT, {
        detail: { themeId }
      }));

      // Show success feedback
      console.log('Theme saved:', themeName);
      showToast({
        variant: 'success',
        title: 'Theme Saved',
        message: `"${themeName}" saved successfully!`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Failed to save theme:', error);
      showToast({
        variant: 'error',
        title: 'Save Failed',
        message: 'Failed to save theme. Please try again.',
        duration: 5000,
      });
    }
  };

  const handleResetTheme = () => {
    setConfig(DEFAULT_CONFIG);
  };

  const getContrastDisplay = (bg: string, text: string) => {
    const ratio = contrastRatio(bg, text);
    const level = ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : ratio >= 3 ? 'AA-large' : 'Fail';
    return { ratio: ratio.toFixed(2), level };
  };

  // Tools Panel Content
  const toolsPanel = (
    <div className={styles.toolsPanel}>
      <Accordion allowMultiple defaultExpandedItems={['identity', 'colors', 'sizing']}>
        {/* Theme Identity */}
        <AccordionItem id="identity">
          <AccordionHeader itemId="identity">Theme Identity</AccordionHeader>
          <AccordionContent itemId="identity">
            <div className={styles.accordionBody}>
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Base Theme</label>
                <Dropdown
                  options={getAllThemeOptions()}
                  value={baseTheme}
                  onChange={handleBaseThemeChange}
                  size="sm"
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Theme Name</label>
                <input
                  type="text"
                  value={themeName}
                  onChange={(e) => setThemeName(e.target.value)}
                  className={styles.textInput}
                  placeholder="My Theme"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Colors */}
        <AccordionItem id="colors">
          <AccordionHeader itemId="colors">Colors</AccordionHeader>
          <AccordionContent itemId="colors">
            <div className={styles.accordionBody}>
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Primary Color</label>
                <ColorInput label="Primary" value={config.primary} onChange={(v) => handleConfigChange('primary', v)} />
                <p className={styles.hint}>Affects buttons, links, focus rings, and selections.</p>
              </div>
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Page Backgrounds</label>
                <div className={styles.colorRow}>
                  <ColorInput label="Light" value={config.lightBg || '#fafafa'} onChange={(v) => handleConfigChange('lightBg', v)} />
                  <ColorInput label="Dark" value={config.darkBg || '#0f0f0f'} onChange={(v) => handleConfigChange('darkBg', v)} />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Sizing & Shape */}
        <AccordionItem id="sizing">
          <AccordionHeader itemId="sizing">Sizing &amp; Shape</AccordionHeader>
          <AccordionContent itemId="sizing">
            <div className={styles.accordionBody}>
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Border Radius</label>
                <Segmented
                  options={[
                    { value: 'sharp', label: 'Sharp' },
                    { value: 'subtle', label: 'Subtle' },
                    { value: 'rounded', label: 'Rounded' },
                    { value: 'pill', label: 'Pill' },
                  ]}
                  value={config.radiusStyle}
                  onChange={(v) => handleConfigChange('radiusStyle', v as RadiiStyle)}
                  size="sm"
                  fullWidth
                />
              </div>
              <div className={styles.formField}>
                <div className={styles.sliderHeader}>
                  <label className={styles.fieldLabel}>Radius Scale</label>
                  <span className={styles.sliderValue}>{(config.radiusScale ?? 1).toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={config.radiusScale ?? 1}
                  onChange={(e) => handleConfigChange('radiusScale', parseFloat(e.target.value))}
                  className={styles.slider}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Effects */}
        <AccordionItem id="effects">
          <AccordionHeader itemId="effects">Effects</AccordionHeader>
          <AccordionContent itemId="effects">
            <div className={styles.accordionBody}>
              <div className={styles.formField}>
                <div className={styles.sliderHeader}>
                  <label className={styles.fieldLabel}>Glow Intensity</label>
                  <span className={styles.sliderValue}>{Math.round((config.glowIntensity ?? 0.5) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={config.glowIntensity ?? 0.5}
                  onChange={(e) => handleConfigChange('glowIntensity', parseFloat(e.target.value))}
                  className={styles.slider}
                />
                <p className={styles.hint}>Affects glow on tabs, selections, and focus states.</p>
              </div>
              <div className={styles.formField}>
                <div className={styles.sliderHeader}>
                  <label className={styles.fieldLabel}>Surface Contrast</label>
                  <span className={styles.sliderValue}>{Math.round(surfaceContrast * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={surfaceContrast}
                  onChange={(e) => setSurfaceContrast(parseFloat(e.target.value))}
                  className={styles.slider}
                />
                <p className={styles.hint}>Controls how distinct tonal surfaces (soft, strong) are from the base.</p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Token Inspector */}
        <AccordionItem id="tokens">
          <AccordionHeader itemId="tokens">Token Inspector</AccordionHeader>
          <AccordionContent itemId="tokens">
            <div className={styles.accordionBody}>
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Contrast Target</label>
                <Segmented
                  options={[
                    { value: 'AA', label: 'AA (4.5:1)' },
                    { value: 'AAA', label: 'AAA (7:1)' },
                  ]}
                  value={config.accessibilityLevel}
                  onChange={(v) => handleConfigChange('accessibilityLevel', v as AccessibilityLevel)}
                  size="sm"
                  fullWidth
                />
                <p className={styles.hint}>Higher contrast improves readability for users with visual impairments.</p>
              </div>
              <p className={styles.hint}>Click a surface to view its computed CSS variables.</p>
              <div className={styles.surfaceList}>
                {Object.entries(SURFACE_INFO).map(([key, info]) => {
                  const surface = extractSurfaceFromTokens(key, generatedTokens);
                  const bgColor = surface.bg || '#888';
                  const textColor = surface.text || '#fff';
                  if (!bgColor || !textColor) return null;
                  const isActive = activeSurface === key;
                  const contrast = getContrastDisplay(bgColor, textColor);

                  return (
                    <div key={key}>
                      <button
                        className={`${styles.surfaceItem} ${isActive ? styles.surfaceItemActive : ''}`}
                        onClick={() => setActiveSurface(isActive ? null : key)}
                      >
                        <div className={styles.surfaceSwatch} style={{ background: bgColor, color: textColor, borderRadius: generatedTokens['--radius-sm'] }}>Aa</div>
                        <div className={styles.surfaceInfo}>
                          <span className={styles.surfaceName}>{info.label}</span>
                          <span className={styles.surfaceDesc}>{info.description}</span>
                        </div>
                        <div className={styles.surfaceContrast}>
                          <span className={`${styles.contrastLevel} ${styles[`contrast${contrast.level.replace('-', '')}`]}`}>{contrast.level}</span>
                          <span className={styles.contrastRatio}>{contrast.ratio}:1</span>
                        </div>
                      </button>
                      {isActive && (
                        <div className={styles.tokenList}>
                          {Object.entries(surface).map(([prop, value]) => {
                            if (value === undefined) return null;
                            const tokenPrefix = SURFACE_TOKEN_PREFIX[key] || key;
                            const tokenName = `--${tokenPrefix}-${prop}`;
                            return (
                              <button key={prop} className={`${styles.tokenItem} ${copiedToken === tokenName ? styles.tokenCopied : ''}`} onClick={() => handleCopyToken(tokenName, String(value))}>
                                <code className={styles.tokenName}>{tokenName}</code>
                                <span className={styles.tokenValue}>
                                  {String(value).startsWith('#') || String(value).startsWith('rgb') ? (<><span className={styles.tokenSwatch} style={{ background: String(value) }} />{value}</>) : value}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Export */}
        <AccordionItem id="export">
          <AccordionHeader itemId="export">Export</AccordionHeader>
          <AccordionContent itemId="export">
            <div className={styles.accordionBody}>
              <div className={styles.exportButtons}>
                <Button variant="default" size="sm" onClick={handleExportJSON}>Export JSON</Button>
                <Button variant="primary" size="sm" onClick={handleExportCSS}>Export CSS</Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );

  // Preview Panel Content
  const previewPanel = (
    <div className={styles.previewPanel}>
      <div className={styles.previewHeader}>
        <Segmented
          options={[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
          value={previewMode}
          onChange={(v) => setPreviewMode(v as 'light' | 'dark')}
          size="sm"
        />
        <div className={styles.previewActions}>
          <Button variant="default" size="sm" onClick={handleResetTheme}>Reset</Button>
          <Button variant="primary" size="sm" onClick={handleSaveTheme}>Save Theme</Button>
        </div>
      </div>
      <div ref={previewRef} className={styles.previewContent} style={{ ...generatedTokens, background: generatedTokens['--base-bg'], color: generatedTokens['--base-fg'] } as React.CSSProperties}>
        {/* Buttons Preview */}
        <div className={styles.previewSection}>
          <h3 className={styles.previewSectionTitle}>Buttons</h3>
          <div className={styles.buttonRow}>
            <Button variant="primary">Primary</Button>
            <Button variant="default">Secondary</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
        </div>

        {/* Tabs Preview - demonstrates glow effect */}
        <div className={styles.previewSection}>
          <h3 className={styles.previewSectionTitle}>Navigation (Glow Effect)</h3>
          <Tabs
            items={[
              { value: 'overview', label: 'Overview', content: null },
              { value: 'features', label: 'Features', content: null },
              { value: 'settings', label: 'Settings', content: null },
            ]}
            defaultValue="overview"
            variant="underline"
          />
        </div>

        {/* Card Preview */}
        <div className={styles.previewSection}>
          <h3 className={styles.previewSectionTitle}>Card</h3>
          <Card>
            <h4>Card Title</h4>
            <p style={{ opacity: 0.7 }}>This is secondary text on a card surface. Notice how the text colors automatically adjust for optimal contrast.</p>
          </Card>
        </div>

        {/* Form Controls Preview */}
        <div className={styles.previewSection}>
          <h3 className={styles.previewSectionTitle}>Form Controls</h3>
          <div className={styles.formControlsGrid}>
            <div className={styles.formControlRow}>
              <Input placeholder="Text input" />
              <Select
                options={[
                  { value: '', label: 'Select option' },
                  { value: '1', label: 'Option 1' },
                  { value: '2', label: 'Option 2' },
                ]}
                placeholder="Select option"
              />
            </div>
            <div className={styles.formControlRow}>
              <Dropdown
                options={[
                  { value: 'option1', label: 'Dropdown Option 1' },
                  { value: 'option2', label: 'Dropdown Option 2' },
                  { value: 'option3', label: 'Dropdown Option 3' },
                ]}
                placeholder="Dropdown menu"
                size="md"
              />
              <Segmented
                options={[
                  { value: 'left', label: 'Left' },
                  { value: 'center', label: 'Center' },
                  { value: 'right', label: 'Right' },
                ]}
                value="center"
                size="md"
                fullWidth
              />
            </div>
            <div className={styles.formControlRow}>
              <div className={styles.toggleRow}>
                <Switch defaultChecked label="Switch control" />
              </div>
              <div className={styles.toggleRow}>
                <Checkbox defaultChecked label="Checkbox control" />
              </div>
            </div>
          </div>
        </div>

        {/* Surface Groups */}
        {SURFACE_GROUPS.map((group) => (
          <div key={group.title} className={styles.previewSection}>
            <h3 className={styles.previewSectionTitle}>{group.title}</h3>
            <p className={styles.previewSectionDesc}>{group.description}</p>
            <div className={styles.surfacesGrid}>
              {group.surfaces.map(({ name, label, description }) => {
                const surfaceTokens = getSurfaceTokenMapping(name, generatedTokens, previewMode === 'dark', surfaceContrast);
                const isFeedback = ['info', 'success', 'warning', 'danger'].includes(name);
                const isSpecial = ['inverted', 'primary'].includes(name);
                return (
                  <div
                    key={name}
                    className={styles.surfacePreview}
                    style={{
                      background: surfaceTokens.bg,
                      color: surfaceTokens.text,
                      borderColor: surfaceTokens.border,
                      borderRadius: generatedTokens['--radius-lg'],
                    }}
                  >
                    <span className={styles.surfacePreviewLabel}>{label}</span>
                    <span className={styles.surfacePreviewDesc} style={{ opacity: 0.7 }}>{description}</span>
                    <div className={styles.surfaceTextExamples}>
                      <span style={{ fontWeight: 600 }}>Strong text</span>
                      <span>Regular text</span>
                      <span style={{ opacity: 0.7 }}>Soft text</span>
                    </div>
                    <div className={styles.surfaceButtonRow}>
                      <button
                        className={styles.surfacePreviewButton}
                        style={{
                          background: isSpecial ? surfaceTokens.buttonBg : (generatedTokens['--strong-bg'] || '#e0e0e0'),
                          color: isSpecial ? surfaceTokens.buttonText : (generatedTokens['--strong-fg'] || '#171717'),
                          borderColor: 'transparent',
                          borderRadius: generatedTokens['--radius-md'],
                        }}
                      >
                        Default
                      </button>
                      <button
                        className={styles.surfacePreviewButton}
                        style={{
                          background: isFeedback ? surfaceTokens.buttonBg : (generatedTokens['--primary-bg'] || '#2563eb'),
                          color: isFeedback ? surfaceTokens.buttonText : (generatedTokens['--primary-fg'] || '#ffffff'),
                          borderColor: 'transparent',
                          borderRadius: generatedTokens['--radius-md'],
                        }}
                      >
                        Primary
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={styles.designer}>
      <SplitPane
        first={toolsPanel}
        second={previewPanel}
        orientation="horizontal"
        defaultSize={320}
        minSize={280}
        maxSize={480}
        collapsible
      />
    </div>
  );
}

// Compact Color Input Component
function ColorInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <div className={styles.colorInput}>
      <label className={styles.colorInputLabel}>{label}</label>
      <div className={styles.colorInputControls}>
        <input type="color" value={value || '#666666'} onChange={(e) => onChange(e.target.value)} className={styles.colorPicker} />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={styles.colorHex} />
      </div>
    </div>
  );
}
