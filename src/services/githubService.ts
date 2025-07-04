interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  clone_url: string;
  private: boolean;
  created_at: string;
  updated_at: string;
  language: string | null;
  default_branch: string;
}

interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  email: string | null;
  bio: string | null;
}

class GitHubService {
  private baseUrl = 'http://localhost:3000/api';

  async makeAuthenticatedRequest(
    accountId: string,
    endpoint: string,
    options: RequestInit = {}
  ) {
    const response = await fetch(`${this.baseUrl}/github/proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: JSON.stringify({
        accountId,
        endpoint,
        method: options.method || 'GET',
        body: options.body
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'GitHub API request failed');
    }

    return response.json();
  }

  async listRepositories(accountId: string, options?: {
    type?: 'all' | 'owner' | 'public' | 'private' | 'member';
    sort?: 'created' | 'updated' | 'pushed' | 'full_name';
    per_page?: number;
    page?: number;
  }): Promise<GitHubRepository[]> {
    const params = new URLSearchParams();
    if (options?.type) params.append('type', options.type);
    if (options?.sort) params.append('sort', options.sort);
    if (options?.per_page) params.append('per_page', options.per_page.toString());
    if (options?.page) params.append('page', options.page.toString());

    const endpoint = `/user/repos${params.toString() ? `?${params.toString()}` : ''}`;
    return this.makeAuthenticatedRequest(accountId, endpoint);
  }

  async createRepository(accountId: string, options: {
    name: string;
    description?: string;
    private?: boolean;
    auto_init?: boolean;
    gitignore_template?: string;
    license_template?: string;
  }): Promise<GitHubRepository> {
    return this.makeAuthenticatedRequest(accountId, '/user/repos', {
      method: 'POST',
      body: JSON.stringify(options)
    });
  }

  async getRepository(accountId: string, owner: string, repo: string): Promise<GitHubRepository> {
    return this.makeAuthenticatedRequest(accountId, `/repos/${owner}/${repo}`);
  }

  async getUser(accountId: string): Promise<GitHubUser> {
    return this.makeAuthenticatedRequest(accountId, '/user');
  }

  async createFile(
    accountId: string,
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    branch?: string
  ) {
    const encodedContent = btoa(content);
    
    return this.makeAuthenticatedRequest(
      accountId,
      `/repos/${owner}/${repo}/contents/${path}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          message,
          content: encodedContent,
          branch
        })
      }
    );
  }

  async updateFile(
    accountId: string,
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    sha: string,
    branch?: string
  ) {
    const encodedContent = btoa(content);
    
    return this.makeAuthenticatedRequest(
      accountId,
      `/repos/${owner}/${repo}/contents/${path}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          message,
          content: encodedContent,
          sha,
          branch
        })
      }
    );
  }

  async createPullRequest(
    accountId: string,
    owner: string,
    repo: string,
    options: {
      title: string;
      body?: string;
      head: string;
      base: string;
      draft?: boolean;
    }
  ) {
    return this.makeAuthenticatedRequest(
      accountId,
      `/repos/${owner}/${repo}/pulls`,
      {
        method: 'POST',
        body: JSON.stringify(options)
      }
    );
  }

  async searchRepositories(accountId: string, query: string, options?: {
    sort?: 'stars' | 'forks' | 'updated';
    order?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
  }) {
    const params = new URLSearchParams();
    params.append('q', query);
    if (options?.sort) params.append('sort', options.sort);
    if (options?.order) params.append('order', options.order);
    if (options?.per_page) params.append('per_page', options.per_page.toString());
    if (options?.page) params.append('page', options.page.toString());

    const endpoint = `/search/repositories?${params.toString()}`;
    return this.makeAuthenticatedRequest(accountId, endpoint);
  }
}

export const githubService = new GitHubService();