import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AppProvider } from './contexts/AppContext';
import { ThemeProvider } from './contexts/ThemeContextV2';
import { WorkspaceProvider, useWorkspace } from './contexts/WorkspaceContext';
import { LayoutProvider } from './contexts/LayoutContext';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider } from './contexts/AuthContext';
import { GitHubProvider } from './contexts/GitHubContext';
import { ThemedLayoutV2 } from './components/ThemedLayoutV2';
import { WorkspaceDialogContainer } from './components/WorkspaceDialogContainer';
import { WorkspaceSync } from './components/WorkspaceSync';
import { ThemeSwitcherV2 } from './components/ThemeSwitcherV2';
import { ToastContainer } from './components/ToastContainer';
import { ThemedDashboard } from './pages/ThemedDashboard';
import { ThemedPersonas } from './pages/ThemedPersonas';
import { WorkItems } from './pages/WorkItems';
import { JamSessions } from './pages/JamSessions';
import { NewAgentMultiStep } from './pages/NewAgentMultiStep';
import { NewProjectMultiStep } from './pages/NewProjectMultiStep';
import { NewWorkItemMultiStep } from './pages/NewWorkItemMultiStep';
import { Projects } from './pages/Projects';
import { DebugClaude } from './pages/DebugClaude';
import { JamSessionDetail } from './pages/JamSessionDetail';
import { WorkItemJamSession } from './pages/WorkItemJamSession';

function AppContent() {
  const { workspace, setWorkspacePath } = useWorkspace();
  const [showWorkspaceSetup, setShowWorkspaceSetup] = useState(false);

  useEffect(() => {
    // Show setup dialog if no workspace is configured
    if (!workspace.config && !workspace.isLoading) {
      setShowWorkspaceSetup(true);
    } else if (workspace.config) {
      // Hide dialog if workspace is already configured
      setShowWorkspaceSetup(false);
    }
  }, [workspace.config, workspace.isLoading]);

  const handleWorkspaceSetup = async (path: string) => {
    await setWorkspacePath(path);
    setShowWorkspaceSetup(false);
  };

  return (
    <>
      <WorkspaceDialogContainer 
        isOpen={showWorkspaceSetup} 
        onComplete={handleWorkspaceSetup} 
      />
      {workspace.config && (
        <>
          <WorkspaceSync />
          <Routes>
            <Route path="/" element={<ThemedLayoutV2 />}>
              <Route index element={<ThemedDashboard />} />
              <Route path="projects" element={<Projects />} />
              <Route path="projects/new" element={<NewProjectMultiStep />} />
              <Route path="projects/:projectId/workitems/new" element={<NewWorkItemMultiStep />} />
              <Route path="work-items" element={<WorkItems />} />
              <Route path="work-items/new" element={<NewWorkItemMultiStep />} />
              <Route path="work-items/:workItemId/edit" element={<NewWorkItemMultiStep />} />
              <Route path="work-items/:workItemId/jam" element={<WorkItemJamSession />} />
              <Route path="agents" element={<ThemedPersonas />} />
              <Route path="agents/new" element={<NewAgentMultiStep />} />
              <Route path="agents/new/:step" element={<NewAgentMultiStep />} />
              <Route path="agents/edit/:personaId" element={<NewAgentMultiStep />} />
              <Route path="agents/edit/:personaId/:step" element={<NewAgentMultiStep />} />
              <Route path="jam-sessions" element={<JamSessions />} />
              <Route path="jam-sessions/:id" element={<JamSessionDetail />} />
              <Route path="daily-report" element={<div>Daily Report Page (TODO)</div>} />
              <Route path="debug-claude" element={<DebugClaude />} />
            </Route>
          </Routes>
          <ThemeSwitcherV2 />
          <ToastContainer />
        </>
      )}
    </>
  );
}

function App() {
  return (
    <AppProvider>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <GitHubProvider>
              <WorkspaceProvider>
                <LayoutProvider>
                  <BrowserRouter>
                    <AppContent />
                  </BrowserRouter>
                </LayoutProvider>
              </WorkspaceProvider>
            </GitHubProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </AppProvider>
  );
}

export default App;