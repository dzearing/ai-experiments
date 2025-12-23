/**
 * LinkDialog component for inserting links in ChatInput
 *
 * Features:
 * - URL field with default "https://url" with "url" selected
 * - Display name field that syncs to URL until manually edited
 * - Focus on URL field when opened
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, Input, Button } from '@ui-kit/react';

export interface LinkDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog closes */
  onClose: () => void;
  /** Callback when link is submitted */
  onSubmit: (url: string, displayText: string) => void;
  /** Optional initial selection text to use as display name */
  initialDisplayText?: string;
}

/**
 * Extract a display name from a URL
 * Removes protocol, www prefix, and trailing slashes
 */
function getDisplayNameFromUrl(url: string): string {
  if (!url) return '';

  try {
    // Try to parse as URL
    const parsed = new URL(url);
    // Use hostname without www prefix, or full URL if parsing fails
    let display = parsed.hostname.replace(/^www\./, '');
    // Add pathname if it's not just "/"
    if (parsed.pathname && parsed.pathname !== '/') {
      display += parsed.pathname;
    }
    // Remove trailing slash
    display = display.replace(/\/$/, '');
    return display;
  } catch {
    // If URL parsing fails, just clean up the string
    return url
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');
  }
}

export function LinkDialog({
  open,
  onClose,
  onSubmit,
  initialDisplayText = '',
}: LinkDialogProps) {
  const [url, setUrl] = useState('https://url');
  const [displayText, setDisplayText] = useState(initialDisplayText);
  const [isDisplayTextManuallyEdited, setIsDisplayTextManuallyEdited] = useState(false);

  const urlInputRef = useRef<HTMLInputElement>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setUrl('https://url');
      setDisplayText(initialDisplayText);
      setIsDisplayTextManuallyEdited(!!initialDisplayText);

      // Focus and select "url" portion after a brief delay for dialog animation
      setTimeout(() => {
        if (urlInputRef.current) {
          urlInputRef.current.focus();
          // Select just "url" portion (after "https://")
          urlInputRef.current.setSelectionRange(8, 11);
        }
      }, 50);
    }
  }, [open, initialDisplayText]);

  // Sync display text to URL when URL changes (unless manually edited)
  useEffect(() => {
    if (!isDisplayTextManuallyEdited && url !== 'https://url') {
      setDisplayText(getDisplayNameFromUrl(url));
    }
  }, [url, isDisplayTextManuallyEdited]);

  const handleUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  }, []);

  const handleDisplayTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayText(e.target.value);
    setIsDisplayTextManuallyEdited(true);
  }, []);

  const handleSubmit = useCallback(() => {
    const finalUrl = url.trim();
    const finalDisplayText = displayText.trim() || finalUrl;

    if (finalUrl && finalUrl !== 'https://url' && finalUrl !== 'https://') {
      onSubmit(finalUrl, finalDisplayText);
      onClose();
    }
  }, [url, displayText, onSubmit, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const isValid = url.trim() && url !== 'https://url' && url !== 'https://';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Insert Link"
      size="sm"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!isValid}>
            Insert
          </Button>
        </>
      }
    >
      <div
        style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        onKeyDown={handleKeyDown}
      >
        <div>
          <label
            htmlFor="link-url"
            style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}
          >
            URL
          </label>
          <Input
            ref={urlInputRef}
            id="link-url"
            type="url"
            fullWidth
            value={url}
            onChange={handleUrlChange}
            placeholder="https://example.com"
          />
        </div>
        <div>
          <label
            htmlFor="link-display"
            style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}
          >
            Display Text
          </label>
          <Input
            id="link-display"
            type="text"
            fullWidth
            value={displayText}
            onChange={handleDisplayTextChange}
            placeholder="Link text (optional)"
          />
        </div>
      </div>
    </Dialog>
  );
}

LinkDialog.displayName = 'LinkDialog';
