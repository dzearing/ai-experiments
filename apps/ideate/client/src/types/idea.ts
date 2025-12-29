/** Source of the idea - user-created or AI-generated */
export type IdeaSource = 'user' | 'ai';

/** Kanban lane statuses */
export type IdeaStatus = 'new' | 'exploring' | 'executing' | 'archived';

/** Execution state for ideas in the 'executing' status */
export interface IdeaExecutionState {
  progressPercent: number;
  waitingForFeedback: boolean;
  chatRoomId?: string;
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
