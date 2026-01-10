import { Router, type Request, type Response } from 'express';
import { query, type SDKAssistantMessage } from '@anthropic-ai/claude-code';
import { IdeaService, type IdeaStatus } from '../services/IdeaService.js';
import { WorkspaceService } from '../services/WorkspaceService.js';
import { ChatRoomService } from '../services/ChatRoomService.js';
import { getGitRevisionService } from '../services/GitRevisionService.js';
import type { WorkspaceWebSocketHandler } from '../websocket/WorkspaceWebSocketHandler.js';
import type { IdeaAgentWebSocketHandler } from '../websocket/IdeaAgentWebSocketHandler.js';

const ideaService = new IdeaService();
const workspaceService = new WorkspaceService();
const chatRoomService = new ChatRoomService();

// Store the workspace handler reference for notifications
let workspaceWsHandler: WorkspaceWebSocketHandler | null = null;
// Store the idea agent handler reference for session linking
let ideaAgentWsHandler: IdeaAgentWebSocketHandler | null = null;

export function setIdeasWorkspaceHandler(handler: WorkspaceWebSocketHandler): void {
  workspaceWsHandler = handler;
}

export function setIdeasAgentHandler(handler: IdeaAgentWebSocketHandler): void {
  ideaAgentWsHandler = handler;
}

export const ideasRouter = Router();

// =========================================================================
// List & Read
// =========================================================================

// List ideas (optionally filter by workspaceId and status query params)
ideasRouter.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const workspaceId = req.query.workspaceId as string | undefined;
    const status = req.query.status as IdeaStatus | undefined;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    // If filtering by workspace, check if user has workspace access
    let isWorkspaceMember = false;
    if (workspaceId) {
      const workspace = await workspaceService.getWorkspace(workspaceId, userId);
      isWorkspaceMember = workspace !== null;
    }

    const ideas = await ideaService.listIdeas(userId, workspaceId, status, isWorkspaceMember);
    res.json(ideas);
  } catch (error) {
    console.error('[Ideas] List ideas error:', error);
    res.status(500).json({ error: 'Failed to list ideas' });
  }
});

// Get ideas grouped by lane (for kanban view)
ideasRouter.get('/by-lane', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const workspaceId = req.query.workspaceId as string | undefined;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    // If filtering by workspace, check if user has workspace access
    let isWorkspaceMember = false;
    if (workspaceId) {
      const workspace = await workspaceService.getWorkspace(workspaceId, userId);
      isWorkspaceMember = workspace !== null;
    }

    const ideasByLane = await ideaService.getIdeasByLane(userId, workspaceId, isWorkspaceMember);
    res.json(ideasByLane);
  } catch (error) {
    console.error('[Ideas] Get ideas by lane error:', error);
    res.status(500).json({ error: 'Failed to get ideas by lane' });
  }
});

// Get ideas by thing ID
ideasRouter.get('/by-thing/:thingId', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { thingId } = req.params;
    const workspaceId = req.query.workspaceId as string | undefined;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    // If filtering by workspace, check if user has workspace access
    let isWorkspaceMember = false;
    if (workspaceId) {
      const workspace = await workspaceService.getWorkspace(workspaceId, userId);
      isWorkspaceMember = workspace !== null;
    }

    const ideas = await ideaService.getIdeasByThingId(thingId, userId, workspaceId, isWorkspaceMember);
    res.json(ideas);
  } catch (error) {
    console.error('[Ideas] Get ideas by thing error:', error);
    res.status(500).json({ error: 'Failed to get ideas by thing' });
  }
});

// Get idea counts by thing ID
ideasRouter.get('/counts-by-thing/:thingId', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { thingId } = req.params;
    const workspaceId = req.query.workspaceId as string | undefined;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    // If filtering by workspace, check if user has workspace access
    let isWorkspaceMember = false;
    if (workspaceId) {
      const workspace = await workspaceService.getWorkspace(workspaceId, userId);
      isWorkspaceMember = workspace !== null;
    }

    const counts = await ideaService.getIdeaCountsByThingId(thingId, userId, workspaceId, isWorkspaceMember);
    res.json(counts);
  } catch (error) {
    console.error('[Ideas] Get idea counts by thing error:', error);
    res.status(500).json({ error: 'Failed to get idea counts by thing' });
  }
});

// Get single idea
ideasRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    // We don't know the workspace yet, so fetch without workspace member check
    // The service will check ownership
    const idea = await ideaService.getIdea(id, userId, false);

    if (!idea) {
      res.status(404).json({ error: 'Idea not found' });
      return;
    }

    res.json(idea);
  } catch (error) {
    console.error('[Ideas] Get idea error:', error);
    res.status(500).json({ error: 'Failed to get idea' });
  }
});

// =========================================================================
// Create & Update
// =========================================================================

// Create idea
ideasRouter.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { title, summary, tags, rating, source, workspaceId, thingIds, description, documentRoomName } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    if (!title || !summary) {
      res.status(400).json({ error: 'Title and summary are required' });
      return;
    }

    const idea = await ideaService.createIdea(userId, {
      title,
      summary,
      tags,
      rating,
      source,
      workspaceId,
      thingIds,
      description,
    });

    // If documentRoomName is provided, link the agent session to the real ideaId
    // This ensures the IdeaCard receives status updates for the correct ideaId
    if (documentRoomName && ideaAgentWsHandler) {
      const linked = ideaAgentWsHandler.getService().linkSessionToIdea(documentRoomName, idea.id, workspaceId);
      console.log(`[Ideas] Linked agent session ${documentRoomName} to idea ${idea.id}: ${linked}`);
    }

    // Notify workspace subscribers of new idea
    if (workspaceId && workspaceWsHandler) {
      workspaceWsHandler.notifyResourceCreated(workspaceId, idea.id, 'idea', idea);
    }

    res.status(201).json(idea);
  } catch (error) {
    console.error('[Ideas] Create idea error:', error);
    res.status(500).json({ error: 'Failed to create idea' });
  }
});

// Create idea from natural language (AI extracts structured data)
ideasRouter.post('/from-text', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { text, workspaceId } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      res.status(400).json({ error: 'Text is required' });
      return;
    }

    // Use Claude to extract structured idea data from natural language
    const extractionPrompt = `Extract structured idea information from the following text. Return ONLY valid JSON with no additional text.

Text: "${text.trim()}"

Extract and return a JSON object with these fields:
- title: A concise title (max 60 chars) capturing the main idea
- summary: A 1-2 sentence summary of what and why
- tags: Array of relevant category tags (lowercase, max 5 tags)

JSON:`;

    let extractedData: { title: string; summary: string; tags: string[] };

    try {
      // Query returns an async iterator - collect the full response
      const response = query({
        prompt: extractionPrompt,
        options: {
          maxTurns: 1,
          permissionMode: 'bypassPermissions',
        },
      });

      let responseText = '';
      for await (const message of response) {
        if (message.type === 'assistant') {
          const assistantMsg = message as SDKAssistantMessage;
          const msgContent = assistantMsg.message.content;
          if (Array.isArray(msgContent)) {
            for (const block of msgContent) {
              if (block.type === 'text') {
                responseText += block.text;
              }
            }
          }
        }
      }

      console.log('[Ideas] AI extraction response:', responseText);

      // Try to parse the JSON response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      extractedData = JSON.parse(jsonMatch[0]);

      // Validate and sanitize extracted data
      if (!extractedData.title || typeof extractedData.title !== 'string') {
        extractedData.title = text.slice(0, 60).trim();
      }
      if (!extractedData.summary || typeof extractedData.summary !== 'string') {
        extractedData.summary = text.slice(0, 200).trim();
      }
      if (!Array.isArray(extractedData.tags)) {
        extractedData.tags = [];
      }
      extractedData.tags = extractedData.tags
        .filter((t): t is string => typeof t === 'string')
        .slice(0, 5)
        .map((t) => t.toLowerCase().trim());

      console.log('[Ideas] Extracted data:', extractedData);
    } catch (parseError) {
      console.error('[Ideas] AI extraction failed, using fallback:', parseError);
      // Fallback: use the text directly
      extractedData = {
        title: text.slice(0, 60).trim(),
        summary: text.slice(0, 200).trim(),
        tags: [],
      };
    }

    // Create the idea with extracted data
    const idea = await ideaService.createIdea(userId, {
      title: extractedData.title,
      summary: extractedData.summary,
      tags: extractedData.tags,
      source: 'user',
      workspaceId,
      description: text.trim(), // Store original text as description
    });

    // Notify workspace subscribers of new idea
    if (workspaceId && workspaceWsHandler) {
      workspaceWsHandler.notifyResourceCreated(workspaceId, idea.id, 'idea', idea);
    }

    res.status(201).json(idea);
  } catch (error) {
    console.error('[Ideas] Create idea from text error:', error);
    res.status(500).json({ error: 'Failed to create idea' });
  }
});

// Update idea
ideasRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;
    const { title, summary, tags, description, workspaceId, thingIds } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    const idea = await ideaService.updateIdea(id, userId, {
      title,
      summary,
      tags,
      description,
      workspaceId,
      thingIds,
    });

    if (!idea) {
      res.status(404).json({ error: 'Idea not found' });
      return;
    }

    // Notify workspace subscribers of updated idea
    if (idea.workspaceId && workspaceWsHandler) {
      workspaceWsHandler.notifyResourceUpdated(idea.workspaceId, idea.id, 'idea', idea);
    }

    res.json(idea);
  } catch (error) {
    console.error('[Ideas] Update idea error:', error);
    res.status(500).json({ error: 'Failed to update idea' });
  }
});

// Delete idea
ideasRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    // Get idea metadata before deletion for notification
    const idea = await ideaService.getIdea(id, userId, false);
    const workspaceId = idea?.workspaceId;

    const success = await ideaService.deleteIdea(id, userId);

    if (!success) {
      res.status(404).json({ error: 'Idea not found' });
      return;
    }

    // Notify workspace subscribers of deleted idea
    if (workspaceId && workspaceWsHandler) {
      workspaceWsHandler.notifyResourceDeleted(workspaceId, id, 'idea');
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[Ideas] Delete idea error:', error);
    res.status(500).json({ error: 'Failed to delete idea' });
  }
});

// =========================================================================
// Status Management (Lane Movement)
// =========================================================================

// Move idea to new status (lane)
ideasRouter.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;
    const { status } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    if (!status || !['new', 'exploring', 'executing', 'archived'].includes(status)) {
      res.status(400).json({ error: 'Valid status is required (new, exploring, executing, archived)' });
      return;
    }

    // Get current idea to check if we're moving to executing
    const currentIdea = await ideaService.getIdeaInternal(id);
    if (!currentIdea) {
      res.status(404).json({ error: 'Idea not found' });
      return;
    }

    const previousStatus = currentIdea.status;
    const result = await ideaService.updateStatus(id, userId, status);

    if (!result) {
      res.status(404).json({ error: 'Idea not found or access denied' });
      return;
    }

    const { idea } = result;

    // If moving to 'executing' and idea has a workspaceId, create a chat room
    if (status === 'executing' && previousStatus !== 'executing' && idea.workspaceId) {
      const chatRoom = await chatRoomService.createChatRoom(
        userId,
        `Idea: ${idea.title}`,
        idea.workspaceId
      );

      // Update idea with chat room ID
      await ideaService.setChatRoomId(id, chatRoom.id);
      idea.execution = {
        ...idea.execution!,
        chatRoomId: chatRoom.id,
      };

      // Notify about new chat room
      if (workspaceWsHandler) {
        workspaceWsHandler.notifyResourceCreated(idea.workspaceId, chatRoom.id, 'chatroom', chatRoom);
      }
    }

    // Notify workspace subscribers of idea status change
    if (idea.workspaceId && workspaceWsHandler) {
      workspaceWsHandler.notifyResourceUpdated(idea.workspaceId, idea.id, 'idea', {
        ...idea,
        _updateType: 'status',
        _previousStatus: previousStatus,
      });
    }

    res.json(idea);
  } catch (error) {
    console.error('[Ideas] Update status error:', error);
    res.status(500).json({ error: 'Failed to update idea status' });
  }
});

// Update execution state
ideasRouter.patch('/:id/execution', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;
    const { progressPercent, waitingForFeedback } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    const idea = await ideaService.updateExecutionState(id, userId, {
      progressPercent,
      waitingForFeedback,
    });

    if (!idea) {
      res.status(404).json({ error: 'Idea not found or not in executing status' });
      return;
    }

    // Notify workspace subscribers
    if (idea.workspaceId && workspaceWsHandler) {
      workspaceWsHandler.notifyResourceUpdated(idea.workspaceId, idea.id, 'idea', {
        ...idea,
        _updateType: 'execution',
      });
    }

    res.json(idea);
  } catch (error) {
    console.error('[Ideas] Update execution state error:', error);
    res.status(500).json({ error: 'Failed to update execution state' });
  }
});

// Start execution of an idea (transition to executing status)
ideasRouter.post('/:id/execute', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    // Get the idea to check if it has a plan
    const idea = await ideaService.getIdea(id, userId, false);
    if (!idea) {
      res.status(404).json({ error: 'Idea not found' });
      return;
    }

    // Validate idea has a plan
    if (!idea.plan || !idea.plan.phases || idea.plan.phases.length === 0) {
      res.status(400).json({ error: 'Idea must have a plan with phases before executing' });
      return;
    }

    // Move to executing status if not already
    if (idea.status !== 'executing') {
      const result = await ideaService.updateStatus(id, userId, 'executing');
      if (!result) {
        res.status(500).json({ error: 'Failed to update status' });
        return;
      }
    }

    // Initialize execution state
    const firstPhaseId = idea.plan.phases[0].id;
    const execIdea = await ideaService.updateExecutionStateInternal(id, {
      startedAt: new Date().toISOString(),
      currentPhaseId: firstPhaseId,
      progressPercent: 0,
      waitingForFeedback: false,
    });

    if (!execIdea) {
      res.status(500).json({ error: 'Failed to initialize execution state' });
      return;
    }

    // Create chat room if workspace is set and not already created
    if (execIdea.workspaceId && !execIdea.execution?.chatRoomId) {
      const chatRoom = await chatRoomService.createChatRoom(
        userId,
        `Idea: ${execIdea.title}`,
        execIdea.workspaceId
      );

      await ideaService.setChatRoomId(id, chatRoom.id);
      execIdea.execution = {
        ...execIdea.execution!,
        chatRoomId: chatRoom.id,
      };

      if (workspaceWsHandler) {
        workspaceWsHandler.notifyResourceCreated(execIdea.workspaceId, chatRoom.id, 'chatroom', chatRoom);
      }
    }

    // Notify workspace subscribers
    if (execIdea.workspaceId && workspaceWsHandler) {
      workspaceWsHandler.notifyResourceUpdated(execIdea.workspaceId, execIdea.id, 'idea', {
        ...execIdea,
        _updateType: 'execution_started',
      });
    }

    res.json({
      success: true,
      idea: execIdea,
      firstPhaseId,
    });
  } catch (error) {
    console.error('[Ideas] Start execution error:', error);
    res.status(500).json({ error: 'Failed to start execution' });
  }
});

// =========================================================================
// Rating
// =========================================================================

// Update rating
ideasRouter.patch('/:id/rating', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;
    const { rating } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    if (!rating || ![1, 2, 3, 4].includes(rating)) {
      res.status(400).json({ error: 'Valid rating is required (1-4)' });
      return;
    }

    const idea = await ideaService.updateRating(id, userId, rating);

    if (!idea) {
      res.status(404).json({ error: 'Idea not found' });
      return;
    }

    // Notify workspace subscribers
    if (idea.workspaceId && workspaceWsHandler) {
      workspaceWsHandler.notifyResourceUpdated(idea.workspaceId, idea.id, 'idea', {
        ...idea,
        _updateType: 'rating',
      });
    }

    res.json(idea);
  } catch (error) {
    console.error('[Ideas] Update rating error:', error);
    res.status(500).json({ error: 'Failed to update rating' });
  }
});

// =========================================================================
// Attachments
// =========================================================================

// Add attachment (link)
ideasRouter.post('/:id/attachments', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;
    const { filename, mimeType, url } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    if (!filename || !mimeType) {
      res.status(400).json({ error: 'Filename and mimeType are required' });
      return;
    }

    const attachment = await ideaService.addAttachment(id, userId, {
      filename,
      mimeType,
      url,
    });

    if (!attachment) {
      res.status(404).json({ error: 'Idea not found' });
      return;
    }

    // Get updated idea for notification
    const idea = await ideaService.getIdea(id, userId, false);
    if (idea?.workspaceId && workspaceWsHandler) {
      workspaceWsHandler.notifyResourceUpdated(idea.workspaceId, idea.id, 'idea', {
        ...idea,
        _updateType: 'attachment',
      });
    }

    res.status(201).json(attachment);
  } catch (error) {
    console.error('[Ideas] Add attachment error:', error);
    res.status(500).json({ error: 'Failed to add attachment' });
  }
});

// Remove attachment
ideasRouter.delete('/:id/attachments/:attachmentId', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id, attachmentId } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    const success = await ideaService.removeAttachment(id, userId, attachmentId);

    if (!success) {
      res.status(404).json({ error: 'Attachment not found' });
      return;
    }

    // Get updated idea for notification
    const idea = await ideaService.getIdea(id, userId, false);
    if (idea?.workspaceId && workspaceWsHandler) {
      workspaceWsHandler.notifyResourceUpdated(idea.workspaceId, idea.id, 'idea', {
        ...idea,
        _updateType: 'attachment',
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[Ideas] Remove attachment error:', error);
    res.status(500).json({ error: 'Failed to remove attachment' });
  }
});

// Download attachment
ideasRouter.get('/:id/attachments/:attachmentId/download', async (req: Request, res: Response) => {
  try {
    const { id, attachmentId } = req.params;

    const filePath = await ideaService.getAttachmentPath(id, attachmentId);

    if (!filePath) {
      res.status(404).json({ error: 'Attachment not found' });
      return;
    }

    res.download(filePath);
  } catch (error) {
    console.error('[Ideas] Download attachment error:', error);
    res.status(500).json({ error: 'Failed to download attachment' });
  }
});

// =========================================================================
// Git Revisions (Activity Tab)
// =========================================================================

// List revisions for an idea's working directory
ideasRouter.get('/:id/revisions', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    const idea = await ideaService.getIdea(id, userId);
    if (!idea) {
      res.status(404).json({ error: 'Idea not found' });
      return;
    }

    const workingDirectory = idea.plan?.workingDirectory;
    if (!workingDirectory) {
      res.json({ revisions: [], message: 'No working directory set' });
      return;
    }

    const gitService = getGitRevisionService();
    const isGitRepo = await gitService.isGitRepository(workingDirectory);

    if (!isGitRepo) {
      res.json({ revisions: [], message: 'Working directory is not a git repository' });
      return;
    }

    const revisions = await gitService.listRevisions(workingDirectory, { limit });
    res.json({ revisions });
  } catch (error) {
    console.error('[Ideas] List revisions error:', error);
    res.status(500).json({ error: 'Failed to list revisions' });
  }
});

// Get files changed in a specific commit
ideasRouter.get('/:id/revisions/:commitHash/files', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id, commitHash } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    const idea = await ideaService.getIdea(id, userId);
    if (!idea) {
      res.status(404).json({ error: 'Idea not found' });
      return;
    }

    const workingDirectory = idea.plan?.workingDirectory;
    if (!workingDirectory) {
      res.status(400).json({ error: 'No working directory set' });
      return;
    }

    const gitService = getGitRevisionService();
    const files = await gitService.getCommitFiles(workingDirectory, commitHash);
    res.json({ files });
  } catch (error) {
    console.error('[Ideas] Get commit files error:', error);
    res.status(500).json({ error: 'Failed to get commit files' });
  }
});

// Get diff for a specific file in a commit
ideasRouter.get('/:id/revisions/:commitHash/diff', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id, commitHash } = req.params;
    const filePath = req.query.file as string;

    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    if (!filePath) {
      res.status(400).json({ error: 'File path required (use ?file=path/to/file)' });
      return;
    }

    const idea = await ideaService.getIdea(id, userId);
    if (!idea) {
      res.status(404).json({ error: 'Idea not found' });
      return;
    }

    const workingDirectory = idea.plan?.workingDirectory;
    if (!workingDirectory) {
      res.status(400).json({ error: 'No working directory set' });
      return;
    }

    const gitService = getGitRevisionService();
    const diff = await gitService.getFileDiff(workingDirectory, commitHash, filePath);
    res.json({ diff });
  } catch (error) {
    console.error('[Ideas] Get file diff error:', error);
    res.status(500).json({ error: 'Failed to get file diff' });
  }
});
