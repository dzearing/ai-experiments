import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from '@ui-kit/router';
import { IconButton, Button } from '@ui-kit/react';
import { ArrowLeftIcon } from '@ui-kit/icons/ArrowLeftIcon';
import { MarkdownCoEditor, type MarkdownCoEditorRef } from '@ui-kit/react-markdown';
import { API_URL } from '../config';
import { useFacilitator } from '../contexts/FacilitatorContext';
import styles from './PersonaEditor.module.css';

export function PersonaEditor() {
  const navigate = useNavigate();
  const { addMessage, reloadPersona } = useFacilitator();
  const editorRef = useRef<MarkdownCoEditorRef>(null);
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved');
  const [error, setError] = useState<string | null>(null);
  const originalContentRef = useRef('');
  const saveTimeoutRef = useRef<number | null>(null);
  const contentRef = useRef('');

  // Fetch initial content
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(`${API_URL}/api/personas/content`);
        if (response.ok) {
          const data = await response.json();
          setContent(data.content);
          contentRef.current = data.content;
          originalContentRef.current = data.content;
        } else {
          setError('Failed to load persona content');
        }
      } catch (err) {
        console.error('[PersonaEditor] Failed to fetch content:', err);
        setError('Failed to load persona content');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, []);

  // Save content to server and notify facilitator to reload
  const saveContent = useCallback(async (contentToSave: string) => {
    setSaveStatus('saving');

    try {
      const response = await fetch(`${API_URL}/api/personas/content`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: contentToSave }),
      });

      if (response.ok) {
        originalContentRef.current = contentToSave;
        setSaveStatus('saved');

        // Notify facilitator to reload the custom persona without clearing history
        reloadPersona();
      } else {
        console.error('[PersonaEditor] Failed to save content');
        setSaveStatus('error');
      }
    } catch (err) {
      console.error('[PersonaEditor] Failed to save content:', err);
      setSaveStatus('error');
    }
  }, [reloadPersona]);

  // Track changes and auto-save
  const handleChange = useCallback((newContent: string) => {
    setContent(newContent);
    contentRef.current = newContent;

    const hasUnsavedChanges = newContent !== originalContentRef.current;

    if (hasUnsavedChanges) {
      setSaveStatus('unsaved');
    }

    // Debounce auto-save (500ms for more responsive feel)
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    if (hasUnsavedChanges) {
      saveTimeoutRef.current = window.setTimeout(() => {
        saveContent(newContent);
      }, 500);
    }
  }, [saveContent]);

  // Handle back navigation with recalibration
  const handleBack = useCallback(async () => {
    // Cancel any pending save
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    // Save if there are unsaved changes
    if (contentRef.current !== originalContentRef.current) {
      await saveContent(contentRef.current);
    }

    // Trigger reload on server
    try {
      const response = await fetch(`${API_URL}/api/personas/reload`, {
        method: 'POST',
      });

      if (response.ok) {
        // Add recalibration message to chat
        addMessage({
          id: `system-${Date.now()}`,
          role: 'assistant',
          parts: [{ type: 'text', text: '*Facilitator recalibrated with prompt changes.*' }],
          timestamp: Date.now(),
        });
      }
    } catch (err) {
      console.error('[PersonaEditor] Failed to reload persona:', err);
    }

    navigate(-1);
  }, [navigate, addMessage, saveContent]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (contentRef.current !== originalContentRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Cleanup and save on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }

      // Save any pending changes on unmount
      if (contentRef.current !== originalContentRef.current) {
        // Use sendBeacon for reliable save on unmount
        const payload = JSON.stringify({ content: contentRef.current });

        navigator.sendBeacon(
          `${API_URL}/api/personas/content`,
          new Blob([payload], { type: 'application/json' })
        );
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className={styles.personaEditor}>
        <div className={styles.loading}>Loading persona...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.personaEditor}>
        <div className={styles.error}>
          <p>{error}</p>
          <Button variant="primary" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.personaEditor}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <IconButton
            icon={<ArrowLeftIcon />}
            variant="ghost"
            onClick={handleBack}
            aria-label="Back"
          />
          <h1>Edit Facilitator Persona</h1>
        </div>
        <div className={styles.headerRight}>
          {saveStatus === 'saving' && <span className={styles.savingIndicator}>Saving...</span>}
          {saveStatus === 'saved' && <span className={styles.savedIndicator}>Saved</span>}
          {saveStatus === 'unsaved' && <span className={styles.unsavedIndicator}>Editing...</span>}
          {saveStatus === 'error' && <span className={styles.errorIndicator}>Save failed</span>}
        </div>
      </header>

      <div className={styles.editorContainer}>
        <MarkdownCoEditor
          ref={editorRef}
          value={content}
          onChange={handleChange}
          defaultMode="edit"
          fullPage
          showLineNumbers
          placeholder="Write your persona prompt here..."
          autoFocus
        />
      </div>

      <div className={styles.helpText}>
        <h3>Persona Format</h3>
        <p>
          Use markdown sections to define your persona:
        </p>
        <ul>
          <li><code>## System Prompt</code> - The main instructions for the facilitator</li>
          <li><code>## Description</code> - Brief description shown in settings</li>
          <li><code>## Example</code> - Example response snippet</li>
        </ul>
      </div>
    </div>
  );
}

export default PersonaEditor;
