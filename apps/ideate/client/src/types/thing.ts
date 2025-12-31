/** Predefined thing types (for UI suggestions) */
export const PREDEFINED_THING_TYPES = ['category', 'project', 'feature', 'item'] as const;

/** Thing type classification - allows custom string values */
export type ThingType = string;

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

/** Link types for Thing links */
export type ThingLinkType = 'file' | 'url' | 'github' | 'package';

/** A link attached to a Thing */
export interface ThingLink {
  id: string;
  type: ThingLinkType;
  /** Display label for the link */
  label: string;
  /** The URL, file path, or identifier */
  target: string;
  /** Optional description */
  description?: string;
  createdAt: string;
}

/** Inline document stored with a Thing */
export interface ThingDocument {
  id: string;
  title: string;
  /** Markdown content */
  content: string;
  createdAt: string;
  updatedAt: string;
}

/** Curated icon set for Things */
export type ThingIcon =
  | 'folder' | 'file' | 'code' | 'gear' | 'star' | 'heart'
  | 'home' | 'calendar' | 'chat' | 'user' | 'users' | 'bell'
  | 'link' | 'image' | 'clock' | 'check-circle' | 'warning'
  | 'info' | 'table' | 'list-task' | 'package' | 'globe';

/** Color palette for Things */
export type ThingColor =
  | 'default' | 'blue' | 'green' | 'purple' | 'orange'
  | 'red' | 'teal' | 'pink' | 'yellow' | 'gray';

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
  /** Sort order for stable positioning (lower = earlier in list) */
  order?: number;
  attachments: ThingAttachment[];
  /** Cached idea counts */
  ideaCounts?: ThingIdeaCounts;
  /** Links to external resources (files, URLs, GitHub repos, packages) */
  links?: ThingLink[];
  /** Custom key-value properties */
  properties?: Record<string, string>;
  /** Icon identifier for display */
  icon?: ThingIcon;
  /** Background color for chips/badges */
  color?: ThingColor;
}

/** Full Thing object with extended content */
export interface Thing extends ThingMetadata {
  content?: string;
  /** Inline documents stored with the Thing */
  documents?: ThingDocument[];
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
  /** Insert after this thing ID (used to calculate order) */
  insertAfterId?: string;
  /** Initial links */
  links?: Omit<ThingLink, 'id' | 'createdAt'>[];
  /** Initial properties */
  properties?: Record<string, string>;
  /** Initial icon */
  icon?: ThingIcon;
  /** Initial color */
  color?: ThingColor;
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
  /** Update links (replaces all links) */
  links?: ThingLink[];
  /** Update properties (replaces all properties) */
  properties?: Record<string, string>;
  /** Update icon */
  icon?: ThingIcon | null;
  /** Update color */
  color?: ThingColor | null;
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
  /** Icon for chip display */
  icon?: ThingIcon;
  /** Color for chip display */
  color?: ThingColor;
  /** Tags for filtering */
  tags?: string[];
  /** Breadcrumb path */
  path?: string;
}
