/**
 * Typography tokens
 */

// Font families
export const fontFamilyTokens = {
  '--font-sans': "'Segoe UI Web', 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', sans-serif",
  '--font-mono': "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
  '--font-serif': "'Merriweather', Georgia, 'Times New Roman', serif",
} as const;

// Font sizes
export const fontSizeTokens = {
  '--text-xs': '11px',
  '--text-sm': '13px',
  '--text-base': '15px',
  '--text-lg': '17px',
  '--text-xl': '20px',
  '--text-2xl': '24px',
  '--text-3xl': '30px',
  '--text-4xl': '36px',
} as const;

// Font weights
export const fontWeightTokens = {
  '--weight-normal': '400',
  '--weight-medium': '500',
  '--weight-semibold': '600',
  '--weight-bold': '700',
} as const;

// Line heights
export const lineHeightTokens = {
  '--leading-tight': '1.25',
  '--leading-normal': '1.5',
  '--leading-loose': '1.75',
} as const;

export const typographyTokens = {
  ...fontFamilyTokens,
  ...fontSizeTokens,
  ...fontWeightTokens,
  ...lineHeightTokens,
} as const;

export type FontFamilyToken = keyof typeof fontFamilyTokens;
export type FontSizeToken = keyof typeof fontSizeTokens;
export type FontWeightToken = keyof typeof fontWeightTokens;
export type LineHeightToken = keyof typeof lineHeightTokens;
export type TypographyToken = keyof typeof typographyTokens;

/** Typography tokens type for custom generation */
export type TypographyTokenValues = Record<TypographyToken, string>;

/**
 * Generate typography tokens with custom options
 */
export function generateTypographyTokens(options: {
  fontSans?: string;
  fontMono?: string;
  fontSerif?: string;
  baseSize?: number;
  scale?: number;
} = {}): TypographyTokenValues {
  const {
    fontSans = fontFamilyTokens['--font-sans'],
    fontMono = fontFamilyTokens['--font-mono'],
    fontSerif = fontFamilyTokens['--font-serif'],
    baseSize = 15,
    scale = 1.0,
  } = options;

  // Base sizes at scale 1.0 with base 15px
  const baseSizes: Record<FontSizeToken, number> = {
    '--text-xs': 11,
    '--text-sm': 13,
    '--text-base': 15,
    '--text-lg': 17,
    '--text-xl': 20,
    '--text-2xl': 24,
    '--text-3xl': 30,
    '--text-4xl': 36,
  };

  // Calculate ratio from custom base size
  const ratio = baseSize / 15;

  const scaledSizes = Object.fromEntries(
    Object.entries(baseSizes).map(([token, size]) => [
      token,
      `${Math.round(size * ratio * scale)}px`,
    ])
  ) as Record<FontSizeToken, string>;

  return {
    '--font-sans': fontSans,
    '--font-mono': fontMono,
    '--font-serif': fontSerif,
    ...scaledSizes,
    '--weight-normal': fontWeightTokens['--weight-normal'],
    '--weight-medium': fontWeightTokens['--weight-medium'],
    '--weight-semibold': fontWeightTokens['--weight-semibold'],
    '--weight-bold': fontWeightTokens['--weight-bold'],
    '--leading-tight': lineHeightTokens['--leading-tight'],
    '--leading-normal': lineHeightTokens['--leading-normal'],
    '--leading-loose': lineHeightTokens['--leading-loose'],
  };
}
