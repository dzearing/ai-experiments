import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from '@ui-kit/router';
import { IconButton, Button } from '@ui-kit/react';
import { ArrowLeftIcon } from '@ui-kit/icons/ArrowLeftIcon';
import { SaveIcon } from '@ui-kit/icons/SaveIcon';
import { MarkdownCoEditor, type MarkdownCoEditorRef } from '@ui-kit/react-markdown';
import { API_URL } from '../config';
import { useFacilitator } from '../contexts/FacilitatorContext';
import styles from './PersonaEditor.module.css';

export function PersonaEditor() {
  const navigate = useNavigate();
  const { addMessage } = useFacilitator();
  const editorRef = useRef<MarkdownCoEditorRef>(null);
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const originalContentRef = useRef('');
  const saveTimeoutRef = useRef<number | null>(null);

  // Fetch initial content
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(`${API_URL}/api/personas/content`);
        if (response.ok) {
          const data = await response.json();
          setContent(data.content);
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

  // Track changes
  const handleChange = useCallback((newContent: string) => {
    setContent(newContent);
    setHasChanges(newContent !== originalContentRef.current);

    // Debounce auto-save
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = window.setTimeout(() => {
      if (newContent !== originalContentRef.current) {
        saveContent(newContent);
      }
    }, 2000);
  }, []);

  // Save content to server
  const saveContent = async (contentToSave: string) => {
    setIsSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/personas/content`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: contentToSave }),
      });

      if (response.ok) {
        originalContentRef.current = contentToSave;
        setHasChanges(false);
      } else {
        console.error('[PersonaEditor] Failed to save content');
      }
    } catch (err) {
      console.error('[PersonaEditor] Failed to save content:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle manual save
  const handleSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }
    saveContent(content);
  }, [content]);

  // Handle back navigation with recalibration
  const handleBack = useCallback(async () => {
    // Cancel any pending save
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    // Save if there are changes
    if (hasChanges) {
      await saveContent(content);
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
  }, [hasChanges, content, navigate, addMessage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
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
          {isSaving && <span className={styles.savingIndicator}>Saving...</span>}
          {hasChanges && !isSaving && (
            <span className={styles.unsavedIndicator}>Unsaved changes</span>
          )}
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
          >
            <SaveIcon />
            Save
          </Button>
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
