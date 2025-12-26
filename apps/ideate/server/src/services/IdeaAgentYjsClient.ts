import * as Y from 'yjs';
import type { YjsCollaborationHandler } from '../websocket/YjsCollaborationHandler.js';
import type { DocumentEdit } from './IdeaAgentService.js';

/**
 * Agent user information for awareness display
 */
export interface AgentUser {
  name: string;
  color: string;
}

/**
 * Result of applying an edit operation
 */
export interface EditResult {
  success: boolean;
  action: string;
  error?: string;
}

/**
 * Active agent editing session
 */
interface AgentSession {
  roomName: string;
  clientId: number;
  text: Y.Text;
  doc: Y.Doc;
}

/**
 * Service for AI agents to edit Yjs documents.
 *
 * Provides a high-level API for:
 * - Connecting to Yjs rooms
 * - Streaming text edits with cursor awareness
 * - Replacing document content
 *
 * The agent appears as a coauthor with a visible cursor.
 */
export class IdeaAgentYjsClient {
  private yjsHandler: YjsCollaborationHandler;
  private sessions: Map<string, AgentSession> = new Map();

  /** Default agent user info */
  private static readonly AGENT_USER: AgentUser = {
    name: 'Idea Agent',
    color: '#8b5cf6', // Purple
  };

  /** Delay between characters when streaming (ms) */
  private static readonly STREAM_CHAR_DELAY = 10;

  constructor(yjsHandler: YjsCollaborationHandler) {
    this.yjsHandler = yjsHandler;
  }

  /**
   * Connect to a room and get a session for editing.
   * Creates the room if it doesn't exist.
   */
  async connect(roomName: string): Promise<AgentSession> {
    // Check if already connected
    let session = this.sessions.get(roomName);
    if (session) {
      return session;
    }

    // Get or create room
    const { doc, text, clientId } = await this.yjsHandler.getOrCreateRoomForAgent(roomName);

    session = {
      roomName,
      clientId,
      text,
      doc,
    };

    this.sessions.set(roomName, session);
    console.log(`[IdeaAgentYjsClient] Connected to room "${roomName}" with clientId ${clientId}`);

    return session;
  }

  /**
   * Disconnect from a room.
   */
  disconnect(roomName: string): void {
    const session = this.sessions.get(roomName);
    if (!session) return;

    // Remove awareness
    this.yjsHandler.removeAgentAwareness(roomName, session.clientId);

    this.sessions.delete(roomName);
    console.log(`[IdeaAgentYjsClient] Disconnected from room "${roomName}"`);
  }

  /**
   * Get the current document content.
   */
  getContent(roomName: string): string | null {
    const session = this.sessions.get(roomName);
    if (!session) return null;
    return session.text.toString();
  }

  /**
   * Replace the entire document content.
   * Useful for setting initial content or full rewrites.
   */
  async replaceContent(roomName: string, content: string): Promise<void> {
    const session = await this.connect(roomName);

    session.doc.transact(() => {
      session.text.delete(0, session.text.length);
      session.text.insert(0, content);
    });

    console.log(`[IdeaAgentYjsClient] Replaced content in room "${roomName}" (${content.length} chars)`);
  }

  /**
   * Stream text to the document character by character.
   * Shows the agent cursor moving as it types.
   *
   * @param roomName - The room to edit
   * @param content - The content to stream
   * @param position - Starting position (default: end of document)
   * @param onProgress - Optional callback for progress updates
   */
  async streamContent(
    roomName: string,
    content: string,
    position?: number,
    onProgress?: (charIndex: number, totalChars: number) => void
  ): Promise<void> {
    const session = await this.connect(roomName);

    // Default to end of document
    let pos = position ?? session.text.length;

    // Set initial cursor position
    this.updateCursor(roomName, pos);

    // Log start of streaming
    console.log(`[IdeaAgentYjsClient] Starting to stream ${content.length} chars to room "${roomName}"`);

    // Stream each character
    for (let i = 0; i < content.length; i++) {
      const char = content[i];

      // Insert character
      session.text.insert(pos, char);
      pos++;

      // Update cursor position
      this.updateCursor(roomName, pos);

      // Progress callback
      onProgress?.(i + 1, content.length);

      // Log progress every 100 chars
      if ((i + 1) % 100 === 0) {
        console.log(`[IdeaAgentYjsClient] Streamed ${i + 1}/${content.length} chars`);
      }

      // Small delay for visual effect (not too slow)
      if (i < content.length - 1) {
        await this.delay(IdeaAgentYjsClient.STREAM_CHAR_DELAY);
      }
    }

    console.log(`[IdeaAgentYjsClient] Streamed ${content.length} chars to room "${roomName}"`);
  }

  /**
   * Stream a full document replacement with visible cursor.
   * First clears, then streams new content.
   */
  async streamReplaceContent(
    roomName: string,
    content: string,
    onProgress?: (charIndex: number, totalChars: number) => void
  ): Promise<void> {
    const session = await this.connect(roomName);

    // Clear existing content
    session.text.delete(0, session.text.length);

    // Stream new content from beginning
    await this.streamContent(roomName, content, 0, onProgress);
  }

  /**
   * Update the agent's cursor position.
   * Converts absolute position to Yjs relative position for proper yCollab cursor display.
   */
  updateCursor(roomName: string, position: number): void {
    const session = this.sessions.get(roomName);
    if (!session) return;

    // Convert absolute position to relative position for yCollab compatibility
    // yCollab expects RelativePosition objects, not raw integer positions
    const relativePos = Y.createRelativePositionFromTypeIndex(session.text, position);

    this.yjsHandler.setAgentAwareness(
      roomName,
      session.clientId,
      IdeaAgentYjsClient.AGENT_USER,
      { anchor: relativePos, head: relativePos }
    );
  }

  /**
   * Clear the agent's cursor (hide it).
   */
  clearCursor(roomName: string): void {
    const session = this.sessions.get(roomName);
    if (!session) return;

    // Set awareness without cursor
    this.yjsHandler.setAgentAwareness(
      roomName,
      session.clientId,
      IdeaAgentYjsClient.AGENT_USER
    );
  }

  /**
   * Apply a single position-based edit operation to the document.
   * Validates expected content before applying for safety.
   * Shows cursor movement during the edit.
   */
  async applyEdit(roomName: string, edit: DocumentEdit): Promise<EditResult> {
    const session = await this.connect(roomName);
    const content = session.text.toString();

    try {
      switch (edit.action) {
        case 'replace': {
          // Validate position bounds
          if (edit.start < 0 || edit.end > content.length || edit.start > edit.end) {
            return {
              success: false,
              action: 'replace',
              error: `Invalid position: start=${edit.start}, end=${edit.end}, docLength=${content.length}`
            };
          }

          // Validate expected content matches
          const actualText = content.slice(edit.start, edit.end);
          if (edit.expected && actualText !== edit.expected) {
            return {
              success: false,
              action: 'replace',
              error: `Content mismatch at ${edit.start}-${edit.end}. Expected: "${edit.expected.slice(0, 30)}...", Found: "${actualText.slice(0, 30)}..."`
            };
          }

          // Show cursor at edit location
          this.updateCursor(roomName, edit.start);
          await this.delay(50);

          // Delete old text and stream new text
          session.text.delete(edit.start, edit.end - edit.start);
          await this.streamContent(roomName, edit.text, edit.start);
          return { success: true, action: 'replace' };
        }

        case 'insert': {
          // Validate position bounds
          if (edit.position < 0 || edit.position > content.length) {
            return {
              success: false,
              action: 'insert',
              error: `Invalid position: ${edit.position}, docLength=${content.length}`
            };
          }

          // Validate context if provided
          if (edit.before) {
            const beforeStart = Math.max(0, edit.position - edit.before.length);
            const actualBefore = content.slice(beforeStart, edit.position);
            if (!actualBefore.endsWith(edit.before) && actualBefore !== edit.before.slice(-actualBefore.length)) {
              return {
                success: false,
                action: 'insert',
                error: `Context mismatch before position ${edit.position}. Expected: "...${edit.before}", Found: "...${actualBefore}"`
              };
            }
          }
          if (edit.after) {
            const afterEnd = Math.min(content.length, edit.position + edit.after.length);
            const actualAfter = content.slice(edit.position, afterEnd);
            if (!actualAfter.startsWith(edit.after) && actualAfter !== edit.after.slice(0, actualAfter.length)) {
              return {
                success: false,
                action: 'insert',
                error: `Context mismatch after position ${edit.position}. Expected: "${edit.after}...", Found: "${actualAfter}..."`
              };
            }
          }

          // Stream the inserted content
          await this.streamContent(roomName, edit.text, edit.position);
          return { success: true, action: 'insert' };
        }

        case 'delete': {
          // Validate position bounds
          if (edit.start < 0 || edit.end > content.length || edit.start > edit.end) {
            return {
              success: false,
              action: 'delete',
              error: `Invalid position: start=${edit.start}, end=${edit.end}, docLength=${content.length}`
            };
          }

          // Validate expected content matches
          const actualText = content.slice(edit.start, edit.end);
          if (edit.expected && actualText !== edit.expected) {
            return {
              success: false,
              action: 'delete',
              error: `Content mismatch at ${edit.start}-${edit.end}. Expected: "${edit.expected.slice(0, 30)}...", Found: "${actualText.slice(0, 30)}..."`
            };
          }

          // Show cursor at delete location
          this.updateCursor(roomName, edit.start);
          await this.delay(50);

          session.text.delete(edit.start, edit.end - edit.start);
          return { success: true, action: 'delete' };
        }

        default:
          return { success: false, action: 'unknown', error: `Unknown edit action` };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, action: edit.action, error: message };
    }
  }

  /**
   * Apply multiple edit operations in sequence.
   * Each edit is applied with visible cursor movement.
   */
  async applyEdits(roomName: string, edits: DocumentEdit[]): Promise<EditResult[]> {
    const results: EditResult[] = [];

    for (const edit of edits) {
      const result = await this.applyEdit(roomName, edit);
      results.push(result);

      // Small pause between edits for visual clarity
      if (result.success) {
        await this.delay(100);
      }
    }

    // Clear cursor when done
    this.clearCursor(roomName);

    console.log(`[IdeaAgentYjsClient] Applied ${edits.length} edits to room "${roomName}"`);
    return results;
  }

  /**
   * Disconnect from all rooms.
   */
  disconnectAll(): void {
    for (const roomName of this.sessions.keys()) {
      this.disconnect(roomName);
    }
  }

  /**
   * Helper to delay execution.
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
