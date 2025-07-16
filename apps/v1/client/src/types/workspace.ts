export interface WorkspaceConfig {
  path: string;
  name: string;
}

export interface WorkspaceState {
  config: WorkspaceConfig | null;
  isLoading: boolean;
  error: string | null;
}

export interface WorkspaceProject {
  name: string;
  path: string;
  isLoading?: boolean;
  repos: WorkspaceRepo[];
  repositories?: any[]; // For backward compatibility
  plans?: {
    ideas: WorkspacePlan[];
    planned: WorkspacePlan[];
    active: WorkspacePlan[];
    completed: WorkspacePlan[];
  };
  readme?: string;
  purpose?: string;
  primaryRepoUrl?: string;
  id?: string;
}

export interface WorkspaceRepo {
  name: string;
  number: number;
  path: string;
  isAvailable: boolean;
  activeWorkItem?: string;
  branch?: string;
}

export interface WorkspacePlan {
  name: string;
  path: string;
  status: 'idea' | 'planned' | 'active' | 'completed';
  content?: string;
  workItem?: {
    title?: string;
    description?: string;
    priority?: string;
    status?: string;
    tasks?: any[];
    goals?: string[];
    acceptanceCriteria?: string[];
    metadata?: {
      workItemId?: string;
      [key: string]: any;
    };
  };
}