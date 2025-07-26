import type { Meta, StoryObj } from '@storybook/react';
import React, { useState, useEffect } from 'react';
import './ThemeExplorer.stories.css';
import themeManifest from '../../../dist/theme-manifest.json';

const meta: Meta = {
  title: 'Theming/Theme Explorer',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type ThemeInfo = {
  name: string;
  id: string;
  description: string;
  colorScheme: {
    primary: string;
    secondary: string;
    neutral: string;
    success: string;
    warning: string;
    danger: string;
  };
};

// Theme descriptions are now loaded from the manifest

const ThemeCard: React.FC<{
  theme: ThemeInfo;
  mode: 'light' | 'dark';
  isActive: boolean;
  onClick: () => void;
}> = ({ theme, mode, isActive, onClick }) => {
  const [colors, setColors] = useState(theme.colorScheme);

  useEffect(() => {
    // Get actual color values from the theme
    const tempDiv = document.createElement('div');
    tempDiv.setAttribute('data-theme', theme.id);
    tempDiv.setAttribute('data-theme-type', mode);
    tempDiv.style.display = 'none';
    document.body.appendChild(tempDiv);

    const computedStyle = getComputedStyle(tempDiv);
    const getColor = (varName: string) => {
      const value = computedStyle.getPropertyValue(varName).trim();
      return value || theme.colorScheme[varName.split('-').pop() as keyof typeof theme.colorScheme];
    };

    setColors({
      primary: getColor('--color-primary'),
      secondary: getColor('--color-secondary'),
      neutral: getColor('--color-neutral'),
      success: getColor('--color-success'),
      warning: getColor('--color-warning'),
      danger: getColor('--color-danger'),
    });

    document.body.removeChild(tempDiv);
  }, [theme, mode]);

  return (
    <div
      className={`theme-card ${isActive ? 'active' : ''}`}
      onClick={onClick}
      data-theme={theme.id}
      data-theme-type={mode}
    >
      <div className="theme-header">
        <h3>{theme.name}</h3>
        <span className="theme-mode">{mode}</span>
      </div>
      
      <div className="color-palette">
        <div className="color-swatch" style={{ backgroundColor: colors.primary }} title="Primary" />
        <div className="color-swatch" style={{ backgroundColor: colors.secondary }} title="Secondary" />
        <div className="color-swatch" style={{ backgroundColor: colors.neutral }} title="Neutral" />
        <div className="color-swatch" style={{ backgroundColor: colors.success }} title="Success" />
        <div className="color-swatch" style={{ backgroundColor: colors.warning }} title="Warning" />
        <div className="color-swatch" style={{ backgroundColor: colors.danger }} title="Danger" />
      </div>
      
      <p className="theme-description">{theme.description}</p>
      
      <div className="theme-preview">
        <div className="preview-surface">
          <div className="preview-text">Sample Text</div>
          <button className="preview-button">Button</button>
          <a href="#" className="preview-link">Link</a>
        </div>
      </div>
      
      {isActive && <div className="active-indicator">Active</div>}
    </div>
  );
};

export const Explorer: StoryObj = {
  render: () => {
    const [activeTheme, setActiveTheme] = useState('default');
    const [activeMode, setActiveMode] = useState<'light' | 'dark'>('light');
    const [filterMode, setFilterMode] = useState<'all' | 'light' | 'dark'>('all');

    const availableThemes: ThemeInfo[] = themeManifest.themes.map(theme => ({
      id: theme.id,
      name: theme.name,
      description: theme.description,
      colorScheme: {
        primary: '#1873cd',
        secondary: '#7c3aed',
        neutral: '#737373',
        success: '#12d393',
        warning: '#f59e0b',
        danger: '#d31212',
      },
    }));

    const handleThemeSelect = (themeId: string, mode: 'light' | 'dark') => {
      setActiveTheme(themeId);
      setActiveMode(mode);
      
      // Apply theme to the root document
      document.documentElement.setAttribute('data-theme', themeId);
      document.documentElement.setAttribute('data-theme-type', mode);
    };

    return (
      <div className="theme-explorer">
        <header className="explorer-header">
          <h1>Theme Explorer</h1>
          <p>Explore all available themes and their variations. Click on any theme to apply it.</p>
          
          <div className="filter-controls">
            <label>Filter by mode:</label>
            <div className="filter-buttons">
              <button
                className={filterMode === 'all' ? 'active' : ''}
                onClick={() => setFilterMode('all')}
              >
                All
              </button>
              <button
                className={filterMode === 'light' ? 'active' : ''}
                onClick={() => setFilterMode('light')}
              >
                Light Only
              </button>
              <button
                className={filterMode === 'dark' ? 'active' : ''}
                onClick={() => setFilterMode('dark')}
              >
                Dark Only
              </button>
            </div>
          </div>
        </header>

        <div className="themes-grid">
          {availableThemes.map(theme => (
            <React.Fragment key={theme.id}>
              {(filterMode === 'all' || filterMode === 'light') && (
                <ThemeCard
                  theme={theme}
                  mode="light"
                  isActive={activeTheme === theme.id && activeMode === 'light'}
                  onClick={() => handleThemeSelect(theme.id, 'light')}
                />
              )}
              {(filterMode === 'all' || filterMode === 'dark') && (
                <ThemeCard
                  theme={theme}
                  mode="dark"
                  isActive={activeTheme === theme.id && activeMode === 'dark'}
                  onClick={() => handleThemeSelect(theme.id, 'dark')}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        <section className="live-preview">
          <h2>Live Preview</h2>
          <div className="preview-container" data-theme={activeTheme} data-theme-type={activeMode}>
            <div className="preview-content">
              <h3>Current Theme: {activeTheme} ({activeMode})</h3>
              
              <div className="component-samples">
                <div className="sample-group">
                  <h4>Buttons</h4>
                  <div className="button-group">
                    <button className="sample-button primary">Primary</button>
                    <button className="sample-button secondary">Secondary</button>
                    <button className="sample-button neutral">Neutral</button>
                    <button className="sample-button danger">Danger</button>
                    <button className="sample-button success">Success</button>
                  </div>
                </div>

                <div className="sample-group">
                  <h4>Text & Links</h4>
                  <p className="sample-text">
                    This is sample body text with a <a href="#" className="sample-link">link</a> and 
                    some <span className="text-muted">muted text</span> for variety.
                  </p>
                </div>

                <div className="sample-group">
                  <h4>Surfaces</h4>
                  <div className="surface-samples">
                    <div className="surface-card">Card Surface</div>
                    <div className="surface-raised">Raised Surface</div>
                    <div className="surface-floating">Floating Surface</div>
                  </div>
                </div>

                <div className="sample-group">
                  <h4>Notifications</h4>
                  <div className="notification-samples">
                    <div className="notification-info">Info notification</div>
                    <div className="notification-success">Success notification</div>
                    <div className="notification-warning">Warning notification</div>
                    <div className="notification-danger">Danger notification</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  },
};