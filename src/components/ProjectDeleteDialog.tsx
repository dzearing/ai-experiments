import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContextV2';
import { Button } from './ui/Button';
import { Checkbox } from './ui/Checkbox';
import { AnimatedTransition } from './AnimatedTransition';
import type { Project } from '../types';

interface ProjectDeleteDialogProps {
  isOpen: boolean;
  project: Project | null;
  onConfirm: (projectId: string, removeFolder: boolean) => void;
  onCancel: () => void;
}

export function ProjectDeleteDialog({ isOpen, project, onConfirm, onCancel }: ProjectDeleteDialogProps) {
  const { currentStyles } = useTheme();
  const styles = currentStyles;
  const [isDeleting, setIsDeleting] = useState(false);
  const [removeFolder, setRemoveFolder] = useState(false);

  if (!isOpen || !project) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm(project.id, removeFolder);
    } finally {
      setIsDeleting(false);
      setRemoveFolder(false); // Reset checkbox for next time
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div className="fixed inset-0 bg-black/50" onClick={onCancel} />
        
        <AnimatedTransition transitionKey="delete-dialog" className="relative">
          <div className={`
            w-full max-w-md transform overflow-hidden ${styles.borderRadius}
            ${styles.cardBg} ${styles.cardBorder} border ${styles.cardShadow}
            text-left align-middle transition-all
          `}>
            <div className="p-6">
              <h3 className={`text-lg font-medium ${styles.headingColor} mb-4`}>
                Confirm removing project
              </h3>
              
              <p className={`${styles.textColor} mb-6`}>
                Do you want to remove the project "{project.name}"?
              </p>
              
              <Checkbox
                label="Remove project folder"
                checked={removeFolder}
                onChange={(e) => setRemoveFolder(e.target.checked)}
              />

              <div className="flex justify-end gap-3 mt-8">
                <Button
                  onClick={onCancel}
                  variant="secondary"
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirm}
                  variant="primary"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Processing...' : 'OK'}
                </Button>
              </div>
            </div>
          </div>
        </AnimatedTransition>
      </div>
    </div>
  );
}