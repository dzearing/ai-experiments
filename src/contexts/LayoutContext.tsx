import { createContext, useContext, useState, type ReactNode } from 'react';

interface LayoutContextType {
  headerTitle: string | null;
  setHeaderTitle: (title: string | null) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [headerTitle, setHeaderTitle] = useState<string | null>(null);

  return (
    <LayoutContext.Provider value={{ headerTitle, setHeaderTitle }}>
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