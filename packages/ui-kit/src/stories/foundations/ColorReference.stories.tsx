import React, { useState, useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import './ColorReference.stories.css';
import '../../components/ThemePreview.js';

const meta: Meta = {
  title: 'Foundations/Color System',
  parameters: {
    docs: {
      description: {
        component:
          'Interactive color token builder - select components to build and preview tokens',
      },
    },
  },
};

export default meta;

// Interactive Token Builder component
const TokenBuilder = () => {
  // All available surfaces (ordered: most to least specific)
  const surfaces = [
    'body',
    'panel',
    'buttonPrimary',
    'buttonDanger',
    'buttonSuccess',
    'buttonNeutral',
    'noticeInfo',
    'noticeSuccess',
    'noticeWarning',
    'noticeDanger',
    'input',
    'inputFocus',
    'inputError',
    'inputDisabled',
  ];

  // Concept groups with base and variants (ordered from softest to hardest)
  const conceptGroups = [
    { base: 'background', variants: ['backgroundSoft10', 'backgroundHard10'] },
    { base: 'border', variants: ['borderSoft20', 'borderSoft10', 'borderHard10', 'borderHard20'] },
    { base: 'icon', variants: ['iconSoft20'] },
    { base: 'link', variants: [] },
    { base: 'linkVisited', variants: [] },
    { base: 'shadow', variants: ['shadowSoft', 'shadowHard'] },
    {
      base: 'text',
      variants: ['textSoft40', 'textSoft30', 'textSoft20', 'textSoft10', 'textHard10'],
    },
  ];

  // All available states
  const states = [
    '', // no state (base)
    'hover',
    'active',
    'focus',
    'disabled',
  ];

  // State for selections
  const [selectedDomain] = useState('color');
  const [selectedSurface, setSelectedSurface] = useState('body');
  const [selectedConcept, setSelectedConcept] = useState('text');
  const [selectedState, setSelectedState] = useState('');
  const [expandedConcepts, setExpandedConcepts] = useState<Set<string>>(new Set());

  // Build the token name
  const tokenName = `--${selectedDomain}-${selectedSurface}-${selectedConcept}${selectedState ? `-${selectedState}` : ''}`;

  // Get the computed color value
  const [colorValue, setColorValue] = useState({ light: '', dark: '' });

  useEffect(() => {
    const getColorValue = (mode: 'light' | 'dark') => {
      try {
        // Find the theme-preview element
        const themePreview = document.querySelector(`theme-preview[mode="${mode}"]`) as any;
        if (!themePreview || !themePreview.shadowRoot) {
          return 'preview not found';
        }

        // Access the shadow DOM
        const shadowRoot = themePreview.shadowRoot;
        const wrapper = shadowRoot.querySelector('.theme-preview-wrapper') as HTMLElement;
        if (!wrapper) {
          return 'wrapper not found';
        }

        // Get computed style from the wrapper element that has the theme attributes
        const computedStyle = getComputedStyle(wrapper);
        
        // Get the raw custom property value
        const rawValue = computedStyle.getPropertyValue(tokenName);
        
        if (rawValue && rawValue.trim()) {
          return rawValue.trim();
        }

        // If no raw value, try to compute from a test element within the shadow DOM
        const testEl = document.createElement('div');
        testEl.style.cssText = `position: absolute; visibility: hidden;`;
        
        // Set the appropriate CSS property based on concept
        if (selectedConcept.includes('background')) {
          testEl.style.setProperty('background-color', `var(${tokenName})`);
        } else if (selectedConcept.includes('border')) {
          testEl.style.setProperty('border-color', `var(${tokenName})`);
          testEl.style.setProperty('border-width', '1px');
          testEl.style.setProperty('border-style', 'solid');
        } else if (selectedConcept.includes('shadow')) {
          testEl.style.setProperty('box-shadow', `0 4px 16px var(${tokenName})`);
        } else {
          testEl.style.setProperty('color', `var(${tokenName})`);
        }
        
        wrapper.appendChild(testEl);
        const testComputedStyle = getComputedStyle(testEl);
        
        // Get the computed value for the actual property
        let actualValue = '';
        if (selectedConcept.includes('background')) {
          actualValue = testComputedStyle.backgroundColor;
        } else if (selectedConcept.includes('border')) {
          actualValue = testComputedStyle.borderColor;
        } else if (selectedConcept.includes('shadow')) {
          actualValue = testComputedStyle.boxShadow;
        } else {
          actualValue = testComputedStyle.color;
        }
        
        wrapper.removeChild(testEl);

        // Return the computed value if it's valid
        if (
          actualValue &&
          actualValue !== 'rgba(0, 0, 0, 0)' &&
          actualValue !== 'transparent' &&
          actualValue !== 'none'
        ) {
          return actualValue;
        }

        return 'not defined';
      } catch (error) {
        console.error('Error computing color value:', error);
        return 'error';
      }
    };

    // Delay to ensure DOM and shadow DOM are ready
    const timeoutId = setTimeout(() => {
      setColorValue({
        light: getColorValue('light'),
        dark: getColorValue('dark'),
      });
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [tokenName, selectedConcept]);

  // Determine if this is a color we can display as a swatch
  const isDisplayableColor = (concept: string) => {
    return (
      concept.includes('background') ||
      concept.includes('text') ||
      concept.includes('border') ||
      concept.includes('link') ||
      concept.includes('icon') ||
      concept.includes('shadow')
    );
  };

  const showColorSwatch = isDisplayableColor(selectedConcept);

  return (
    <div className="token-builder">
      <div className="builder-layout">
        {/* Left side - Selection Table */}
        <div className="builder-selection">
          <h2>
            Build Your Token: <code className="header-token-name">{tokenName}</code>
          </h2>
          <table className="builder-table">
            <thead>
              <tr>
                <th>
                  <div className="column-header">
                    <span className="column-number">1</span>
                    <span className="column-title">Surface</span>
                  </div>
                </th>
                <th>
                  <div className="column-header">
                    <span className="column-number">2</span>
                    <span className="column-title">Concept</span>
                  </div>
                </th>
                <th>
                  <div className="column-header">
                    <span className="column-number">3</span>
                    <span className="column-title">State</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div className="selection-cell">
                    {surfaces.map((surface) => (
                      <button
                        key={surface}
                        className={`selection-item ${selectedSurface === surface ? 'selected' : ''}`}
                        onClick={() => setSelectedSurface(surface)}
                      >
                        {surface}
                      </button>
                    ))}
                  </div>
                </td>
                <td>
                  <div className="selection-cell">
                    {conceptGroups.map((group) => (
                      <div key={group.base} className="concept-group">
                        <div className="concept-row">
                          {group.variants.length > 0 && (
                            <button
                              className="expand-toggle"
                              onClick={() => {
                                const newExpanded = new Set(expandedConcepts);
                                if (newExpanded.has(group.base)) {
                                  newExpanded.delete(group.base);
                                } else {
                                  newExpanded.add(group.base);
                                }
                                setExpandedConcepts(newExpanded);
                              }}
                              aria-label={expandedConcepts.has(group.base) ? 'Collapse' : 'Expand'}
                            >
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                                <path
                                  d={
                                    expandedConcepts.has(group.base)
                                      ? 'M2.5 4.5L6 8L9.5 4.5' // chevron down
                                      : 'M4.5 2.5L8 6L4.5 9.5' // chevron right
                                  }
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  fill="none"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                          )}
                          <button
                            className={`selection-item ${selectedConcept === group.base ? 'selected' : ''} ${group.variants.length > 0 ? 'has-variants' : ''}`}
                            onClick={() => setSelectedConcept(group.base)}
                          >
                            {group.base}
                          </button>
                        </div>
                        {expandedConcepts.has(group.base) && (
                          <div className="concept-variants">
                            {group.variants.map((variant) => (
                              <button
                                key={variant}
                                className={`selection-item variant ${selectedConcept === variant ? 'selected' : ''}`}
                                onClick={() => setSelectedConcept(variant)}
                              >
                                {variant}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </td>
                <td>
                  <div className="selection-cell">
                    {states.map((state) => (
                      <button
                        key={state}
                        className={`selection-item ${selectedState === state ? 'selected' : ''}`}
                        onClick={() => setSelectedState(state)}
                      >
                        {state || 'base'}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Right side - Result Display */}
        <div className="builder-result">
          <div className="result-values">
            <theme-preview theme="default" mode="light">
              <div className="value-column light-mode">
                <h4>Light Mode</h4>
                <div className="value-info">
                  <span className="value-label">Value:</span>
                  <code className="value-text">{colorValue.light || 'loading...'}</code>
                </div>
                {showColorSwatch && (
                  <div className="color-preview">
                    <div
                      className="color-swatch-large"
                      title={`Background: ${selectedState ? `--color-${selectedSurface}-background-${selectedState}` : `--color-${selectedSurface}-background`}`}
                      style={{
                        backgroundColor: selectedState 
                          ? `var(--color-${selectedSurface}-background-${selectedState})`
                          : `var(--color-${selectedSurface}-background)`,
                        color:
                          selectedConcept.includes('background')
                            ? selectedState
                              ? `var(--color-${selectedSurface}-text-${selectedState})`
                              : `var(--color-${selectedSurface}-text)`
                            : selectedConcept.includes('text') || selectedConcept.includes('link') || selectedConcept.includes('icon')
                              ? `var(${tokenName})`
                              : `var(--color-${selectedSurface}-text)`,
                        borderColor: selectedConcept.includes('border')
                          ? `var(${tokenName})`
                          : 'transparent',
                        boxShadow: selectedConcept.includes('shadow')
                          ? `0 4px 16px var(${tokenName})`
                          : 'none',
                      }}
                    >
                      {selectedConcept.includes('background')
                        ? 'Aa'
                        : selectedConcept.includes('text') || selectedConcept.includes('link')
                          ? 'Aa'
                          : selectedConcept.includes('icon')
                            ? '★'
                            : selectedConcept.includes('shadow')
                              ? 'Shadow'
                              : selectedConcept.includes('border')
                                ? 'Border'
                                : ''}
                    </div>
                  </div>
                )}
              </div>
            </theme-preview>

            <theme-preview theme="default" mode="dark">
              <div className="value-column dark-mode">
                <h4>Dark Mode</h4>
                <div className="value-info">
                  <span className="value-label">Value:</span>
                  <code className="value-text">{colorValue.dark || 'loading...'}</code>
                </div>
                {showColorSwatch && (
                  <div className="color-preview">
                    <div
                      className="color-swatch-large"
                      title={`Background: ${selectedState ? `--color-${selectedSurface}-background-${selectedState}` : `--color-${selectedSurface}-background`}`}
                      style={{
                        backgroundColor: selectedState 
                          ? `var(--color-${selectedSurface}-background-${selectedState})`
                          : `var(--color-${selectedSurface}-background)`,
                        color:
                          selectedConcept.includes('background')
                            ? selectedState
                              ? `var(--color-${selectedSurface}-text-${selectedState})`
                              : `var(--color-${selectedSurface}-text)`
                            : selectedConcept.includes('text') || selectedConcept.includes('link') || selectedConcept.includes('icon')
                              ? `var(${tokenName})`
                              : `var(--color-${selectedSurface}-text)`,
                        borderColor: selectedConcept.includes('border')
                          ? `var(${tokenName})`
                          : 'transparent',
                        boxShadow: selectedConcept.includes('shadow')
                          ? `0 4px 16px var(${tokenName})`
                          : 'none',
                      }}
                    >
                      {selectedConcept.includes('background')
                        ? 'Aa'
                        : selectedConcept.includes('text') || selectedConcept.includes('link')
                          ? 'Aa'
                          : selectedConcept.includes('icon')
                            ? '★'
                            : selectedConcept.includes('shadow')
                              ? 'Shadow'
                              : selectedConcept.includes('border')
                                ? 'Border'
                                : ''}
                    </div>
                  </div>
                )}
              </div>
            </theme-preview>
          </div>

          {/* Usage Example */}
          <div className="usage-section">
            <h3>CSS Usage</h3>
            <pre className="usage-code">
              <code>{`.my-element {
  ${
    selectedConcept.includes('background')
      ? 'background-color'
      : selectedConcept.includes('text') ||
          selectedConcept.includes('link') ||
          selectedConcept.includes('icon')
        ? 'color'
        : selectedConcept.includes('border')
          ? 'border-color'
          : selectedConcept.includes('shadow')
            ? 'box-shadow'
            : 'property'
  }: var(${tokenName});
}`}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Reference: StoryObj = {
  render: () => <TokenBuilder />,
  parameters: {
    layout: 'fullscreen',
  },
};
