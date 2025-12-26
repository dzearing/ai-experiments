import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Slide, Button, IconButton, SplitPane, Spinner } from '@ui-kit/react';
import { TrashIcon } from '@ui-kit/icons/TrashIcon';
import { ChatPanel, ChatInput, ThinkingIndicator, type ChatInputSubmitData, type ChatInputRef, type ChatPanelMessage } from '@ui-kit/react-chat';
import { MarkdownCoEditor, type ViewMode, type CoAuthor } from '@ui-kit/react-markdown';
import { useAuth } from '../../contexts/AuthContext';
import { useIdeas } from '../../contexts/IdeasContext';
import { useIdeaAgent, type IdeaContext } from '../../hooks/useIdeaAgent';
import { useYjsCollaboration } from '../../hooks/useYjsCollaboration';
import { useChatCommands } from '../../hooks/useChatCommands';
import { YJS_WS_URL } from '../../config';
import type { Idea, CreateIdeaInput } from '../../types/idea';
import styles from './IdeaWorkspaceOverlay.module.css';

// Generate a unique session ID for new ideas
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
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

export interface IdeaWorkspaceOverlayProps {
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
}

/**
 * IdeaWorkspaceOverlay component
 *
 * A large overlay for creating and editing ideas with:
 * - Left pane: Document editor (title, summary, description, tags)
 * - Right pane: Chat with the Idea Agent for brainstorming
 */
export function IdeaWorkspaceOverlay({
  idea,
  open,
  onClose,
  workspaceId,
  onSuccess,
}: IdeaWorkspaceOverlayProps) {
  const { user } = useAuth();
  const { createIdea, updateIdea } = useIdeas();

  const isNewIdea = !idea;

  // Session ID for new ideas - generated once per component instance
  // We use a ref to ensure the session ID is stable during the overlay lifecycle
  // A new session ID is only created when the component remounts (e.g., navigating away and back)
  const [sessionId] = useState(() => generateSessionId());

  // Document ID for Yjs room: idea-doc-{ideaId} or idea-doc-new-{sessionId}
  const documentId = useMemo(() => {
    return idea?.id ? `idea-doc-${idea.id}` : `idea-doc-new-${sessionId}`;
  }, [idea?.id, sessionId]);

  // Document content state (markdown with title, summary, tags, description)
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [isInitialized, setIsInitialized] = useState(false);

  const [isBackdropVisible, setIsBackdropVisible] = useState(open);
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

  // Parse content to get structured fields
  const parsedContent = useMemo(() => parseMarkdownContent(content), [content]);

  // Build idea context for the agent
  const ideaContext: IdeaContext | null = useMemo(() => {
    if (!parsedContent.title.trim()) return null;
    return {
      id: idea?.id || 'new',
      title: parsedContent.title.trim(),
      summary: parsedContent.summary.trim(),
      description: parsedContent.description.trim() || undefined,
      tags: parsedContent.tags,
      status: idea?.status || 'new',
    };
  }, [idea, parsedContent]);

  // Stable error handler to prevent unnecessary reconnects
  const handleAgentError = useCallback((err: string) => {
    console.error('[IdeaWorkspace] Agent error:', err);
  }, []);

  // Idea agent hook
  const {
    messages: agentMessages,
    isConnected,
    isLoading: isAgentThinking,
    isEditingDocument,
    tokenUsage,
    sendMessage: sendAgentMessage,
    addLocalMessage,
    clearHistory,
    updateIdeaContext,
  } = useIdeaAgent({
    ideaId: idea?.id || null,
    userId: user?.id || '',
    userName: user?.name || 'Anonymous',
    ideaContext,
    documentRoomName: documentId,
    onError: handleAgentError,
  });

  // Chat commands (/clear, /help)
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

## Tips

- Describe your idea in the editor on the right
- Ask the agent for feedback, suggestions, or to help refine your idea
- The agent can see your idea's title, summary, and description`,
  });

  // Convert agent messages to ChatPanel format
  const chatMessages: ChatPanelMessage[] = useMemo(() => {
    return agentMessages.map(msg => ({
      id: msg.id,
      content: msg.content,
      timestamp: msg.timestamp,
      senderName: msg.role === 'user' ? (user?.name || 'You') : 'Idea Agent',
      senderColor: msg.role === 'user' ? undefined : '#8b5cf6',
      isOwn: msg.role === 'user',
      isStreaming: msg.isStreaming,
      renderMarkdown: msg.role === 'assistant',
    }));
  }, [agentMessages, user?.name]);

  // Initialize Yjs document content when synced
  useEffect(() => {
    if (!isYjsSynced || isInitialized) return;

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
  }, [isYjsSynced, isInitialized, idea, content, yjsSetContent]);

  // Reset initialized state when overlay closes
  useEffect(() => {
    if (!open) {
      setIsInitialized(false);
    }
  }, [open]);

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

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

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

  // Auto-save existing ideas when overlay closes
  useEffect(() => {
    // Only auto-save when closing an existing idea with changes
    if (!open && idea && hasDocumentChanges.current && isInitialized) {
      const { title, summary, tags, description } = parseMarkdownContent(content);

      // Only save if we have valid content
      if (title.trim() && title !== 'Untitled Idea' && summary.trim()) {
        // Fire and forget - don't wait for this
        updateIdea(idea.id, {
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
      }

      // Reset tracking
      hasDocumentChanges.current = false;
    }
  }, [open, idea, content, isInitialized, updateIdea, onSuccess]);

  const handleSave = useCallback(async () => {
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
      if (isNewIdea) {
        const input: CreateIdeaInput = {
          title: title.trim(),
          summary: summary.trim(),
          tags,
          description: description.trim() || undefined,
          workspaceId,
        };
        const newIdea = await createIdea(input);
        // Mark as saved so auto-save doesn't trigger
        lastSavedContent.current = content;
        hasDocumentChanges.current = false;
        onSuccess?.(newIdea);
        onClose();
      } else if (idea) {
        const updated = await updateIdea(idea.id, {
          title: title.trim(),
          summary: summary.trim(),
          tags,
          description: description.trim() || undefined,
        });
        if (updated) {
          // Mark as saved so auto-save doesn't trigger
          lastSavedContent.current = content;
          hasDocumentChanges.current = false;
          onSuccess?.(updated);
          onClose();
        } else {
          setError('Failed to update idea');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save idea');
    } finally {
      setIsSaving(false);
    }
  }, [parsedContent, isNewIdea, idea, workspaceId, createIdea, updateIdea, onSuccess, onClose, content]);

  const handleChatSubmit = useCallback((data: ChatInputSubmitData) => {
    const { content } = data;
    if (content.trim()) {
      sendAgentMessage(content.trim());
    }
  }, [sendAgentMessage]);

  const handleClearChat = useCallback(() => {
    clearHistory();
  }, [clearHistory]);

  // Empty state for chat panel
  const chatEmptyState = (
    <div className={styles.chatEmptyState}>
      <h3>Chat with the Idea Agent</h3>
      <p>
        {isNewIdea
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
          {/* Main content */}
          <div className={styles.content}>
            <SplitPane
              orientation="horizontal"
              defaultSize="40%"
              minSize={300}
              first={
                <div className={styles.chatPane}>
                  <div className={styles.chatHeader}>
                    <span className={styles.chatTitle}>Idea Agent</span>
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
                  />

                  <ThinkingIndicator isActive={isAgentThinking} showEscapeHint={false} />

                  <div className={styles.chatInputContainer}>
                    <ChatInput
                      ref={chatInputRef}
                      placeholder={isAgentThinking ? "Agent is thinking..." : "Ask the agent... (type / for commands)"}
                      onSubmit={handleChatSubmit}
                      disabled={!isConnected || isAgentThinking}
                      historyKey={`idea-agent-${idea?.id || 'new'}`}
                      fullWidth
                      commands={commands}
                      onCommand={handleCommand}
                    />
                  </div>
                </div>
              }
              second={
                <div className={styles.editorPane}>
                  <div className={styles.editorContent}>
                    {/* Key based on documentId ensures fresh editor for each idea */}
                    {/* Use defaultValue (uncontrolled) when using Yjs to avoid conflicts with ySync */}
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

                  {/* Footer */}
                  <footer className={styles.footer}>
                    <Button variant="ghost" onClick={onClose} disabled={isSaving}>
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleSave}
                      disabled={isSaving || !parsedContent.title.trim() || parsedContent.title === 'Untitled Idea' || !parsedContent.summary.trim()}
                      icon={isSaving ? <Spinner size="sm" /> : undefined}
                    >
                      {isSaving ? 'Saving...' : isNewIdea ? 'Create Idea' : 'Save Changes'}
                    </Button>
                  </footer>
                </div>
              }
            />
          </div>
        </div>
      </Slide>
    </div>
  );

  return createPortal(overlay, document.body);
}

IdeaWorkspaceOverlay.displayName = 'IdeaWorkspaceOverlay';

export default IdeaWorkspaceOverlay;
