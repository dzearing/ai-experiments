/**
 * TypeScript declarations for the theme-preview custom element
 */

declare namespace JSX {
  interface IntrinsicElements {
    'theme-preview': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      theme?: string;
      mode?: 'light' | 'dark';
    }, HTMLElement>;
  }
}