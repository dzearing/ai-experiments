/** Thing type classification */
export type ThingType = 'category' | 'project' | 'feature' | 'item';

/** Attachment metadata */
export interface ThingAttachment {
  id: string;
  filename: string;
  mimeType: string;
  url?: string;
  filePath?: string;
  createdAt: string;
}

/** Cached idea counts by status */
export interface ThingIdeaCounts {
  new: number;
  exploring: number;
  ready: number;
  archived: number;
}

/** Thing metadata for list views */
export interface ThingMetadata {
  id: string;
  name: string;
  description?: string;
  type: ThingType;
  tags: string[];
  /** Multiple parents supported - graph model */
  parentIds: string[];
  ownerId: string;
  /** undefined = global (private), string = workspace-scoped */
  workspaceId?: string;
  createdAt: string;
  updatedAt: string;
  lastAccessedAt: string;
  attachments: ThingAttachment[];
  /** Cached idea counts */
  ideaCounts?: ThingIdeaCounts;
}

/** Full Thing object with extended content */
export interface Thing extends ThingMetadata {
  content?: string;
}

/** Filter options for the things list */
export interface ThingFilter {
  searchQuery?: string;
  tags?: string[];
  type?: ThingType | 'all';
  parentId?: string | null;
}

/** Input for creating a new thing */
export interface CreateThingInput {
  name: string;
  description?: string;
  type?: ThingType;
  tags?: string[];
  parentIds?: string[];
  workspaceId?: string;
  content?: string;
}

/** Input for updating a thing */
export interface UpdateThingInput {
  name?: string;
  description?: string;
  type?: ThingType;
  tags?: string[];
  parentIds?: string[];
  workspaceId?: string;
  content?: string;
}

/** Tree node for rendering the things hierarchy */
export interface ThingTreeNode {
  thing: ThingMetadata;
  children: ThingTreeNode[];
  depth: number;
  isExpanded: boolean;
}

/** Thing reference for autocomplete and chat */
export interface ThingReference {
  id: string;
  name: string;
  type: ThingType;
  parentIds: string[];
}
