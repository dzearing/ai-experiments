import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { ThemeProvider } from './contexts/ThemeContextV2';
import { ThemedLayoutV2 } from './components/ThemedLayoutV2';
import { ThemeSwitcherV2 } from './components/ThemeSwitcherV2';
import { ThemedDashboard } from './pages/ThemedDashboard';
import { ThemedPersonas } from './pages/ThemedPersonas';
import { WorkItems } from './pages/WorkItems';
import { JamSessions } from './pages/JamSessions';
import { ThemedNewPersona } from './pages/ThemedNewPersona';
import { NewProject } from './pages/NewProject';
import { NewWorkItem } from './pages/NewWorkItem';
import { NewWorkItemMultiStep } from './pages/NewWorkItemMultiStep';
import { Projects } from './pages/Projects';

function App() {
  return (
    <AppProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<ThemedLayoutV2 />}>
              <Route index element={<ThemedDashboard />} />
              <Route path="projects" element={<Projects />} />
              <Route path="projects/new" element={<NewProject />} />
              <Route path="work-items" element={<WorkItems />} />
              <Route path="work-items/new" element={<NewWorkItem />} />
              <Route path="work-items/new-ai" element={<NewWorkItemMultiStep />} />
              <Route path="personas" element={<ThemedPersonas />} />
              <Route path="personas/new" element={<ThemedNewPersona />} />
              <Route path="jam-sessions" element={<JamSessions />} />
              <Route path="daily-report" element={<div>Daily Report Page (TODO)</div>} />
            </Route>
          </Routes>
          <ThemeSwitcherV2 />
        </BrowserRouter>
      </ThemeProvider>
    </AppProvider>
  );
}

export default App;