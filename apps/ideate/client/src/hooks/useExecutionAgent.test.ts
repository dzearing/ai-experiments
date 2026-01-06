import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useExecutionAgent, type UseExecutionAgentOptions, type ExecutionMessage, type ExecutionBlockedEvent, type TaskCompleteEvent, type PhaseCompleteEvent, type NewIdeaEvent, type TaskUpdateEvent } from './useExecutionAgent';

// Mock config before importing the hook
vi.mock('../config', () => ({
  EXECUTION_AGENT_WS_URL: 'ws://localhost:3002/execution-agent',
}));

// Mock WebSocket class
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  static instances: MockWebSocket[] = [];

  readyState = MockWebSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;

  send = vi.fn();
  close = vi.fn(() => {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.();
  });

  constructor() {
    MockWebSocket.instances.push(this);
  }

  // Helper to simulate connection
  simulateOpen() {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.();
  }

  // Helper to simulate message
  simulateMessage(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) } as MessageEvent);
  }

  // Helper to simulate error
  simulateError() {
    this.onerror?.({} as Event);
  }

  // Helper to simulate close
  simulateClose() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.();
  }

  static clearInstances() {
    MockWebSocket.instances = [];
  }

  static getLatest(): MockWebSocket | undefined {
    return MockWebSocket.instances[MockWebSocket.instances.length - 1];
  }
}

// Replace global WebSocket
const OriginalWebSocket = global.WebSocket;

describe('useExecutionAgent', () => {
  const defaultOptions: UseExecutionAgentOptions = {
    ideaId: 'test-idea-id',
    userId: 'test-user-id',
    userName: 'Test User',
    enabled: true,
  };

  const mockIdeaContext = {
    id: 'test-idea-id',
    title: 'Test Idea',
    summary: 'A test idea for unit testing',
  };

  const mockPlan = {
    phases: [
      {
        id: 'phase-1',
        title: 'Phase 1',
        description: 'First phase',
        tasks: [
          { id: 'task-1', title: 'Task 1', description: 'First task', completed: false, inProgress: false },
        ],
      },
    ],
    workingDirectory: '/tmp/test-workspace',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    MockWebSocket.clearInstances();
    // Replace WebSocket globally
    global.WebSocket = MockWebSocket as unknown as typeof WebSocket;
  });

  afterEach(() => {
    vi.useRealTimers();
    global.WebSocket = OriginalWebSocket;
  });

  // Helper to get the latest MockWebSocket instance
  const getWs = () => MockWebSocket.getLatest();

  describe('initial state', () => {
    it('returns correct initial state', () => {
      const { result } = renderHook(() => useExecutionAgent(defaultOptions));

      expect(result.current.messages).toEqual([]);
      expect(result.current.isConnected).toBe(false);
      expect(result.current.isExecuting).toBe(false);
      expect(result.current.isPaused).toBe(false);
      expect(result.current.isBlocked).toBe(false);
      expect(result.current.blockedEvent).toBeNull();
      expect(result.current.sessionState).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.tokenUsage).toBeNull();
    });

    it('does not connect when disabled', () => {
      renderHook(() => useExecutionAgent({ ...defaultOptions, enabled: false }));

      expect(MockWebSocket.instances.length).toBe(0);
    });

    it('connects when enabled', () => {
      renderHook(() => useExecutionAgent(defaultOptions));

      expect(MockWebSocket.instances.length).toBe(1);
    });
  });

  describe('WebSocket connection', () => {
    it('sets isConnected to true when WebSocket opens', () => {
      const { result } = renderHook(() => useExecutionAgent(defaultOptions));

      act(() => {
        getWs()?.simulateOpen();
      });

      expect(result.current.isConnected).toBe(true);
    });

    it('sets isConnected to false when WebSocket closes', () => {
      const { result } = renderHook(() => useExecutionAgent(defaultOptions));

      act(() => {
        getWs()?.simulateOpen();
      });

      expect(result.current.isConnected).toBe(true);

      act(() => {
        getWs()?.simulateClose();
      });

      expect(result.current.isConnected).toBe(false);
    });

    it('sets error on WebSocket error', () => {
      const onError = vi.fn();
      const { result } = renderHook(() => useExecutionAgent({ ...defaultOptions, onError }));

      act(() => {
        getWs()?.simulateError();
      });

      expect(result.current.error).toBe('Failed to connect to execution agent service');
      expect(onError).toHaveBeenCalledWith('Failed to connect to execution agent service');
    });

    it('attempts reconnect after disconnect when enabled', () => {
      renderHook(() => useExecutionAgent(defaultOptions));
      const initialCount = MockWebSocket.instances.length;

      act(() => {
        getWs()?.simulateOpen();
      });

      act(() => {
        getWs()?.simulateClose();
      });

      // Fast-forward past reconnect timeout
      act(() => {
        vi.advanceTimersByTime(3001);
      });

      // Should have created at least one more WebSocket after the timeout
      expect(MockWebSocket.instances.length).toBeGreaterThan(initialCount);
    });

    it('does not reconnect when disabled', () => {
      const { rerender } = renderHook(
        ({ enabled }) => useExecutionAgent({ ...defaultOptions, enabled }),
        { initialProps: { enabled: true } }
      );

      act(() => {
        getWs()?.simulateOpen();
      });

      // Disable the hook
      rerender({ enabled: false });

      // Fast-forward past reconnect timeout
      act(() => {
        vi.advanceTimersByTime(3001);
      });

      // Should not create a new WebSocket
      expect(MockWebSocket.instances.length).toBe(1);
    });
  });

  describe('startExecution', () => {
    it('sends start_execution message when WebSocket is open', () => {
      const { result } = renderHook(() => useExecutionAgent(defaultOptions));
      const ws = getWs();

      act(() => {
        ws?.simulateOpen();
      });

      act(() => {
        result.current.startExecution(mockIdeaContext, mockPlan, 'phase-1');
      });

      expect(ws?.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'start_execution',
          idea: mockIdeaContext,
          plan: mockPlan,
          phaseId: 'phase-1',
        })
      );
      expect(result.current.isExecuting).toBe(true);
      expect(result.current.isPaused).toBe(false);
      expect(result.current.isBlocked).toBe(false);
    });

    it('queues execution when WebSocket is not yet open', () => {
      const { result } = renderHook(() => useExecutionAgent(defaultOptions));
      const ws = getWs();

      // Call startExecution before WebSocket is open
      act(() => {
        result.current.startExecution(mockIdeaContext, mockPlan, 'phase-1');
      });

      // Should not have sent anything yet
      expect(ws?.send).not.toHaveBeenCalled();

      // Now open the WebSocket
      act(() => {
        ws?.simulateOpen();
      });

      // Should now have sent the queued execution
      expect(ws?.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'start_execution',
          idea: mockIdeaContext,
          plan: mockPlan,
          phaseId: 'phase-1',
        })
      );
      expect(result.current.isExecuting).toBe(true);
    });
  });

  describe('sendMessage', () => {
    it('sends message and adds to local messages', () => {
      const { result } = renderHook(() => useExecutionAgent(defaultOptions));
      const ws = getWs();

      act(() => {
        ws?.simulateOpen();
      });

      act(() => {
        result.current.sendMessage('Hello, agent!');
      });

      expect(ws?.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'send_message',
          content: 'Hello, agent!',
        })
      );

      expect(result.current.messages.length).toBe(1);
      expect(result.current.messages[0].role).toBe('user');
      expect(result.current.messages[0].content).toBe('Hello, agent!');
    });

    it('does not send empty messages', () => {
      const { result } = renderHook(() => useExecutionAgent(defaultOptions));
      const ws = getWs();

      act(() => {
        ws?.simulateOpen();
      });

      act(() => {
        result.current.sendMessage('  ');
      });

      expect(ws?.send).not.toHaveBeenCalled();
      expect(result.current.messages.length).toBe(0);
    });

    it('clears blocked state when sending a message', () => {
      const { result } = renderHook(() => useExecutionAgent(defaultOptions));
      const ws = getWs();

      act(() => {
        ws?.simulateOpen();
      });

      // Simulate blocked state
      act(() => {
        ws?.simulateMessage({
          type: 'execution_blocked',
          executionBlocked: {
            issue: 'Need user input',
            needsUserInput: true,
          },
        });
      });

      expect(result.current.isBlocked).toBe(true);

      act(() => {
        result.current.sendMessage('Here is my input');
      });

      expect(result.current.isBlocked).toBe(false);
      expect(result.current.blockedEvent).toBeNull();
    });

    it('sets error when not connected', () => {
      const { result } = renderHook(() => useExecutionAgent(defaultOptions));

      act(() => {
        result.current.sendMessage('Hello');
      });

      expect(result.current.error).toBe('Not connected to execution agent service');
    });
  });

  describe('sendFeedback', () => {
    it('is an alias for sendMessage', () => {
      const { result } = renderHook(() => useExecutionAgent(defaultOptions));
      const ws = getWs();

      act(() => {
        ws?.simulateOpen();
      });

      act(() => {
        result.current.sendFeedback('This is feedback');
      });

      expect(ws?.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'send_message',
          content: 'This is feedback',
        })
      );
    });
  });

  describe('pauseExecution', () => {
    it('sends pause message', () => {
      const { result } = renderHook(() => useExecutionAgent(defaultOptions));
      const ws = getWs();

      act(() => {
        ws?.simulateOpen();
      });

      act(() => {
        result.current.pauseExecution();
      });

      expect(ws?.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'pause' })
      );
      expect(result.current.isPaused).toBe(true);
    });
  });

  describe('resumeExecution', () => {
    it('sends resume message', () => {
      const { result } = renderHook(() => useExecutionAgent(defaultOptions));
      const ws = getWs();

      act(() => {
        ws?.simulateOpen();
      });

      act(() => {
        result.current.resumeExecution();
      });

      expect(ws?.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'resume' })
      );
      expect(result.current.isPaused).toBe(false);
    });
  });

  describe('cancelExecution', () => {
    it('sends cancel message and resets state', () => {
      const { result } = renderHook(() => useExecutionAgent(defaultOptions));
      const ws = getWs();

      act(() => {
        ws?.simulateOpen();
      });

      act(() => {
        result.current.startExecution(mockIdeaContext, mockPlan, 'phase-1');
      });

      act(() => {
        result.current.cancelExecution();
      });

      expect(ws?.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'cancel' })
      );
      expect(result.current.isExecuting).toBe(false);
      expect(result.current.isPaused).toBe(false);
      expect(result.current.isBlocked).toBe(false);
    });
  });

  describe('clearMessages', () => {
    it('clears all messages and resets state', () => {
      const { result } = renderHook(() => useExecutionAgent(defaultOptions));
      const ws = getWs();

      act(() => {
        ws?.simulateOpen();
      });

      act(() => {
        result.current.sendMessage('Test message');
      });

      expect(result.current.messages.length).toBe(1);

      act(() => {
        result.current.clearMessages();
      });

      expect(result.current.messages.length).toBe(0);
      expect(result.current.error).toBeNull();
      expect(result.current.tokenUsage).toBeNull();
    });
  });

  describe('addLocalMessage', () => {
    it('adds a message to the local list', () => {
      const { result } = renderHook(() => useExecutionAgent(defaultOptions));

      const message: ExecutionMessage = {
        id: 'local-1',
        role: 'system',
        type: 'text',
        content: 'System message',
        timestamp: Date.now(),
      };

      act(() => {
        result.current.addLocalMessage(message);
      });

      expect(result.current.messages.length).toBe(1);
      expect(result.current.messages[0].content).toBe('System message');
    });
  });

  describe('requestHistory', () => {
    it('sends get_history message', () => {
      const { result } = renderHook(() => useExecutionAgent(defaultOptions));
      const ws = getWs();

      act(() => {
        ws?.simulateOpen();
      });

      act(() => {
        result.current.requestHistory(50);
      });

      expect(ws?.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'get_history',
          limit: 50,
        })
      );
    });
  });

  describe('server message handling', () => {
    it('handles connected message with session state', () => {
      const { result } = renderHook(() => useExecutionAgent(defaultOptions));
      const ws = getWs();

      act(() => {
        ws?.simulateOpen();
      });

      act(() => {
        ws?.simulateMessage({
          type: 'connected',
          session: { status: 'running', phaseId: 'phase-1' },
          hasActiveExecution: true,
        });
      });

      expect(result.current.sessionState).toEqual({ status: 'running', phaseId: 'phase-1' });
      expect(result.current.isExecuting).toBe(true);
    });

    it('handles history message', () => {
      const { result } = renderHook(() => useExecutionAgent(defaultOptions));
      const ws = getWs();

      act(() => {
        ws?.simulateOpen();
      });

      const historyMessages: ExecutionMessage[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: 1000, type: 'text' },
        { id: '2', role: 'assistant', content: 'Hi there', timestamp: 2000, type: 'text' },
      ];

      act(() => {
        ws?.simulateMessage({
          type: 'history',
          messages: historyMessages,
        });
      });

      expect(result.current.messages).toEqual(historyMessages);
    });

    it('handles text_chunk message (streaming)', () => {
      const { result } = renderHook(() => useExecutionAgent(defaultOptions));
      const ws = getWs();

      act(() => {
        ws?.simulateOpen();
      });

      // First chunk - creates new message
      act(() => {
        ws?.simulateMessage({
          type: 'text_chunk',
          messageId: 'msg-1',
          text: 'Hello ',
        });
      });

      expect(result.current.messages.length).toBe(1);
      expect(result.current.messages[0].content).toBe('Hello ');
      expect(result.current.messages[0].isStreaming).toBe(true);

      // Second chunk - appends to existing message
      act(() => {
        ws?.simulateMessage({
          type: 'text_chunk',
          messageId: 'msg-1',
          text: 'world!',
        });
      });

      expect(result.current.messages.length).toBe(1);
      expect(result.current.messages[0].content).toBe('Hello world!');
    });

    it('handles task_complete message', () => {
      const onTaskComplete = vi.fn();
      const { result } = renderHook(() =>
        useExecutionAgent({ ...defaultOptions, onTaskComplete })
      );
      const ws = getWs();

      act(() => {
        ws?.simulateOpen();
      });

      const taskComplete: TaskCompleteEvent = {
        taskId: 'task-1',
        phaseId: 'phase-1',
        summary: 'Task completed successfully',
      };

      act(() => {
        ws?.simulateMessage({
          type: 'task_complete',
          taskComplete,
        });
      });

      expect(result.current.messages.length).toBe(1);
      expect(result.current.messages[0].type).toBe('task_complete');
      expect(onTaskComplete).toHaveBeenCalledWith(taskComplete);
    });

    it('handles phase_complete message', () => {
      const onPhaseComplete = vi.fn();
      const { result } = renderHook(() =>
        useExecutionAgent({ ...defaultOptions, onPhaseComplete })
      );
      const ws = getWs();

      act(() => {
        ws?.simulateOpen();
      });

      const phaseComplete: PhaseCompleteEvent = {
        phaseId: 'phase-1',
        summary: 'Phase completed',
      };

      act(() => {
        ws?.simulateMessage({
          type: 'phase_complete',
          phaseComplete,
        });
      });

      expect(result.current.messages.length).toBe(1);
      expect(result.current.messages[0].type).toBe('phase_complete');
      expect(onPhaseComplete).toHaveBeenCalledWith(phaseComplete);
    });

    it('handles execution_blocked message', () => {
      const onExecutionBlocked = vi.fn();
      const { result } = renderHook(() =>
        useExecutionAgent({ ...defaultOptions, onExecutionBlocked })
      );
      const ws = getWs();

      act(() => {
        ws?.simulateOpen();
      });

      const blockedEvent: ExecutionBlockedEvent = {
        taskId: 'task-1',
        phaseId: 'phase-1',
        issue: 'Need API key',
        needsUserInput: true,
      };

      act(() => {
        ws?.simulateMessage({
          type: 'execution_blocked',
          executionBlocked: blockedEvent,
        });
      });

      expect(result.current.isBlocked).toBe(true);
      expect(result.current.blockedEvent).toEqual(blockedEvent);
      expect(result.current.messages.length).toBe(1);
      expect(result.current.messages[0].type).toBe('blocked');
      expect(onExecutionBlocked).toHaveBeenCalledWith(blockedEvent);
    });

    it('handles new_idea message', () => {
      const onNewIdea = vi.fn();
      const { result } = renderHook(() =>
        useExecutionAgent({ ...defaultOptions, onNewIdea })
      );
      const ws = getWs();

      act(() => {
        ws?.simulateOpen();
      });

      const newIdea: NewIdeaEvent = {
        title: 'New Feature Idea',
        summary: 'A new feature discovered during execution',
        tags: ['feature', 'discovered'],
        priority: 'high',
      };

      act(() => {
        ws?.simulateMessage({
          type: 'new_idea',
          newIdea,
        });
      });

      expect(result.current.messages.length).toBe(1);
      expect(result.current.messages[0].type).toBe('new_idea');
      expect(onNewIdea).toHaveBeenCalledWith(newIdea);
    });

    it('handles task_update message', () => {
      const onTaskUpdate = vi.fn();
      const { result } = renderHook(() =>
        useExecutionAgent({ ...defaultOptions, onTaskUpdate })
      );
      const ws = getWs();

      act(() => {
        ws?.simulateOpen();
      });

      const taskUpdate: TaskUpdateEvent = {
        action: 'add',
        taskId: 'new-task',
        phaseId: 'phase-1',
        title: 'New discovered task',
        status: 'pending',
      };

      act(() => {
        ws?.simulateMessage({
          type: 'task_update',
          taskUpdate,
        });
      });

      expect(result.current.messages.length).toBe(1);
      expect(result.current.messages[0].type).toBe('task_update');
      expect(onTaskUpdate).toHaveBeenCalledWith(taskUpdate);
    });

    it('handles tool_use_start message', () => {
      const { result } = renderHook(() => useExecutionAgent(defaultOptions));
      const ws = getWs();

      act(() => {
        ws?.simulateOpen();
      });

      act(() => {
        ws?.simulateMessage({
          type: 'tool_use_start',
          toolName: 'read_file',
          toolInput: { path: '/test.txt' },
          messageId: 'msg-1',
        });
      });

      // Tool use creates a message with toolCalls array
      expect(result.current.messages.length).toBe(1);
      expect(result.current.messages[0].type).toBe('text');
      expect(result.current.messages[0].toolCalls?.length).toBe(1);
      expect(result.current.messages[0].toolCalls?.[0].name).toBe('read_file');
      expect(result.current.messages[0].toolCalls?.[0].input).toEqual({ path: '/test.txt' });
      expect(result.current.messages[0].toolCalls?.[0].output).toBeUndefined();
    });

    it('handles tool_use_end message', () => {
      const { result } = renderHook(() => useExecutionAgent(defaultOptions));
      const ws = getWs();

      act(() => {
        ws?.simulateOpen();
      });

      // First send tool_use_start to create the message with tool call
      act(() => {
        ws?.simulateMessage({
          type: 'tool_use_start',
          toolName: 'read_file',
          messageId: 'msg-1',
        });
      });

      // Then send tool_use_end to update the tool call's output
      act(() => {
        ws?.simulateMessage({
          type: 'tool_use_end',
          toolName: 'read_file',
          toolResult: 'File contents here...',
          messageId: 'msg-1',
        });
      });

      expect(result.current.messages.length).toBe(1);
      expect(result.current.messages[0].toolCalls?.length).toBe(1);
      expect(result.current.messages[0].toolCalls?.[0].output).toBe('File contents here...');
    });

    it('handles execution_complete message', () => {
      const onExecutionComplete = vi.fn();
      const { result } = renderHook(() =>
        useExecutionAgent({ ...defaultOptions, onExecutionComplete })
      );
      const ws = getWs();

      act(() => {
        ws?.simulateOpen();
      });

      act(() => {
        result.current.startExecution(mockIdeaContext, mockPlan, 'phase-1');
      });

      expect(result.current.isExecuting).toBe(true);

      act(() => {
        ws?.simulateMessage({
          type: 'execution_complete',
        });
      });

      expect(result.current.isExecuting).toBe(false);
      expect(result.current.isBlocked).toBe(false);
      expect(result.current.sessionState?.status).toBe('completed');
      expect(onExecutionComplete).toHaveBeenCalled();
    });

    it('handles error message', () => {
      const onError = vi.fn();
      const { result } = renderHook(() =>
        useExecutionAgent({ ...defaultOptions, onError })
      );
      const ws = getWs();

      act(() => {
        ws?.simulateOpen();
      });

      act(() => {
        ws?.simulateMessage({
          type: 'error',
          error: 'Something went wrong',
        });
      });

      expect(result.current.error).toBe('Something went wrong');
      expect(result.current.isExecuting).toBe(false);
      expect(onError).toHaveBeenCalledWith('Something went wrong');
    });

    it('handles token_usage message', () => {
      const { result } = renderHook(() => useExecutionAgent(defaultOptions));
      const ws = getWs();

      act(() => {
        ws?.simulateOpen();
      });

      act(() => {
        ws?.simulateMessage({
          type: 'token_usage',
          usage: { inputTokens: 100, outputTokens: 50 },
        });
      });

      expect(result.current.tokenUsage).toEqual({ inputTokens: 100, outputTokens: 50 });
    });
  });

  describe('disabled state', () => {
    it('clears state when disabled', () => {
      const { result, rerender } = renderHook(
        ({ enabled }) => useExecutionAgent({ ...defaultOptions, enabled }),
        { initialProps: { enabled: true } }
      );
      const ws = getWs();

      act(() => {
        ws?.simulateOpen();
      });

      act(() => {
        result.current.sendMessage('Test');
      });

      expect(result.current.messages.length).toBe(1);
      expect(result.current.isConnected).toBe(true);

      // Disable
      rerender({ enabled: false });

      expect(result.current.messages).toEqual([]);
      expect(result.current.isConnected).toBe(false);
      expect(result.current.isExecuting).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('closes WebSocket when disabled', () => {
      const { rerender } = renderHook(
        ({ enabled }) => useExecutionAgent({ ...defaultOptions, enabled }),
        { initialProps: { enabled: true } }
      );
      const ws = getWs();

      act(() => {
        ws?.simulateOpen();
      });

      rerender({ enabled: false });

      expect(ws?.close).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('closes WebSocket on unmount', () => {
      const { unmount } = renderHook(() => useExecutionAgent(defaultOptions));
      const ws = getWs();

      act(() => {
        ws?.simulateOpen();
      });

      unmount();

      expect(ws?.close).toHaveBeenCalled();
    });

    it('cleans up WebSocket resources on unmount', () => {
      const { unmount } = renderHook(() => useExecutionAgent(defaultOptions));
      const ws = getWs();

      act(() => {
        ws?.simulateOpen();
      });

      // Unmount should close the WebSocket
      unmount();

      // Verify the WebSocket was closed
      expect(ws?.close).toHaveBeenCalled();
    });
  });
});
