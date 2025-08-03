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
    font-family: var(--font-family);
    line-height: 1;
    cursor: pointer;
    white-space: nowrap;
    text-decoration: none;
    border: none;
    margin: 0;
  }
  
  input {
    font-family: var(--font-family);
    line-height: var(--line-height-normal);
    margin: 0;
  }
  
  /* Define layer order */
  @layer base, overrides;
  
  @layer overrides {
  .theme-content {
    position: relative;
    background: 
      linear-gradient(135deg, 
        color-mix(in srgb, var(--color-buttonPrimary-background) 25%, transparent) 0%, 
        transparent 50%
      ),
      var(--color-panel-background);
    border: 2px solid var(--color-panel-border);
    border-radius: var(--radius);
    padding: var(--spacing-large20);
    transition: background var(--duration) var(--easing-default),
                border-color var(--duration) var(--easing-default),
                box-shadow var(--duration) var(--easing-default);
    cursor: pointer;
    overflow: hidden;
  }
  
  .theme-content:hover {
    background: 
      linear-gradient(135deg, 
        color-mix(in srgb, var(--color-buttonPrimary-background) 30%, transparent) 0%, 
        transparent 50%
      ),
      var(--color-panel-background);
    border-color: var(--color-panel-border-hard10);
    box-shadow: var(--shadow-hard10);
  }
  
  .theme-content.active {
    border-color: var(--color-buttonPrimary-background);
    box-shadow: 0 0 0 3px var(--color-buttonPrimary-background-soft20);
  }
  
  .active-badge {
    position: absolute;
    top: 0;
    right: 0;
    height: 20px;
    background: var(--color-buttonPrimary-background);
    color: var(--color-buttonPrimary-text);
    padding: 0 var(--spacing);
    border-radius: 0 0 0 var(--radius);
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
    margin-bottom: var(--spacing);
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
    color: var(--color-panel-text-soft30);
  }
  
  .toggle-switch {
    position: relative;
    width: 48px;
    height: 24px;
    background: var(--color-panel-background-soft20);
    border: 1px solid var(--color-panel-border);
    border-radius: 12px;
    cursor: pointer;
    transition: background-color var(--duration) var(--easing-default),
                border-color var(--duration) var(--easing-default);
  }
  
  .toggle-switch.dark {
    background: var(--color-buttonPrimary-background);
    border-color: var(--color-buttonPrimary-border);
  }
  
  .toggle-slider {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 18px;
    height: 18px;
    background: var(--color-panel-background);
    border-radius: 50%;
    transition: transform var(--duration) var(--easing-default);
    box-shadow: var(--shadow-sm);
  }
  
  .toggle-switch.dark .toggle-slider {
    transform: translateX(24px);
    background: var(--color-buttonPrimary-text);
  }
  
  .theme-description {
    font-size: var(--font-size-small20);
    color: var(--color-panel-text-soft30);
    margin: 0 0 var(--spacing) 0;
    line-height: var(--line-height-normal);
  }
  
  .theme-preview {
    background: var(--color-body-background);
    border: 1px solid var(--color-body-border);
    border-radius: var(--radius-small10);
    padding: var(--spacing);
  }
  
  .preview-components {
    display: flex;
    flex-direction: column;
    gap: var(--spacing);
    align-items: stretch;
  }
  
  .preview-buttons {
    display: flex;
    gap: var(--spacing-small10);
    align-items: center;
    flex-wrap: wrap;
  }

  .preview-button {
    height: 36px;
    padding: 0 var(--spacing);
    border: none;
    border-radius: var(--radius-small10);
    font-size: var(--font-size-small10);
    cursor: pointer;
    transition: background-color var(--duration) var(--easing-default),
                color var(--duration) var(--easing-default),
                box-shadow var(--duration) var(--easing-default);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  
  .preview-button-primary {
    background: var(--color-buttonPrimary-background) !important;
    color: var(--color-buttonPrimary-text) !important;
  }
  
  .preview-button-primary:hover {
    background: var(--color-buttonPrimary-background-hover) !important;
    color: var(--color-buttonPrimary-text-hover) !important;
  }
  
  .preview-button-primary:active {
    background: var(--color-buttonPrimary-background-active) !important;
    color: var(--color-buttonPrimary-text-active) !important;
  }
  
  .preview-button-neutral {
    background: var(--color-buttonNeutral-background) !important;
    color: var(--color-buttonNeutral-text) !important;
  }
  
  .preview-button-neutral:hover {
    background: var(--color-buttonNeutral-background-hover) !important;
    color: var(--color-buttonNeutral-text-hover) !important;
  }
  
  .preview-button-neutral:active {
    background: var(--color-buttonNeutral-background-active) !important;
    color: var(--color-buttonNeutral-text-active) !important;
  }
  
  .preview-button-outline {
    background: transparent !important;
    color: var(--color-buttonSecondary-text) !important;
    border: 1px solid var(--color-buttonSecondary-border) !important;
  }
  
  .preview-button-outline:hover {
    background: var(--color-panel-background-soft10) !important;
    color: var(--color-buttonSecondary-text) !important;
    border-color: var(--color-buttonSecondary-border-hover) !important;
  }
  
  .preview-button-outline:active {
    background: var(--color-panel-background-soft20) !important;
    color: var(--color-buttonSecondary-text) !important;
    border-color: var(--color-buttonSecondary-border-active) !important;
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
    background: var(--color-panelRaised-background);
    border: 1px solid var(--color-panelRaised-border);
    border-radius: var(--radius-small10);
    padding: var(--spacing-small10);
    font-size: var(--font-size-small20);
    color: var(--color-panelRaised-text);
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
    height: 36px;
    padding: 0 var(--spacing);
    background: var(--color-input-background);
    color: var(--color-input-text);
    border: 1px solid var(--color-input-border);
    border-radius: var(--radius-small10);
    font-size: var(--font-size-small10);
    transition: background-color var(--duration) var(--easing-default),
                border-color var(--duration) var(--easing-default),
                outline var(--duration) var(--easing-default);
    width: 100%;
    box-sizing: border-box;
  }
  
  .preview-input::placeholder {
    color: var(--color-input-text-soft30);
  }
  
  .preview-input:focus {
    outline: none;
    border-color: var(--color-input-borderFocus);
    background: var(--color-input-backgroundFocus);
  }
  
  .preview-slider-group {
    width: 100%;
  }
  
  .preview-slider {
    width: 100%;
    height: 8px;
    -webkit-appearance: none;
    appearance: none;
    background: var(--color-panel-background-soft30);
    border: 1px solid var(--color-panel-border);
    border-radius: 4px;
    outline: none;
    transition: opacity var(--duration) var(--easing-default);
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
  }
  
  .preview-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    background: var(--color-buttonPrimary-background);
    border-radius: 50%;
    cursor: pointer;
    transition: background-color var(--duration) var(--easing-default),
                transform var(--duration) var(--easing-default);
  }
  
  .preview-slider::-moz-range-thumb {
    width: 18px;
    height: 18px;
    background: var(--color-buttonPrimary-background);
    border-radius: 50%;
    cursor: pointer;
    border: none;
    transition: background-color var(--duration) var(--easing-default),
                transform var(--duration) var(--easing-default);
  }
  
  .preview-slider:hover::-webkit-slider-thumb {
    background: var(--color-buttonPrimary-backgroundHover);
    transform: scale(1.1);
  }
  
  .preview-slider:hover::-moz-range-thumb {
    background: var(--color-buttonPrimary-backgroundHover);
    transform: scale(1.1);
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
    border-top-color: var(--color-buttonPrimary-background);
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
    background: var(--color-panel-background-soft30);
    border: 1px solid var(--color-panel-border);
    border-radius: 4px;
    overflow: hidden;
    position: relative;
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
  }
  
  .preview-progress-fill {
    height: 100%;
    background: var(--color-buttonPrimary-background);
    border-radius: 3px;
    transition: width var(--duration) var(--easing-default),
                background-color var(--duration) var(--easing-default);
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
}> = ({ theme, isActive, onClick }) => {
  const [isDark, setIsDark] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<ShadowRoot | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
            <div class="theme-toggle">
              <span class="toggle-label">Light</span>
              <div class="toggle-switch">
                <div class="toggle-slider"></div>
              </div>
              <span class="toggle-label">Dark</span>
            </div>
          </div>
          
          
          <p class="theme-description">${theme.description}</p>
          
          <div class="theme-preview">
            <div class="preview-components">
              <div class="preview-buttons">
                <button class="preview-button preview-button-primary">Primary</button>
                <button class="preview-button preview-button-neutral">Neutral</button>
                <button class="preview-button preview-button-outline">Outline</button>
              </div>
              <div class="preview-input-group">
                <label for="theme-input-${theme.id}" class="preview-label">Label</label>
                <input type="text" id="theme-input-${theme.id}" class="preview-input" placeholder="Placeholder text">
              </div>
              <div class="preview-slider-group">
                <input type="range" class="preview-slider" min="0" max="100" value="50">
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
      const toggle = shadowRef.current.querySelector('.theme-toggle');
      const content = shadowRef.current.querySelector('.theme-content');
      
      const handleToggle = (e: Event) => {
        e.stopPropagation();
        setIsDark(prev => !prev);
      };
      
      const handleCardClick = (e: Event) => {
        // Don't trigger if clicking on toggle
        const target = e.target as HTMLElement;
        if (!target.closest('.theme-toggle')) {
          onClick();
        }
      };
      
      // Add event listeners
      if (toggle) {
        toggle.addEventListener('click', handleToggle);
      }
      
      if (content) {
        content.addEventListener('click', handleCardClick);
      }
      
      // Cleanup
      return () => {
        if (toggle) {
          toggle.removeEventListener('click', handleToggle);
        }
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
        
        try {
          // Clear adopted stylesheets first
          shadowRef.current!.adoptedStyleSheets = [];
          
          // Remove ALL existing links to prevent duplicates
          shadowRef.current!.querySelectorAll('link').forEach(link => link.remove());
          
          // Add theme-specific CSS (without base styles to avoid button conflicts)
          const themeLink = document.createElement('link');
          themeLink.rel = 'stylesheet';
          themeLink.href = `./themes/${themeFile}.css`;
          themeLink.setAttribute('data-theme-file', themeFile);
          
          // Wait for theme to load
          await new Promise((resolve, reject) => {
            themeLink.onload = resolve;
            themeLink.onerror = reject;
            shadowRef.current!.appendChild(themeLink);
          });
          
          // Add component styles using adoptedStyleSheets
          // Create and apply the stylesheet immediately
          const styleSheet = new CSSStyleSheet();
          const styles = getThemeCardStyles();
          await styleSheet.replace(styles);
          
          // Apply the stylesheet to the shadow DOM
          shadowRef.current!.adoptedStyleSheets = [styleSheet];
          
          // Update wrapper attributes
          const wrapper = shadowRef.current!.querySelector('.theme-card-shadow-wrapper');
          if (wrapper) {
            wrapper.setAttribute('data-theme', theme.id);
            wrapper.setAttribute('data-theme-type', themeType);
            
            // Update toggle appearance
            const toggleSwitch = wrapper.querySelector('.toggle-switch');
            if (toggleSwitch) {
              toggleSwitch.classList.toggle('dark', isDark);
            }
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

  const availableThemes: ThemeInfo[] = themeManifest.themes.map(theme => ({
    id: theme.id,
    name: theme.name,
    description: theme.description,
  }));
  
  // Ensure base styles are loaded
  useEffect(() => {
    // Check if base styles link exists
    const baseStylesId = 'ui-kit-base-styles';
    if (!document.getElementById(baseStylesId)) {
      const baseLink = document.createElement('link');
      baseLink.id = baseStylesId;
      baseLink.rel = 'stylesheet';
      baseLink.href = './styles.css';
      document.head.appendChild(baseLink);
    }
  }, []);
  
  // Load default theme on mount
  useEffect(() => {
    handleThemeSelect('default');
  }, []);

  const handleThemeSelect = async (themeId: string) => {
    setActiveTheme(themeId);
    
    // Apply theme to the root document
    document.documentElement.setAttribute('data-theme', themeId);
    
    // Load the theme CSS at document level
    const isDarkMode = document.documentElement.getAttribute('data-theme-type') === 'dark';
    const themeType = isDarkMode ? 'dark' : 'light';
    const themeFile = `${themeId}-${themeType}`;
    
    // Add new theme link first
    const themeLink = document.createElement('link');
    themeLink.rel = 'stylesheet';
    themeLink.href = `./themes/${themeFile}.css`;
    themeLink.setAttribute('data-theme-css', 'true');
    themeLink.setAttribute('data-theme-id', themeId);
    
    // Wait for the new theme to load
    await new Promise((resolve, reject) => {
      themeLink.onload = resolve;
      themeLink.onerror = reject;
      document.head.appendChild(themeLink);
    });
    
    // Remove all old theme links after new one is loaded
    const existingThemeLinks = document.querySelectorAll('link[data-theme-css]');
    existingThemeLinks.forEach(link => {
      if (link !== themeLink) {
        link.remove();
      }
    });
  };

  return (
    <div className="theme-explorer">
      <header className="explorer-header">
        <h2>Theme Explorer</h2>
        <p>Explore all available themes. Each theme card shows its unique color scheme with independent light/dark mode toggle.</p>
      </header>

      <div className="themes-grid">
        {availableThemes.map(theme => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            isActive={activeTheme === theme.id}
            onClick={() => handleThemeSelect(theme.id)}
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