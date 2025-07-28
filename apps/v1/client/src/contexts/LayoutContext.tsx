import { createContext, useContext, useState, type ReactNode } from 'react';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export type HeaderContent = string | BreadcrumbItem[] | null;

interface LayoutContextType {
  headerTitle: string | null;
  setHeaderTitle: (title: string | null) => void;
  headerContent: HeaderContent;
  setHeaderContent: (content: HeaderContent) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [headerTitle, setHeaderTitle] = useState<string | null>(null);
  const [headerContent, setHeaderContent] = useState<HeaderContent>(null);

  return (
    <LayoutContext.Provider
      value={{
        headerTitle,
        setHeaderTitle,
        headerContent,
        setHeaderContent,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within LayoutProvider');
  }
  return context;
}
