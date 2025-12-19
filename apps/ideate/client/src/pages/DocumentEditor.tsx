import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from '@ui-kit/router';
import { Button, IconButton, Spinner } from '@ui-kit/react';
import { ArrowLeftIcon } from '@ui-kit/icons/ArrowLeftIcon';
import { ShareIcon } from '@ui-kit/icons/ShareIcon';
import { LinkIcon } from '@ui-kit/icons/LinkIcon';
import { MarkdownCoEditor, type ViewMode, type MarkdownEditorRef } from '@ui-kit/react-markdown';
import { useAuth } from '../contexts/AuthContext';
import { useDocuments, type Document } from '../contexts/DocumentContext';
import { useSave } from '../contexts/SaveContext';
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

export function DocumentEditor() {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { getDocument, updateDocument } = useDocuments();
  const { executeSave } = useSave();

  const [document, setDocument] = useState<Document | null>(null);
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [isPublic, setIsPublic] = useState(false);

  // Refs for tracking what's been saved (to detect changes)
  const lastSavedContentRef = useRef<string>('');
  const lastSavedTitleRef = useRef<string>('');
  // Track if we've set initial cursor position
  const initialCursorSetRef = useRef(false);

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
          setContent(doc.content);
          setIsPublic(doc.isPublic);
          lastSavedContentRef.current = doc.content;
          lastSavedTitleRef.current = doc.title;
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadDocument();
  }, [documentId, getDocument]);

  // Debounced save function - uses SaveContext to ensure save completes even after navigation
  const debouncedSave = useCallback(
    (newContent: string, newTitle: string) => {
      if (!documentId) return;

      // Check if anything changed
      const contentChanged = newContent !== lastSavedContentRef.current;
      const titleChanged = newTitle !== lastSavedTitleRef.current;

      if (!contentChanged && !titleChanged) {
        return;
      }

      // Capture current values for the save closure
      const contentToSave = newContent;
      const titleToSave = newTitle;

      // Execute save through the context - this ensures:
      // 1. Save continues even if component unmounts (navigation)
      // 2. beforeunload warning is shown if user tries to close page
      // 3. Save state indicator updates correctly
      executeSave(async () => {
        const updates: Partial<Document> = {};
        if (contentChanged) updates.content = contentToSave;
        if (titleChanged) updates.title = titleToSave;

        await updateDocument(documentId, updates);

        // Update refs after successful save
        lastSavedContentRef.current = contentToSave;
        lastSavedTitleRef.current = titleToSave;
      });
    },
    [documentId, updateDocument, executeSave]
  );

  // Handle content change - also syncs H1 heading to title
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    if (document) {
      // Extract H1 heading and sync to title if it changed
      const h1Heading = extractFirstH1(newContent);
      const newTitle = h1Heading !== null ? h1Heading : document.title;

      // Update document title if H1 changed
      if (h1Heading !== null && h1Heading !== document.title) {
        setDocument({ ...document, title: newTitle });
      }

      debouncedSave(newContent, newTitle);
    }
  }, [document, debouncedSave]);

  // Handle title change
  const handleTitleChange = useCallback((newTitle: string) => {
    if (document) {
      setDocument({ ...document, title: newTitle });
      debouncedSave(content, newTitle);
    }
  }, [document, content, debouncedSave]);

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

    // For new documents (just title + blank line), go to line 3
    // For existing documents, go to start (line 1)
    if (isNewDocument(content, document.title)) {
      editor.goToLine(3);
    } else {
      editor.goToLine(1);
    }
  }, [document, content]);

  // Show loading while auth is being checked
  if (isAuthLoading || !user) {
    return (
      <div className={styles.loading}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <Spinner size="lg" />
        <p>Loading document...</p>
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

  return (
    <div className={styles.editor}>
      <MarkdownCoEditor
        value={content}
        onChange={handleContentChange}
        defaultMode={viewMode}
        onModeChange={setViewMode}
        placeholder="Start writing..."
        autoFocus
        fullPage
        onEditorReady={handleEditorReady}
        toolbarStart={
          <>
            <IconButton
              icon={<ArrowLeftIcon />}
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              aria-label="Back to dashboard"
            />
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
