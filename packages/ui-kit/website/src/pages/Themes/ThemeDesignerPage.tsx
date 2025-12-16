import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { SplitPane, Segmented, Button, Accordion, AccordionItem, AccordionHeader, AccordionContent, Dropdown, Tabs, Card, Input, Select, Alert, Switch, Checkbox, useToast, useTheme } from '@ui-kit/react';
import styles from './ThemeDesignerPage.module.css';
import {
  generateTheme,
  contrastRatio,
  type ThemeConfig,
  type RadiiStyle,
  type AccessibilityLevel,
} from '../../utils/themeGenerator';
import {
  saveTheme,
  getStoredTheme,
  getStoredThemes,
  createThemeId,
  getAllThemeOptions,
  type StoredTheme,
} from '../../utils/themeStorage';
import { THEME_SAVED_EVENT } from '../../components/ThemeSwitcher/ThemeSwitcher';

const DEFAULT_CONFIG: ThemeConfig = {
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

// Tonal surfaces for the Surface Preview section
const TONAL_SURFACES = [
  { name: 'base', label: 'Base', description: 'Reset to page defaults' },
  { name: 'raised', label: 'Raised', description: 'Cards, panels, elevated content' },
  { name: 'sunken', label: 'Sunken', description: 'Sidebars, wells, recessed areas' },
  { name: 'soft', label: 'Soft', description: 'Subtle background sections' },
  { name: 'softer', label: 'Softer', description: 'Very subtle backgrounds' },
  { name: 'strong', label: 'Strong', description: 'Emphasized sections' },
  { name: 'stronger', label: 'Stronger', description: 'Very emphasized sections' },
  { name: 'inverted', label: 'Inverted', description: 'Opposite color scheme' },
  { name: 'primary', label: 'Primary', description: 'Branded sections' },
] as const;

// Helper to adjust hex color lightness
function adjustLightness(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const adjust = (c: number) => Math.max(0, Math.min(255, c + amount));
  const nr = adjust(r);
  const ng = adjust(g);
  const nb = adjust(b);
  return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
}

// Map tonal surface names to distinct visual colors for the preview
// Uses the actual token naming: base, soft, softer, strong, stronger, primary, etc.
function getSurfaceTokenMapping(surfaceName: string, tokens: Record<string, string>, isDark: boolean) {
  const baseBg = tokens['--base-bg'] || (isDark ? '#0f0f0f' : '#fafafa');
  const baseFg = tokens['--base-fg'] || (isDark ? '#e5e5e5' : '#171717');
  const baseBorder = tokens['--base-border'] || (isDark ? '#2a2a2a' : '#e5e5e5');
  const strongBg = tokens['--strong-bg'] || (isDark ? '#2a2a2a' : '#e0e0e0');
  const strongFg = tokens['--strong-fg'] || baseFg;
  const strongBorder = tokens['--strong-border'] || (isDark ? '#404040' : '#d4d4d4');
  const step = isDark ? 15 : -10;

  switch (surfaceName) {
    case 'base':
      return { bg: baseBg, text: baseFg, border: baseBorder, buttonBg: strongBg, buttonText: strongFg, buttonBorder: strongBorder };
    case 'raised':
      return { bg: adjustLightness(baseBg, step * 2), text: baseFg, border: adjustLightness(baseBorder, step), buttonBg: strongBg, buttonText: strongFg, buttonBorder: strongBorder };
    case 'sunken':
      return { bg: adjustLightness(baseBg, -step), text: baseFg, border: adjustLightness(baseBorder, -step), buttonBg: strongBg, buttonText: strongFg, buttonBorder: strongBorder };
    case 'soft':
      return { bg: adjustLightness(baseBg, step), text: baseFg, border: baseBorder, buttonBg: strongBg, buttonText: strongFg, buttonBorder: strongBorder };
    case 'softer':
      return { bg: adjustLightness(baseBg, Math.round(step * 0.5)), text: baseFg, border: baseBorder, buttonBg: strongBg, buttonText: strongFg, buttonBorder: strongBorder };
    case 'strong':
      return { bg: strongBg, text: strongFg, border: strongBorder, buttonBg: baseBg, buttonText: baseFg, buttonBorder: baseBorder };
    case 'stronger':
      return { bg: adjustLightness(strongBg, step), text: strongFg, border: adjustLightness(strongBorder, step), buttonBg: baseBg, buttonText: baseFg, buttonBorder: baseBorder };
    case 'inverted':
      return { bg: isDark ? '#fafafa' : '#0f0f0f', text: isDark ? '#171717' : '#e5e5e5', border: isDark ? '#e5e5e5' : '#2a2a2a', buttonBg: isDark ? '#e5e5e5' : '#2a2a2a', buttonText: isDark ? '#171717' : '#e5e5e5', buttonBorder: isDark ? '#d4d4d4' : '#404040' };
    case 'primary':
      return { bg: tokens['--primary-bg'], text: tokens['--primary-fg'], border: tokens['--primary-bg'], buttonBg: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.3)', buttonText: tokens['--primary-fg'], buttonBorder: 'transparent' };
    default:
      return { bg: baseBg, text: baseFg, border: baseBorder, buttonBg: strongBg, buttonText: strongFg, buttonBorder: strongBorder };
  }
}

// Storage key for active custom theme (must match ThemeSwitcher)
const ACTIVE_CUSTOM_THEME_KEY = 'uikit-active-custom-theme';

export function ThemeDesignerPage() {
  const [config, setConfig] = useState<ThemeConfig>(DEFAULT_CONFIG);
  const [previewMode, setPreviewMode] = useState<'light' | 'dark'>('light');
  const [themeName, setThemeName] = useState('My Theme');
  const [baseTheme, setBaseTheme] = useState<string>('default');
  const [activeSurface, setActiveSurface] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();
  const { theme: currentTheme } = useTheme();

  // Load a theme by its dropdown value (handles both custom: and built-in themes)
  const loadBaseTheme = useCallback(async (themeValue: string) => {
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

    // Fall back to fetching from server
    try {
      const response = await fetch(`/themes/${themeValue}.json`);
      if (!response.ok) throw new Error('Theme not found');
      const themeData = await response.json();

      // Map theme data to config
      const newConfig: ThemeConfig = {
        primary: themeData.colors?.primary || DEFAULT_CONFIG.primary,
        secondary: themeData.colors?.secondary,
        accent: themeData.colors?.accent,
        neutral: themeData.colors?.neutral,
        lightBg: themeData.backgrounds?.light,
        darkBg: themeData.backgrounds?.dark,
        saturation: themeData.config?.saturation ?? DEFAULT_CONFIG.saturation,
        temperature: themeData.config?.temperature ?? DEFAULT_CONFIG.temperature,
        radiusScale: themeData.radii?.scale ?? DEFAULT_CONFIG.radiusScale,
        radiusStyle: themeData.radii?.style ?? DEFAULT_CONFIG.radiusStyle,
        sizeScale: themeData.sizing?.scale ?? DEFAULT_CONFIG.sizeScale,
        glowIntensity: themeData.effects?.glowIntensity ?? DEFAULT_CONFIG.glowIntensity,
        accessibilityLevel: themeData.accessibility?.level ?? DEFAULT_CONFIG.accessibilityLevel,
      };

      setConfig(newConfig);
      setThemeName(themeData.name || 'My Theme');
      setBaseTheme(themeValue);
    } catch (error) {
      console.error('Failed to load theme:', error);
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
  const generatedTheme = useMemo(() => {
    return generateTheme(config, previewMode === 'dark');
  }, [config, previewMode]);

  // Apply tokens to preview element
  useEffect(() => {
    if (previewRef.current) {
      for (const [name, value] of Object.entries(generatedTheme.tokens)) {
        previewRef.current.style.setProperty(name, value);
      }
    }
  }, [generatedTheme]);

  const handleConfigChange = <K extends keyof ThemeConfig>(key: K, value: ThemeConfig[K]) => {
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
    const lightTheme = generateTheme(config, false);
    const darkTheme = generateTheme(config, true);
    const themeId = themeName.toLowerCase().replace(/\s+/g, '-');
    let css = `/* ${themeName} - Generated by UI-Kit Theme Designer */\n\n`;
    css += '/* Light Mode */\n';
    css += `[data-theme="${themeId}"], [data-theme="${themeId}"][data-mode="light"] {\n`;
    for (const [name, value] of Object.entries(lightTheme.tokens)) {
      css += `  ${name}: ${value};\n`;
    }
    css += '}\n\n/* Dark Mode */\n';
    css += `[data-theme="${themeId}"][data-mode="dark"] {\n`;
    for (const [name, value] of Object.entries(darkTheme.tokens)) {
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
                  <span className={styles.sliderValue}>{config.radiusScale.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={config.radiusScale}
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
                  <span className={styles.sliderValue}>{Math.round(config.glowIntensity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={config.glowIntensity}
                  onChange={(e) => handleConfigChange('glowIntensity', parseFloat(e.target.value))}
                  className={styles.slider}
                />
                <p className={styles.hint}>Affects glow on tabs, selections, and focus states.</p>
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
                  const surface = generatedTheme.surfaces[key as keyof typeof generatedTheme.surfaces];
                  if (!surface) return null;
                  const isActive = activeSurface === key;
                  const bgColor = surface.bg;
                  const textColor = surface.text;
                  const contrast = getContrastDisplay(bgColor, textColor);

                  return (
                    <div key={key}>
                      <button
                        className={`${styles.surfaceItem} ${isActive ? styles.surfaceItemActive : ''}`}
                        onClick={() => setActiveSurface(isActive ? null : key)}
                      >
                        <div className={styles.surfaceSwatch} style={{ background: bgColor, color: textColor, borderRadius: generatedTheme.tokens['--radius-sm'] }}>Aa</div>
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
                            const tokenName = `--${key}-${prop}`;
                            return (
                              <button key={prop} className={`${styles.tokenItem} ${copiedToken === tokenName ? styles.tokenCopied : ''}`} onClick={() => handleCopyToken(tokenName, value)}>
                                <code className={styles.tokenName}>{tokenName}</code>
                                <span className={styles.tokenValue}>
                                  {value.startsWith('#') || value.startsWith('rgb') ? (<><span className={styles.tokenSwatch} style={{ background: value }} />{value}</>) : value}
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
      <div ref={previewRef} className={styles.previewContent} style={{ ...generatedTheme.tokens, background: generatedTheme.tokens['--base-bg'], color: generatedTheme.tokens['--base-fg'] } as React.CSSProperties}>
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

        {/* Alerts Preview */}
        <div className={styles.previewSection}>
          <h3 className={styles.previewSectionTitle}>Feedback</h3>
          <div className={styles.alertsGrid}>
            <Alert
              variant="success"
              style={{
                background: generatedTheme.tokens['--feedback-success-bg'],
                color: generatedTheme.tokens['--feedback-success-fg'],
                borderLeftColor: generatedTheme.tokens['--feedback-success-border'],
              }}
            >
              Success message
            </Alert>
            <Alert
              variant="warning"
              style={{
                background: generatedTheme.tokens['--feedback-warning-bg'],
                color: generatedTheme.tokens['--feedback-warning-fg'],
                borderLeftColor: generatedTheme.tokens['--feedback-warning-border'],
              }}
            >
              Warning message
            </Alert>
            <Alert
              variant="danger"
              style={{
                background: generatedTheme.tokens['--feedback-danger-bg'],
                color: generatedTheme.tokens['--feedback-danger-fg'],
                borderLeftColor: generatedTheme.tokens['--feedback-danger-border'],
              }}
            >
              Danger message
            </Alert>
            <Alert
              variant="info"
              style={{
                background: generatedTheme.tokens['--feedback-info-bg'],
                color: generatedTheme.tokens['--feedback-info-fg'],
                borderLeftColor: generatedTheme.tokens['--feedback-info-border'],
              }}
            >
              Info message
            </Alert>
          </div>
        </div>

        {/* Tonal Surfaces Preview */}
        <div className={styles.previewSection}>
          <h3 className={styles.previewSectionTitle}>Tonal Surfaces</h3>
          <p className={styles.previewSectionDesc}>Use <code>.surface.&#123;name&#125;</code> classes to create distinct visual contexts.</p>
          <div className={styles.surfacesGrid}>
            {TONAL_SURFACES.map(({ name, label, description }) => {
              const surfaceTokens = getSurfaceTokenMapping(name, generatedTheme.tokens, previewMode === 'dark');
              return (
                <div key={name} className={styles.surfacePreview} style={{ background: surfaceTokens.bg, color: surfaceTokens.text, borderColor: surfaceTokens.border, borderRadius: generatedTheme.tokens['--radius-lg'] }}>
                  <span className={styles.surfacePreviewLabel}>{label}</span>
                  <span className={styles.surfacePreviewDesc} style={{ color: surfaceTokens.text, opacity: 0.7 }}>{description}</span>
                  <button className={styles.surfacePreviewButton} style={{ background: surfaceTokens.buttonBg, color: surfaceTokens.buttonText, borderColor: surfaceTokens.buttonBorder, borderRadius: generatedTheme.tokens['--radius-md'] }}>Button</button>
                </div>
              );
            })}
          </div>
        </div>
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
