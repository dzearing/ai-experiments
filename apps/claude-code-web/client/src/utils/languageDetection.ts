/**
 * Language detection utility for syntax highlighting.
 * Maps file extensions to Prism language names.
 */

/**
 * Mapping of file extensions to Prism language identifiers.
 */
const EXTENSION_MAP: Record<string, string> = {
  // JavaScript/TypeScript
  js: 'javascript',
  jsx: 'jsx',
  ts: 'typescript',
  tsx: 'tsx',
  mjs: 'javascript',
  cjs: 'javascript',

  // Web
  html: 'html',
  htm: 'html',
  css: 'css',
  scss: 'scss',
  sass: 'scss',
  less: 'less',
  json: 'json',
  xml: 'xml',
  svg: 'xml',

  // Backend languages
  py: 'python',
  rb: 'ruby',
  go: 'go',
  rs: 'rust',
  java: 'java',
  kt: 'kotlin',
  c: 'c',
  cpp: 'cpp',
  cc: 'cpp',
  h: 'c',
  hpp: 'cpp',
  cs: 'csharp',
  swift: 'swift',
  php: 'php',

  // Config files
  yaml: 'yaml',
  yml: 'yaml',
  toml: 'toml',
  ini: 'ini',
  env: 'bash',
  conf: 'bash',

  // Documentation
  md: 'markdown',
  mdx: 'markdown',
  txt: 'plaintext',

  // Shell
  sh: 'bash',
  bash: 'bash',
  zsh: 'bash',
  fish: 'bash',
  ps1: 'powershell',
  psm1: 'powershell',
  bat: 'batch',
  cmd: 'batch',

  // Data/Query languages
  sql: 'sql',
  graphql: 'graphql',
  gql: 'graphql',

  // Other
  dockerfile: 'docker',
  makefile: 'makefile',
  cmake: 'cmake',
  diff: 'diff',
  patch: 'diff',
};

/**
 * Detects the programming language from a file path for syntax highlighting.
 *
 * @param filePath - The file path or filename to detect language from
 * @returns Prism language identifier, defaults to 'plaintext' for unknown extensions
 */
export function detectLanguage(filePath: string): string {
  // Extract extension from path
  const lastDot = filePath.lastIndexOf('.');
  const lastSlash = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));

  // Handle special filenames without extensions
  const filename = filePath.slice(lastSlash + 1).toLowerCase();

  // Check special filenames first
  if (filename === 'dockerfile' || filename.startsWith('dockerfile.')) {
    return 'docker';
  }

  if (filename === 'makefile' || filename === 'gnumakefile') {
    return 'makefile';
  }

  if (filename === 'cmakelists.txt') {
    return 'cmake';
  }

  // Handle files without extension or with extension before path separator
  if (lastDot <= lastSlash) {
    return 'plaintext';
  }

  const ext = filePath.slice(lastDot + 1).toLowerCase();

  return EXTENSION_MAP[ext] || 'plaintext';
}
