import { useState, useEffect, useRef, useMemo } from 'react';
import styles from './ThemeDesignerPage.module.css';
import {
  generateTheme,
  contrastRatio,
  type ThemeConfig,
  type RadiiStyle,
  type AccessibilityLevel,
  type GeneratedTheme,
} from '../../utils/themeGenerator';

const DEFAULT_CONFIG: ThemeConfig = {
  primary: '#2563eb',
  secondary: '#06b6d4',
  accent: '#8b5cf6',
  neutral: '#64748b',
  saturation: 0,
  temperature: 0,
  radiusScale: 1,
  radiusStyle: 'rounded',
  accessibilityLevel: 'AA',
};

// Token roles for the Surface Inspector
const SURFACE_INFO: Record<string, { label: string; description: string; category: 'container' | 'control' | 'feedback' }> = {
  // Container roles (legacy - used for tokens like --page-bg, --card-bg)
  page: { label: 'Page', description: 'Main application background', category: 'container' },
  card: { label: 'Card', description: 'Elevated content containers', category: 'container' },
  overlay: { label: 'Overlay', description: 'Modals, dialogs, sheets', category: 'container' },
  popout: { label: 'Popout', description: 'Dropdowns, menus, tooltips', category: 'container' },
  inset: { label: 'Inset', description: 'Input fields, wells', category: 'container' },
  // Control roles
  control: { label: 'Control', description: 'Default buttons', category: 'control' },
  controlPrimary: { label: 'Primary', description: 'Primary action buttons', category: 'control' },
  controlDanger: { label: 'Danger', description: 'Destructive actions', category: 'control' },
  controlSubtle: { label: 'Subtle', description: 'Ghost buttons', category: 'control' },
  controlDisabled: { label: 'Disabled', description: 'Non-interactive', category: 'control' },
  // Feedback roles
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
  // Parse hex
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // Adjust each channel
  const adjust = (c: number) => Math.max(0, Math.min(255, c + amount));
  const nr = adjust(r);
  const ng = adjust(g);
  const nb = adjust(b);

  return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
}

// Map tonal surface names to distinct visual colors for the preview
function getSurfaceTokenMapping(surfaceName: string, tokens: Record<string, string>, isDark: boolean): {
  bg: string;
  text: string;
  border: string;
  buttonBg: string;
  buttonText: string;
  buttonBorder: string;
} {
  // Use the generated page colors as the base, then derive distinct surfaces
  const pageBg = tokens['--page-bg'];
  const pageText = tokens['--page-text'];
  const pageBorder = tokens['--page-border'];
  const controlBg = tokens['--control-bg'];
  const controlText = tokens['--control-text'];
  const controlBorder = tokens['--control-border'];

  // In dark mode, lighter = higher values. In light mode, darker = lower values.
  // We use larger offsets to make surfaces more visually distinct.
  const step = isDark ? 15 : -10;

  switch (surfaceName) {
    case 'base':
      // Page default - the baseline
      return {
        bg: pageBg,
        text: pageText,
        border: pageBorder,
        buttonBg: controlBg,
        buttonText: controlText,
        buttonBorder: controlBorder,
      };
    case 'raised':
      // Elevated content - noticeably lighter in dark mode, darker in light mode
      return {
        bg: adjustLightness(pageBg, step * 2),
        text: pageText,
        border: adjustLightness(pageBorder, step),
        buttonBg: controlBg,
        buttonText: controlText,
        buttonBorder: controlBorder,
      };
    case 'sunken':
      // Recessed areas - darker in dark mode, lighter in light mode
      return {
        bg: adjustLightness(pageBg, -step),
        text: pageText,
        border: adjustLightness(pageBorder, -step),
        buttonBg: controlBg,
        buttonText: controlText,
        buttonBorder: controlBorder,
      };
    case 'soft':
      // Subtle background - slightly different from base
      return {
        bg: adjustLightness(pageBg, step),
        text: pageText,
        border: pageBorder,
        buttonBg: controlBg,
        buttonText: controlText,
        buttonBorder: controlBorder,
      };
    case 'softer':
      // Very subtle - even closer to base
      return {
        bg: adjustLightness(pageBg, Math.round(step * 0.5)),
        text: pageText,
        border: pageBorder,
        buttonBg: controlBg,
        buttonText: controlText,
        buttonBorder: controlBorder,
      };
    case 'strong':
      // Emphasized - uses control background for stronger presence
      return {
        bg: controlBg,
        text: controlText,
        border: controlBorder,
        buttonBg: pageBg,
        buttonText: pageText,
        buttonBorder: pageBorder,
      };
    case 'stronger':
      // Very emphasized - even more distinct
      return {
        bg: adjustLightness(controlBg, step),
        text: controlText,
        border: adjustLightness(controlBorder, step),
        buttonBg: pageBg,
        buttonText: pageText,
        buttonBorder: pageBorder,
      };
    case 'inverted':
      // Opposite color scheme
      return {
        bg: isDark ? '#fafafa' : '#0f0f0f',
        text: isDark ? '#171717' : '#e5e5e5',
        border: isDark ? '#e5e5e5' : '#2a2a2a',
        buttonBg: isDark ? '#e5e5e5' : '#2a2a2a',
        buttonText: isDark ? '#171717' : '#e5e5e5',
        buttonBorder: isDark ? '#d4d4d4' : '#404040',
      };
    case 'primary':
      // Branded sections using the primary color
      return {
        bg: tokens['--controlPrimary-bg'],
        text: tokens['--controlPrimary-text'],
        border: tokens['--controlPrimary-bg'],
        buttonBg: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.3)',
        buttonText: tokens['--controlPrimary-text'],
        buttonBorder: 'transparent',
      };
    default:
      return {
        bg: pageBg,
        text: pageText,
        border: pageBorder,
        buttonBg: controlBg,
        buttonText: controlText,
        buttonBorder: controlBorder,
      };
  }
}

export function ThemeDesignerPage() {
  const [config, setConfig] = useState<ThemeConfig>(DEFAULT_CONFIG);
  const [previewMode, setPreviewMode] = useState<'light' | 'dark'>('light');
  const [activeSurface, setActiveSurface] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

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
      id: 'custom-theme',
      name: 'Custom Theme',
      colors: {
        primary: config.primary,
        secondary: config.secondary,
        accent: config.accent,
        neutral: config.neutral,
      },
      config: {
        saturation: config.saturation,
        temperature: config.temperature,
      },
      radii: {
        style: config.radiusStyle,
        scale: config.radiusScale,
      },
      accessibility: {
        level: config.accessibilityLevel,
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'theme.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSS = () => {
    const lightTheme = generateTheme(config, false);
    const darkTheme = generateTheme(config, true);

    let css = '/* Custom Theme - Generated by UI-Kit Theme Designer */\n\n';
    css += '/* Light Mode */\n';
    css += '[data-theme="custom"], [data-theme="custom"][data-mode="light"] {\n';
    for (const [name, value] of Object.entries(lightTheme.tokens)) {
      css += `  ${name}: ${value};\n`;
    }
    css += '}\n\n';
    css += '/* Dark Mode */\n';
    css += '[data-theme="custom"][data-mode="dark"] {\n';
    for (const [name, value] of Object.entries(darkTheme.tokens)) {
      css += `  ${name}: ${value};\n`;
    }
    css += '}\n';

    const blob = new Blob([css], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'theme.css';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get contrast ratio for display
  const getContrastDisplay = (bg: string, text: string) => {
    const ratio = contrastRatio(bg, text);
    const level = ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : ratio >= 3 ? 'AA-large' : 'Fail';
    return { ratio: ratio.toFixed(2), level };
  };

  return (
    <div className={styles.designer}>
      <header className={styles.header}>
        <h1 className={styles.title}>Theme Designer</h1>
        <p className={styles.subtitle}>
          Design custom themes with automatic contrast adjustment. Every surface automatically
          computes text colors to meet WCAG accessibility standards.
        </p>
      </header>

      <div className={styles.layout}>
        {/* Controls Panel */}
        <aside className={styles.controls}>
          {/* Colors Section */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Brand Colors</h2>
            <p className={styles.sectionDesc}>Define your primary palette. Text colors are computed automatically.</p>

            <div className={styles.colorGrid}>
              <ColorInput
                label="Primary"
                value={config.primary}
                onChange={(v) => handleConfigChange('primary', v)}
                description="Main brand color, used for primary buttons and links"
              />
              <ColorInput
                label="Secondary"
                value={config.secondary || ''}
                onChange={(v) => handleConfigChange('secondary', v || undefined)}
                description="Supporting color (auto-derived if empty)"
                placeholder="Auto"
              />
              <ColorInput
                label="Accent"
                value={config.accent || ''}
                onChange={(v) => handleConfigChange('accent', v || undefined)}
                description="Highlight color (auto-derived if empty)"
                placeholder="Auto"
              />
              <ColorInput
                label="Neutral"
                value={config.neutral || ''}
                onChange={(v) => handleConfigChange('neutral', v || undefined)}
                description="Gray base for UI chrome"
                placeholder="Auto"
              />
            </div>
          </section>

          {/* Border Radius Section */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Border Radius</h2>
            <p className={styles.sectionDesc}>Control the roundness of UI elements.</p>

            <div className={styles.radiusControls}>
              <div className={styles.radiusPresets}>
                {(['sharp', 'subtle', 'rounded', 'pill'] as RadiiStyle[]).map((style) => (
                  <button
                    key={style}
                    className={`${styles.radiusPreset} ${config.radiusStyle === style ? styles.radiusPresetActive : ''}`}
                    onClick={() => handleConfigChange('radiusStyle', style)}
                  >
                    <span
                      className={styles.radiusPreview}
                      style={{ borderRadius: style === 'sharp' ? '0' : style === 'subtle' ? '2px' : style === 'rounded' ? '6px' : '12px' }}
                    />
                    <span className={styles.radiusLabel}>{style.charAt(0).toUpperCase() + style.slice(1)}</span>
                  </button>
                ))}
              </div>

              <div className={styles.sliderGroup}>
                <label className={styles.sliderLabel}>
                  Scale
                  <span className={styles.sliderValue}>{config.radiusScale.toFixed(1)}x</span>
                </label>
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
          </section>

          {/* Accessibility Section */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Accessibility</h2>
            <p className={styles.sectionDesc}>Target contrast level for text colors.</p>

            <div className={styles.accessibilityToggle}>
              <button
                className={`${styles.accessibilityOption} ${config.accessibilityLevel === 'AA' ? styles.accessibilityActive : ''}`}
                onClick={() => handleConfigChange('accessibilityLevel', 'AA')}
              >
                <span className={styles.accessibilityLevel}>AA</span>
                <span className={styles.accessibilityRatio}>4.5:1</span>
                <span className={styles.accessibilityDesc}>Standard</span>
              </button>
              <button
                className={`${styles.accessibilityOption} ${config.accessibilityLevel === 'AAA' ? styles.accessibilityActive : ''}`}
                onClick={() => handleConfigChange('accessibilityLevel', 'AAA')}
              >
                <span className={styles.accessibilityLevel}>AAA</span>
                <span className={styles.accessibilityRatio}>7:1</span>
                <span className={styles.accessibilityDesc}>Enhanced</span>
              </button>
            </div>
          </section>

          {/* Export Section */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Export</h2>
            <div className={styles.exportButtons}>
              <button onClick={handleExportJSON} className={styles.exportButton}>
                Export JSON
              </button>
              <button onClick={handleExportCSS} className={styles.exportButtonPrimary}>
                Export CSS
              </button>
            </div>
          </section>
        </aside>

        {/* Preview Panel */}
        <main className={styles.preview}>
          <div className={styles.previewHeader}>
            <span className={styles.previewTitle}>Live Preview</span>
            <div className={styles.modeToggle}>
              <button
                className={`${styles.modeButton} ${previewMode === 'light' ? styles.modeButtonActive : ''}`}
                onClick={() => setPreviewMode('light')}
              >
                Light
              </button>
              <button
                className={`${styles.modeButton} ${previewMode === 'dark' ? styles.modeButtonActive : ''}`}
                onClick={() => setPreviewMode('dark')}
              >
                Dark
              </button>
            </div>
          </div>

          <div
            ref={previewRef}
            className={styles.previewContent}
            style={{ background: generatedTheme.tokens['--page-bg'], color: generatedTheme.tokens['--page-text'] }}
          >
            {/* Buttons Preview */}
            <div className={styles.previewSection}>
              <h3 className={styles.previewSectionTitle}>Buttons</h3>
              <div className={styles.buttonRow}>
                <button
                  className={styles.btnPrimary}
                  style={{
                    background: generatedTheme.tokens['--controlPrimary-bg'],
                    color: generatedTheme.tokens['--controlPrimary-text'],
                    borderRadius: generatedTheme.tokens['--radius-md'],
                  }}
                >
                  Primary
                </button>
                <button
                  className={styles.btnSecondary}
                  style={{
                    background: generatedTheme.tokens['--control-bg'],
                    color: generatedTheme.tokens['--control-text'],
                    border: `1px solid ${generatedTheme.tokens['--control-border']}`,
                    borderRadius: generatedTheme.tokens['--radius-md'],
                  }}
                >
                  Secondary
                </button>
                <button
                  className={styles.btnDanger}
                  style={{
                    background: generatedTheme.tokens['--controlDanger-bg'],
                    color: generatedTheme.tokens['--controlDanger-text'],
                    borderRadius: generatedTheme.tokens['--radius-md'],
                  }}
                >
                  Danger
                </button>
                <button
                  className={styles.btnSubtle}
                  style={{
                    background: 'transparent',
                    color: generatedTheme.tokens['--link'],
                    borderRadius: generatedTheme.tokens['--radius-md'],
                  }}
                >
                  Ghost
                </button>
              </div>
            </div>

            {/* Card Preview */}
            <div className={styles.previewSection}>
              <h3 className={styles.previewSectionTitle}>Card</h3>
              <div
                className={styles.cardPreview}
                style={{
                  background: generatedTheme.tokens['--card-bg'],
                  color: generatedTheme.tokens['--card-text'],
                  border: `1px solid ${generatedTheme.tokens['--card-border']}`,
                  borderRadius: generatedTheme.tokens['--radius-lg'],
                  boxShadow: generatedTheme.tokens['--card-shadow'],
                }}
              >
                <h4 style={{ color: generatedTheme.tokens['--card-text'] }}>Card Title</h4>
                <p style={{ color: generatedTheme.tokens['--card-text-soft'] }}>
                  This is secondary text on a card surface. Notice how the text colors
                  automatically adjust for optimal contrast.
                </p>
              </div>
            </div>

            {/* Inputs Preview */}
            <div className={styles.previewSection}>
              <h3 className={styles.previewSectionTitle}>Form Controls</h3>
              <div className={styles.inputRow}>
                <input
                  type="text"
                  placeholder="Text input"
                  className={styles.inputPreview}
                  style={{
                    background: generatedTheme.tokens['--inset-bg'],
                    color: generatedTheme.tokens['--inset-text'],
                    border: `1px solid ${generatedTheme.tokens['--inset-border']}`,
                    borderRadius: generatedTheme.tokens['--radius-md'],
                  }}
                />
                <select
                  className={styles.selectPreview}
                  style={{
                    background: generatedTheme.tokens['--inset-bg'],
                    color: generatedTheme.tokens['--inset-text'],
                    border: `1px solid ${generatedTheme.tokens['--inset-border']}`,
                    borderRadius: generatedTheme.tokens['--radius-md'],
                  }}
                >
                  <option>Select option</option>
                  <option>Option 1</option>
                  <option>Option 2</option>
                </select>
              </div>
            </div>

            {/* Alerts Preview */}
            <div className={styles.previewSection}>
              <h3 className={styles.previewSectionTitle}>Feedback</h3>
              <div className={styles.alertsGrid}>
                <div
                  className={styles.alertPreview}
                  style={{
                    background: generatedTheme.tokens['--success-bg'],
                    color: generatedTheme.tokens['--success-text'],
                    borderLeft: `4px solid ${generatedTheme.tokens['--success-border']}`,
                    borderRadius: generatedTheme.tokens['--radius-md'],
                  }}
                >
                  Success message
                </div>
                <div
                  className={styles.alertPreview}
                  style={{
                    background: generatedTheme.tokens['--warning-bg'],
                    color: generatedTheme.tokens['--warning-text'],
                    borderLeft: `4px solid ${generatedTheme.tokens['--warning-border']}`,
                    borderRadius: generatedTheme.tokens['--radius-md'],
                  }}
                >
                  Warning message
                </div>
                <div
                  className={styles.alertPreview}
                  style={{
                    background: generatedTheme.tokens['--danger-bg'],
                    color: generatedTheme.tokens['--danger-text'],
                    borderLeft: `4px solid ${generatedTheme.tokens['--danger-border']}`,
                    borderRadius: generatedTheme.tokens['--radius-md'],
                  }}
                >
                  Error message
                </div>
                <div
                  className={styles.alertPreview}
                  style={{
                    background: generatedTheme.tokens['--info-bg'],
                    color: generatedTheme.tokens['--info-text'],
                    borderLeft: `4px solid ${generatedTheme.tokens['--info-border']}`,
                    borderRadius: generatedTheme.tokens['--radius-md'],
                  }}
                >
                  Info message
                </div>
              </div>
            </div>

            {/* Tonal Surfaces Preview */}
            <div className={styles.previewSection}>
              <h3 className={styles.previewSectionTitle}>Tonal Surfaces</h3>
              <p className={styles.previewSectionDesc}>
                Use <code>.surface.&#123;name&#125;</code> classes to create distinct visual contexts.
                Components inside adapt automatically.
              </p>
              <div className={styles.surfacesGrid}>
                {TONAL_SURFACES.map(({ name, label, description }) => {
                  const surfaceTokens = getSurfaceTokenMapping(name, generatedTheme.tokens, previewMode === 'dark');
                  return (
                    <div
                      key={name}
                      className={styles.surfacePreview}
                      style={{
                        background: surfaceTokens.bg,
                        color: surfaceTokens.text,
                        borderColor: surfaceTokens.border,
                        borderRadius: generatedTheme.tokens['--radius-lg'],
                      }}
                    >
                      <span className={styles.surfacePreviewLabel}>{label}</span>
                      <span className={styles.surfacePreviewDesc} style={{ color: surfaceTokens.text, opacity: 0.7 }}>{description}</span>
                      <button
                        className={styles.surfacePreviewButton}
                        style={{
                          background: surfaceTokens.buttonBg,
                          color: surfaceTokens.buttonText,
                          borderColor: surfaceTokens.buttonBorder,
                          borderRadius: generatedTheme.tokens['--radius-md'],
                        }}
                      >
                        Button
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </main>

        {/* Surface Inspector */}
        <aside className={styles.inspector}>
          <h2 className={styles.inspectorTitle}>Surface Inspector</h2>
          <p className={styles.inspectorDesc}>Click a surface to view its computed CSS variables.</p>

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
                    <div
                      className={styles.surfaceSwatch}
                      style={{ background: bgColor, color: textColor, borderRadius: generatedTheme.tokens['--radius-sm'] }}
                    >
                      Aa
                    </div>
                    <div className={styles.surfaceInfo}>
                      <span className={styles.surfaceName}>{info.label}</span>
                      <span className={styles.surfaceDesc}>{info.description}</span>
                    </div>
                    <div className={styles.surfaceContrast}>
                      <span className={`${styles.contrastLevel} ${styles[`contrast${contrast.level.replace('-', '')}`]}`}>
                        {contrast.level}
                      </span>
                      <span className={styles.contrastRatio}>{contrast.ratio}:1</span>
                    </div>
                  </button>

                  {isActive && (
                    <div className={styles.tokenList}>
                      {Object.entries(surface).map(([prop, value]) => {
                        if (value === undefined) return null;
                        const tokenName = `--${key}-${prop}`;
                        return (
                          <button
                            key={prop}
                            className={`${styles.tokenItem} ${copiedToken === tokenName ? styles.tokenCopied : ''}`}
                            onClick={() => handleCopyToken(tokenName, value)}
                          >
                            <code className={styles.tokenName}>{tokenName}</code>
                            <span className={styles.tokenValue}>
                              {value.startsWith('#') || value.startsWith('rgb') ? (
                                <>
                                  <span className={styles.tokenSwatch} style={{ background: value }} />
                                  {value}
                                </>
                              ) : (
                                value
                              )}
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
        </aside>
      </div>
    </div>
  );
}

// Color Input Component
function ColorInput({
  label,
  value,
  onChange,
  description,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description: string;
  placeholder?: string;
}) {
  return (
    <div className={styles.colorInput}>
      <div className={styles.colorInputHeader}>
        <label className={styles.colorInputLabel}>{label}</label>
        <span className={styles.colorInputDesc}>{description}</span>
      </div>
      <div className={styles.colorInputControls}>
        <input
          type="color"
          value={value || '#666666'}
          onChange={(e) => onChange(e.target.value)}
          className={styles.colorPicker}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={styles.colorHex}
        />
      </div>
    </div>
  );
}
