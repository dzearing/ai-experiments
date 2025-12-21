import { Router, Routes, Route } from '@ui-kit/router';
import { AuthProvider } from './contexts/AuthContext';
import { DocumentProvider } from './contexts/DocumentContext';
import { ChatProvider } from './contexts/ChatContext';
import { NetworkProvider } from './contexts/NetworkContext';
import { SessionProvider } from './contexts/SessionContext';
import { WorkspaceProvider } from './contexts/WorkspaceContext';

// Pages
import { Landing } from './pages/Landing';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { Diagnostics } from './pages/Diagnostics';
import { DocumentEditor } from './pages/DocumentEditor';
import { ChatRoom } from './pages/ChatRoom';
import { JoinWorkspace } from './pages/JoinWorkspace';
import { Settings } from './pages/Settings';
import { Workspaces } from './pages/Workspaces';
import { WorkspaceDetail } from './pages/WorkspaceDetail';

// Layouts
import { AppLayout } from './components/AppLayout/AppLayout';

export function App() {
  return (
    <SessionProvider>
      <Router>
        <AuthProvider>
          <DocumentProvider>
            <ChatProvider>
              <WorkspaceProvider>
                <NetworkProvider>
                  <Routes>
                    {/* Public routes */}
                    <Route path="/" component={Landing} />
                    <Route path="/auth" component={Auth} />
                    <Route path="/join/:token" component={JoinWorkspace} />
                    <Route path="/diagnostics" component={Diagnostics} />

                    {/* Protected routes with app layout */}
                    <Route component={AppLayout}>
                      <Route path="/dashboard" component={Dashboard} />
                      <Route path="/workspaces" component={Workspaces} />
                      <Route path="/workspace/:workspaceId" component={WorkspaceDetail} />
                      <Route path="/doc/:documentId" component={DocumentEditor} />
                      <Route path="/chat/:chatRoomId" component={ChatRoom} />
                      <Route path="/settings" component={Settings} />
                    </Route>
                  </Routes>
                </NetworkProvider>
              </WorkspaceProvider>
            </ChatProvider>
          </DocumentProvider>
        </AuthProvider>
      </Router>
    </SessionProvider>
  );
}
