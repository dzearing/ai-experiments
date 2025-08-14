import { getContrastRatio } from './packages/ui-kit/src/theme-generator/utilities/getContrastRatio.js';
import { darken, lighten } from './packages/ui-kit/src/theme-generator/utilities/index.js';

const originalForestPrimary = '#307e39'; // Original from theme definition
const currentGenerated = '#5c8a61'; // What's being generated now

console.log('Original vs Generated Forest Green:');
console.log('===================================');
console.log(`Original: ${originalForestPrimary}`);
console.log(`Generated: ${currentGenerated}`);
console.log('');

// Test the original color
const blackOnOriginal = getContrastRatio('#000000', originalForestPrimary);
const whiteOnOriginal = getContrastRatio('#ffffff', originalForestPrimary);

console.log('Original Forest Green (#307e39):');
console.log(`  Black text: ${blackOnOriginal.toFixed(2)}:1`);
console.log(`  White text: ${whiteOnOriginal.toFixed(2)}:1`);
console.log('');

// Try darker versions
const darker20 = darken(originalForestPrimary, 20);
const darker30 = darken(originalForestPrimary, 30);

console.log('Darker alternatives for white text:');
console.log(`  20% darker (${darker20}): ${getContrastRatio('#ffffff', darker20).toFixed(2)}:1`);
console.log(`  30% darker (${darker30}): ${getContrastRatio('#ffffff', darker30).toFixed(2)}:1`);
console.log('');

// Find the ideal darkness for white text to reach 4.5:1
let idealDark = originalForestPrimary;
for (let i = 0; i <= 50; i += 5) {
  const darkened = darken(originalForestPrimary, i);
  const ratio = getContrastRatio('#ffffff', darkened);
  if (ratio >= 4.5) {
    console.log(`  Ideal darkness: ${i}% darker (${darkened}) = ${ratio.toFixed(2)}:1 with white text`);
    idealDark = darkened;
    break;
  }
}

console.log('\nRecommendation:');
console.log('================');
if (whiteOnOriginal >= 4.5) {
  console.log('Use white text on the original green');
} else {
  console.log(`Use white text on a darker green (${idealDark})`);
  console.log('This provides better perceived contrast than black on light green');
}