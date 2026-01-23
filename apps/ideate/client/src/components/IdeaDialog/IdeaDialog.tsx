import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Slide, Button, IconButton, SplitPane, Spinner, Checkbox } from '@ui-kit/react';
import { CloseIcon } from '@ui-kit/icons/CloseIcon';
import { MaximizeIcon } from '@ui-kit/icons/MaximizeIcon';
import { TrashIcon } from '@ui-kit/icons/TrashIcon';
import { ArrowRightIcon } from '@ui-kit/icons/ArrowRightIcon';
import { PlayIcon } from '@ui-kit/icons/PlayIcon';
import { PauseIcon } from '@ui-kit/icons/PauseIcon';
import { FileIcon } from '@ui-kit/icons/FileIcon';
import { ListIcon } from '@ui-kit/icons/ListIcon';
import { EditIcon } from '@ui-kit/icons/EditIcon';
import { ChatLayout, OpenQuestionsResolver, type ChatInputSubmitData, type ChatInputRef, type ChatPanelMessage, type QueuedMessage, type TopicReference as ChatTopicReference, type ChatMessagePart } from '@ui-kit/react-chat';
import { MarkdownCoEditor, type ViewMode, type CoAuthor } from '@ui-kit/react-markdown';
import { ItemPickerDialog, DiskItemProvider } from '@ui-kit/react-pickers';
import { useResource } from '@claude-flow/data-bus/react';
import { dataBus, ideaPath, ideaAgentStatusPath } from '../../dataBus';
import { useAuth } from '../../contexts/AuthContext';
import { useIdeas } from '../../contexts/IdeasContext';
import { useTopics } from '../../contexts/TopicsContext';
import { useIdeaAgent, type IdeaContext } from '../../hooks/useIdeaAgent';
import { usePlanAgent, type PlanIdeaContext, type ParentTopicContext } from '../../hooks/usePlanAgent';
import { useExecutionAgent, type ExecutionIdeaContext } from '../../hooks/useExecutionAgent';
import { useYjsCollaboration } from '../../hooks/useYjsCollaboration';
import { useChatCommands } from '../../hooks/useChatCommands';
import { useModelPreference } from '../../hooks/useModelPreference';
import { useActivityRevisions } from '../../hooks/useActivityRevisions';
import { PlanView } from '../PlanView';
import { ActivityView } from '../ActivityView';
import { ClockIcon } from '@ui-kit/icons/ClockIcon';
import { YJS_WS_URL } from '../../config';
import { createLogger } from '../../utils/clientLogger';
import type { Idea, CreateIdeaInput, IdeaPlan } from '../../types/idea';
import { TOPIC_TYPE_SCHEMAS } from '../../types/topic';
import styles from './IdeaDialog.module.css';

// Create logger for this component
const log = createLogger('IdeaDialog');

// Debug: track component mount/unmount
let overlayInstanceId = 0;

// Generate a unique session ID for new ideas
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Strip structured event XML blocks from message content.
 * These are parsed separately for task/phase updates and shouldn't appear in chat.
 */
function stripStructuredEvents(text: string | undefined): string {
  if (!text) return '';

  return text
    .replace(/<task_complete>\s*[\s\S]*?\s*<\/task_complete>/g, '')
    .replace(/<phase_complete>\s*[\s\S]*?\s*<\/phase_complete>/g, '')
    .replace(/<execution_blocked>\s*[\s\S]*?\s*<\/execution_blocked>/g, '')
    .replace(/<new_idea>\s*[\s\S]*?\s*<\/new_idea>/g, '')
    .replace(/<task_update>\s*[\s\S]*?\s*<\/task_update>/g, '')
    .replace(/<open_questions>\s*[\s\S]*?\s*<\/open_questions>/g, '')
    .replace(/<idea_update>\s*[\s\S]*?\s*<\/idea_update>/g, '')
    .replace(/<suggested_responses>\s*[\s\S]*?\s*<\/suggested_responses>/g, '')
    .replace(/```xml\s*```/g, '') // Clean up empty xml code blocks
    .replace(/\n{3,}/g, '\n\n') // Collapse multiple newlines
    .trim();
}

/**
 * Build markdown content from idea fields
 */
function buildMarkdownContent(title: string, summary: string, tags: string[], description?: string): string {
  const parts: string[] = [];

  // Title as H1
  parts.push(`# ${title || 'Untitled Idea'}`);
  parts.push('');

  // Summary as H2
  parts.push('## Summary');
  parts.push(summary || '_Add a brief summary of your idea..._');
  parts.push('');

  // Tags
  if (tags.length > 0) {
    parts.push(`Tags: ${tags.join(', ')}`);
  } else {
    parts.push('Tags: _none_');
  }
  parts.push('');

  // Separator and description
  parts.push('---');
  parts.push('');
  parts.push(description || '_Describe your idea in detail..._');

  return parts.join('\n');
}

/**
 * Parse markdown content to extract idea fields
 */
function parseMarkdownContent(content: string): {
  title: string;
  summary: string;
  tags: string[];
  description: string;
} {
  const lines = content.split('\n');
  let title = '';
  let summary = '';
  let tags: string[] = [];
  let description = '';

  let inSummary = false;
  let inDescription = false;
  const summaryLines: string[] = [];
  const descriptionLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Extract title from H1
    if (line.startsWith('# ') && !title) {
      title = line.slice(2).trim();
      continue;
    }

    // Start of summary section
    if (line.startsWith('## Summary')) {
      inSummary = true;
      inDescription = false;
      continue;
    }

    // Extract tags
    if (line.startsWith('Tags:')) {
      inSummary = false;
      const tagStr = line.slice(5).trim();
      if (tagStr && tagStr !== '_none_') {
        tags = tagStr.split(',').map(t => t.trim()).filter(t => t && !t.startsWith('_'));
      }
      continue;
    }

    // Separator marks start of description
    if (line === '---') {
      inSummary = false;
      inDescription = true;
      continue;
    }

    // Collect summary lines
    if (inSummary) {
      summaryLines.push(line);
    }

    // Collect description lines
    if (inDescription) {
      descriptionLines.push(line);
    }
  }

  summary = summaryLines.join('\n').trim();
  // Remove placeholder text
  if (summary.startsWith('_') && summary.endsWith('_')) {
    summary = '';
  }

  description = descriptionLines.join('\n').trim();
  // Remove placeholder text
  if (description.startsWith('_') && description.endsWith('_')) {
    description = '';
  }

  return { title, summary, tags, description };
}

/** Topic context for contextual greetings */
export interface TopicContext {
  id: string;
  name: string;
  type: string;
  description?: string;
  /** Local file system path if this is a local folder/repo/package */
  localPath?: string;
}

/** Workspace phases */
export type WorkspacePhase = 'ideation' | 'planning' | 'executing';

/** Resource tabs for the workspace */
export type ResourceTab = 'idea-doc' | 'impl-plan' | 'exec-plan' | 'activity';

export interface IdeaDialogProps {
  /** Idea to edit (null for creating a new idea) */
  idea: Idea | null;
  /** Whether the overlay is open */
  open: boolean;
  /** Callback when the overlay should close */
  onClose: () => void;
  /** Workspace ID for new ideas */
  workspaceId?: string;
  /** Callback when idea is created or updated */
  onSuccess?: (idea: Idea) => void;
  /** Topic IDs to pre-link when creating a new idea */
  initialTopicIds?: string[];
  /** Topic context for contextual greetings when creating ideas for a Topic */
  initialTopicContext?: TopicContext;
  /** Callback when idea status changes (e.g., moves to planning) - for kanban updates */
  onStatusChange?: (idea: Idea, newStatus: string) => void;
  /** Initial title for the new idea (shown immediately in the card while agent processes) */
  initialTitle?: string;
  /** Initial prompt to automatically send to the idea agent when creating a new idea */
  initialPrompt?: string;
  /** Initial greeting from the agent (overrides the generated greeting) */
  initialGreeting?: string;
  /** Initial phase when opening an existing idea */
  initialPhase?: WorkspacePhase;
  /** Callback when user wants to start execution with a plan */
  onStartExecution?: (plan: IdeaPlan) => void;
  /** Callback when idea is created immediately (for background processing tracking) - doesn't close dialog */
  onIdeaCreated?: (idea: Idea) => void;
  /** Callback when user clicks maximize - navigates to full page view */
  onMaximize?: (ideaId: string) => void;
}

/**
 * IdeaDialog component
 *
 * A large overlay for creating and editing ideas with:
 * - Left pane: Document editor (title, summary, description, tags)
 * - Right pane: Chat with the Idea Agent for brainstorming
 */
export function IdeaDialog({
  idea,
  open,
  onClose,
  workspaceId,
  onSuccess,
  initialTopicIds,
  initialTopicContext,
  onStatusChange,
  initialTitle,
  initialPrompt,
  initialGreeting,
  initialPhase,
  onStartExecution,
  onIdeaCreated,
  onMaximize,
}: IdeaDialogProps) {
  // Debug: track this instance
  const instanceIdRef = useRef(++overlayInstanceId);
  useEffect(() => {
    log.log(`#${instanceIdRef.current} MOUNTED, idea=${idea?.id || 'new'}, open=${open}`);
    return () => {
      log.log(`#${instanceIdRef.current} UNMOUNTED`);
    };
  }, []); // Only run on mount/unmount

  const { user } = useAuth();
  const { createIdea, updateIdea, moveIdea } = useIdeas();
  const { topics, getTopicReferences, getAncestors } = useTopics();
  const { modelId, setModelId, modelInfo } = useModelPreference();

  const isNewIdea = !idea;

  // Get linked topics for display
  const linkedTopics = useMemo(() => {
    // For new ideas, use initialTopicIds; for existing ideas, use idea.topicIds
    const topicIds = idea?.topicIds || initialTopicIds || [];
    if (topicIds.length === 0) return [];
    return topics.filter(t => topicIds.includes(t.id));
  }, [idea?.topicIds, initialTopicIds, topics]);

  // Get parent topics with execution context (folders, repos with localPath)
  // This traverses the topic hierarchy to find ancestors that can provide working directories
  const parentTopicsWithContext: ParentTopicContext[] = useMemo(() => {
    const contexts: ParentTopicContext[] = [];
    const seenIds = new Set<string>();

    // Check each linked topic and its ancestors for execution context
    for (const topic of linkedTopics) {
      // First check the topic itself
      const schema = TOPIC_TYPE_SCHEMAS[topic.type];
      if (schema?.providesExecutionContext && topic.properties?.localPath && !seenIds.has(topic.id)) {
        seenIds.add(topic.id);
        contexts.push({
          id: topic.id,
          name: topic.name,
          type: topic.type,
          localPath: topic.properties?.localPath,
        });
      }

      // Then traverse ancestors to find folders/repos with localPath
      const ancestors = getAncestors(topic.id);
      for (const ancestor of ancestors) {
        if (seenIds.has(ancestor.id)) continue;

        const ancestorSchema = TOPIC_TYPE_SCHEMAS[ancestor.type];
        if (ancestorSchema?.providesExecutionContext && ancestor.properties?.localPath) {
          seenIds.add(ancestor.id);
          contexts.push({
            id: ancestor.id,
            name: ancestor.name,
            type: ancestor.type,
            localPath: ancestor.properties?.localPath,
          });
        }
      }
    }

    return contexts;
  }, [linkedTopics, getAncestors]);

  // Get topic references for chat autocomplete (^ mentions)
  const topicReferences = getTopicReferences();

  // Workspace phase - determines if we're in ideation, planning, or executing mode
  // For new ideas, always start in ideation
  // For existing ideas, check the idea status or use initialPhase
  const [phase, setPhase] = useState<WorkspacePhase>(() => {
    if (!idea) return 'ideation';
    if (initialPhase) return initialPhase;
    // Map idea status to workspace phase
    if (idea.status === 'executing') return 'executing';
    if (idea.status === 'exploring') return 'planning';
    return 'ideation';
  });

  // Track the current idea (may be created during ideation phase)
  const [currentIdea, setCurrentIdea] = useState<Idea | null>(idea);

  // Subscribe to real-time agent status updates via data bus
  const ideaId = currentIdea?.id || idea?.id;
  const { data: realtimeAgentStatus } = useResource(
    dataBus,
    ideaId ? ideaAgentStatusPath(ideaId) : null
  );

  // Subscribe to real-time idea metadata updates via data bus
  const { data: realtimeIdeaMetadata } = useResource(
    dataBus,
    ideaId ? ideaPath(ideaId) : null
  );

  // Agent is running if real-time status says so (from background processing)
  const isAgentRunning = realtimeAgentStatus?.status === 'running';

  // Sync idea prop to currentIdea when overlay opens or idea changes
  // This is critical for plan persistence - useState only runs on first render,
  // so when overlay reopens with updated idea (containing plan), we need to sync it
  useEffect(() => {
    if (open && idea) {
      log.log('Syncing idea prop to currentIdea', { ideaId: idea.id, planPhases: idea.plan?.phases?.length || 0 });
      setCurrentIdea(idea);
    }
  }, [open, idea]);

  // Sync phase when overlay opens based on idea status
  // This ensures we go directly to the right phase when reopening an idea
  useEffect(() => {
    if (open && idea?.status === 'executing') {
      log.log(' Syncing phase to executing for executing idea');
      setPhase('executing');
    } else if (open && idea?.status === 'exploring') {
      log.log(' Syncing phase to planning for exploring idea');
      setPhase('planning');
    }
  }, [open, idea?.status]);

  // Sync real-time metadata updates from background processing to currentIdea
  // This handles the case where the agent updates the idea while the dialog is open
  // but the user is not actively editing the document
  useEffect(() => {
    if (!realtimeIdeaMetadata || !currentIdea) return;

    // Check if metadata has changed compared to currentIdea
    const hasMetadataChange =
      realtimeIdeaMetadata.title !== currentIdea.title ||
      realtimeIdeaMetadata.summary !== currentIdea.summary ||
      JSON.stringify(realtimeIdeaMetadata.tags) !== JSON.stringify(currentIdea.tags);

    if (hasMetadataChange) {
      log.log(' Syncing real-time metadata update:', realtimeIdeaMetadata.title);
      setCurrentIdea(prev => prev ? {
        ...prev,
        title: realtimeIdeaMetadata.title,
        summary: realtimeIdeaMetadata.summary,
        tags: realtimeIdeaMetadata.tags,
        description: realtimeIdeaMetadata.description,
      } : prev);
    }
  }, [realtimeIdeaMetadata, currentIdea]);

  // Resource tab state - which document/asset is being viewed
  const [activeTab, setActiveTab] = useState<ResourceTab>('idea-doc');

  // Plan state - tracks the implementation plan from the Plan Agent
  const [plan, setPlan] = useState<Partial<IdeaPlan> | null>(null);

  // Sync initial plan from idea when overlay opens
  // This ensures tasks are displayed when reopening an idea with an existing plan
  // Check both the phase state AND the idea status to handle the case where
  // phase state hasn't been updated yet from the status sync effect
  useEffect(() => {
    const initialPlan = currentIdea?.plan || idea?.plan;
    const ideaStatus = currentIdea?.status || idea?.status;
    const shouldLoadPlan = phase === 'planning' || phase === 'executing' ||
      ideaStatus === 'exploring' || ideaStatus === 'executing';
    if (open && shouldLoadPlan && initialPlan?.phases && initialPlan.phases.length > 0) {
      log.log('Syncing initial plan to local state', { phases: initialPlan.phases.length });
      setPlan(initialPlan);
    }
  }, [open, phase, currentIdea?.plan, idea?.plan, currentIdea?.status, idea?.status]);

  // Session ID for new ideas - stable per component instance
  // Content is cleared on close instead of creating a new room
  const [sessionId] = useState(() => generateSessionId());

  // Document ID for Yjs room: idea-doc-{ideaId} or idea-doc-new-{sessionId}
  // Use currentIdea?.id to support transitioning from new idea to saved idea
  const documentId = useMemo(() => {
    const id = currentIdea?.id || idea?.id;
    return id ? `idea-doc-${id}` : `idea-doc-new-${sessionId}`;
  }, [currentIdea?.id, idea?.id, sessionId]);

  // Document content state (markdown with title, summary, tags, description)
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [isInitialized, setIsInitialized] = useState(false);

  // Track document content to migrate when room changes (new idea -> saved idea)
  // Using state (not ref) so we can properly react to changes
  const [pendingContentMigration, setPendingContentMigration] = useState<string | null>(null);
  // Track the previous documentId to detect room changes
  const prevDocumentIdRef = useRef<string | null>(null);

  const [isBackdropVisible, setIsBackdropVisible] = useState(open);
  const [queuedMessages, setQueuedMessages] = useState<QueuedMessage[]>([]);
  // Use ref for content to avoid re-renders on every keystroke
  const inputContentRef = useRef('');
  const isProcessingQueueRef = useRef(false);
  const chatInputRef = useRef<ChatInputRef>(null);

  // Memoized handler for local editor changes
  // Using a stable callback prevents extension reconfiguration on every render
  const handleEditorChange = useCallback((newContent: string) => {
    setContent(newContent);
  }, []);

  // User color for Yjs awareness
  const userColor = useMemo(() => {
    // Generate a consistent color from user ID
    const hash = (user?.id || 'anon').split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 50%)`;
  }, [user?.id]);

  // Yjs collaboration for real-time document editing
  const {
    extensions: yjsExtensions,
    coAuthors: yjsCoAuthors,
    setContent: yjsSetContent,
    isSynced: isYjsSynced,
  } = useYjsCollaboration({
    documentId,
    serverUrl: YJS_WS_URL,
    localUser: {
      name: user?.name || 'Anonymous',
      color: userColor,
    },
    onChange: (newContent) => {
      setContent(newContent);
    },
    // Disable IndexedDB persistence when connected to server to prevent stale data conflicts
    enableOfflinePersistence: false,
  });

  // Convert Yjs co-authors to MarkdownCoEditor format
  const coAuthors: CoAuthor[] = useMemo(() => {
    return yjsCoAuthors
      .filter(author => author.cursor) // Only include authors with cursor positions
      .map(author => ({
        id: String(author.clientId),
        name: author.name,
        color: author.color,
        selectionStart: author.cursor!.anchor,
        selectionEnd: author.cursor!.head,
        isAI: author.name === 'Idea Agent',
      }));
  }, [yjsCoAuthors]);

  // Implementation Plan document ID for Yjs room: impl-plan-{ideaId}
  const implPlanDocumentId = useMemo(() => {
    const id = (currentIdea?.id || idea?.id) ? `impl-plan-${currentIdea?.id || idea?.id}` : null;
    log.log('implPlanDocumentId computed', { id, currentIdeaId: currentIdea?.id, ideaId: idea?.id, phase });
    return id;
  }, [currentIdea?.id, idea?.id, phase]);

  // Implementation Plan content state
  const [implPlanContent, setImplPlanContent] = useState('');
  const [implPlanViewMode, setImplPlanViewMode] = useState<ViewMode>('preview');

  // Yjs collaboration for Implementation Plan (in planning or executing phase)
  // During executing phase, user may want to view/reference the design document
  const implPlanServerUrl = (phase === 'planning' || phase === 'executing') && implPlanDocumentId ? YJS_WS_URL : undefined;

  const {
    extensions: implPlanYjsExtensions,
    coAuthors: implPlanYjsCoAuthors,
    setContent: _implPlanYjsSetContent,
    isSynced: isImplPlanYjsSynced,
  } = useYjsCollaboration({
    documentId: implPlanDocumentId || 'disabled',
    serverUrl: implPlanServerUrl,
    localUser: {
      name: user?.name || 'Anonymous',
      color: userColor,
    },
    onChange: (newContent) => {
      log.log('Impl Plan content changed', { length: newContent.length, preview: newContent.slice(0, 100) });
      setImplPlanContent(newContent);
    },
    // Disable IndexedDB persistence when connected to server to prevent stale data conflicts
    enableOfflinePersistence: false,
  });

  // Convert Yjs co-authors to MarkdownCoEditor format for Implementation Plan
  const implPlanCoAuthors: CoAuthor[] = useMemo(() => {
    return implPlanYjsCoAuthors
      .filter(author => author.cursor)
      .map(author => ({
        id: String(author.clientId),
        name: author.name,
        color: author.color,
        selectionStart: author.cursor!.anchor,
        selectionEnd: author.cursor!.head,
        isAI: author.name === 'Plan Agent',
      }));
  }, [implPlanYjsCoAuthors]);

  // Parse content to get structured fields
  const parsedContent = useMemo(() => parseMarkdownContent(content), [content]);

  // Build idea context for the agent
  // For existing ideas, use the idea prop as the source of truth initially
  // This ensures the agent has correct context before Yjs syncs
  // For new ideas or after edits, fall back to parsedContent
  const ideaContext: IdeaContext = useMemo(() => {
    // For existing ideas, prefer the idea prop data
    // Only use parsedContent if it has been initialized with real content
    // (not the default "Untitled Idea" template)
    if (idea) {
      const hasRealDocContent = isInitialized &&
        parsedContent.title.trim() &&
        parsedContent.title.trim() !== 'Untitled Idea';

      return {
        id: idea.id,
        title: hasRealDocContent ? parsedContent.title.trim() : idea.title,
        summary: hasRealDocContent ? (parsedContent.summary.trim() || idea.summary) : idea.summary,
        description: hasRealDocContent ? (parsedContent.description.trim() || idea.description || undefined) : (idea.description || undefined),
        tags: hasRealDocContent && parsedContent.tags.length > 0 ? parsedContent.tags : idea.tags,
        status: idea.status,
        topicContext: initialTopicContext,
      };
    }
    // For new ideas, use parsedContent
    return {
      id: 'new',
      title: parsedContent.title.trim() || 'New Idea',
      summary: parsedContent.summary.trim(),
      description: parsedContent.description.trim() || undefined,
      tags: parsedContent.tags,
      status: 'new',
      topicContext: initialTopicContext,
    };
  }, [idea, parsedContent, initialTopicContext, isInitialized]);

  // Stable error handler to prevent unnecessary reconnects
  const handleAgentError = useCallback((err: string) => {
    log.error(' Agent error:', err);
  }, []);

  // Handle plan updates from Plan Agent - merge with existing plan to preserve fields
  const handlePlanUpdate = useCallback((newPlan: Partial<IdeaPlan>) => {
    setPlan(prev => prev ? { ...prev, ...newPlan } : newPlan);
  }, []);

  // Build plan context for the Plan Agent
  const planIdeaContext: PlanIdeaContext = useMemo(() => ({
    id: currentIdea?.id || idea?.id || 'new',
    title: parsedContent.title.trim() || currentIdea?.title || idea?.title || 'New Idea',
    summary: parsedContent.summary.trim() || currentIdea?.summary || idea?.summary || '',
    description: parsedContent.description.trim() || currentIdea?.description || idea?.description || undefined,
    tags: parsedContent.tags.length > 0 ? parsedContent.tags : (currentIdea?.tags || idea?.tags || []),
    status: currentIdea?.status || idea?.status || 'new',
    // Include parent topics with execution context (folders, repos) for working directory suggestions
    parentTopics: parentTopicsWithContext.length > 0 ? parentTopicsWithContext : undefined,
  }), [currentIdea, idea, parsedContent, parentTopicsWithContext]);

  // Idea agent hook - only enabled when overlay is open AND in ideation phase
  // Use currentIdea?.id first as it gets set when we create idea immediately on first message
  const ideaAgent = useIdeaAgent({
    ideaId: currentIdea?.id || idea?.id || null,
    userId: user?.id || '',
    userName: user?.name || 'Anonymous',
    ideaContext,
    documentRoomName: documentId,
    initialGreeting,
    onError: handleAgentError,
    enabled: open && phase === 'ideation',
    modelId,
    workspaceId,
  });

  // Plan agent hook - only enabled when overlay is open AND in planning phase
  const planAgent = usePlanAgent({
    ideaId: currentIdea?.id || idea?.id || '',
    userId: user?.id || '',
    userName: user?.name || 'Anonymous',
    ideaContext: planIdeaContext,
    initialPlan: currentIdea?.plan || idea?.plan,
    documentRoomName: implPlanDocumentId || undefined,
    onError: handleAgentError,
    onPlanUpdate: handlePlanUpdate,
    enabled: open && phase === 'planning' && !!(currentIdea?.id || idea?.id),
    modelId,
    workspaceId,
  });

  // Build execution context
  const executionIdeaContext: ExecutionIdeaContext = useMemo(() => ({
    id: currentIdea?.id || idea?.id || '',
    title: currentIdea?.title || idea?.title || 'Untitled',
    summary: currentIdea?.summary || idea?.summary || '',
    description: currentIdea?.description || idea?.description,
  }), [currentIdea, idea]);

  // Handle task completion - update plan state to mark task as completed
  const handleTaskComplete = useCallback((event: { taskId: string; phaseId: string; summary?: string }) => {
    setPlan(prev => {
      if (!prev?.phases) return prev;
      return {
        ...prev,
        phases: prev.phases.map(phase => {
          if (phase.id !== event.phaseId) return phase;
          return {
            ...phase,
            tasks: phase.tasks.map(task => {
              if (task.id !== event.taskId) return task;
              return { ...task, completed: true, inProgress: false };
            }),
          };
        }),
      };
    });
  }, []);

  // Handle task update - update task status in plan
  const handleTaskUpdate = useCallback((event: { action: string; taskId: string; phaseId: string; status?: string }) => {
    setPlan(prev => {
      if (!prev?.phases) return prev;
      return {
        ...prev,
        phases: prev.phases.map(phase => {
          if (phase.id !== event.phaseId) return phase;
          return {
            ...phase,
            tasks: phase.tasks.map(task => {
              if (task.id !== event.taskId) return task;
              // Update based on status
              if (event.status === 'completed') {
                return { ...task, completed: true, inProgress: false };
              } else if (event.status === 'in_progress') {
                return { ...task, inProgress: true };
              } else if (event.status === 'pending') {
                return { ...task, inProgress: false, completed: false };
              }
              return task;
            }),
          };
        }),
      };
    });
  }, []);

  // State for pause between phases option (execution mode)
  const [pauseBetweenPhases, setPauseBetweenPhases] = useState(false);

  // Track pauseBetweenPhases in a ref for use in callbacks
  const pauseBetweenPhasesRef = useRef(pauseBetweenPhases);
  useEffect(() => {
    pauseBetweenPhasesRef.current = pauseBetweenPhases;
  }, [pauseBetweenPhases]);

  // Track completed phase for auto-continue logic
  const [completedPhaseId, setCompletedPhaseId] = useState<string | null>(null);
  // Guard against duplicate auto-continue triggers
  const autoContinueInProgressRef = useRef(false);

  // Handle phase completion - update plan state
  const handlePhaseComplete = useCallback((event: { phaseId: string; summary?: string }) => {
    log.log('handlePhaseComplete called', { phaseId: event.phaseId, summary: event.summary });
    setPlan(prev => {
      if (!prev?.phases) return prev;
      const phaseIndex = prev.phases.findIndex(p => p.id === event.phaseId);
      log.log('handlePhaseComplete - updating plan', {
        phaseId: event.phaseId,
        phaseIndex,
        totalPhases: prev.phases.length,
        phaseTitle: prev.phases[phaseIndex]?.title,
      });
      return {
        ...prev,
        phases: prev.phases.map(phase => {
          if (phase.id !== event.phaseId) return phase;
          // Mark all tasks in the phase as completed
          return {
            ...phase,
            tasks: phase.tasks.map(task => ({ ...task, completed: true, inProgress: false })),
          };
        }),
      };
    });
    // Track the completed phase for auto-continue
    setCompletedPhaseId(event.phaseId);
  }, []);

  // Execution agent hook - only enabled when overlay is open AND in executing phase
  const executeAgent = useExecutionAgent({
    ideaId: currentIdea?.id || idea?.id || '',
    userId: user?.id || '',
    userName: user?.name || 'Anonymous',
    ideaContext: executionIdeaContext,
    plan: plan as IdeaPlan | null,
    onError: handleAgentError,
    onTaskComplete: handleTaskComplete,
    onTaskUpdate: handleTaskUpdate,
    onPhaseComplete: handlePhaseComplete,
    enabled: open && phase === 'executing' && !!(currentIdea?.id || idea?.id),
  });

  // NOTE: Auto-continue is now handled server-side in ExecutionAgentService.
  // This client-side effect is kept as a fallback for edge cases where
  // the server doesn't auto-continue (e.g., reconnection scenarios).
  // It checks if execution is already running to avoid duplicates.
  useEffect(() => {
    const phases = plan?.phases;
    if (!completedPhaseId || !phases || pauseBetweenPhasesRef.current) {
      if (completedPhaseId) {
        log.log('Auto-continue skipped', {
          completedPhaseId,
          hasPhases: !!phases,
          pauseBetweenPhases: pauseBetweenPhasesRef.current,
        });
      }
      return;
    }

    // Server handles auto-continue now - skip if execution is already running
    if (executeAgent.isExecuting) {
      log.log('Auto-continue skipped: server is already executing');
      setCompletedPhaseId(null);
      return;
    }

    // Prevent duplicate execution if already in progress
    if (autoContinueInProgressRef.current) {
      log.log('Auto-continue already in progress, skipping');
      return;
    }

    // Find the index of the completed phase
    const completedIndex = phases.findIndex(p => p.id === completedPhaseId);
    const nextPhase = completedIndex >= 0 && completedIndex < phases.length - 1
      ? phases[completedIndex + 1]
      : null;

    log.log('Auto-continue evaluating (client-side fallback)', {
      completedPhaseId,
      completedIndex,
      completedPhaseTitle: phases[completedIndex]?.title,
      nextPhaseId: nextPhase?.id,
      nextPhaseTitle: nextPhase?.title,
      totalPhases: phases.length,
    });

    if (nextPhase) {
      // Mark as in progress to prevent duplicate triggers
      autoContinueInProgressRef.current = true;

      // Small delay before starting next phase
      const timerId = setTimeout(() => {
        // Double-check execution isn't already running
        if (executeAgent.isExecuting) {
          log.log('Auto-continue cancelled: server started execution');
          setCompletedPhaseId(null);
          autoContinueInProgressRef.current = false;
          return;
        }
        log.log('Auto-continue starting next phase (client-side fallback)', {
          nextPhaseId: nextPhase.id,
          nextPhaseTitle: nextPhase.title,
        });
        const fullPlan: IdeaPlan = {
          phases,
          workingDirectory: plan?.workingDirectory || '',
          repositoryUrl: plan?.repositoryUrl,
          branch: plan?.branch,
          isClone: plan?.isClone,
          workspaceId: plan?.workspaceId,
          createdAt: plan?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        executeAgent.startExecution(executionIdeaContext, fullPlan, nextPhase.id, pauseBetweenPhasesRef.current);
        // Clear the completed phase ID and reset guard
        setCompletedPhaseId(null);
        autoContinueInProgressRef.current = false;
      }, 500);
      return () => {
        clearTimeout(timerId);
        autoContinueInProgressRef.current = false;
      };
    } else {
      // No next phase, clear the completed phase ID
      log.log('Auto-continue: No next phase, execution complete', {
        completedIndex,
        totalPhases: phases.length,
      });
      setCompletedPhaseId(null);
    }
  }, [completedPhaseId, plan, executeAgent, executionIdeaContext]);

  // Activity revisions hook - for Activity tab
  const activityRevisions = useActivityRevisions({
    ideaId: currentIdea?.id || idea?.id || '',
    enabled: open && activeTab === 'activity' && !!(currentIdea?.id || idea?.id),
    refreshInterval: phase === 'executing' ? 5000 : 0, // Auto-refresh during execution
  });

  // Select active agent based on phase - all agents now have consistent APIs
  const activeAgent = phase === 'executing'
    ? { ...executeAgent, clearHistory: executeAgent.clearMessages, cancelRequest: executeAgent.cancelExecution }
    : phase === 'planning' ? planAgent : ideaAgent;
  const agentMessages = activeAgent.messages;
  const isConnected = activeAgent.isConnected;
  // Also check executeAgent.isExecuting directly to handle the timing gap
  // between clicking Execute and React updating the phase state
  const isAgentThinking = activeAgent.isLoading || executeAgent.isExecuting;
  const tokenUsage = activeAgent.tokenUsage;
  const sendAgentMessage = activeAgent.sendMessage;
  const addLocalMessage = activeAgent.addLocalMessage;
  const clearHistory = activeAgent.clearHistory;
  const cancelRequest = activeAgent.cancelRequest;

  // Shared agent properties - now consistent across all agents
  const openQuestions = activeAgent.openQuestions;
  const showQuestionsResolver = activeAgent.showQuestionsResolver;
  const setShowQuestionsResolver = activeAgent.setShowQuestionsResolver;
  const resolveQuestions = activeAgent.resolveQuestions;

  // Agent-specific properties that still differ by phase
  const isEditingDocument = phase === 'executing'
    ? false
    : phase === 'planning'
      ? planAgent.isEditingDocument
      : ideaAgent.isEditingDocument;
  const updateIdeaContext = ideaAgent.updateIdeaContext;

  // Execution-specific state
  const isExecutionBlocked = phase === 'executing' && executeAgent.isBlocked;
  const executionBlockedEvent = phase === 'executing' ? executeAgent.blockedEvent : null;

  // Update the agent when ideaContext changes (especially topicContext)
  useEffect(() => {
    if (phase === 'ideation' && ideaAgent.isConnected && ideaContext) {
      updateIdeaContext(ideaContext);
    }
  }, [phase, ideaAgent.isConnected, ideaContext, updateIdeaContext]);

  // Chat commands (/clear, /help, /model)
  const { commands, handleCommand } = useChatCommands({
    clearMessages: clearHistory,
    addMessage: (msg) => addLocalMessage({
      id: msg.id,
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
      timestamp: msg.timestamp,
    }),
    helpText: `## Available Commands

- **/clear** - Clear all chat history
- **/help** - Show this help message
- **/model** - View or change the AI model

## Tips

- Describe your idea in the editor on the right
- Ask the agent for feedback, suggestions, or to help refine your idea
- The agent can see your idea's title, summary, and description`,
    currentModelInfo: modelInfo,
    onModelChange: setModelId,
  });

  // Convert agent messages to ChatPanel format
  const agentName = phase === 'executing' ? 'Execute Agent' : phase === 'planning' ? 'Plan Agent' : 'Idea Agent';
  const chatMessages: ChatPanelMessage[] = useMemo(() => {
    return agentMessages
      .map((msg): ChatPanelMessage | null => {
        // Strip XML structured events from assistant messages (they're handled separately)
        const cleanContent = msg.role === 'assistant'
          ? stripStructuredEvents(msg.content)
          : msg.content;

        // Convert server parts to client parts for proper interleaving
        // Server parts: { type: 'text', text: string } | { type: 'tool_calls', calls: ToolCall[] }
        // Client parts: { type: 'text', text: string } | { type: 'tool_calls', calls: ChatMessageToolCall[] }
        let parts: ChatMessagePart[] | undefined;

        if (msg.parts && msg.parts.length > 0) {
          // Convert server parts format to client parts format
          parts = [];

          for (const part of msg.parts) {
            if (part.type === 'text' && part.text) {
              // Strip XML from text parts for assistant messages
              const cleanText = msg.role === 'assistant' ? stripStructuredEvents(part.text) : part.text;
              if (cleanText) {
                parts.push({ type: 'text', text: cleanText });
              }
            } else if (part.type === 'tool_calls' && part.calls && part.calls.length > 0) {
              // Pass through tool calls
              parts.push({ type: 'tool_calls', calls: part.calls });
            }
          }

          // If parts is empty after processing, set to undefined
          if (parts.length === 0) {
            parts = undefined;
          }
        }

        // Skip empty messages after stripping (unless they have parts)
        if (!cleanContent && !parts?.length && msg.role === 'assistant') return null;

        return {
          id: msg.id,
          content: cleanContent,
          timestamp: msg.timestamp,
          senderName: msg.role === 'user' ? (user?.name || 'You') : agentName,
          senderColor: msg.role === 'user' ? undefined : '#8b5cf6',
          isOwn: msg.role === 'user',
          isStreaming: msg.isStreaming,
          renderMarkdown: true,
          parts,
        };
      })
      .filter((msg): msg is ChatPanelMessage => msg !== null);
  }, [agentMessages, user?.name, agentName]);

  // Memoize thinkingIndicatorProps to prevent re-renders when typing
  const thinkingStatusText = phase === 'executing'
    ? executeAgent.progress.currentEvent?.displayText
    : phase === 'planning'
      ? planAgent.progress.currentEvent?.displayText
      : ideaAgent.progress.currentEvent?.displayText;

  const thinkingIndicatorProps = useMemo(() => ({
    statusText: thinkingStatusText,
    showEscapeHint: isAgentThinking,
  }), [thinkingStatusText, isAgentThinking]);

  // Detect room changes and prepare for migration
  // Only migrate content when saving a NEW idea (transitioning from new-idea room to saved-idea room)
  // Do NOT migrate when clicking on a different existing idea
  useEffect(() => {
    const prevId = prevDocumentIdRef.current;
    if (prevId && prevId !== documentId) {
      // Only migrate if:
      // 1. Previous room was a "new idea" room
      // 2. New room is a "saved idea" room (not another new idea room)
      // 3. We have non-trivial content to migrate
      const wasNewIdeaRoom = prevId.includes('idea-doc-new-');
      const isNowSavedIdeaRoom = !documentId.includes('idea-doc-new-');
      const { title } = parseMarkdownContent(content);
      const hasNonTrivialContent = title.trim() && title !== 'Untitled Idea';

      log.log(' Room change detected:', {
        from: prevId,
        to: documentId,
        wasNewIdeaRoom,
        isNowSavedIdeaRoom,
        hasNonTrivialContent,
        contentTitle: title,
        contentLength: content.length,
        currentIdeaId: currentIdea?.id,
      });

      if (wasNewIdeaRoom && isNowSavedIdeaRoom && hasNonTrivialContent) {
        // This is a new idea being saved - migrate content
        log.log(' Capturing content for migration, length:', content.length);
        setPendingContentMigration(content);
      } else {
        // This is switching to a different idea - don't migrate, just reset
        log.log(' NOT migrating content (missing non-trivial content at room change time)');
        setPendingContentMigration(null);
      }
      setIsInitialized(false);
    }
    prevDocumentIdRef.current = documentId;
  }, [documentId, content, currentIdea?.id]);

  // Initialize Yjs document content when synced
  useEffect(() => {
    log.log(' Yjs init effect:', {
      isYjsSynced,
      isInitialized,
      pendingContentMigration: pendingContentMigration ? pendingContentMigration.length : null,
      ideaId: idea?.id,
      currentIdeaId: currentIdea?.id,
      contentLength: content.length,
      documentId,
    });

    if (!isYjsSynced || isInitialized) return;

    // Check if we have pending content from a room migration (new idea -> saved idea)
    if (pendingContentMigration) {
      log.log(' Migrating content to new Yjs room, length:', pendingContentMigration.length);
      yjsSetContent(pendingContentMigration);
      lastSavedContent.current = pendingContentMigration;
      hasDocumentChanges.current = false;
      setPendingContentMigration(null);
      setIsInitialized(true);
      setError(null);
      return;
    }

    // Use idea prop, or currentIdea for ideas created during this session
    const effectiveIdea = idea || currentIdea;

    // Check if Yjs already synced meaningful content from the server
    // This happens when reopening an existing idea that has document content
    // written by the agent during background processing
    const hasYjsSyncedContent = content.length > 0;
    const parsedYjsContent = hasYjsSyncedContent ? parseMarkdownContent(content) : null;
    const hasNonPlaceholderContent = parsedYjsContent &&
      parsedYjsContent.title.trim() &&
      parsedYjsContent.title !== 'Untitled Idea' &&
      parsedYjsContent.title !== 'New Idea';

    log.log(' Checking Yjs content:', {
      hasYjsSyncedContent,
      hasNonPlaceholderContent,
      parsedTitle: parsedYjsContent?.title,
      fromIdea: !!idea,
      fromCurrentIdea: !!currentIdea,
    });

    // If Yjs already has meaningful content (from agent writing), preserve it
    // Only set content from metadata if Yjs is empty or has placeholder content
    if (hasNonPlaceholderContent) {
      log.log(' Preserving existing Yjs content (already has non-placeholder content)');
      lastSavedContent.current = content;
      hasDocumentChanges.current = false;
      setIsInitialized(true);
      setError(null);
      return;
    }

    // Build initial content from idea metadata or empty template
    const initialContent = effectiveIdea
      ? buildMarkdownContent(effectiveIdea.title, effectiveIdea.summary, effectiveIdea.tags, effectiveIdea.description)
      : buildMarkdownContent('', '', [], '');

    log.log(' Building initial content from metadata:', {
      effectiveIdeaTitle: effectiveIdea?.title,
      initialContentLength: initialContent.length,
    });

    // Set content from metadata (Yjs was empty or had placeholder)
    if (effectiveIdea || content.length === 0) {
      log.log('Setting Yjs content to initial', { length: initialContent.length });
      yjsSetContent(initialContent);
    }

    // Track initial content so we can detect actual changes
    lastSavedContent.current = initialContent;
    hasDocumentChanges.current = false;

    setIsInitialized(true);
    setError(null);
  }, [isYjsSynced, isInitialized, idea, currentIdea, content, yjsSetContent, pendingContentMigration, documentId]);

  // Reset state when overlay closes
  useEffect(() => {
    if (!open) {
      setIsInitialized(false);
      // Reset plan state
      setPlan(null);
      setActiveTab('idea-doc');
      setPendingContentMigration(null);
      // Reset phase to ideation when closing
      setPhase('ideation');
      // For truly new ideas (not transitioned to saved), clear content when closing
      // so next open starts fresh. Don't clear if we have a currentIdea (saved during session)
      if (isNewIdea && !currentIdea) {
        setContent('');
        setError(null);
        // Clear the Yjs document content
        yjsSetContent('');
      }
      // Reset currentIdea for next session
      setCurrentIdea(null);
      // Reset the documentId tracker for next session
      prevDocumentIdRef.current = null;
    }
  }, [open, isNewIdea, currentIdea, yjsSetContent]);

  // Auto-switch to appropriate tab when entering planning or executing phase
  useEffect(() => {
    if (phase === 'planning') {
      setActiveTab('impl-plan');
    } else if (phase === 'executing') {
      setActiveTab('exec-plan');
    }
  }, [phase]);

  // Log when isImplPlanYjsSynced changes
  useEffect(() => {
    log.log('isImplPlanYjsSynced changed', { isImplPlanYjsSynced, phase, planAgentConnected: planAgent.isConnected, implPlanDocumentId });
  }, [isImplPlanYjsSynced, phase, planAgent.isConnected, implPlanDocumentId]);

  // Signal to the Plan Agent that Yjs is ready when the impl plan syncs
  // This allows the agent to start writing to the document without race conditions
  useEffect(() => {
    if (phase === 'planning' && isImplPlanYjsSynced && planAgent.isConnected) {
      log.log(' Impl plan Yjs synced, sending yjs_ready to server. Room:', implPlanDocumentId);
      planAgent.sendYjsReady();
    }
  }, [phase, isImplPlanYjsSynced, planAgent.isConnected, planAgent.sendYjsReady, implPlanDocumentId]);

  // Note: Planning initialization is now handled on the SERVER side.
  // When the Plan Agent connects and there's no history, the server automatically
  // starts designing. This avoids fragile client-side initialization that would
  // re-trigger on every component mount/unmount.

  // Sync backdrop visibility with open state
  useEffect(() => {
    if (open) {
      setIsBackdropVisible(true);
    } else {
      const timerId = setTimeout(() => {
        setIsBackdropVisible(false);
      }, 250);
      return () => clearTimeout(timerId);
    }
  }, [open]);

  // Focus chat input when overlay opens
  useEffect(() => {
    if (open) {
      const timerId = setTimeout(() => {
        chatInputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timerId);
    }
  }, [open]);

  // Track if initial prompt has been sent
  const initialPromptSentRef = useRef(false);
  // Use ref for sendSilentMessage to avoid effect re-running on every render
  const sendSilentMessageRef = useRef(ideaAgent.sendSilentMessage);
  sendSilentMessageRef.current = ideaAgent.sendSilentMessage;

  // Create idea immediately when initialPrompt is provided, then send the prompt.
  // This ensures the idea is persisted even if the user closes the dialog before
  // the agent finishes writing. Similar to how handleChatSubmit creates ideas
  // immediately on first user message.
  useEffect(() => {
    const handleInitialPrompt = async () => {
      if (!open || !isConnected || !initialPrompt || initialPromptSentRef.current || phase !== 'ideation') {
        return;
      }

      // Mark as sent immediately to prevent double-sending
      initialPromptSentRef.current = true;

      // If we already have an idea or have already started creation, just send the prompt
      if (idea || currentIdea || ideaCreatedForSessionRef.current) {
        setTimeout(() => {
          sendSilentMessageRef.current(initialPrompt);
        }, 500);
        return;
      }

      // Create the idea immediately so it appears in the kanban
      ideaCreatedForSessionRef.current = true;
      log.log(' Creating idea immediately with initialPrompt, initialTitle:', initialTitle);

      try {
        const newIdea = await createIdea({
          title: initialTitle || 'Untitled Idea',
          summary: 'Processing...',
          tags: [],
          workspaceId,
          topicIds: initialTopicIds,
          documentRoomName: documentId,
        });

        log.log(` Idea created with initialPrompt: ${newIdea.id}`);
        setCurrentIdea(newIdea);

        // Notify parent so it can add to kanban immediately
        onIdeaCreated?.(newIdea);

        // Small delay to ensure agent is ready after reconnection with new ideaId
        setTimeout(() => {
          sendSilentMessageRef.current(initialPrompt);
        }, 500);
      } catch (err) {
        log.error(' Failed to create idea with initialPrompt:', err);
        ideaCreatedForSessionRef.current = false;

        // Still try to send the prompt even if idea creation failed
        setTimeout(() => {
          sendSilentMessageRef.current(initialPrompt);
        }, 500);
      }
    };

    handleInitialPrompt();

    // Reset the flag when overlay closes
    if (!open) {
      initialPromptSentRef.current = false;
    }
  }, [open, isConnected, initialPrompt, initialTitle, phase, idea, currentIdea, createIdea, workspaceId, initialTopicIds, documentId, onIdeaCreated]);

  // Handle cancel operation
  const handleCancelOperation = useCallback(() => {
    cancelRequest();
    // Add a system message indicating the operation was stopped
    addLocalMessage({
      id: `system-${Date.now()}`,
      role: 'assistant',
      content: '*User interrupted.*',
      timestamp: Date.now(),
    });
  }, [cancelRequest, addLocalMessage]);

  // Handle close - auto-saves valid content, so we can just close
  const handleCloseRequest = useCallback(() => {
    // Auto-save effect will handle saving valid content when overlay closes
    onClose();
  }, [onClose]);

  // Handle Ctrl/Cmd+C to cancel operation when agent is thinking
  const handleCancelKeyboard = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'c' && (event.metaKey || event.ctrlKey)) {
        // Only intercept if agent is thinking - otherwise let normal copy work
        if (isAgentThinking) {
          event.preventDefault();
          handleCancelOperation();
        }
      }
    },
    [isAgentThinking, handleCancelOperation]
  );

  // Handle escape key - clear input first, then close if empty
  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // If input has text, let the ChatInput handle Escape (clear input)
        if (inputContentRef.current.trim()) {
          return;
        }

        // If input is empty, close the dialog (auto-save will handle valid content)
        event.preventDefault();
        handleCloseRequest();
      }
    },
    [handleCloseRequest]
  );

  // Add/remove keyboard listeners when open
  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleCancelKeyboard);
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleCancelKeyboard);
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, handleCancelKeyboard, handleEscape]);

  // Update agent context when form changes
  useEffect(() => {
    if (ideaContext && isConnected) {
      updateIdeaContext(ideaContext);
    }
  }, [ideaContext, isConnected, updateIdeaContext]);

  // Track if document has been modified (for auto-save)
  const hasDocumentChanges = useRef(false);
  const lastSavedContent = useRef<string>('');
  // Track if idea has been created for this session (prevent duplicate creation)
  const ideaCreatedForSessionRef = useRef(false);
  // Store the first message to send after idea creation (when agent reconnects)
  const pendingFirstMessageRef = useRef<string | null>(null);
  // Track if we're waiting for reconnection after idea creation
  // States: 'idle' -> 'waiting-for-disconnect' -> 'waiting-for-reconnect' -> 'idle'
  const reconnectStateRef = useRef<'idle' | 'waiting-for-disconnect' | 'waiting-for-reconnect'>('idle');

  // Reset refs when dialog closes
  useEffect(() => {
    if (!open) {
      ideaCreatedForSessionRef.current = false;
      pendingFirstMessageRef.current = null;
      reconnectStateRef.current = 'idle';
    }
  }, [open]);

  // Send pending first message once agent reconnects after idea creation
  // State machine: 'idle' -> 'waiting-for-disconnect' -> 'waiting-for-reconnect' -> 'idle'
  useEffect(() => {
    const state = reconnectStateRef.current;

    // Waiting for disconnect: when we see disconnected, move to waiting-for-reconnect
    if (state === 'waiting-for-disconnect' && !isConnected) {
      log.log(' Agent disconnected, now waiting for reconnect...');
      reconnectStateRef.current = 'waiting-for-reconnect';
    }

    // Waiting for reconnect: when we see connected, send the pending message
    if (state === 'waiting-for-reconnect' && isConnected && pendingFirstMessageRef.current && currentIdea) {
      const message = pendingFirstMessageRef.current;
      pendingFirstMessageRef.current = null;
      reconnectStateRef.current = 'idle';
      log.log(' Sending pending first message after reconnect');
      sendAgentMessage(message);
    }
  }, [isConnected, currentIdea, sendAgentMessage]);

  // Track changes to document content
  useEffect(() => {
    if (isInitialized && content !== lastSavedContent.current) {
      hasDocumentChanges.current = true;
    }
  }, [content, isInitialized]);

  // Track previous isEditingDocument state to detect when agent finishes editing
  const prevIsEditingDocumentRef = useRef(false);

  // Update idea when agent finishes generating document with valid title
  // If idea was created immediately on first message, this updates the placeholder title/summary
  useEffect(() => {
    const wasEditing = prevIsEditingDocumentRef.current;
    prevIsEditingDocumentRef.current = isEditingDocument;

    // Only trigger when isEditingDocument transitions from true to false
    if (!wasEditing || isEditingDocument) return;

    // Only in ideation phase
    if (phase !== 'ideation') return;

    const { title, summary, tags, description } = parsedContent;

    // Only update if we have a valid title (not placeholder)
    if (!title.trim() || title === 'Untitled Idea' || !summary.trim()) return;

    // If we already have a currentIdea, update it with the generated content
    if (currentIdea) {
      log.log(` Agent finished editing, updating idea "${currentIdea.id}" with title: "${title}"`);
      updateIdea(currentIdea.id, {
        title: title.trim(),
        summary: summary.trim(),
        tags,
        description: description.trim() || undefined,
      }).then((updated) => {
        if (updated) {
          log.log(` Idea updated: ${updated.id}`);
          setCurrentIdea(updated);
          lastSavedContent.current = content;
          hasDocumentChanges.current = false;
        }
      }).catch((err) => {
        log.error(' Failed to update idea:', err);
      });
      return;
    }

    // If no currentIdea and not yet created, create it now (fallback)
    if (idea || ideaCreatedForSessionRef.current) return;

    // Mark as creating to prevent duplicate creation
    ideaCreatedForSessionRef.current = true;

    log.log(` Agent finished editing, creating idea with title: "${title}"`);

    createIdea({
      title: title.trim(),
      summary: summary.trim(),
      tags,
      description: description.trim() || undefined,
      workspaceId,
      topicIds: initialTopicIds,
      // Pass documentRoomName so server can link agent session to real ideaId
      documentRoomName: documentId,
    }).then((newIdea) => {
      log.log(` Idea created: ${newIdea.id}, documentRoomName: ${documentId}`);
      setCurrentIdea(newIdea);
      // Notify parent so it can add to kanban immediately (without refetch)
      // Use onIdeaCreated if available, otherwise fall back to onSuccess
      if (onIdeaCreated) {
        onIdeaCreated(newIdea);
      } else {
        onSuccess?.(newIdea);
      }
      lastSavedContent.current = content;
      hasDocumentChanges.current = false;
    }).catch((err) => {
      log.error(' Failed to create idea:', err);
      // Reset flag so it can retry
      ideaCreatedForSessionRef.current = false;
    });
  }, [isEditingDocument, phase, currentIdea, idea, parsedContent, content, workspaceId, initialTopicIds, createIdea, updateIdea, onSuccess, onIdeaCreated, documentId]);

  // Debounced auto-save for UPDATES (not creation) during ideation phase
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    // Only auto-save updates during ideation phase when document changes
    // Skip if no currentIdea (creation is handled by the effect above)
    if (!isInitialized || phase !== 'ideation' || !hasDocumentChanges.current || !currentIdea?.id) return;

    const { title, summary, tags, description } = parsedContent;

    // Don't save if content is minimal/placeholder
    if (!title.trim() || title === 'Untitled Idea' || !summary.trim()) return;

    // Clear any pending save
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Debounce save by 2 seconds for updates
    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        const updated = await updateIdea(currentIdea.id, {
          title: title.trim(),
          summary: summary.trim(),
          tags,
          description: description.trim() || undefined,
        });
        if (updated) {
          lastSavedContent.current = content;
          hasDocumentChanges.current = false;
        }
      } catch (err) {
        log.error(' Auto-save update failed:', err);
      }
    }, 2000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [isInitialized, phase, parsedContent, currentIdea, content, updateIdea]);

  // Auto-save idea updates when overlay closes
  // Note: Idea CREATION is handled by the effect that watches isEditingDocument.
  // This effect only handles UPDATES to existing ideas.
  useEffect(() => {
    // Only auto-save when closing with changes to an existing idea
    if (!open && hasDocumentChanges.current && isInitialized && (idea || currentIdea)) {
      const { title, summary, tags, description } = parseMarkdownContent(content);

      // Only save if we have valid content
      if (title.trim() && title !== 'Untitled Idea' && summary.trim()) {
        const ideaToUpdate = currentIdea || idea;
        updateIdea(ideaToUpdate!.id, {
          title: title.trim(),
          summary: summary.trim(),
          tags,
          description: description.trim() || undefined,
        }).then((updated) => {
          if (updated) {
            onSuccess?.(updated);
          }
        }).catch((err) => {
          log.error(' Auto-save failed:', err);
        });
      }

      // Reset tracking
      hasDocumentChanges.current = false;
    }
  }, [open, idea, currentIdea, content, isInitialized, updateIdea, onSuccess]);

  // Handle transition to planning mode
  const handleStartPlanning = useCallback(async () => {
    log.log(`#${instanceIdRef.current} handleStartPlanning START`);
    const { title, summary, tags, description } = parsedContent;

    if (!title.trim() || title === 'Untitled Idea') {
      setError('Title is required');
      return;
    }
    if (!summary.trim()) {
      setError('Summary is required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      let ideaToTransition: Idea;

      if (isNewIdea || !currentIdea) {
        // Create new idea first
        log.log(`#${instanceIdRef.current} Creating new idea...`);
        const input: CreateIdeaInput = {
          title: title.trim(),
          summary: summary.trim(),
          tags,
          description: description.trim() || undefined,
          workspaceId,
          topicIds: initialTopicIds,
          // Pass documentRoomName so server can link agent session to real ideaId
          documentRoomName: documentId,
        };
        ideaToTransition = await createIdea(input);
        log.log(`#${instanceIdRef.current} Idea created: ${ideaToTransition.id}, documentRoomName: ${documentId}`);
        lastSavedContent.current = content;
        hasDocumentChanges.current = false;
      } else {
        // Save existing idea
        const updated = await updateIdea(currentIdea.id, {
          title: title.trim(),
          summary: summary.trim(),
          tags,
          description: description.trim() || undefined,
        });
        if (!updated) {
          setError('Failed to update idea');
          return;
        }
        ideaToTransition = updated;
        lastSavedContent.current = content;
        hasDocumentChanges.current = false;
      }

      // Move idea to 'exploring' (planning) status
      log.log(`#${instanceIdRef.current} Moving idea to exploring status...`);
      await moveIdea(ideaToTransition.id, 'exploring');
      const transitionedIdea = { ...ideaToTransition, status: 'exploring' as const };

      // Update local state - this will change documentId which triggers the
      // room change detection effect to capture content for migration
      log.log(`#${instanceIdRef.current} Setting currentIdea...`);
      setCurrentIdea(transitionedIdea);

      // Notify parent for kanban update (but don't close)
      log.log(`#${instanceIdRef.current} Calling onStatusChange...`);
      onStatusChange?.(transitionedIdea, 'exploring');

      // Transition to planning phase in the UI
      log.log(`#${instanceIdRef.current} Setting phase to planning...`);
      setPhase('planning');
      // Switch to Implementation Plan tab when entering planning phase
      setActiveTab('impl-plan');
      log.log(`#${instanceIdRef.current} handleStartPlanning DONE`);
    } catch (err) {
      log.error(`#${instanceIdRef.current} handleStartPlanning ERROR:`, err);
      setError(err instanceof Error ? err.message : 'Failed to save idea');
    } finally {
      setIsSaving(false);
    }
  }, [parsedContent, isNewIdea, currentIdea, workspaceId, createIdea, updateIdea, moveIdea, onStatusChange, content, initialTopicIds, documentId]);

  // Check if plan is ready for execution
  const isPlanReady = useMemo(() => {
    return plan?.phases && plan.phases.length > 0 && plan.phases.some(p => p.tasks && p.tasks.length > 0);
  }, [plan]);

  // State for showing directory picker prompt
  const [showDirectoryPrompt, setShowDirectoryPrompt] = useState(false);

  // Handle starting execution with the plan
  const handleStartExecution = useCallback(() => {
    log.log('handleStartExecution called', { hasPlan: !!plan, phases: plan?.phases?.length });
    if (!plan || !plan.phases || plan.phases.length === 0) {
      setError('No plan available. Please create a plan first.');
      return;
    }

    // Require working directory before execution
    if (!plan.workingDirectory) {
      // Show directory prompt instead of just an error
      setShowDirectoryPrompt(true);
      return;
    }

    const fullPlan: IdeaPlan = {
      phases: plan.phases,
      workingDirectory: plan.workingDirectory,
      repositoryUrl: plan.repositoryUrl,
      branch: plan.branch,
      isClone: plan.isClone,
      workspaceId: plan.workspaceId,
      createdAt: plan.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    // Notify parent (for kanban update) and transition to executing phase
    log.log(' Calling onStartExecution, then setPhase(executing)');
    onStartExecution?.(fullPlan);
    setPhase('executing');
    setActiveTab('exec-plan');
    // Start execution with the first phase
    const firstPhaseId = fullPlan.phases[0].id;
    log.log('Calling executeAgent.startExecution', { firstPhaseId, contextId: executionIdeaContext.id, pauseBetweenPhases });
    executeAgent.startExecution(executionIdeaContext, fullPlan, firstPhaseId, pauseBetweenPhases);
  }, [plan, onStartExecution, executeAgent, executionIdeaContext, pauseBetweenPhases]);

  // Process queued messages when AI finishes thinking - combine all into one message
  useEffect(() => {
    if (!isAgentThinking && queuedMessages.length > 0 && !isProcessingQueueRef.current) {
      isProcessingQueueRef.current = true;

      // Combine all queued messages into one
      const combinedContent = queuedMessages.map(msg => msg.content).join('\n');
      setQueuedMessages([]);

      // Send as a single message
      sendAgentMessage(combinedContent);

      isProcessingQueueRef.current = false;
    }
  }, [isAgentThinking, queuedMessages, sendAgentMessage]);

  const handleChatSubmit = useCallback(async (data: ChatInputSubmitData) => {
    const { content } = data;
    if (!content.trim()) return;

    // For new ideas, create immediately on first message so it appears in kanban
    if (isNewIdea && !currentIdea && !ideaCreatedForSessionRef.current) {
      ideaCreatedForSessionRef.current = true;
      log.log(' Creating idea immediately on first message', {
        initialTitle,
        initialTopicIds,
        workspaceId,
      });

      // Store the message to send after agent reconnects with new ideaId
      // The agent will disconnect/reconnect when currentIdea changes, so we can't send immediately
      pendingFirstMessageRef.current = content.trim();
      reconnectStateRef.current = 'waiting-for-disconnect';

      try {
        const newIdea = await createIdea({
          title: initialTitle || 'Untitled Idea',
          summary: 'Processing...',
          tags: [],
          workspaceId,
          topicIds: initialTopicIds,
          // Pass documentRoomName so server can link agent session to real ideaId
          documentRoomName: documentId,
        });
        log.log(` Idea created immediately: ${newIdea.id}, documentRoomName: ${documentId}`);
        setCurrentIdea(newIdea);
        // Notify parent so it can track this idea (for close/reopen scenarios)
        // Note: Don't call onSuccess - that would close the dialog.
        onIdeaCreated?.(newIdea);
      } catch (err) {
        log.error(' Failed to create idea immediately:', err);
        ideaCreatedForSessionRef.current = false;
        pendingFirstMessageRef.current = null;
        reconnectStateRef.current = 'idle';
        // Continue anyway - the message will still be sent below
      }

      // Clear input and return - the effect will send the message once connected
      chatInputRef.current?.clear();
      inputContentRef.current = '';
      return;
    }

    // If AI is busy, queue the message
    if (isAgentThinking) {
      const queuedMessage: QueuedMessage = {
        id: `queued-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        content: content.trim(),
        timestamp: Date.now(),
      };
      setQueuedMessages((prev) => [...prev, queuedMessage]);
      chatInputRef.current?.clear();
      inputContentRef.current = '';
      return;
    }

    // Otherwise send immediately
    sendAgentMessage(content.trim());
    chatInputRef.current?.clear();
    inputContentRef.current = '';
  }, [sendAgentMessage, isAgentThinking, isNewIdea, currentIdea, createIdea, workspaceId, initialTopicIds, initialTitle, onIdeaCreated, documentId]);

  const handleInputChange = useCallback((_isEmpty: boolean, content: string) => {
    inputContentRef.current = content;
  }, []);

  // Memoize chatInputProps to prevent re-renders when parent state changes
  const chatInputPlaceholder = !isConnected
    ? "Connecting..."
    : isAgentThinking
      ? "Type to queue message..."
      : "Ask the agent... (type / for commands, ^ for topics)";

  const chatInputHistoryKey = `idea-agent-${idea?.id || 'new'}`;

  const chatInputProps = useMemo(() => ({
    placeholder: chatInputPlaceholder,
    onSubmit: handleChatSubmit,
    onChange: handleInputChange,
    historyKey: chatInputHistoryKey,
    fullWidth: true,
    commands,
    onCommand: handleCommand,
    topics: topicReferences as ChatTopicReference[],
  }), [chatInputPlaceholder, handleChatSubmit, handleInputChange, chatInputHistoryKey, commands, handleCommand, topicReferences]);

  const removeQueuedMessage = useCallback((id: string) => {
    setQueuedMessages((prev) => prev.filter((msg) => msg.id !== id));
  }, []);

  const handleClearChat = useCallback(() => {
    clearHistory();
  }, [clearHistory]);

  // Handle link clicks in chat messages
  const handleLinkClick = useCallback((href: string) => {
    log.log('Link clicked', {
      href,
      openQuestions: openQuestions?.length ?? 0,
      hasQuestions: !!openQuestions && openQuestions.length > 0,
    });
    if (href === '#resolve') {
      if (openQuestions && openQuestions.length > 0) {
        setShowQuestionsResolver(true);
      } else {
        log.warn(' Cannot resolve questions - openQuestions is empty or null. Questions are not persisted across sessions.');
      }
    }
  }, [openQuestions, setShowQuestionsResolver]);

  // Handle opening working directory in VSCode
  const handleOpenWorkingDirectory = useCallback(async (path: string) => {
    if (!user) return;
    try {
      // Use the existing open-path endpoint to open the directory in VS Code
      const response = await fetch('/api/topics/open-path', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({ filePath: path, editor: 'vscode' }),
      });
      if (!response.ok) {
        log.error(' Failed to open working directory:', await response.text());
      }
    } catch (err) {
      log.error(' Error opening working directory:', err);
    }
  }, [user]);

  // Disk provider for folder picker
  const diskProvider = useMemo(() => new DiskItemProvider({ baseUrl: '/api/fs' }), []);

  // Handle folder selection from picker dialog
  const handleWorkingDirectorySelect = useCallback((path: string) => {
    setPlan(prev => prev ? { ...prev, workingDirectory: path } : { phases: [], workingDirectory: path, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    setShowDirectoryPrompt(false);
  }, []);

  // NOTE: Questions resolver is now only shown when user clicks the "[resolve N questions](#resolve)" link
  // This gives the user control over when to answer questions rather than interrupting their flow

  // Empty state for chat panel
  const chatEmptyState = (
    <div className={styles.chatEmptyState}>
      <h3>Chat with the {agentName}</h3>
      <p>
        {phase === 'executing'
          ? 'The Execute Agent is implementing your plan. Ask questions or provide guidance.'
          : phase === 'planning'
            ? 'Ask for implementation plans, architecture diagrams, or UI mockups.'
            : isNewIdea
              ? 'Start typing in the editor, then ask the agent to help you develop your idea.'
              : 'Ask questions, brainstorm, or get suggestions to improve your idea.'}
      </p>
    </div>
  );

  const overlay = (
    <div
      className={`${styles.backdrop} ${isBackdropVisible ? styles.open : ''}`}
      role="dialog"
      aria-modal={open}
      aria-label="Idea workspace"
      aria-hidden={!open}
    >
      <Slide
        isVisible={open}
        direction="up"
        duration={250}
        distance={30}
        fade
      >
        <div
          className={styles.overlay}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <header className={styles.header}>
            <div className={styles.headerLeft}>
              <h1 className={styles.headerTitle}>
                {phase === 'executing'
                  ? 'Execute Your Plan'
                  : phase === 'planning'
                    ? 'Plan Your Idea'
                    : isNewIdea
                      ? 'Create Your Idea'
                      : 'Edit Idea'}
              </h1>
              {linkedTopics.length > 0 && (
                <div className={styles.linkedTopics}>
                  <span className={styles.linkedTopicsLabel}>for</span>
                  {linkedTopics.map(topic => (
                    <span key={topic.id} className={styles.topicBadge}>
                      {topic.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className={styles.headerActions}>
              {/* Play/Pause button during execution */}
              {phase === 'executing' && executeAgent.isExecuting && (
                <IconButton
                  icon={<PauseIcon />}
                  variant="ghost"
                  size="md"
                  onClick={executeAgent.pauseExecution}
                  aria-label="Pause execution"
                />
              )}
              {phase === 'executing' && executeAgent.isPaused && (
                <IconButton
                  icon={<PlayIcon />}
                  variant="primary"
                  size="md"
                  onClick={executeAgent.resumeExecution}
                  aria-label="Resume execution"
                />
              )}
              {onMaximize && ideaId && (
                <IconButton
                  icon={<MaximizeIcon />}
                  variant="ghost"
                  size="md"
                  onClick={() => onMaximize(ideaId)}
                  aria-label="Open full page"
                />
              )}
              <IconButton
                icon={<CloseIcon />}
                variant="ghost"
                size="md"
                onClick={handleCloseRequest}
                aria-label="Close"
              />
            </div>
          </header>

          {/* Main content */}
          <div className={styles.content}>
            <SplitPane
              orientation="horizontal"
              defaultSize="40%"
              minSize={300}
              first={
                <div className={styles.chatPane}>
                  <ChatLayout
                    messages={chatMessages}
                    emptyState={chatEmptyState}
                    onLinkClick={handleLinkClick}
                    header={
                      <div className={styles.chatHeader}>
                        <span className={styles.chatTitle}>{phase === 'executing' ? 'Execute Agent' : phase === 'planning' ? 'Plan Agent' : 'Idea Agent'}</span>
                        <span className={`${styles.connectionStatus} ${isConnected || isAgentRunning ? styles.connected : ''}`}>
                          {isEditingDocument ? 'Editing document...' : isAgentRunning ? 'Running...' : isConnected ? 'Connected' : 'Disconnected'}
                        </span>
                        {tokenUsage && (
                          <span className={styles.tokenUsage}>
                            {tokenUsage.inputTokens + tokenUsage.outputTokens} tokens
                          </span>
                        )}
                        <IconButton
                          icon={<TrashIcon />}
                          variant="ghost"
                          size="sm"
                          onClick={handleClearChat}
                          aria-label="Clear chat"
                          disabled={!isConnected}
                        />
                      </div>
                    }
                    isThinking={isAgentThinking}
                    thinkingIndicatorProps={thinkingIndicatorProps}
                    queuedMessages={queuedMessages}
                    onRemoveQueuedMessage={removeQueuedMessage}
                    chatInputRef={chatInputRef}
                    chatInputProps={chatInputProps}
                  />

                  {/* Open Questions Resolver Overlay */}
                  {showQuestionsResolver && openQuestions && openQuestions.length > 0 && (
                    <div className={styles.questionsResolverOverlay}>
                      <OpenQuestionsResolver
                        questions={openQuestions}
                        onComplete={resolveQuestions}
                        onDismiss={() => setShowQuestionsResolver(false)}
                        variant="centered"
                      />
                    </div>
                  )}
                </div>
              }
              second={
                <div className={styles.resourcesPane}>
                  {/* VS Code-style tab bar */}
                  <div className={styles.tabBar}>
                    <button
                      className={`${styles.tab} ${activeTab === 'idea-doc' ? styles.active : ''}`}
                      onClick={() => setActiveTab('idea-doc')}
                      role="tab"
                      aria-selected={activeTab === 'idea-doc'}
                    >
                      <FileIcon size={16} />
                      Idea
                    </button>
                    {(phase === 'planning' || phase === 'executing') && (
                      <>
                        <button
                          className={`${styles.tab} ${activeTab === 'impl-plan' ? styles.active : ''}`}
                          onClick={() => setActiveTab('impl-plan')}
                          role="tab"
                          aria-selected={activeTab === 'impl-plan'}
                        >
                          <EditIcon size={16} />
                          Design
                        </button>
                        <button
                          className={`${styles.tab} ${activeTab === 'exec-plan' ? styles.active : ''}`}
                          onClick={() => setActiveTab('exec-plan')}
                          role="tab"
                          aria-selected={activeTab === 'exec-plan'}
                        >
                          <ListIcon size={16} />
                          Tasks
                          {plan?.phases && plan.phases.length > 0 && (
                            <span className={styles.tabBadge}>
                              {plan.phases.length}
                            </span>
                          )}
                        </button>
                      </>
                    )}
                    {phase === 'executing' && (
                      <button
                        className={`${styles.tab} ${activeTab === 'activity' ? styles.active : ''}`}
                        onClick={() => setActiveTab('activity')}
                        role="tab"
                        aria-selected={activeTab === 'activity'}
                      >
                        <ClockIcon size={16} />
                        Activity
                      </button>
                    )}
                  </div>

                  {/* Tab content */}
                  <div className={styles.tabContent}>
                    {activeTab === 'idea-doc' && (
                      <div className={styles.tabPanel}>
                        {/* Key based on documentId ensures fresh editor for each idea */}
                        {/* Use defaultValue (uncontrolled) when using Yjs to avoid conflicts with ySync */}
                        {/* Only render editor when Yjs is synced to avoid content/extension mismatch */}
                        {isYjsSynced ? (
                          <MarkdownCoEditor
                            key={`editor-${documentId}`}
                            defaultValue={content}
                            onChange={handleEditorChange}
                            defaultMode={viewMode}
                            onModeChange={setViewMode}
                            placeholder="Start writing your idea..."
                            fullPage
                            extensions={yjsExtensions}
                            disableBuiltInHistory
                            coAuthors={coAuthors}
                            pauseScrollSync={isEditingDocument}
                          />
                        ) : (
                          <div className={styles.editorLoading}>
                            <Spinner size="lg" />
                          </div>
                        )}
                      </div>
                    )}
                    {activeTab === 'impl-plan' && (
                      <div className={styles.tabPanel}>
                        {/* Implementation Plan markdown document */}
                        {/* Only render editor when Yjs is synced to avoid content/extension mismatch */}
                        {isImplPlanYjsSynced ? (
                          <MarkdownCoEditor
                            key={`impl-plan-editor-${implPlanDocumentId}`}
                            defaultValue={implPlanContent}
                            onChange={setImplPlanContent}
                            defaultMode={implPlanViewMode}
                            onModeChange={setImplPlanViewMode}
                            placeholder="Start writing your implementation plan..."
                            fullPage
                            extensions={implPlanYjsExtensions}
                            disableBuiltInHistory
                            coAuthors={implPlanCoAuthors}
                            pauseScrollSync={isEditingDocument && phase === 'planning'}
                          />
                        ) : (
                          <div className={styles.editorLoading}>
                            <Spinner size="lg" />
                          </div>
                        )}
                      </div>
                    )}
                    {activeTab === 'exec-plan' && (
                      <div className={styles.tabPanel}>
                        <PlanView
                          plan={plan && plan.phases && plan.phases.length > 0 ? {
                            phases: plan.phases,
                            workingDirectory: plan.workingDirectory || '',
                            createdAt: plan.createdAt || new Date().toISOString(),
                            updatedAt: plan.updatedAt || new Date().toISOString(),
                          } : null}
                          showWorkingDirectory
                          onOpenWorkingDirectory={handleOpenWorkingDirectory}
                        />
                      </div>
                    )}
                    {activeTab === 'activity' && (
                      <div className={styles.tabPanel}>
                        <ActivityView
                          revisions={activityRevisions.revisions}
                          isLoading={activityRevisions.isLoading}
                          error={activityRevisions.error}
                          fetchDiff={activityRevisions.fetchDiff}
                        />
                      </div>
                    )}
                  </div>

                  {/* Error banner */}
                  {error && (
                    <div className={styles.errorBanner}>
                      <span>{error}</span>
                      <Button variant="ghost" size="sm" onClick={() => setError(null)}>
                        Dismiss
                      </Button>
                    </div>
                  )}
                </div>
              }
            />
          </div>

          {/* Footer - action buttons */}
          <footer className={styles.footer}>
            <div className={styles.footerActions}>
              {phase === 'ideation' && (
                <Button
                  variant="primary"
                  onClick={handleStartPlanning}
                  disabled={isSaving || !parsedContent.title.trim() || parsedContent.title === 'Untitled Idea' || !parsedContent.summary.trim()}
                  icon={<ArrowRightIcon />}
                >
                  Next: Planning
                </Button>
              )}
              {phase === 'planning' && (
                <Button
                  variant="primary"
                  onClick={handleStartExecution}
                  disabled={!isPlanReady || isAgentThinking}
                  icon={<PlayIcon />}
                >
                  Execute
                </Button>
              )}
              {phase === 'executing' && (
                <>
                  <Checkbox
                    checked={pauseBetweenPhases}
                    onChange={(e) => setPauseBetweenPhases(e.target.checked)}
                    label="Pause between phases"
                  />
                  {executeAgent.isExecuting && (
                    <Button
                      variant="ghost"
                      onClick={executeAgent.pauseExecution}
                    >
                      Pause
                    </Button>
                  )}
                  {executeAgent.isPaused && (
                    <Button
                      variant="primary"
                      onClick={executeAgent.resumeExecution}
                      icon={<PlayIcon />}
                    >
                      Resume
                    </Button>
                  )}
                  {isExecutionBlocked && executionBlockedEvent && (
                    <div className={styles.blockedIndicator}>
                      <span className={styles.blockedText}>Waiting for input</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </footer>
        </div>
      </Slide>

      {/* Folder picker dialog for working directory selection */}
      <ItemPickerDialog
        open={showDirectoryPrompt}
        onClose={() => setShowDirectoryPrompt(false)}
        onSelect={handleWorkingDirectorySelect}
        provider={diskProvider}
        filter={{ types: ['folder'] }}
        title="Select Working Directory"
        selectLabel="Select"
      />
    </div>
  );

  return createPortal(overlay, document.body);
}

IdeaDialog.displayName = 'IdeaDialog';

export default IdeaDialog;
