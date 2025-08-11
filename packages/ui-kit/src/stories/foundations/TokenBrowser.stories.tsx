import React, { useState, useEffect } from 'react';
import type { Meta } from '@storybook/react';
import './TokenBrowser.stories.css';
import '../../components/ThemePreview.js';

// Import token metadata
import tokenMetadata from '../../../dist/token-metadata.json';

export default {
  title: 'Token Browser',
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
} as Meta;

// Transform metadata to the expected format
const tokenDomains = {
  color: {
    label: 'Color',
    description: 'Semantic color tokens for surfaces, text, borders, and more',
    categories: [
      {
        name: 'Surface',
        tokens: tokenMetadata.color.surfaces
      },
      {
        name: 'Concept',
        tokens: tokenMetadata.color.concepts
      },
      {
        name: 'State',
        tokens: tokenMetadata.color.states
      }
    ]
  },
  gradient: {
    label: 'Gradient',
    description: 'Gradient overlays that maintain accessibility with surface foreground tokens',
    categories: [
      {
        name: 'Surface',
        tokens: tokenMetadata.gradient?.surfaces || ['body']
      },
      {
        name: 'Intent',
        tokens: tokenMetadata.gradient?.intents || ['primary', 'success', 'warning', 'danger', 'info', 'accent']
      }
    ]
  },
  typography: {
    label: 'Typography',
    description: 'Font families, sizes, weights, and text properties',
    categories: [
      {
        name: 'Category',
        tokens: tokenMetadata.typography.categories
      },
      {
        name: 'Scale/Type',
        tokens: tokenMetadata.typography.scales
      }
    ]
  },
  shadow: {
    label: 'Shadow',
    description: 'Elevation and depth through box shadows',
    categories: [
      {
        name: 'Type',
        tokens: tokenMetadata.shadow.types
      },
      {
        name: 'Scale',
        tokens: tokenMetadata.shadow.scales
      }
    ]
  },
  spacing: {
    label: 'Spacing',
    description: 'Consistent spacing units for padding, margin, and gaps',
    categories: [
      {
        name: 'Scale',
        tokens: tokenMetadata.spacing.scales
      },
      {
        name: 'Component',
        tokens: tokenMetadata.spacing.components
      }
    ]
  },
  border: {
    label: 'Border',
    description: 'Border widths, radius values, and styles',
    categories: [
      {
        name: 'Type',
        tokens: tokenMetadata.border.types
      },
      {
        name: 'Scale',
        tokens: tokenMetadata.border.scales
      }
    ]
  },
  animation: {
    label: 'Animation',
    description: 'Timing, easing functions, and animation properties',
    categories: [
      {
        name: 'Type',
        tokens: tokenMetadata.animation.types
      },
      {
        name: 'Scale/Value',
        tokens: tokenMetadata.animation.scales
      }
    ]
  }
};

// Interactive Token Browser component
const TokenBrowser = () => {
  const [selectedDomain, setSelectedDomain] = useState<keyof typeof tokenDomains>('color');
  const [selectedTokens, setSelectedTokens] = useState<Record<string, string>>({});
  const [expandedConcepts, setExpandedConcepts] = useState<Set<string>>(new Set());
  const [tokenValue, setTokenValue] = useState({ light: '', dark: '' });

  const domain = tokenDomains[selectedDomain];

  // Initialize selected tokens for the domain
  useEffect(() => {
    const initialTokens: Record<string, string> = {};
    
    if (selectedDomain === 'color') {
      initialTokens['Surface'] = 'body';
      initialTokens['Concept'] = 'text';
      initialTokens['State'] = '';
    } else if (selectedDomain === 'typography') {
      initialTokens['Category'] = 'size';
      initialTokens['Scale/Type'] = '(default)';
    } else if (selectedDomain === 'shadow') {
      initialTokens['Type'] = 'box';
      initialTokens['Scale'] = '(default)';
    } else if (selectedDomain === 'spacing') {
      initialTokens['Scale'] = '(default)';
    } else if (selectedDomain === 'border') {
      initialTokens['Type'] = 'radius';
      // For radius, select the first available scale since there's no (default)
      const radiusScales = tokenMetadata.border?.scales?.radius || [];
      initialTokens['Scale'] = radiusScales[0] || 'slight';
    } else if (selectedDomain === 'animation') {
      initialTokens['Type'] = 'duration';
      initialTokens['Scale/Value'] = '(default)';
    }
    
    setSelectedTokens(initialTokens);
  }, [selectedDomain]);

  // Helper to handle token selection with dependent reset
  const handleTokenSelect = (categoryName: string, tokenValue: string) => {
    const newTokens = { ...selectedTokens, [categoryName]: tokenValue };
    
    // Reset dependent selections when parent changes
    if (selectedDomain === 'typography' && categoryName === 'Category') {
      // Reset Scale/Type when Category changes
      const defaultScale = tokenDomains.typography.categories[1].tokens[tokenValue]?.[0] || '(default)';
      newTokens['Scale/Type'] = defaultScale;
    } else if (selectedDomain === 'shadow' && categoryName === 'Type') {
      // Reset Scale when Type changes
      newTokens['Scale'] = '(default)';
    } else if (selectedDomain === 'border' && categoryName === 'Type') {
      // Reset Scale when Type changes
      if (tokenValue === 'radius') {
        const radiusScales = tokenMetadata.border?.scales?.radius || [];
        newTokens['Scale'] = radiusScales[0] || 'slight';
      } else {
        newTokens['Scale'] = '(default)';
      }
    } else if (selectedDomain === 'animation' && categoryName === 'Type') {
      // Reset Scale/Value when Type changes
      newTokens['Scale/Value'] = '(default)';
    }
    
    setSelectedTokens(newTokens);
  };

  // Build the token name based on selections
  const buildTokenName = () => {
    if (selectedDomain === 'color') {
      const surface = selectedTokens['Surface'] || 'body';
      const concept = selectedTokens['Concept'] || 'text';
      const state = selectedTokens['State'];
      return `--color-${surface}-${concept}${state ? `-${state}` : ''}`;
    } else if (selectedDomain === 'typography') {
      const category = selectedTokens['Category'] || 'size';
      const scale = selectedTokens['Scale/Type'] || 'base';
      
      if (category === 'family') {
        return scale === '(default)' ? `--font-family` : `--font-${category}-${scale}`;
      } else if (category === 'lineHeight') {
        return scale === '(default)' ? `--line-height` : `--line-height-${scale}`;
      } else if (category === 'letterSpacing') {
        return scale === '(default)' ? `--letter-spacing` : `--letter-spacing-${scale}`;
      } else {
        return scale === '(default)' ? `--font-${category}` : `--font-${category}-${scale}`;
      }
    } else if (selectedDomain === 'shadow') {
      const type = selectedTokens['Type'] || 'box';
      const scale = selectedTokens['Scale'] || 'normal';
      
      if (type === 'box') {
        if (scale.startsWith('inner')) {
          return scale === 'inner' ? `--shadow-inner` : `--shadow-${scale}`;
        }
        return scale === '(default)' ? `--shadow` : `--shadow-${scale}`;
      } else if (type === 'text') {
        // Map text shadow scales to new naming
        const textShadowMap: Record<string, string> = {
          'softest': 'soft',
          '(default)': '',
          'hardest': 'hard'
        };
        const mappedScale = textShadowMap[scale] || scale;
        return mappedScale === '' ? `--textShadow` : `--textShadow-${mappedScale}`;
      } else if (type === 'inner') {
        return scale === '(default)' ? `--shadow-inner` : `--shadow-${scale}`;
      }
    } else if (selectedDomain === 'spacing') {
      const scale = selectedTokens['Scale'];
      const component = selectedTokens['Component'];
      
      if (component) {
        return `--spacing-${component}`;
      } else {
        return scale === '(default)' ? `--spacing` : `--spacing-${scale}`;
      }
    } else if (selectedDomain === 'border') {
      const type = selectedTokens['Type'] || 'radius';
      const scale = selectedTokens['Scale'] || 'slight';
      
      if (type === 'width') {
        return scale === '(default)' ? `--border-${type}` : `--border-${type}-${scale}`;
      } else {
        // For radius, always include the scale since there's no default
        return `--radius-${scale}`;
      }
    } else if (selectedDomain === 'animation') {
      const type = selectedTokens['Type'] || 'duration';
      const value = selectedTokens['Scale/Value'] || 'normal';
      
      return value === '(default)' ? `--${type}` : `--${type}-${value}`;
    } else if (selectedDomain === 'gradient') {
      const surface = selectedTokens['Surface'] || 'body';
      const intent = selectedTokens['Intent'] || 'primary';
      
      return `--gradient-${surface}-${intent}`;
    }
    
    return '--unknown-token';
  };

  const tokenName = buildTokenName();

  // Get description for the current token
  const getTokenDescription = () => {
    if (selectedDomain === 'border' && selectedTokens['Type'] === 'radius') {
      const scale = selectedTokens['Scale'] || '(default)';
      const descriptions: Record<string, string> = {
        'slight': 'Use for subtle softening where sharp corners feel too harsh',
        'small': 'Use for interactive elements like buttons and inputs',
        'medium': 'Use for content containers like cards and panels',
        'large': 'Use for prominent overlays like modals and dialogs',
        'xlarge': 'Use for hero sections or large feature cards',
        'round': 'Use for circular elements and pill-shaped buttons',
        'interactive': 'Use for any element users can click or type into',
        'floating': 'Use for elements that appear above other content',
        'container': 'Use for sections that group related content',
        'modal': 'Use for full-screen overlays and important dialogs',
        'pill': 'Use for badges, avatars, and toggle switches'
      };
      return descriptions[scale] || '';
    }
    return '';
  };

  const tokenDescription = getTokenDescription();

  // Get the computed value for the token
  useEffect(() => {
    const getTokenValue = (mode: 'light' | 'dark') => {
      try {
        const themePreview = document.querySelector(`theme-preview[mode="${mode}"]`) as any;
        if (!themePreview || !themePreview.shadowRoot) {
          return 'preview not found';
        }

        const shadowRoot = themePreview.shadowRoot;
        const wrapper = shadowRoot.querySelector('.theme-preview-wrapper') as HTMLElement;
        if (!wrapper) {
          return 'wrapper not found';
        }

        const computedStyle = getComputedStyle(wrapper);
        const rawValue = computedStyle.getPropertyValue(tokenName);
        
        if (rawValue && rawValue.trim()) {
          return rawValue.trim();
        }

        return 'not defined';
      } catch (error) {
        console.error('Error computing token value:', error);
        return 'error';
      }
    };

    const timeoutId = setTimeout(() => {
      setTokenValue({
        light: getTokenValue('light'),
        dark: getTokenValue('dark'),
      });
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [tokenName]);

  // Render the example based on domain
  const renderExample = () => {
    if (selectedDomain === 'color') {
      const concept = selectedTokens['Concept'] || 'text';
      const surface = selectedTokens['Surface'] || 'body';
      const state = selectedTokens['State'];
      
      return (
        <div className="color-preview">
          <div
            className="color-swatch-large"
            style={{
              backgroundColor: concept.includes('background')
                ? `var(${tokenName})`
                : state
                  ? `var(--color-${surface}-background-${state})`
                  : `var(--color-${surface}-background)`,
              color: concept.includes('text') || concept.includes('link') || concept.includes('icon')
                ? `var(${tokenName})`
                : state
                  ? `var(--color-${surface}-text-${state})`
                  : `var(--color-${surface}-text)`,
              borderColor: concept.includes('border')
                ? `var(${tokenName})`
                : 'transparent',
              boxShadow: concept.includes('shadow')
                ? `0 4px 16px var(${tokenName})`
                : 'none',
            }}
          >
            {concept.includes('background') || concept.includes('text') || concept.includes('link')
              ? 'Aa'
              : concept.includes('icon')
                ? '★'
                : concept.includes('shadow')
                  ? 'Shadow'
                  : concept.includes('border')
                    ? 'Border'
                    : ''}
          </div>
        </div>
      );
    } else if (selectedDomain === 'typography') {
      const category = selectedTokens['Category'] || 'size';
      
      if (category === 'size' || category === 'weight') {
        return (
          <div className="typography-preview">
            <div
              className="typography-sample"
              style={{
                fontSize: category === 'size' ? `var(${tokenName})` : 'var(--font-size-lg)',
                fontWeight: category === 'weight' ? `var(${tokenName})` : 'var(--font-weight)',
                fontFamily: 'var(--font-family)',
                lineHeight: 'var(--line-height)',
                color: 'var(--color-body-text)',
              }}
            >
              The quick brown fox jumps over the lazy dog
            </div>
            <div
              className="typography-sample"
              style={{
                fontSize: category === 'size' ? `var(${tokenName})` : 'var(--font-size-base)',
                fontWeight: category === 'weight' ? `var(${tokenName})` : 'var(--font-weight)',
                fontFamily: 'var(--font-family)',
                lineHeight: 'var(--line-height)',
                color: 'var(--color-body-text)',
              }}
            >
              ABCDEFGHIJKLMNOPQRSTUVWXYZ<br />
              abcdefghijklmnopqrstuvwxyz<br />
              0123456789
            </div>
          </div>
        );
      } else if (category === 'family') {
        return (
          <div className="typography-preview">
            <div
              className="typography-sample"
              style={{
                fontFamily: `var(${tokenName})`,
                fontSize: 'var(--font-size-lg)',
                color: 'var(--color-body-text)',
              }}
            >
              {selectedTokens['Scale/Type'] === 'mono'
                ? 'const greeting = "Hello, World!";'
                : 'The quick brown fox jumps over the lazy dog'}
            </div>
          </div>
        );
      } else if (category === 'lineHeight') {
        return (
          <div className="typography-preview">
            <div
              className="typography-sample line-height-demo"
              style={{
                lineHeight: `var(${tokenName})`,
                fontSize: 'var(--font-size-base)',
              }}
            >
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
              Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
              Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
            </div>
          </div>
        );
      } else if (category === 'letterSpacing') {
        return (
          <div className="typography-preview">
            <div
              className="typography-sample"
              style={{
                letterSpacing: `var(${tokenName})`,
                fontSize: 'var(--font-size-lg)',
                textTransform: 'uppercase',
              }}
            >
              Letter Spacing Example
            </div>
          </div>
        );
      }
    } else if (selectedDomain === 'shadow') {
      return (
        <div className="shadow-preview">
          <div
            className="shadow-sample"
            style={{
              boxShadow: `var(${tokenName})`,
            }}
          >
            {selectedTokens['Type'] === 'text' ? (
              <span
                style={{
                  fontSize: 'var(--font-size-2xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  textShadow: `var(${tokenName})`,
                }}
              >
                Text Shadow
              </span>
            ) : (
              'Box Shadow'
            )}
          </div>
        </div>
      );
    } else if (selectedDomain === 'spacing') {
      return (
        <div className="spacing-preview">
          <div className="spacing-container">
            <div
              className="spacing-sample"
              style={{
                width: `var(${tokenName})`,
                height: `var(${tokenName})`,
              }}
            />
            <div className="spacing-label">
              {tokenValue.light}
            </div>
          </div>
          <div className="spacing-demo">
            <div className="spacing-box" style={{ padding: `var(${tokenName})` }}>
              <div className="spacing-content">Padding</div>
            </div>
            <div className="spacing-box" style={{ marginTop: `var(${tokenName})` }}>
              <div className="spacing-content">Margin Top</div>
            </div>
          </div>
        </div>
      );
    } else if (selectedDomain === 'border') {
      const type = selectedTokens['Type'] || 'radius';
      
      if (type === 'width') {
        return (
          <div className="border-preview">
            <div
              className="border-sample"
              style={{
                border: `var(${tokenName}) solid var(--color-body-border)`,
              }}
            >
              Border Width
            </div>
          </div>
        );
      } else {
        return (
          <div className="border-preview">
            <div
              className="border-sample"
              style={{
                borderRadius: `var(${tokenName})`,
                border: '2px solid var(--color-body-border)',
              }}
            >
              Border Radius
            </div>
          </div>
        );
      }
    } else if (selectedDomain === 'animation') {
      const type = selectedTokens['Type'] || 'duration';
      
      if (type === 'duration') {
        return (
          <div className="animation-preview">
            <div className="animation-demo">
              <div 
                className="animation-box"
                style={{
                  animation: `slideInRight var(${tokenName}) var(--easing-default) infinite alternate`,
                }}
              >
                Duration: {tokenValue.light}
              </div>
            </div>
            <p className="animation-description">
              Box slides in and out with the selected duration
            </p>
          </div>
        );
      } else if (type === 'easing') {
        return (
          <div className="animation-preview">
            <div className="animation-demo">
              <div 
                className="animation-box"
                style={{
                  animation: `slideInRight var(--duration-normal) var(${tokenName}) infinite alternate`,
                }}
              >
                Easing
              </div>
            </div>
            <p className="animation-description">
              Box animates with the selected easing function
            </p>
          </div>
        );
      } else if (type === 'delay') {
        return (
          <div className="animation-preview">
            <div className="animation-demo stagger-demo">
              {[0, 1, 2].map((index) => (
                <div 
                  key={index}
                  className="animation-box small"
                  style={{
                    animation: `fadeIn var(--duration-normal) var(--easing-default) infinite alternate`,
                    animationDelay: `calc(var(${tokenName}) * ${index})`,
                  }}
                >
                  {index + 1}
                </div>
              ))}
            </div>
            <p className="animation-description">
              Staggered animation with {tokenValue.light} delay between elements
            </p>
          </div>
        );
      }
    } else if (selectedDomain === 'gradient') {
      return (
        <div className="gradient-preview">
          <div
            className="gradient-swatch-large"
            style={{
              background: `var(${tokenName}), var(--color-panel-background)`,
            }}
          >
            <div className="gradient-text">
              <h3>Gradient Preview</h3>
              <p>This gradient overlays the background while maintaining text readability</p>
            </div>
          </div>
          <p className="gradient-description">
            Subtle overlay gradient for visual emphasis
          </p>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="token-browser">
      <div className="browser-header">
        <h2>Token Browser</h2>
      </div>

      <p className="domain-description">{domain.description}</p>

      <div className="browser-layout">
        {/* Left side - Selection Table */}
        <div className="browser-selection">
          <div className="selection-header">
            <div className="domain-selector">
              <label htmlFor="domain-select">Domain:</label>
              <select
                id="domain-select"
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value as keyof typeof tokenDomains)}
                className="domain-dropdown"
              >
                {Object.entries(tokenDomains).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="token-info">
              <code className="selected-token-name">{tokenName}</code>
              {tokenDescription && (
                <span className="token-description">{tokenDescription}</span>
              )}
            </div>
          </div>
          <table className="browser-table">
            <thead>
              <tr>
                {domain.categories.map((category, index) => (
                  <th key={category.name}>
                    <div className="column-header">
                      <span className="column-number">{index + 1}</span>
                      <span className="column-title">{category.name}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {domain.categories.map((category) => (
                  <td key={category.name}>
                    <div className="selection-cell">
                      {Array.isArray(category.tokens) ? (
                        category.tokens.map((token) => {
                          if (typeof token === 'string') {
                            return (
                              <button
                                key={token}
                                className={`selection-item ${selectedTokens[category.name] === token ? 'selected' : ''}`}
                                onClick={() => handleTokenSelect(category.name, token)}
                              >
                                {token || '(default)'}
                              </button>
                            );
                          } else {
                            // Handle concept groups with variants (for color domain)
                            return (
                              <div key={token.base} className="concept-group">
                                {token.variants.length > 0 ? (
                                  <div className="concept-row expandable">
                                    <button
                                      className="expand-toggle"
                                      onClick={() => {
                                        const newExpanded = new Set(expandedConcepts);
                                        if (newExpanded.has(token.base)) {
                                          newExpanded.delete(token.base);
                                        } else {
                                          newExpanded.add(token.base);
                                        }
                                        setExpandedConcepts(newExpanded);
                                      }}
                                      aria-label={expandedConcepts.has(token.base) ? 'Collapse' : 'Expand'}
                                    >
                                      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                                        <path
                                          d={
                                            expandedConcepts.has(token.base)
                                              ? 'M2.5 4.5L6 8L9.5 4.5'
                                              : 'M4.5 2.5L8 6L4.5 9.5'
                                          }
                                          stroke="currentColor"
                                          strokeWidth="1.5"
                                          fill="none"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        />
                                      </svg>
                                    </button>
                                    <button
                                      className={`selection-item ${selectedTokens[category.name] === token.base ? 'selected' : ''} has-variants`}
                                      onClick={() => handleTokenSelect(category.name, token.base)}
                                    >
                                      {token.base}
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    className={`selection-item ${selectedTokens[category.name] === token.base ? 'selected' : ''}`}
                                    onClick={() => handleTokenSelect(category.name, token.base)}
                                  >
                                    {token.base}
                                  </button>
                                )}
                                {expandedConcepts.has(token.base) && (
                                  <div className="concept-variants">
                                    {token.variants.map((variant) => (
                                      <button
                                        key={variant}
                                        className={`selection-item variant ${selectedTokens[category.name] === variant ? 'selected' : ''}`}
                                        onClick={() => handleTokenSelect(category.name, variant)}
                                      >
                                        {variant}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          }
                        })
                      ) : (
                        // Handle dynamic tokens based on previous selection
                        (category.tokens[selectedTokens[domain.categories[0].name]] || []).map((token: string) => (
                          <button
                            key={token}
                            className={`selection-item ${selectedTokens[category.name] === token ? 'selected' : ''}`}
                            onClick={() => setSelectedTokens({ ...selectedTokens, [category.name]: token })}
                          >
                            {token || 'default'}
                          </button>
                        ))
                      )}
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Right side - Result Display */}
        <div className="browser-result">
          <div className="result-values">
            <theme-preview theme="default" mode="light">
              <div className="value-column light-mode">
                <h4>Light Mode</h4>
                <div className="value-info">
                  <span className="value-label">Value:</span>
                  <code className="value-text">{tokenValue.light || 'loading...'}</code>
                </div>
                {renderExample()}
              </div>
            </theme-preview>

            <theme-preview theme="default" mode="dark">
              <div className="value-column dark-mode">
                <h4>Dark Mode</h4>
                <div className="value-info">
                  <span className="value-label">Value:</span>
                  <code className="value-text">{tokenValue.dark || 'loading...'}</code>
                </div>
                {renderExample()}
              </div>
            </theme-preview>
          </div>

          {/* Usage Example */}
          <div className="usage-section">
            <h3>CSS Usage</h3>
            <pre className="usage-code">
              <code>{`.my-element {
  ${
    selectedDomain === 'color'
      ? selectedTokens['Concept']?.includes('background')
        ? 'background-color'
        : selectedTokens['Concept']?.includes('text') || selectedTokens['Concept']?.includes('link') || selectedTokens['Concept']?.includes('icon')
          ? 'color'
          : selectedTokens['Concept']?.includes('border')
            ? 'border-color'
            : selectedTokens['Concept']?.includes('shadow')
              ? 'box-shadow'
              : 'property'
      : selectedDomain === 'typography'
        ? selectedTokens['Category'] === 'size'
          ? 'font-size'
          : selectedTokens['Category'] === 'weight'
            ? 'font-weight'
            : selectedTokens['Category'] === 'family'
              ? 'font-family'
              : selectedTokens['Category'] === 'lineHeight'
                ? 'line-height'
                : 'letter-spacing'
        : selectedDomain === 'shadow'
          ? selectedTokens['Type'] === 'text'
            ? 'text-shadow'
            : 'box-shadow'
          : selectedDomain === 'spacing'
            ? 'padding'
            : selectedDomain === 'border'
              ? selectedTokens['Type'] === 'width'
                ? 'border-width'
                : 'border-radius'
              : selectedDomain === 'animation'
                ? selectedTokens['Type'] === 'duration'
                  ? 'transition-duration'
                  : selectedTokens['Type'] === 'easing'
                    ? 'transition-timing-function'
                    : 'transition-delay'
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



// Single story to render at component level
export const TokenBrowserStory = () => <TokenBrowser />;
TokenBrowserStory.storyName = 'Token Browser';