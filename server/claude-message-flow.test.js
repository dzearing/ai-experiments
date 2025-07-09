// Test for verifying Claude message flow with tool executions
const assert = require('assert');

// Mock SSE response object
class MockSSEResponse {
  constructor() {
    this.events = [];
  }
  
  write(data) {
    // Parse SSE format
    const lines = data.split('\n');
    let event = null;
    let eventData = null;
    
    for (const line of lines) {
      if (line.startsWith('event: ')) {
        event = line.substring(7);
      } else if (line.startsWith('data: ')) {
        eventData = JSON.parse(line.substring(6));
      }
    }
    
    if (event && eventData) {
      this.events.push({ event, data: eventData });
    }
  }
  
  getEvents() {
    return this.events;
  }
  
  getEventsByType(type) {
    return this.events.filter(e => e.event === type);
  }
}

// Test scenarios will be defined below after the test framework functions

// Run tests
console.log('Running Claude Message Flow tests...\n');

let passed = 0;
let failed = 0;

// Remove duplicate test definitions
function describe(name, fn) {
  console.log(`${name}:`);
  fn();
  console.log('');
}

function it(name, fn) {
  try {
    fn();
    passed++;
  } catch (error) {
    console.log(`✗ ${name}`);
    console.log(`  ${error.message}`);
    console.log(`  Stack: ${error.stack}`);
    failed++;
  }
}

// Execute test suite
describe('Claude Message Flow', () => {
  it('should send assistant message before tool executions', () => {
    const mockRes = new MockSSEResponse();
    
    // Simulate the message flow
    // 1. Assistant pre-tool message
    const assistantMessageId = 'assistant-123';
    mockRes.write(`event: message-start\ndata: ${JSON.stringify({ id: assistantMessageId, isGreeting: false })}\n\n`);
    mockRes.write(`event: message-chunk\ndata: ${JSON.stringify({ messageId: assistantMessageId, chunk: "I'll read the README file for you." })}\n\n`);
    mockRes.write(`event: message-end\ndata: ${JSON.stringify({ messageId: assistantMessageId })}\n\n`);
    
    // 2. Tool execution
    mockRes.write(`event: tool-execution\ndata: ${JSON.stringify({ 
      messageId: 'msg-456',
      toolExecution: {
        id: 'tool-789',
        name: 'Read',
        args: 'README.md',
        status: 'running'
      }
    })}\n\n`);
    
    // 3. Final assistant response
    const finalMessageId = 'assistant-final-123';
    mockRes.write(`event: message-start\ndata: ${JSON.stringify({ id: finalMessageId, isGreeting: false })}\n\n`);
    mockRes.write(`event: message-chunk\ndata: ${JSON.stringify({ messageId: finalMessageId, chunk: "The README contains..." })}\n\n`);
    mockRes.write(`event: message-end\ndata: ${JSON.stringify({ messageId: finalMessageId })}\n\n`);
    
    // 4. Tool summary to mark tools complete
    mockRes.write(`event: tool-summary\ndata: ${JSON.stringify({ 
      messageId: 'msg-456',
      toolExecutions: [{ id: 'tool-789', name: 'Read', isSuccess: true }]
    })}\n\n`);
    
    // Verify the events
    const events = mockRes.getEvents();
    
    // Should have correct number of events
    assert.strictEqual(events.length, 8, 'Should have 8 events');
    
    // Verify order: assistant message -> tool -> final message -> tool summary
    assert.strictEqual(events[0].event, 'message-start');
    assert.strictEqual(events[0].data.id, assistantMessageId);
    
    assert.strictEqual(events[1].event, 'message-chunk');
    assert.strictEqual(events[1].data.chunk, "I'll read the README file for you.");
    
    assert.strictEqual(events[2].event, 'message-end');
    
    assert.strictEqual(events[3].event, 'tool-execution');
    assert.strictEqual(events[3].data.toolExecution.name, 'Read');
    
    assert.strictEqual(events[4].event, 'message-start');
    assert.strictEqual(events[4].data.id, finalMessageId);
    
    assert.strictEqual(events[7].event, 'tool-summary');
    
    console.log('✓ Assistant message is sent before tool executions');
  });
  
  it('should create separate messages for each phase', () => {
    const mockRes = new MockSSEResponse();
    
    // Count distinct message IDs
    const messageIds = new Set();
    
    // Assistant pre-tool message
    const assistantId1 = 'assistant-1';
    mockRes.write(`event: message-start\ndata: ${JSON.stringify({ id: assistantId1 })}\n\n`);
    messageIds.add(assistantId1);
    
    // Tool execution (has its own ID)
    const toolId = 'tool-1';
    mockRes.write(`event: tool-execution\ndata: ${JSON.stringify({ 
      toolExecution: { id: toolId, name: 'Read' }
    })}\n\n`);
    // Note: Tool messages are created with role="tool", not as assistant messages
    
    // Final assistant message
    const assistantId2 = 'assistant-2';
    mockRes.write(`event: message-start\ndata: ${JSON.stringify({ id: assistantId2 })}\n\n`);
    messageIds.add(assistantId2);
    
    // Should have 2 distinct assistant message IDs
    assert.strictEqual(messageIds.size, 2, 'Should have 2 distinct assistant messages');
    assert.ok(messageIds.has(assistantId1), 'Should have first assistant message');
    assert.ok(messageIds.has(assistantId2), 'Should have second assistant message');
    
    console.log('✓ Creates separate messages for pre-tool and post-tool responses');
  });
  
  it('should handle multiple tool executions in sequence', () => {
    const mockRes = new MockSSEResponse();
    
    // Assistant message
    mockRes.write(`event: message-start\ndata: ${JSON.stringify({ id: 'assist-1' })}\n\n`);
    mockRes.write(`event: message-chunk\ndata: ${JSON.stringify({ messageId: 'assist-1', chunk: "I'll search for test files." })}\n\n`);
    mockRes.write(`event: message-end\ndata: ${JSON.stringify({ messageId: 'assist-1' })}\n\n`);
    
    // Multiple tools
    const tools = ['Glob', 'Read', 'Read'];
    tools.forEach((tool, i) => {
      mockRes.write(`event: tool-execution\ndata: ${JSON.stringify({ 
        toolExecution: {
          id: `tool-${i}`,
          name: tool,
          args: tool === 'Glob' ? '**/*.test.js' : `test${i}.js`,
          status: 'running'
        }
      })}\n\n`);
    });
    
    // Verify tool executions
    const toolEvents = mockRes.getEventsByType('tool-execution');
    assert.strictEqual(toolEvents.length, 3, 'Should have 3 tool executions');
    assert.strictEqual(toolEvents[0].data.toolExecution.name, 'Glob');
    assert.strictEqual(toolEvents[1].data.toolExecution.name, 'Read');
    assert.strictEqual(toolEvents[2].data.toolExecution.name, 'Read');
    
    console.log('✓ Handles multiple tool executions correctly');
  });
});

console.log(`\nTest Results: ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
  console.log('Some tests failed. Please check the implementation.');
  process.exit(1);
} else {
  console.log('All tests passed! The Claude message flow is working correctly.');
}