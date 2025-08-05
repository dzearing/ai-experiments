/**
 * Surface definitions for the theme generation system
 *
 * Defines all UI surfaces and their color relationships.
 * Surfaces can reference each other and use computed colors.
 */

import type { SurfaceDefinition, BackgroundLevels } from './theme-types.js';

/**
 * Background elevation levels
 * Used to create visual hierarchy through subtle background changes
 */
export const backgroundLevels: BackgroundLevels = {
  '-2': {
    light: 'hsl(220, 15%, 93%)', // Deepest recess
    dark: 'hsl(220, 15%, 4%)',
  },
  '-1': {
    light: 'hsl(220, 15%, 95%)', // Recessed
    dark: 'hsl(220, 15%, 6%)',
  },
  '0': {
    light: 'hsl(0, 0%, 100%)', // Pure white/black
    dark: 'hsl(0, 0%, 0%)',
  },
  '+1': {
    light: 'hsl(220, 15%, 98%)', // Slightly raised
    dark: 'hsl(220, 15%, 8%)',
  },
  '+2': {
    light: 'hsl(220, 15%, 96%)', // Elevated
    dark: 'hsl(220, 15%, 11%)',
  },
  '+3': {
    light: 'hsl(220, 15%, 94%)', // Floating
    dark: 'hsl(220, 15%, 15%)',
  },
};

/**
 * Core surface definitions
 * Order matters - surfaces can only reference previously defined surfaces
 */
export const surfaces: SurfaceDefinition[] = [
  // Base body surface
  {
    name: 'body',
    base: {
      background: {
        fn: 'auto',
        args: {
          light: { ref: 'surface.-1' }, // Slightly off-white for reduced glare
          dark: { ref: 'surface.-1' }, // Slightly off-black for better contrast
        },
      },
      text: {
        fn: 'contrast',
        args: {
          against: 'body.background',
          prefer: { ref: 'neutral.900' },
          strategy: 'auto',
        },
      },
      border: {
        fn: 'auto',
        args: {
          light: { ref: 'neutral.200' },
          dark: { ref: 'neutral.800' },
        },
      },
      link: {
        fn: 'auto',
        args: {
          light: { ref: 'primary.600' },
          dark: { ref: 'primary.400' },
        },
      },
      // linkVisited will default to link values
      icon: {
        fn: 'auto',
        args: {
          light: { ref: 'neutral.600' },
          dark: { ref: 'neutral.400' },
        },
      },
      textSuccess: {
        fn: 'contrast',
        args: {
          against: 'body.background',
          prefer: { ref: 'success.600' },
          strategy: 'vibrant',
        },
      },
      textWarning: {
        fn: 'contrast',
        args: {
          against: 'body.background',
          prefer: { ref: 'warning.600' },
          strategy: 'vibrant',
        },
      },
      textDanger: {
        fn: 'contrast',
        args: {
          against: 'body.background',
          prefer: { ref: 'error.600' },
          strategy: 'vibrant',
        },
      },
      outline: {
        fn: 'auto',
        args: {
          light: { ref: 'primary.500' },
          dark: { ref: 'primary.400' },
        },
      },
    },
    variants: {
      soft: [10, 20, 30, 40],
      hard: [10, 20],
    },
    states: {
      hover: { 
        // Use translucent overlay instead of lightness adjustment
        // This works better on colored surfaces like banners
        lightness: { light: -3, dark: 3 }  // Fallback for now
      },
      active: { 
        lightness: { light: -5, dark: 5 }  // Fallback for now
      },
      disabled: { opacity: 0.5 },
    },
  },

  // Panel surface (same level as body)
  {
    name: 'panel',
    base: {
      background: { ref: 'surface.0' },
      text: { ref: 'body.text' },
      border: { ref: 'body.border' },
      link: { ref: 'body.link' },
      icon: { ref: 'body.icon' },
      shadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
      outline: { ref: 'body.outline' },
    },
    variants: {
      soft: [10, 20, 30, 40],
      hard: [10, 20],
    },
  },

  // Primary surface (buttons, checkboxes, switches, etc.)
  {
    name: 'primary',
    base: {
      background: { ref: 'primary.600' },
      text: {
        fn: 'contrast',
        args: {
          against: 'primary.background',
          prefer: '#ffffff',
          textSize: 'ui',
        },
      },
      border: 'transparent',
      icon: { ref: 'primary.text' },
      outline: {
        fn: 'contrast',
        args: {
          against: 'primary.background',
          prefer: '#ffffff',
          textSize: 'ui',
        },
      },
    },
    states: {
      hover: { lightness: -10 },
      active: { lightness: -15 },
      disabled: { opacity: 0.6 },
    },
  },

  // Neutral surface (default buttons, unselected states, etc.)
  {
    name: 'neutral',
    base: {
      background: {
        fn: 'auto',
        args: {
          light: { ref: 'neutral.100' },
          dark: { ref: 'neutral.800' },
        },
      },
      text: {
        fn: 'contrast',
        args: {
          against: 'neutral.background',
          prefer: { ref: 'body.text' },
          textSize: 'ui',
        },
      },
      border: {
        fn: 'auto',
        args: {
          light: { ref: 'neutral.300' },
          dark: { ref: 'neutral.600' },
        },
      },
      icon: { ref: 'neutral.text' },
      outline: { ref: 'body.outline' },
    },
    states: {
      hover: { lightness: { light: -5, dark: 5 } },
      active: { lightness: { light: -10, dark: 10 } },
      disabled: { opacity: 0.6 },
    },
  },

  // Danger surface (destructive actions)
  {
    name: 'danger',
    base: {
      background: { ref: 'error.600' },
      text: {
        fn: 'contrast',
        args: {
          against: 'danger.background',
          prefer: '#ffffff',
          textSize: 'ui',
        },
      },
      border: 'transparent',
      icon: { ref: 'danger.text' },
      outline: {
        fn: 'contrast',
        args: {
          against: 'danger.background',
          prefer: '#ffffff',
          textSize: 'ui',
        },
      },
    },
    states: {
      hover: { lightness: -10 },
      active: { lightness: -15 },
      disabled: { opacity: 0.6 },
    },
  },

  // Success surface (positive actions)
  {
    name: 'success',
    base: {
      background: { ref: 'success.600' },
      text: {
        fn: 'contrast',
        args: {
          against: 'success.background',
          prefer: '#ffffff',
          textSize: 'ui',
        },
      },
      border: 'transparent',
      icon: { ref: 'success.text' },
      outline: {
        fn: 'contrast',
        args: {
          against: 'success.background',
          prefer: '#ffffff',
          textSize: 'ui',
        },
      },
    },
    states: {
      hover: { lightness: -10 },
      active: { lightness: -15 },
      disabled: { opacity: 0.6 },
    },
  },

  // Input fields
  {
    name: 'input',
    base: {
      background: {
        fn: 'auto',
        args: {
          light: '#ffffff',
          dark: { ref: 'surface.0' },
        },
      },
      text: { ref: 'body.text' },
      border: {
        fn: 'auto',
        args: {
          light: { ref: 'neutral.300' },
          dark: { ref: 'neutral.700' },
        },
      },
      icon: {
        fn: 'auto',
        args: {
          light: { ref: 'neutral.500' },
          dark: { ref: 'neutral.500' },
        },
      },
      shadow: '0 0 0 3px transparent',
      outline: { ref: 'body.outline' },
    },
    states: {
      hover: {
        lightness: { light: -2, dark: 2 },
      },
      focus: {
        mix: { color: 'primary.500', ratio: 0.2 },
      },
      disabled: {
        opacity: 0.6,
      },
    },
  },

  // Info soft surface (banners, alerts)
  {
    name: 'infoSoft',
    base: {
      background: {
        fn: 'auto',
        args: {
          light: {
            fn: 'mix',
            args: {
              color1: { ref: 'info.100' },
              color2: { ref: 'body.background' },
              ratio: 0.3,
            },
          },
          dark: {
            fn: 'mix',
            args: {
              color1: { ref: 'info.900' },
              color2: { ref: 'body.background' },
              ratio: 0.7,
            },
          },
        },
      },
      text: {
        fn: 'auto',
        args: {
          light: { ref: 'info.800' },
          dark: { ref: 'info.200' },
        },
      },
      border: {
        fn: 'auto',
        args: {
          light: { ref: 'info.300' },
          dark: { ref: 'info.700' },
        },
      },
      icon: {
        fn: 'auto',
        args: {
          light: { ref: 'info.600' },
          dark: { ref: 'info.400' },
        },
      },
      outline: { ref: 'body.outline' },
    },
  },

  {
    name: 'successSoft',
    base: {
      background: {
        fn: 'auto',
        args: {
          light: {
            fn: 'mix',
            args: {
              color1: { ref: 'success.100' },
              color2: { ref: 'body.background' },
              ratio: 0.3,
            },
          },
          dark: {
            fn: 'mix',
            args: {
              color1: { ref: 'success.900' },
              color2: { ref: 'body.background' },
              ratio: 0.7,
            },
          },
        },
      },
      text: {
        fn: 'auto',
        args: {
          light: { ref: 'success.800' },
          dark: { ref: 'success.200' },
        },
      },
      border: {
        fn: 'auto',
        args: {
          light: { ref: 'success.300' },
          dark: { ref: 'success.700' },
        },
      },
      icon: {
        fn: 'auto',
        args: {
          light: { ref: 'success.600' },
          dark: { ref: 'success.400' },
        },
      },
      outline: { ref: 'body.outline' },
    },
  },

  {
    name: 'warningSoft',
    base: {
      background: {
        fn: 'auto',
        args: {
          light: {
            fn: 'mix',
            args: {
              color1: { ref: 'warning.100' },
              color2: { ref: 'body.background' },
              ratio: 0.3,
            },
          },
          dark: {
            fn: 'mix',
            args: {
              color1: { ref: 'warning.900' },
              color2: { ref: 'body.background' },
              ratio: 0.7,
            },
          },
        },
      },
      text: {
        fn: 'auto',
        args: {
          light: { ref: 'warning.800' },
          dark: { ref: 'warning.200' },
        },
      },
      border: {
        fn: 'auto',
        args: {
          light: { ref: 'warning.300' },
          dark: { ref: 'warning.700' },
        },
      },
      icon: {
        fn: 'auto',
        args: {
          light: { ref: 'warning.600' },
          dark: { ref: 'warning.400' },
        },
      },
      outline: { ref: 'body.outline' },
    },
  },

  {
    name: 'dangerSoft',
    base: {
      background: {
        fn: 'auto',
        args: {
          light: {
            fn: 'mix',
            args: {
              color1: { ref: 'error.100' },
              color2: { ref: 'body.background' },
              ratio: 0.3,
            },
          },
          dark: {
            fn: 'mix',
            args: {
              color1: { ref: 'error.900' },
              color2: { ref: 'body.background' },
              ratio: 0.7,
            },
          },
        },
      },
      text: {
        fn: 'auto',
        args: {
          light: { ref: 'error.800' },
          dark: { ref: 'error.200' },
        },
      },
      border: {
        fn: 'auto',
        args: {
          light: { ref: 'error.300' },
          dark: { ref: 'error.700' },
        },
      },
      icon: {
        fn: 'auto',
        args: {
          light: { ref: 'error.600' },
          dark: { ref: 'error.400' },
        },
      },
      outline: { ref: 'body.outline' },
    },
  },

];

/**
 * Get surface definition by name
 */
export function getSurface(name: string): SurfaceDefinition | undefined {
  return surfaces.find((s) => s.name === name);
}

/**
 * Get all surface names
 */
export function getSurfaceNames(): string[] {
  return surfaces.map((s) => s.name);
}
