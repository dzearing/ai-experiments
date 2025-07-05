import { useState } from 'react';
import { AnimatedTransition } from './AnimatedTransition';
import { WorkspaceSetupDialog } from './WorkspaceSetupDialog';
import { FolderBrowserDialog } from './FolderBrowserDialog';
import { ImportingWorkspaceDialog } from './ImportingWorkspaceDialog';

interface WorkspaceDialogContainerProps {
  isOpen: boolean;
  onComplete: (path: string) => void;
}

export function WorkspaceDialogContainer({ isOpen, onComplete }: WorkspaceDialogContainerProps) {
  const [showFolderBrowser, setShowFolderBrowser] = useState(false);
  const [showImporting, setShowImporting] = useState(false);
  const [workspacePath, setWorkspacePath] = useState('');
  const [selectedWorkspacePath, setSelectedWorkspacePath] = useState('');

  if (!isOpen) return null;

  const handleFolderBrowse = () => {
    setShowFolderBrowser(true);
  };

  const handleFolderSelect = (path: string) => {
    setWorkspacePath(path);
    setShowFolderBrowser(false);
  };

  const handleFolderCancel = () => {
    setShowFolderBrowser(false);
  };
  
  const handleWorkspaceSelected = (path: string, hasExistingContent?: boolean) => {
    console.log('Workspace selected:', path, 'Has content:', hasExistingContent);
    
    if (hasExistingContent) {
      // Show importing dialog
      setSelectedWorkspacePath(path);
      setShowImporting(true);
    } else {
      // Direct completion for new/empty workspace
      onComplete(path);
    }
  };
  
  const handleImportComplete = () => {
    onComplete(selectedWorkspacePath);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-gray-900/50 dark:bg-black/50 transition-opacity" />
      
      {/* Show importing dialog if needed */}
      {showImporting ? (
        <ImportingWorkspaceDialog
          isOpen={true}
          workspacePath={selectedWorkspacePath}
          onComplete={handleImportComplete}
        />
      ) : (
        /* Modal container with animation */
        <AnimatedTransition
          transitionKey={showFolderBrowser ? 'folder-browser' : 'setup-dialog'}
          className="w-full max-w-2xl mx-auto min-h-full"
          reverse={!showFolderBrowser}
          delay={50}
        >
          {!showFolderBrowser ? (
            <WorkspaceSetupDialog
              key="setup"
              isOpen={true}
              onComplete={handleWorkspaceSelected}
              onBrowseFolder={handleFolderBrowse}
              externalPath={workspacePath}
            />
          ) : (
            <FolderBrowserDialog
              key="folder"
              isOpen={true}
              onSelect={handleFolderSelect}
              onCancel={handleFolderCancel}
            />
          )}
        </AnimatedTransition>
      )}
    </div>
  );
}