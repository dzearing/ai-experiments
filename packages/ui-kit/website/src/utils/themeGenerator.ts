/**
 * Theme generator utilities for browser-side token computation
 *
 * This mirrors the core theme generator but runs in the browser for the Theme Designer.
 */

// ============ Color Utilities ============

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(n)));
    return clamped.toString(16).padStart(2, '0');
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360;
  s /= 100;
  l /= 100;

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

export function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function contrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return 0;

  const l1 = relativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = relativeLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

export function lighten(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.l = Math.min(100, hsl.l + amount);

  const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
}

export function darken(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.l = Math.max(0, hsl.l - amount);

  const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
}

export function mix(color1: string, color2: string, weight = 0.5): string {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return color1;

  const w = Math.max(0, Math.min(1, weight));
  const r = Math.round(rgb1.r * (1 - w) + rgb2.r * w);
  const g = Math.round(rgb1.g * (1 - w) + rgb2.g * w);
  const b = Math.round(rgb1.b * (1 - w) + rgb2.b * w);

  return rgbToHex(r, g, b);
}

export function getContrastingTextColor(bgColor: string): '#000000' | '#ffffff' {
  const rgb = hexToRgb(bgColor);
  if (!rgb) return '#000000';

  const luminance = relativeLuminance(rgb.r, rgb.g, rgb.b);
  return luminance > 0.179 ? '#000000' : '#ffffff';
}

export function ensureContrast(
  foreground: string,
  background: string,
  targetRatio = 4.5
): string {
  const currentRatio = contrastRatio(foreground, background);
  if (currentRatio >= targetRatio) return foreground;

  const bgRgb = hexToRgb(background);
  if (!bgRgb) return foreground;

  const bgLuminance = relativeLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
  const isLightBackground = bgLuminance > 0.179;

  let adjusted = foreground;
  for (let i = 0; i < 100; i += 5) {
    adjusted = isLightBackground ? darken(foreground, i) : lighten(foreground, i);
    if (contrastRatio(adjusted, background) >= targetRatio) {
      return adjusted;
    }
  }

  return isLightBackground ? '#000000' : '#ffffff';
}

function shiftHue(hex: string, degrees: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.h = (hsl.h + degrees) % 360;
  if (hsl.h < 0) hsl.h += 360;
  const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
}

function desaturate(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.s = Math.max(0, hsl.s - amount);
  const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
}

function adjustSaturation(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.s = Math.max(0, Math.min(100, hsl.s + amount));
  const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
}

function adjustTemperature(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const factor = amount / 100;
  const r = Math.min(255, Math.max(0, rgb.r + factor * 20));
  const b = Math.min(255, Math.max(0, rgb.b - factor * 20));
  return rgbToHex(r, rgb.g, b);
}

// ============ Theme Types ============

export type RadiiStyle = 'sharp' | 'subtle' | 'rounded' | 'pill';
export type AccessibilityLevel = 'AA' | 'AAA';

export interface ThemeConfig {
  // Colors
  primary: string;
  secondary?: string;
  accent?: string;
  neutral?: string;

  // Adjustments
  saturation: number;
  temperature: number;

  // Radii
  radiusScale: number;
  radiusStyle: RadiiStyle;

  // Accessibility
  accessibilityLevel: AccessibilityLevel;
}

export interface SurfaceTokens {
  bg: string;
  'bg-hover'?: string;
  'bg-pressed'?: string;
  'bg-focus'?: string;
  text: string;
  'text-soft'?: string;
  'text-softer'?: string;
  'text-strong'?: string;
  'text-stronger'?: string;
  'text-hover'?: string;
  'text-pressed'?: string;
  border: string;
  'border-soft'?: string;
  'border-strong'?: string;
  'border-stronger'?: string;
  'border-hover'?: string;
  'border-pressed'?: string;
  'border-focus'?: string;
  shadow?: string;
  icon?: string;
}

export interface GeneratedTheme {
  tokens: Record<string, string>;
  surfaces: {
    page: SurfaceTokens;
    card: SurfaceTokens;
    overlay: SurfaceTokens;
    popout: SurfaceTokens;
    inset: SurfaceTokens;
    control: SurfaceTokens;
    controlPrimary: SurfaceTokens;
    controlDanger: SurfaceTokens;
    controlSubtle: SurfaceTokens;
    controlDisabled: SurfaceTokens;
    success: SurfaceTokens;
    warning: SurfaceTokens;
    danger: SurfaceTokens;
    info: SurfaceTokens;
  };
}

// ============ Theme Generation ============

interface ProcessedColors {
  primary: string;
  secondary: string;
  accent: string;
  neutral: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
}

function processColors(config: ThemeConfig): ProcessedColors {
  const { saturation = 0, temperature = 0 } = config;

  let primary = config.primary;
  let secondary = config.secondary || shiftHue(primary, 30);
  let accent = config.accent || shiftHue(primary, 180);
  let neutral = config.neutral || desaturate(primary, 80);

  if (saturation !== 0) {
    primary = adjustSaturation(primary, saturation);
    secondary = adjustSaturation(secondary, saturation);
    accent = adjustSaturation(accent, saturation);
  }

  if (temperature !== 0) {
    primary = adjustTemperature(primary, temperature);
    secondary = adjustTemperature(secondary, temperature);
    accent = adjustTemperature(accent, temperature);
    neutral = adjustTemperature(neutral, temperature);
  }

  return {
    primary,
    secondary,
    accent,
    neutral,
    success: '#16a34a',
    warning: '#f59e0b',
    danger: '#dc2626',
    info: primary,
  };
}

function generateRadii(style: RadiiStyle, scale: number): Record<string, string> {
  const styleBaseValues: Record<RadiiStyle, number> = {
    sharp: 0,
    subtle: 2,
    rounded: 4,
    pill: 8,
  };

  const baseValue = styleBaseValues[style];
  const multipliers = {
    '--radius-sm': 0.5,
    '--radius-md': 1,
    '--radius-lg': 2,
    '--radius-xl': 3,
    '--radius-2xl': 4,
    '--radius-full': 9999,
  };

  return Object.fromEntries(
    Object.entries(multipliers).map(([token, multiplier]) => {
      if (token === '--radius-full') {
        return [token, '9999px'];
      }
      const value = Math.round(baseValue * multiplier * scale);
      return [token, `${value}px`];
    })
  );
}

export function generateTheme(config: ThemeConfig, isDark: boolean): GeneratedTheme {
  const colors = processColors(config);
  const contrastLevel = config.accessibilityLevel === 'AAA' ? 7 : 4.5;
  const tokens: Record<string, string> = {};

  // Generate radii
  const radii = generateRadii(config.radiusStyle, config.radiusScale);
  Object.assign(tokens, radii);

  // Page surface
  const pageBg = isDark ? '#0f0f0f' : '#fafafa';
  const pageText = ensureContrast(isDark ? '#e5e5e5' : '#171717', pageBg, contrastLevel);
  const pageBorder = isDark ? '#2a2a2a' : '#e5e5e5';
  const pageSurface: SurfaceTokens = {
    bg: pageBg,
    text: pageText,
    'text-soft': mix(pageText, pageBg, 0.3),
    'text-softer': mix(pageText, pageBg, 0.5),
    'text-strong': mix(pageText, isDark ? '#ffffff' : '#000000', 0.3),
    'text-stronger': isDark ? '#ffffff' : '#000000',
    border: pageBorder,
    'border-soft': mix(pageBorder, pageBg, 0.4),
    'border-strong': isDark ? lighten(pageBorder, 20) : darken(pageBorder, 20),
    'border-stronger': mix(pageBorder, isDark ? '#ffffff' : '#000000', 0.5),
    shadow: 'none',
  };

  // Card surface
  const cardBg = isDark ? '#1a1a1a' : '#ffffff';
  const cardText = ensureContrast(pageText, cardBg, contrastLevel);
  const cardBorder = isDark ? '#333333' : '#e5e5e5';
  const cardSurface: SurfaceTokens = {
    bg: cardBg,
    text: cardText,
    'text-soft': mix(cardText, cardBg, 0.3),
    'text-strong': mix(cardText, isDark ? '#ffffff' : '#000000', 0.3),
    'text-stronger': isDark ? '#ffffff' : '#000000',
    border: cardBorder,
    'border-soft': mix(cardBorder, cardBg, 0.4),
    'border-strong': isDark ? lighten(cardBorder, 20) : darken(cardBorder, 20),
    'border-stronger': mix(cardBorder, isDark ? '#ffffff' : '#000000', 0.5),
    shadow: isDark
      ? '0 4px 6px -1px rgba(0, 0, 0, 0.4)'
      : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  };

  // Overlay surface
  const overlayBg = isDark ? '#1f1f1f' : '#ffffff';
  const overlayText = ensureContrast(pageText, overlayBg, contrastLevel);
  const overlayBorder = isDark ? '#3a3a3a' : '#e5e5e5';
  const overlaySurface: SurfaceTokens = {
    bg: overlayBg,
    text: overlayText,
    'text-soft': mix(overlayText, overlayBg, 0.3),
    'text-strong': mix(overlayText, isDark ? '#ffffff' : '#000000', 0.3),
    'text-stronger': isDark ? '#ffffff' : '#000000',
    border: overlayBorder,
    'border-soft': mix(overlayBorder, overlayBg, 0.4),
    'border-strong': isDark ? lighten(overlayBorder, 20) : darken(overlayBorder, 20),
    'border-stronger': mix(overlayBorder, isDark ? '#ffffff' : '#000000', 0.5),
    shadow: isDark
      ? '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
      : '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  };

  // Popout surface
  const popoutBg = isDark ? '#262626' : '#ffffff';
  const popoutText = ensureContrast(pageText, popoutBg, contrastLevel);
  const popoutBorder = isDark ? '#404040' : '#e5e5e5';
  const popoutSurface: SurfaceTokens = {
    bg: popoutBg,
    text: popoutText,
    'text-soft': mix(popoutText, popoutBg, 0.3),
    'text-strong': mix(popoutText, isDark ? '#ffffff' : '#000000', 0.3),
    'text-stronger': isDark ? '#ffffff' : '#000000',
    border: popoutBorder,
    'border-soft': mix(popoutBorder, popoutBg, 0.4),
    'border-strong': isDark ? lighten(popoutBorder, 20) : darken(popoutBorder, 20),
    'border-stronger': mix(popoutBorder, isDark ? '#ffffff' : '#000000', 0.5),
    shadow: isDark
      ? '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
      : '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  };

  // Inset surface
  const insetBg = isDark ? '#0a0a0a' : '#f5f5f5';
  const insetText = ensureContrast(pageText, insetBg, contrastLevel);
  const insetSurface: SurfaceTokens = {
    bg: insetBg,
    'bg-hover': isDark ? '#141414' : '#eeeeee',
    'bg-focus': isDark ? '#141414' : '#ffffff',
    text: insetText,
    'text-soft': mix(insetText, insetBg, 0.4),
    border: isDark ? '#333333' : '#d4d4d4',
    'border-focus': colors.primary,
  };

  // Control surface
  const controlBg = isDark ? '#2a2a2a' : '#f0f0f0';
  const controlText = ensureContrast(pageText, controlBg, contrastLevel);
  const controlSurface: SurfaceTokens = {
    bg: controlBg,
    'bg-hover': isDark ? '#333333' : '#e5e5e5',
    'bg-pressed': isDark ? '#404040' : '#d4d4d4',
    text: controlText,
    'text-hover': controlText,
    'text-pressed': controlText,
    border: isDark ? '#404040' : '#d4d4d4',
    'border-hover': isDark ? '#525252' : '#a3a3a3',
    'border-pressed': isDark ? '#525252' : '#a3a3a3',
    shadow: 'none',
  };

  // Control Primary surface - THIS IS THE KEY PART
  const primaryBg = colors.primary;
  const primaryText = getContrastingTextColor(primaryBg);
  const controlPrimarySurface: SurfaceTokens = {
    bg: primaryBg,
    'bg-hover': isDark ? lighten(primaryBg, 8) : darken(primaryBg, 8),
    'bg-pressed': isDark ? lighten(primaryBg, 12) : darken(primaryBg, 12),
    text: primaryText,
    'text-hover': primaryText,
    'text-pressed': primaryText,
    border: 'transparent',
    shadow: 'none',
  };

  // Control Danger surface
  const dangerBg = colors.danger;
  const dangerText = getContrastingTextColor(dangerBg);
  const controlDangerSurface: SurfaceTokens = {
    bg: dangerBg,
    'bg-hover': isDark ? lighten(dangerBg, 8) : darken(dangerBg, 8),
    'bg-pressed': isDark ? lighten(dangerBg, 12) : darken(dangerBg, 12),
    text: dangerText,
    'text-hover': dangerText,
    'text-pressed': dangerText,
    border: 'transparent',
    shadow: 'none',
  };

  // Control Subtle surface
  const controlSubtleSurface: SurfaceTokens = {
    bg: 'transparent',
    'bg-hover': isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
    'bg-pressed': isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
    text: mix(pageText, pageBg, 0.2),
    'text-hover': pageText,
    'text-pressed': pageText,
    border: 'transparent',
  };

  // Control Disabled surface
  const controlDisabledSurface: SurfaceTokens = {
    bg: isDark ? '#1f1f1f' : '#f5f5f5',
    text: isDark ? '#525252' : '#a3a3a3',
    border: isDark ? '#2a2a2a' : '#e5e5e5',
  };

  // Feedback surfaces
  const createFeedbackSurface = (color: string): SurfaceTokens => {
    const bg = isDark ? mix(color, '#000000', 0.85) : mix(color, '#ffffff', 0.9);
    const text = ensureContrast(isDark ? lighten(color, 30) : darken(color, 30), bg, contrastLevel);
    return {
      bg,
      text,
      'text-soft': mix(text, bg, 0.3),
      border: isDark ? lighten(color, 20) : darken(color, 10),
      icon: color,
    };
  };

  const successSurface = createFeedbackSurface(colors.success);
  const warningSurface = createFeedbackSurface(colors.warning);
  const dangerSurface = createFeedbackSurface(colors.danger);
  const infoSurface = createFeedbackSurface(colors.info);

  // Build tokens object
  const surfaces = {
    page: pageSurface,
    card: cardSurface,
    overlay: overlaySurface,
    popout: popoutSurface,
    inset: insetSurface,
    control: controlSurface,
    controlPrimary: controlPrimarySurface,
    controlDanger: controlDangerSurface,
    controlSubtle: controlSubtleSurface,
    controlDisabled: controlDisabledSurface,
    success: successSurface,
    warning: warningSurface,
    danger: dangerSurface,
    info: infoSurface,
  };

  // Flatten surfaces to tokens
  for (const [surfaceName, surface] of Object.entries(surfaces)) {
    for (const [prop, value] of Object.entries(surface)) {
      if (value !== undefined) {
        tokens[`--${surfaceName}-${prop}`] = value;
      }
    }
  }

  // Special tokens
  tokens['--focus-ring'] = colors.primary;
  tokens['--focus-ring-offset'] = '2px';
  tokens['--focus-ring-width'] = '2px';
  tokens['--selection-bg'] = mix(colors.primary, isDark ? '#000000' : '#ffffff', 0.7);
  tokens['--selection-text'] = isDark ? '#ffffff' : '#000000';
  tokens['--link'] = colors.primary;
  tokens['--link-hover'] = isDark ? lighten(colors.primary, 10) : darken(colors.primary, 10);

  // Store processed colors for display
  tokens['--color-primary'] = colors.primary;
  tokens['--color-secondary'] = colors.secondary;
  tokens['--color-accent'] = colors.accent;
  tokens['--color-neutral'] = colors.neutral;

  return { tokens, surfaces };
}

/**
 * Apply tokens to an element as CSS custom properties
 */
export function applyTokensToElement(element: HTMLElement, tokens: Record<string, string>) {
  for (const [name, value] of Object.entries(tokens)) {
    element.style.setProperty(name, value);
  }
}

/**
 * Generate CSS text from tokens
 */
export function generateCSSFromTokens(tokens: Record<string, string>, selector: string): string {
  const lines = [`${selector} {`];
  for (const [name, value] of Object.entries(tokens)) {
    lines.push(`  ${name}: ${value};`);
  }
  lines.push('}');
  return lines.join('\n');
}
