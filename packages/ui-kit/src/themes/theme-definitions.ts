/**
 * Theme definitions for Claude Flow UI Kit
 *
 * Minimal theme configurations that generate complete themes
 */

import type { ThemeDefinition } from './theme-types.js';

export const themeDefinitions: ThemeDefinition[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'Clean and professional',
    colors: {
      primary: '#1976d2', // Material Blue 700
    },
    accessibility: {
      targetLevel: 'AA',
      enforceLevel: true,
    },
  },

  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Cool blues and aquas inspired by the sea',
    colors: {
      primary: '#0ea5e9', // Sky 500
      secondary: '#06b6d4', // Cyan 500
    },
    accessibility: {
      targetLevel: 'AA',
      enforceLevel: true,
    },
    config: {
      saturation: 10,
      temperature: -10, // Slightly cooler
    },
  },

  {
    id: 'forest',
    name: 'Forest',
    description: 'Natural greens and earth tones',
    colors: {
      primary: '#307e39', // Muted forest green
      secondary: '#6b5d54', // Muddy brown
      accent: '#5c4a3d', // Dark muddy brown
      neutral: '#5a5651', // Muddy gray-brown
    },
    accessibility: {
      targetLevel: 'AA',
      enforceLevel: true,
    },
    config: {
      saturation: -25, // Moderate desaturation
      temperature: 0, // Neutral temperature
      contrastBoost: 5, // Slight boost for readability
    },
  },

  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm oranges and purples',
    colors: {
      primary: '#f97316', // Orange 500
      secondary: '#ec4899', // Pink 500
      accent: '#a855f7', // Purple 500
    },
    accessibility: {
      targetLevel: 'AA',
      enforceLevel: true,
    },
    config: {
      saturation: 15,
      temperature: 20, // Warmer
    },
  },

  {
    id: 'corporate',
    name: 'Corporate',
    description: 'Professional business-focused design',
    colors: {
      primary: '#0078d4', // Microsoft Blue
      secondary: '#40587c', // Slate Blue
    },
    accessibility: {
      targetLevel: 'AA',
      enforceLevel: true,
    },
    config: {
      saturation: -20, // More muted
    },
  },

  {
    id: 'vibrant',
    name: 'Vibrant',
    description: 'Bold and energetic colors',
    colors: {
      primary: '#dc2626', // Red 600
      secondary: '#7c3aed', // Violet 600
      accent: '#0891b2', // Cyan 600
    },
    accessibility: {
      targetLevel: 'AA',
      enforceLevel: true,
    },
    config: {
      saturation: 25,
      contrastBoost: 10,
    },
  },

  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Simple and understated design',
    colors: {
      primary: '#64748b', // Slate 500
      neutral: '#71717a', // Zinc 500
    },
    accessibility: {
      targetLevel: 'AA',
      enforceLevel: true,
    },
    config: {
      saturation: -50, // Very muted
    },
  },

  {
    id: 'nature',
    name: 'Nature',
    description: 'Earth tones and natural colors',
    colors: {
      primary: '#059669', // Emerald 600
      secondary: '#ca8a04', // Yellow 600
      accent: '#92400e', // Amber 800
    },
    accessibility: {
      targetLevel: 'AA',
      enforceLevel: true,
    },
    config: {
      saturation: -25, // More muted earth tones
      temperature: 10,
    },
  },

  {
    id: 'monochrome',
    name: 'Monochrome',
    description: 'Grayscale only design',
    colors: {
      primary: '#525252', // Neutral 600
      secondary: '#525252', // Same as primary
      accent: '#525252', // Same as primary
      neutral: '#525252', // Explicit neutral
    },
    accessibility: {
      targetLevel: 'AA',
      enforceLevel: true,
    },
    config: {
      saturation: -100, // No saturation
    },
  },

  {
    id: 'high-contrast',
    name: 'High Contrast',
    description: 'Maximum readability with AAA compliance',
    colors: {
      primary: '#0052cc', // Darker blue
    },
    accessibility: {
      targetLevel: 'AAA', // Stricter compliance
      enforceLevel: true,
      largeTextLevel: 'AA', // Large text can be AA
    },
    config: {
      contrastBoost: 30,
    },
  },

  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Deep blues and purples for night owls',
    colors: {
      primary: '#4338ca', // Indigo 700
      secondary: '#7e22ce', // Purple 700
      accent: '#1e3a8a', // Blue 900
    },
    accessibility: {
      targetLevel: 'AA',
      enforceLevel: true,
    },
    config: {
      temperature: -20, // Cool
      saturation: -10, // Slightly muted
    },
  },

  {
    id: 'spring',
    name: 'Spring',
    description: 'Fresh pastels and bright accents',
    colors: {
      primary: '#ec4899', // Pink 500
      secondary: '#a78bfa', // Violet 400
      accent: '#34d399', // Emerald 400
    },
    accessibility: {
      targetLevel: 'AA',
      enforceLevel: true,
    },
    config: {
      saturation: -15, // Softer pastels
    },
  },

  {
    id: 'autumn',
    name: 'Autumn',
    description: 'Warm fall colors',
    colors: {
      primary: '#dc2626', // Red 600
      secondary: '#ea580c', // Orange 600
      accent: '#ca8a04', // Yellow 600
    },
    accessibility: {
      targetLevel: 'AA',
      enforceLevel: true,
    },
    config: {
      temperature: 25, // Very warm
      saturation: 10,
    },
  },

  {
    id: 'arctic',
    name: 'Arctic',
    description: 'Cool, crisp ice-inspired palette',
    colors: {
      primary: '#0284c7', // Sky 600 (less saturated)
      secondary: '#0891b2', // Cyan 600 (less saturated)
      accent: '#e0f2fe', // Sky 100
      neutral: '#cbd5e1', // Slate 300
    },
    accessibility: {
      targetLevel: 'AA',
      enforceLevel: true,
    },
    config: {
      temperature: -30, // Very cool
      saturation: -35, // Much more muted
    },
  },

  {
    id: 'retro',
    name: 'Retro',
    description: '80s inspired neon and pastels',
    colors: {
      primary: '#f43f5e', // Rose 500
      secondary: '#8b5cf6', // Violet 500
      accent: '#10b981', // Emerald 500
    },
    accessibility: {
      targetLevel: 'AA',
      enforceLevel: true,
    },
    config: {
      saturation: 30, // Vibrant
    },
  },
];

/**
 * Get theme definition by ID
 */
export function getThemeDefinition(id: string): ThemeDefinition | undefined {
  return themeDefinitions.find((theme) => theme.id === id);
}

/**
 * Get all theme IDs
 */
export function getThemeIds(): string[] {
  return themeDefinitions.map((theme) => theme.id);
}
