import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs/promises';
import * as path from 'path';
import { homedir } from 'os';

// =========================================================================
// Types
// =========================================================================

export type IdeaStatus = 'new' | 'exploring' | 'executing' | 'archived';
export type IdeaSource = 'user' | 'ai';
export type ExecutionMode = 'all-phases' | 'phase-by-phase';

export interface IdeaAttachment {
  id: string;
  filename: string;
  mimeType: string;
  url?: string;        // For external links
  filePath?: string;   // For uploaded files (relative path)
  createdAt: string;
}

// Plan data structures
export interface PlanTask {
  id: string;
  title: string;
  completed: boolean;
  inProgress?: boolean;
  /** Cross-reference to a section in the Implementation Plan document (e.g., "## Component Design") */
  reference?: string;
}

export interface PlanPhase {
  id: string;
  title: string;
  description?: string;
  tasks: PlanTask[];
  expanded?: boolean;
}

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

export interface ExecutionOptions {
  mode: ExecutionMode;
  startPhaseId?: string;
}

export interface IdeaExecutionState {
  progressPercent: number;       // 0-100
  waitingForFeedback: boolean;
  chatRoomId?: string;           // Linked chat room for discussion
  startedAt?: string;            // When execution started
  currentPhaseId?: string;       // Currently executing phase
  currentTaskId?: string;        // Currently executing task
  mode?: ExecutionMode;          // Execution mode
}

export interface IdeaMetadata {
  id: string;
  title: string;
  summary: string;
  tags: string[];                 // Includes priority tags like 'priority:high'
  rating: 1 | 2 | 3 | 4;
  source: IdeaSource;
  status: IdeaStatus;
  ownerId: string;
  workspaceId?: string;           // undefined = global (user's personal ideas)
  thingIds: string[];             // References to Things (many-to-many)
  createdAt: string;
  updatedAt: string;
  statusChangedAt: string;
  attachments: IdeaAttachment[];
  plan?: IdeaPlan;                // Implementation plan (when status is 'exploring' or later)
  execution?: IdeaExecutionState; // Execution state (when status is 'executing')
}

export interface Idea extends IdeaMetadata {
  description?: string;           // Extended description from .md file
}

export interface CreateIdeaInput {
  title: string;
  summary: string;
  tags?: string[];
  rating?: 1 | 2 | 3 | 4;
  source?: IdeaSource;
  workspaceId?: string;
  thingIds?: string[];
  description?: string;
}

export interface UpdateIdeaInput {
  title?: string;
  summary?: string;
  tags?: string[];
  description?: string;
  workspaceId?: string;
  thingIds?: string[];
}

// =========================================================================
// Validation Utilities
// =========================================================================

/**
 * Expand tilde (~) in paths to the actual home directory.
 * Returns the expanded path, or the original if no expansion needed.
 */
export function expandTildePath(path: string): string {
  if (!path) return path;

  // Expand ~ or ~/ at the start of the path
  if (path === '~' || path.startsWith('~/')) {
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
    if (homeDir) {
      return path === '~' ? homeDir : path.replace(/^~/, homeDir);
    }
  }

  return path;
}

/**
 * Validate that a working directory is a proper absolute path.
 * Returns an error message if invalid, or null if valid.
 * Also expands tilde paths before validation.
 */
export function validateWorkingDirectory(workDir: string | undefined): string | null {
  if (!workDir || workDir.trim() === '') {
    return 'Working directory cannot be empty. Please set an absolute path.';
  }
  if (workDir === '.' || workDir === './') {
    return 'Working directory cannot be ".". Please set an absolute path (e.g., /Users/username/projects/myapp).';
  }
  if (workDir === '/' || workDir === '\\') {
    return 'Working directory cannot be the root directory. Please set a specific project path.';
  }

  // Expand tilde before checking if it's absolute
  const expandedPath = expandTildePath(workDir);

  // Check for absolute path (Unix or Windows)
  if (!expandedPath.startsWith('/') && !/^[A-Za-z]:\\/.test(expandedPath)) {
    return `Working directory "${workDir}" is not an absolute path. Please use an absolute path starting with / or C:\\.`;
  }
  return null; // Valid
}

// =========================================================================
// Migration Utilities
// =========================================================================

/**
 * Migrate plan data from legacy schema to current schema.
 * Handles cases where phases have 'name' instead of 'id'/'title'.
 */
function migratePlanData(plan: IdeaPlan | undefined): IdeaPlan | undefined {
  if (!plan?.phases) return plan;

  const migratedPhases = plan.phases.map((phase, index) => {
    // Cast to any to handle legacy schema that might have 'name' instead of 'id'/'title'
    const legacyPhase = phase as { name?: string; id?: string; title?: string; tasks: PlanTask[] };

    // Generate id if missing (use name or index-based id)
    const id = legacyPhase.id || legacyPhase.name?.toLowerCase().replace(/\s+/g, '-') || `phase-${index + 1}`;

    // Use title, falling back to name, then to a default
    const title = legacyPhase.title || legacyPhase.name || `Phase ${index + 1}`;

    // Ensure tasks have required fields
    const tasks = (legacyPhase.tasks || []).map((task, taskIndex) => {
      const legacyTask = task as { id?: string; title?: string; name?: string; completed?: boolean; status?: string };
      return {
        id: legacyTask.id || `task-${index + 1}-${taskIndex + 1}`,
        title: legacyTask.title || legacyTask.name || `Task ${taskIndex + 1}`,
        completed: legacyTask.completed ?? (legacyTask.status === 'completed'),
        inProgress: task.inProgress,
        reference: task.reference,
      };
    });

    return {
      id,
      title,
      description: phase.description,
      tasks,
      expanded: phase.expanded,
    };
  });

  return {
    ...plan,
    phases: migratedPhases,
  };
}

// =========================================================================
// Constants
// =========================================================================

const IDEAS_DIR = path.join(homedir(), 'Ideate', 'ideas');
const ATTACHMENTS_DIR = path.join(IDEAS_DIR, 'attachments');

// =========================================================================
// Service
// =========================================================================

export class IdeaService {
  constructor() {
    this.ensureDirectoryExists();
  }

  private async ensureDirectoryExists(): Promise<void> {
    try {
      await fs.mkdir(IDEAS_DIR, { recursive: true });
      await fs.mkdir(ATTACHMENTS_DIR, { recursive: true });
    } catch (error) {
      console.error('[IdeaService] Failed to create ideas directories:', error);
    }
  }

  private getMetadataPath(id: string): string {
    return path.join(IDEAS_DIR, `${id}.meta.json`);
  }

  private getDescriptionPath(id: string): string {
    return path.join(IDEAS_DIR, `${id}.description.md`);
  }

  private getAttachmentsDir(id: string): string {
    return path.join(ATTACHMENTS_DIR, id);
  }

  // =========================================================================
  // CRUD Operations
  // =========================================================================

  /**
   * List ideas for a user.
   * @param userId - The user requesting ideas
   * @param workspaceId - Optional filter by workspace (undefined = all ideas including global)
   * @param status - Optional filter by status
   * @param isWorkspaceMember - Whether user is a workspace member (for access control)
   */
  async listIdeas(
    userId: string,
    workspaceId?: string,
    status?: IdeaStatus,
    isWorkspaceMember: boolean = false
  ): Promise<IdeaMetadata[]> {
    try {
      const files = await fs.readdir(IDEAS_DIR);
      const metaFiles = files.filter(f => f.endsWith('.meta.json'));

      const ideas: IdeaMetadata[] = [];

      for (const file of metaFiles) {
        const metaPath = path.join(IDEAS_DIR, file);
        const content = await fs.readFile(metaPath, 'utf-8');
        const metadata: IdeaMetadata = JSON.parse(content);

        // Migrate plan data to current schema if needed
        if (metadata.plan) {
          metadata.plan = migratePlanData(metadata.plan);
        }

        // Filter by workspaceId if provided
        if (workspaceId !== undefined) {
          if (metadata.workspaceId !== workspaceId) continue;
        }

        // Filter by status if provided
        if (status !== undefined) {
          if (metadata.status !== status) continue;
        }

        // Include if user is owner or workspace member
        const isOwner = metadata.ownerId === userId;
        const hasWorkspaceAccess = isWorkspaceMember && metadata.workspaceId === workspaceId;

        // For global ideas (no workspaceId), only owner can see
        if (!metadata.workspaceId && !isOwner) continue;

        // For workspace ideas, owner or workspace member can see
        if (metadata.workspaceId && !isOwner && !hasWorkspaceAccess) continue;

        ideas.push(metadata);
      }

      // Sort by rating (highest first), then by updated date
      ideas.sort((a, b) => {
        if (b.rating !== a.rating) return b.rating - a.rating;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });

      return ideas;
    } catch (error) {
      console.error('[IdeaService] List ideas error:', error);
      return [];
    }
  }

  /**
   * Get ideas grouped by status for kanban view.
   */
  async getIdeasByLane(
    userId: string,
    workspaceId?: string,
    isWorkspaceMember: boolean = false
  ): Promise<Record<IdeaStatus, IdeaMetadata[]>> {
    const allIdeas = await this.listIdeas(userId, workspaceId, undefined, isWorkspaceMember);

    const grouped: Record<IdeaStatus, IdeaMetadata[]> = {
      new: [],
      exploring: [],
      executing: [],
      archived: [],
    };

    for (const idea of allIdeas) {
      grouped[idea.status].push(idea);
    }

    // Each lane is already sorted by rating from listIdeas
    return grouped;
  }

  /**
   * Get ideas linked to a specific thing.
   */
  async getIdeasByThingId(
    thingId: string,
    userId: string,
    workspaceId?: string,
    isWorkspaceMember: boolean = false
  ): Promise<IdeaMetadata[]> {
    const allIdeas = await this.listIdeas(userId, workspaceId, undefined, isWorkspaceMember);
    return allIdeas.filter(idea => idea.thingIds?.includes(thingId));
  }

  /**
   * Get idea counts grouped by status for a thing.
   */
  async getIdeaCountsByThingId(
    thingId: string,
    userId: string,
    workspaceId?: string,
    isWorkspaceMember: boolean = false
  ): Promise<{ new: number; exploring: number; executing: number; archived: number }> {
    const ideas = await this.getIdeasByThingId(thingId, userId, workspaceId, isWorkspaceMember);

    const counts = {
      new: 0,
      exploring: 0,
      executing: 0,
      archived: 0,
    };

    for (const idea of ideas) {
      counts[idea.status]++;
    }

    return counts;
  }

  /**
   * Create a new idea.
   */
  async createIdea(userId: string, input: CreateIdeaInput): Promise<Idea> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const metadata: IdeaMetadata = {
      id,
      title: input.title,
      summary: input.summary,
      tags: input.tags || [],
      rating: input.rating || 2,
      source: input.source || 'user',
      status: 'new',
      ownerId: userId,
      workspaceId: input.workspaceId,
      thingIds: input.thingIds || [],
      createdAt: now,
      updatedAt: now,
      statusChangedAt: now,
      attachments: [],
    };

    // Save metadata
    await fs.writeFile(
      this.getMetadataPath(id),
      JSON.stringify(metadata, null, 2),
      'utf-8'
    );

    // Save description if provided
    if (input.description) {
      await fs.writeFile(this.getDescriptionPath(id), input.description, 'utf-8');
    }

    return { ...metadata, description: input.description };
  }

  /**
   * Get an idea by ID.
   */
  async getIdea(id: string, userId: string, isWorkspaceMember: boolean = false): Promise<Idea | null> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(id), 'utf-8');
      const metadata: IdeaMetadata = JSON.parse(metaContent);

      // Access control
      const isOwner = metadata.ownerId === userId;
      const hasWorkspaceAccess = isWorkspaceMember && metadata.workspaceId;

      if (!isOwner && !hasWorkspaceAccess) {
        return null;
      }

      // Migrate plan data to current schema if needed
      if (metadata.plan) {
        metadata.plan = migratePlanData(metadata.plan);
      }

      // Try to read description
      let description: string | undefined;
      try {
        description = await fs.readFile(this.getDescriptionPath(id), 'utf-8');
      } catch {
        // No description file
      }

      return { ...metadata, description };
    } catch (error) {
      return null;
    }
  }

  /**
   * Get idea metadata only (no description).
   * For internal use and bulk operations.
   */
  async getIdeaInternal(id: string): Promise<IdeaMetadata | null> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(id), 'utf-8');
      const metadata: IdeaMetadata = JSON.parse(metaContent);

      // Migrate plan data to current schema if needed
      if (metadata.plan) {
        metadata.plan = migratePlanData(metadata.plan);
      }

      return metadata;
    } catch {
      return null;
    }
  }

  /**
   * Get full idea by ID without auth check.
   * For server-side use only (e.g., Yjs initialization).
   */
  async getIdeaByIdNoAuth(id: string): Promise<Idea | null> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(id), 'utf-8');
      const metadata: IdeaMetadata = JSON.parse(metaContent);

      // Migrate plan data to current schema if needed
      if (metadata.plan) {
        metadata.plan = migratePlanData(metadata.plan);
      }

      // Try to read description
      let description: string | undefined;
      try {
        description = await fs.readFile(this.getDescriptionPath(id), 'utf-8');
      } catch {
        // No description file
      }

      return { ...metadata, description };
    } catch {
      return null;
    }
  }

  /**
   * Update an idea.
   */
  async updateIdea(
    id: string,
    userId: string,
    updates: UpdateIdeaInput
  ): Promise<Idea | null> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(id), 'utf-8');
      const metadata: IdeaMetadata = JSON.parse(metaContent);

      // Only owner can update
      if (metadata.ownerId !== userId) {
        return null;
      }

      const now = new Date().toISOString();

      const updatedMetadata: IdeaMetadata = {
        ...metadata,
        title: updates.title ?? metadata.title,
        summary: updates.summary ?? metadata.summary,
        tags: updates.tags ?? metadata.tags,
        workspaceId: 'workspaceId' in updates ? updates.workspaceId : metadata.workspaceId,
        thingIds: updates.thingIds ?? metadata.thingIds ?? [],
        updatedAt: now,
      };

      await fs.writeFile(
        this.getMetadataPath(id),
        JSON.stringify(updatedMetadata, null, 2),
        'utf-8'
      );

      // Update description if provided
      if (updates.description !== undefined) {
        if (updates.description) {
          await fs.writeFile(this.getDescriptionPath(id), updates.description, 'utf-8');
        } else {
          // Empty string means delete description
          try {
            await fs.unlink(this.getDescriptionPath(id));
          } catch {
            // File didn't exist
          }
        }
      }

      // Read description
      let description: string | undefined;
      try {
        description = await fs.readFile(this.getDescriptionPath(id), 'utf-8');
      } catch {
        // No description file
      }

      return { ...updatedMetadata, description };
    } catch (error) {
      return null;
    }
  }

  /**
   * Delete an idea.
   */
  async deleteIdea(id: string, userId: string): Promise<boolean> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(id), 'utf-8');
      const metadata: IdeaMetadata = JSON.parse(metaContent);

      // Only owner can delete
      if (metadata.ownerId !== userId) {
        return false;
      }

      // Delete metadata
      await fs.unlink(this.getMetadataPath(id));

      // Delete description if exists
      try {
        await fs.unlink(this.getDescriptionPath(id));
      } catch {
        // File didn't exist
      }

      // Delete attachments folder if exists
      try {
        await fs.rm(this.getAttachmentsDir(id), { recursive: true });
      } catch {
        // Folder didn't exist
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  // =========================================================================
  // Status Management (Lane Movement)
  // =========================================================================

  /**
   * Move an idea to a new status (lane).
   * Returns the chatRoomId if one was created for executing status.
   */
  async updateStatus(
    id: string,
    userId: string,
    newStatus: IdeaStatus
  ): Promise<{ idea: Idea; chatRoomId?: string } | null> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(id), 'utf-8');
      const metadata: IdeaMetadata = JSON.parse(metaContent);

      // Only owner can update status
      if (metadata.ownerId !== userId) {
        return null;
      }

      const now = new Date().toISOString();
      let chatRoomId: string | undefined;

      const updatedMetadata: IdeaMetadata = {
        ...metadata,
        status: newStatus,
        updatedAt: now,
        statusChangedAt: now,
      };

      // Initialize execution state when moving to 'executing'
      if (newStatus === 'executing' && !metadata.execution) {
        // Note: Chat room creation is handled by the route layer
        // which has access to ChatRoomService
        updatedMetadata.execution = {
          progressPercent: 0,
          waitingForFeedback: false,
        };
      }

      // Clear execution state when moving away from 'executing'
      if (newStatus !== 'executing' && metadata.execution) {
        updatedMetadata.execution = undefined;
      }

      await fs.writeFile(
        this.getMetadataPath(id),
        JSON.stringify(updatedMetadata, null, 2),
        'utf-8'
      );

      // Read description
      let description: string | undefined;
      try {
        description = await fs.readFile(this.getDescriptionPath(id), 'utf-8');
      } catch {
        // No description file
      }

      return { idea: { ...updatedMetadata, description }, chatRoomId };
    } catch (error) {
      return null;
    }
  }

  /**
   * Set the chat room ID for an executing idea.
   */
  async setChatRoomId(id: string, chatRoomId: string): Promise<boolean> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(id), 'utf-8');
      const metadata: IdeaMetadata = JSON.parse(metaContent);

      if (metadata.status !== 'executing' || !metadata.execution) {
        return false;
      }

      metadata.execution.chatRoomId = chatRoomId;
      metadata.updatedAt = new Date().toISOString();

      await fs.writeFile(
        this.getMetadataPath(id),
        JSON.stringify(metadata, null, 2),
        'utf-8'
      );

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Update execution state for an idea in 'executing' status.
   */
  async updateExecutionState(
    id: string,
    userId: string,
    updates: Partial<IdeaExecutionState>
  ): Promise<Idea | null> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(id), 'utf-8');
      const metadata: IdeaMetadata = JSON.parse(metaContent);

      // Only owner can update
      if (metadata.ownerId !== userId) {
        return null;
      }

      // Must be in executing status
      if (metadata.status !== 'executing' || !metadata.execution) {
        return null;
      }

      const now = new Date().toISOString();

      const updatedMetadata: IdeaMetadata = {
        ...metadata,
        execution: {
          ...metadata.execution,
          progressPercent: updates.progressPercent ?? metadata.execution.progressPercent,
          waitingForFeedback: updates.waitingForFeedback ?? metadata.execution.waitingForFeedback,
          chatRoomId: updates.chatRoomId ?? metadata.execution.chatRoomId,
          startedAt: updates.startedAt ?? metadata.execution.startedAt,
          currentPhaseId: updates.currentPhaseId ?? metadata.execution.currentPhaseId,
          currentTaskId: updates.currentTaskId ?? metadata.execution.currentTaskId,
          mode: updates.mode ?? metadata.execution.mode,
        },
        updatedAt: now,
      };

      await fs.writeFile(
        this.getMetadataPath(id),
        JSON.stringify(updatedMetadata, null, 2),
        'utf-8'
      );

      // Read description
      let description: string | undefined;
      try {
        description = await fs.readFile(this.getDescriptionPath(id), 'utf-8');
      } catch {
        // No description file
      }

      return { ...updatedMetadata, description };
    } catch (error) {
      return null;
    }
  }

  /**
   * Update execution state internally (no auth check).
   * For server-side use by execution agent.
   */
  async updateExecutionStateInternal(
    id: string,
    updates: Partial<IdeaExecutionState>
  ): Promise<IdeaMetadata | null> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(id), 'utf-8');
      const metadata: IdeaMetadata = JSON.parse(metaContent);

      // Must be in executing status
      if (metadata.status !== 'executing') {
        // If not in executing status and we're starting execution, initialize state
        if (updates.startedAt) {
          metadata.status = 'executing';
          metadata.execution = {
            progressPercent: 0,
            waitingForFeedback: false,
          };
        } else {
          return null;
        }
      }

      // Ensure execution object exists
      if (!metadata.execution) {
        metadata.execution = {
          progressPercent: 0,
          waitingForFeedback: false,
        };
      }

      const now = new Date().toISOString();

      const updatedExecution: IdeaExecutionState = {
        ...metadata.execution,
        ...(updates.progressPercent !== undefined && { progressPercent: updates.progressPercent }),
        ...(updates.waitingForFeedback !== undefined && { waitingForFeedback: updates.waitingForFeedback }),
        ...(updates.chatRoomId !== undefined && { chatRoomId: updates.chatRoomId }),
        ...(updates.startedAt !== undefined && { startedAt: updates.startedAt }),
        ...(updates.currentPhaseId !== undefined && { currentPhaseId: updates.currentPhaseId }),
        ...(updates.currentTaskId !== undefined && { currentTaskId: updates.currentTaskId }),
        ...(updates.mode !== undefined && { mode: updates.mode }),
      };

      const updatedMetadata: IdeaMetadata = {
        ...metadata,
        execution: updatedExecution,
        updatedAt: now,
        statusChangedAt: metadata.status !== 'executing' ? now : metadata.statusChangedAt,
      };

      await fs.writeFile(
        this.getMetadataPath(id),
        JSON.stringify(updatedMetadata, null, 2),
        'utf-8'
      );

      return updatedMetadata;
    } catch (error) {
      console.error('[IdeaService] Failed to update execution state internally:', error);
      return null;
    }
  }

  /**
   * Get execution state for an idea.
   */
  async getExecutionState(id: string): Promise<IdeaExecutionState | null> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(id), 'utf-8');
      const metadata: IdeaMetadata = JSON.parse(metaContent);
      return metadata.execution || null;
    } catch {
      return null;
    }
  }

  /**
   * Update the plan for an idea.
   * Merges the provided plan updates with the existing plan.
   */
  async updatePlan(
    id: string,
    userId: string,
    planUpdate: Partial<IdeaPlan>
  ): Promise<Idea | null> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(id), 'utf-8');
      const metadata: IdeaMetadata = JSON.parse(metaContent);

      // Only owner can update plan
      if (metadata.ownerId !== userId) {
        return null;
      }

      const now = new Date().toISOString();

      // Merge plan update with existing plan
      const existingPlan = metadata.plan || {
        phases: [],
        workingDirectory: '',
        createdAt: now,
        updatedAt: now,
      };

      // Validate working directory if it's being set
      const newWorkingDirectory = planUpdate.workingDirectory ?? existingPlan.workingDirectory;
      // Note: Empty string is allowed during planning phase, validation happens before execution
      // But we still reject clearly invalid relative paths
      if (newWorkingDirectory && newWorkingDirectory !== '') {
        const validationError = validateWorkingDirectory(newWorkingDirectory);
        if (validationError) {
          throw new Error(validationError);
        }
      }

      const updatedPlan: IdeaPlan = {
        ...existingPlan,
        phases: planUpdate.phases ?? existingPlan.phases,
        workingDirectory: newWorkingDirectory,
        repositoryUrl: planUpdate.repositoryUrl ?? existingPlan.repositoryUrl,
        branch: planUpdate.branch ?? existingPlan.branch,
        isClone: planUpdate.isClone ?? existingPlan.isClone,
        workspaceId: planUpdate.workspaceId ?? existingPlan.workspaceId,
        updatedAt: now,
      };

      const updatedMetadata: IdeaMetadata = {
        ...metadata,
        plan: updatedPlan,
        updatedAt: now,
      };

      await fs.writeFile(
        this.getMetadataPath(id),
        JSON.stringify(updatedMetadata, null, 2),
        'utf-8'
      );

      // Read description
      let description: string | undefined;
      try {
        description = await fs.readFile(this.getDescriptionPath(id), 'utf-8');
      } catch {
        // No description file
      }

      return { ...updatedMetadata, description };
    } catch (error) {
      console.error('[IdeaService] Failed to update plan:', error);
      return null;
    }
  }

  /**
   * Mark a task as completed in the plan.
   * This persists the completion status so it survives dialog close/reopen.
   */
  async markTaskCompleted(id: string, taskId: string, completed: boolean = true): Promise<boolean> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(id), 'utf-8');
      const metadata: IdeaMetadata = JSON.parse(metaContent);

      if (!metadata.plan?.phases) {
        console.warn(`[IdeaService] No plan found for idea ${id}`);
        return false;
      }

      // Find and update the task
      let taskFound = false;
      for (const phase of metadata.plan.phases) {
        for (const task of phase.tasks) {
          if (task.id === taskId) {
            task.completed = completed;
            task.inProgress = false;
            taskFound = true;
            console.log(`[IdeaService] Marked task ${taskId} as ${completed ? 'completed' : 'incomplete'}`);
            break;
          }
        }
        if (taskFound) break;
      }

      if (!taskFound) {
        console.warn(`[IdeaService] Task ${taskId} not found in plan for idea ${id}`);
        return false;
      }

      // Save updated metadata
      metadata.plan.updatedAt = new Date().toISOString();
      metadata.updatedAt = new Date().toISOString();
      await fs.writeFile(this.getMetadataPath(id), JSON.stringify(metadata, null, 2), 'utf-8');
      return true;
    } catch (error) {
      console.error('[IdeaService] Failed to mark task completed:', error);
      return false;
    }
  }

  /**
   * Mark a task as in progress in the plan.
   */
  async markTaskInProgress(id: string, taskId: string, inProgress: boolean = true): Promise<boolean> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(id), 'utf-8');
      const metadata: IdeaMetadata = JSON.parse(metaContent);

      if (!metadata.plan?.phases) {
        return false;
      }

      // Find and update the task
      let taskFound = false;
      for (const phase of metadata.plan.phases) {
        for (const task of phase.tasks) {
          if (task.id === taskId) {
            task.inProgress = inProgress;
            if (inProgress) {
              task.completed = false; // Can't be both in progress and completed
            }
            taskFound = true;
            break;
          }
        }
        if (taskFound) break;
      }

      if (!taskFound) {
        return false;
      }

      // Save updated metadata
      metadata.plan.updatedAt = new Date().toISOString();
      metadata.updatedAt = new Date().toISOString();
      await fs.writeFile(this.getMetadataPath(id), JSON.stringify(metadata, null, 2), 'utf-8');
      return true;
    } catch (error) {
      console.error('[IdeaService] Failed to mark task in progress:', error);
      return false;
    }
  }

  // =========================================================================
  // Rating
  // =========================================================================

  /**
   * Update idea rating (1-4).
   */
  async updateRating(
    id: string,
    userId: string,
    rating: 1 | 2 | 3 | 4
  ): Promise<Idea | null> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(id), 'utf-8');
      const metadata: IdeaMetadata = JSON.parse(metaContent);

      // Only owner can update rating
      if (metadata.ownerId !== userId) {
        return null;
      }

      const now = new Date().toISOString();

      const updatedMetadata: IdeaMetadata = {
        ...metadata,
        rating,
        updatedAt: now,
      };

      await fs.writeFile(
        this.getMetadataPath(id),
        JSON.stringify(updatedMetadata, null, 2),
        'utf-8'
      );

      // Read description
      let description: string | undefined;
      try {
        description = await fs.readFile(this.getDescriptionPath(id), 'utf-8');
      } catch {
        // No description file
      }

      return { ...updatedMetadata, description };
    } catch (error) {
      return null;
    }
  }

  // =========================================================================
  // Attachments
  // =========================================================================

  /**
   * Add an attachment to an idea.
   */
  async addAttachment(
    ideaId: string,
    userId: string,
    attachment: Omit<IdeaAttachment, 'id' | 'createdAt'>,
    fileBuffer?: Buffer
  ): Promise<IdeaAttachment | null> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(ideaId), 'utf-8');
      const metadata: IdeaMetadata = JSON.parse(metaContent);

      // Only owner can add attachments
      if (metadata.ownerId !== userId) {
        return null;
      }

      const attachmentId = uuidv4();
      const now = new Date().toISOString();

      const newAttachment: IdeaAttachment = {
        id: attachmentId,
        filename: attachment.filename,
        mimeType: attachment.mimeType,
        url: attachment.url,
        createdAt: now,
      };

      // If file buffer provided, save the file
      if (fileBuffer) {
        const attachmentsDir = this.getAttachmentsDir(ideaId);
        await fs.mkdir(attachmentsDir, { recursive: true });

        const filePath = path.join(attachmentsDir, `${attachmentId}-${attachment.filename}`);
        await fs.writeFile(filePath, fileBuffer);
        newAttachment.filePath = `${attachmentId}-${attachment.filename}`;
      }

      metadata.attachments.push(newAttachment);
      metadata.updatedAt = now;

      await fs.writeFile(
        this.getMetadataPath(ideaId),
        JSON.stringify(metadata, null, 2),
        'utf-8'
      );

      return newAttachment;
    } catch (error) {
      return null;
    }
  }

  /**
   * Remove an attachment from an idea.
   */
  async removeAttachment(
    ideaId: string,
    userId: string,
    attachmentId: string
  ): Promise<boolean> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(ideaId), 'utf-8');
      const metadata: IdeaMetadata = JSON.parse(metaContent);

      // Only owner can remove attachments
      if (metadata.ownerId !== userId) {
        return false;
      }

      const attachmentIndex = metadata.attachments.findIndex(a => a.id === attachmentId);
      if (attachmentIndex === -1) {
        return false;
      }

      const attachment = metadata.attachments[attachmentIndex];

      // Delete file if it exists
      if (attachment.filePath) {
        try {
          const filePath = path.join(this.getAttachmentsDir(ideaId), attachment.filePath);
          await fs.unlink(filePath);
        } catch {
          // File might not exist
        }
      }

      // Remove from metadata
      metadata.attachments.splice(attachmentIndex, 1);
      metadata.updatedAt = new Date().toISOString();

      await fs.writeFile(
        this.getMetadataPath(ideaId),
        JSON.stringify(metadata, null, 2),
        'utf-8'
      );

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get attachment file path for download.
   */
  async getAttachmentPath(ideaId: string, attachmentId: string): Promise<string | null> {
    try {
      const metaContent = await fs.readFile(this.getMetadataPath(ideaId), 'utf-8');
      const metadata: IdeaMetadata = JSON.parse(metaContent);

      const attachment = metadata.attachments.find(a => a.id === attachmentId);
      if (!attachment || !attachment.filePath) {
        return null;
      }

      return path.join(this.getAttachmentsDir(ideaId), attachment.filePath);
    } catch {
      return null;
    }
  }

  // =========================================================================
  // AI Integration
  // =========================================================================

  /**
   * Create an AI-generated idea.
   * Called by AI generation job or Facilitator.
   */
  async createAIIdea(
    ownerId: string,
    data: {
      title: string;
      summary: string;
      tags?: string[];
      workspaceId?: string;
      description?: string;
    }
  ): Promise<Idea> {
    return this.createIdea(ownerId, {
      ...data,
      source: 'ai',
      rating: 2, // Default to medium rating for AI ideas
    });
  }
}
