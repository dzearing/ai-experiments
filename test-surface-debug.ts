import { surfaces } from './packages/ui-kit/src/themes/surface-definitions.js';

const primarySurface = surfaces.find(s => s.name === 'primary');

console.log('Primary Surface Definition:');
console.log('===========================');
console.log(JSON.stringify(primarySurface?.base.text, null, 2));
console.log('');

const hasContrastFn = primarySurface?.base.text && 
  typeof primarySurface.base.text === 'object' && 
  'fn' in primarySurface.base.text && 
  primarySurface.base.text.fn === 'contrast';

console.log(`Has contrast function? ${hasContrastFn ? '✅ YES' : '❌ NO'}`);

if (hasContrastFn && primarySurface?.base.text && typeof primarySurface.base.text === 'object' && 'fn' in primarySurface.base.text) {
  console.log(`Text size: ${primarySurface.base.text.args?.textSize || 'normal'}`);
}