import React from 'react';
import { Spinner } from '@claude-flow/ui-kit-react';
import { CheckCircleIcon, HourglassIcon, PlayIcon } from '@claude-flow/ui-kit-icons';
import styles from './AgentsView.module.css';

interface Agent {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'completed';
  description: string;
  lastRun?: string;
}

export const AgentsView: React.FC = () => {
  const agents: Agent[] = [
    {
      id: '1',
      name: 'Code Reviewer',
      status: 'completed',
      description: 'Reviews code for best practices and potential issues',
      lastRun: '2 minutes ago'
    },
    {
      id: '2',
      name: 'Test Generator',
      status: 'running',
      description: 'Generates unit and integration tests',
      lastRun: 'Running now'
    },
    {
      id: '3',
      name: 'Documentation Writer',
      status: 'idle',
      description: 'Creates and updates documentation',
      lastRun: '1 hour ago'
    },
    {
      id: '4',
      name: 'Performance Analyzer',
      status: 'idle',
      description: 'Analyzes code for performance bottlenecks',
      lastRun: '3 hours ago'
    }
  ];

  const getStatusIcon = (status: Agent['status']) => {
    switch (status) {
      case 'running':
        return <Spinner size="small" />;
      case 'completed':
        return <CheckCircleIcon size={16} />;
      case 'idle':
        return <HourglassIcon size={16} />;
    }
  };

  return (
    <div className={styles.agentsView}>
      <div className={styles.header}>
        <h3>Available Agents</h3>
        <span className={styles.count}>{agents.length} agents</span>
      </div>
      <div className={styles.agentList}>
        {agents.map(agent => (
          <div key={agent.id} className={styles.agentCard}>
            <div className={styles.agentHeader}>
              <div className={styles.agentStatus}>
                {getStatusIcon(agent.status)}
              </div>
              <div className={styles.agentInfo}>
                <h4>{agent.name}</h4>
                <p>{agent.description}</p>
              </div>
              <button className={styles.runButton} disabled={agent.status === 'running'}>
                <PlayIcon size={14} />
                Run
              </button>
            </div>
            {agent.lastRun && (
              <div className={styles.agentFooter}>
                Last run: {agent.lastRun}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};