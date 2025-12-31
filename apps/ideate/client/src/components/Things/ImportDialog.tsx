import { useState, useCallback, useEffect } from 'react';
import { Button, Dialog, Input, Textarea, Text, Spinner } from '@ui-kit/react';
import { CodeIcon } from '@ui-kit/icons/CodeIcon';
import { FolderIcon } from '@ui-kit/icons/FolderIcon';
import { CheckIcon } from '@ui-kit/icons/CheckIcon';
import { CloseIcon } from '@ui-kit/icons/CloseIcon';
import { useImportAgent, type ImportStep, type ImportSubTask } from '../../hooks/useImportAgent';
import { useThings } from '../../contexts/ThingsContext';
import type { ThingMetadata } from '../../types/thing';
import styles from './ImportDialog.module.css';

export type ImportSourceType = 'git' | 'local';

interface ImportDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog should close */
  onClose: () => void;
  /** The thing we're importing into */
  targetThing: ThingMetadata;
}

type WizardStep = 'source' | 'config' | 'progress';

export function ImportDialog({ open, onClose, targetThing }: ImportDialogProps) {
  const { fetchThingsGraph } = useThings();
  const {
    startImport,
    cancelImport,
    steps: progressSteps,
    isRunning,
    error: importError,
    isComplete,
    reset: resetImport,
    subTasks,
    isDecomposed,
  } = useImportAgent();

  // Wizard state
  const [step, setStep] = useState<WizardStep>('source');
  const [sourceType, setSourceType] = useState<ImportSourceType | null>(null);

  // Form state
  const [gitUrl, setGitUrl] = useState('');
  const [localPath, setLocalPath] = useState('');
  const [instructions, setInstructions] = useState('');

  // Local error state (for validation)
  const [validationError, setValidationError] = useState<string | null>(null);

  // Combine errors for display
  const error = validationError || importError;

  // Reset state when dialog closes
  const handleClose = useCallback(() => {
    if (isRunning) {
      cancelImport();
    }
    setStep('source');
    setSourceType(null);
    setGitUrl('');
    setLocalPath('');
    setInstructions('');
    setValidationError(null);
    resetImport();
    onClose();
  }, [isRunning, cancelImport, resetImport, onClose]);

  // Handle source selection
  const handleSourceSelect = useCallback((type: ImportSourceType) => {
    setSourceType(type);
    setStep('config');
  }, []);

  // Go back to source selection
  const handleBack = useCallback(() => {
    setStep('source');
    setValidationError(null);
  }, []);

  // Start the import process
  const handleStartImport = useCallback(() => {
    const source = sourceType === 'git' ? gitUrl : localPath;
    if (!source.trim() || !instructions.trim()) {
      setValidationError('Please provide both the source and instructions');
      return;
    }

    setValidationError(null);
    setStep('progress');

    // Reset any previous import state (for retries)
    resetImport();

    // Start the import via WebSocket
    startImport({
      sourceType: sourceType!,
      gitUrl: sourceType === 'git' ? gitUrl : undefined,
      localPath: sourceType === 'local' ? localPath : undefined,
      instructions,
      targetThingId: targetThing.id,
      workspaceId: targetThing.workspaceId,
    });
  }, [sourceType, gitUrl, localPath, instructions, targetThing, startImport, resetImport]);

  // Cancel the import
  const handleCancel = useCallback(() => {
    cancelImport();
    handleClose();
  }, [cancelImport, handleClose]);

  // Refresh things list when import completes
  useEffect(() => {
    if (isComplete) {
      fetchThingsGraph(targetThing.workspaceId);
    }
  }, [isComplete, fetchThingsGraph, targetThing.workspaceId]);

  // Render source selection step
  const renderSourceStep = () => (
    <div className={styles.sourceStep}>
      <Text size="sm" color="soft" className={styles.stepDescription}>
        Choose how you want to import content into "{targetThing.name}"
      </Text>

      <div className={styles.sourceCards}>
        <button
          type="button"
          className={styles.sourceCard}
          onClick={() => handleSourceSelect('git')}
        >
          <CodeIcon className={styles.sourceIcon} />
          <div className={styles.sourceInfo}>
            <Text weight="medium">Git Repository</Text>
            <Text size="sm" color="soft">
              Import from a local or remote git repository
            </Text>
          </div>
        </button>

        <button
          type="button"
          className={styles.sourceCard}
          onClick={() => handleSourceSelect('local')}
        >
          <FolderIcon className={styles.sourceIcon} />
          <div className={styles.sourceInfo}>
            <Text weight="medium">Local Files</Text>
            <Text size="sm" color="soft">
              Import from documents, files, or folders on disk
            </Text>
          </div>
        </button>
      </div>
    </div>
  );

  // Render configuration step
  const renderConfigStep = () => (
    <div className={styles.configStep}>
      {error && (
        <div className={styles.error}>
          <Text size="sm">{error}</Text>
        </div>
      )}

      <div className={styles.field}>
        <label htmlFor="import-source" className={styles.label}>
          {sourceType === 'git' ? 'Repository URL' : 'Path'} <span className={styles.required}>*</span>
        </label>
        <Input
          id="import-source"
          value={sourceType === 'git' ? gitUrl : localPath}
          onChange={(e) => sourceType === 'git' ? setGitUrl(e.target.value) : setLocalPath(e.target.value)}
          placeholder={sourceType === 'git'
            ? 'https://github.com/org/repo or /path/to/local/repo'
            : '/path/to/folder or ~/Documents/project'
          }
          autoFocus
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="import-instructions" className={styles.label}>
          Instructions <span className={styles.required}>*</span>
        </label>
        <Textarea
          id="import-instructions"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder={`Describe how you want to organize the imported content as Things. For example:\n\n"Create a thing called 'Packages', and under it create a thing for each package in the monorepo. For each package, add description from its README."`}
          rows={6}
        />
        <Text size="xs" color="soft" className={styles.hint}>
          Describe the Thing structure you want to create from this source
        </Text>
      </div>
    </div>
  );

  // Render progress step
  const renderProgressStep = () => {
    const completedSubTasks = subTasks.filter(st => st.status === 'complete').length;

    return (
      <div className={styles.progressStep}>
        <div className={styles.progressList}>
          {progressSteps.map((progressStep: ImportStep) => (
            <div
              key={progressStep.id}
              className={`${styles.progressItem} ${styles[progressStep.status]}`}
            >
              <div className={styles.progressIcon}>
                {progressStep.status === 'complete' && <CheckIcon className={styles.checkIcon} />}
                {progressStep.status === 'running' && <Spinner size="sm" />}
                {progressStep.status === 'error' && <CloseIcon className={styles.errorIcon} />}
                {progressStep.status === 'pending' && <span className={styles.pendingDot} />}
              </div>
              <div className={styles.progressContent}>
                <Text size="sm" className={styles.progressLabel}>{progressStep.label}</Text>
                {progressStep.detail && (
                  <Text size="xs" color="soft">{progressStep.detail}</Text>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Sub-tasks grid for decomposed imports */}
        {isDecomposed && subTasks.length > 0 && (
          <div className={styles.subTasksContainer}>
            <div className={styles.subTasksHeader}>
              <Text className={styles.subTasksTitle}>Parallel Analysis</Text>
              <span className={styles.subTasksCount}>
                {completedSubTasks}/{subTasks.length}
              </span>
            </div>
            <div className={styles.subTasksGrid}>
              {subTasks.map((subTask: ImportSubTask) => (
                <div
                  key={subTask.id}
                  className={`${styles.subTaskItem} ${styles[subTask.status]}`}
                  title={subTask.error || subTask.name}
                >
                  <div className={styles.subTaskIcon}>
                    {subTask.status === 'complete' && <CheckIcon className={styles.checkIcon} />}
                    {subTask.status === 'running' && <Spinner size="sm" />}
                    {subTask.status === 'error' && <CloseIcon className={styles.errorIcon} />}
                    {subTask.status === 'pending' && <span className={styles.pendingDot} />}
                  </div>
                  <span className={styles.subTaskName}>{subTask.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className={styles.error}>
            <Text size="sm">{error}</Text>
          </div>
        )}
      </div>
    );
  };

  // Render footer based on current step
  const renderFooter = () => {
    if (step === 'source') {
      return (
        <div className={styles.footer}>
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
        </div>
      );
    }

    if (step === 'config') {
      return (
        <div className={styles.footer}>
          <Button variant="ghost" onClick={handleBack}>
            Back
          </Button>
          <Button
            variant="primary"
            onClick={handleStartImport}
            disabled={!(sourceType === 'git' ? gitUrl.trim() : localPath.trim()) || !instructions.trim()}
          >
            Import
          </Button>
        </div>
      );
    }

    // Progress step
    return (
      <div className={styles.footer}>
        {isComplete ? (
          <Button variant="primary" onClick={handleClose}>
            Done
          </Button>
        ) : error && !isRunning ? (
          // Show Retry when there's an error and not currently running
          <>
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleStartImport}>
              Retry
            </Button>
          </>
        ) : (
          <Button variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
        )}
      </div>
    );
  };

  // Prevent closing during import - use no-op function instead of undefined
  const handleDialogClose = useCallback(() => {
    if (!isRunning) {
      handleClose();
    }
  }, [isRunning, handleClose]);

  // Handle submit based on current step
  const handleDialogSubmit = useCallback(() => {
    if (step === 'config') {
      handleStartImport();
    } else if (step === 'progress') {
      if (isComplete) {
        handleClose();
      } else if (error && !isRunning) {
        handleStartImport(); // Retry
      }
    }
  }, [step, isComplete, error, isRunning, handleStartImport, handleClose]);

  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
      onSubmit={handleDialogSubmit}
      title={`Import into "${targetThing.name}"`}
      size="md"
      footer={renderFooter()}
    >
      {step === 'source' && renderSourceStep()}
      {step === 'config' && renderConfigStep()}
      {step === 'progress' && renderProgressStep()}
    </Dialog>
  );
}
