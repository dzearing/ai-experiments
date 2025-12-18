import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, IconButton, Spinner } from '@ui-kit/react';
import { ArrowLeftIcon, ShareIcon, LinkIcon } from '@ui-kit/icons';
import { MarkdownCoEditor, type ViewMode } from '@ui-kit/react-markdown';
import { useAuth } from '../contexts/AuthContext';
import { useDocuments, type Document } from '../contexts/DocumentContext';
import styles from './DocumentEditor.module.css';

export function DocumentEditor() {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { getDocument, updateDocument } = useDocuments();

  const [document, setDocument] = useState<Document | null>(null);
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [isPublic, setIsPublic] = useState(false);

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
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadDocument();
  }, [documentId, getDocument]);

  // Handle content change
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
  }, []);

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
              onChange={(e) =>
                setDocument({ ...document, title: e.target.value })
              }
              placeholder="Untitled"
            />
            {isSaving && <span className={styles.savingIndicator}>Saving...</span>}
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
