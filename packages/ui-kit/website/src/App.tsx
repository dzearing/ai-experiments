import { Routes, Route } from 'react-router-dom';
import { Layout } from './layouts/Layout';
import { LessonLayout } from './components/LessonLayout';
import { HomePage } from './pages/Home/HomePage';
import { LearnPage } from './pages/Learn/LearnPage';
import { GettingStartedPage } from './pages/Learn/GettingStartedPage';
import { SurfacesPage } from './pages/Learn/SurfacesPage';
import { StylingComponentsPage } from './pages/Learn/StylingComponentsPage';
import { ThemingPage } from './pages/Learn/ThemingPage';
import { AdvancedPage } from './pages/Learn/AdvancedPage';
import { ReferencePage } from './pages/Reference/ReferencePage';
import { ThemesPage } from './pages/Themes/ThemesPage';
import { ThemeDesignerPage } from './pages/Themes/ThemeDesignerPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="learn" element={<LearnPage />} />
        <Route
          path="learn/getting-started"
          element={
            <LessonLayout>
              <GettingStartedPage />
            </LessonLayout>
          }
        />
        <Route
          path="learn/surfaces"
          element={
            <LessonLayout>
              <SurfacesPage />
            </LessonLayout>
          }
        />
        <Route
          path="learn/styling-components"
          element={
            <LessonLayout>
              <StylingComponentsPage />
            </LessonLayout>
          }
        />
        <Route
          path="learn/theming"
          element={
            <LessonLayout>
              <ThemingPage />
            </LessonLayout>
          }
        />
        <Route
          path="learn/advanced"
          element={
            <LessonLayout>
              <AdvancedPage />
            </LessonLayout>
          }
        />
        <Route path="reference" element={<ReferencePage />} />
        <Route path="themes" element={<ThemesPage />} />
        <Route path="themes/designer" element={<ThemeDesignerPage />} />
      </Route>
    </Routes>
  );
}
