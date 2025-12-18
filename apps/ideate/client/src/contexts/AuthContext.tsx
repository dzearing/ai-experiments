import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';

export interface User {
  id: string;
  name: string;
  avatarUrl: string;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (nickname: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'ideate-user';

// Generate a simple avatar URL from nickname
function getAvatarUrl(nickname: string): string {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(nickname)}&backgroundColor=2563eb&textColor=ffffff`;
}

// Generate a simple ID from nickname
function generateId(nickname: string): string {
  return `user-${nickname.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString(36)}`;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      }
    } catch {
      // Invalid stored data, ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signIn = useCallback(async (nickname: string) => {
    const trimmed = nickname.trim();
    if (!trimmed) {
      throw new Error('Nickname is required');
    }

    const newUser: User = {
      id: generateId(trimmed),
      name: trimmed,
      avatarUrl: getAvatarUrl(trimmed),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    setUser(newUser);
  }, []);

  const signOut = useCallback(async () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  const value: AuthContextValue = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
