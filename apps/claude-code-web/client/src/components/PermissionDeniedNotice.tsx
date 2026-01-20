import { Text } from '@ui-kit/react';
import { WarningIcon } from '@ui-kit/icons/WarningIcon';

import styles from './PermissionDeniedNotice.module.css';

export interface PermissionDeniedNoticeProps {
  /** Tool name that was denied */
  toolName: string;
  /** Reason the permission was denied */
  reason: string;
}

/**
 * PermissionDeniedNotice displays inline in the message stream
 * when a permission has been denied.
 */
export function PermissionDeniedNotice({
  toolName,
  reason,
}: PermissionDeniedNoticeProps) {
  return (
    <div className={styles.notice}>
      <WarningIcon className={styles.icon} />
      <Text size="sm" color="soft" className={styles.text}>
        {toolName} was denied: {reason}
      </Text>
    </div>
  );
}

PermissionDeniedNotice.displayName = 'PermissionDeniedNotice';
