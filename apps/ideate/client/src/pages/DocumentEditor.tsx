import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from '@ui-kit/router';
import { Button, IconButton, Spinner } from '@ui-kit/react';
import { ArrowLeftIcon } from '@ui-kit/icons/ArrowLeftIcon';
import { ShareIcon } from '@ui-kit/icons/ShareIcon';
import { LinkIcon } from '@ui-kit/icons/LinkIcon';
import { MarkdownCoEditor, type ViewMode, type MarkdownEditorRef, type CoAuthor } from '@ui-kit/react-markdown';
import { useAuth } from '../contexts/AuthContext';
import { useDocuments, type Document } from '../contexts/DocumentContext';
import { useSession } from '../contexts/SessionContext';
import { useYjsCollaboration, type CoAuthor as YjsCoAuthor } from '../hooks/useYjsCollaboration';
import { useWorkspaceSocket } from '../hooks/useWorkspaceSocket';
import { YJS_WS_URL } from '../config';
import styles from './DocumentEditor.module.css';

/**
 * Check if a document is newly created (just has title and blank line).
 * New docs have content matching: "# Title\n\n"
 */
function isNewDocument(content: string, title: string): boolean {
  const expectedContent = `# ${title}\n\n`;
  return content === expectedContent;
}

/**
 * Extract the first H1 heading from markdown content.
 * Matches both ATX style (# Heading) and setext style (Heading\n===).
 */
function extractFirstH1(markdown: string): string | null {
  // Match ATX-style H1: # Heading (must be at line start)
  const atxMatch = markdown.match(/^#\s+(.+?)(?:\s*#*)?$/m);
  if (atxMatch) {
    return atxMatch[1].trim();
  }

  // Match setext-style H1: Heading followed by === on next line
  const setextMatch = markdown.match(/^(.+)\n=+\s*$/m);
  if (setextMatch) {
    return setextMatch[1].trim();
  }

  return null;
}

/**
 * Map Yjs CoAuthor format to MarkdownEditor CoAuthor format
 */
function mapYjsCoAuthorsToEditor(yjsCoAuthors: YjsCoAuthor[]): CoAuthor[] {
  return yjsCoAuthors.map((author) => ({
    id: String(author.clientId),
    name: author.name,
    color: author.color,
    isAI: false,
    selectionStart: author.cursor?.anchor ?? 0,
    selectionEnd: author.cursor?.head ?? 0,
  }));
}

export function DocumentEditor() {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { getDocument, updateDocument } = useDocuments();
  const { session } = useSession();

  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [isPublic, setIsPublic] = useState(false);

  // Ref for tracking the last saved title (to detect title changes)
  const lastSavedTitleRef = useRef<string>('');
  // Track if we've set initial cursor position
  const initialCursorSetRef = useRef(false);

  // User info for awareness (use server-assigned session color)
  const localUser = useMemo(() => ({
    name: user?.name || 'Anonymous',
    color: session?.color || '#888888',
  }), [user?.name, session?.color]);

  // Workspace presence tracking - notify other users that we're viewing this document
  const { isConnected, joinResource, leaveResource } = useWorkspaceSocket({
    workspaceId: document?.workspaceId,
    sessionColor: session?.color,
  });

  // Join document presence when WebSocket is connected
  // Server handles deduplication and grace period cancellation for reconnects
  useEffect(() => {
    if (isConnected && document?.workspaceId && documentId) {
      joinResource(documentId, 'document');
    }
  }, [isConnected, document?.workspaceId, documentId, joinResource]);

  // Leave resource on unmount
  useEffect(() => {
    return () => {
      leaveResource();
    };
  }, [leaveResource]);

  // Redirect if not authenticated (wait for auth to finish loading first)
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthLoading, isAuthenticated, navigate]);

  // Load document
  useEffect(() => {
    async function loadDocument() {
      if (!documentId) return;
      setIsLoading(true);
      try {
        const doc = await getDocument(documentId);
        if (doc) {
          setDocument(doc);
          setIsPublic(doc.isPublic);
          lastSavedTitleRef.current = doc.title;
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadDocument();
  }, [documentId, getDocument]);

  // Sync title to server (content is handled by Yjs)
  const syncTitleToServer = useCallback(
    async (newTitle: string) => {
      if (!documentId) return;
      if (newTitle === lastSavedTitleRef.current) return;

      lastSavedTitleRef.current = newTitle;
      await updateDocument(documentId, { title: newTitle });
    },
    [documentId, updateDocument]
  );

  // Handle Yjs content changes - extract title from H1 and sync metadata
  // Content is persisted by Yjs (.yjs files), only title needs REST sync
  const handleYjsContentChange = useCallback((newContent: string) => {
    if (document) {
      // Extract H1 heading and sync to title if it changed
      const h1Heading = extractFirstH1(newContent);

      // Update document title if H1 changed
      if (h1Heading !== null && h1Heading !== document.title) {
        setDocument({ ...document, title: h1Heading });
        syncTitleToServer(h1Heading);
      }
    }
  }, [document, syncTitleToServer]);

  // Initialize Yjs collaboration (only when document is loaded)
  const {
    extensions,
    connectionState,
    coAuthors: yjsCoAuthors,
    getContent,
    isSynced,
  } = useYjsCollaboration({
    documentId: documentId || '',
    serverUrl: YJS_WS_URL,
    initialContent: document?.content || '',
    localUser,
    onChange: handleYjsContentChange,
    enableOfflinePersistence: true,
  });

  // Map Yjs co-authors to editor format
  const editorCoAuthors = useMemo(
    () => mapYjsCoAuthorsToEditor(yjsCoAuthors),
    [yjsCoAuthors]
  );

  // Handle title change from input field
  const handleTitleChange = useCallback((newTitle: string) => {
    if (document) {
      setDocument({ ...document, title: newTitle });
      syncTitleToServer(newTitle);
    }
  }, [document, syncTitleToServer]);

  // Toggle network visibility
  const handleTogglePublic = useCallback(async () => {
    if (!documentId) return;
    const newIsPublic = !isPublic;
    setIsPublic(newIsPublic);
    await updateDocument(documentId, { isPublic: newIsPublic });
  }, [documentId, isPublic, updateDocument]);

  // Handle editor ready - set initial cursor position
  const handleEditorReady = useCallback((editor: MarkdownEditorRef) => {
    if (initialCursorSetRef.current || !document) return;
    initialCursorSetRef.current = true;

    const content = getContent();
    // For new documents (just title + blank line), go to line 3
    // For existing documents, go to start (line 1)
    if (isNewDocument(content, document.title)) {
      editor.goToLine(3);
    } else {
      editor.goToLine(1);
    }
  }, [document, getContent]);

  // Connection status indicator
  const connectionIndicator = useMemo(() => {
    switch (connectionState) {
      case 'connected':
        return <span className={styles.connectionDot} data-status="connected" title="Connected" />;
      case 'connecting':
        return <span className={styles.connectionDot} data-status="connecting" title="Connecting..." />;
      case 'disconnected':
        return <span className={styles.connectionDot} data-status="disconnected" title="Offline" />;
      default:
        return null;
    }
  }, [connectionState]);

  // Show loading while auth is being checked
  if (isAuthLoading || !user) {
    return (
      <div className={styles.loading}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (isLoading || !isSynced) {
    return (
      <div className={styles.loading}>
        <Spinner size="lg" />
        <p>{isLoading ? 'Loading document...' : 'Connecting...'}</p>
      </div>
    );
  }

  if (!document) {
    return (
      <div className={styles.notFound}>
        <h2>Document not found</h2>
        <p>The document you're looking for doesn't exist or you don't have access.</p>
        <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
      </div>
    );
  }

  // Get the current synced content from Y.Text
  // This is the authoritative content after WebSocket sync
  const syncedContent = getContent();

  return (
    <div className={styles.editor}>
      <MarkdownCoEditor
        defaultValue={syncedContent}
        defaultMode={viewMode}
        onModeChange={setViewMode}
        placeholder="Start writing..."
        autoFocus
        fullPage
        onEditorReady={handleEditorReady}
        extensions={extensions}
        disableBuiltInHistory={true}
        coAuthors={editorCoAuthors}
        toolbarStart={
          <>
            <IconButton
              icon={<ArrowLeftIcon />}
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              aria-label="Back to dashboard"
            />
            {connectionIndicator}
            <input
              type="text"
              className={styles.titleInput}
              value={document.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Untitled"
            />
          </>
        }
        toolbarEnd={
          <>
            <IconButton
              icon={<LinkIcon />}
              variant={isPublic ? 'default' : 'ghost'}
              onClick={handleTogglePublic}
              aria-label={isPublic ? 'Shared on network' : 'Not shared'}
            />
            <Button icon={<ShareIcon />} variant="ghost">
              Invite
            </Button>
          </>
        }
      />
    </div>
  );
}
