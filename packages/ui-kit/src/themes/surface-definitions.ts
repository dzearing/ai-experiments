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
    },
    variants: {
      soft: [10, 20, 30, 40],
      hard: [10, 20],
    },
    states: {
      hover: { lightness: { light: -3, dark: 3 } },
      active: { lightness: { light: -5, dark: 5 } },
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
    },
    variants: {
      soft: [10, 20, 30, 40],
      hard: [10, 20],
    },
  },

  // Raised panel
  {
    name: 'panelRaised',
    base: {
      background: { ref: 'surface.+1' },
      text: { ref: 'body.text' },
      border: {
        fn: 'auto',
        args: {
          light: { ref: 'neutral.200' },
          dark: { ref: 'neutral.800' },
        },
      },
      link: { ref: 'body.link' },
      icon: { ref: 'body.icon' },
      shadow: '0 2px 4px rgba(0, 0, 0, 0.10)',
    },
  },

  // Elevated panel
  {
    name: 'panelElevated',
    base: {
      background: { ref: 'surface.+2' },
      text: { ref: 'body.text' },
      border: {
        fn: 'adjust',
        args: {
          color: { ref: 'body.border' },
          lightness: { light: -10, dark: 10 },
        },
      },
      link: { ref: 'body.link' },
      icon: { ref: 'body.icon' },
      shadow: '0 3px 6px rgba(0, 0, 0, 0.12)',
    },
  },

  // Floating panel (highest elevation)
  {
    name: 'panelFloating',
    base: {
      background: { ref: 'surface.+3' },
      text: { ref: 'body.text' },
      border: {
        fn: 'adjust',
        args: {
          color: { ref: 'body.border' },
          lightness: { light: -20, dark: 20 },
        },
      },
      link: { ref: 'body.link' },
      icon: { ref: 'body.icon' },
      shadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
    },
  },

  // Primary button
  {
    name: 'buttonPrimary',
    base: {
      background: { ref: 'primary.600' },
      text: {
        fn: 'contrast',
        args: {
          against: 'buttonPrimary.background',
          prefer: '#ffffff',
          textSize: 'ui',
        },
      },
      border: 'transparent',
      icon: { ref: 'buttonPrimary.text' },
    },
    states: {
      hover: { lightness: -10 },
      active: { lightness: -15 },
      disabled: { opacity: 0.6 },
    },
  },

  // Secondary button
  {
    name: 'buttonSecondary',
    base: {
      background: 'transparent',
      text: { ref: 'primary.600' },
      border: { ref: 'primary.600' },
      icon: { ref: 'buttonSecondary.text' },
    },
    states: {
      hover: {
        mix: { color: 'primary.600', ratio: 0.1 },
      },
      active: {
        mix: { color: 'primary.600', ratio: 0.15 },
      },
      disabled: { opacity: 0.6 },
    },
  },

  // Neutral button
  {
    name: 'buttonNeutral',
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
          against: 'buttonNeutral.background',
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
      icon: { ref: 'buttonNeutral.text' },
    },
    states: {
      hover: { lightness: { light: -5, dark: 5 } },
      active: { lightness: { light: -10, dark: 10 } },
      disabled: { opacity: 0.6 },
    },
  },

  // Danger button
  {
    name: 'buttonDanger',
    base: {
      background: { ref: 'error.600' },
      text: {
        fn: 'contrast',
        args: {
          against: 'buttonDanger.background',
          prefer: '#ffffff',
          textSize: 'ui',
        },
      },
      border: 'transparent',
      icon: { ref: 'buttonDanger.text' },
    },
    states: {
      hover: { lightness: -10 },
      active: { lightness: -15 },
      disabled: { opacity: 0.6 },
    },
  },

  // Success button
  {
    name: 'buttonSuccess',
    base: {
      background: { ref: 'success.600' },
      text: {
        fn: 'contrast',
        args: {
          against: 'buttonSuccess.background',
          prefer: '#ffffff',
          textSize: 'ui',
        },
      },
      border: 'transparent',
      icon: { ref: 'buttonSuccess.text' },
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

  // Notifications
  {
    name: 'noticeInfo',
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
    },
  },

  {
    name: 'noticeSuccess',
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
    },
  },

  {
    name: 'noticeWarning',
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
    },
  },

  {
    name: 'noticeDanger',
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
    },
  },

  // Code surfaces
  {
    name: 'codeBlock',
    base: {
      background: {
        fn: 'auto',
        args: {
          light: { ref: 'neutral.50' },
          dark: { ref: 'neutral.900' },
        },
      },
      text: {
        fn: 'contrast',
        args: {
          against: 'codeBlock.background',
          prefer: { ref: 'body.text' },
        },
      },
      border: {
        fn: 'auto',
        args: {
          light: { ref: 'neutral.200' },
          dark: { ref: 'neutral.800' },
        },
      },
    },
    variants: {
      soft: [10, 20],
    },
  },

  {
    name: 'codeInline',
    base: {
      background: {
        fn: 'auto',
        args: {
          light: { ref: 'primary.50' },
          dark: { ref: 'primary.950' },
        },
      },
      text: {
        fn: 'auto',
        args: {
          light: { ref: 'primary.700' },
          dark: { ref: 'primary.300' },
        },
      },
      border: {
        fn: 'auto',
        args: {
          light: { ref: 'primary.200' },
          dark: { ref: 'primary.800' },
        },
      },
    },
  },

  // Dialog/Modal surfaces
  {
    name: 'dialog',
    base: {
      background: { ref: 'panel.background' },
      text: { ref: 'body.text' },
      border: { ref: 'body.border' },
      shadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
    },
  },

  {
    name: 'modal',
    base: {
      background: { ref: 'panel.background' },
      text: { ref: 'body.text' },
      border: { ref: 'body.border' },
      shadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    },
  },

  // Tooltip
  {
    name: 'tooltip',
    base: {
      background: {
        fn: 'auto',
        args: {
          light: { ref: 'neutral.800' },
          dark: { ref: 'neutral.200' },
        },
      },
      text: {
        fn: 'contrast',
        args: {
          against: 'tooltip.background',
          prefer: '#ffffff',
        },
      },
      border: 'transparent',
      shadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
    },
    variants: {
      soft: [10, 20],
    },
  },

  // Menu/Dropdown
  {
    name: 'menu',
    base: {
      background: { ref: 'panelFloating.background' },
      text: { ref: 'body.text' },
      border: { ref: 'body.border' },
      link: { ref: 'body.link' },
      icon: { ref: 'body.icon' },
      shadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    },
    states: {
      hover: {
        mix: { color: 'primary.500', ratio: 0.1 },
      },
    },
  },

  // Overlay/Backdrop
  {
    name: 'overlay',
    base: {
      background: {
        fn: 'auto',
        args: {
          light: 'rgba(255, 255, 255, 0.95)',
          dark: 'rgba(0, 0, 0, 0.85)',
        },
      },
      text: { ref: 'body.text' },
      border: 'transparent',
    },
  },

  {
    name: 'overlayDark',
    base: {
      background: {
        fn: 'auto',
        args: {
          light: 'rgba(0, 0, 0, 0.5)',
          dark: 'rgba(0, 0, 0, 0.8)',
        },
      },
      text: '#ffffff',
      border: 'transparent',
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
