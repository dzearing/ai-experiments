#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Adds a new icon to the ui-kit-icons package
 * Usage: node add-icon.js <icon-name> <group> [svg-file-path]
 */

function toPascalCase(str) {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

function validateSvg(svgContent) {
  // Ensure viewBox is 0 0 24 24
  if (!svgContent.includes('viewBox="0 0 24 24"')) {
    svgContent = svgContent.replace(
      /viewBox="[^"]*"/,
      'viewBox="0 0 24 24"'
    );
    if (!svgContent.includes('viewBox')) {
      svgContent = svgContent.replace('<svg', '<svg viewBox="0 0 24 24"');
    }
  }

  // Remove width and height attributes
  svgContent = svgContent.replace(/\s(width|height)="[^"]*"/g, '');

  // Replace hardcoded colors with currentColor
  svgContent = svgContent.replace(
    /(?:fill|stroke)="(?!none|currentColor)[^"]*"/g,
    (match) => {
      if (match.includes('="none"')) return match;
      return match.includes('fill=') ? 'fill="currentColor"' : 'stroke="currentColor"';
    }
  );

  return svgContent;
}

function createComponent(iconName, group) {
  const componentName = `${toPascalCase(iconName)}Icon`;
  
  return `import { createIcon } from '../utils/createIcon';

export const ${componentName} = createIcon(
  '${iconName}',
  require('../svgs/${group}/${iconName}.svg') as string
);
`;
}

function updateIndex(iconName) {
  const indexPath = path.join(__dirname, '../src/index.ts');
  const componentName = `${toPascalCase(iconName)}Icon`;
  
  let content = fs.readFileSync(indexPath, 'utf8');
  
  // Add import
  const importLine = `export { ${componentName} } from './components/${componentName}';`;
  
  // Find the right place to insert (alphabetically)
  const lines = content.split('\n');
  const exportLines = lines.filter(line => line.startsWith('export {'));
  
  let inserted = false;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('export {') && lines[i] > importLine) {
      lines.splice(i, 0, importLine);
      inserted = true;
      break;
    }
  }
  
  if (!inserted) {
    // Add at the end of exports
    const lastExportIndex = lines.findLastIndex(line => line.startsWith('export {'));
    lines.splice(lastExportIndex + 1, 0, importLine);
  }
  
  fs.writeFileSync(indexPath, lines.join('\n'));
}

function updateCheatsheet(iconName, group) {
  const cheatsheetPath = path.join(__dirname, '../../../docs/guides/ICONS_CHEATSHEET.md');
  const componentName = `${toPascalCase(iconName)}Icon`;
  
  if (!fs.existsSync(cheatsheetPath)) {
    console.warn('ICONS_CHEATSHEET.md not found, skipping documentation update');
    return;
  }
  
  let content = fs.readFileSync(cheatsheetPath, 'utf8');
  
  // Find the group section
  const groupHeader = `### ${group.charAt(0).toUpperCase() + group.slice(1)}`;
  const iconEntry = `- \`${componentName}\` - \`import { ${componentName} } from '@claude-flow/ui-kit-icons'\``;
  
  const lines = content.split('\n');
  let groupIndex = lines.findIndex(line => line.includes(groupHeader));
  
  if (groupIndex === -1) {
    console.warn(`Group ${group} not found in cheatsheet`);
    return;
  }
  
  // Find where to insert within the group
  let insertIndex = groupIndex + 1;
  while (insertIndex < lines.length && lines[insertIndex].startsWith('- ')) {
    if (lines[insertIndex] > iconEntry) {
      break;
    }
    insertIndex++;
  }
  
  lines.splice(insertIndex, 0, iconEntry);
  fs.writeFileSync(cheatsheetPath, lines.join('\n'));
}

// Main execution
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('Usage: node add-icon.js <icon-name> <group> [svg-content-or-file]');
  console.error('Groups: actions, editor, misc, navigation, status');
  process.exit(1);
}

const [iconName, group, svgInput] = args;

const validGroups = ['actions', 'editor', 'misc', 'navigation', 'status'];
if (!validGroups.includes(group)) {
  console.error(`Invalid group: ${group}`);
  console.error(`Valid groups: ${validGroups.join(', ')}`);
  process.exit(1);
}

// Process SVG
let svgContent = '';
if (svgInput) {
  if (svgInput.startsWith('<svg')) {
    svgContent = svgInput;
  } else if (fs.existsSync(svgInput)) {
    svgContent = fs.readFileSync(svgInput, 'utf8');
  } else {
    console.error('Invalid SVG input. Provide SVG content or file path.');
    process.exit(1);
  }
}

if (!svgContent) {
  console.error('No SVG content provided');
  process.exit(1);
}

// Validate and clean SVG
svgContent = validateSvg(svgContent);

// Create SVG file
const svgDir = path.join(__dirname, `../src/svgs/${group}`);
if (!fs.existsSync(svgDir)) {
  fs.mkdirSync(svgDir, { recursive: true });
}
fs.writeFileSync(path.join(svgDir, `${iconName}.svg`), svgContent);
console.log(`✓ Created SVG: src/svgs/${group}/${iconName}.svg`);

// Create component
const componentDir = path.join(__dirname, '../src/components');
const componentPath = path.join(componentDir, `${toPascalCase(iconName)}Icon.tsx`);
fs.writeFileSync(componentPath, createComponent(iconName, group));
console.log(`✓ Created component: src/components/${toPascalCase(iconName)}Icon.tsx`);

// Update index
updateIndex(iconName);
console.log(`✓ Updated exports in src/index.ts`);

// Update cheatsheet
updateCheatsheet(iconName, group);
console.log(`✓ Updated ICONS_CHEATSHEET.md`);

console.log(`\n✅ Successfully added ${toPascalCase(iconName)}Icon to ${group} group!`);
console.log('\nNext steps:');
console.log('1. Run: cd packages/ui-kit-icons && pnpm build');
console.log('2. Test the icon in your application');