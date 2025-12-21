import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from '@ui-kit/router';
import { Button, Card, Spinner } from '@ui-kit/react';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspaces, type WorkspacePreview } from '../contexts/WorkspaceContext';
import styles from './JoinWorkspace.module.css';

type JoinStatus = 'loading' | 'preview' | 'joining' | 'success' | 'error';

export function JoinWorkspace() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { getWorkspacePreview, joinWorkspace } = useWorkspaces();

  const [status, setStatus] = useState<JoinStatus>('loading');
  const [preview, setPreview] = useState<WorkspacePreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      const returnTo = encodeURIComponent(location.pathname);
      navigate(`/auth?returnTo=${returnTo}`);
    }
  }, [isAuthLoading, isAuthenticated, navigate, location.pathname]);

  // Load workspace preview
  useEffect(() => {
    async function loadPreview() {
      if (!token || !isAuthenticated) return;

      setStatus('loading');
      setError(null);

      const workspacePreview = await getWorkspacePreview(token);

      if (workspacePreview) {
        setPreview(workspacePreview);
        setStatus('preview');
      } else {
        setError('This invite link is invalid or has expired.');
        setStatus('error');
      }
    }

    if (isAuthenticated) {
      loadPreview();
    }
  }, [token, isAuthenticated, getWorkspacePreview]);

  const handleJoin = async () => {
    if (!token) return;

    setStatus('joining');
    setError(null);

    const workspace = await joinWorkspace(token);

    if (workspace) {
      setStatus('success');
      // Redirect to the workspace
      setTimeout(() => {
        navigate(`/workspace/${workspace.id}`);
      }, 1000);
    } else {
      setError('Failed to join workspace. Please try again.');
      setStatus('error');
    }
  };

  const handleGoToWorkspaces = () => {
    navigate('/workspaces');
  };

  // Show loading while auth is being checked
  if (isAuthLoading) {
    return (
      <div className={styles.join}>
        <Card className={styles.joinCard}>
          <Spinner size="lg" />
          <p className={styles.loadingText}>Loading...</p>
        </Card>
      </div>
    );
  }

  // Not authenticated - will redirect
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={styles.join}>
      <Card className={styles.joinCard}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>I</span>
          <span className={styles.logoText}>Ideate</span>
        </div>

        {status === 'loading' && (
          <>
            <Spinner size="lg" />
            <p className={styles.loadingText}>Loading invite...</p>
          </>
        )}

        {status === 'preview' && preview && (
          <>
            <h1 className={styles.title}>Join Workspace</h1>
            <p className={styles.subtitle}>
              You've been invited to join:
            </p>
            <div className={styles.workspaceName}>{preview.name}</div>
            <div className={styles.actions}>
              <Button
                variant="primary"
                size="lg"
                onClick={handleJoin}
                className={styles.joinButton}
              >
                Join Workspace
              </Button>
              <Button
                variant="ghost"
                onClick={handleGoToWorkspaces}
              >
                Cancel
              </Button>
            </div>
          </>
        )}

        {status === 'joining' && (
          <>
            <Spinner size="lg" />
            <p className={styles.loadingText}>Joining workspace...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className={styles.successIcon}>✓</div>
            <h1 className={styles.title}>Welcome!</h1>
            <p className={styles.subtitle}>
              You've joined the workspace. Redirecting...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className={styles.errorIcon}>!</div>
            <h1 className={styles.title}>Unable to Join</h1>
            <p className={styles.errorText}>{error}</p>
            <Button
              variant="primary"
              onClick={handleGoToWorkspaces}
            >
              Go to Workspaces
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
