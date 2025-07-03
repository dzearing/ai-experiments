import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContextV2';
import { Button } from './ui/Button';
import { IconButton } from './ui/IconButton';
import { AnimatedTransition } from './AnimatedTransition';

interface FolderBrowserDialogProps {
  isOpen: boolean;
  onSelect: (path: string) => void;
  onCancel: () => void;
}

interface DirectoryItem {
  name: string;
  path: string;
  type: 'directory';
  hidden?: boolean;
}

interface BrowseResponse {
  currentPath: string;
  parent: string;
  items: DirectoryItem[];
  separator: string;
}

export function FolderBrowserDialog({ isOpen, onSelect, onCancel }: FolderBrowserDialogProps) {
  const { currentStyles } = useTheme();
  const styles = currentStyles;
  const [currentPath, setCurrentPath] = useState('');
  const [parentPath, setParentPath] = useState('');
  const [items, setItems] = useState<DirectoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState('');
  const [navigationDirection, setNavigationDirection] = useState<'forward' | 'backward'>('forward');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Load home directory on mount
  useEffect(() => {
    if (isOpen && !currentPath) {
      loadHomeDirectory();
    }
  }, [isOpen]);

  const loadHomeDirectory = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/browse/home');
      if (response.ok) {
        const data = await response.json();
          loadDirectory(data.path);
      } else {
        setError('Failed to get home directory');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Error loading home directory:', err);
      setError('Failed to connect to server. Is the server running?');
      setIsLoading(false);
    }
  };

  const loadDirectory = async (path: string, isGoingUp: boolean = false) => {
    if (!isOpen) return;
    
    // Only show loading on initial load
    if (!currentPath) {
      setIsLoading(true);
    }
    setError(null);
    setNavigationDirection(isGoingUp ? 'backward' : 'forward');
    
    
    try {
      const response = await fetch('http://localhost:3000/api/browse/list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path })
      });


      if (response.ok) {
        const data: BrowseResponse = await response.json();
        setCurrentPath(data.currentPath);
        setParentPath(data.parent);
        setItems(data.items);
        setSelectedPath(data.currentPath);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load directory');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleItemClick = (item: DirectoryItem) => {
    loadDirectory(item.path);
  };

  const handleGoUp = () => {
    if (parentPath && parentPath !== currentPath) {
      loadDirectory(parentPath, true);
    }
  };

  const handleSelect = () => {
    if (selectedPath) {
      onSelect(selectedPath);
    }
  };

  const handleCancel = () => {
    onCancel();
  };

  const handleCreateFolder = () => {
    setIsCreatingFolder(true);
    setNewFolderName('');
    // Focus will be set after render via useEffect
  };

  const handleCancelCreate = () => {
    setIsCreatingFolder(false);
    setNewFolderName('');
  };

  const handleConfirmCreate = async () => {
    const trimmedName = newFolderName.trim();
    if (!trimmedName) return;

    try {
      const response = await fetch('http://localhost:3000/api/browse/create-folder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          parentPath: currentPath,
          folderName: trimmedName 
        })
      });

      if (response.ok) {
        const data = await response.json();
        setIsCreatingFolder(false);
        setNewFolderName('');
        // Reload current directory to show new folder
        await loadDirectory(currentPath);
        // Select the new folder
        setSelectedPath(data.path);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create folder');
      }
    } catch (err) {
      setError('Failed to create folder');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirmCreate();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelCreate();
    }
  };


  if (!isOpen) return null;

  const renderContent = () => (
    <div className={`
          relative w-full max-w-2xl
          ${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius}
          ${styles.cardShadow} 
        `}>
          {/* Header */}
          <div className={`px-6 py-4 border-b ${styles.contentBorder}`}>
            <h2 className={`text-xl font-semibold ${styles.headingColor}`}>
              Select folder
            </h2>
          </div>

          {/* Current path */}
          <div className={`px-6 py-3 border-b ${styles.contentBorder} ${styles.contentBg}`}>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${styles.mutedText}`}>Current path:</span>
              <span className={`text-sm font-mono ${styles.textColor} break-all`}>
                {currentPath || 'Loading...'}
              </span>
            </div>
          </div>

          {/* Browser */}
          <div className="p-6" style={{ height: '400px', overflowY: 'auto', position: 'relative' }}>
            {error ? (
              <div className={`text-center py-8 text-red-500`}>
                {error}
              </div>
            ) : (
              <AnimatedTransition
                transitionKey={currentPath}
                className="h-full"
                reverse={navigationDirection === 'backward'}
                delay={50}
                centered={false}
              >
                <div className="space-y-1">
                  {/* New folder input */}
                  {isCreatingFolder && (
                    <div className={`flex items-center gap-2 px-3 py-2 ${styles.borderRadius} ${styles.contentBg} border ${styles.contentBorder}`}>
                      <svg className={`h-5 w-5 flex-shrink-0 ${styles.textColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                      </svg>
                      <input
                        type="text"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={() => {
                          if (!newFolderName.trim()) {
                            handleCancelCreate();
                          }
                        }}
                        placeholder="Folder name"
                        autoFocus
                        className={`
                          flex-1 px-2 py-1 text-sm
                          ${styles.contentBg} ${styles.textColor}
                          border-0 outline-none focus:ring-0
                        `}
                      />
                    </div>
                  )}

                  {/* Go up button */}
                  {parentPath && parentPath !== currentPath && (
                    <button
                      onClick={handleGoUp}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2 ${styles.borderRadius}
                        ${styles.textColor} hover:${styles.contentBg} transition-colors text-left
                      `}
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      <span>..</span>
                    </button>
                  )}

                  {/* Directory items */}
                  {items.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => handleItemClick(item)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2 ${styles.borderRadius}
                        ${selectedPath === item.path ? styles.primaryButton : ''} 
                        ${selectedPath === item.path ? styles.primaryButtonText : item.hidden ? styles.mutedText : styles.textColor}
                        hover:${styles.contentBg} transition-colors text-left
                      `}
                    >
                      <svg className={`h-5 w-5 ${item.hidden ? 'opacity-50' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                      <span>{item.name}</span>
                    </button>
                  ))}

                </div>
              </AnimatedTransition>
            )}
          </div>

          {/* Footer */}
          <div className={`flex items-center justify-between px-6 py-4 border-t ${styles.contentBorder}`}>
            <Button 
              onClick={handleCreateFolder} 
              variant="secondary"
              disabled={isCreatingFolder}
              className="flex items-center"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              Create folder
            </Button>
            <div className="flex items-center gap-3">
              <Button onClick={handleCancel} variant="secondary">
                Cancel
              </Button>
              <Button 
                onClick={handleSelect} 
                variant="primary"
                disabled={!selectedPath}
              >
                Select this folder
              </Button>
            </div>
          </div>
        </div>
  );

  // Check if we're being rendered inside another modal container
  const isManaged = !document.querySelector('.folder-browser-standalone');

  if (isManaged) {
    return renderContent();
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto folder-browser-standalone">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        {renderContent()}
      </div>
    </div>
  );
}