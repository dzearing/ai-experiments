import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AppProvider } from './contexts/AppContext';
import { ThemeProvider } from './contexts/ThemeContextV2';
import { WorkspaceProvider, useWorkspace } from './contexts/WorkspaceContext';
import { ThemedLayoutV2 } from './components/ThemedLayoutV2';
import { WorkspaceDialogContainer } from './components/WorkspaceDialogContainer';
import { ThemeSwitcherV2 } from './components/ThemeSwitcherV2';
import { ThemedDashboard } from './pages/ThemedDashboard';
import { ThemedPersonas } from './pages/ThemedPersonas';
import { WorkItems } from './pages/WorkItems';
import { JamSessions } from './pages/JamSessions';
import { ThemedNewPersona } from './pages/ThemedNewPersona';
import { NewProject } from './pages/NewProject';
import { NewWorkItemMultiStep } from './pages/NewWorkItemMultiStep';
import { Projects } from './pages/Projects';
import { DebugClaude } from './pages/DebugClaude';
import { JamSessionDetail } from './pages/JamSessionDetail';

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
          <Routes>
            <Route path="/" element={<ThemedLayoutV2 />}>
              <Route index element={<ThemedDashboard />} />
              <Route path="projects" element={<Projects />} />
              <Route path="projects/new" element={<NewProject />} />
              <Route path="work-items" element={<WorkItems />} />
              <Route path="work-items/new-ai" element={<NewWorkItemMultiStep />} />
              <Route path="personas" element={<ThemedPersonas />} />
              <Route path="personas/new" element={<ThemedNewPersona />} />
              <Route path="jam-sessions" element={<JamSessions />} />
              <Route path="jam-sessions/:id" element={<JamSessionDetail />} />
              <Route path="daily-report" element={<div>Daily Report Page (TODO)</div>} />
              <Route path="debug-claude" element={<DebugClaude />} />
            </Route>
          </Routes>
          <ThemeSwitcherV2 />
        </>
      )}
    </>
  );
}

function App() {
  return (
    <AppProvider>
      <ThemeProvider>
        <WorkspaceProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </WorkspaceProvider>
      </ThemeProvider>
    </AppProvider>
  );
}

export default App;