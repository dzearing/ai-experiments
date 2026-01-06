import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Slide, Button, IconButton, SplitPane, Spinner, Checkbox } from '@ui-kit/react';
import { CloseIcon } from '@ui-kit/icons/CloseIcon';
import { TrashIcon } from '@ui-kit/icons/TrashIcon';
import { ArrowRightIcon } from '@ui-kit/icons/ArrowRightIcon';
import { PlayIcon } from '@ui-kit/icons/PlayIcon';
import { PauseIcon } from '@ui-kit/icons/PauseIcon';
import { FileIcon } from '@ui-kit/icons/FileIcon';
import { ListIcon } from '@ui-kit/icons/ListIcon';
import { EditIcon } from '@ui-kit/icons/EditIcon';
import { ChatPanel, ChatInput, ThinkingIndicator, MessageQueue, OpenQuestionsResolver, type ChatInputSubmitData, type ChatInputRef, type ChatPanelMessage, type QueuedMessage, type ThingReference as ChatThingReference } from '@ui-kit/react-chat';
import { MarkdownCoEditor, type ViewMode, type CoAuthor } from '@ui-kit/react-markdown';
import { ItemPickerDialog, DiskItemProvider } from '@ui-kit/react-pickers';
import { useAuth } from '../../contexts/AuthContext';
import { useIdeas } from '../../contexts/IdeasContext';
import { useThings } from '../../contexts/ThingsContext';
import { useIdeaAgent, type IdeaContext } from '../../hooks/useIdeaAgent';
import { usePlanAgent, type PlanIdeaContext, type ParentThingContext } from '../../hooks/usePlanAgent';
import { useExecutionAgent, type ExecutionIdeaContext } from '../../hooks/useExecutionAgent';
import { useYjsCollaboration } from '../../hooks/useYjsCollaboration';
import { useChatCommands } from '../../hooks/useChatCommands';
import { useModelPreference } from '../../hooks/useModelPreference';
import { useActivityRevisions } from '../../hooks/useActivityRevisions';
import { PlanView } from '../PlanView';
import { ActivityView } from '../ActivityView';
import { ClockIcon } from '@ui-kit/icons/ClockIcon';
import { YJS_WS_URL } from '../../config';
import type { Idea, CreateIdeaInput, IdeaPlan } from '../../types/idea';
import { THING_TYPE_SCHEMAS } from '../../types/thing';
import styles from './IdeaDialog.module.css';

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
function stripStructuredEvents(text: string): string {
  return text
    .replace(/<task_complete>\s*[\s\S]*?\s*<\/task_complete>/g, '')
    .replace(/<phase_complete>\s*[\s\S]*?\s*<\/phase_complete>/g, '')
    .replace(/<execution_blocked>\s*[\s\S]*?\s*<\/execution_blocked>/g, '')
    .replace(/<new_idea>\s*[\s\S]*?\s*<\/new_idea>/g, '')
    .replace(/<task_update>\s*[\s\S]*?\s*<\/task_update>/g, '')
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

/** Thing context for contextual greetings */
export interface ThingContext {
  id: string;
  name: string;
  type: string;
  description?: string;
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
  /** Thing IDs to pre-link when creating a new idea */
  initialThingIds?: string[];
  /** Thing context for contextual greetings when creating ideas for a Thing */
  initialThingContext?: ThingContext;
  /** Callback when idea status changes (e.g., moves to planning) - for kanban updates */
  onStatusChange?: (idea: Idea, newStatus: string) => void;
  /** Initial prompt to automatically send to the idea agent when creating a new idea */
  initialPrompt?: string;
  /** Initial greeting from the agent (overrides the generated greeting) */
  initialGreeting?: string;
  /** Initial phase when opening an existing idea */
  initialPhase?: WorkspacePhase;
  /** Callback when user wants to start execution with a plan */
  onStartExecution?: (plan: IdeaPlan) => void;
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
  initialThingIds,
  initialThingContext,
  onStatusChange,
  initialPrompt,
  initialGreeting,
  initialPhase,
  onStartExecution,
}: IdeaDialogProps) {
  // Debug: track this instance
  const instanceIdRef = useRef(++overlayInstanceId);
  useEffect(() => {
    console.log(`[IdeaDialog #${instanceIdRef.current}] MOUNTED, idea=${idea?.id || 'new'}, open=${open}`);
    return () => {
      console.log(`[IdeaDialog #${instanceIdRef.current}] UNMOUNTED`);
    };
  }, []); // Only run on mount/unmount

  const { user } = useAuth();
  const { createIdea, updateIdea, moveIdea } = useIdeas();
  const { things, getThingReferences } = useThings();
  const { modelId, setModelId, modelInfo } = useModelPreference();

  const isNewIdea = !idea;

  // Get linked things for display
  const linkedThings = useMemo(() => {
    // For new ideas, use initialThingIds; for existing ideas, use idea.thingIds
    const thingIds = idea?.thingIds || initialThingIds || [];
    if (thingIds.length === 0) return [];
    return things.filter(t => thingIds.includes(t.id));
  }, [idea?.thingIds, initialThingIds, things]);

  // Get parent things with execution context (folders, repos with localPath)
  // This helps the plan agent suggest appropriate working directories
  const parentThingsWithContext: ParentThingContext[] = useMemo(() => {
    return linkedThings
      .filter(thing => {
        const schema = THING_TYPE_SCHEMAS[thing.type];
        return schema?.providesExecutionContext && thing.properties?.localPath;
      })
      .map(thing => ({
        id: thing.id,
        name: thing.name,
        type: thing.type,
        localPath: thing.properties?.localPath,
      }));
  }, [linkedThings]);

  // Get thing references for chat autocomplete (^ mentions)
  const thingReferences = getThingReferences();

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

  // Sync idea prop to currentIdea when overlay opens or idea changes
  // This is critical for plan persistence - useState only runs on first render,
  // so when overlay reopens with updated idea (containing plan), we need to sync it
  useEffect(() => {
    if (open && idea) {
      console.log('[IdeaWorkspaceOverlay] Syncing idea prop to currentIdea:', idea.id, 'plan phases:', idea.plan?.phases?.length || 0);
      setCurrentIdea(idea);
    }
  }, [open, idea]);

  // Sync phase when overlay opens based on idea status
  // This ensures we go directly to the right phase when reopening an idea
  useEffect(() => {
    if (open && idea?.status === 'executing') {
      console.log('[IdeaWorkspaceOverlay] Syncing phase to executing for executing idea');
      setPhase('executing');
    } else if (open && idea?.status === 'exploring') {
      console.log('[IdeaWorkspaceOverlay] Syncing phase to planning for exploring idea');
      setPhase('planning');
    }
  }, [open, idea?.status]);

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
      console.log('[IdeaWorkspaceOverlay] Syncing initial plan to local state:', initialPlan.phases.length, 'phases');
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
  // Track empty state separately (changes less frequently) for escape hint
  const [isInputEmpty, setIsInputEmpty] = useState(true);
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
    console.log('[IdeaWorkspace] implPlanDocumentId computed:', id, { currentIdeaId: currentIdea?.id, ideaId: idea?.id, phase });
    return id;
  }, [currentIdea?.id, idea?.id, phase]);

  // Implementation Plan content state
  const [implPlanContent, setImplPlanContent] = useState('');
  const [implPlanViewMode, setImplPlanViewMode] = useState<ViewMode>('preview');

  // Yjs collaboration for Implementation Plan (only in planning phase)
  const implPlanServerUrl = phase === 'planning' && implPlanDocumentId ? YJS_WS_URL : undefined;

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
      console.log('[IdeaWorkspace] Impl Plan content changed, length:', newContent.length, 'preview:', newContent.slice(0, 100));
      setImplPlanContent(newContent);
    },
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
        thingContext: initialThingContext,
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
      thingContext: initialThingContext,
    };
  }, [idea, parsedContent, initialThingContext, isInitialized]);

  // Stable error handler to prevent unnecessary reconnects
  const handleAgentError = useCallback((err: string) => {
    console.error('[IdeaWorkspace] Agent error:', err);
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
    // Include parent things with execution context (folders, repos) for working directory suggestions
    parentThings: parentThingsWithContext.length > 0 ? parentThingsWithContext : undefined,
  }), [currentIdea, idea, parsedContent, parentThingsWithContext]);

  // Idea agent hook - only enabled when overlay is open AND in ideation phase
  const ideaAgent = useIdeaAgent({
    ideaId: idea?.id || null,
    userId: user?.id || '',
    userName: user?.name || 'Anonymous',
    ideaContext,
    documentRoomName: documentId,
    initialGreeting,
    onError: handleAgentError,
    enabled: open && phase === 'ideation',
    modelId,
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
    setPlan(prev => {
      if (!prev?.phases) return prev;
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

  // Auto-continue to next phase when a phase completes and pauseBetweenPhases is false
  useEffect(() => {
    const phases = plan?.phases;
    if (!completedPhaseId || !phases || pauseBetweenPhasesRef.current) return;

    // Prevent duplicate execution if already in progress
    if (autoContinueInProgressRef.current) return;

    // Find the index of the completed phase
    const completedIndex = phases.findIndex(p => p.id === completedPhaseId);
    const nextPhase = completedIndex >= 0 && completedIndex < phases.length - 1
      ? phases[completedIndex + 1]
      : null;

    if (nextPhase) {
      // Mark as in progress to prevent duplicate triggers
      autoContinueInProgressRef.current = true;

      // Small delay before starting next phase
      const timerId = setTimeout(() => {
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
        executeAgent.startExecution(executionIdeaContext, fullPlan, nextPhase.id);
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
      setCompletedPhaseId(null);
    }
  }, [completedPhaseId, plan, executeAgent, executionIdeaContext]);

  // Activity revisions hook - for Activity tab
  const activityRevisions = useActivityRevisions({
    ideaId: currentIdea?.id || idea?.id || '',
    enabled: open && activeTab === 'activity' && !!(currentIdea?.id || idea?.id),
    refreshInterval: phase === 'executing' ? 5000 : 0, // Auto-refresh during execution
  });

  // Select active agent based on phase
  const activeAgent = phase === 'executing'
    ? { ...executeAgent, isLoading: executeAgent.isExecuting, openQuestions: null, suggestedResponses: null, showQuestionsResolver: false, setShowQuestionsResolver: () => {}, resolveQuestions: () => {}, clearHistory: executeAgent.clearMessages, cancelRequest: executeAgent.cancelExecution }
    : phase === 'planning' ? planAgent : ideaAgent;
  const agentMessages = activeAgent.messages;
  const isConnected = activeAgent.isConnected;
  const isAgentThinking = activeAgent.isLoading;
  const tokenUsage = activeAgent.tokenUsage;
  const sendAgentMessage = activeAgent.sendMessage;
  const addLocalMessage = activeAgent.addLocalMessage;
  const clearHistory = activeAgent.clearHistory;
  const cancelRequest = activeAgent.cancelRequest;

  // Agent-specific properties that depend on phase
  const isEditingDocument = phase === 'executing'
    ? false
    : phase === 'planning'
      ? planAgent.isEditingDocument
      : ideaAgent.isEditingDocument;
  const openQuestions = phase === 'executing'
    ? null
    : phase === 'planning'
      ? planAgent.openQuestions
      : ideaAgent.openQuestions;
  const showQuestionsResolver = phase === 'executing'
    ? false
    : phase === 'planning'
      ? planAgent.showQuestionsResolver
      : ideaAgent.showQuestionsResolver;
  const setShowQuestionsResolver = phase === 'executing'
    ? (() => {})
    : phase === 'planning'
      ? planAgent.setShowQuestionsResolver
      : ideaAgent.setShowQuestionsResolver;
  const resolveQuestions = phase === 'executing'
    ? (() => {})
    : phase === 'planning'
      ? planAgent.resolveQuestions
      : ideaAgent.resolveQuestions;
  const updateIdeaContext = ideaAgent.updateIdeaContext;

  // Execution-specific state
  const isExecutionBlocked = phase === 'executing' && executeAgent.isBlocked;
  const executionBlockedEvent = phase === 'executing' ? executeAgent.blockedEvent : null;

  // Update the agent when ideaContext changes (especially thingContext)
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

        // Get toolCalls from execution messages (if present)
        // ExecutionToolCall and ChatMessageToolCall have the same shape
        const toolCalls = 'toolCalls' in msg ? msg.toolCalls : undefined;

        // Skip empty messages after stripping (unless they have tool calls)
        if (!cleanContent && !toolCalls?.length && msg.role === 'assistant') return null;

        return {
          id: msg.id,
          content: cleanContent,
          timestamp: msg.timestamp,
          senderName: msg.role === 'user' ? (user?.name || 'You') : agentName,
          senderColor: msg.role === 'user' ? undefined : '#8b5cf6',
          isOwn: msg.role === 'user',
          isStreaming: msg.isStreaming,
          renderMarkdown: true, // Render markdown for all messages (including user's question answers)
          toolCalls, // Pass tool calls through for proper rendering
        };
      })
      .filter((msg): msg is ChatPanelMessage => msg !== null);
  }, [agentMessages, user?.name, agentName]);

  // Get suggested responses from the active agent based on current phase
  const agentSuggestedResponses = phase === 'planning'
    ? planAgent.suggestedResponses
    : ideaAgent.suggestedResponses;

  // Use agent-provided suggestions or empty array if none
  const footerSuggestions = agentSuggestedResponses || [];

  // Detect room changes and prepare for migration
  useEffect(() => {
    if (prevDocumentIdRef.current && prevDocumentIdRef.current !== documentId) {
      // Room is changing - capture current content for migration
      // This runs BEFORE the Yjs hook switches rooms
      console.log('[IdeaWorkspace] Room changing, capturing content for migration');
      setPendingContentMigration(content);
      setIsInitialized(false);
    }
    prevDocumentIdRef.current = documentId;
  }, [documentId, content]);

  // Initialize Yjs document content when synced
  useEffect(() => {
    if (!isYjsSynced || isInitialized) return;

    // Check if we have pending content from a room migration (new idea -> saved idea)
    if (pendingContentMigration) {
      console.log('[IdeaWorkspace] Migrating content to new Yjs room');
      yjsSetContent(pendingContentMigration);
      lastSavedContent.current = pendingContentMigration;
      hasDocumentChanges.current = false;
      setPendingContentMigration(null);
      setIsInitialized(true);
      setError(null);
      return;
    }

    // Build initial content from idea or empty template
    const initialContent = idea
      ? buildMarkdownContent(idea.title, idea.summary, idea.tags, idea.description)
      : buildMarkdownContent('', '', [], '');

    // For existing ideas: always initialize from saved data
    // (Yjs room name changes when idea gets saved, so we need to restore from idea data)
    // For new ideas: only set if document is empty
    if (idea || content.length === 0) {
      yjsSetContent(initialContent);
    }

    // Track initial content so we can detect actual changes
    lastSavedContent.current = initialContent;
    hasDocumentChanges.current = false;

    setIsInitialized(true);
    setError(null);
  }, [isYjsSynced, isInitialized, idea, content, yjsSetContent, pendingContentMigration]);

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
    console.log('[IdeaWorkspace] isImplPlanYjsSynced changed:', isImplPlanYjsSynced, { phase, planAgentConnected: planAgent.isConnected, implPlanDocumentId });
  }, [isImplPlanYjsSynced, phase, planAgent.isConnected, implPlanDocumentId]);

  // Signal to the Plan Agent that Yjs is ready when the impl plan syncs
  // This allows the agent to start writing to the document without race conditions
  useEffect(() => {
    if (phase === 'planning' && isImplPlanYjsSynced && planAgent.isConnected) {
      console.log('[IdeaWorkspace] Impl plan Yjs synced, sending yjs_ready to server. Room:', implPlanDocumentId);
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

  // Send initial prompt to agent when overlay opens and agent is connected
  // Use sendSilentMessage so the user's prompt doesn't appear in the chat
  // (they already typed it in the facilitator chat)
  useEffect(() => {
    if (open && isConnected && initialPrompt && !initialPromptSentRef.current && phase === 'ideation') {
      // Mark as sent immediately to prevent double-sending
      initialPromptSentRef.current = true;
      // Small delay to ensure agent is ready
      const timerId = setTimeout(() => {
        sendSilentMessageRef.current(initialPrompt);
      }, 500);
      return () => clearTimeout(timerId);
    }
    // Reset the flag when overlay closes
    if (!open) {
      initialPromptSentRef.current = false;
    }
  }, [open, isConnected, initialPrompt, phase]);

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

  // Handle escape key - cancel if busy, otherwise close
  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // If AI is busy and input is empty, cancel the operation
        if (isAgentThinking && !inputContentRef.current.trim()) {
          event.preventDefault();
          handleCancelOperation();
          return;
        }

        // If input has text, let the ChatInput handle Escape (clear input)
        if (inputContentRef.current.trim()) {
          return;
        }

        // Otherwise close (auto-save will handle valid content)
        event.preventDefault();
        handleCloseRequest();
      }
    },
    [isAgentThinking, handleCancelOperation, handleCloseRequest]
  );

  // Add/remove escape key listener when open
  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, handleEscape]);

  // Update agent context when form changes
  useEffect(() => {
    if (ideaContext && isConnected) {
      updateIdeaContext(ideaContext);
    }
  }, [ideaContext, isConnected, updateIdeaContext]);

  // Track if document has been modified (for auto-save)
  const hasDocumentChanges = useRef(false);
  const lastSavedContent = useRef<string>('');

  // Track changes to document content
  useEffect(() => {
    if (isInitialized && content !== lastSavedContent.current) {
      hasDocumentChanges.current = true;
    }
  }, [content, isInitialized]);

  // Debounced auto-save during ideation phase
  // This ensures ideas are persisted as soon as meaningful content exists
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    // Only auto-save during ideation phase when document changes
    if (!isInitialized || phase !== 'ideation' || !hasDocumentChanges.current) return;

    const { title, summary, tags, description } = parsedContent;

    // Don't save if content is minimal/placeholder
    if (!title.trim() || title === 'Untitled Idea' || !summary.trim()) return;

    // Clear any pending save
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Debounce save by 2 seconds
    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        if (currentIdea?.id) {
          // Update existing idea
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
        } else if (!idea) {
          // Create new idea with valid content
          const newIdea = await createIdea({
            title: title.trim(),
            summary: summary.trim(),
            tags,
            description: description.trim() || undefined,
            workspaceId,
            thingIds: initialThingIds,
          });
          setCurrentIdea(newIdea);
          onSuccess?.(newIdea);
          lastSavedContent.current = content;
          hasDocumentChanges.current = false;
        }
      } catch (err) {
        console.error('[IdeaWorkspace] Auto-save during ideation failed:', err);
      }
    }, 2000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [isInitialized, phase, parsedContent, currentIdea, idea, content, updateIdea, createIdea, workspaceId, initialThingIds, onSuccess]);

  // Auto-save ideas when overlay closes
  useEffect(() => {
    // Only auto-save when closing with changes
    if (!open && hasDocumentChanges.current && isInitialized) {
      const { title, summary, tags, description } = parseMarkdownContent(content);

      // Only save if we have valid content
      if (title.trim() && title !== 'Untitled Idea' && summary.trim()) {
        if (idea || currentIdea) {
          // Update existing idea
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
            console.error('[IdeaWorkspace] Auto-save failed:', err);
          });
        } else {
          // Create new idea on close if it has valid content
          const input: CreateIdeaInput = {
            title: title.trim(),
            summary: summary.trim(),
            tags,
            description: description.trim() || undefined,
            workspaceId,
            thingIds: initialThingIds,
          };
          createIdea(input).then((newIdea) => {
            onSuccess?.(newIdea);
          }).catch((err) => {
            console.error('[IdeaWorkspace] Auto-create failed:', err);
          });
        }
      }

      // Reset tracking
      hasDocumentChanges.current = false;
    }
  }, [open, idea, currentIdea, content, isInitialized, updateIdea, createIdea, onSuccess, workspaceId, initialThingIds]);

  // Handle transition to planning mode
  const handleStartPlanning = useCallback(async () => {
    console.log(`[IdeaWorkspaceOverlay #${instanceIdRef.current}] handleStartPlanning START`);
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
        console.log(`[IdeaWorkspaceOverlay #${instanceIdRef.current}] Creating new idea...`);
        const input: CreateIdeaInput = {
          title: title.trim(),
          summary: summary.trim(),
          tags,
          description: description.trim() || undefined,
          workspaceId,
          thingIds: initialThingIds,
        };
        ideaToTransition = await createIdea(input);
        console.log(`[IdeaWorkspaceOverlay #${instanceIdRef.current}] Idea created: ${ideaToTransition.id}`);
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
      console.log(`[IdeaWorkspaceOverlay #${instanceIdRef.current}] Moving idea to exploring status...`);
      await moveIdea(ideaToTransition.id, 'exploring');
      const transitionedIdea = { ...ideaToTransition, status: 'exploring' as const };

      // Update local state - this will change documentId which triggers the
      // room change detection effect to capture content for migration
      console.log(`[IdeaWorkspaceOverlay #${instanceIdRef.current}] Setting currentIdea...`);
      setCurrentIdea(transitionedIdea);

      // Notify parent for kanban update (but don't close)
      console.log(`[IdeaWorkspaceOverlay #${instanceIdRef.current}] Calling onStatusChange...`);
      onStatusChange?.(transitionedIdea, 'exploring');

      // Transition to planning phase in the UI
      console.log(`[IdeaWorkspaceOverlay #${instanceIdRef.current}] Setting phase to planning...`);
      setPhase('planning');
      // Switch to Implementation Plan tab when entering planning phase
      setActiveTab('impl-plan');
      console.log(`[IdeaWorkspaceOverlay #${instanceIdRef.current}] handleStartPlanning DONE`);
    } catch (err) {
      console.error(`[IdeaWorkspaceOverlay #${instanceIdRef.current}] handleStartPlanning ERROR:`, err);
      setError(err instanceof Error ? err.message : 'Failed to save idea');
    } finally {
      setIsSaving(false);
    }
  }, [parsedContent, isNewIdea, currentIdea, workspaceId, createIdea, updateIdea, moveIdea, onStatusChange, content, initialThingIds]);

  // Check if plan is ready for execution
  const isPlanReady = useMemo(() => {
    return plan?.phases && plan.phases.length > 0 && plan.phases.some(p => p.tasks && p.tasks.length > 0);
  }, [plan]);

  // State for showing directory picker prompt
  const [showDirectoryPrompt, setShowDirectoryPrompt] = useState(false);

  // Handle starting execution with the plan
  const handleStartExecution = useCallback(() => {
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
    onStartExecution?.(fullPlan);
    setPhase('executing');
    setActiveTab('exec-plan');
    // Start execution with the first phase
    const firstPhaseId = fullPlan.phases[0].id;
    executeAgent.startExecution(executionIdeaContext, fullPlan, firstPhaseId);
  }, [plan, onStartExecution, executeAgent, executionIdeaContext]);

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

  const handleChatSubmit = useCallback((data: ChatInputSubmitData) => {
    const { content } = data;
    if (!content.trim()) return;

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
      setIsInputEmpty(true);
      return;
    }

    // Otherwise send immediately
    sendAgentMessage(content.trim());
    chatInputRef.current?.clear();
    inputContentRef.current = '';
    setIsInputEmpty(true);
  }, [sendAgentMessage, isAgentThinking]);

  const handleInputChange = useCallback((isEmpty: boolean, content: string) => {
    inputContentRef.current = content;
    // Only update state when empty status changes to minimize re-renders
    setIsInputEmpty(prev => prev !== isEmpty ? isEmpty : prev);
  }, []);

  const removeQueuedMessage = useCallback((id: string) => {
    setQueuedMessages((prev) => prev.filter((msg) => msg.id !== id));
  }, []);

  const handleClearChat = useCallback(() => {
    clearHistory();
  }, [clearHistory]);

  // Handle link clicks in chat messages
  const handleLinkClick = useCallback((href: string) => {
    console.log('[IdeaWorkspaceOverlay] Link clicked:', href, {
      openQuestions: openQuestions?.length ?? 0,
      hasQuestions: !!openQuestions && openQuestions.length > 0,
    });
    if (href === '#resolve') {
      if (openQuestions && openQuestions.length > 0) {
        setShowQuestionsResolver(true);
      } else {
        console.warn('[IdeaWorkspaceOverlay] Cannot resolve questions - openQuestions is empty or null. Questions are not persisted across sessions.');
      }
    }
  }, [openQuestions, setShowQuestionsResolver]);

  // Handle opening working directory in VSCode
  const handleOpenWorkingDirectory = useCallback(async (path: string) => {
    if (!user) return;
    try {
      // Use the existing open-path endpoint to open the directory in VS Code
      const response = await fetch('/api/things/open-path', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({ filePath: path, editor: 'vscode' }),
      });
      if (!response.ok) {
        console.error('[IdeaDialog] Failed to open working directory:', await response.text());
      }
    } catch (err) {
      console.error('[IdeaDialog] Error opening working directory:', err);
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
              {linkedThings.length > 0 && (
                <div className={styles.linkedThings}>
                  <span className={styles.linkedThingsLabel}>for</span>
                  {linkedThings.map(thing => (
                    <span key={thing.id} className={styles.thingBadge}>
                      {thing.name}
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
                  <div className={styles.chatHeader}>
                    <span className={styles.chatTitle}>{phase === 'executing' ? 'Execute Agent' : phase === 'planning' ? 'Plan Agent' : 'Idea Agent'}</span>
                    <span className={`${styles.connectionStatus} ${isConnected ? styles.connected : ''}`}>
                      {isEditingDocument ? 'Editing document...' : isConnected ? 'Connected' : 'Disconnected'}
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

                  <ChatPanel
                    messages={chatMessages}
                    emptyState={chatEmptyState}
                    className={styles.chatPanel}
                    onLinkClick={handleLinkClick}
                  />

                  <ThinkingIndicator
                    isActive={isAgentThinking}
                    statusText={
                      phase === 'planning'
                        ? planAgent.progress.currentEvent?.displayText
                        : ideaAgent.progress.currentEvent?.displayText
                    }
                    showEscapeHint={isAgentThinking && isInputEmpty}
                  />

                  <MessageQueue
                    messages={queuedMessages}
                    onRemove={removeQueuedMessage}
                  />

                  <div className={styles.chatInputContainer}>
                    <ChatInput
                      ref={chatInputRef}
                      placeholder={!isConnected ? "Connecting..." : isAgentThinking ? "Type to queue message..." : "Ask the agent... (type / for commands, ^ for things)"}
                      onSubmit={handleChatSubmit}
                      onChange={handleInputChange}
                      historyKey={`idea-agent-${idea?.id || 'new'}`}
                      fullWidth
                      commands={commands}
                      onCommand={handleCommand}
                      things={thingReferences as ChatThingReference[]}
                    />
                  </div>

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

          {/* Footer - suggested responses on left, action button on right */}
          <footer className={styles.footer}>
            <div className={styles.footerSuggestions}>
              {footerSuggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => sendAgentMessage(suggestion.message)}
                >
                  {suggestion.label}
                </Button>
              ))}
            </div>
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
