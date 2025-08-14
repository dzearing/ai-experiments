import { getContrastRatio } from './packages/ui-kit/src/theme-generator/utilities/getContrastRatio.js';

const newForestGreen = '#476b4c';
const newTextColor = '#dfdfdf';

console.log('Updated Forest Theme Contrast:');
console.log('==============================');
console.log(`Background: ${newForestGreen}`);
console.log(`Text color: ${newTextColor}`);
console.log('');

const contrast = getContrastRatio(newTextColor, newForestGreen);
console.log(`Contrast ratio: ${contrast.toFixed(2)}:1`);
console.log('');

console.log('WCAG Compliance:');
console.log(`  AA Normal Text (4.5:1): ${contrast >= 4.5 ? '✅ PASS' : '❌ FAIL'}`);
console.log(`  AA Large/UI (3.0:1): ${contrast >= 3.0 ? '✅ PASS' : '❌ FAIL'}`);
console.log('');

// Also check pure white for comparison
const pureWhiteContrast = getContrastRatio('#ffffff', newForestGreen);
console.log(`Pure white contrast: ${pureWhiteContrast.toFixed(2)}:1`);
console.log('');
console.log('This is a significant improvement over black text on light green!');