export interface GitHubAccount {
  id: string;
  username: string;
  email: string;
  avatarUrl: string;
  accountType: 'personal' | 'enterprise';
  isActive: boolean;
  connectedAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  accounts: GitHubAccount[];
  activeAccountId: string | null;
}

export interface AuthContextValue {
  authState: AuthState;
  activeAccount: GitHubAccount | null;
  signInWithGitHub: () => Promise<void>;
  signOut: (accountId: string) => Promise<void>;
  switchAccount: (accountId: string) => void;
  refreshAccounts: () => Promise<void>;
}