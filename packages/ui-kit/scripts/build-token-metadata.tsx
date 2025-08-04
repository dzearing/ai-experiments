#!/usr/bin/env tsx
/**
 * Build script for generating token metadata JSON
 * This creates a comprehensive list of all available tokens for the Token Browser
 */

import { writeFile, mkdir } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { surfaces } from '../src/themes/surface-definitions.js';
import { themeDefinitions } from '../src/themes/theme-definitions.js';
import { compileTheme } from '../src/theme-generator/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

interface TokenMetadata {
  color: {
    surfaces: string[];
    concepts: Array<{
      base: string;
      variants: string[];
    }>;
    states: string[];
  };
  typography: {
    categories: string[];
    scales: Record<string, string[]>;
  };
  shadow: {
    types: string[];
    scales: Record<string, string[]>;
  };
  spacing: {
    scales: string[];
    components: string[];
  };
  border: {
    types: string[];
    scales: Record<string, string[]>;
  };
  animation: {
    types: string[];
    scales: Record<string, string[]>;
  };
}

async function buildTokenMetadata() {
  console.log('🎨 Building token metadata...');

  try {
    // Compile a theme to get all tokens
    const sampleTheme = compileTheme(themeDefinitions[0], 'light');
    
    // Extract surface names from surface definitions
    const surfaceNames = surfaces.map(surface => surface.name);
    
    // Extract unique concepts from all surfaces
    const baseConcepts = new Set<string>();
    const conceptVariants = new Map<string, Set<string>>();
    const states = new Set<string>(['hover', 'active', 'focus', 'disabled']);
    
    // First pass: collect all token keys
    const allTokenKeys = new Set<string>();
    Object.values(sampleTheme.surfaces).forEach(surface => {
      Object.keys(surface).forEach(key => {
        allTokenKeys.add(key);
      });
    });
    
    // Second pass: organize into base concepts and variants
    allTokenKeys.forEach(key => {
      // Remove state suffixes first
      let baseKey = key;
      states.forEach(state => {
        if (baseKey.endsWith(state) && baseKey.includes('-')) {
          const parts = baseKey.split('-');
          if (parts[parts.length - 1] === state) {
            baseKey = parts.slice(0, -1).join('-');
          }
        }
      });
      
      // Check if this is a variant (has modifiers like soft10, hard20)
      const match = baseKey.match(/^(\w+?)(Soft\d+|Hard\d+)$/);
      if (match) {
        const base = match[1];
        const variant = baseKey;
        baseConcepts.add(base);
        if (!conceptVariants.has(base)) {
          conceptVariants.set(base, new Set());
        }
        conceptVariants.get(base)!.add(variant);
      } else {
        // It's a base concept
        baseConcepts.add(baseKey);
      }
    });
    
    // Convert to structured format
    const concepts = Array.from(baseConcepts).map(base => ({
      base,
      variants: Array.from(conceptVariants.get(base) || []).sort()
    })).sort((a, b) => a.base.localeCompare(b.base));
    
    // Build the metadata object
    const metadata: TokenMetadata = {
      color: {
        surfaces: surfaceNames,
        concepts,
        states: ['', 'hover', 'active', 'focus', 'disabled']
      },
      typography: {
        categories: ['family', 'size', 'weight', 'lineHeight', 'letterSpacing'],
        scales: {
          family: ['(default)', 'mono', 'serif'],
          size: ['(default)', 'smallest', 'small30', 'small20', 'small10', 'large10', 'large20', 'large30', 'large40', 'large50', 'largest', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'body', 'caption', 'code'],
          weight: ['(default)', 'light', 'medium', 'semibold', 'bold'],
          lineHeight: ['(default)', 'tightest', 'tight10', 'tight20', 'loose5', 'loose10', 'loosest', 'code'],
          letterSpacing: ['(default)', 'tightest', 'tight10', 'wide10', 'wide20', 'widest']
        }
      },
      shadow: {
        types: ['box', 'text', 'inner'],
        scales: {
          box: ['(default)', 'none', 'softest', 'soft10', 'hard10', 'hard20', 'hardest', 'focus', 'button', 'buttonHover', 'card', 'cardHover', 'dropdown', 'modal', 'popover', 'tooltip', 'innerSoft', 'inner'],
          text: ['(default)', 'softest', 'hardest'],
          inner: ['(default)', 'soft', 'hard']
        }
      },
      spacing: {
        scales: ['(default)', 'none', 'px', 'smallest', 'small20', 'small10', 'small5', 'large5', 'large10', 'large20', 'large30', 'large40', 'large50', 'large60', 'large70', 'largest'],
        components: ['buttonX', 'buttonY', 'inputX', 'inputY', 'card', 'modal', 'section']
      },
      border: {
        types: ['width', 'radius'],
        scales: {
          width: ['(default)', 'thinnest', 'thick10', 'thickest', 'default', 'focus', 'divider'],
          radius: ['(default)', 'none', 'smallest', 'small10', 'large10', 'large20', 'large30', 'full', 'button', 'input', 'card', 'modal', 'tooltip', 'badge', 'chip', 'avatar', 'image']
        }
      },
      animation: {
        types: ['duration', 'easing', 'delay'],
        scales: {
          duration: ['(default)', 'fastest', 'fast20', 'fast10', 'slow10', 'slow20', 'slowest', 'hover', 'focus', 'expand', 'collapse', 'fadeIn', 'fadeOut', 'slideIn', 'slideOut', 'modalIn', 'modalOut', 'pageTransition', 'deliberate'],
          easing: ['default', 'linear', 'ease', 'easeIn', 'easeOut', 'easeInOut', 'bounce', 'sharp', 'smooth', 'enter', 'exit', 'move'],
          delay: ['(default)', 'none', 'fast10', 'slow10', 'slow20', 'stagger']
        }
      }
    };
    
    // Ensure output directory exists
    await mkdir(resolve(projectRoot, 'dist'), { recursive: true });
    
    // Write the metadata file
    const metadataPath = resolve(projectRoot, 'dist/token-metadata.json');
    await writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    
    console.log(`✅ Token metadata generated at: dist/token-metadata.json`);
    console.log(`   Surfaces: ${metadata.color.surfaces.length}`);
    console.log(`   Concepts: ${metadata.color.concepts.length}`);
    
  } catch (error) {
    console.error('❌ Error building token metadata:', error);
    process.exit(1);
  }
}

// Run the build
buildTokenMetadata();