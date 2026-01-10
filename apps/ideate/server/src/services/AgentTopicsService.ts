import { TopicService, type Topic, type TopicMetadata } from './TopicService.js';

/**
 * Input for creating topics from a repository structure
 */
export interface CreateFromRepoInput {
  /** The root topic ID to nest under (optional) */
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
  /** Parent topic ID */
  parentId: string;
  /** Child IDs to exclude from deletion */
  excludeIds?: string[];
  /** Owner ID for access control */
  ownerId: string;
}

/**
 * Input for splitting a topic into multiple topics
 */
export interface SplitTopicInput {
  /** Topic ID to split */
  topicId: string;
  /** Names for the new topics to create */
  newTopicNames: string[];
  /** Owner ID for access control */
  ownerId: string;
}

/**
 * Input for reparenting a topic
 */
export interface ReparentTopicInput {
  /** Topic ID to reparent */
  topicId: string;
  /** Current parent ID to remove */
  fromParentId?: string;
  /** New parent ID to add */
  toParentId: string;
  /** Owner ID for access control */
  ownerId: string;
}

/**
 * Input for merging topics
 */
export interface MergeTopicsInput {
  /** Source topic IDs to merge from */
  sourceIds: string[];
  /** Target topic ID to merge into */
  targetId: string;
  /** Whether to delete source topics after merge */
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
 * Service for agent-driven operations on Topics.
 * Provides bulk operations, natural language commands, and automated workflows.
 */
export class AgentTopicsService {
  private topicService: TopicService;

  constructor() {
    this.topicService = new TopicService();
  }

  /**
   * Create topics from a repository structure.
   * Scans directories matching a pattern and creates topics for each.
   */
  async createFromRepo(_input: CreateFromRepoInput): Promise<AgentOperationResult<Topic[]>> {
    try {
      // This is a placeholder - in production, this would scan the filesystem
      // For now, we'll return a mock response
      const createdTopics: Topic[] = [];

      // Example: if pattern is "packages/*", create a topic for each package
      // This would require filesystem access which we'll implement later

      return {
        success: true,
        data: createdTopics,
        affectedCount: createdTopics.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create from repo',
      };
    }
  }

  /**
   * Bulk delete children of a topic, optionally excluding specific IDs.
   */
  async bulkDeleteChildren(input: BulkDeleteChildrenInput): Promise<AgentOperationResult> {
    try {
      const { parentId, excludeIds = [], ownerId } = input;

      // Get all children of the parent
      const children = await this.topicService.getChildren(parentId, ownerId);

      // Filter out excluded IDs
      const toDelete = children.filter((child: TopicMetadata) => !excludeIds.includes(child.id));

      // Delete each child
      let deletedCount = 0;
      for (const child of toDelete) {
        const deleted = await this.topicService.deleteTopic(child.id, ownerId);
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
   * Split a topic into multiple topics.
   * Creates new topics with the same parent(s) as the original.
   */
  async split(input: SplitTopicInput): Promise<AgentOperationResult<Topic[]>> {
    try {
      const { topicId, newTopicNames, ownerId } = input;

      // Get the original topic
      const original = await this.topicService.getTopic(topicId, ownerId, false);
      if (!original) {
        return {
          success: false,
          error: 'Topic not found',
        };
      }

      // Create new topics with the same parent(s)
      const createdTopics: Topic[] = [];
      for (const name of newTopicNames) {
        const newTopic = await this.topicService.createTopic(ownerId, {
          name,
          type: original.type,
          parentIds: original.parentIds,
          workspaceId: original.workspaceId,
          tags: [...original.tags],
        });
        createdTopics.push(newTopic);
      }

      return {
        success: true,
        data: createdTopics,
        affectedCount: createdTopics.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to split topic',
      };
    }
  }

  /**
   * Reparent a topic - move from one parent to another.
   */
  async reparent(input: ReparentTopicInput): Promise<AgentOperationResult<Topic>> {
    try {
      const { topicId, fromParentId, toParentId, ownerId } = input;

      // Get the current topic
      const topic = await this.topicService.getTopic(topicId, ownerId, false);
      if (!topic) {
        return {
          success: false,
          error: 'Topic not found',
        };
      }

      // Update parent IDs
      let newParentIds = [...topic.parentIds];

      // Remove old parent if specified
      if (fromParentId) {
        newParentIds = newParentIds.filter((id: string) => id !== fromParentId);
      }

      // Add new parent if not already present
      if (!newParentIds.includes(toParentId)) {
        newParentIds.push(toParentId);
      }

      // Update the topic
      const updated = await this.topicService.updateTopic(topicId, ownerId, {
        parentIds: newParentIds,
      });

      if (!updated) {
        return {
          success: false,
          error: 'Failed to update topic',
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
        error: error instanceof Error ? error.message : 'Failed to reparent topic',
      };
    }
  }

  /**
   * Merge multiple topics into one.
   * Moves all children and ideas from source topics to target.
   */
  async merge(input: MergeTopicsInput): Promise<AgentOperationResult<Topic>> {
    try {
      const { sourceIds, targetId, deleteSource = false, ownerId } = input;

      // Get the target topic
      const target = await this.topicService.getTopic(targetId, ownerId, false);
      if (!target) {
        return {
          success: false,
          error: 'Target topic not found',
        };
      }

      // Process each source
      for (const sourceId of sourceIds) {
        const source = await this.topicService.getTopic(sourceId, ownerId, false);
        if (!source) continue;

        // Get children of source
        const children = await this.topicService.getChildren(sourceId, ownerId);

        // Reparent children to target
        for (const child of children) {
          const newParentIds = child.parentIds
            .filter((id: string) => id !== sourceId)
            .concat([targetId]);

          await this.topicService.updateTopic(child.id, ownerId, {
            parentIds: newParentIds,
          });
        }

        // Merge tags
        const mergedTags = [...new Set([...target.tags, ...source.tags])];
        await this.topicService.updateTopic(targetId, ownerId, {
          tags: mergedTags,
        });

        // Delete source if requested
        if (deleteSource) {
          await this.topicService.deleteTopic(sourceId, ownerId);
        }
      }

      // Return the updated target
      const updatedTarget = await this.topicService.getTopic(targetId, ownerId, false);

      return {
        success: true,
        data: updatedTarget!,
        affectedCount: sourceIds.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to merge topics',
      };
    }
  }

  /**
   * Parse a natural language command and execute the appropriate operation.
   * Examples:
   * - "Create topics for packages in ^repo"
   * - "Delete children of ^foo except ^bar"
   * - "Split ^foo into 3 topics"
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
          error: 'Command parsing not fully implemented - need to resolve topic names to IDs',
        };
      }
    }

    // Split pattern
    if (lowerCommand.includes('split')) {
      const match = command.match(/split \^?(\S+) into (\d+)/i);
      if (match) {
        const topicName = match[1];
        const count = parseInt(match[2], 10);

        return {
          success: false,
          error: `Command parsing not fully implemented - would split "${topicName}" into ${count} topics`,
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
