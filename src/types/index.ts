export interface Persona {
  id: string;
  type: PersonaType;
  name: string;
  personality?: string;
  expertise: string[];
  status: 'available' | 'busy' | 'offline';
  currentTaskId?: string;
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

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'completed';
  createdAt: Date;
  updatedAt: Date;
  workItems: string[]; // WorkItem IDs
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
  metadata?: {
    tasks?: Array<{
      id: string;
      title: string;
      description: string;
      goals: string[];
      workDescription: string;
      validationCriteria: string[];
      completed?: boolean;
    }>;
    currentTaskIndex?: number;
  };
}

export type WorkItemStatus = 
  | 'ideas'
  | 'planned' 
  | 'active'
  | 'in-review'
  | 'blocked'
  | 'completed';

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