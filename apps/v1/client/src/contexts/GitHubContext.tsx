import { createContext, useContext, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { githubService } from '../services/githubService';
import { useToast } from './ToastContext';

interface GitHubContextValue {
  listRepositories: (options?: any) => Promise<any>;
  createRepository: (options: any) => Promise<any>;
  getRepository: (owner: string, repo: string) => Promise<any>;
  searchRepositories: (query: string, options?: any) => Promise<any>;
  createFile: (
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    branch?: string
  ) => Promise<any>;
  updateFile: (
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    sha: string,
    branch?: string
  ) => Promise<any>;
  createPullRequest: (owner: string, repo: string, options: any) => Promise<any>;
  isAuthenticated: boolean;
}

const GitHubContext = createContext<GitHubContextValue | undefined>(undefined);

export function GitHubProvider({ children }: { children: ReactNode }) {
  const { activeAccount } = useAuth();
  const { showToast } = useToast();

  const handleApiError = (error: any) => {
    if (error.message.includes('rate limit')) {
      showToast('GitHub API rate limit exceeded. Please try again later.', 'error');
    } else if (error.message.includes('not authenticated')) {
      showToast('Please sign in to GitHub first', 'error');
    } else {
      showToast(`GitHub API error: ${error.message}`, 'error');
    }
    throw error;
  };

  const ensureAuthenticated = () => {
    if (!activeAccount) {
      throw new Error('No active GitHub account. Please sign in first.');
    }
    return activeAccount.id;
  };

  const value: GitHubContextValue = {
    isAuthenticated: !!activeAccount,

    listRepositories: async (options) => {
      try {
        const accountId = ensureAuthenticated();
        return await githubService.listRepositories(accountId, options);
      } catch (error) {
        return handleApiError(error);
      }
    },

    createRepository: async (options) => {
      try {
        const accountId = ensureAuthenticated();
        return await githubService.createRepository(accountId, options);
      } catch (error) {
        return handleApiError(error);
      }
    },

    getRepository: async (owner, repo) => {
      try {
        const accountId = ensureAuthenticated();
        return await githubService.getRepository(accountId, owner, repo);
      } catch (error) {
        return handleApiError(error);
      }
    },

    searchRepositories: async (query, options) => {
      try {
        const accountId = ensureAuthenticated();
        return await githubService.searchRepositories(accountId, query, options);
      } catch (error) {
        return handleApiError(error);
      }
    },

    createFile: async (owner, repo, path, content, message, branch) => {
      try {
        const accountId = ensureAuthenticated();
        return await githubService.createFile(
          accountId,
          owner,
          repo,
          path,
          content,
          message,
          branch
        );
      } catch (error) {
        return handleApiError(error);
      }
    },

    updateFile: async (owner, repo, path, content, message, sha, branch) => {
      try {
        const accountId = ensureAuthenticated();
        return await githubService.updateFile(
          accountId,
          owner,
          repo,
          path,
          content,
          message,
          sha,
          branch
        );
      } catch (error) {
        return handleApiError(error);
      }
    },

    createPullRequest: async (owner, repo, options) => {
      try {
        const accountId = ensureAuthenticated();
        return await githubService.createPullRequest(accountId, owner, repo, options);
      } catch (error) {
        return handleApiError(error);
      }
    },
  };

  return <GitHubContext.Provider value={value}>{children}</GitHubContext.Provider>;
}

export function useGitHub() {
  const context = useContext(GitHubContext);
  if (context === undefined) {
    throw new Error('useGitHub must be used within a GitHubProvider');
  }
  return context;
}
