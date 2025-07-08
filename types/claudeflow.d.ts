// Type definitions for claudeflow.settings.json

export interface ClaudeFlowSettings {
  version: string;
  projectName: string;
  repositories: {
    [repoId: string]: {
      url?: string;
      type?: 'github' | 'ado' | 'local';
      status: 'available' | 'reserved';
      reservedBy?: 'claude-code' | 'work-item' | string;
      reservedAt?: string; // ISO timestamp
      workItemId?: string;
      branch?: string;
      description?: string;
    };
  };
  defaultBranch?: string;
  lastUpdated: string; // ISO timestamp
}