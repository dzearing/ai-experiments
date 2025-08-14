import { getContrastRatio } from './packages/ui-kit/src/theme-generator/utilities/getContrastRatio.js';
import { meetsContrast } from './packages/ui-kit/src/theme-generator/accessibility.js';

const forestGreen600 = '#5c8a61'; // This is what should be used
const white = '#ffffff';
const nearWhite = '#fafafa';
const black = '#000000';

console.log('Forest Green Primary Surface Analysis:');
console.log('=======================================');
console.log(`Background: ${forestGreen600}`);
console.log('');

console.log('Contrast Ratios:');
const whiteRatio = getContrastRatio(white, forestGreen600);
const nearWhiteRatio = getContrastRatio(nearWhite, forestGreen600);
const blackRatio = getContrastRatio(black, forestGreen600);

console.log(`  Pure white (#ffffff): ${whiteRatio.toFixed(2)}:1`);
console.log(`  Near white (#fafafa): ${nearWhiteRatio.toFixed(2)}:1`);
console.log(`  Pure black (#000000): ${blackRatio.toFixed(2)}:1`);
console.log('');

console.log('WCAG AA Requirements:');
console.log('  Normal text: 4.5:1');
console.log('  UI components: 3.0:1 ← This is what buttons use!');
console.log('');

console.log('Does white meet UI requirement (3.0:1)?');
console.log(`  Pure white: ${meetsContrast(white, forestGreen600, 'AA', 'ui') ? '✅ YES' : '❌ NO'} (${whiteRatio.toFixed(2)} >= 3.0)`);
console.log(`  Near white: ${meetsContrast(nearWhite, forestGreen600, 'AA', 'ui') ? '✅ YES' : '❌ NO'} (${nearWhiteRatio.toFixed(2)} >= 3.0)`);
console.log('');
console.log('The bug: Even though white passes UI requirements, black is being chosen!');