/**
 * ThemePreview Web Component
 * 
 * A web component that encapsulates theme styles using Shadow DOM,
 * allowing multiple themes to be displayed simultaneously without conflicts.
 */

export class ThemePreview extends HTMLElement {
  private shadow: ShadowRoot;
  private themeStylesheet: HTMLLinkElement | null = null;
  private baseStylesheet: HTMLLinkElement | null = null;
  
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }
  
  static get observedAttributes() {
    return ['theme', 'mode'];
  }
  
  connectedCallback() {
    this.loadTheme();
  }
  
  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue !== newValue && (name === 'theme' || name === 'mode')) {
      this.loadTheme();
    }
  }
  
  private async loadTheme() {
    const theme = this.getAttribute('theme') || 'default';
    const mode = this.getAttribute('mode') || 'light';
    
    // Clear existing content
    this.shadow.innerHTML = '';
    
    // Create a wrapper div that will have the theme attributes
    const wrapper = document.createElement('div');
    wrapper.setAttribute('data-theme', theme);
    wrapper.setAttribute('data-theme-type', mode);
    wrapper.className = 'theme-preview-wrapper';
    
    // Add base styles
    if (!this.baseStylesheet) {
      this.baseStylesheet = document.createElement('link');
      this.baseStylesheet.rel = 'stylesheet';
      // Use the same path structure as Storybook
      this.baseStylesheet.href = '/styles.css';
    }
    
    // Add theme-specific styles
    if (this.themeStylesheet) {
      this.themeStylesheet.remove();
    }
    
    this.themeStylesheet = document.createElement('link');
    this.themeStylesheet.rel = 'stylesheet';
    this.themeStylesheet.href = `/themes/${theme}-${mode}.css`;
    
    // Add internal styles for the wrapper
    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: block;
      }
      
      .theme-preview-wrapper {
        /* Ensure the wrapper takes full space */
        width: 100%;
        height: 100%;
        /* Apply base styles that would normally be on body */
        font-family: var(--font-family);
        font-size: var(--font-size-body);
        line-height: var(--line-height-normal);
        color: var(--color-body-text);
        background-color: var(--color-body-background);
      }
      
      /* Reset any inherited styles */
      .theme-preview-wrapper * {
        all: initial;
        font-family: inherit;
      }
    `;
    
    // Create a slot for the content
    const slot = document.createElement('slot');
    wrapper.appendChild(slot);
    
    // Add everything to shadow DOM
    this.shadow.appendChild(this.baseStylesheet.cloneNode());
    this.shadow.appendChild(this.themeStylesheet);
    this.shadow.appendChild(style);
    this.shadow.appendChild(wrapper);
  }
}

// Register the custom element
if (typeof window !== 'undefined' && !customElements.get('theme-preview')) {
  customElements.define('theme-preview', ThemePreview);
}