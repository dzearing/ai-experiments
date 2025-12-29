import type { RawData } from 'ws';
import { WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import { ImportAgentService, type ImportRequest, type ImportStep } from '../services/ImportAgentService.js';
import type { ThingMetadata } from '../services/ThingService.js';

/**
 * Client message types for the import WebSocket protocol
 */
interface ClientMessage {
  type: 'start_import' | 'cancel';
  request?: ImportRequest;
}

/**
 * Server message types for the import WebSocket protocol
 */
interface ServerMessage {
  type: 'step_start' | 'step_update' | 'step_complete' | 'step_error' | 'complete' | 'error';
  step?: { id: string; label: string };
  stepId?: string;
  update?: { status?: ImportStep['status']; detail?: string };
  detail?: string;
  error?: string;
  createdThings?: ThingMetadata[];
}

/**
 * Represents a connected import client
 */
interface ImportClient {
  ws: WebSocket;
  userId: string;
  clientId: number;
  importService: ImportAgentService | null;
}

/**
 * WebSocket handler for import operations.
 * Manages connections and streams import progress to clients.
 */
export class ImportWebSocketHandler {
  private clients: Map<WebSocket, ImportClient> = new Map();
  private clientIdCounter = 0;

  /**
   * Handle a new WebSocket connection.
   * URL format: /import-ws?userId=xxx
   */
  handleConnection(ws: WebSocket, req: IncomingMessage): void {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const userId = url.searchParams.get('userId') || '';

    if (!userId) {
      ws.close(4000, 'User ID is required');
      return;
    }

    // Create client
    const clientId = this.clientIdCounter++;
    const client: ImportClient = {
      ws,
      userId,
      clientId,
      importService: null,
    };

    this.clients.set(ws, client);
    console.log(`[Import] Client ${clientId} connected`);

    // Set up WebSocket handlers
    ws.on('message', (data: RawData) => {
      this.handleMessage(client, data);
    });

    ws.on('close', () => {
      this.handleDisconnect(client);
    });

    ws.on('error', (error) => {
      console.error(`[Import] Client ${clientId} error:`, error);
      this.handleDisconnect(client);
    });
  }

  /**
   * Handle an incoming message from a client.
   */
  private async handleMessage(client: ImportClient, data: RawData): Promise<void> {
    try {
      const messageStr = data.toString();
      const clientMessage: ClientMessage = JSON.parse(messageStr);

      switch (clientMessage.type) {
        case 'start_import':
          await this.handleStartImport(client, clientMessage.request!);
          break;
        case 'cancel':
          this.handleCancel(client);
          break;
        default:
          console.warn(`[Import] Unknown message type: ${(clientMessage as ClientMessage).type}`);
      }
    } catch (error) {
      console.error('[Import] Error handling message:', error);
      this.send(client.ws, { type: 'error', error: 'Failed to process message' });
    }
  }

  /**
   * Handle a start import request from a client.
   */
  private async handleStartImport(client: ImportClient, request: ImportRequest): Promise<void> {
    // Cancel any existing import
    if (client.importService) {
      client.importService.cancel();
    }

    // Create new import service for this client
    client.importService = new ImportAgentService();

    console.log(`[Import] Client ${client.clientId} starting import:`, {
      sourceType: request.sourceType,
      targetThingId: request.targetThingId,
    });

    try {
      await client.importService.runImport(
        {
          ...request,
          userId: client.userId, // Use authenticated user ID
        },
        {
          onStepStart: (step) => {
            this.send(client.ws, {
              type: 'step_start',
              step,
            });
          },
          onStepUpdate: (stepId, update) => {
            this.send(client.ws, {
              type: 'step_update',
              stepId,
              update,
            });
          },
          onStepComplete: (stepId, detail) => {
            this.send(client.ws, {
              type: 'step_complete',
              stepId,
              detail,
            });
          },
          onStepError: (stepId, error) => {
            this.send(client.ws, {
              type: 'step_error',
              stepId,
              error,
            });
          },
          onComplete: (createdThings) => {
            this.send(client.ws, {
              type: 'complete',
              createdThings,
            });
            client.importService = null;
          },
          onError: (error) => {
            this.send(client.ws, {
              type: 'error',
              error,
            });
            client.importService = null;
          },
        }
      );
    } catch (error) {
      console.error('[Import] Error during import:', error);
      this.send(client.ws, { type: 'error', error: 'Import failed unexpectedly' });
      client.importService = null;
    }
  }

  /**
   * Handle a cancel request from a client.
   */
  private handleCancel(client: ImportClient): void {
    if (client.importService) {
      console.log(`[Import] Client ${client.clientId} cancelling import`);
      client.importService.cancel();
      client.importService = null;
    }
  }

  /**
   * Handle client disconnect.
   */
  private handleDisconnect(client: ImportClient): void {
    // Cancel any ongoing import
    if (client.importService) {
      client.importService.cancel();
    }

    this.clients.delete(client.ws);
    console.log(`[Import] Client ${client.clientId} disconnected`);
  }

  /**
   * Send a message to a WebSocket.
   */
  private send(ws: WebSocket, message: ServerMessage): void {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Get the total number of connected clients.
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Clean up all resources.
   */
  destroy(): void {
    for (const client of this.clients.values()) {
      if (client.importService) {
        client.importService.cancel();
      }
      client.ws.close();
    }
    this.clients.clear();
  }
}
