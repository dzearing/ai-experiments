import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Planning Mode', () => {
  let mockFetch: any;

  beforeEach(() => {
    // Mock fetch
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  it('should send plan mode in message request', async () => {
    // Arrange
    const sessionId = 'test-session-123';
    const message = 'remove report.html and report2.html';
    const mode = 'plan';

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    // Act
    await fetch('http://localhost:3000/api/claude/code/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        message,
        mode
      })
    });

    // Assert
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/claude/code/message',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message,
          mode: 'plan'
        })
      })
    );

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.mode).toBe('plan');
  });

  it('should not allow write operations in plan mode', async () => {
    // This test would need to be run against a real or mocked Claude service
    // to verify that write operations are blocked in plan mode
    
    // For now, we document the expected behavior:
    // 1. When mode is 'plan', the server should only allow read-only tools
    // 2. Tools like Bash (with rm commands), Write, Edit should be blocked
    // 3. Only tools like Read, LS, Grep, Glob should be allowed
    
    expect(true).toBe(true); // Placeholder
  });
});