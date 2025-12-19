import { Router, Routes, Route } from '@ui-kit/router';
import { AuthProvider } from './contexts/AuthContext';
import { DocumentProvider } from './contexts/DocumentContext';
import { NetworkProvider } from './contexts/NetworkContext';
import { SaveProvider } from './contexts/SaveContext';
import { WorkspaceProvider } from './contexts/WorkspaceContext';

// Pages
import { Landing } from './pages/Landing';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { DocumentEditor } from './pages/DocumentEditor';
import { Settings } from './pages/Settings';
import { Workspaces } from './pages/Workspaces';
import { WorkspaceDetail } from './pages/WorkspaceDetail';

// Layouts
import { AppLayout } from './components/AppLayout/AppLayout';

export function App() {
  return (
    <Router>
      <AuthProvider>
        <DocumentProvider>
          <WorkspaceProvider>
            <SaveProvider>
              <NetworkProvider>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" component={Landing} />
                  <Route path="/auth" component={Auth} />

                  {/* Protected routes with app layout */}
                  <Route component={AppLayout}>
                    <Route path="/dashboard" component={Dashboard} />
                    <Route path="/workspaces" component={Workspaces} />
                    <Route path="/workspace/:workspaceId" component={WorkspaceDetail} />
                    <Route path="/doc/:documentId" component={DocumentEditor} />
                    <Route path="/settings" component={Settings} />
                  </Route>
                </Routes>
              </NetworkProvider>
            </SaveProvider>
          </WorkspaceProvider>
        </DocumentProvider>
      </AuthProvider>
    </Router>
  );
}
