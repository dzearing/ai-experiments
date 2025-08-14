import { compileTheme } from './packages/ui-kit/src/theme-generator/theme-compiler.js';
import { themeDefinitions } from './packages/ui-kit/src/themes/theme-definitions.js';

const forestTheme = themeDefinitions.find(t => t.id === 'forest');
if (!forestTheme) {
  console.error('Forest theme not found');
  process.exit(1);
}

console.log('Compiling Forest Theme...');
const compiled = compileTheme(forestTheme, 'light');

console.log('Primary Surface Colors:');
console.log(`  Background: ${compiled.surfaces.primary.background}`);
console.log(`  Text: ${compiled.surfaces.primary.text}`);
console.log('');

// Check the generated primary.600 color
console.log('Primary Color Scale:');
console.log(`  500: ${compiled.colors.primary['500']}`);
console.log(`  600: ${compiled.colors.primary['600']}`);
console.log(`  700: ${compiled.colors.primary['700']}`);
console.log('');

// Test contrast of the text against background
import { getContrastRatio } from './packages/ui-kit/src/theme-generator/utilities/getContrastRatio.js';
const textColor = compiled.surfaces.primary.text;
const bgColor = compiled.surfaces.primary.background;
const contrast = getContrastRatio(textColor, bgColor);

console.log('Contrast Analysis:');
console.log(`  ${textColor} on ${bgColor}: ${contrast.toFixed(2)}:1`);

if (textColor === '#000000') {
  console.log('❌ BUG: Black text was chosen for Forest theme primary surface');
} else if (textColor === '#fafafa' || textColor === '#ffffff') {
  console.log('✅ CORRECT: White/near-white text was chosen');
}