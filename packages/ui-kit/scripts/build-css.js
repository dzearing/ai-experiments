import { readFile, writeFile, mkdir } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import postcss from 'postcss';
import postcssImport from 'postcss-import';
import postcssNesting from 'postcss-nesting';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

async function buildCSS() {
  try {
    // Ensure dist directory exists
    await mkdir(resolve(projectRoot, 'dist'), { recursive: true });

    // Create a complete CSS file with all imports resolved
    const completeCSS = `
/**
 * Base Styles for Claude Flow UI Kit
 * Generated file - includes all imported styles
 */

/* Font Face Definitions */
${await readFile(resolve(projectRoot, 'src/styles/fonts.css'), 'utf-8')}

/* Typography Variables */
${await readFile(resolve(projectRoot, 'src/styles/variables/typography.css'), 'utf-8')}

/* Spacing Variables */
${await readFile(resolve(projectRoot, 'src/styles/variables/spacing.css'), 'utf-8')}

/* Animation Variables */
${await readFile(resolve(projectRoot, 'src/styles/variables/animation.css'), 'utf-8')}

/* Border Variables */
${await readFile(resolve(projectRoot, 'src/styles/variables/borders.css'), 'utf-8')}

/* Shadow Variables */
${await readFile(resolve(projectRoot, 'src/styles/variables/shadows.css'), 'utf-8')}

/* Layout Variables */
${await readFile(resolve(projectRoot, 'src/styles/variables/layout.css'), 'utf-8')}

/* Color Variables */
${await readFile(resolve(projectRoot, 'src/styles/variables/colors.css'), 'utf-8')}

/* Base Styles */
${await readFile(resolve(projectRoot, 'src/styles.css'), 'utf-8')}
`;

    // Process with PostCSS (mainly for nesting)
    const result = await postcss([
      postcssNesting(),
    ]).process(completeCSS, {
      from: undefined,
    });

    // Write processed CSS to dist directory
    await writeFile(resolve(projectRoot, 'dist/styles.css'), result.css);

    // Check if font-face was included
    const hasFontFace = result.css.includes('@font-face');
    const hasSegoeUI = result.css.includes('Segoe UI Web');
    console.log(`✓ CSS built successfully (${result.css.length} chars, font-face: ${hasFontFace}, Segoe UI Web: ${hasSegoeUI})`);
  } catch (error) {
    console.error('Error building CSS:', error);
    process.exit(1);
  }
}

buildCSS();