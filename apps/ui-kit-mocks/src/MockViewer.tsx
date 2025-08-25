import React, { lazy, Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';

const LoadingFallback = () => (
  <div style={{ padding: '2rem', textAlign: 'center' }}>
    <h2>Loading mock...</h2>
  </div>
);

const NotFound = () => (
  <div style={{ padding: '2rem', textAlign: 'center' }}>
    <h2>Mock not found</h2>
    <p>The requested mock component could not be found.</p>
    <Link to="/" style={{ color: 'var(--color-link)' }}>← Back to catalog</Link>
  </div>
);

export const MockViewer: React.FC = () => {
  const params = useParams();
  const mockPath = params['*'] || '';

  // Dynamically import the mock component based on the path
  const MockComponent = lazy(() => {
    switch (mockPath) {
      case 'view-layouts/stackable-panels':
        return import('./mocks/view-layouts/stackable-panels/example');
      case 'view-layouts/tree-view':
        return import('./mocks/view-layouts/tree-view/example');
      case 'terminal-components/claude-code-terminal':
        return import('./mocks/terminal-components/claude-code-terminal/example');
      default:
        return Promise.resolve({ default: NotFound });
    }
  });

  return (
    <Suspense fallback={<LoadingFallback />}>
      <MockComponent />
    </Suspense>
  );
};