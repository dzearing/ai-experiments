/** Property definition with resolution rules for type schemas */
export interface PropertyDef {
  /** Display label for UI */
  label: string;
  /** Property type for input rendering */
  type: 'text' | 'url' | 'path' | 'topic-ref';
  /** If topic-ref, what types can be referenced */
  refTypes?: string[];
  /** Is this required for the type? */
  required?: boolean;
  /** For path properties: inherit from parent topic and join with this property */
  inheritPath?: {
    /** Property name containing the parent topic ID */
    fromProperty: string;
    /** Property name to append to parent's localPath */
    joinWith?: string;
  };
}

/** Type schema with all metadata in one place */
export interface TopicTypeSchema {
  /** Display label for the type */
  displayLabel: string;
  /** Icon name for the type */
  icon?: TopicIcon;
  /** Key properties that define this type - shown prominently in UI */
  keyProperties: Record<string, PropertyDef>;
  /** Can this type provide execution context for code work? */
  providesExecutionContext?: boolean;
}

/** Resolved key properties from a topic and its ancestors */
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
  /** Parent topic ID that provides context */
  contextTopicId?: string;
  /** Parent topic name */
  contextTopicName?: string;
}

/** Type schemas defining key properties and resolution rules for each topic type */
export const TOPIC_TYPE_SCHEMAS: Record<string, TopicTypeSchema> = {
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
      repoTopicId: {
        label: 'Repository',
        type: 'topic-ref',
        refTypes: ['git-repo'],
        required: true,
      },
      relativePath: { label: 'Path in Repo', type: 'text' },
      // localPath is derived: parent.localPath + relativePath
      localPath: {
        label: 'Full Path',
        type: 'path',
        inheritPath: { fromProperty: 'repoTopicId', joinWith: 'relativePath' },
      },
    },
  },
  feature: {
    displayLabel: 'Feature',
    icon: 'star',
    providesExecutionContext: true,
    keyProperties: {
      packageTopicId: {
        label: 'Package',
        type: 'topic-ref',
        refTypes: ['git-package'],
        required: true,
      },
      entryFile: { label: 'Entry File', type: 'text' },
      // localPath inherited from package
      localPath: {
        label: 'Path',
        type: 'path',
        inheritPath: { fromProperty: 'packageTopicId' },
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

/** Predefined topic types (for UI suggestions) - includes new typed topics */
export const PREDEFINED_TOPIC_TYPES = [
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

/** Topic type classification - allows custom string values */
export type TopicType = string;

/** Attachment metadata */
export interface TopicAttachment {
  id: string;
  filename: string;
  mimeType: string;
  url?: string;
  filePath?: string;
  createdAt: string;
}

/** Cached idea counts by status */
export interface TopicIdeaCounts {
  new: number;
  exploring: number;
  ready: number;
  archived: number;
}

/** Link types for Topic links */
export type TopicLinkType = 'file' | 'url' | 'github' | 'package';

/** A link attached to a Topic */
export interface TopicLink {
  id: string;
  type: TopicLinkType;
  /** Display label for the link */
  label: string;
  /** The URL, file path, or identifier */
  target: string;
  /** Optional description */
  description?: string;
  createdAt: string;
}

/** Inline document stored with a Topic */
export interface TopicDocument {
  id: string;
  title: string;
  /** Markdown content */
  content: string;
  createdAt: string;
  updatedAt: string;
}

/** Curated icon set for Topics */
export type TopicIcon =
  | 'folder' | 'file' | 'code' | 'gear' | 'star' | 'heart'
  | 'home' | 'calendar' | 'chat' | 'user' | 'users' | 'bell'
  | 'link' | 'image' | 'clock' | 'check-circle' | 'warning'
  | 'info' | 'table' | 'list-task' | 'package' | 'globe';

/** Color palette for Topics */
export type TopicColor =
  | 'default' | 'blue' | 'green' | 'purple' | 'orange'
  | 'red' | 'teal' | 'pink' | 'yellow' | 'gray';

/** Topic metadata for list views */
export interface TopicMetadata {
  id: string;
  name: string;
  description?: string;
  type: TopicType;
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
  attachments: TopicAttachment[];
  /** Cached idea counts */
  ideaCounts?: TopicIdeaCounts;
  /** Links to external resources (files, URLs, GitHub repos, packages) */
  links?: TopicLink[];
  /** Custom key-value properties */
  properties?: Record<string, string>;
  /** Icon identifier for display */
  icon?: TopicIcon;
  /** Background color for chips/badges */
  color?: TopicColor;
}

/** Full Topic object with extended content */
export interface Topic extends TopicMetadata {
  content?: string;
  /** Inline documents stored with the Topic */
  documents?: TopicDocument[];
}

/** Filter options for the topics list */
export interface TopicFilter {
  searchQuery?: string;
  tags?: string[];
  type?: TopicType | 'all';
  parentId?: string | null;
}

/** Input for creating a new topic */
export interface CreateTopicInput {
  name: string;
  description?: string;
  type?: TopicType;
  tags?: string[];
  parentIds?: string[];
  workspaceId?: string;
  content?: string;
  /** Insert after this topic ID (used to calculate order) */
  insertAfterId?: string;
  /** Initial links */
  links?: Omit<TopicLink, 'id' | 'createdAt'>[];
  /** Initial properties */
  properties?: Record<string, string>;
  /** Initial icon */
  icon?: TopicIcon;
  /** Initial color */
  color?: TopicColor;
}

/** Input for updating a topic */
export interface UpdateTopicInput {
  name?: string;
  description?: string;
  type?: TopicType;
  tags?: string[];
  parentIds?: string[];
  workspaceId?: string;
  content?: string;
  /** Update links (replaces all links) */
  links?: TopicLink[];
  /** Update properties (replaces all properties) */
  properties?: Record<string, string>;
  /** Update icon */
  icon?: TopicIcon | null;
  /** Update color */
  color?: TopicColor | null;
}

/** Tree node for rendering the topics hierarchy */
export interface TopicTreeNode {
  topic: TopicMetadata;
  children: TopicTreeNode[];
  depth: number;
  isExpanded: boolean;
}

/** Topic reference for autocomplete and chat */
export interface TopicReference {
  id: string;
  name: string;
  type: TopicType;
  parentIds: string[];
  /** Icon for chip display */
  icon?: TopicIcon;
  /** Color for chip display */
  color?: TopicColor;
  /** Tags for filtering */
  tags?: string[];
  /** Breadcrumb path */
  path?: string;
}
