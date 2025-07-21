// Type declarations for CSS imports

// For plain CSS files (no CSS modules)
declare module '*.css' {
  const content: never;
  export default content;
}

// For global CSS files (explicitly global styles)
declare module '*.global.css' {
  const content: never;
  export default content;
}

// Note: CSS modules (*.module.css) are handled by typed-css-modules
// which generates specific type definitions for each module