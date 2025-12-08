import type { Meta, StoryObj } from '@storybook/react';
import React, { useState, useEffect, useRef } from 'react';
import themeManifest from '../../dist/theme-manifest.json';
import './ThemeExplorer.stories.css';

// Extend window to include theme API
declare global {
  interface Window {
    __claudeFlowTheme?: {
      applyThemeToElement: (element: HTMLElement, theme: string, type?: 'light' | 'dark' | 'auto') => Promise<boolean>;
      loadTheme: (theme: string, type?: 'light' | 'dark' | 'auto') => Promise<boolean>;
    };
  }
}

// Get theme card styles as a string
const getThemeCardStyles = () => `
  /* Base reset for Shadow DOM */
  * {
    box-sizing: border-box;
  }
  
  button {
    font-family: inherit;
    line-height: 1;
    cursor: pointer;
    white-space: nowrap;
    text-decoration: none;
    border: none;
    margin: 0;
  }
  
  input {
    font-family: inherit;
    line-height: var(--line-height);
    margin: 0;
  }
  
  /* Define layer order */
  @layer base, overrides;
  
  @layer overrides {
  .theme-content {
    position: relative;
    background: 
      var(--gradient-body-primary),
      var(--color-panel-background);
    border: 2px solid var(--color-panel-border);
    border-radius: var(--radius-container);
    padding: var(--spacing);
    transition: background var(--duration-normal) var(--easing-default),
                border-color var(--duration-normal) var(--easing-default),
                box-shadow var(--duration-normal) var(--easing-default);
    cursor: pointer;
    overflow: hidden;
  }
  
  .theme-content:hover {
    background: 
      var(--gradient-body-accent),
      var(--color-panel-background);
    border-color: var(--color-panel-border-hover);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
  
  .theme-content.active {
    border-color: var(--color-primary-background);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary-background) 20%, transparent);
  }
  
  .active-badge {
    position: absolute;
    top: 0;
    right: 0;
    height: 20px;
    background: var(--color-primary-background);
    color: var(--color-primary-text);
    padding: 0 var(--spacing);
    border-radius: 0 0 0 var(--radius-medium);
    font-size: var(--font-size-smallest);
    font-weight: var(--font-weight-medium);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    display: flex;
    align-items: center;
  }
  
  .theme-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-small20);
    width: 100%;
  }
  
  .theme-header h3 {
    margin: 0;
    font-size: var(--font-size-large10);
    color: var(--color-panel-text);
    flex: 1;
  }
  
  .theme-toggle {
    display: flex;
    align-items: center;
    gap: var(--spacing-small10);
    flex-shrink: 0;
  }
  
  .theme-toggle {
    display: flex;
    align-items: center;
    gap: var(--spacing-small10);
  }
  
  .toggle-label {
    font-size: var(--font-size-small20);
    color: var(--color-panel-textSoft20);
  }
  
  .toggle-switch {
    position: relative;
    width: 48px;
    height: 24px;
    background: var(--color-neutral-background);
    border: 1px solid var(--color-neutral-border);
    border-radius: 12px;
    cursor: pointer;
    transition: background-color var(--duration-normal) var(--easing-default),
                border-color var(--duration-normal) var(--easing-default);
  }
  
  .toggle-switch.dark {
    background: var(--color-primary-background);
    border-color: var(--color-primary-border);
  }
  
  .toggle-slider {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 18px;
    height: 18px;
    background: var(--color-neutral-text);
    border-radius: 50%;
    transition: transform var(--duration-normal) var(--easing-default),
                background var(--duration-normal) var(--easing-default);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }
  
  .toggle-switch.dark .toggle-slider {
    transform: translateX(24px);
    background: var(--color-primary-text);
  }
  
  .theme-description {
    font-size: var(--font-size-small20);
    color: var(--color-panel-textSoft20);
    margin: 0 0 var(--spacing-small10) 0;
    line-height: var(--line-height-normal);
  }
  
  .theme-preview {
    /* Removed the panel - components render directly */
  }
  
  .preview-components {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-small10);
    align-items: stretch;
  }
  
  .preview-buttons {
    display: flex;
    gap: var(--spacing-small10);
    align-items: center;
    flex-wrap: wrap;
  }

  .preview-button {
    height: 32px;
    padding: 0 var(--spacing-small10);
    border: none;
    border-radius: var(--radius-interactive);
    font-size: var(--font-size-small20);
    cursor: pointer;
    transition: background-color var(--duration-normal) var(--easing-default),
                color var(--duration-normal) var(--easing-default),
                box-shadow var(--duration-normal) var(--easing-default);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  
  .preview-button-primary {
    background: var(--color-primary-background) !important;
    color: var(--color-primary-text) !important;
  }
  
  .preview-button-primary:hover {
    background: var(--color-primary-background-hover) !important;
    color: var(--color-primary-text-hover) !important;
  }
  
  .preview-button-primary:active {
    background: var(--color-primary-background-active) !important;
    color: var(--color-primary-text-active) !important;
  }
  
  .preview-button-neutral {
    background: var(--color-neutral-background) !important;
    color: var(--color-neutral-text) !important;
  }
  
  .preview-button-neutral:hover {
    background: var(--color-neutral-background-hover) !important;
    color: var(--color-neutral-text-hover) !important;
  }
  
  .preview-button-neutral:active {
    background: var(--color-neutral-background-active) !important;
    color: var(--color-neutral-text-active) !important;
  }
  
  .preview-button-outline {
    background: transparent !important;
    color: var(--color-neutral-text) !important;
    border: 1px solid var(--color-neutral-border) !important;
  }
  
  .preview-button-outline:hover {
    background: var(--color-panel-background) !important;
    color: var(--color-neutral-text-hover) !important;
    border-color: var(--color-neutral-border-hover) !important;
  }
  
  .preview-button-outline:active {
    background: var(--color-panel-background) !important;
    color: var(--color-neutral-text-active) !important;
    border-color: var(--color-neutral-border-active) !important;
  }
  
  .preview-link {
    color: var(--color-panel-link);
    text-decoration: none;
    font-size: var(--font-size-small10);
  }
  
  .preview-link:hover {
    color: var(--color-panel-link-hover);
    text-decoration: underline;
  }
  
  .preview-surface {
    background: var(--color-panel-background);
    border: 1px solid var(--color-panel-border);
    border-radius: var(--radius-container);
    padding: var(--spacing-small10);
    font-size: var(--font-size-small20);
    color: var(--color-panel-text);
  }
  
  .preview-input-group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-small20);
    width: 100%;
  }
  
  .preview-label {
    font-size: var(--font-size-small20);
    font-weight: var(--font-weight-medium);
    color: var(--color-panel-text);
  }
  
  .preview-input {
    height: 32px;
    padding: 0 var(--spacing-small10);
    background: var(--color-input-background);
    color: var(--color-input-text);
    border: 1px solid var(--color-input-border);
    border-radius: var(--radius-interactive);
    font-size: var(--font-size-small20);
    transition: background-color var(--duration-normal) var(--easing-default),
                border-color var(--duration-normal) var(--easing-default),
                outline var(--duration-normal) var(--easing-default);
    width: 100%;
    box-sizing: border-box;
  }
  
  .preview-input::placeholder {
    color: var(--color-input-textSoft20);
  }
  
  .preview-input:focus {
    outline: none;
    border-color: var(--color-input-border-focus);
    background: var(--color-input-background-focus);
  }
  
  .preview-controls {
    display: flex;
    gap: var(--spacing);
    align-items: center;
  }

  /* Switch Styles - matching ui-kit-react */
  .preview-switch {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-small10);
    cursor: pointer;
    user-select: none;
  }

  .preview-switch-input {
    position: absolute;
    width: 0;
    height: 0;
    opacity: 0;
  }

  .preview-switch-slider {
    position: relative;
    display: inline-block;
    width: 44px;
    height: 24px;
    background: var(--color-body-border);
    border-radius: var(--radius-round);
    transition: all var(--duration) var(--easing-default);
    flex-shrink: 0;
  }

  .preview-switch:hover .preview-switch-input:not(:checked) + .preview-switch-slider {
    background: var(--color-body-border-hover);
  }

  .preview-switch-input:checked + .preview-switch-slider {
    background: var(--color-primary-background);
  }

  .preview-switch:hover .preview-switch-input:checked + .preview-switch-slider {
    background: var(--color-primary-background-hover);
  }

  /* Thumb element */
  .preview-switch-thumb {
    position: absolute;
    width: 20px;
    height: 20px;
    top: 2px;
    left: 2px;
    background: var(--color-body-background);
    border-radius: var(--radius-round);
    transition: transform var(--duration) var(--easing-bounce);
    box-shadow: var(--shadow-small10);
  }

  .preview-switch-input:checked + .preview-switch-slider .preview-switch-thumb {
    transform: translateX(20px);
  }

  .preview-switch-label {
    font-size: var(--font-size-normal);
    color: var(--color-body-text);
    white-space: nowrap;
  }

  /* Checkbox Styles - matching ui-kit-react */
  .preview-checkbox {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-small10);
    cursor: pointer;
    user-select: none;
  }

  .preview-checkbox-input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  .preview-checkbox-mark {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    background: var(--color-input-background);
    border: 2px solid var(--color-input-border);
    border-radius: var(--radius-slight);
    transition: all var(--duration) var(--easing-default);
  }

  .preview-checkbox:hover .preview-checkbox-mark {
    border-color: var(--color-input-border-hover);
    background: var(--color-input-background-hover);
  }

  .preview-checkbox-input:checked + .preview-checkbox-mark {
    background: var(--color-primary-background);
    border-color: var(--color-primary-border);
  }

  .preview-checkbox-input:checked:hover + .preview-checkbox-mark {
    background: var(--color-primary-background-hover);
    border-color: var(--color-primary-border-hover);
  }

  /* Checkmark using SVG for better control */
  .preview-checkbox-mark::after {
    content: '';
    position: absolute;
    width: 12px;
    height: 12px;
    opacity: 0;
    transform: scale(0);
    transition: all var(--duration) var(--easing-bounce);
    /* Create checkmark with CSS */
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath fill='none' stroke='white' stroke-width='2' d='M2 6l3 3 5-6'/%3E%3C/svg%3E");
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
  }

  .preview-checkbox-input:checked + .preview-checkbox-mark::after {
    opacity: 1;
    transform: scale(1);
  }

  .preview-checkbox-label {
    font-size: var(--font-size-normal);
    color: var(--color-body-text);
    white-space: nowrap;
  }
  
  .preview-spinner-progress {
    display: flex;
    gap: var(--spacing);
    align-items: center;
  }

  .preview-spinner {
    width: 24px;
    height: 24px;
    border: 3px solid var(--color-panel-border);
    border-top-color: var(--color-primary-background);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    flex-shrink: 0;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .preview-progress-bar {
    flex: 1;
    height: 8px;
    background: var(--color-panel-background);
    border: 1px solid var(--color-panel-border);
    border-radius: 4px;
    overflow: hidden;
    position: relative;
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
  }
  
  .preview-progress-fill {
    height: 100%;
    background: var(--color-primary-background);
    border-radius: 3px;
    transition: width var(--duration-normal) var(--easing-default),
                background-color var(--duration-normal) var(--easing-default);
    position: relative;
    overflow: hidden;
  }
  
  .preview-progress-fill::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.3) 50%,
      transparent 100%
    );
    width: 200%;
    animation: shimmer 2s infinite;
  }
  
  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
  } /* End @layer overrides */
`;

// Theme Card Component with Shadow DOM isolation
const ThemeCard: React.FC<{
  theme: ThemeInfo;
  isActive: boolean;
  onClick: () => void;
  globalDarkMode: boolean;
}> = ({ theme, isActive, onClick, globalDarkMode }) => {
  const [isDark, setIsDark] = useState(globalDarkMode);
  const containerRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<ShadowRoot | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Update dark mode when global prop changes
  useEffect(() => {
    setIsDark(globalDarkMode);
  }, [globalDarkMode]);

  // Create shadow DOM and initial setup
  useEffect(() => {
    if (containerRef.current && !shadowRef.current) {
      // Create shadow root
      shadowRef.current = containerRef.current.attachShadow({ mode: 'open' });
      
      // Create wrapper structure
      const wrapper = document.createElement('div');
      wrapper.className = 'theme-card-shadow-wrapper';
      wrapper.setAttribute('data-theme', theme.id);
      wrapper.setAttribute('data-theme-type', 'light');
      
      wrapper.innerHTML = `
        <div class="theme-content ${isActive ? 'active' : ''}">
          ${isActive ? '<div class="active-badge">Active</div>' : ''}
          
          <div class="theme-header">
            <h3>${theme.name}</h3>
          </div>
          
          <p class="theme-description">${theme.description}</p>
          
          <div class="theme-preview">
            <div class="preview-components">
              <div class="preview-buttons">
                <button class="preview-button preview-button-primary">Primary</button>
                <button class="preview-button preview-button-neutral">Neutral</button>
                <button class="preview-button preview-button-outline">Outline</button>
              </div>
              <div class="preview-controls">
                <label class="preview-switch">
                  <input type="checkbox" class="preview-switch-input" checked>
                  <span class="preview-switch-slider">
                    <span class="preview-switch-thumb"></span>
                  </span>
                  <span class="preview-switch-label">Switch</span>
                </label>
                <label class="preview-checkbox">
                  <input type="checkbox" class="preview-checkbox-input" checked>
                  <span class="preview-checkbox-mark"></span>
                  <span class="preview-checkbox-label">Checkbox</span>
                </label>
              </div>
              <div class="preview-input-group">
                <label for="theme-input-${theme.id}" class="preview-label">Label</label>
                <input type="text" id="theme-input-${theme.id}" class="preview-input" placeholder="Placeholder text">
              </div>
              <div class="preview-spinner-progress">
                <div class="preview-spinner"></div>
                <div class="preview-progress-bar">
                  <div class="preview-progress-fill" style="width: 65%"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      
      shadowRef.current.appendChild(wrapper);
    }
  }, []);
  
  // Add event listeners
  useEffect(() => {
    if (shadowRef.current) {
      const content = shadowRef.current.querySelector('.theme-content');
      
      const handleCardClick = (e: Event) => {
        onClick();
      };
      
      // Add event listeners
      if (content) {
        content.addEventListener('click', handleCardClick);
      }
      
      // Cleanup
      return () => {
        if (content) {
          content.removeEventListener('click', handleCardClick);
        }
      };
    }
  }, [onClick]);

  // Update active state
  useEffect(() => {
    if (shadowRef.current) {
      const content = shadowRef.current.querySelector('.theme-content');
      const activeBadge = shadowRef.current.querySelector('.active-badge');
      
      if (content) {
        if (isActive) {
          content.classList.add('active');
          // Add active badge if it doesn't exist
          if (!activeBadge) {
            const badge = document.createElement('div');
            badge.className = 'active-badge';
            badge.textContent = 'Active';
            content.insertBefore(badge, content.firstChild);
          }
        } else {
          content.classList.remove('active');
          // Remove active badge if it exists
          if (activeBadge) {
            activeBadge.remove();
          }
        }
      }
    }
  }, [isActive]);

  // Load theme CSS into shadow DOM
  useEffect(() => {
    if (shadowRef.current) {
      const loadThemeInShadow = async () => {
        setIsLoading(true);
        const themeType = isDark ? 'dark' : 'light';
        const themeFile = `${theme.id}-${themeType}`;
        const themeKey = `${theme.id}-${themeType}`;
        
        try {
          // Ensure base styles are loaded first
          let baseStyles = shadowRef.current!.querySelector('link[data-base-styles]') as HTMLLinkElement;
          if (!baseStyles) {
            baseStyles = document.createElement('link');
            baseStyles.rel = 'stylesheet';
            baseStyles.href = './styles.css';
            baseStyles.setAttribute('data-base-styles', 'true');
            await new Promise((resolve, reject) => {
              baseStyles.onload = resolve;
              baseStyles.onerror = reject;
              shadowRef.current!.appendChild(baseStyles);
            });
          }
          
          // Check if theme link already exists
          let themeLink = shadowRef.current!.querySelector(`link[data-theme-key="${themeKey}"]`) as HTMLLinkElement;
          
          if (!themeLink) {
            // Add theme-specific CSS
            themeLink = document.createElement('link');
            themeLink.rel = 'stylesheet';
            themeLink.href = `./themes/${themeFile}.css`;
            themeLink.setAttribute('data-theme-file', themeFile);
            themeLink.setAttribute('data-theme-key', themeKey);
            
            // Wait for theme to load
            await new Promise((resolve, reject) => {
              themeLink.onload = resolve;
              themeLink.onerror = reject;
              shadowRef.current!.appendChild(themeLink);
            });
          }
          
          // Enable only the current theme link
          shadowRef.current!.querySelectorAll('link[data-theme-key]').forEach((link: any) => {
            link.disabled = link.getAttribute('data-theme-key') !== themeKey;
          });
          
          // Ensure component styles are applied
          if (shadowRef.current!.adoptedStyleSheets.length === 0) {
            const styleSheet = new CSSStyleSheet();
            const styles = getThemeCardStyles();
            await styleSheet.replace(styles);
            shadowRef.current!.adoptedStyleSheets = [styleSheet];
          }
          
          // Update wrapper attributes
          const wrapper = shadowRef.current!.querySelector('.theme-card-shadow-wrapper');
          if (wrapper) {
            wrapper.setAttribute('data-theme', theme.id);
            wrapper.setAttribute('data-theme-type', themeType);
          }
          
          setIsLoading(false);
        } catch (error) {
          console.error(`Failed to load theme ${themeFile}:`, error);
          setIsLoading(false);
        }
      };
      
      loadThemeInShadow();
    }
  }, [theme.id, isDark]);

  return (
    <div 
      ref={containerRef}
      className={`theme-card-container ${isActive ? 'active' : ''}`}
      style={{ opacity: isLoading ? 0.7 : 1 }}
    />
  );
};

type ThemeInfo = {
  name: string;
  id: string;
  description: string;
};

// Main Theme Explorer Component
const ThemeExplorer: React.FC = () => {
  const [activeTheme, setActiveTheme] = useState('default');
  const [globalDarkMode, setGlobalDarkMode] = useState(() => {
    // Initialize from localStorage
    const stored = localStorage.getItem('theme-explorer-dark-mode');
    return stored === 'true';
  });

  const availableThemes: ThemeInfo[] = themeManifest.themes.map(theme => ({
    id: theme.id,
    name: theme.name,
    description: theme.description,
  }));

  // Save dark mode preference to localStorage
  useEffect(() => {
    localStorage.setItem('theme-explorer-dark-mode', globalDarkMode.toString());
  }, [globalDarkMode]);
  
  // Ensure base styles are loaded and preload all themes
  useEffect(() => {
    // Set the base path for theme files to override the default logic
    (window as any).__uiKitBasePath = '';
    
    // Check if base styles link exists
    const baseStylesId = 'ui-kit-base-styles';
    if (!document.getElementById(baseStylesId)) {
      const baseLink = document.createElement('link');
      baseLink.id = baseStylesId;
      baseLink.rel = 'stylesheet';
      baseLink.href = './styles.css';
      document.head.appendChild(baseLink);
    }
    
    // Preload all themes in the background for instant switching
    const preloadThemes = async () => {
      const preloadPromises: Promise<void>[] = [];
      
      for (const theme of availableThemes) {
        for (const mode of ['light', 'dark']) {
          const themeKey = `${theme.id}-${mode}`;
          const existingLink = document.querySelector(`link[data-theme-key="${themeKey}"]`);
          
          if (!existingLink) {
            preloadPromises.push(
              new Promise<void>((resolve) => {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = `./themes/${themeKey}.css`;
                link.setAttribute('data-theme-css', 'true');
                link.setAttribute('data-theme-key', themeKey);
                link.disabled = true; // Keep disabled until needed
                
                link.onload = () => resolve();
                link.onerror = () => {
                  console.warn(`Failed to preload theme: ${themeKey}`);
                  resolve();
                };
                
                document.head.appendChild(link);
              })
            );
          }
        }
      }
      
      await Promise.all(preloadPromises);
      console.log('All themes preloaded for Theme Explorer');
    };
    
    preloadThemes();
  }, [availableThemes]);
  
  // Load default theme on mount
  useEffect(() => {
    handleThemeSelect('default');
  }, []);

  const handleThemeSelect = async (themeId: string) => {
    setActiveTheme(themeId);
    
    // Apply theme to the root document
    document.documentElement.setAttribute('data-theme', themeId);
    
    // Load the theme CSS at document level using disable/enable approach
    const isDarkMode = document.documentElement.getAttribute('data-theme-type') === 'dark';
    const themeType = isDarkMode ? 'dark' : 'light';
    const themeFile = `${themeId}-${themeType}`;
    const themeKey = `${themeId}-${themeType}`;
    
    // Check if theme already exists
    let themeLink = document.querySelector(`link[data-theme-key="${themeKey}"]`) as HTMLLinkElement;
    
    if (!themeLink) {
      // Add new theme link (disabled initially for smooth transition)
      themeLink = document.createElement('link');
      themeLink.rel = 'stylesheet';
      themeLink.href = `./themes/${themeFile}.css`;
      themeLink.setAttribute('data-theme-css', 'true');
      themeLink.setAttribute('data-theme-key', themeKey);
      themeLink.disabled = true;
      
      // Wait for the theme to load
      await new Promise((resolve, reject) => {
        themeLink.onload = resolve;
        themeLink.onerror = reject;
        document.head.appendChild(themeLink);
      });
    }
    
    // Disable all theme links except the current one
    document.querySelectorAll('link[data-theme-css]').forEach((link: any) => {
      link.disabled = link.getAttribute('data-theme-key') !== themeKey;
    });
  };

  return (
    <div className="theme-explorer">
      <header className="explorer-header">
        <div className="explorer-header-content">
          <div className="explorer-header-text">
            <h2>Theme Explorer</h2>
            <p>Explore all available themes. Each theme card shows its unique color scheme with synchronized light/dark mode.</p>
          </div>
          <div className="global-theme-toggle">
            <span className="toggle-label">Light</span>
            <div 
              className={`toggle-switch ${globalDarkMode ? 'dark' : ''}`}
              onClick={() => setGlobalDarkMode(!globalDarkMode)}
            >
              <div className="toggle-slider"></div>
            </div>
            <span className="toggle-label">Dark</span>
          </div>
        </div>
      </header>

      <div className="themes-grid">
        {availableThemes.map(theme => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            isActive={activeTheme === theme.id}
            onClick={() => handleThemeSelect(theme.id)}
            globalDarkMode={globalDarkMode}
          />
        ))}
      </div>

      <section className="current-theme-info">
        <h2>Current Active Theme</h2>
        <div className="active-theme-details">
          <p>
            <strong>Theme:</strong> {availableThemes.find(t => t.id === activeTheme)?.name || activeTheme}
          </p>
          <p className="theme-note">
            Click on any theme card above to set it as the active theme for the entire Storybook.
            Use the toggle switch within each card to preview that specific theme in light or dark mode.
          </p>
        </div>
      </section>
    </div>
  );
};

const meta: Meta<typeof ThemeExplorer> = {
  title: 'Theme Explorer',
  component: ThemeExplorer,
  parameters: {
    layout: 'fullscreen',
    docs: {
      page: null,
    },
    viewMode: 'story',
    previewTabs: {
      'storybook/docs/panel': { hidden: true },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Single story to render at component level
export const ThemeExplorerStory = () => <ThemeExplorer />;
ThemeExplorerStory.storyName = 'Theme Explorer';