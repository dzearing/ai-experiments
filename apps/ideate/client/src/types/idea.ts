/** Source of the idea - user-created or AI-generated */
export type IdeaSource = 'user' | 'ai';

/** Kanban lane statuses */
export type IdeaStatus = 'new' | 'exploring' | 'executing' | 'archived';

/** Execution mode - whether to run all phases or pause between each */
export type ExecutionMode = 'all-phases' | 'phase-by-phase';

// ============================================
// PLAN DATA STRUCTURES
// ============================================

/** Individual task within a plan phase */
export interface PlanTask {
  id: string;
  title: string;
  completed: boolean;
  inProgress?: boolean;
}

/** A phase in the implementation plan */
export interface PlanPhase {
  id: string;
  title: string;
  description?: string;
  tasks: PlanTask[];
  expanded?: boolean;
}

/** Complete implementation plan for an idea */
export interface IdeaPlan {
  phases: PlanPhase[];
  workingDirectory: string;
  repositoryUrl?: string;
  branch?: string;
  isClone?: boolean;
  workspaceId?: string;
  createdAt: string;
  updatedAt: string;
}

/** Options for starting execution */
export interface ExecutionOptions {
  mode: ExecutionMode;
  startPhaseId?: string;
}

// ============================================
// EXECUTION STATE
// ============================================

/** Execution state for ideas in the 'executing' status */
export interface IdeaExecutionState {
  progressPercent: number;
  waitingForFeedback: boolean;
  chatRoomId?: string;
  /** When execution started */
  startedAt?: string;
  /** Currently executing phase */
  currentPhaseId?: string;
  /** Currently executing task */
  currentTaskId?: string;
  /** Execution mode */
  mode?: ExecutionMode;
}

/** Attachment metadata */
export interface IdeaAttachment {
  id: string;
  filename: string;
  mimeType: string;
  url?: string;
  filePath?: string;
  createdAt: string;
}

/** Idea metadata for list views */
export interface IdeaMetadata {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  rating: 1 | 2 | 3 | 4;
  source: IdeaSource;
  status: IdeaStatus;
  ownerId: string;
  workspaceId?: string;
  /** References to Things (many-to-many) */
  thingIds: string[];
  createdAt: string;
  updatedAt: string;
  statusChangedAt: string;
  attachments: IdeaAttachment[];
  /** Implementation plan (available when status is 'exploring' or later) */
  plan?: IdeaPlan;
  /** Execution state (available when status is 'executing') */
  execution?: IdeaExecutionState;
}

/** Full idea object with extended description */
export interface Idea extends IdeaMetadata {
  description?: string;
}

/** Filter options for the ideas list */
export interface IdeaFilter {
  source?: IdeaSource | 'all';
  status?: IdeaStatus | 'all';
  searchQuery?: string;
  tags?: string[];
}

/** Input for creating a new idea */
export interface CreateIdeaInput {
  title: string;
  summary: string;
  tags?: string[];
  rating?: 1 | 2 | 3 | 4;
  workspaceId?: string;
  thingIds?: string[];
  description?: string;
}

/** Input for updating an idea */
export interface UpdateIdeaInput {
  title?: string;
  summary?: string;
  tags?: string[];
  description?: string;
  workspaceId?: string;
  thingIds?: string[];
}
