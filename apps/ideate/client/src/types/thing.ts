/** Property definition with resolution rules for type schemas */
export interface PropertyDef {
  /** Display label for UI */
  label: string;
  /** Property type for input rendering */
  type: 'text' | 'url' | 'path' | 'thing-ref';
  /** If thing-ref, what types can be referenced */
  refTypes?: string[];
  /** Is this required for the type? */
  required?: boolean;
  /** For path properties: inherit from parent thing and join with this property */
  inheritPath?: {
    /** Property name containing the parent thing ID */
    fromProperty: string;
    /** Property name to append to parent's localPath */
    joinWith?: string;
  };
}

/** Type schema with all metadata in one place */
export interface ThingTypeSchema {
  /** Display label for the type */
  displayLabel: string;
  /** Icon name for the type */
  icon?: ThingIcon;
  /** Key properties that define this type - shown prominently in UI */
  keyProperties: Record<string, PropertyDef>;
  /** Can this type provide execution context for code work? */
  providesExecutionContext?: boolean;
}

/** Resolved key properties from a thing and its ancestors */
export interface ResolvedKeyProperties {
  /** Absolute local path on disk */
  localPath?: string;
  /** Git remote URL */
  remoteUrl?: string;
  /** Git branch */
  branch?: string;
  /** URL for web resources */
  url?: string;
  /** True if remote-only repo that needs cloning */
  requiresClone?: boolean;
  /** Parent thing ID that provides context */
  contextThingId?: string;
  /** Parent thing name */
  contextThingName?: string;
}

/** Type schemas defining key properties and resolution rules for each thing type */
export const THING_TYPE_SCHEMAS: Record<string, ThingTypeSchema> = {
  folder: {
    displayLabel: 'Local Folder',
    icon: 'folder',
    providesExecutionContext: true,
    keyProperties: {
      localPath: { label: 'Path', type: 'path', required: true },
    },
  },
  'git-repo': {
    displayLabel: 'Git Repository',
    icon: 'code',
    providesExecutionContext: true,
    keyProperties: {
      remoteUrl: { label: 'Remote URL', type: 'url' },
      localPath: { label: 'Local Path', type: 'path' },
      defaultBranch: { label: 'Default Branch', type: 'text' },
    },
  },
  'git-package': {
    displayLabel: 'Package',
    icon: 'package',
    providesExecutionContext: true,
    keyProperties: {
      repoThingId: {
        label: 'Repository',
        type: 'thing-ref',
        refTypes: ['git-repo'],
        required: true,
      },
      relativePath: { label: 'Path in Repo', type: 'text' },
      // localPath is derived: parent.localPath + relativePath
      localPath: {
        label: 'Full Path',
        type: 'path',
        inheritPath: { fromProperty: 'repoThingId', joinWith: 'relativePath' },
      },
    },
  },
  feature: {
    displayLabel: 'Feature',
    icon: 'star',
    providesExecutionContext: true,
    keyProperties: {
      packageThingId: {
        label: 'Package',
        type: 'thing-ref',
        refTypes: ['git-package'],
        required: true,
      },
      entryFile: { label: 'Entry File', type: 'text' },
      // localPath inherited from package
      localPath: {
        label: 'Path',
        type: 'path',
        inheritPath: { fromProperty: 'packageThingId' },
      },
    },
  },
  'web-resource': {
    displayLabel: 'Web Resource',
    icon: 'globe',
    keyProperties: {
      url: { label: 'URL', type: 'url', required: true },
    },
  },
  collection: {
    displayLabel: 'Collection',
    icon: 'folder',
    keyProperties: {},
  },
  // Legacy types for backward compatibility
  category: {
    displayLabel: 'Category',
    icon: 'folder',
    keyProperties: {},
  },
  project: {
    displayLabel: 'Project',
    icon: 'code',
    providesExecutionContext: true,
    keyProperties: {
      localPath: { label: 'Path', type: 'path' },
      remoteUrl: { label: 'Repository URL', type: 'url' },
    },
  },
  item: {
    displayLabel: 'Item',
    keyProperties: {},
  },
};

/** Predefined thing types (for UI suggestions) - includes new typed things */
export const PREDEFINED_THING_TYPES = [
  'folder',
  'git-repo',
  'git-package',
  'feature',
  'web-resource',
  'collection',
  'category',
  'project',
  'item',
] as const;

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
