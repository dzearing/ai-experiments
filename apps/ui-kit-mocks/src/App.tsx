import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './App.module.css';
import { Button } from '@claude-flow/ui-kit-react';
import componentData from './component-data.json';

interface ComponentItem {
  name: string;
  folder: string;
  plans: string[];
  mockups: string[];
}

interface Categories {
  [key: string]: ComponentItem[];
}

function App() {
  const [categories, setCategories] = useState<Categories>({});
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [allCollapsed, setAllCollapsed] = useState(false);
  const [stats, setStats] = useState({
    totalComponents: 0,
    totalPlans: 0,
    totalMockups: 0,
  });

  useEffect(() => {
    // Load component data from JSON file
    setCategories(componentData.categories);

    // Calculate stats
    let totalComponents = 0;
    let totalPlans = 0;
    let totalMockups = 0;

    Object.values(componentData.categories).forEach((items) => {
      totalComponents += items.length;
      items.forEach((item) => {
        totalPlans += item.plans.length;
        totalMockups += item.mockups.length;
      });
    });

    setStats({ totalComponents, totalPlans, totalMockups });
  }, []);

  const toggleCategory = (category: string) => {
    setCollapsedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const toggleAll = () => {
    if (allCollapsed) {
      setCollapsedCategories(new Set());
    } else {
      setCollapsedCategories(new Set(Object.keys(categories)));
    }
    setAllCollapsed(!allCollapsed);
  };

  const formatLabel = (filename: string) => {
    if (filename === 'plan.md') return 'Plan';
    if (filename === 'mockup.html') return 'Mockup';
    
    let cleanName = filename
      .replace(/^mock-/, '')
      .replace(/^mockup-/, '')
      .replace(/\.(md|html)$/, '')
      .replace(/-/g, ' ');
    
    cleanName = cleanName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    return filename.endsWith('.md') ? cleanName : `Mockup: ${cleanName}`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>🎨 UI Kit Component Mocks & Experiments</h1>
        <Button onClick={toggleAll} variant="primary" size="small">
          {allCollapsed ? 'Expand All' : 'Collapse All'}
        </Button>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{stats.totalComponents}</span>
          <span className={styles.statLabel}>Components</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{stats.totalPlans}</span>
          <span className={styles.statLabel}>Plans</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{stats.totalMockups}</span>
          <span className={styles.statLabel}>Mockups</span>
        </div>
      </div>

      <div className={styles.content}>
        {Object.entries(categories).map(([categoryName, items]) => {
          const categoryKey = categoryName.toLowerCase().replace(/\s+/g, '-');
          const isCollapsed = collapsedCategories.has(categoryName);

          return (
            <div
              key={categoryKey}
              className={`${styles.category} ${isCollapsed ? styles.collapsed : ''}`}
            >
              <div
                className={styles.categoryHeader}
                onClick={() => toggleCategory(categoryName)}
              >
                <div className={styles.categoryTitle}>
                  <svg
                    className={styles.categoryChevron}
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <path
                      d="M6 4L10 8L6 12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                  {categoryName}
                  <span className={styles.categoryCount}>({items.length})</span>
                </div>
              </div>

              <div className={styles.categoryContent}>
                <div className={styles.componentList}>
                  {items.length === 0 ? (
                    <div className={styles.emptyState}>No components yet</div>
                  ) : (
                    items.map((item) => (
                      <div key={item.folder} className={styles.componentItem}>
                        <div className={styles.componentName}>{item.name}</div>
                        <div className={styles.componentLinks}>
                          {item.plans.map((plan) => (
                            <span
                              key={plan}
                              className={`${styles.linkBadge} ${styles.plan}`}
                              style={{ cursor: 'not-allowed', opacity: 0.5 }}
                              title="Plans are not yet implemented"
                            >
                              📋 {formatLabel(plan)}
                            </span>
                          ))}
                          {item.mockups.map((mockup) => (
                            <Link
                              key={mockup}
                              to={`/mock/${item.folder}`}
                              className={`${styles.linkBadge} ${styles.mockup}`}
                            >
                              🎨 {formatLabel(mockup)}
                            </Link>
                          ))}
                          {item.plans.length === 0 && item.mockups.length === 0 && (
                            <span className={styles.emptyState}>No resources yet</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;
