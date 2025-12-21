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

// Generate a simple avatar URL from nickname (no longer used for background, Avatar handles it)
function getAvatarUrl(nickname: string): string {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(nickname)}&backgroundColor=transparent&textColor=ffffff`;
}

// Generate a deterministic ID from nickname (consistent across logins)
function generateId(nickname: string): string {
  const normalized = nickname.toLowerCase().replace(/\s+/g, '-');
  // Simple hash for consistency - same nickname always produces same ID
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `user-${normalized}-${Math.abs(hash).toString(36)}`;
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
        let needsSave = false;

        // Migrate: regenerate ID to be deterministic based on nickname
        // This ensures the same nickname produces the same ID across machines
        if (parsed.name) {
          const expectedId = generateId(parsed.name);
          if (parsed.id !== expectedId) {
            parsed.id = expectedId;
            needsSave = true;
          }
        }

        // Migrate: remove deprecated color field if present
        if (parsed.color) {
          delete parsed.color;
          needsSave = true;
        }

        if (needsSave) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        }
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
