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

  /** Delay between batches when streaming (ms) */
  private static readonly STREAM_BATCH_DELAY = 50;

  /** Number of characters per batch when streaming */
  private static readonly STREAM_BATCH_SIZE = 20;

  /** Update cursor position every N batches (reduces awareness update frequency) */
  private static readonly CURSOR_UPDATE_INTERVAL = 5;

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

    const batchSize = IdeaAgentYjsClient.STREAM_BATCH_SIZE;
    const batchDelay = IdeaAgentYjsClient.STREAM_BATCH_DELAY;

    // Stream in batches to prevent overwhelming CodeMirror's view update system
    const cursorInterval = IdeaAgentYjsClient.CURSOR_UPDATE_INTERVAL;
    let batchCount = 0;

    for (let i = 0; i < content.length; i += batchSize) {
      // Get the next batch of characters
      const batch = content.slice(i, Math.min(i + batchSize, content.length));

      // Insert batch as a single operation
      session.text.insert(pos, batch);
      pos += batch.length;
      batchCount++;

      // Update cursor position only every N batches to reduce awareness update frequency
      // This prevents overwhelming yCollab's decoration system which can cause tile errors
      if (batchCount % cursorInterval === 0) {
        this.updateCursor(roomName, pos);
      }

      // Progress callback
      const charsInserted = Math.min(i + batchSize, content.length);
      onProgress?.(charsInserted, content.length);

      // Log progress every 200 chars (less frequent logging)
      if (charsInserted % 200 < batchSize) {
        console.log(`[IdeaAgentYjsClient] Streamed ${charsInserted}/${content.length} chars`);
      }

      // Delay between batches (not after last batch)
      if (i + batchSize < content.length) {
        await this.delay(batchDelay);
      }
    }

    // Final cursor update to ensure cursor is at correct end position
    this.updateCursor(roomName, pos);

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
   * Find text near an approximate position.
   * Searches in expanding rings around the hint position.
   */
  private findTextNearPosition(content: string, text: string, hintPosition: number): number {
    // First try exact position
    if (content.slice(hintPosition).startsWith(text)) {
      return hintPosition;
    }

    // Search in expanding rings: ±100, ±300, ±500, then full document
    const searchRanges = [100, 300, 500];
    for (const range of searchRanges) {
      const searchStart = Math.max(0, hintPosition - range);
      const searchEnd = Math.min(content.length, hintPosition + range);
      const searchRegion = content.slice(searchStart, searchEnd);
      const foundIndex = searchRegion.indexOf(text);
      if (foundIndex >= 0) {
        return searchStart + foundIndex;
      }
    }

    // Last resort: search entire document
    return content.indexOf(text);
  }

  /**
   * Apply a single text-anchored edit operation to the document.
   * Uses text strings to reliably find edit locations.
   * Shows cursor movement during the edit.
   */
  async applyEdit(roomName: string, edit: DocumentEdit): Promise<EditResult> {
    const session = await this.connect(roomName);
    const content = session.text.toString();

    try {
      switch (edit.action) {
        case 'replace': {
          // Find startText near the hint position
          const startIndex = this.findTextNearPosition(content, edit.startText, edit.start);
          if (startIndex < 0) {
            return {
              success: false,
              action: 'replace',
              error: `Start text not found: "${edit.startText.slice(0, 50)}..."`
            };
          }

          // Find endText after startText
          const searchAfterStart = content.slice(startIndex);
          const endTextIndex = searchAfterStart.indexOf(edit.endText);
          if (endTextIndex < 0) {
            return {
              success: false,
              action: 'replace',
              error: `End text not found after start: "${edit.endText.slice(0, 50)}..."`
            };
          }

          const replaceStart = startIndex;
          const replaceEnd = startIndex + endTextIndex + edit.endText.length;

          console.log(`[IdeaAgentYjsClient] Replace: found range ${replaceStart}-${replaceEnd} (hint: ${edit.start})`);

          // Show cursor at edit location
          this.updateCursor(roomName, replaceStart);
          await this.delay(50);

          // Delete old text and stream new text
          session.text.delete(replaceStart, replaceEnd - replaceStart);
          await this.streamContent(roomName, edit.text, replaceStart);
          return { success: true, action: 'replace' };
        }

        case 'insert': {
          // Find afterText near the hint position
          const afterIndex = this.findTextNearPosition(content, edit.afterText, edit.start);
          if (afterIndex < 0) {
            return {
              success: false,
              action: 'insert',
              error: `Anchor text not found: "${edit.afterText.slice(0, 50)}..."`
            };
          }

          // Insert position is right after the anchor text
          const insertPosition = afterIndex + edit.afterText.length;

          console.log(`[IdeaAgentYjsClient] Insert: position ${insertPosition} (after "${edit.afterText.slice(0, 30)}...")`);

          // Stream the inserted content
          await this.streamContent(roomName, edit.text, insertPosition);
          return { success: true, action: 'insert' };
        }

        case 'delete': {
          // Find startText near the hint position
          const startIndex = this.findTextNearPosition(content, edit.startText, edit.start);
          if (startIndex < 0) {
            return {
              success: false,
              action: 'delete',
              error: `Start text not found: "${edit.startText.slice(0, 50)}..."`
            };
          }

          // Find endText after startText
          const searchAfterStart = content.slice(startIndex);
          const endTextIndex = searchAfterStart.indexOf(edit.endText);
          if (endTextIndex < 0) {
            return {
              success: false,
              action: 'delete',
              error: `End text not found after start: "${edit.endText.slice(0, 50)}..."`
            };
          }

          const deleteStart = startIndex;
          const deleteEnd = startIndex + endTextIndex + edit.endText.length;

          console.log(`[IdeaAgentYjsClient] Delete: found range ${deleteStart}-${deleteEnd} (hint: ${edit.start})`);

          // Show cursor at delete location
          this.updateCursor(roomName, deleteStart);
          await this.delay(50);

          session.text.delete(deleteStart, deleteEnd - deleteStart);
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
   * Tracks position offsets as edits modify document length.
   * Each edit is applied with visible cursor movement.
   */
  async applyEdits(roomName: string, edits: DocumentEdit[]): Promise<EditResult[]> {
    const results: EditResult[] = [];
    let cumulativeOffset = 0; // Track how much the document has shifted

    for (const edit of edits) {
      // Adjust positions based on cumulative offset from previous edits
      const adjustedEdit = this.adjustEditPositions(edit, cumulativeOffset);

      const result = await this.applyEdit(roomName, adjustedEdit);
      results.push(result);

      // Update offset based on this edit's effect on document length
      if (result.success) {
        cumulativeOffset += this.calculateEditOffset(edit);
        await this.delay(100);
      }
    }

    // Clear cursor when done
    this.clearCursor(roomName);

    console.log(`[IdeaAgentYjsClient] Applied ${edits.length} edits to room "${roomName}"`);
    return results;
  }

  /**
   * Adjust edit start hint based on cumulative offset from previous edits.
   * With text-anchored edits, this only adjusts the approximate `start` hint.
   */
  private adjustEditPositions(edit: DocumentEdit, offset: number): DocumentEdit {
    if (offset === 0) return edit;
    // Only adjust the `start` hint - text anchors (startText, endText, afterText) are found dynamically
    return { ...edit, start: edit.start + offset };
  }

  /**
   * Calculate how much an edit changes the document length.
   * This is an estimate since we don't know exact matched text lengths.
   */
  private calculateEditOffset(edit: DocumentEdit): number {
    switch (edit.action) {
      case 'replace':
        // Approximate: assume replaced range is similar length to startText+endText
        // This is just a hint adjustment, so exactness isn't critical
        return edit.text.length - (edit.startText.length + edit.endText.length);
      case 'insert':
        // Inserted text length
        return edit.text.length;
      case 'delete':
        // Approximate deletion length
        return -(edit.startText.length + edit.endText.length);
      default:
        return 0;
    }
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
