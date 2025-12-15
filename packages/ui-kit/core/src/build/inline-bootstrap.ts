/**
 * UIKit Inline Bootstrap Generator
 *
 * Generates inline HTML (CSS + JS) for zero-flash theme loading.
 * Safe to import in Node.js (no browser APIs).
 */

export interface InlineBootstrapOptions {
  /** Base path to theme CSS files */
  basePath?: string;
  /** Default theme name */
  defaultTheme?: string;
  /** Default colors for flash prevention (before theme CSS loads) */
  defaultColors?: {
    light: { pageBg: string; pageText: string };
    dark: { pageBg: string; pageText: string };
  };
}

const DEFAULT_COLORS = {
  light: { pageBg: '#fafafa', pageText: '#171717' },
  dark: { pageBg: '#0f0f0f', pageText: '#e5e5e5' },
};

/**
 * Generate the fallback CSS that defines critical CSS variables.
 * This ensures var(--page-bg) etc. work before theme CSS loads.
 */
function generateFallbackCSS(colors = DEFAULT_COLORS): string {
  return `:root{--page-bg:${colors.light.pageBg};--page-text:${colors.light.pageText}}@media(prefers-color-scheme:dark){:root{--page-bg:${colors.dark.pageBg};--page-text:${colors.dark.pageText}}}`;
}

/**
 * Generate the bootstrap script source code.
 * Handles: theme detection, CSS caching, theme loading, UIKit API.
 */
function generateBootstrapScript(options: InlineBootstrapOptions = {}): string {
  const {
    basePath = '/themes',
    defaultTheme = 'default',
    defaultColors = DEFAULT_COLORS,
  } = options;

  return `(function(){
var STORAGE='uikit-theme',CACHE='uikit-css-cache';
var d=document.documentElement,s,c,m,r,k;
try{s=JSON.parse(localStorage.getItem(STORAGE))}catch(e){}
try{c=JSON.parse(localStorage.getItem(CACHE))}catch(e){}
m=(s&&s.mode)||'auto';
r=m==='auto'?(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'):m;
var th=(s&&s.theme)||'${defaultTheme}';
if(!s&&matchMedia('(prefers-contrast:more)').matches)th='high-contrast';
k=th+'-'+r;
d.dataset.theme=th;
d.dataset.mode=r;

// Inject cached CSS immediately if available (zero flash on repeat visits)
var fb=document.getElementById('uikit-fallback');
if(c&&c[k]){
  var style=document.createElement('style');
  style.id='uikit-cached-'+k;
  style.textContent=c[k];
  document.head.appendChild(style);
  if(fb)fb.remove();
}

// Track state
var theme=th,mode=m,resolvedMode=r;
var loadedCSS=new Map();
var subscribers=new Set();

// Load CSS and cache it
function loadCSS(th,md,cb){
  var key=th+'-'+md;
  if(loadedCSS.has(key)){if(cb)cb();return}
  var link=document.createElement('link');
  link.rel='stylesheet';
  link.href='${basePath}/'+key+'.css';
  link.id='uikit-theme-'+key;
  link.onload=function(){
    loadedCSS.set(key,link);
    var fb=document.getElementById('uikit-fallback');
    if(fb)fb.remove();
    // Cache CSS for next time
    fetch(link.href).then(function(r){return r.text()}).then(function(css){
      try{
        var cache=JSON.parse(localStorage.getItem(CACHE)||'{}');
        cache[key]=css;
        localStorage.setItem(CACHE,JSON.stringify(cache));
      }catch(e){}
    });
    if(cb)cb();
  };
  document.head.appendChild(link);
}

// Load initial theme CSS
loadCSS(theme,resolvedMode);

// UIKit API
window.UIKit={
  setTheme:function(newTheme,newMode,callback){
    newMode=newMode||mode;
    var newResolved=newMode==='auto'?(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'):newMode;
    loadCSS(newTheme,newResolved,function(){
      theme=newTheme;mode=newMode;resolvedMode=newResolved;
      d.dataset.theme=theme;d.dataset.mode=resolvedMode;
      try{
        var obj=JSON.parse(localStorage.getItem(STORAGE)||'{}');
        obj.theme=theme;obj.mode=mode;
        localStorage.setItem(STORAGE,JSON.stringify(obj));
      }catch(e){}
      var state={theme:theme,mode:mode,resolvedMode:resolvedMode};
      subscribers.forEach(function(cb){cb(state)});
      if(callback)callback(state);
    });
  },
  getTheme:function(){return{theme:theme,mode:mode,resolvedMode:resolvedMode}},
  subscribe:function(cb){subscribers.add(cb);return function(){subscribers.delete(cb)}}
};

// Listen for system theme changes
matchMedia('(prefers-color-scheme:dark)').addEventListener('change',function(){
  if(mode==='auto')UIKit.setTheme(theme,'auto');
});
})();`;
}

/**
 * Simple minification for inline code.
 */
function minify(code: string): string {
  return code
    .replace(/\/\/.*$/gm, '') // Remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
    .replace(/\s+/g, ' ') // Collapse whitespace
    .replace(/\s*([{}();,:])\s*/g, '$1') // Remove space around punctuation
    .replace(/\s*=\s*(?!=)/g, '=') // Remove space around =
    .replace(/\s*(===?|!==?|[<>]=?|\|\||&&)\s*/g, '$1') // Remove space around operators
    .trim();
}

/**
 * Generate the complete inline bootstrap HTML (CSS + JS) for embedding.
 * This should be injected right after <head> opens.
 */
export function getInlineBootstrap(options: InlineBootstrapOptions = {}): string {
  const css = generateFallbackCSS(options.defaultColors);
  const js = minify(generateBootstrapScript(options));
  return `<style id="uikit-fallback">${css}</style><script>${js}</script>`;
}

/**
 * Generate formatted (non-minified) bootstrap for debugging.
 */
export function getInlineBootstrapPretty(options: InlineBootstrapOptions = {}): string {
  const css = generateFallbackCSS(options.defaultColors);
  const js = generateBootstrapScript(options);
  return `<style id="uikit-fallback">\n${css}\n</style>\n<script>\n${js}\n</script>`;
}

/**
 * Get just the fallback CSS (for use in static HTML).
 */
export function getFallbackCSS(options?: { colors?: typeof DEFAULT_COLORS }): string {
  return generateFallbackCSS(options?.colors);
}

/**
 * Get just the bootstrap script (without CSS).
 */
export function getBootstrapScript(options: InlineBootstrapOptions = {}): string {
  return minify(generateBootstrapScript(options));
}
