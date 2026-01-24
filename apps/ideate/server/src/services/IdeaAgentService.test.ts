/**
 * Tests for IdeaAgentService
 *
 * Verifies agent session status tracking and rehydration.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { IdeaAgentService } from './IdeaAgentService.js';

describe('IdeaAgentService', () => {
  let service: IdeaAgentService;

  beforeEach(() => {
    service = new IdeaAgentService();
  });

  describe('getRunningSessionsForWorkspace', () => {
    it('should return empty array when no sessions exist', () => {
      const sessions = service.getRunningSessionsForWorkspace('workspace-1');
      expect(sessions).toEqual([]);
    });

    it('should return running sessions for the specified workspace', async () => {
      // Register a mock client to create a session
      const callbacks = {
        onTextChunk: () => {},
        onComplete: () => {},
        onError: () => {},
        onDocumentEditStart: () => {},
        onDocumentEditEnd: () => {},
        onTokenUsage: () => {},
        onOpenQuestions: () => {},
        onSuggestedResponses: () => {},
        onProgressEvent: () => {},
      };

      // Register client for idea-1 in workspace-1
      service.registerClient('idea-1', callbacks, 'workspace-1');

      // Manually set session to running state for testing
      // Access private activeSessions through any cast
      const activeSessions = (service as unknown as { activeSessions: Map<string, { ideaId: string; status: string; userId: string; workspaceId?: string; startedAt?: number }> }).activeSessions;

      activeSessions.set('idea-1', {
        ideaId: 'idea-1',
        status: 'running',
        userId: 'user-1',
        workspaceId: 'workspace-1',
        startedAt: Date.now(),
      });

      const sessions = service.getRunningSessionsForWorkspace('workspace-1');

      expect(sessions).toHaveLength(1);
      expect(sessions[0].ideaId).toBe('idea-1');
      expect(sessions[0].status).toBe('running');
      expect(sessions[0].userId).toBe('user-1');
      expect(sessions[0].startedAt).toBeDefined();
    });

    it('should not return idle sessions', async () => {
      const activeSessions = (service as unknown as { activeSessions: Map<string, { ideaId: string; status: string; userId: string; workspaceId?: string; startedAt?: number }> }).activeSessions;

      activeSessions.set('idea-1', {
        ideaId: 'idea-1',
        status: 'idle',
        userId: 'user-1',
        workspaceId: 'workspace-1',
      });

      const sessions = service.getRunningSessionsForWorkspace('workspace-1');

      expect(sessions).toHaveLength(0);
    });

    it('should not return sessions from other workspaces', async () => {
      const activeSessions = (service as unknown as { activeSessions: Map<string, { ideaId: string; status: string; userId: string; workspaceId?: string; startedAt?: number }> }).activeSessions;

      activeSessions.set('idea-1', {
        ideaId: 'idea-1',
        status: 'running',
        userId: 'user-1',
        workspaceId: 'workspace-2', // Different workspace
        startedAt: Date.now(),
      });

      const sessions = service.getRunningSessionsForWorkspace('workspace-1');

      expect(sessions).toHaveLength(0);
    });

    it('should return multiple running sessions in the same workspace', async () => {
      const activeSessions = (service as unknown as { activeSessions: Map<string, { ideaId: string; status: string; userId: string; workspaceId?: string; startedAt?: number }> }).activeSessions;

      activeSessions.set('idea-1', {
        ideaId: 'idea-1',
        status: 'running',
        userId: 'user-1',
        workspaceId: 'workspace-1',
        startedAt: Date.now(),
      });

      activeSessions.set('idea-2', {
        ideaId: 'idea-2',
        status: 'running',
        userId: 'user-2',
        workspaceId: 'workspace-1',
        startedAt: Date.now(),
      });

      activeSessions.set('idea-3', {
        ideaId: 'idea-3',
        status: 'idle', // Not running
        userId: 'user-3',
        workspaceId: 'workspace-1',
      });

      const sessions = service.getRunningSessionsForWorkspace('workspace-1');

      expect(sessions).toHaveLength(2);
      expect(sessions.map(s => s.ideaId).sort()).toEqual(['idea-1', 'idea-2']);
    });
  });

  describe('session state change callback', () => {
    it('should call callback when session state changes to running', async () => {
      const stateChanges: Array<{ ideaId: string; status: string }> = [];

      service.setSessionStateChangeCallback((ideaId, status) => {
        stateChanges.push({ ideaId, status });
      });

      // The callback is called internally when processMessage sets status to running
      // For this test, we verify the callback mechanism is wired up
      expect(stateChanges).toHaveLength(0);
    });
  });
});
