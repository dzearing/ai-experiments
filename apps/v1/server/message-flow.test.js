// Mock dependencies before requiring modules
const mockLogger = {
  debug: () => {},
  info: () => {},
  error: () => {},
  writeClaudeLog: () => {},
  logEvent: () => {},
  logClaude: () => {},
  logClient: () => {},
};

const mockFs = {
  existsSync: () => false,
  mkdirSync: () => {},
  readdirSync: () => [],
  promises: {
    writeFile: async () => {},
  },
};

// Override require for mocked modules
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function (id) {
  if (id === './logger') return mockLogger;
  if (id === 'fs') return mockFs;
  return originalRequire.apply(this, arguments);
};

const sessionManager = require('./session-manager');

// Test helpers
function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(actual)} to be ${JSON.stringify(expected)}`);
      }
    },
    toHaveLength(expected) {
      if (actual.length !== expected) {
        throw new Error(`Expected length ${actual.length} to be ${expected}`);
      }
    },
    toContain(expected) {
      if (!actual.includes(expected)) {
        throw new Error(`Expected "${actual}" to contain "${expected}"`);
      }
    },
    not: {
      toBe(expected) {
        if (actual === expected) {
          throw new Error(
            `Expected ${JSON.stringify(actual)} not to be ${JSON.stringify(expected)}`
          );
        }
      },
    },
  };
}

// Test runner
const tests = [];
let beforeEachFn = null;

function describe(name, fn) {
  console.log(`\n${name}:`);
  fn();
}

function test(name, fn) {
  tests.push({ name, fn });
}

function beforeEach(fn) {
  beforeEachFn = fn;
}

// Test suite
describe('Message Flow Tests', () => {
  beforeEach(() => {
    // Clear all sessions before each test
    const sessions = sessionManager.getAllSessions();
    sessions.forEach((session) => {
      sessionManager.deleteSession(session.sessionId);
    });
  });

  test('should create separate messages for assistant text and tool executions', () => {
    const sessionId = 'test-session-1';

    // Create session
    sessionManager.createSession({
      sessionId,
      projectId: 'test-project',
      repoName: 'test-repo',
      userName: 'testuser',
      projectPath: '/test/path',
    });

    // Add user message
    sessionManager.addMessage(sessionId, {
      role: 'user',
      content: 'summarize the readme',
    });

    // Add assistant pre-tool message
    sessionManager.addMessage(sessionId, {
      id: 'assistant-1',
      role: 'assistant',
      content: "I'll analyze the README for you.",
    });

    // Add tool execution message
    sessionManager.addMessage(sessionId, {
      id: 'tool-1',
      role: 'tool',
      name: 'Read',
      args: '/path/to/README.md',
      status: 'complete',
      executionTime: 150,
    });

    // Add final assistant response
    sessionManager.addMessage(sessionId, {
      id: 'assistant-2',
      role: 'assistant',
      content: 'The README describes a project that...',
    });

    // Verify messages
    const session = sessionManager.getSession(sessionId);
    expect(session.messages).toHaveLength(4);

    // Check message order and types
    expect(session.messages[0].role).toBe('user');
    expect(session.messages[1].role).toBe('assistant');
    expect(session.messages[1].content).toBe("I'll analyze the README for you.");
    expect(session.messages[2].role).toBe('tool');
    expect(session.messages[2].name).toBe('Read');
    expect(session.messages[2].args).toBe('/path/to/README.md');
    expect(session.messages[3].role).toBe('assistant');
    expect(session.messages[3].content).toContain('The README describes');
  });

  test('should handle multiple tool executions', () => {
    const sessionId = 'test-session-2';

    // Create session
    sessionManager.createSession({
      sessionId,
      projectId: 'test-project',
      repoName: 'test-repo',
      userName: 'testuser',
      projectPath: '/test/path',
    });

    // Add user message
    sessionManager.addMessage(sessionId, {
      role: 'user',
      content: 'analyze all test files',
    });

    // Add assistant message
    sessionManager.addMessage(sessionId, {
      role: 'assistant',
      content: "I'll search for and analyze all test files.",
    });

    // Add multiple tool executions
    sessionManager.addMessage(sessionId, {
      id: 'tool-1',
      role: 'tool',
      name: 'Glob',
      args: '**/*.test.js',
      status: 'complete',
      executionTime: 50,
    });

    sessionManager.addMessage(sessionId, {
      id: 'tool-2',
      role: 'tool',
      name: 'Read',
      args: 'test1.test.js',
      status: 'complete',
      executionTime: 30,
    });

    sessionManager.addMessage(sessionId, {
      id: 'tool-3',
      role: 'tool',
      name: 'Read',
      args: 'test2.test.js',
      status: 'complete',
      executionTime: 25,
    });

    // Add final response
    sessionManager.addMessage(sessionId, {
      role: 'assistant',
      content: 'I found and analyzed 2 test files...',
    });

    // Verify
    const session = sessionManager.getSession(sessionId);
    expect(session.messages).toHaveLength(6);

    // Count tool messages
    const toolMessages = session.messages.filter((m) => m.role === 'tool');
    expect(toolMessages).toHaveLength(3);

    // Verify tool message details
    expect(toolMessages[0].name).toBe('Glob');
    expect(toolMessages[1].name).toBe('Read');
    expect(toolMessages[2].name).toBe('Read');
  });

  test('should preserve message IDs for proper rehydration', () => {
    const sessionId = 'test-session-3';

    // Create session
    sessionManager.createSession({
      sessionId,
      projectId: 'test-project',
      repoName: 'test-repo',
      userName: 'testuser',
      projectPath: '/test/path',
    });

    // Add messages with specific IDs
    const messageIds = {
      user: 'user-msg-1',
      assistant1: 'assistant-msg-1',
      tool: 'tool-exec-1',
      assistant2: 'assistant-msg-2',
    };

    sessionManager.addMessage(sessionId, {
      id: messageIds.user,
      role: 'user',
      content: 'test message',
    });

    sessionManager.addMessage(sessionId, {
      id: messageIds.assistant1,
      role: 'assistant',
      content: 'Processing...',
    });

    sessionManager.addMessage(sessionId, {
      id: messageIds.tool,
      role: 'tool',
      name: 'Bash',
      args: 'npm test',
      status: 'complete',
    });

    sessionManager.addMessage(sessionId, {
      id: messageIds.assistant2,
      role: 'assistant',
      content: 'Tests completed successfully.',
    });

    // Verify IDs are preserved
    const session = sessionManager.getSession(sessionId);
    expect(session.messages[0].id).toBe(messageIds.user);
    expect(session.messages[1].id).toBe(messageIds.assistant1);
    expect(session.messages[2].id).toBe(messageIds.tool);
    expect(session.messages[3].id).toBe(messageIds.assistant2);
  });

  test('should format tool args based on tool type', () => {
    const sessionId = 'test-session-4';

    // Create session
    sessionManager.createSession({
      sessionId,
      projectId: 'test-project',
      repoName: 'test-repo',
      userName: 'testuser',
      projectPath: '/test/path',
    });

    // Test different tool arg formats
    const tools = [
      {
        name: 'Read',
        args: '/path/to/file.js',
        expectedArgs: '/path/to/file.js',
      },
      {
        name: 'Write',
        args: '/path/to/output.txt',
        expectedArgs: '/path/to/output.txt',
      },
      {
        name: 'Bash',
        args: 'npm run build',
        expectedArgs: 'npm run build',
      },
      {
        name: 'Edit',
        args: JSON.stringify({ file: 'test.js', line: 10 }, null, 2),
        expectedArgs: JSON.stringify({ file: 'test.js', line: 10 }, null, 2),
      },
    ];

    tools.forEach((tool, index) => {
      sessionManager.addMessage(sessionId, {
        id: `tool-${index}`,
        role: 'tool',
        name: tool.name,
        args: tool.args,
        status: 'complete',
      });
    });

    // Verify
    const session = sessionManager.getSession(sessionId);
    const toolMessages = session.messages.filter((m) => m.role === 'tool');

    expect(toolMessages).toHaveLength(tools.length);

    tools.forEach((tool, index) => {
      expect(toolMessages[index].name).toBe(tool.name);
      expect(toolMessages[index].args).toBe(tool.expectedArgs);
    });
  });

  test('should handle tool execution status progression', () => {
    const sessionId = 'test-session-5';

    // Create session
    sessionManager.createSession({
      sessionId,
      projectId: 'test-project',
      repoName: 'test-repo',
      userName: 'testuser',
      projectPath: '/test/path',
    });

    // Add tool in running state
    sessionManager.addMessage(sessionId, {
      id: 'tool-running',
      role: 'tool',
      name: 'Bash',
      args: 'npm install',
      status: 'running',
    });

    // Verify running state
    let session = sessionManager.getSession(sessionId);
    expect(session.messages[0].status).toBe('running');

    // Simulate updating to complete
    // In real scenario, this would be done through the server's tool execution tracking
    const messages = session.messages;
    messages[0].status = 'complete';
    messages[0].executionTime = 5000;

    // Verify complete state
    expect(session.messages[0].status).toBe('complete');
    expect(session.messages[0].executionTime).toBe(5000);
  });

  test('should not concatenate assistant messages when tools are used', () => {
    const sessionId = 'test-session-6';

    // Create session
    sessionManager.createSession({
      sessionId,
      projectId: 'test-project',
      repoName: 'test-repo',
      userName: 'testuser',
      projectPath: '/test/path',
    });

    // Simulate the actual flow
    // 1. User message
    sessionManager.addMessage(sessionId, {
      role: 'user',
      content: 'read and summarize config.json',
    });

    // 2. Assistant message before tool
    sessionManager.addMessage(sessionId, {
      id: 'assistant-pre-tool',
      role: 'assistant',
      content: "I'll read the config.json file for you.",
    });

    // 3. Tool execution
    sessionManager.addMessage(sessionId, {
      id: 'tool-read',
      role: 'tool',
      name: 'Read',
      args: 'config.json',
      status: 'complete',
    });

    // 4. Assistant message with result
    sessionManager.addMessage(sessionId, {
      id: 'assistant-post-tool',
      role: 'assistant',
      content: 'The config.json file contains the following settings...',
    });

    // Verify messages are separate
    const session = sessionManager.getSession(sessionId);
    expect(session.messages).toHaveLength(4);

    // Ensure assistant messages are not concatenated
    const assistantMessages = session.messages.filter((m) => m.role === 'assistant');
    expect(assistantMessages).toHaveLength(2);
    expect(assistantMessages[0].content).toBe("I'll read the config.json file for you.");
    expect(assistantMessages[1].content).toContain('The config.json file contains');

    // Ensure they have different IDs
    expect(assistantMessages[0].id).not.toBe(assistantMessages[1].id);
  });
});

// Run tests
console.log('Running Message Flow tests...');

let passed = 0;
let failed = 0;

tests.forEach((test) => {
  try {
    if (beforeEachFn) beforeEachFn();
    test.fn();
    console.log(`  ✓ ${test.name}`);
    passed++;
  } catch (error) {
    console.log(`  ✗ ${test.name}`);
    console.log(`    ${error.message}`);
    failed++;
  }
});

console.log(`\n\nTest Results: ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
  console.log('Some tests failed. Please check the implementation.');
  process.exit(1);
} else {
  console.log('All tests passed! The message flow is working correctly.');
}
