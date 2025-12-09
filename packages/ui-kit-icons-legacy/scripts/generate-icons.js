import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Convert kebab-case to PascalCase
function pascalCase(str) {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

async function generateIcons() {
  console.log('Generating icon components from SVG files...');
  
  // Get all SVG files
  const svgFiles = await glob('src/svgs/**/*.svg', { cwd: rootDir });
  const iconExports = [];
  
  // Ensure components directory exists
  await fs.mkdir(path.join(rootDir, 'src/components'), { recursive: true });
  
  for (const file of svgFiles) {
    const fullPath = path.join(rootDir, file);
    
    // Read SVG content from file (source of truth)
    const svgContent = await fs.readFile(fullPath, 'utf-8');
    
    // Extract the inner content of the SVG (everything inside the <svg> tag)
    const innerContent = svgContent
      .replace(/<svg[^>]*>/, '')
      .replace(/<\/svg>/, '')
      .trim();
    
    // Generate icon name
    const iconName = pascalCase(path.basename(file, '.svg')) + 'Icon';
    
    // Generate component content with a comment pointing to the source SVG
    const componentContent = `import { createIcon } from '../utils/createIcon';

// Generated from: ${file}
// To update this icon, modify the SVG file and run: pnpm generate-icons
const svgContent = \`${innerContent}\`;

export const ${iconName} = createIcon(svgContent, '${iconName}');
`;
    
    // Write component file
    const componentPath = path.join(rootDir, `src/components/${iconName}.tsx`);
    await fs.writeFile(componentPath, componentContent);
    
    // Add to exports
    iconExports.push(`export { ${iconName} } from './components/${iconName}';`);
  }
  
  // Update index.ts
  const indexContent = `// Auto-generated icon exports
// Generated from SVG files in src/svgs/
// To update icons, modify the SVG files and run: pnpm generate-icons
${iconExports.sort().join('\n')}

// Type exports
export type { IconProps } from './types';
`;
  
  await fs.writeFile(path.join(rootDir, 'src/index.ts'), indexContent);
  
  console.log(`✅ Generated ${svgFiles.length} icon components from SVG source files`);
}

// Run the generator
generateIcons().catch(console.error);