import * as fs from 'fs/promises';
import * as path from 'path';
import { homedir } from 'os';
import type { FacilitatorMessage, FacilitatorChatMetadata } from './FacilitatorChatService.js';
import type { ChatMessage, ChatRoomMetadata } from './ChatRoomService.js';
import type { IdeaAgentMessage, IdeaAgentChatMetadata } from './IdeaAgentChatService.js';
import type { PlanAgentMessage, PlanAgentChatMetadata } from './PlanAgentChatService.js';
import type { FacilitatorService } from './FacilitatorService.js';
import { getImportAgentChatService } from './ImportAgentChatService.js';

// Storage directories
const FACILITATOR_DIR = path.join(homedir(), 'Ideate', 'facilitator');
const CHATROOMS_DIR = path.join(homedir(), 'Ideate', 'chatrooms');
const IDEA_AGENT_DIR = path.join(homedir(), 'Ideate', 'idea-agent');
const PLAN_AGENT_DIR = path.join(homedir(), 'Ideate', 'plan-agent');

/**
 * Unified session type across all chat systems
 */
export type SessionType = 'facilitator' | 'chatroom' | 'ideaagent' | 'planagent' | 'importagent';

/**
 * In-flight request status
 */
export type InFlightStatus = 'pending' | 'streaming' | 'completed' | 'error';

/**
 * In-flight request representation
 */
export interface InFlightRequest {
  id: string;
  sessionType: SessionType;
  sessionId: string;
  status: InFlightStatus;
  startTime: number;
  userMessage: string;
  /** Partial response text (for streaming) */
  partialResponse?: string;
  /** Error message if failed */
  error?: string;
  /** Token usage so far */
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * Unified session representation
 */
export interface ClaudeSession {
  id: string;
  type: SessionType;
  name: string;
  messageCount: number;
  lastActivity: number;
  metadata?: {
    userId?: string;
    workspaceId?: string;
    workspaceName?: string;
    chatRoomId?: string;
    participantCount?: number;
    ideaId?: string;
    ideaTitle?: string;
    ownerId?: string;
  };
}

/**
 * Tool call information
 */
export interface ToolCall {
  name: string;
  input: Record<string, unknown>;
  output?: string;
}

/**
 * Raw SDK event for diagnostics
 */
export interface RawSDKEvent {
  timestamp: number;
  type: string;
  subtype?: string;
  data: unknown;
}

/**
 * Unified message representation
 */
export interface SessionMessage {
  id: string;
  sessionId: string;
  sessionType: SessionType;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  senderName?: string;
  senderColor?: string;
  toolCalls?: ToolCall[];
  diagnostics?: {
    iterations?: number;
    durationMs?: number;
    responseLength?: number;
    error?: string;
    // Enhanced diagnostics (P0)
    systemPrompt?: string;
    model?: string;
    tokenUsage?: {
      inputTokens: number;
      outputTokens: number;
    };
    // Full diagnostics with raw SDK events
    rawEvents?: RawSDKEvent[];
    sessionInfo?: {
      sessionId: string;
      tools: string[];
      mcpServers: { name: string; status: string }[];
    };
    totalCostUsd?: number;
  };
}

/**
 * Diagnostic entry from FacilitatorService
 */
interface DiagnosticEntry {
  timestamp: string;
  messageId: string;
  userMessage: string;
  iterations: number;
  toolCalls: Array<{ name: string; input: Record<string, unknown>; output?: string }>;
  responseLength: number;
  durationMs: number;
  error?: string;
  // Enhanced diagnostics (P0)
  systemPrompt?: string;
  model?: string;
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
  };
  // Raw SDK events for full diagnostics
  rawEvents?: RawSDKEvent[];
  sessionInfo?: {
    sessionId: string;
    tools: string[];
    mcpServers: { name: string; status: string }[];
  };
  totalCostUsd?: number;
}

/**
 * Callback for in-flight request updates
 */
export type InFlightUpdateCallback = (request: InFlightRequest) => void;

/**
 * Service for aggregating diagnostics data from all chat systems.
 * Provides unified view of sessions and messages across Facilitator, ChatRoom, and IdeaAgent.
 */
export class ClaudeDiagnosticsService {
  private facilitatorService: FacilitatorService | null = null;

  /** Active in-flight requests keyed by request ID */
  private inFlightRequests: Map<string, InFlightRequest> = new Map();

  /** Callbacks to notify when in-flight requests change */
  private inFlightUpdateCallbacks: Set<InFlightUpdateCallback> = new Set();

  /**
   * Set the facilitator service reference for accessing diagnostics
   */
  setFacilitatorService(service: FacilitatorService): void {
    this.facilitatorService = service;
  }

  // ========== In-Flight Request Tracking ===========

  /**
   * Register a callback for in-flight request updates
   */
  onInFlightUpdate(callback: InFlightUpdateCallback): () => void {
    this.inFlightUpdateCallbacks.add(callback);
    return () => this.inFlightUpdateCallbacks.delete(callback);
  }

  /**
   * Get all active in-flight requests
   */
  getInFlightRequests(): InFlightRequest[] {
    return Array.from(this.inFlightRequests.values());
  }

  /**
   * Start tracking an in-flight request
   */
  startRequest(
    sessionType: SessionType,
    sessionId: string,
    userMessage: string
  ): string {
    const id = `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const request: InFlightRequest = {
      id,
      sessionType,
      sessionId,
      status: 'pending',
      startTime: Date.now(),
      userMessage,
    };
    this.inFlightRequests.set(id, request);
    this.notifyInFlightUpdate(request);
    console.log(`[ClaudeDiagnostics] Started request ${id} for ${sessionType}:${sessionId}`);
    return id;
  }

  /**
   * Update an in-flight request's status
   */
  updateRequest(
    requestId: string,
    updates: Partial<Pick<InFlightRequest, 'status' | 'partialResponse' | 'tokenUsage' | 'error'>>
  ): void {
    const request = this.inFlightRequests.get(requestId);
    if (!request) return;

    Object.assign(request, updates);
    this.notifyInFlightUpdate(request);
  }

  /**
   * Complete an in-flight request (success or error)
   */
  completeRequest(
    requestId: string,
    error?: string
  ): void {
    const request = this.inFlightRequests.get(requestId);
    if (!request) return;

    request.status = error ? 'error' : 'completed';
    if (error) request.error = error;

    this.notifyInFlightUpdate(request);

    // Remove from active requests after a short delay so UI can show completion
    setTimeout(() => {
      this.inFlightRequests.delete(requestId);
    }, 2000);

    const duration = Date.now() - request.startTime;
    console.log(`[ClaudeDiagnostics] Completed request ${requestId} (${request.status}) in ${duration}ms`);
  }

  /**
   * Notify all callbacks of an in-flight update
   */
  private notifyInFlightUpdate(request: InFlightRequest): void {
    for (const callback of this.inFlightUpdateCallbacks) {
      try {
        callback(request);
      } catch (error) {
        console.error('[ClaudeDiagnostics] Error in in-flight update callback:', error);
      }
    }
  }

  /**
   * Get facilitator diagnostics entries
   */
  getFacilitatorDiagnostics(): DiagnosticEntry[] {
    if (!this.facilitatorService) {
      return [];
    }
    return this.facilitatorService.getDiagnostics();
  }

  /**
   * List all sessions from all chat systems
   */
  async listAllSessions(): Promise<ClaudeSession[]> {
    const sessions: ClaudeSession[] = [];

    // Get facilitator sessions
    const facilitatorSessions = await this.getFacilitatorSessions();
    sessions.push(...facilitatorSessions);

    // Get chat room sessions
    const chatRoomSessions = await this.getChatRoomSessions();
    sessions.push(...chatRoomSessions);

    // Get idea agent sessions
    const ideaAgentSessions = await this.getIdeaAgentSessions();
    sessions.push(...ideaAgentSessions);

    // Get plan agent sessions
    const planAgentSessions = await this.getPlanAgentSessions();
    sessions.push(...planAgentSessions);

    // Get import agent sessions
    const importAgentSessions = await this.getImportAgentSessions();
    sessions.push(...importAgentSessions);

    // Sort by last activity (newest first)
    sessions.sort((a, b) => b.lastActivity - a.lastActivity);

    return sessions;
  }

  /**
   * Get messages for a specific session
   */
  async getSessionMessages(
    type: SessionType,
    sessionId: string,
    limit: number = 100
  ): Promise<SessionMessage[]> {
    switch (type) {
      case 'facilitator':
        return this.getFacilitatorMessages(sessionId, limit);
      case 'chatroom':
        return this.getChatRoomMessages(sessionId, limit);
      case 'ideaagent':
        return this.getIdeaAgentMessages(sessionId, limit);
      case 'planagent':
        return this.getPlanAgentMessages(sessionId, limit);
      case 'importagent':
        return this.getImportAgentMessages(sessionId, limit);
      default:
        return [];
    }
  }

  // ========== Private: Facilitator ===========

  private async getFacilitatorSessions(): Promise<ClaudeSession[]> {
    const sessions: ClaudeSession[] = [];

    try {
      const files = await fs.readdir(FACILITATOR_DIR);
      const metaFiles = files.filter((f) => f.endsWith('.meta.json'));

      for (const file of metaFiles) {
        try {
          const metaPath = path.join(FACILITATOR_DIR, file);
          const content = await fs.readFile(metaPath, 'utf-8');
          const metadata: FacilitatorChatMetadata = JSON.parse(content);

          sessions.push({
            id: metadata.userId,
            type: 'facilitator',
            name: `User: ${metadata.userId}`,
            messageCount: metadata.messageCount,
            lastActivity: new Date(metadata.lastUpdated).getTime(),
            metadata: {
              userId: metadata.userId,
            },
          });
        } catch {
          // Skip invalid files
        }
      }
    } catch {
      // Directory might not exist yet
    }

    return sessions;
  }

  private async getFacilitatorMessages(userId: string, limit: number): Promise<SessionMessage[]> {
    const messages: SessionMessage[] = [];
    const diagnostics = this.getFacilitatorDiagnostics();
    const diagnosticsMap = new Map(diagnostics.map((d) => [d.messageId, d]));

    try {
      const messagesPath = path.join(FACILITATOR_DIR, `${userId}.messages.jsonl`);
      const content = await fs.readFile(messagesPath, 'utf-8');
      const lines = content.trim().split('\n').filter((line) => line.length > 0);

      for (const line of lines.slice(-limit)) {
        try {
          const msg: FacilitatorMessage = JSON.parse(line);
          const diag = diagnosticsMap.get(msg.id);

          messages.push({
            id: msg.id,
            sessionId: userId,
            sessionType: 'facilitator',
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
            toolCalls: msg.toolCalls,
            diagnostics: diag
              ? {
                  iterations: diag.iterations,
                  durationMs: diag.durationMs,
                  responseLength: diag.responseLength,
                  error: diag.error,
                  // Enhanced diagnostics (P0)
                  systemPrompt: diag.systemPrompt,
                  model: diag.model,
                  tokenUsage: diag.tokenUsage,
                  // Full diagnostics with raw SDK events
                  rawEvents: diag.rawEvents,
                  sessionInfo: diag.sessionInfo,
                  totalCostUsd: diag.totalCostUsd,
                }
              : undefined,
          });
        } catch {
          // Skip invalid lines
        }
      }
    } catch {
      // File might not exist
    }

    return messages;
  }

  // ========== Private: Chat Rooms ===========

  private async getChatRoomSessions(): Promise<ClaudeSession[]> {
    const sessions: ClaudeSession[] = [];

    try {
      const files = await fs.readdir(CHATROOMS_DIR);
      const metaFiles = files.filter((f) => f.endsWith('.meta.json'));

      for (const file of metaFiles) {
        try {
          const metaPath = path.join(CHATROOMS_DIR, file);
          const content = await fs.readFile(metaPath, 'utf-8');
          const metadata: ChatRoomMetadata = JSON.parse(content);

          // Count messages
          const messageCount = await this.countChatRoomMessages(metadata.id);

          sessions.push({
            id: metadata.id,
            type: 'chatroom',
            name: metadata.name,
            messageCount,
            lastActivity: new Date(metadata.updatedAt).getTime(),
            metadata: {
              chatRoomId: metadata.id,
              workspaceId: metadata.workspaceId,
              participantCount: metadata.participantIds.length,
              ownerId: metadata.ownerId,
            },
          });
        } catch {
          // Skip invalid files
        }
      }
    } catch {
      // Directory might not exist yet
    }

    return sessions;
  }

  private async countChatRoomMessages(roomId: string): Promise<number> {
    try {
      const messagesPath = path.join(CHATROOMS_DIR, `${roomId}.messages.jsonl`);
      const content = await fs.readFile(messagesPath, 'utf-8');
      return content.trim().split('\n').filter((line) => line.length > 0).length;
    } catch {
      return 0;
    }
  }

  private async getChatRoomMessages(roomId: string, limit: number): Promise<SessionMessage[]> {
    const messages: SessionMessage[] = [];

    try {
      const messagesPath = path.join(CHATROOMS_DIR, `${roomId}.messages.jsonl`);
      const content = await fs.readFile(messagesPath, 'utf-8');
      const lines = content.trim().split('\n').filter((line) => line.length > 0);

      for (const line of lines.slice(-limit)) {
        try {
          const msg: ChatMessage = JSON.parse(line);

          messages.push({
            id: msg.id,
            sessionId: roomId,
            sessionType: 'chatroom',
            role: 'user', // Chat rooms are user messages
            content: msg.content,
            timestamp: new Date(msg.createdAt).getTime(),
            senderName: msg.senderName,
            senderColor: msg.senderColor,
          });
        } catch {
          // Skip invalid lines
        }
      }
    } catch {
      // File might not exist
    }

    return messages;
  }

  // ========== Private: Idea Agent ===========

  private async getIdeaAgentSessions(): Promise<ClaudeSession[]> {
    const sessions: ClaudeSession[] = [];

    try {
      const files = await fs.readdir(IDEA_AGENT_DIR);
      const metaFiles = files.filter((f) => f.endsWith('.meta.json'));

      for (const file of metaFiles) {
        try {
          const metaPath = path.join(IDEA_AGENT_DIR, file);
          const content = await fs.readFile(metaPath, 'utf-8');
          const metadata: IdeaAgentChatMetadata = JSON.parse(content);

          sessions.push({
            id: metadata.ideaId,
            type: 'ideaagent',
            name: `Idea: ${metadata.ideaId}`,
            messageCount: metadata.messageCount,
            lastActivity: new Date(metadata.lastUpdated).getTime(),
            metadata: {
              ideaId: metadata.ideaId,
            },
          });
        } catch {
          // Skip invalid files
        }
      }
    } catch {
      // Directory might not exist yet
    }

    return sessions;
  }

  private async getIdeaAgentMessages(ideaId: string, limit: number): Promise<SessionMessage[]> {
    const messages: SessionMessage[] = [];

    try {
      const messagesPath = path.join(IDEA_AGENT_DIR, `${ideaId}.messages.jsonl`);
      const content = await fs.readFile(messagesPath, 'utf-8');
      const lines = content.trim().split('\n').filter((line) => line.length > 0);

      for (const line of lines.slice(-limit)) {
        try {
          const msg: IdeaAgentMessage = JSON.parse(line);

          messages.push({
            id: msg.id,
            sessionId: ideaId,
            sessionType: 'ideaagent',
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
          });
        } catch {
          // Skip invalid lines
        }
      }
    } catch {
      // File might not exist
    }

    return messages;
  }

  // ========== Private: Plan Agent ===========

  private async getPlanAgentSessions(): Promise<ClaudeSession[]> {
    const sessions: ClaudeSession[] = [];

    try {
      const files = await fs.readdir(PLAN_AGENT_DIR);
      const metaFiles = files.filter((f) => f.endsWith('.meta.json'));

      for (const file of metaFiles) {
        try {
          const metaPath = path.join(PLAN_AGENT_DIR, file);
          const content = await fs.readFile(metaPath, 'utf-8');
          const metadata: PlanAgentChatMetadata = JSON.parse(content);

          sessions.push({
            id: metadata.ideaId,
            type: 'planagent',
            name: `Plan: ${metadata.ideaId}`,
            messageCount: metadata.messageCount,
            lastActivity: new Date(metadata.lastUpdated).getTime(),
            metadata: {
              ideaId: metadata.ideaId,
            },
          });
        } catch {
          // Skip invalid files
        }
      }
    } catch {
      // Directory might not exist yet
    }

    return sessions;
  }

  private async getPlanAgentMessages(ideaId: string, limit: number): Promise<SessionMessage[]> {
    const messages: SessionMessage[] = [];

    try {
      const messagesPath = path.join(PLAN_AGENT_DIR, `${ideaId}.messages.jsonl`);
      const content = await fs.readFile(messagesPath, 'utf-8');
      const lines = content.trim().split('\n').filter((line) => line.length > 0);

      for (const line of lines.slice(-limit)) {
        try {
          const msg: PlanAgentMessage = JSON.parse(line);

          messages.push({
            id: msg.id,
            sessionId: ideaId,
            sessionType: 'planagent',
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
          });
        } catch {
          // Skip invalid lines
        }
      }
    } catch {
      // File might not exist
    }

    return messages;
  }

  // ========== Private: Import Agent ===========

  private async getImportAgentSessions(): Promise<ClaudeSession[]> {
    const sessions: ClaudeSession[] = [];
    const importService = getImportAgentChatService();

    try {
      const sessionList = await importService.listSessions();

      for (const metadata of sessionList) {
        const sourceName = metadata.sourcePath.split('/').pop() || metadata.sourcePath;
        sessions.push({
          id: metadata.sessionId,
          type: 'importagent',
          name: `Import: ${sourceName}`,
          messageCount: metadata.messageCount,
          lastActivity: new Date(metadata.lastUpdated).getTime(),
          metadata: {
            userId: metadata.userId,
          },
        });
      }
    } catch {
      // Directory might not exist yet
    }

    return sessions;
  }

  private async getImportAgentMessages(sessionId: string, limit: number): Promise<SessionMessage[]> {
    const messages: SessionMessage[] = [];
    const importService = getImportAgentChatService();

    try {
      const msgList = await importService.getMessages(sessionId, limit);

      for (const msg of msgList) {
        messages.push({
          id: msg.id,
          sessionId: sessionId,
          sessionType: 'importagent',
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          diagnostics: msg.diagnostics
            ? {
                model: msg.diagnostics.model,
                tokenUsage: msg.diagnostics.tokenUsage,
                durationMs: msg.diagnostics.durationMs,
              }
            : undefined,
        });
      }
    } catch {
      // File might not exist
    }

    return messages;
  }

  // ========== Clear Sessions ===========

  /**
   * Clear all sessions or sessions of a specific type
   */
  async clearAllSessions(sessionType?: SessionType): Promise<void> {
    const clearDir = async (dir: string) => {
      try {
        const files = await fs.readdir(dir);
        for (const file of files) {
          if (file.endsWith('.meta.json') || file.endsWith('.messages.jsonl')) {
            await fs.unlink(path.join(dir, file));
          }
        }
      } catch {
        // Directory might not exist
      }
    };

    if (!sessionType || sessionType === 'facilitator') {
      await clearDir(FACILITATOR_DIR);
    }

    if (!sessionType || sessionType === 'chatroom') {
      await clearDir(CHATROOMS_DIR);
    }

    if (!sessionType || sessionType === 'ideaagent') {
      await clearDir(IDEA_AGENT_DIR);
    }

    if (!sessionType || sessionType === 'planagent') {
      await clearDir(PLAN_AGENT_DIR);
    }

    // Import agent sessions are managed by ImportAgentChatService
    // We don't clear them here as they may be in-memory only
  }
}
