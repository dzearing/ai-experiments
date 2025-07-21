# GitHub Authentication

This document describes the GitHub authentication system implemented in Claude Flow.

## Overview

The authentication system allows users to:

- Sign in with multiple GitHub accounts (personal and enterprise)
- Switch between accounts seamlessly
- Execute GitHub API operations with the selected account
- Securely manage authentication tokensa

## Setup

### 1. Create a GitHub OAuth Application

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in the application details:
   - **Application name**: Claude Flow (or your preferred name)
   - **Homepage URL**: http://localhost:3000
   - **Authorization callback URL**: http://localhost:3000/oauth-callback.html
4. Click "Register application"
5. Copy the Client ID and generate a Client Secret

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```env
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

## Architecture

### Components

- **AuthAvatar**: Avatar dropdown in the top-right corner for account management
- **AuthContext**: Manages authentication state and account switching
- **GitHubContext**: Provides GitHub API functionality with active account context
- **GitHubService**: Service layer for making authenticated GitHub API calls

### OAuth Flow

1. User clicks "Add GitHub Account" in the avatar dropdown
2. OAuth popup opens with GitHub authorization page
3. User authorizes the application
4. GitHub redirects to `/oauth-callback.html` with authorization code
5. Callback page posts message to opener window
6. Main app exchanges code for access token via backend
7. Account information is stored and user is authenticated

### Security

- OAuth state parameter prevents CSRF attacks
- Access tokens are stored server-side only
- Frontend never has direct access to tokens
- All GitHub API calls proxy through backend with token injection
- Tokens can be encrypted at rest (implement in production)

## Usage

### Signing In

```typescript
import { useAuth } from './contexts/AuthContext';

function MyComponent() {
  const { signInWithGitHub } = useAuth();

  const handleSignIn = async () => {
    try {
      await signInWithGitHub();
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  };
}
```

### Using GitHub API

```typescript
import { useGitHub } from './contexts/GitHubContext';

function RepositoryList() {
  const { listRepositories, isAuthenticated } = useGitHub();

  useEffect(() => {
    if (isAuthenticated) {
      const fetchRepos = async () => {
        const repos = await listRepositories({
          sort: 'updated',
          per_page: 20,
        });
        setRepositories(repos);
      };
      fetchRepos();
    }
  }, [isAuthenticated]);
}
```

### Available GitHub Operations

- `listRepositories(options)` - List user's repositories
- `createRepository(options)` - Create a new repository
- `getRepository(owner, repo)` - Get repository details
- `searchRepositories(query, options)` - Search repositories
- `createFile(owner, repo, path, content, message, branch?)` - Create a file
- `updateFile(owner, repo, path, content, message, sha, branch?)` - Update a file
- `createPullRequest(owner, repo, options)` - Create a pull request

## Multi-Account Support

Users can connect multiple GitHub accounts:

1. Each account is stored with a unique ID
2. One account is marked as "active" at a time
3. All GitHub API operations use the active account's credentials
4. Users can switch accounts from the avatar dropdown
5. Each account maintains its own session

## Rate Limiting

The system handles GitHub API rate limits:

- Rate limit headers are checked on each request
- When limit is exceeded, user receives appropriate error message
- Rate limit info is included in API responses

## Future Enhancements

- Support for GitHub Apps (better security and rate limits)
- Token refresh mechanism
- Support for other Git providers (GitLab, Bitbucket, Azure DevOps)
- Fine-grained permissions per account
- Persistent token storage with encryption
- Team/organization account support
