import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from '@ui-kit/router';
import { Button, IconButton, Spinner } from '@ui-kit/react';
import { ArrowLeftIcon } from '@ui-kit/icons/ArrowLeftIcon';
import { ShareIcon } from '@ui-kit/icons/ShareIcon';
import { LinkIcon } from '@ui-kit/icons/LinkIcon';
import { MarkdownCoEditor, type ViewMode } from '@ui-kit/react-markdown';
import { useAuth } from '../contexts/AuthContext';
import { useDocuments, type Document } from '../contexts/DocumentContext';
import { useSave } from '../contexts/SaveContext';
import styles from './DocumentEditor.module.css';

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
  const { setSaveState } = useSave();

  const [document, setDocument] = useState<Document | null>(null);
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [isPublic, setIsPublic] = useState(false);

  // Refs for debounced saving
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedContentRef = useRef<string>('');
  const lastSavedTitleRef = useRef<string>('');
  const savedIndicatorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (savedIndicatorTimeoutRef.current) clearTimeout(savedIndicatorTimeoutRef.current);
    };
  }, []);

  // Debounced save function
  const debouncedSave = useCallback(
    (newContent: string, newTitle: string) => {
      if (!documentId) return;

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Check if anything changed
      const contentChanged = newContent !== lastSavedContentRef.current;
      const titleChanged = newTitle !== lastSavedTitleRef.current;

      if (!contentChanged && !titleChanged) {
        return;
      }

      // Set saving state immediately to show user we're tracking changes
      setSaveState('saving');

      // Debounce the actual save
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const updates: Partial<Document> = {};
          if (contentChanged) updates.content = newContent;
          if (titleChanged) updates.title = newTitle;

          await updateDocument(documentId, updates);

          lastSavedContentRef.current = newContent;
          lastSavedTitleRef.current = newTitle;

          setSaveState('saved');

          // Clear saved indicator timeout if it exists
          if (savedIndicatorTimeoutRef.current) {
            clearTimeout(savedIndicatorTimeoutRef.current);
          }

          // Return to idle after showing "saved" for a bit
          savedIndicatorTimeoutRef.current = setTimeout(() => {
            setSaveState('idle');
          }, 2000);
        } catch (error) {
          console.error('Failed to save document:', error);
          setSaveState('idle');
        }
      }, 1000); // 1 second debounce
    },
    [documentId, updateDocument]
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
