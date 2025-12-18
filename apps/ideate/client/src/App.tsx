import { Routes, Route, useLocation, useNavigationType } from 'react-router-dom';
import { PageTransition, useHistoryIndex } from '@ui-kit/react';
import { AuthProvider } from './contexts/AuthContext';
import { DocumentProvider } from './contexts/DocumentContext';
import { NetworkProvider } from './contexts/NetworkContext';

// Pages
import { Landing } from './pages/Landing';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { DocumentEditor } from './pages/DocumentEditor';
import { Settings } from './pages/Settings';

// Layouts
import { AppLayout } from './components/AppLayout/AppLayout';

export function App() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const historyIndex = useHistoryIndex({
    locationKey: location.key,
    navigationType,
  });

  return (
    <AuthProvider>
      <DocumentProvider>
        <NetworkProvider>
          <PageTransition
            transitionKey={location.key}
            historyIndex={historyIndex}
          >
            <Routes location={location}>
              {/* Public routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />

              {/* Protected routes with app layout */}
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/doc/:documentId" element={<DocumentEditor />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Routes>
          </PageTransition>
        </NetworkProvider>
      </DocumentProvider>
    </AuthProvider>
  );
}
