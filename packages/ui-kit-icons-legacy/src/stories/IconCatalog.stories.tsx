import type { Meta, StoryObj } from '@storybook/react';
import React, { useState, useMemo } from 'react';
import * as Icons from '../index';
import styles from './IconCatalog.module.css';
import { SyntaxHighlight } from './SyntaxHighlight';

const meta: Meta = {
  title: 'Icons/Icon Catalog',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj;

// Search icon component
const SearchIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
);

// Categorize icons based on their names
const categorizeIcons = () => {
  const iconEntries = Object.entries(Icons)
    .filter(([name, component]) => 
      name.endsWith('Icon') && 
      typeof component === 'object' && 
      component !== null &&
      'displayName' in component
    );

  const categories: Record<string, Array<[string, any]>> = {
    'Actions': [],
    'Navigation': [],
    'Communication': [],
    'Media': [],
    'Editor': [],
    'Status': [],
    'UI Elements': [],
    'Other': [],
  };

  iconEntries.forEach(entry => {
    const [name] = entry;
    const iconName = name.replace('Icon', '').toLowerCase();
    
    // Actions
    if (['save', 'edit', 'delete', 'add', 'remove', 'copy', 'paste', 'cut', 'undo', 'redo', 'search', 'filter', 'refresh', 'sync', 'download', 'upload', 'share', 'export', 'print', 'settings', 'options'].some(action => iconName.includes(action))) {
      categories['Actions'].push(entry);
    }
    // Navigation
    else if (['arrow', 'chevron', 'menu', 'close', 'home', 'back', 'forward', 'expand', 'collapse', 'more', 'dots'].some(prefix => iconName.includes(prefix))) {
      categories['Navigation'].push(entry);
    }
    // Communication
    else if (['mail', 'email', 'message', 'chat', 'comment', 'notification', 'bell', 'phone', 'call'].some(prefix => iconName.includes(prefix))) {
      categories['Communication'].push(entry);
    }
    // Media
    else if (['image', 'photo', 'video', 'camera', 'mic', 'music', 'audio', 'play', 'pause', 'stop'].some(prefix => iconName.includes(prefix))) {
      categories['Media'].push(entry);
    }
    // Editor
    else if (['bold', 'italic', 'underline', 'strikethrough', 'heading', 'list', 'quote', 'code', 'link', 'table', 'indent', 'outdent', 'align'].some(prefix => iconName.includes(prefix))) {
      categories['Editor'].push(entry);
    }
    // Status
    else if (['check', 'x', 'warning', 'info', 'error', 'loading', 'spinner', 'success', 'fail'].some(prefix => iconName.includes(prefix))) {
      categories['Status'].push(entry);
    }
    // UI Elements
    else if (['button', 'input', 'form', 'toggle', 'switch', 'slider', 'dropdown', 'modal', 'dialog'].some(prefix => iconName.includes(prefix))) {
      categories['UI Elements'].push(entry);
    }
    // Other
    else {
      categories['Other'].push(entry);
    }
  });

  // Remove empty categories and sort
  Object.keys(categories).forEach(key => {
    if (categories[key].length === 0) {
      delete categories[key];
    } else {
      categories[key].sort((a, b) => a[0].localeCompare(b[0]));
    }
  });

  return categories;
};


export const IconBrowser: Story = {
  render: () => {
    const [size, setSize] = useState(24);
    const [search, setSearch] = useState('');
    const [copied, setCopied] = useState<string | null>(null);
    const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

    const categories = useMemo(() => categorizeIcons(), []);
    const allIconsEntries = useMemo(() => Object.entries(categories), [categories]);
    
    const filteredCategories = useMemo(() => {
      if (!search) return categories;
      
      // Split by comma first, then trim each term
      const searchTerms = search
        .split(',')
        .map(term => term.trim().toLowerCase())
        .filter(term => term.length > 0);
      
      if (searchTerms.length === 0) return categories;
      
      const filtered: Record<string, Array<[string, any]>> = {};
      Object.entries(categories).forEach(([category, icons]) => {
        const filteredIcons = icons.filter(([name]) => {
          const lowerName = name.toLowerCase();
          // Icon must match ANY of the search terms
          return searchTerms.some(term => lowerName.includes(term));
        });
        if (filteredIcons.length > 0) {
          filtered[category] = filteredIcons;
        }
      });
      return filtered;
    }, [categories, search]);

    const copyImport = (name: string) => {
      const importStatement = `import { ${name} } from '@claude-flow/ui-kit-icons';`;
      navigator.clipboard.writeText(importStatement);
      setCopied(name);
      setTimeout(() => setCopied(null), 2000);
    };

    const totalIcons = Object.values(categories).flat().length;
    const filteredIconsCount = Object.values(filteredCategories).flat().length;

    return (
      <div className={styles.container} style={{ '--icon-size': size } as React.CSSProperties}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>Icon Catalog</h1>
            <p className={styles.description}>
              Browse and copy import statements for @claude-flow/ui-kit-icons
            </p>
          </div>
        </header>
        
        <div className={styles.stickyContainer}>
          <div className={styles.controlsWrapper}>
            <div className={styles.controls}>
              <div className={styles.searchSection}>
                <div className={styles.searchWrapper}>
                  <div className={styles.searchIcon}>
                    <SearchIcon size={20} />
                  </div>
                  <input
                    type="text"
                    placeholder="Search icons... (e.g. Close, Add)"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={styles.searchInput}
                  />
                </div>
              </div>
              
              <div className={styles.sizeControl}>
                <span className={styles.sizeValue}>{size}px</span>
                <input
                  type="range"
                  min="16"
                  max="48"
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                  className={styles.sizeSlider}
                />
              </div>
            </div>
          </div>
        </div>

        <main className={styles.content}>
          {filteredIconsCount === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <SearchIcon size={64} />
              </div>
              <h3 className={styles.emptyTitle}>No icons found</h3>
              <p className={styles.emptyDescription}>
                Try adjusting your search term to find what you're looking for
              </p>
            </div>
          ) : (
            <>
              {search ? (
                // When searching, show all results in one grid without headers
                <div className={styles.iconGrid}>
                  {Object.values(filteredCategories).flat().map(([name, IconComponent]) => {
                    const Component = IconComponent as React.ComponentType<any>;
                    const isCopied = copied === name;
                    
                    return (
                      <button
                        key={name}
                        onClick={() => copyImport(name)}
                        className={`${styles.iconCard} ${isCopied ? styles.iconCardCopied : ''}`}
                        title={`Click to copy import for ${name}`}
                      >
                        <div className={styles.iconWrapper}>
                          <Component size={size} />
                        </div>
                        <div className={styles.iconName}>
                          {name.replace('Icon', '')}
                        </div>
                        {isCopied && (
                          <div className={styles.copiedBadge}>Copied!</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                // When not searching, show categories with headers
                <>
                  {Object.entries(filteredCategories).map(([category, icons]) => {
                    const isCollapsed = collapsedCategories.has(category);
                    return (
                      <section key={category} className={styles.categorySection}>
                        <button
                          onClick={() => {
                            const newCollapsed = new Set(collapsedCategories);
                            if (isCollapsed) {
                              newCollapsed.delete(category);
                            } else {
                              newCollapsed.add(category);
                            }
                            setCollapsedCategories(newCollapsed);
                          }}
                          className={styles.categoryHeader}
                          aria-expanded={!isCollapsed}
                          aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${category} category`}
                        >
                          <h2 className={styles.categoryTitle}>
                            <span className={`${styles.categoryIcon} ${isCollapsed ? styles.categoryIconCollapsed : ''}`}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="6 9 12 15 18 9"/>
                              </svg>
                            </span>
                            {category}
                            <span className={styles.categoryCount}>({icons.length})</span>
                          </h2>
                        </button>
                        
                        {!isCollapsed && (
                          <div className={styles.iconGrid}>
                        {icons.map(([name, IconComponent]) => {
                          const Component = IconComponent as React.ComponentType<any>;
                          const isCopied = copied === name;
                          
                          return (
                            <button
                              key={name}
                              onClick={() => copyImport(name)}
                              className={`${styles.iconCard} ${isCopied ? styles.iconCardCopied : ''}`}
                              title={`Click to copy import for ${name}`}
                            >
                              <div className={styles.iconWrapper}>
                                <Component size={size} />
                              </div>
                              <div className={styles.iconName}>
                                {name.replace('Icon', '')}
                              </div>
                              {isCopied && (
                                <div className={styles.copiedBadge}>Copied!</div>
                              )}
                            </button>
                          );
                          })}
                        </div>
                      )}
                    </section>
                  );
                })}
                </>
              )}
            </>
          )}
        </main>

        <footer className={styles.footer}>
          Click any icon to copy its import statement
        </footer>
      </div>
    );
  },
};



export const Usage: Story = {
  render: () => {
    const [copiedSection, setCopiedSection] = useState<string | null>(null);

    const copyCodeBlock = (section: string, code: string) => {
      navigator.clipboard.writeText(code);
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(null), 2000);
    };

    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>Icon Usage Guide</h1>
            <p className={styles.description}>
              Learn how to use @claude-flow/ui-kit-icons in your React applications
            </p>
          </div>
        </header>

        <main className={styles.content}>
          <section className={styles.categorySection}>
            <h2 className={styles.categoryTitle}>
              Getting Started
              <span className={styles.categoryCount}>Installation & Import</span>
            </h2>
            
            <div className={styles.iconGrid} style={{ gridTemplateColumns: '1fr' }}>
              <div 
                className={`${styles.iconCard} ${copiedSection === 'install' ? styles.iconCardCopied : ''}`}
                style={{ height: 'auto', cursor: 'pointer' }}
                onClick={() => copyCodeBlock('install', 'pnpm add @claude-flow/ui-kit-icons')}
              >
                <SyntaxHighlight 
                  code={`# Install the package
pnpm add @claude-flow/ui-kit-icons`}
                  language="bash"
                />
                {copiedSection === 'install' && (
                  <div className={styles.copiedBadge}>Copied!</div>
                )}
              </div>

              <div 
                className={`${styles.iconCard} ${copiedSection === 'import' ? styles.iconCardCopied : ''}`}
                style={{ height: 'auto', cursor: 'pointer' }}
                onClick={() => {
                  const code = `import { SaveIcon, EditIcon } from '@claude-flow/ui-kit-icons';

function MyComponent() {
  return (
    <div>
      <SaveIcon size={24} />
      <EditIcon size={20} style={{ color: "var(--color-primary)" }} />
    </div>
  );
}`;
                  copyCodeBlock('import', code);
                }}
              >
                <SyntaxHighlight 
                  code={`import { SaveIcon, EditIcon } from '@claude-flow/ui-kit-icons';

function MyComponent() {
  return (
    <div>
      <SaveIcon size={24} />
      <EditIcon size={20} style={{ color: "var(--color-primary)" }} />
    </div>
  );
}`}
                  language="jsx"
                />
                {copiedSection === 'import' && (
                  <div className={styles.copiedBadge}>Copied!</div>
                )}
              </div>
            </div>
          </section>

          <section className={styles.categorySection}>
            <h2 className={styles.categoryTitle}>
              Theme Integration
              <span className={styles.categoryCount}>Color & Styling</span>
            </h2>
            
            <div className={styles.iconGrid} style={{ gridTemplateColumns: '1fr' }}>
              <div 
                className={`${styles.iconCard} ${copiedSection === 'theme' ? styles.iconCardCopied : ''}`}
                style={{ height: 'auto', cursor: 'pointer' }}
                onClick={() => {
                  const code = `// Icons automatically use theme colors
<SaveIcon /> // Uses currentColor (inherits from parent)

// Use CSS variables for theme colors
<SaveIcon style={{ color: "var(--color-primary)" }} />
<EditIcon style={{ color: "var(--color-success)" }} />
<DeleteIcon style={{ color: "var(--color-error)" }} />`;
                  copyCodeBlock('theme', code);
                }}
              >
                <SyntaxHighlight 
                  code={`// Icons automatically use theme colors
<SaveIcon /> // Uses currentColor (inherits from parent)

// Use CSS variables for theme colors
<SaveIcon style={{ color: "var(--color-primary)" }} />
<EditIcon style={{ color: "var(--color-success)" }} />
<DeleteIcon style={{ color: "var(--color-error)" }} />`}
                  language="jsx"
                />
                {copiedSection === 'theme' && (
                  <div className={styles.copiedBadge}>Copied!</div>
                )}
              </div>
            </div>
          </section>

          <section className={styles.categorySection}>
            <h2 className={styles.categoryTitle}>
              Accessibility
              <span className={styles.categoryCount}>ARIA & Screen Readers</span>
            </h2>
            
            <div className={styles.iconGrid} style={{ gridTemplateColumns: '1fr' }}>
              <div 
                className={`${styles.iconCard} ${copiedSection === 'a11y' ? styles.iconCardCopied : ''}`}
                style={{ height: 'auto', cursor: 'pointer' }}
                onClick={() => {
                  const code = `// Decorative icon (hidden from screen readers)
<SaveIcon size={20} />

// Semantic icon with accessible title
<SaveIcon size={20} title="Save document" />

// Icon button with proper labeling
<button aria-label="Save document">
  <SaveIcon size={20} />
</button>`;
                  copyCodeBlock('a11y', code);
                }}
              >
                <SyntaxHighlight 
                  code={`// Decorative icon (hidden from screen readers)
<SaveIcon size={20} />

// Semantic icon with accessible title
<SaveIcon size={20} title="Save document" />

// Icon button with proper labeling
<button aria-label="Save document">
  <SaveIcon size={20} />
</button>`}
                  language="jsx"
                />
                {copiedSection === 'a11y' && (
                  <div className={styles.copiedBadge}>Copied!</div>
                )}
              </div>
            </div>
          </section>

          <section className={styles.categorySection}>
            <h2 className={styles.categoryTitle}>
              Best Practices
              <span className={styles.categoryCount}>Tips & Guidelines</span>
            </h2>
            
            <div className={styles.iconGrid}>
              <div className={styles.iconCard} style={{ height: 'auto' }}>
                <div className={styles.iconWrapper}>
                  <Icons.CodeIcon size={32} />
                </div>
                <div className={styles.iconName}>Tree Shaking</div>
                <p style={{ fontSize: 'var(--font-size-small10)', color: 'var(--color-panel-text-soft20)', textAlign: 'center', margin: 0 }}>
                  Import icons individually for optimal bundle size
                </p>
              </div>

              <div className={styles.iconCard} style={{ height: 'auto' }}>
                <div className={styles.iconWrapper}>
                  <Icons.SettingsIcon size={32} />
                </div>
                <div className={styles.iconName}>Consistent Sizing</div>
                <p style={{ fontSize: 'var(--font-size-small10)', color: 'var(--color-panel-text-soft20)', textAlign: 'center', margin: 0 }}>
                  Use the size prop for consistent icon dimensions
                </p>
              </div>

              <div className={styles.iconCard} style={{ height: 'auto' }}>
                <div className={styles.iconWrapper}>
                  <Icons.CheckCircleIcon size={32} />
                </div>
                <div className={styles.iconName}>Accessibility</div>
                <p style={{ fontSize: 'var(--font-size-small10)', color: 'var(--color-panel-text-soft20)', textAlign: 'center', margin: 0 }}>
                  Add title or aria-label for semantic icons
                </p>
              </div>

              <div className={styles.iconCard} style={{ height: 'auto' }}>
                <div className={styles.iconWrapper}>
                  <Icons.ImageIcon size={32} />
                </div>
                <div className={styles.iconName}>Theme Colors</div>
                <p style={{ fontSize: 'var(--font-size-small10)', color: 'var(--color-panel-text-soft20)', textAlign: 'center', margin: 0 }}>
                  Use CSS variables from ui-kit for consistent theming
                </p>
              </div>
            </div>
          </section>
        </main>

        <footer className={styles.footer}>
          Click any code block to copy it to your clipboard
        </footer>
      </div>
    );
  },
};