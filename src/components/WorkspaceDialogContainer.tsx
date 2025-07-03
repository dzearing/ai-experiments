import { useState } from 'react';
import { AnimatedTransition } from './AnimatedTransition';
import { WorkspaceSetupDialog } from './WorkspaceSetupDialog';
import { FolderBrowserDialog } from './FolderBrowserDialog';

interface WorkspaceDialogContainerProps {
  isOpen: boolean;
  onComplete: (path: string) => void;
}

export function WorkspaceDialogContainer({ isOpen, onComplete }: WorkspaceDialogContainerProps) {
  const [showFolderBrowser, setShowFolderBrowser] = useState(false);
  const [workspacePath, setWorkspacePath] = useState('');
  const [folderBrowserPath, setFolderBrowserPath] = useState('');

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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
      
      {/* Modal container with animation */}
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
            onComplete={onComplete}
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
    </div>
  );
}