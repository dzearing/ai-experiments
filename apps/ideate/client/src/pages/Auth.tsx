import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from '@ui-kit/router';
import { Button, Card, Input, Spinner } from '@ui-kit/react';
import { useAuth } from '../contexts/AuthContext';
import styles from './Auth.module.css';

function getReturnTo(search: string): string {
  const params = new URLSearchParams(search);
  const returnTo = params.get('returnTo');

  // Security: only allow relative paths starting with /
  if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
    return returnTo;
  }

  return '/dashboard';
}

export function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, isLoading, isAuthenticated } = useAuth();
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');

  // Get the return URL from query params
  const returnTo = useMemo(() => getReturnTo(location.search), [location.search]);

  // Redirect to returnTo if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(returnTo);
    }
  }, [isAuthenticated, navigate, returnTo]);

  if (isAuthenticated) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmed = nickname.trim();
    if (!trimmed) {
      setError('Please enter a nickname');
      return;
    }

    if (trimmed.length < 2) {
      setError('Nickname must be at least 2 characters');
      return;
    }

    try {
      await signIn(trimmed);
      navigate(returnTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    }
  };

  return (
    <div className={styles.auth}>
      <Card className={styles.authCard}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>I</span>
          <span className={styles.logoText}>Ideate</span>
        </div>

        <h1 className={styles.title}>Welcome to Ideate</h1>
        <p className={styles.subtitle}>Enter a nickname to get started</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <Input
              type="text"
              placeholder="Your nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
            {error && <p className={styles.error}>{error}</p>}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={isLoading || !nickname.trim()}
            className={styles.submitButton}
          >
            {isLoading ? (
              <>
                <Spinner size="sm" />
                Joining...
              </>
            ) : (
              'Join Ideate'
            )}
          </Button>
        </form>

        <p className={styles.terms}>
          Your nickname will be visible to other collaborators.
        </p>
      </Card>
    </div>
  );
}
