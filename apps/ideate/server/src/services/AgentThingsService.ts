import { ThingService, type Thing, type ThingMetadata } from './ThingService.js';

/**
 * Input for creating things from a repository structure
 */
export interface CreateFromRepoInput {
  /** The root thing ID to nest under (optional) */
  parentId?: string;
  /** The repository path to scan */
  repoPath: string;
  /** Pattern to match directories (e.g., "packages/*") */
  pattern?: string;
  /** Owner ID */
  ownerId: string;
  /** Workspace ID (optional) */
  workspaceId?: string;
}

/**
 * Input for bulk deleting children
 */
export interface BulkDeleteChildrenInput {
  /** Parent thing ID */
  parentId: string;
  /** Child IDs to exclude from deletion */
  excludeIds?: string[];
  /** Owner ID for access control */
  ownerId: string;
}

/**
 * Input for splitting a thing into multiple things
 */
export interface SplitThingInput {
  /** Thing ID to split */
  thingId: string;
  /** Names for the new things to create */
  newThingNames: string[];
  /** Owner ID for access control */
  ownerId: string;
}

/**
 * Input for reparenting a thing
 */
export interface ReparentThingInput {
  /** Thing ID to reparent */
  thingId: string;
  /** Current parent ID to remove */
  fromParentId?: string;
  /** New parent ID to add */
  toParentId: string;
  /** Owner ID for access control */
  ownerId: string;
}

/**
 * Input for merging things
 */
export interface MergeThingsInput {
  /** Source thing IDs to merge from */
  sourceIds: string[];
  /** Target thing ID to merge into */
  targetId: string;
  /** Whether to delete source things after merge */
  deleteSource?: boolean;
  /** Owner ID for access control */
  ownerId: string;
}

/**
 * Result of an agent operation
 */
export interface AgentOperationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  /** Number of items affected */
  affectedCount?: number;
}

/**
 * Service for agent-driven operations on Things.
 * Provides bulk operations, natural language commands, and automated workflows.
 */
export class AgentThingsService {
  private thingService: ThingService;

  constructor() {
    this.thingService = new ThingService();
  }

  /**
   * Create things from a repository structure.
   * Scans directories matching a pattern and creates things for each.
   */
  async createFromRepo(_input: CreateFromRepoInput): Promise<AgentOperationResult<Thing[]>> {
    try {
      // This is a placeholder - in production, this would scan the filesystem
      // For now, we'll return a mock response
      const createdThings: Thing[] = [];

      // Example: if pattern is "packages/*", create a thing for each package
      // This would require filesystem access which we'll implement later

      return {
        success: true,
        data: createdThings,
        affectedCount: createdThings.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create from repo',
      };
    }
  }

  /**
   * Bulk delete children of a thing, optionally excluding specific IDs.
   */
  async bulkDeleteChildren(input: BulkDeleteChildrenInput): Promise<AgentOperationResult> {
    try {
      const { parentId, excludeIds = [], ownerId } = input;

      // Get all children of the parent
      const children = await this.thingService.getChildren(parentId, ownerId);

      // Filter out excluded IDs
      const toDelete = children.filter((child: ThingMetadata) => !excludeIds.includes(child.id));

      // Delete each child
      let deletedCount = 0;
      for (const child of toDelete) {
        const deleted = await this.thingService.deleteThing(child.id, ownerId);
        if (deleted) {
          deletedCount++;
        }
      }

      return {
        success: true,
        affectedCount: deletedCount,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to bulk delete children',
      };
    }
  }

  /**
   * Split a thing into multiple things.
   * Creates new things with the same parent(s) as the original.
   */
  async split(input: SplitThingInput): Promise<AgentOperationResult<Thing[]>> {
    try {
      const { thingId, newThingNames, ownerId } = input;

      // Get the original thing
      const original = await this.thingService.getThing(thingId, ownerId, false);
      if (!original) {
        return {
          success: false,
          error: 'Thing not found',
        };
      }

      // Create new things with the same parent(s)
      const createdThings: Thing[] = [];
      for (const name of newThingNames) {
        const newThing = await this.thingService.createThing(ownerId, {
          name,
          type: original.type,
          parentIds: original.parentIds,
          workspaceId: original.workspaceId,
          tags: [...original.tags],
        });
        createdThings.push(newThing);
      }

      return {
        success: true,
        data: createdThings,
        affectedCount: createdThings.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to split thing',
      };
    }
  }

  /**
   * Reparent a thing - move from one parent to another.
   */
  async reparent(input: ReparentThingInput): Promise<AgentOperationResult<Thing>> {
    try {
      const { thingId, fromParentId, toParentId, ownerId } = input;

      // Get the current thing
      const thing = await this.thingService.getThing(thingId, ownerId, false);
      if (!thing) {
        return {
          success: false,
          error: 'Thing not found',
        };
      }

      // Update parent IDs
      let newParentIds = [...thing.parentIds];

      // Remove old parent if specified
      if (fromParentId) {
        newParentIds = newParentIds.filter((id: string) => id !== fromParentId);
      }

      // Add new parent if not already present
      if (!newParentIds.includes(toParentId)) {
        newParentIds.push(toParentId);
      }

      // Update the thing
      const updated = await this.thingService.updateThing(thingId, ownerId, {
        parentIds: newParentIds,
      });

      if (!updated) {
        return {
          success: false,
          error: 'Failed to update thing',
        };
      }

      return {
        success: true,
        data: updated,
        affectedCount: 1,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reparent thing',
      };
    }
  }

  /**
   * Merge multiple things into one.
   * Moves all children and ideas from source things to target.
   */
  async merge(input: MergeThingsInput): Promise<AgentOperationResult<Thing>> {
    try {
      const { sourceIds, targetId, deleteSource = false, ownerId } = input;

      // Get the target thing
      const target = await this.thingService.getThing(targetId, ownerId, false);
      if (!target) {
        return {
          success: false,
          error: 'Target thing not found',
        };
      }

      // Process each source
      for (const sourceId of sourceIds) {
        const source = await this.thingService.getThing(sourceId, ownerId, false);
        if (!source) continue;

        // Get children of source
        const children = await this.thingService.getChildren(sourceId, ownerId);

        // Reparent children to target
        for (const child of children) {
          const newParentIds = child.parentIds
            .filter((id: string) => id !== sourceId)
            .concat([targetId]);

          await this.thingService.updateThing(child.id, ownerId, {
            parentIds: newParentIds,
          });
        }

        // Merge tags
        const mergedTags = [...new Set([...target.tags, ...source.tags])];
        await this.thingService.updateThing(targetId, ownerId, {
          tags: mergedTags,
        });

        // Delete source if requested
        if (deleteSource) {
          await this.thingService.deleteThing(sourceId, ownerId);
        }
      }

      // Return the updated target
      const updatedTarget = await this.thingService.getThing(targetId, ownerId, false);

      return {
        success: true,
        data: updatedTarget!,
        affectedCount: sourceIds.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to merge things',
      };
    }
  }

  /**
   * Parse a natural language command and execute the appropriate operation.
   * Examples:
   * - "Create things for packages in ^repo"
   * - "Delete children of ^foo except ^bar"
   * - "Split ^foo into 3 things"
   * - "Move ^item under ^newParent"
   * - "Merge ^a and ^b into ^c"
   */
  async parseAndExecute(command: string, _ownerId: string): Promise<AgentOperationResult> {
    // This is a simplified parser - in production, this would use Claude
    // to understand more complex natural language commands

    const lowerCommand = command.toLowerCase();

    // Delete children pattern
    if (lowerCommand.includes('delete children of')) {
      const match = command.match(/delete children of \^?(\S+)(?:\s+except\s+(.+))?/i);
      if (match) {
        // Would need to resolve names to IDs
        // For now, return a placeholder
        return {
          success: false,
          error: 'Command parsing not fully implemented - need to resolve thing names to IDs',
        };
      }
    }

    // Split pattern
    if (lowerCommand.includes('split')) {
      const match = command.match(/split \^?(\S+) into (\d+)/i);
      if (match) {
        const thingName = match[1];
        const count = parseInt(match[2], 10);

        return {
          success: false,
          error: `Command parsing not fully implemented - would split "${thingName}" into ${count} things`,
        };
      }
    }

    // Move/reparent pattern
    if (lowerCommand.includes('move') && lowerCommand.includes('under')) {
      const match = command.match(/move \^?(\S+) under \^?(\S+)/i);
      if (match) {
        const itemName = match[1];
        const parentName = match[2];

        return {
          success: false,
          error: `Command parsing not fully implemented - would move "${itemName}" under "${parentName}"`,
        };
      }
    }

    // Merge pattern
    if (lowerCommand.includes('merge')) {
      const match = command.match(/merge \^?(\S+)((?:\s+and\s+\^?\S+)*) into \^?(\S+)/i);
      if (match) {
        const sources = [match[1], ...(match[2] || '').split(/\s+and\s+/).filter(Boolean).map(n => n.replace(/^\^/, ''))];
        const target = match[3];

        return {
          success: false,
          error: `Command parsing not fully implemented - would merge [${sources.join(', ')}] into "${target}"`,
        };
      }
    }

    return {
      success: false,
      error: 'Unrecognized command pattern',
    };
  }
}
