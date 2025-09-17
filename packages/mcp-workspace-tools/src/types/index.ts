export interface WorkspaceInfo {
  workspacePath: string;
  projects: ProjectSummary[];
}

export interface ProjectSummary {
  name: string;
  path: string;
  description: string;
  hasRepos: boolean;
}

export interface ProjectInfo {
  name: string;
  path: string;
  description: string;
  repos: RepoInfo[];
  workItems: WorkItemCounts;
}

export interface RepoInfo {
  name: string;
  number: number;
  path: string;
  isAvailable: boolean;
  packages?: PackageInfo[];
}

export interface PackageInfo {
  name: string;
  path: string;
  type: 'app' | 'package' | 'tool';
}

export interface WorkItemCounts {
  ideas: number;
  planned: number;
  active: number;
  completed: number;
}

export interface PathResolution {
  path: string;
  type: 'workspace' | 'project' | 'repo' | 'package';
  project?: string;
  repo?: string;
  package?: string;
}

export interface WorkItemInfo {
  name: string;
  path: string;
  status: 'ideas' | 'planned' | 'active' | 'completed';
  project: string;
  content?: string;
}