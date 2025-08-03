import { base } from './configs/base.js';
import { node } from './configs/node.js';
import { react } from './configs/react.js';

export const eslintConfig = {
  base,
  node,
  react,
};

// For backward compatibility
export { base } from './configs/base.js';
export { node } from './configs/node.js';
export { react } from './configs/react.js';
