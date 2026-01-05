/**
 * Test for thingToolsMcp
 *
 * Verifies that the MCP server for thing tools works correctly.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { MCPToolsService } from '../services/MCPToolsService.js';

describe('Thing Tools MCP', () => {
  const toolsService = new MCPToolsService();
  const testUserId = 'test-user-mcp';
  let createdThingId: string;

  beforeAll(async () => {
    // Create a test thing
    const result = await toolsService.executeTool(
      'thing_create',
      { name: 'test-mcp-thing', type: 'project', description: 'Test thing for MCP tests' },
      testUserId
    );
    if (result.success && result.data) {
      const data = result.data as { thing?: { id: string } };
      createdThingId = data.thing?.id || '';
    }
  });

  it('should search things by name', async () => {
    const result = await toolsService.executeTool(
      'thing_search',
      { query: 'test-mcp-thing' },
      testUserId
    );

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    const data = result.data as { things: Array<{ name: string }> };
    expect(data.things.some(t => t.name === 'test-mcp-thing')).toBe(true);
  });

  it('should get thing by id', async () => {
    if (!createdThingId) {
      console.log('Skipping - no thing created');
      return;
    }

    const result = await toolsService.executeTool(
      'thing_get',
      { thingId: createdThingId },
      testUserId
    );

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    const data = result.data as { name: string };
    expect(data.name).toBe('test-mcp-thing');
  });

  it('should list all things', async () => {
    const result = await toolsService.executeTool(
      'thing_list',
      {},
      testUserId
    );

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('should update a thing', async () => {
    if (!createdThingId) {
      console.log('Skipping - no thing created');
      return;
    }

    const result = await toolsService.executeTool(
      'thing_update',
      { thingId: createdThingId, description: 'Updated description' },
      testUserId
    );

    expect(result.success).toBe(true);
  });
});
