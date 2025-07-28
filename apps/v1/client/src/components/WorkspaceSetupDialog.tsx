import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContextV2';
import { Button } from './ui/Button';
import { IconButton } from './ui/IconButton';
import { WorkspaceConfirmDialog } from './WorkspaceConfirmDialog';
import { FolderBrowserDialog } from './FolderBrowserDialog';

interface WorkspaceSetupDialogProps {
  isOpen: boolean;
  onComplete: (path: string, hasExistingContent?: boolean) => void;
  onBrowseFolder?: () => void;
  externalPath?: string;
}

export function WorkspaceSetupDialog({
  isOpen,
  onComplete,
  onBrowseFolder,
  externalPath = '',
}: WorkspaceSetupDialogProps) {
  const { currentStyles } = useTheme();
  const styles = currentStyles;
  const [workspacePath, setWorkspacePath] = useState(externalPath);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showFolderBrowser, setShowFolderBrowser] = useState(false);
  const [pendingPath, setPendingPath] = useState('');

  // Update workspace path when external path changes
  React.useEffect(() => {
    if (externalPath) {
      setWorkspacePath(externalPath);
    }
  }, [externalPath]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    const trimmedPath = workspacePath.trim();
    if (!trimmedPath) return;

    console.log('Checking workspace:', trimmedPath);

    // Check if the folder exists
    try {
      const response = await fetch('http://localhost:3000/api/workspace/exists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workspacePath: trimmedPath }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Workspace check response:', data);
        if (data.exists) {
          // Workspace exists, pass along whether it has content
          onComplete(trimmedPath, data.hasContent);
        } else {
          setPendingPath(trimmedPath);
          setShowConfirmDialog(true);
        }
      } else {
        console.error('Failed to check workspace:', response.status);
        // If we can't check, assume it doesn't exist and show confirm dialog
        setPendingPath(trimmedPath);
        setShowConfirmDialog(true);
      }
    } catch (error) {
      console.error('Error checking workspace:', error);
      // If server is not running, we can't check for content
      // For now, just complete without content check
      onComplete(trimmedPath, false);
    }
  };

  const handleConfirmCreate = () => {
    setShowConfirmDialog(false);
    onComplete(pendingPath, false); // New workspace has no content
  };

  const handleCancelCreate = () => {
    setShowConfirmDialog(false);
    setPendingPath('');
  };

  // If using external dialog management, don't render backdrop
  const renderContent = () => (
    <div
      className={`
          relative w-full max-w-2xl
          bg-white dark:bg-neutral-800 ${styles.cardBorder} border ${styles.borderRadius}
          ${styles.cardShadow} 
        `}
    >
      {/* Header */}
      <div className={`px-6 py-4 border-b ${styles.contentBorder}`}>
        <h2 className={`text-xl font-semibold ${styles.headingColor}`}>Welcome to Claude Flow</h2>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className={`mb-6 ${styles.textColor}`}>
          <p className="mb-4">
            Claude Flow uses a workspace folder to organize your projects and collaborate with AI
            assistants.
          </p>
          <p className="mb-4">Your workspace will contain:</p>
          <ul className="list-disc list-inside mb-4 space-y-1">
            <li>Projects with their repositories</li>
            <li>Work item plans and documentation</li>
            <li>AI persona configurations</li>
            <li>Jam session histories</li>
          </ul>
          <p>
            Choose a folder where you'd like to store your workspace. This can be changed later in
            settings.
          </p>
        </div>

        <div>
          <label className={`block text-sm font-medium ${styles.textColor} mb-2`}>
            Workspace folder path
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={workspacePath}
              onChange={(e) => setWorkspacePath(e.target.value)}
              placeholder="/path/to/your/workspace"
              className={`
                    flex-1 px-3 py-2 ${styles.buttonRadius}
                    ${styles.contentBg} ${styles.contentBorder} border ${styles.textColor}
                    focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500
                  `}
            />
            <IconButton
              onClick={() => (onBrowseFolder ? onBrowseFolder() : setShowFolderBrowser(true))}
              aria-label="Browse for folder"
              variant="secondary"
              title="Browse for folder"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
            </IconButton>
          </div>
          <p className={`mt-2 text-sm ${styles.mutedText}`}>
            Enter the full path to your workspace folder (e.g., /home/user/workspace or
            C:\Users\Name\workspace)
          </p>
        </div>
      </div>

      {/* Footer */}
      <div
        className={`flex items-center justify-end gap-3 px-6 py-4 border-t ${styles.contentBorder}`}
      >
        <Button onClick={handleSubmit} disabled={!workspacePath.trim()} variant="primary">
          Open workspace
        </Button>
      </div>
    </div>
  );

  if (onBrowseFolder) {
    // When managed externally, just return the dialog content
    return renderContent();
  }

  // Otherwise, render with backdrop and modal wrapper
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-gray-900/50 dark:bg-black/50 transition-opacity" />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">{renderContent()}</div>
      <WorkspaceConfirmDialog
        isOpen={showConfirmDialog}
        path={pendingPath}
        onConfirm={handleConfirmCreate}
        onCancel={handleCancelCreate}
      />
      {!onBrowseFolder && (
        <FolderBrowserDialog
          isOpen={showFolderBrowser}
          onSelect={(path) => {
            setWorkspacePath(path);
            setShowFolderBrowser(false);
          }}
          onCancel={() => setShowFolderBrowser(false)}
        />
      )}
    </div>
  );
}
