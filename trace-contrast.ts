import { generateTextColor, meetsContrast } from './packages/ui-kit/src/theme-generator/accessibility.js';

// Simulate what happens when resolving primary.text for forest theme
const forestPrimary600 = '#5c8a61';
const preferredLight = '#fafafa'; // From auto function for light mode

console.log('Tracing Forest Theme Primary Text Generation:');
console.log('=============================================');
console.log(`Step 1: Resolve background from primary.600: ${forestPrimary600}`);
console.log(`Step 2: Get preferred color from auto function: ${preferredLight}`);
console.log(`Step 3: Call generateTextColor with textSize='ui'`);
console.log('');

// This is what should happen in resolveContrastFunction
const result = generateTextColor(forestPrimary600, preferredLight, 'AA', 'ui');

console.log(`Result: ${result}`);
console.log('');

// Check if the preferred color meets UI requirements
const meetsUIReq = meetsContrast(preferredLight, forestPrimary600, 'AA', 'ui');
console.log(`Does ${preferredLight} meet UI requirements? ${meetsUIReq ? '✅ YES' : '❌ NO'}`);

// Check the actual contrast ratios
import { getContrastRatio } from './packages/ui-kit/src/theme-generator/utilities/getContrastRatio.js';
const nearWhiteRatio = getContrastRatio(preferredLight, forestPrimary600);
const blackRatio = getContrastRatio('#000000', forestPrimary600);

console.log('');
console.log('Contrast Ratios:');
console.log(`  Near-white (#fafafa): ${nearWhiteRatio.toFixed(2)}:1`);
console.log(`  Black (#000000): ${blackRatio.toFixed(2)}:1`);
console.log('');
console.log('UI requirement is 3.0:1');
console.log(`Near-white ${nearWhiteRatio >= 3.0 ? 'PASSES ✅' : 'FAILS ❌'}`);

if (result === '#fafafa') {
  console.log('');
  console.log('✅ CORRECT: generateTextColor returned near-white as expected');
} else {
  console.log('');
  console.log(`❌ BUG: generateTextColor returned ${result} instead of ${preferredLight}`);
}