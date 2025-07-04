import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AuthState, AuthContextValue } from '../types/auth';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'github_auth_state';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    accounts: [],
    activeAccountId: null
  });
  const [isInitialized, setIsInitialized] = useState(false);

  // Load auth state from localStorage on mount and verify accounts
  useEffect(() => {
    const loadAndVerifyAuth = async () => {
      const savedState = localStorage.getItem(STORAGE_KEY);
      console.log('Loading auth state from localStorage:', savedState);
      
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState);
          console.log('Parsed auth state:', parsed);
          
          // For development, skip verification and trust the stored state
          // In production, you'd want to verify tokens are still valid
          const skipVerification = true; // Toggle this for development
          
          if (skipVerification) {
            // Just restore the saved state
            setAuthState(parsed);
          } else {
            // Verify each account is still valid on the server
            const validAccounts = [];
            for (const account of parsed.accounts) {
              try {
                const response = await fetch('http://localhost:3000/api/auth/github/verify', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ accountId: account.id })
                });
                
                if (response.ok) {
                  validAccounts.push(account);
                } else {
                  console.log(`Account ${account.username} verification failed`);
                }
              } catch (error) {
                console.log(`Account ${account.username} verification error:`, error);
              }
            }
            
            // Update state with only valid accounts
            setAuthState({
              isAuthenticated: validAccounts.length > 0,
              accounts: validAccounts,
              activeAccountId: validAccounts.find(a => a.id === parsed.activeAccountId) 
                ? parsed.activeAccountId 
                : (validAccounts[0]?.id || null)
            });
          }
        } catch (error) {
          console.error('Failed to parse saved auth state:', error);
        }
      }
      setIsInitialized(true);
    };
    
    loadAndVerifyAuth();
  }, []);

  // Save auth state to localStorage whenever it changes (but only after initialization)
  useEffect(() => {
    if (isInitialized) {
      console.log('Saving auth state to localStorage:', authState);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authState));
    }
  }, [authState, isInitialized]);

  const activeAccount = authState.accounts.find(
    account => account.id === authState.activeAccountId
  ) || null;

  const signInWithGitHub = async () => {
    try {
      // Initiate GitHub OAuth flow
      const response = await fetch('http://localhost:3000/api/auth/github/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to initiate GitHub login');
      }

      const { authUrl } = await response.json();

      // Open OAuth flow in a popup window
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        authUrl,
        'github-oauth',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
      );
      
      if (!popup) {
        throw new Error('Please allow popups for GitHub authentication');
      }

      // Listen for OAuth callback
      const handleMessage = async (event: MessageEvent) => {
        console.log('Message received:', event.origin, event.data);
        
        if (event.origin !== window.location.origin) {
          console.log('Origin mismatch:', event.origin, 'vs', window.location.origin);
          return;
        }

        if (event.data.type === 'github-oauth-callback') {
          console.log('GitHub OAuth callback received:', event.data);
          const { code, state } = event.data;

          // Exchange code for access token
          const tokenResponse = await fetch('http://localhost:3000/api/auth/github/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, state })
          });

          if (tokenResponse.ok) {
            const accountData = await tokenResponse.json();
            
            // Add or update account in state
            setAuthState(prev => {
              const existingIndex = prev.accounts.findIndex(
                acc => acc.id === accountData.id
              );

              let newAccounts;
              if (existingIndex >= 0) {
                // Update existing account
                newAccounts = [...prev.accounts];
                newAccounts[existingIndex] = accountData;
              } else {
                // Add new account
                newAccounts = [...prev.accounts, accountData];
              }

              return {
                isAuthenticated: true,
                accounts: newAccounts,
                activeAccountId: accountData.id
              };
            });
          }

          // Clean up
          window.removeEventListener('message', handleMessage);
          if (popup && !popup.closed) {
            popup.close();
          }
        }
      };

      window.addEventListener('message', handleMessage);

      // Clean up if popup is closed manually
      const checkPopup = setInterval(() => {
        if (popup && popup.closed) {
          clearInterval(checkPopup);
          window.removeEventListener('message', handleMessage);
        }
      }, 1000);

    } catch (error) {
      console.error('GitHub sign in error:', error);
      throw error;
    }
  };

  const signOut = async (accountId: string) => {
    try {
      // Call backend to revoke token
      await fetch(`http://localhost:3000/api/auth/github/logout/${accountId}`, {
        method: 'POST'
      });

      // Remove account from state
      setAuthState(prev => {
        const newAccounts = prev.accounts.filter(acc => acc.id !== accountId);
        const wasActive = prev.activeAccountId === accountId;
        
        return {
          isAuthenticated: newAccounts.length > 0,
          accounts: newAccounts,
          activeAccountId: wasActive && newAccounts.length > 0 
            ? newAccounts[0].id 
            : prev.activeAccountId
        };
      });
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const switchAccount = (accountId: string) => {
    setAuthState(prev => ({
      ...prev,
      activeAccountId: accountId
    }));
  };

  const refreshAccounts = async () => {
    try {
      // Refresh account data from backend
      const response = await fetch('http://localhost:3000/api/auth/github/accounts');
      if (response.ok) {
        const accounts = await response.json();
        setAuthState(prev => ({
          ...prev,
          accounts
        }));
      }
    } catch (error) {
      console.error('Failed to refresh accounts:', error);
    }
  };

  const value: AuthContextValue = {
    authState,
    activeAccount,
    signInWithGitHub,
    signOut,
    switchAccount,
    refreshAccounts
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}