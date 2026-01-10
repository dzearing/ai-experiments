import { createDataPath, type DataBusPath } from '@claude-flow/data-bus';
import { z } from 'zod';

/**
 * Schema for idea metadata from real-time updates.
 */
export const IdeaMetadataSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  tags: z.array(z.string()),
  description: z.string().optional(),
});

export type IdeaMetadata = z.infer<typeof IdeaMetadataSchema>;

/**
 * Schema for agent status updates.
 */
export const AgentStatusSchema = z.object({
  status: z.enum(['idle', 'running', 'error']),
  startedAt: z.number().optional(),
});

export type AgentStatus = z.infer<typeof AgentStatusSchema>;

/**
 * Schema for a list of idea metadata (for topic ideas list).
 */
export const IdeaMetadataListSchema = z.array(IdeaMetadataSchema);

export type IdeaMetadataList = z.infer<typeof IdeaMetadataListSchema>;

/**
 * Create a data bus path for an idea's metadata.
 */
export function ideaPath(ideaId: string): DataBusPath<typeof IdeaMetadataSchema> {
  return createDataPath({
    path: ['ideas', ideaId],
    type: IdeaMetadataSchema,
  });
}

/**
 * Create a data bus path for an idea's agent status.
 */
export function ideaAgentStatusPath(ideaId: string): DataBusPath<typeof AgentStatusSchema> {
  return createDataPath({
    path: ['ideas', ideaId, 'agentStatus'],
    type: AgentStatusSchema,
  });
}

/**
 * Create a data bus path for a topic's linked ideas.
 */
export function topicIdeasPath(topicId: string): DataBusPath<typeof IdeaMetadataListSchema> {
  return createDataPath({
    path: ['topics', topicId, 'ideas'],
    type: IdeaMetadataListSchema,
  });
}
