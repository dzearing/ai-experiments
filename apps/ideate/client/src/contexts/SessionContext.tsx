import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { API_URL } from '../config';

const SESSION_STORAGE_KEY = 'ideate-session-id';

export interface SessionInfo {
  sessionId: string;
  color: string;
}

interface SessionContextValue {
  session: SessionInfo | null;
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextValue | null>(null);

interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initSession = async () => {
      try {
        // Check if we have an existing sessionId in sessionStorage
        const existingSessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);

        // Call the server to get or create session info
        const response = await fetch(`${API_URL}/api/session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId: existingSessionId }),
        });

        if (!response.ok) {
          throw new Error('Failed to get session info');
        }

        const sessionInfo: SessionInfo = await response.json();

        // Store the sessionId in sessionStorage (persists across refresh)
        sessionStorage.setItem(SESSION_STORAGE_KEY, sessionInfo.sessionId);

        setSession(sessionInfo);
      } catch (error) {
        console.error('[Session] Failed to initialize session:', error);
        // Fallback to a local session if server is unavailable
        const fallbackSession: SessionInfo = {
          sessionId: `local-${Date.now()}`,
          color: '#888888',
        };
        setSession(fallbackSession);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();
  }, []);

  const value: SessionContextValue = {
    session,
    isLoading,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
