/**
 * Zero-flash bootstrap script
 *
 * This script should be inlined in the <head> to prevent flash of unstyled content.
 */

/**
 * Get the bootstrap script as a string for inlining
 */
export function getBootstrapScript(options: {
  themesPath?: string;
  defaultTheme?: string;
} = {}): string {
  const { themesPath = '/themes', defaultTheme = 'default' } = options;

  // This is the minified version of the bootstrap logic
  return `(function(){var s=null;try{s=JSON.parse(localStorage.getItem('uikit-theme'))}catch(e){}var t=(s&&s.theme)||'${defaultTheme}';var m=(s&&s.mode)||'auto';if(m==='auto'){m=matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'}if(!s&&matchMedia('(prefers-contrast:more)').matches){t='high-contrast'}document.documentElement.dataset.theme=t;document.documentElement.dataset.mode=m;var l=document.createElement('link');l.rel='stylesheet';l.href='${themesPath}/'+t+'-'+m+'.css';document.head.appendChild(l)})()`;
}

/**
 * Get the bootstrap script with formatting for readability
 */
export function getBootstrapScriptPretty(options: {
  themesPath?: string;
  defaultTheme?: string;
} = {}): string {
  const { themesPath = '/themes', defaultTheme = 'default' } = options;

  return `(function() {
  var stored = null;
  try {
    stored = JSON.parse(localStorage.getItem('uikit-theme'));
  } catch(e) {}

  var theme = (stored && stored.theme) || '${defaultTheme}';
  var mode = (stored && stored.mode) || 'auto';

  if (mode === 'auto') {
    mode = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  // Check for high-contrast preference
  if (!stored && matchMedia('(prefers-contrast: more)').matches) {
    theme = 'high-contrast';
  }

  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.mode = mode;

  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '${themesPath}/' + theme + '-' + mode + '.css';
  document.head.appendChild(link);
})();`;
}

/**
 * Generate a complete HTML <script> tag with the bootstrap code
 */
export function getBootstrapTag(options: {
  themesPath?: string;
  defaultTheme?: string;
  minified?: boolean;
} = {}): string {
  const { minified = true, ...rest } = options;
  const script = minified ? getBootstrapScript(rest) : getBootstrapScriptPretty(rest);
  return `<script>${script}</script>`;
}
