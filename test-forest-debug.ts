import { generateTextColor, meetsContrast } from './packages/ui-kit/src/theme-generator/accessibility.js';

const forestGreen = '#5c8a61';
const preferredNearWhite = '#fafafa';

console.log('Testing Forest Theme Text Color Generation:');
console.log('===========================================');
console.log(`Background: ${forestGreen}`);
console.log(`Preferred: ${preferredNearWhite}`);
console.log('');

// Test if preferred meets requirements
const meetsUI = meetsContrast(preferredNearWhite, forestGreen, 'AA', 'ui');
console.log(`Does preferred (#fafafa) meet UI requirements? ${meetsUI ? '✅ YES' : '❌ NO'}`);

// Generate the text color
const generated = generateTextColor(forestGreen, preferredNearWhite, 'AA', 'ui');
console.log(`Generated text color: ${generated}`);
console.log('');

if (generated === '#000000') {
  console.log('❌ BUG: Black was chosen even though near-white meets UI requirements!');
} else if (generated === '#ffffff' || generated === preferredNearWhite) {
  console.log('✅ CORRECT: White/near-white was chosen as expected');
} else {
  console.log(`🤔 UNEXPECTED: Got ${generated}`);
}