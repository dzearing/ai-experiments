import React, { useState, useEffect } from 'react';
import type { Meta } from '@storybook/react';
import './TokenBrowser.stories.css';
import '../../components/ThemePreview.js';

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

// Token domain configurations
const tokenDomains = {
  color: {
    label: 'Color',
    description: 'Semantic color tokens for surfaces, text, borders, and more',
    categories: [
      {
        name: 'Surface',
        tokens: [
          'body', 'panel', 'panelRaised', 'panelElevated', 'panelFloating',
          'buttonPrimary', 'buttonDanger', 'buttonSuccess', 'buttonNeutral',
          'noticeInfo', 'noticeSuccess', 'noticeWarning', 'noticeDanger',
          'codeBlock', 'codeInline', 'input', 'inputFocus', 'inputError',
          'inputDisabled', 'dialog', 'dialogElevated', 'modal', 'tooltip', 'menu'
        ]
      },
      {
        name: 'Concept',
        tokens: [
          { base: 'background', variants: ['backgroundSoft10', 'backgroundHard10'] },
          { base: 'border', variants: ['borderSoft20', 'borderSoft10', 'borderHard10', 'borderHard20'] },
          { base: 'icon', variants: ['iconSoft20'] },
          { base: 'link', variants: [] },
          { base: 'linkVisited', variants: [] },
          { base: 'shadow', variants: ['shadowSoft', 'shadowHard'] },
          { base: 'text', variants: ['textSoft40', 'textSoft30', 'textSoft20', 'textSoft10', 'textHard10'] },
        ]
      },
      {
        name: 'State',
        tokens: ['', 'hover', 'active', 'focus', 'disabled']
      }
    ]
  },
  typography: {
    label: 'Typography',
    description: 'Font families, sizes, weights, and text properties',
    categories: [
      {
        name: 'Category',
        tokens: ['family', 'size', 'weight', 'lineHeight', 'letterSpacing']
      },
      {
        name: 'Scale/Type',
        tokens: {
          family: ['', 'mono', 'serif'],
          size: ['smallest', 'small30', 'small20', 'small10', 'normal', 'large10', 'large20', 'large30', 'large40', 'large50', 'largest', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'body', 'caption', 'code'],
          weight: ['light', 'regular', 'medium', 'semibold', 'bold'],
          lineHeight: ['tightest', 'tight10', 'tight5', 'normal', 'loose5', 'loose10', 'loosest', 'code'],
          letterSpacing: ['tightest', 'tight10', 'normal', 'wide10', 'wide20', 'widest']
        }
      }
    ]
  },
  shadow: {
    label: 'Shadow',
    description: 'Elevation and depth through box shadows',
    categories: [
      {
        name: 'Type',
        tokens: ['box', 'text', 'inner']
      },
      {
        name: 'Scale',
        tokens: ['none', 'softest', 'soft10', 'normal', 'hard10', 'hard20', 'hardest', 'focus', 'button', 'buttonHover', 'card', 'cardHover', 'dropdown', 'modal', 'popover', 'tooltip', 'innerSoft', 'innerNormal']
      }
    ]
  },
  spacing: {
    label: 'Spacing',
    description: 'Consistent spacing units for padding, margin, and gaps',
    categories: [
      {
        name: 'Scale',
        tokens: ['none', 'px', 'smallest', 'small20', 'small10', 'small5', 'normal', 'large5', 'large10', 'large20', 'large30', 'large40', 'large50', 'large60', 'large70', 'largest']
      },
      {
        name: 'Component',
        tokens: ['buttonX', 'buttonY', 'inputX', 'inputY', 'card', 'modal', 'section']
      }
    ]
  },
  border: {
    label: 'Border',
    description: 'Border widths, radius values, and styles',
    categories: [
      {
        name: 'Type',
        tokens: ['width', 'radius']
      },
      {
        name: 'Scale',
        tokens: {
          width: ['thinnest', 'normal', 'thick10', 'thickest', 'default', 'focus', 'divider'],
          radius: ['none', 'smallest', 'small10', 'normal', 'large10', 'large20', 'large30', 'full', 'button', 'input', 'card', 'modal', 'tooltip', 'badge', 'chip', 'avatar', 'image']
        }
      }
    ]
  },
  animation: {
    label: 'Animation',
    description: 'Timing, easing functions, and animation properties',
    categories: [
      {
        name: 'Type',
        tokens: ['duration', 'easing', 'delay']
      },
      {
        name: 'Scale/Value',
        tokens: {
          duration: ['fastest', 'fast20', 'fast10', 'normal', 'slow10', 'slow20', 'slowest', 'hover', 'focus', 'expand', 'collapse', 'fadeIn', 'fadeOut', 'slideIn', 'slideOut', 'modalIn', 'modalOut', 'pageTransition'],
          easing: ['linear', 'ease', 'easeIn', 'easeOut', 'easeInOut', 'bounce', 'sharp', 'smooth', 'default', 'enter', 'exit', 'move'],
          delay: ['none', 'fast10', 'normal', 'slow10', 'slow20', 'stagger']
        }
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
      initialTokens['Scale/Type'] = 'normal';
    } else if (selectedDomain === 'shadow') {
      initialTokens['Type'] = 'box';
      initialTokens['Scale'] = 'normal';
    } else if (selectedDomain === 'spacing') {
      initialTokens['Scale'] = 'normal';
    } else if (selectedDomain === 'border') {
      initialTokens['Type'] = 'radius';
      initialTokens['Scale'] = 'normal';
    } else if (selectedDomain === 'animation') {
      initialTokens['Type'] = 'duration';
      initialTokens['Scale/Value'] = 'normal';
    }
    
    setSelectedTokens(initialTokens);
  }, [selectedDomain]);

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
        return scale ? `--font-${category}-${scale}` : `--font-${category}`;
      } else if (category === 'lineHeight') {
        return `--line-height-${scale}`;
      } else if (category === 'letterSpacing') {
        return `--letter-spacing-${scale}`;
      } else {
        return `--font-${category}-${scale}`;
      }
    } else if (selectedDomain === 'shadow') {
      const type = selectedTokens['Type'] || 'box';
      const scale = selectedTokens['Scale'] || 'normal';
      
      if (type === 'box') {
        if (scale.startsWith('inner')) {
          return `--shadow-${scale}`;
        }
        return `--shadow-${scale}`;
      } else if (type === 'text') {
        // Map text shadow scales to new naming
        const textShadowMap: Record<string, string> = {
          'softest': 'soft',
          'normal': 'normal',
          'hardest': 'hard'
        };
        const mappedScale = textShadowMap[scale] || scale;
        return `--textShadow-${mappedScale}`;
      } else if (type === 'inner') {
        return `--shadow-${scale}`;
      }
    } else if (selectedDomain === 'spacing') {
      const scale = selectedTokens['Scale'];
      const component = selectedTokens['Component'];
      
      if (component) {
        return `--spacing-${component}`;
      } else {
        return `--spacing-${scale}`;
      }
    } else if (selectedDomain === 'border') {
      const type = selectedTokens['Type'] || 'radius';
      const scale = selectedTokens['Scale'] || 'normal';
      
      if (type === 'width') {
        return `--border-${type}-${scale}`;
      } else {
        return `--radius-${scale}`;
      }
    } else if (selectedDomain === 'animation') {
      const type = selectedTokens['Type'] || 'duration';
      const value = selectedTokens['Scale/Value'] || 'normal';
      
      return `--${type}-${value}`;
    }
    
    return '--unknown-token';
  };

  const tokenName = buildTokenName();

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
                fontWeight: category === 'weight' ? `var(${tokenName})` : 'var(--font-weight-regular)',
                fontFamily: 'var(--font-family)',
                lineHeight: 'var(--line-height-normal)',
              }}
            >
              The quick brown fox jumps over the lazy dog
            </div>
            <div
              className="typography-sample"
              style={{
                fontSize: category === 'size' ? `var(${tokenName})` : 'var(--font-size-base)',
                fontWeight: category === 'weight' ? `var(${tokenName})` : 'var(--font-weight-regular)',
                fontFamily: 'var(--font-family)',
                lineHeight: 'var(--line-height-normal)',
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
            <code className="selected-token-name">{tokenName}</code>
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
                                onClick={() => setSelectedTokens({ ...selectedTokens, [category.name]: token })}
                              >
                                {token || 'base'}
                              </button>
                            );
                          } else {
                            // Handle concept groups with variants (for color domain)
                            return (
                              <div key={token.base} className="concept-group">
                                <div className="concept-row">
                                  {token.variants.length > 0 && (
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
                                  )}
                                  <button
                                    className={`selection-item ${selectedTokens[category.name] === token.base ? 'selected' : ''} ${token.variants.length > 0 ? 'has-variants' : ''}`}
                                    onClick={() => setSelectedTokens({ ...selectedTokens, [category.name]: token.base })}
                                  >
                                    {token.base}
                                  </button>
                                </div>
                                {expandedConcepts.has(token.base) && (
                                  <div className="concept-variants">
                                    {token.variants.map((variant) => (
                                      <button
                                        key={variant}
                                        className={`selection-item variant ${selectedTokens[category.name] === variant ? 'selected' : ''}`}
                                        onClick={() => setSelectedTokens({ ...selectedTokens, [category.name]: variant })}
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
