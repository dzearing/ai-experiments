import { useState } from 'react';

import { Segmented, Dialog, Button, Text, Tooltip } from '@ui-kit/react';
import type { SegmentOption } from '@ui-kit/react';
import { CheckCircleIcon } from '@ui-kit/icons/CheckCircleIcon';
import { ListTaskIcon } from '@ui-kit/icons/ListTaskIcon';
import { EditIcon } from '@ui-kit/icons/EditIcon';
import { PlayIcon } from '@ui-kit/icons/PlayIcon';

import type { PermissionMode } from '../types/agent';
import styles from './ModeSelector.module.css';

/**
 * Mode metadata with labels, icons, and descriptions.
 */
const MODE_INFO: Record<PermissionMode, { label: string; icon: React.ReactNode; description: string }> = {
  default: {
    label: 'Default',
    icon: <CheckCircleIcon size={16} />,
    description: 'Prompts for tool approval',
  },
  plan: {
    label: 'Plan',
    icon: <ListTaskIcon size={16} />,
    description: 'Read-only mode, no execution',
  },
  acceptEdits: {
    label: 'Edits',
    icon: <EditIcon size={16} />,
    description: 'Auto-approves file modifications',
  },
  bypassPermissions: {
    label: 'Auto',
    icon: <PlayIcon size={16} />,
    description: 'Auto-approves all tools (use with caution)',
  },
};

/**
 * Props for the ModeSelector component.
 */
interface ModeSelectorProps {
  /** Current permission mode */
  mode: PermissionMode;
  /** Callback when mode changes */
  onChange: (mode: PermissionMode) => void;
  /** Whether the selector is disabled */
  disabled?: boolean;
}

/**
 * ModeSelector allows users to switch between permission modes.
 * Shows a confirmation dialog before enabling bypassPermissions mode.
 */
export function ModeSelector({ mode, onChange, disabled = false }: ModeSelectorProps) {
  const [showBypassWarning, setShowBypassWarning] = useState(false);
  const [pendingMode, setPendingMode] = useState<PermissionMode | null>(null);

  const handleChange = (newMode: string) => {
    if (newMode === 'bypassPermissions') {
      // Show confirmation dialog for bypass mode
      setPendingMode(newMode as PermissionMode);
      setShowBypassWarning(true);
    } else {
      onChange(newMode as PermissionMode);
    }
  };

  const handleConfirmBypass = () => {
    if (pendingMode) {
      onChange(pendingMode);
    }

    setShowBypassWarning(false);
    setPendingMode(null);
  };

  const handleCancelBypass = () => {
    setShowBypassWarning(false);
    setPendingMode(null);
  };

  const options: SegmentOption[] = Object.entries(MODE_INFO).map(([value, info]) => ({
    value,
    label: info.label,
    icon: info.icon,
  }));

  const currentModeDescription = MODE_INFO[mode]?.description ?? '';

  return (
    <div className={styles.container}>
      <Tooltip content={currentModeDescription} position="bottom">
        <Segmented
          options={options}
          value={mode}
          onChange={handleChange}
          disabled={disabled}
          size="sm"
          aria-label="Permission mode"
        />
      </Tooltip>

      <Dialog
        open={showBypassWarning}
        onClose={handleCancelBypass}
        title="Enable Auto Mode?"
        size="sm"
        footer={
          <div className={styles.dialogActions}>
            <Button variant="ghost" onClick={handleCancelBypass}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirmBypass}>
              Enable Auto Mode
            </Button>
          </div>
        }
      >
        <Text>
          Auto mode bypasses all permission checks. Claude will execute commands without asking for approval.
        </Text>
        <Text className={styles.warningText}>
          Use with caution - this allows Claude to modify files, run commands, and make changes without confirmation.
        </Text>
      </Dialog>
    </div>
  );
}
