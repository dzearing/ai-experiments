import { Spinner } from '@ui-kit/react';
import { CheckCircleIcon } from '@ui-kit/icons/CheckCircleIcon';
import { useSave } from '../../contexts/SaveContext';
import styles from './SaveIndicator.module.css';

export function SaveIndicator() {
  const { saveState } = useSave();

  return (
    <div className={styles.saveIndicator} data-state={saveState}>
      {saveState === 'saving' && (
        <>
          <Spinner size="sm" />
          <span>Saving</span>
        </>
      )}
      {saveState === 'saved' && (
        <>
          <CheckCircleIcon size={14} />
          <span>Saved</span>
        </>
      )}
    </div>
  );
}
