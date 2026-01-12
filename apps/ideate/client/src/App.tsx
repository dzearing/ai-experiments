import { Router, Routes, Route } from '@ui-kit/router';
import { AuthProvider } from './contexts/AuthContext';
import { DocumentProvider } from './contexts/DocumentContext';
import { ChatProvider } from './contexts/ChatContext';
import { IdeasProvider } from './contexts/IdeasContext';
import { TopicsProvider } from './contexts/TopicsContext';
import { NetworkProvider } from './contexts/NetworkContext';
import { SessionProvider } from './contexts/SessionContext';
import { WorkspaceProvider } from './contexts/WorkspaceContext';
import { FacilitatorProvider } from './contexts/FacilitatorContext';
import { FacilitatorOverlay } from './components/FacilitatorOverlay';

// Pages
import { Landing } from './pages/Landing';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { Diagnostics } from './pages/Diagnostics';
import { DocumentEditor } from './pages/DocumentEditor';
import { ChatRoom } from './pages/ChatRoom';
import { JoinWorkspace } from './pages/JoinWorkspace';
import { Settings } from './pages/Settings';
import { FacilitatorSettings } from './pages/FacilitatorSettings';
import { PersonaEditor } from './pages/PersonaEditor';
import { Workspaces } from './pages/Workspaces';
import { WorkspaceDetail } from './pages/WorkspaceDetail';
import { Ideas } from './pages/Ideas';
import { Topics } from './pages/Topics';

// Layouts
import { AppLayout } from './components/AppLayout/AppLayout';

export function App() {
  return (
    <SessionProvider>
      <Router>
        <AuthProvider>
          <FacilitatorProvider>
            <DocumentProvider>
              <ChatProvider>
                <TopicsProvider>
                  <IdeasProvider>
                    <WorkspaceProvider>
                    <NetworkProvider>
                      <Routes>
                        {/* Public routes */}
                        <Route path="/" component={Landing} />
                        <Route path="/auth" component={Auth} />
                        <Route path="/join/:token" component={JoinWorkspace} />
                        <Route path="/diagnostics" component={Diagnostics} />
                        <Route path="/diagnostics/:tab" component={Diagnostics} />

                        {/* Protected routes with app layout */}
                        <Route component={AppLayout}>
                          {/* Workspace-scoped content routes: /:workspaceId/:pivot/:itemId? */}
                          <Route path="/:workspaceId/topics" component={Topics} />
                          <Route path="/:workspaceId/topics/:topicId" component={Topics} />
                          <Route path="/:workspaceId/ideas" component={Ideas} />
                          <Route path="/:workspaceId/documents" component={Dashboard} />

                          {/* Workspace management */}
                          <Route path="/workspaces" component={Workspaces} />
                          <Route path="/workspaces/:workspaceId" component={WorkspaceDetail} />

                          {/* Document editor (standalone) */}
                          <Route path="/doc/:documentId" component={DocumentEditor} />
                          <Route path="/chat/:chatRoomId" component={ChatRoom} />

                          {/* Settings */}
                          <Route path="/settings" component={Settings} />
                          <Route path="/settings/facilitator" component={FacilitatorSettings} />
                          <Route path="/facilitator-persona" component={PersonaEditor} />
                        </Route>
                      </Routes>
                      {/* Global facilitator overlay */}
                      <FacilitatorOverlay />
                    </NetworkProvider>
                    </WorkspaceProvider>
                  </IdeasProvider>
                </TopicsProvider>
              </ChatProvider>
            </DocumentProvider>
          </FacilitatorProvider>
        </AuthProvider>
      </Router>
    </SessionProvider>
  );
}
