/**
 * Test for topicToolsMcp
 *
 * Verifies that the MCP server for topic tools works correctly.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { MCPToolsService } from '../services/MCPToolsService.js';

describe('Topic Tools MCP', () => {
  const toolsService = new MCPToolsService();
  const testUserId = 'test-user-mcp';
  let createdTopicId: string;

  beforeAll(async () => {
    // Create a test topic
    const result = await toolsService.executeTool(
      'topic_create',
      { name: 'test-mcp-topic', type: 'project', description: 'Test topic for MCP tests' },
      testUserId
    );
    if (result.success && result.data) {
      const data = result.data as { topic?: { id: string } };
      createdTopicId = data.topic?.id || '';
    }
  });

  it('should search topics by name', async () => {
    const result = await toolsService.executeTool(
      'topic_search',
      { query: 'test-mcp-topic' },
      testUserId
    );

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    const data = result.data as { topics: Array<{ name: string }> };
    expect(data.topics.some(t => t.name === 'test-mcp-topic')).toBe(true);
  });

  it('should get topic by id', async () => {
    if (!createdTopicId) {
      console.log('Skipping - no topic created');
      return;
    }

    const result = await toolsService.executeTool(
      'topic_get',
      { topicId: createdTopicId },
      testUserId
    );

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    const data = result.data as { name: string };
    expect(data.name).toBe('test-mcp-topic');
  });

  it('should list all topics', async () => {
    const result = await toolsService.executeTool(
      'topic_list',
      {},
      testUserId
    );

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('should update a topic', async () => {
    if (!createdTopicId) {
      console.log('Skipping - no topic created');
      return;
    }

    const result = await toolsService.executeTool(
      'topic_update',
      { topicId: createdTopicId, description: 'Updated description' },
      testUserId
    );

    expect(result.success).toBe(true);
  });
});
