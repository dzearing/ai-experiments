import { generateScale } from './packages/ui-kit/src/theme-generator/utilities/generateScale.js';
import { getContrastRatio } from './packages/ui-kit/src/theme-generator/utilities/getContrastRatio.js';

const forestGreen = '#307e39';
const scale = generateScale(forestGreen, 11);

// Map to standard shade numbers
const shades = {
  '50': scale[0],
  '100': scale[1],
  '200': scale[2],
  '300': scale[3],
  '400': scale[4],
  '500': scale[5],
  '600': scale[6],
  '700': scale[7],
  '800': scale[8],
  '900': scale[9],
  '950': scale[10],
};

console.log('Forest Green Color Scale Analysis:');
console.log('===================================');
console.log(`Original color: ${forestGreen}`);
console.log('');

console.log('Generated shades with contrast ratios:');
console.log('Shade | Color   | vs White | vs Black | Best Text');
console.log('------|---------|----------|----------|----------');

Object.entries(shades).forEach(([shade, color]) => {
  const whiteContrast = getContrastRatio('#ffffff', color);
  const blackContrast = getContrastRatio('#000000', color);
  const bestText = whiteContrast > blackContrast ? 'White' : 'Black';
  const meetsAA = Math.max(whiteContrast, blackContrast) >= 4.5;
  
  console.log(
    `${shade.padEnd(5)} | ${color} | ${whiteContrast.toFixed(2).padStart(8)} | ${blackContrast.toFixed(2).padStart(8)} | ${bestText.padEnd(5)} ${meetsAA ? '✓' : '✗'}`
  );
});

console.log('');
console.log('Recommendation:');
console.log('===============');
console.log('The original color (#307e39) works best with white text (5.04:1)');
console.log('But it\'s being replaced with shade 600 which is too light.');
console.log('');
console.log('Better options for primary surface background:');
const goodShades = Object.entries(shades).filter(([_, color]) => {
  const ratio = getContrastRatio('#ffffff', color);
  return ratio >= 4.5;
});

goodShades.forEach(([shade, color]) => {
  const ratio = getContrastRatio('#ffffff', color);
  console.log(`  Shade ${shade}: ${color} (${ratio.toFixed(2)}:1 with white)`);
});