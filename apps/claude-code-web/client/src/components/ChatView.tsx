import { useState, useEffect } from 'react';
import { Button } from '@ui-kit/react';
import styles from './ChatView.module.css';

interface HealthStatus {
  status: string;
  timestamp: string;
  version: string;
}

export function ChatView() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/health');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      setHealthStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className={styles.chatView}>
      <div className={styles.statusPanel}>
        <h2>Server Status</h2>
        {loading && <p className={styles.loading}>Checking connection...</p>}
        {error && (
          <p className={styles.error}>
            Connection error: {error}
          </p>
        )}
        {healthStatus && (
          <div className={styles.status}>
            <p>
              <strong>Status:</strong> {healthStatus.status}
            </p>
            <p>
              <strong>Version:</strong> {healthStatus.version}
            </p>
            <p>
              <strong>Timestamp:</strong> {healthStatus.timestamp}
            </p>
          </div>
        )}
        <Button onClick={checkHealth} disabled={loading}>
          Refresh Status
        </Button>
      </div>
      <div className={styles.chatPlaceholder}>
        <p>Chat interface will be implemented in Phase 2</p>
      </div>
    </div>
  );
}
