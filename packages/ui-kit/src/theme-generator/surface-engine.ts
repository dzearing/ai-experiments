/**
 * Surface-based token generation engine
 *
 * Generates complete token sets for each surface based on
 * surface definitions and color computations.
 */

import {
  parseColor,
  mix,
  lighten,
  darken,
  saturate,
  adjustTemperature,
} from './utilities/index.js';
import { generateTextColor, meetsContrast } from './accessibility.js';
import type { WCAGLevel, TextSize } from './accessibility.js';
import type {
  SurfaceDefinition,
  ColorComputation,
  ColorFunction,
  SurfaceTokens,
  GeneratedTheme,
  ThemeDefinition,
  ContrastFunctionArgs,
  MixFunctionArgs,
  AdjustFunctionArgs,
  AutoFunctionArgs,
  ColorScale,
  StateModifier,
} from '../themes/theme-types.js';

/**
 * Token resolution context
 */
interface ResolutionContext {
  theme: ThemeDefinition;
  mode: 'light' | 'dark';
  colors: GeneratedTheme['colors'];
  surfaces: Map<string, SurfaceTokens>;
  backgroundLevels: Record<string, { light: string; dark: string }>;
  currentSurface?: {
    name: string;
    tokens: Partial<SurfaceTokens>;
  };
  adjustments?: Array<{
    surface: string;
    token: string;
    original: string;
    adjusted: string;
    reason: string;
  }>;
}

/**
 * Generate tokens for all surfaces
 */
export function generateSurfaceTokens(
  surfaces: SurfaceDefinition[],
  theme: ThemeDefinition,
  mode: 'light' | 'dark',
  colors: GeneratedTheme['colors'],
  backgroundLevels: Record<string, { light: string; dark: string }>
): Record<string, SurfaceTokens> {
  const context: ResolutionContext = {
    theme,
    mode,
    colors,
    surfaces: new Map(),
    backgroundLevels,
  };

  // Process surfaces in order (they can reference each other)
  for (const surface of surfaces) {
    const tokens = generateSurfaceTokenSet(surface, context);
    context.surfaces.set(surface.name, tokens);
  }

  return Object.fromEntries(context.surfaces);
}

/**
 * Generate complete token set for a surface
 */
function generateSurfaceTokenSet(
  surface: SurfaceDefinition,
  context: ResolutionContext
): SurfaceTokens {
  const tokens: SurfaceTokens = {} as SurfaceTokens;

  // Set current surface context for self-references
  const contextWithCurrent = {
    ...context,
    currentSurface: {
      name: surface.name,
      tokens: tokens
    }
  };

  // Generate base tokens
  tokens.background = resolveColor(surface.base.background, contextWithCurrent);
  
  // Generate text with contrast validation
  const rawText = resolveColor(surface.base.text, contextWithCurrent);
  tokens.text = validateAndAdjustContrast(
    rawText,
    tokens.background,
    context.theme.accessibility.targetLevel || 'AA',
    'normal',
    surface.name,
    'text',
    contextWithCurrent
  );
  
  tokens.border = resolveColor(surface.base.border, contextWithCurrent);

  if (surface.base.link) {
    const rawLink = resolveColor(surface.base.link, contextWithCurrent);
    tokens.link = validateAndAdjustContrast(
      rawLink,
      tokens.background,
      context.theme.accessibility.targetLevel || 'AA',
      'normal',
      surface.name,
      'link',
      contextWithCurrent
    );
  }

  if (surface.base.icon) {
    const rawIcon = resolveColor(surface.base.icon, contextWithCurrent);
    tokens.icon = validateAndAdjustContrast(
      rawIcon,
      tokens.background,
      context.theme.accessibility.targetLevel || 'AA',
      'ui',
      surface.name,
      'icon',
      contextWithCurrent
    );
  }

  // linkVisited defaults to link if not explicitly defined
  if (surface.base.link) {
    if (surface.base.linkVisited) {
      const rawLinkVisited = resolveColor(surface.base.linkVisited, contextWithCurrent);
      tokens.linkVisited = validateAndAdjustContrast(
        rawLinkVisited,
        tokens.background,
        context.theme.accessibility.targetLevel || 'AA',
        'normal',
        surface.name,
        'linkVisited',
        contextWithCurrent
      );
    } else {
      // Default linkVisited to the same as link
      tokens.linkVisited = tokens.link;
    }
  }

  if (surface.base.shadow) {
    tokens.shadow = surface.base.shadow;
  }

  // Generate semantic text tokens
  if (surface.base.textSuccess) {
    const rawTextSuccess = resolveColor(surface.base.textSuccess, contextWithCurrent);
    tokens.textSuccess = validateAndAdjustContrast(
      rawTextSuccess,
      tokens.background,
      context.theme.accessibility.targetLevel || 'AA',
      'normal',
      surface.name,
      'textSuccess',
      contextWithCurrent
    );
  }

  if (surface.base.textWarning) {
    const rawTextWarning = resolveColor(surface.base.textWarning, contextWithCurrent);
    tokens.textWarning = validateAndAdjustContrast(
      rawTextWarning,
      tokens.background,
      context.theme.accessibility.targetLevel || 'AA',
      'normal',
      surface.name,
      'textWarning',
      contextWithCurrent
    );
  }

  if (surface.base.textDanger) {
    const rawTextDanger = resolveColor(surface.base.textDanger, contextWithCurrent);
    tokens.textDanger = validateAndAdjustContrast(
      rawTextDanger,
      tokens.background,
      context.theme.accessibility.targetLevel || 'AA',
      'normal',
      surface.name,
      'textDanger',
      contextWithCurrent
    );
  }

  if (surface.base.outline) {
    const rawOutline = resolveColor(surface.base.outline, contextWithCurrent);
    tokens.outline = validateAndAdjustContrast(
      rawOutline,
      tokens.background,
      context.theme.accessibility.targetLevel || 'AA',
      'ui',
      surface.name,
      'outline',
      contextWithCurrent
    );
  }

  // Generate variants
  if (surface.variants) {
    generateVariants(tokens, surface.variants, contextWithCurrent);
  }

  // Generate state variations
  if (surface.states) {
    generateStates(tokens, surface.states, surface.name, contextWithCurrent);
  }

  // Generate additional common variations
  generateCommonVariations(tokens, surface, contextWithCurrent);

  return tokens;
}

/**
 * Resolve a color computation to a hex value
 */
function resolveColor(computation: ColorComputation, context: ResolutionContext): string {
  // Direct color string
  if (typeof computation === 'string') {
    if (computation === 'transparent') {
      return 'transparent';
    }
    return computation.startsWith('#') ? computation : resolveColorReference(computation, context);
  }

  // Color reference
  if ('ref' in computation) {
    return resolveColorReference(computation.ref, context);
  }

  // Color function
  if ('fn' in computation) {
    return resolveColorFunction(computation, context);
  }

  throw new Error(`Invalid color computation: ${JSON.stringify(computation)}`);
}

/**
 * Resolve a color reference (e.g., "primary.500", "body.text")
 */
function resolveColorReference(ref: string, context: ResolutionContext): string {
  const parts = ref.split('.');

  // Handle surface references (e.g., "surface.0")
  if (parts[0] === 'surface' && parts[1]) {
    const level = parts[1];
    const levelColors = context.backgroundLevels[level];
    if (levelColors) {
      return context.mode === 'light' ? levelColors.light : levelColors.dark;
    }
  }

  // Handle color scale references (e.g., "primary.500")
  if (parts.length === 2) {
    const [colorName, shade] = parts;
    const colorScale = context.colors[colorName as keyof typeof context.colors];
    if (colorScale && shade && shade in colorScale) {
      return colorScale[shade as unknown as keyof ColorScale];
    }
  }

  // Handle surface token references (e.g., "body.text")
  if (parts.length >= 2) {
    const [surfaceName, ...tokenPath] = parts;
    if (surfaceName) {
      // Check if this is a self-reference to the current surface being generated
      if (context.currentSurface && surfaceName === context.currentSurface.name) {
        const tokenName = tokenPath.join('.');
        const value = context.currentSurface.tokens[tokenName as keyof SurfaceTokens];
        if (typeof value === 'string') {
          return value;
        }
      }
      
      // Otherwise, look in already-generated surfaces
      const surface = context.surfaces.get(surfaceName);
      if (surface && tokenPath.length > 0) {
        const tokenName = tokenPath.join('.');
        const value = surface[tokenName as keyof SurfaceTokens];
        if (typeof value === 'string') {
          return value;
        }
      }
    }
  }

  console.warn(`Could not resolve color reference: ${ref}`);
  return '#000000';
}

/**
 * Resolve a color function
 */
function resolveColorFunction(fn: ColorFunction, context: ResolutionContext): string {
  switch (fn.fn) {
    case 'contrast':
      return resolveContrastFunction(fn.args as ContrastFunctionArgs, context);

    case 'mix':
      return resolveMixFunction(fn.args as MixFunctionArgs, context);

    case 'adjust':
      return resolveAdjustFunction(fn.args as AdjustFunctionArgs, context);

    case 'auto':
      return resolveAutoFunction(fn.args as AutoFunctionArgs, context);

    default:
      throw new Error(`Unknown color function: ${fn.fn}`);
  }
}

/**
 * Resolve contrast function - generates accessible text color
 */
function resolveContrastFunction(args: ContrastFunctionArgs, context: ResolutionContext): string {
  const background = resolveColor(args.against, context);
  const targetLevel = args.target || context.theme.accessibility.targetLevel;
  const textSize = args.textSize || 'normal';

  // Try preferred color first
  if (args.prefer) {
    let preferred: string;
    if (typeof args.prefer === 'string') {
      preferred =
        args.prefer.startsWith('#') ||
        args.prefer.startsWith('rgba') ||
        args.prefer === 'transparent'
          ? args.prefer
          : resolveColorReference(args.prefer, context);
    } else if ('ref' in args.prefer) {
      preferred = resolveColorReference(args.prefer.ref, context);
    } else {
      preferred = '#000000';
    }
    return generateTextColor(background, preferred, targetLevel, textSize);
  }

  // Generate appropriate text color
  return generateTextColor(background, '#000000', targetLevel, textSize);
}

/**
 * Resolve mix function
 */
function resolveMixFunction(args: MixFunctionArgs, context: ResolutionContext): string {
  let color1: string;
  let color2: string;

  // Resolve color1
  if (typeof args.color1 === 'string') {
    color1 =
      args.color1.startsWith('#') || args.color1.startsWith('rgba') || args.color1 === 'transparent'
        ? args.color1
        : resolveColorReference(args.color1, context);
  } else if ('ref' in args.color1) {
    color1 = resolveColorReference(args.color1.ref, context);
  } else {
    throw new Error(`Invalid color1 in mix function: ${JSON.stringify(args.color1)}`);
  }

  // Resolve color2
  if (typeof args.color2 === 'string') {
    color2 =
      args.color2.startsWith('#') || args.color2.startsWith('rgba') || args.color2 === 'transparent'
        ? args.color2
        : resolveColorReference(args.color2, context);
  } else if ('ref' in args.color2) {
    color2 = resolveColorReference(args.color2.ref, context);
  } else {
    throw new Error(`Invalid color2 in mix function: ${JSON.stringify(args.color2)}`);
  }

  return mix(color1, color2, args.ratio);
}

/**
 * Resolve adjust function
 */
function resolveAdjustFunction(args: AdjustFunctionArgs, context: ResolutionContext): string {
  let color: string;

  // Resolve the base color
  if (typeof args.color === 'string') {
    color =
      args.color.startsWith('#') || args.color.startsWith('rgba') || args.color === 'transparent'
        ? args.color
        : resolveColorReference(args.color, context);
  } else if ('ref' in args.color) {
    color = resolveColorReference(args.color.ref, context);
  } else {
    throw new Error(`Invalid color in adjust function: ${JSON.stringify(args.color)}`);
  }

  // Apply lightness adjustment
  if (args.lightness !== undefined) {
    const amount =
      typeof args.lightness === 'number'
        ? args.lightness
        : context.mode === 'light'
          ? args.lightness.light
          : args.lightness.dark;

    color = amount > 0 ? lighten(color, amount) : darken(color, Math.abs(amount));
  }

  // Apply saturation adjustment
  if (args.saturation !== undefined) {
    const amount =
      typeof args.saturation === 'number'
        ? args.saturation
        : context.mode === 'light'
          ? args.saturation.light
          : args.saturation.dark;

    color = saturate(color, amount);
  }

  // Apply hue adjustment (temperature)
  if (args.hue !== undefined) {
    color = adjustTemperature(color, args.hue / 3.6); // Convert 0-360 to 0-100
  }

  return color;
}

/**
 * Resolve auto function - different values for light/dark
 */
function resolveAutoFunction(args: AutoFunctionArgs, context: ResolutionContext): string {
  const value = context.mode === 'light' ? args.light : args.dark;

  if (typeof value === 'string') {
    return value.startsWith('#') || value.startsWith('rgba') || value === 'transparent'
      ? value
      : resolveColorReference(value, context);
  }

  // Handle ColorReference
  if ('ref' in value) {
    return resolveColorReference(value.ref, context);
  }

  // Handle ColorFunction
  if ('fn' in value) {
    return resolveColorFunction(value, context);
  }

  throw new Error(`Invalid auto function value: ${JSON.stringify(value)}`);
}

/**
 * Generate soft/hard variants
 */
function generateVariants(
  tokens: SurfaceTokens,
  variants: SurfaceDefinition['variants'],
  context: ResolutionContext
): void {
  // Soft variants (reduced contrast)
  if (variants?.soft) {
    for (const percentage of variants.soft) {
      // Text soft variants - ensure minimum contrast
      if (tokens.text) {
        const key = `textSoft${percentage}` as keyof SurfaceTokens;
        // Mix the text with background
        const mixedColor = mix(tokens.text, tokens.background, percentage / 100);
        
        // For soft30 and above, ensure AA compliance (4.5:1)
        // For lower percentages, allow lower contrast but ensure readability
        // For themes targeting AAA, all soft variants should meet AAA
        const themeTargetLevel = context.theme.accessibility.targetLevel || 'AA';
        const minContrastLevel = themeTargetLevel === 'AAA' ? 'AAA' : (percentage >= 30 ? 'AA' : 'relaxed');
        
        // Check contrast and adjust if needed
        if (minContrastLevel !== 'relaxed' && !meetsContrast(mixedColor, tokens.background, minContrastLevel, 'normal')) {
          // If contrast is too low, adjust the color
          // In dark mode, lighten; in light mode, darken
          let adjustedColor = mixedColor;
          let adjustment = 5;
          const maxAdjustment = 50;
          
          while (!meetsContrast(adjustedColor, tokens.background, minContrastLevel, 'normal') && adjustment <= maxAdjustment) {
            adjustedColor = context.mode === 'dark' 
              ? lighten(mixedColor, adjustment)
              : darken(mixedColor, adjustment);
            adjustment += 5;
          }
          
          tokens[key] = adjustedColor;
        } else if (minContrastLevel === 'relaxed') {
          // For lower soft variants, ensure at least 3:1 contrast
          let adjustedColor = mixedColor;
          
          // Simple check - if the color is too close to background, adjust it
          const rgb1 = parseColor(mixedColor);
          const rgb2 = parseColor(tokens.background);
          const colorDiff = Math.abs(rgb1.r - rgb2.r) + Math.abs(rgb1.g - rgb2.g) + Math.abs(rgb1.b - rgb2.b);
          
          if (colorDiff < 100) { // Colors are too similar
            adjustedColor = context.mode === 'dark'
              ? lighten(mixedColor, 20)
              : darken(mixedColor, 20);
          }
          
          tokens[key] = adjustedColor;
        } else {
          tokens[key] = mixedColor;
        }
      }

      // Background soft variants
      if (tokens.background) {
        const key = `backgroundSoft${percentage}` as keyof SurfaceTokens;
        const baseColor =
          context.mode === 'light'
            ? darken(tokens.background, percentage * 0.5)
            : lighten(tokens.background, percentage * 0.5);
        tokens[key] = baseColor;
      }

      // Border soft variants
      if (tokens.border) {
        const key = `borderSoft${percentage}` as keyof SurfaceTokens;
        tokens[key] = mix(tokens.border, tokens.background, percentage / 100);
      }
    }
  }

  // Hard variants (increased contrast)
  if (variants?.hard) {
    for (const percentage of variants.hard) {
      // Text hard variants
      if (tokens.text) {
        const key = `textHard${percentage}` as keyof SurfaceTokens;
        const amount = percentage * 0.5;
        tokens[key] =
          context.mode === 'light' ? darken(tokens.text, amount) : lighten(tokens.text, amount);
      }

      // Background hard variants
      if (tokens.background) {
        const key = `backgroundHard${percentage}` as keyof SurfaceTokens;
        const amount = percentage * 0.5;
        tokens[key] =
          context.mode === 'light'
            ? lighten(tokens.background, amount)
            : darken(tokens.background, amount);
      }

      // Border hard variants
      if (tokens.border) {
        const key = `borderHard${percentage}` as keyof SurfaceTokens;
        const amount = percentage * 0.5;
        tokens[key] =
          context.mode === 'light' ? darken(tokens.border, amount) : lighten(tokens.border, amount);
      }
    }
  }
}

/**
 * Generate state variations
 */
function generateStates(
  tokens: SurfaceTokens,
  states: SurfaceDefinition['states'],
  surfaceName: string,
  context: ResolutionContext
): void {
  // Link states - define ALL states even if they reference base
  if (tokens.link) {
    const bgHover = tokens['background-hover'] || tokens.background;
    tokens['link-hover'] = states?.hover
      ? validateAndAdjustContrast(
          applyStateModifier(tokens.link, states.hover, bgHover, context.mode, context),
          bgHover,
          context.theme.accessibility.targetLevel || 'AA',
          'normal',
          surfaceName,
          'linkHover',
          context
        )
      : tokens.link;
      
    const bgActive = tokens['background-active'] || tokens.background;
    tokens['link-active'] = states?.active
      ? validateAndAdjustContrast(
          applyStateModifier(tokens.link, states.active, bgActive, context.mode),
          bgActive,
          context.theme.accessibility.targetLevel || 'AA',
          'normal',
          surfaceName,
          'linkActive',
          context
        )
      : tokens.link;
      
    const bgFocus = tokens['background-focus'] || tokens.background;
    tokens['link-focus'] = states?.focus
      ? validateAndAdjustContrast(
          applyStateModifier(tokens.link, states.focus, bgFocus, context.mode, context),
          bgFocus,
          context.theme.accessibility.targetLevel || 'AA',
          'normal',
          surfaceName,
          'linkFocus',
          context
        )
      : tokens.link;
      
    const bgDisabled = tokens['background-disabled'] || tokens.background;
    tokens['link-disabled'] = states?.disabled
      ? validateAndAdjustContrast(
          applyStateModifier(tokens.link, states.disabled, bgDisabled, undefined, context),
          bgDisabled,
          context.theme.accessibility.targetLevel || 'AA',
          'normal',
          surfaceName,
          'linkDisabled',
          context
        )
      : tokens.link;
  }

  // Background states - define ALL states even if they reference base
  if (tokens.background) {
    // Always define all state variants, even if not in surface definition
    tokens['background-hover'] = states?.hover 
      ? applyStateModifier(tokens.background, states.hover, tokens.background, context.mode, context)
      : tokens.background;
      
    // Active builds on hover state for smooth progression
    tokens['background-active'] = states?.active
      ? applyRelativeStateModifier(tokens['background-hover'] || tokens.background, states.active, states.hover, tokens.background, context.mode, context)
      : tokens.background;
      
    tokens['background-focus'] = states?.focus
      ? applyStateModifier(tokens.background, states.focus, tokens.background, context.mode, context)
      : tokens.background;
      
    tokens['background-disabled'] = states?.disabled
      ? applyStateModifier(tokens.background, states.disabled, tokens.background, undefined, context)
      : tokens.background;
  }

  // Text states - define ALL states even if they reference base
  if (tokens.text) {
    // For each state, validate contrast against the corresponding background state
    const bgHover = tokens['background-hover'] || tokens.background;
    tokens['text-hover'] = states?.hover
      ? validateAndAdjustContrast(
          applyStateModifier(tokens.text, states.hover, bgHover, undefined, context),
          bgHover,
          context.theme.accessibility.targetLevel || 'AA',
          'normal',
          surfaceName,
          'textHover',
          context
        )
      : tokens.text;
      
    const bgActive = tokens['background-active'] || tokens.background;
    tokens['text-active'] = states?.active
      ? validateAndAdjustContrast(
          applyStateModifier(tokens.text, states.active, bgActive, undefined, context),
          bgActive,
          context.theme.accessibility.targetLevel || 'AA',
          'normal',
          surfaceName,
          'textActive',
          context
        )
      : tokens.text;
      
    const bgFocus = tokens['background-focus'] || tokens.background;
    tokens['text-focus'] = states?.focus
      ? validateAndAdjustContrast(
          applyStateModifier(tokens.text, states.focus, bgFocus, undefined, context),
          bgFocus,
          context.theme.accessibility.targetLevel || 'AA',
          'normal',
          surfaceName,
          'textFocus',
          context
        )
      : tokens.text;
      
    const bgDisabled = tokens['background-disabled'] || tokens.background;
    tokens['text-disabled'] = states?.disabled
      ? validateAndAdjustContrast(
          applyStateModifier(tokens.text, states.disabled, bgDisabled, undefined, context),
          bgDisabled,
          context.theme.accessibility.targetLevel || 'AA',
          'normal',
          surfaceName,
          'textDisabled',
          context
        )
      : tokens.text;
  }

  // Border states - define ALL states even if they reference base
  if (tokens.border) {
    tokens['border-hover'] = states?.hover
      ? applyStateModifier(tokens.border, states.hover, tokens.background, undefined, context)
      : tokens.border;
      
    tokens['border-active'] = states?.active
      ? applyStateModifier(tokens.border, states.active, tokens.background, undefined, context)
      : tokens.border;
      
    // Focus border often uses primary color for accessibility
    tokens['border-focus'] = states?.focus
      ? context.colors.primary[context.mode === 'light' ? '500' : '400']
      : tokens.border;
      
    tokens['border-disabled'] = states?.disabled
      ? applyStateModifier(tokens.border, states.disabled, tokens.background, undefined, context)
      : tokens.border;
  }

  // Icon states - define ALL states even if they reference base
  if (tokens.icon) {
    tokens['icon-hover'] = states?.hover
      ? applyStateModifier(tokens.icon, states.hover, tokens.background, undefined, context)
      : tokens.icon;
      
    tokens['icon-active'] = states?.active
      ? applyStateModifier(tokens.icon, states.active, tokens.background, undefined, context)
      : tokens.icon;
      
    tokens['icon-focus'] = states?.focus
      ? applyStateModifier(tokens.icon, states.focus, tokens.background, undefined, context)
      : tokens.icon;
      
    tokens['icon-disabled'] = states?.disabled
      ? applyStateModifier(tokens.icon, states.disabled, tokens.background, undefined, context)
      : tokens.icon;
  }
}

/**
 * Apply state modifier to a color
 */
function applyStateModifier(
  baseColor: string,
  modifier: StateModifier,
  _background: string,
  mode?: 'light' | 'dark',
  context?: ResolutionContext
): string {
  if (!modifier) return baseColor;

  let color = baseColor;

  // Apply lightness adjustment
  if (modifier.lightness !== undefined) {
    const lightnessValue =
      typeof modifier.lightness === 'object' && mode
        ? modifier.lightness[mode]
        : typeof modifier.lightness === 'number'
          ? modifier.lightness
          : 0;

    color =
      lightnessValue > 0 ? lighten(color, lightnessValue) : darken(color, Math.abs(lightnessValue));
  }

  // Apply saturation adjustment
  if (modifier.saturation !== undefined) {
    const saturationValue =
      typeof modifier.saturation === 'object' && mode
        ? modifier.saturation[mode]
        : typeof modifier.saturation === 'number'
          ? modifier.saturation
          : 0;

    color = saturate(color, saturationValue);
  }

  // Apply mix
  if (modifier.mix) {
    // Resolve color reference if needed
    let mixColor = modifier.mix.color;
    if (
      context &&
      !(mixColor.startsWith('#') || mixColor.startsWith('rgba') || mixColor === 'transparent')
    ) {
      mixColor = resolveColorReference(modifier.mix.color, context);
    }
    color = mix(color, mixColor, modifier.mix.ratio);
  }

  // Apply opacity (return as rgba)
  if (modifier.opacity !== undefined) {
    const rgb = parseColor(color);
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${modifier.opacity})`;
  }

  return color;
}

/**
 * Apply state modifier relative to previous state
 * This ensures smooth state progression (e.g., active builds on hover)
 */
function applyRelativeStateModifier(
  startColor: string,
  modifier: StateModifier,
  previousModifier: StateModifier | undefined,
  baseColor: string,
  mode?: 'light' | 'dark',
  context?: ResolutionContext
): string {
  if (!modifier) return startColor;

  // If there's no previous modifier, just apply the current one
  if (!previousModifier) {
    return applyStateModifier(baseColor, modifier, baseColor, mode, context);
  }

  // Calculate the delta between modifiers
  const deltaModifier: StateModifier = {};

  // Calculate lightness delta
  if (modifier.lightness !== undefined) {
    const currentValue = typeof modifier.lightness === 'object' && mode
      ? modifier.lightness[mode]
      : typeof modifier.lightness === 'number' ? modifier.lightness : 0;
    
    const previousValue = previousModifier.lightness !== undefined
      ? (typeof previousModifier.lightness === 'object' && mode
          ? previousModifier.lightness[mode]
          : typeof previousModifier.lightness === 'number' ? previousModifier.lightness : 0)
      : 0;
    
    const delta = currentValue - previousValue;
    if (delta !== 0) {
      deltaModifier.lightness = delta;
    }
  }

  // Apply the delta to the start color
  return applyStateModifier(startColor, deltaModifier, baseColor, mode, context);
}

/**
 * Generate common variations that aren't explicitly defined
 */
function generateCommonVariations(
  tokens: SurfaceTokens,
  surface: SurfaceDefinition,
  context: ResolutionContext
): void {
  // Icon states - define ALL states even if they reference base
  if (tokens.icon) {
    // Always define all icon state variants
    if (!tokens['icon-hover']) {
      tokens['icon-hover'] = tokens.icon;
    }
    if (!tokens['icon-active']) {
      tokens['icon-active'] = tokens.icon;
    }
    if (!tokens['icon-focus']) {
      tokens['icon-focus'] = tokens.icon;
    }
    if (!tokens['icon-disabled']) {
      tokens['icon-disabled'] = mix(tokens.icon, tokens.background, 0.5);
    }
    
    // Icon variations
    if (!tokens.iconSoft20) {
      tokens.iconSoft20 = mix(tokens.icon, tokens.background, 0.2);
    }
  }

  // Shadow variations
  if (tokens.shadow && !tokens.shadowSoft) {
    tokens.shadowSoft = tokens.shadow.replace(/[\d.]+\)$/, (m) => {
      const opacity = parseFloat(m);
      return `${opacity * 0.7})`;
    });
  }
  if (tokens.shadow && !tokens.shadowHard) {
    tokens.shadowHard = tokens.shadow.replace(/[\d.]+\)$/, (m) => {
      const opacity = parseFloat(m);
      return `${opacity * 1.3})`;
    });
  }


  // Generate linkVisited states if linkVisited is defined
  if (tokens.linkVisited && surface.states) {
    // Generate states for linkVisited
    tokens['linkVisited-hover'] = surface.states.hover
      ? validateAndAdjustContrast(
          applyStateModifier(tokens.linkVisited, surface.states.hover, tokens.background, context.mode, context),
          tokens.background,
          context.theme.accessibility.targetLevel || 'AA',
          'normal',
          surface.name,
          'linkVisited-hover',
          context
        )
      : tokens.linkVisited;
    
    tokens['linkVisited-active'] = surface.states.active
      ? validateAndAdjustContrast(
          applyStateModifier(tokens.linkVisited, surface.states.active, tokens.background, context.mode, context),
          tokens.background,
          context.theme.accessibility.targetLevel || 'AA',
          'normal',
          surface.name,
          'linkVisited-active',
          context
        )
      : tokens.linkVisited;
    
    tokens['linkVisited-focus'] = surface.states.focus
      ? validateAndAdjustContrast(
          applyStateModifier(tokens.linkVisited, surface.states.focus, tokens.background, context.mode, context),
          tokens.background,
          context.theme.accessibility.targetLevel || 'AA',
          'normal',
          surface.name,
          'linkVisited-focus',
          context
        )
      : tokens.linkVisited;
  }
}

/**
 * Validate and adjust foreground color for proper contrast
 */
function validateAndAdjustContrast(
  foreground: string,
  background: string,
  level: WCAGLevel,
  textSize: TextSize,
  surfaceName: string,
  tokenName: string,
  context: ResolutionContext
): string {
  // Skip validation for transparent colors
  if (foreground === 'transparent' || background === 'transparent') {
    return foreground;
  }

  // Check if the color meets contrast requirements
  if (meetsContrast(foreground, background, level, textSize)) {
    return foreground;
  }

  // Generate an accessible color
  const adjusted = generateTextColor(background, foreground, level, textSize);
  
  // Track the adjustment
  if (context.adjustments) {
    context.adjustments.push({
      surface: surfaceName,
      token: tokenName,
      original: foreground,
      adjusted,
      reason: `Adjusted to meet ${level} contrast ratio against ${surfaceName}.background`
    });
  }

  return adjusted;
}
