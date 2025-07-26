/**
 * Build script for generating theme CSS files
 *
 * This script compiles themes using esbuild to handle TypeScript imports
 */

import { writeFile, mkdir } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { build } from 'esbuild';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');
const require = createRequire(import.meta.url);

// Build the theme generator code with esbuild
const result = await build({
  entryPoints: {
    index: resolve(projectRoot, 'src/theme-generator/index.ts'),
    'theme-definitions': resolve(projectRoot, 'src/themes/theme-definitions.ts'),
  },
  bundle: true,
  write: false,
  platform: 'node',
  format: 'esm',
  target: 'node16',
  external: ['node:*'],
  outdir: 'out', // Required but not used since write: false
});

// Create a module from the bundled code
const themeGeneratorCode = result.outputFiles.find((f) => f.path.endsWith('index.js')).text;
const themeDefinitionsCode = result.outputFiles.find((f) =>
  f.path.endsWith('theme-definitions.js')
).text;

// Evaluate the modules
const themeGeneratorModule = await import(
  `data:text/javascript;base64,${Buffer.from(themeGeneratorCode).toString('base64')}`
);
const themeDefinitionsModule = await import(
  `data:text/javascript;base64,${Buffer.from(themeDefinitionsCode).toString('base64')}`
);

const { compileTheme, generateCSS, generateTypeDefinitions, generateManifest } =
  themeGeneratorModule;
const { themeDefinitions } = themeDefinitionsModule;

async function buildThemes() {
  console.log('🎨 Building themes...');

  try {
    // Ensure output directories exist
    await mkdir(resolve(projectRoot, 'dist'), { recursive: true });
    await mkdir(resolve(projectRoot, 'dist/themes'), { recursive: true });

    // Compile all themes
    const compiledThemes = [];

    for (const definition of themeDefinitions) {
      console.log(`  Building theme: ${definition.name}`);

      // Generate light mode
      const lightTheme = compileTheme(definition, 'light');
      compiledThemes.push(lightTheme);

      const lightCSS = generateCSS(lightTheme);
      await writeFile(resolve(projectRoot, `dist/themes/${definition.id}-light.css`), lightCSS);

      // Generate dark mode
      const darkTheme = compileTheme(definition, 'dark');
      compiledThemes.push(darkTheme);

      const darkCSS = generateCSS(darkTheme);
      await writeFile(resolve(projectRoot, `dist/themes/${definition.id}-dark.css`), darkCSS);

      // Log token count
      const tokenCount = Object.keys(lightTheme.surfaces).reduce((acc, surface) => {
        return acc + Object.keys(lightTheme.surfaces[surface]).length;
      }, 0);

      console.log(`    ✓ Generated ${tokenCount} tokens per mode`);

      // Log accessibility info
      if (lightTheme.accessibility.adjustments.length > 0) {
        console.log(
          `    ⚡ Applied ${lightTheme.accessibility.adjustments.length} accessibility adjustments (light)`
        );
      }
      if (darkTheme.accessibility.adjustments.length > 0) {
        console.log(
          `    ⚡ Applied ${darkTheme.accessibility.adjustments.length} accessibility adjustments (dark)`
        );
      }
    }

    // Generate TypeScript definitions
    console.log('  Generating TypeScript definitions...');
    const typeDefs = generateTypeDefinitions(compiledThemes);
    await writeFile(resolve(projectRoot, 'dist/theme-tokens.d.ts'), typeDefs);

    // Generate theme manifest
    console.log('  Generating theme manifest...');
    const manifest = generateManifest(themeDefinitions, compiledThemes);
    await writeFile(
      resolve(projectRoot, 'dist/theme-manifest.json'),
      JSON.stringify(manifest, null, 2)
    );

    // Summary
    console.log('');
    console.log(`✅ Successfully built ${themeDefinitions.length} themes`);
    console.log(`   Total files: ${themeDefinitions.length * 2} CSS files`);
    console.log(`   Output directory: dist/themes/`);

    // Report on accessibility
    const aaaThemes = themeDefinitions.filter((t) => t.accessibility.targetLevel === 'AAA');
    if (aaaThemes.length > 0) {
      console.log(`   AAA compliant themes: ${aaaThemes.map((t) => t.name).join(', ')}`);
    }
  } catch (error) {
    console.error('❌ Error building themes:', error);
    process.exit(1);
  }
}

// Run the build
buildThemes();
