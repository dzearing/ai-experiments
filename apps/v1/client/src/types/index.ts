export interface Persona {
  id: string;
  type: PersonaType;
  jobTitle: string;
  name: string;
  personality?: string; // Deprecated - kept for backwards compatibility
  expertise: string[];
  status: 'available' | 'busy' | 'offline';
  currentTaskId?: string;
  avatarSeed?: string;
  avatarGender?: 'male' | 'female';
  systemPrompt?: string; // Deprecated - kept for backwards compatibility
  agentPrompt?: string; // Full markdown specification of the agent
}

export type PersonaType =
  | 'usability-expert'
  | 'developer'
  | 'tester'
  | 'data-scientist'
  | 'devops'
  | 'project-manager'
  | 'designer'
  | 'motion-designer';

export type ProjectStatus = 'active' | 'paused' | 'completed';

export interface Repository {
  url: string;
  type: 'github' | 'ado';
  visibility: 'public' | 'private';
  isPrimary?: boolean;
  importantFolders?: {
    path: string;
    description: string;
  }[];
  description?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  purpose?: string;
  status: 'active' | 'paused' | 'completed';
  createdAt: Date;
  updatedAt: Date;
  workItems: string[]; // WorkItem IDs
  path?: string;
  repositories?: Repository[];
  primaryRepoUrl?: string;
  readme?: string;
}

export interface WorkItem {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: WorkItemStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedPersonaIds: string[];
  createdAt: Date;
  updatedAt: Date;
  workflow: WorkflowStep[];
  currentWorkflowStep?: number;
  jamSessionIds: string[];
  markdownPath?: string;
  metadata?: {
    tasks?: Array<{
      id: string;
      title: string;
      description: string;
      goals: string[];
      workDescription: string;
      validationCriteria: string[];
      taskNumber?: string;
      completed?: boolean;
      status?: 'pending' | 'in-progress' | 'completed';
    }>;
    currentTaskIndex?: number;
    goals?: string[];
    acceptanceCriteria?: string[];
    workItemId?: string;
    generalMarkdown?: string;
  };
}

export type WorkItemStatus =
  | 'ideas'
  | 'planned'
  | 'active'
  | 'in-review'
  | 'blocked'
  | 'completed'
  | 'todo';

export interface WorkflowStep {
  name: string;
  status: 'pending' | 'active' | 'completed';
  completedBy?: string; // Persona ID
  completedAt?: Date;
}

export interface JamSession {
  id: string;
  workItemId: string;
  title: string;
  participantIds: string[]; // Persona IDs
  messages: JamMessage[];
  summary?: string;
  decisions: Decision[];
  createdAt: Date;
  status: 'active' | 'completed';
  draftContent?: string; // Draft markdown content being edited
  lastScrollPosition?: number; // To restore scroll position
}

export interface JamMessage {
  id: string;
  personaId: string;
  content: string;
  timestamp: Date;
  type: 'message' | 'challenge' | 'suggestion' | 'decision';
}

export interface Decision {
  id: string;
  description: string;
  madeBy: string; // Persona ID
  supportedBy: string[]; // Persona IDs
  timestamp: Date;
}

export interface ProjectUpdate {
  projectId: string;
  summary: string;
  progress: number; // 0-100
}

export interface DecisionRequest {
  id: string;
  workItemId: string;
  question: string;
  context: string;
  options: string[];
  requestedBy: string; // Persona ID
}

export interface Blocker {
  id: string;
  workItemId: string;
  description: string;
  blockedPersonaIds: string[];
  createdAt: Date;
}

export interface DailyReport {
  id: string;
  date: Date;
  projectUpdates: ProjectUpdate[];
  decisionsNeeded: DecisionRequest[];
  blockers: Blocker[];
  completedItems: string[]; // WorkItem IDs
}
