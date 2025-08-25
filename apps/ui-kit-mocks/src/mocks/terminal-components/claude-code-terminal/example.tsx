import React from 'react';
import { ClaudeCodeTerminal } from './ClaudeCodeTerminal';
import styles from './example.module.css';

const ClaudeCodeTerminalExample: React.FC = () => {
  const handleCommand = (command: string) => {
    console.log('Command executed:', command);
  };

  const handlePrompt = (prompt: string) => {
    console.log('Prompt submitted:', prompt);
  };

  return (
    <div className={styles.exampleContainer}>
      <div className={styles.terminalWrapper}>
        <ClaudeCodeTerminal
          onCommand={handleCommand}
          onPrompt={handlePrompt}
        />
      </div>
    </div>
  );
};

// IMPORTANT: Must be default export for dynamic loading
export default ClaudeCodeTerminalExample;