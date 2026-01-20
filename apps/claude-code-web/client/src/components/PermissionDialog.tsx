import { useCallback, useMemo, type ReactNode } from 'react';

import { Dialog, Button, Text, Code, FileDiff } from '@ui-kit/react';
import { CodeBlock } from '@ui-kit/react-markdown';

import { generateInlineDiff } from '../utils/diffGenerator';
import { detectLanguage } from '../utils/languageDetection';
import styles from './PermissionDialog.module.css';

export interface PermissionDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Tool name requesting permission */
  toolName: string;
  /** Tool input parameters */
  input: Record<string, unknown>;
  /** Called when user approves the action */
  onApprove: () => void;
  /** Called when user denies the action */
  onDeny: () => void;
  /** Called when user chooses to always allow this tool */
  onApproveAlways: () => void;
}

/**
 * Formats tool input for display based on tool type.
 */
function formatToolInput(toolName: string, input: Record<string, unknown>): string {
  switch (toolName) {
    case 'Bash': {
      const command = input.command as string | undefined;

      return command ? `Command: ${command}` : JSON.stringify(input, null, 2);
    }

    case 'Write': {
      const filePath = input.file_path as string | undefined;
      const content = input.content as string | undefined;
      const preview = content && content.length > 200
        ? `${content.substring(0, 200)}...`
        : content;

      return filePath
        ? `File: ${filePath}\n\nContent:\n${preview || '(empty)'}`
        : JSON.stringify(input, null, 2);
    }

    case 'Edit': {
      const filePath = input.file_path as string | undefined;
      const oldString = input.old_string as string | undefined;
      const newString = input.new_string as string | undefined;

      if (filePath) {
        const lines = [`File: ${filePath}`];

        if (oldString) {
          lines.push(`\nReplace:\n${oldString}`);
        }
        if (newString) {
          lines.push(`\nWith:\n${newString}`);
        }

        return lines.join('');
      }

      return JSON.stringify(input, null, 2);
    }

    case 'Read': {
      const filePath = input.file_path as string | undefined;
      const offset = input.offset as number | undefined;
      const limit = input.limit as number | undefined;

      if (filePath) {
        let result = `File: ${filePath}`;

        if (offset !== undefined) result += `\nOffset: ${offset}`;
        if (limit !== undefined) result += `\nLimit: ${limit}`;

        return result;
      }

      return JSON.stringify(input, null, 2);
    }

    case 'Glob': {
      const pattern = input.pattern as string | undefined;
      const path = input.path as string | undefined;

      if (pattern) {
        let result = `Pattern: ${pattern}`;

        if (path) result += `\nPath: ${path}`;

        return result;
      }

      return JSON.stringify(input, null, 2);
    }

    case 'Grep': {
      const pattern = input.pattern as string | undefined;
      const path = input.path as string | undefined;
      const caseInsensitive = input.case_insensitive as boolean | undefined;

      if (pattern) {
        let result = `Pattern: ${pattern}`;

        if (path) result += `\nPath: ${path}`;
        if (caseInsensitive) result += `\nCase insensitive: yes`;

        return result;
      }

      return JSON.stringify(input, null, 2);
    }

    default:
      return JSON.stringify(input, null, 2);
  }
}

/**
 * Renders rich preview content for Edit and Write tools.
 * Returns null for other tools (they use formatToolInput text).
 */
function renderToolPreview(
  toolName: string,
  input: Record<string, unknown>
): ReactNode | null {
  switch (toolName) {
    case 'Edit': {
      const filePath = input.file_path as string | undefined;
      const oldString = input.old_string as string | undefined;
      const newString = input.new_string as string | undefined;

      if (filePath && oldString !== undefined && newString !== undefined) {
        const diffString = generateInlineDiff(oldString, newString);

        return (
          <div className={styles.richPreview}>
            <div className={styles.previewLabel}>
              <Text weight="medium">File: {filePath}</Text>
            </div>
            <FileDiff
              path={filePath}
              changeType="modified"
              diff={diffString}
              showHeader={false}
              compact={true}
              maxHeight="250px"
            />
          </div>
        );
      }

      return null;
    }

    case 'Write': {
      const filePath = input.file_path as string | undefined;
      const content = input.content as string | undefined;

      if (filePath && content !== undefined) {
        const language = detectLanguage(filePath);
        const previewContent = content.length > 2000
          ? content.substring(0, 2000) + '\n... (truncated)'
          : content;

        return (
          <div className={styles.richPreview}>
            <div className={styles.previewLabel}>
              <Text weight="medium">File: {filePath}</Text>
            </div>
            <div className={styles.codePreview}>
              <CodeBlock
                code={previewContent}
                language={language}
                showLineNumbers={true}
                maxHeight={250}
              />
            </div>
          </div>
        );
      }

      return null;
    }

    default:
      return null;
  }
}

/**
 * PermissionDialog displays when the SDK requests tool approval.
 * Allows users to approve, deny, or approve-always for a tool.
 */
export function PermissionDialog({
  open,
  toolName,
  input,
  onApprove,
  onDeny,
  onApproveAlways,
}: PermissionDialogProps) {
  const formattedInput = formatToolInput(toolName, input);

  const richPreview = useMemo(
    () => renderToolPreview(toolName, input),
    [toolName, input]
  );

  const handleClose = useCallback(() => {
    onDeny();
  }, [onDeny]);

  const footer = (
    <div className={styles.actions}>
      <Button variant="ghost" onClick={onDeny}>
        Deny
      </Button>
      <Button variant="outline" onClick={onApproveAlways}>
        Always Allow
      </Button>
      <Button variant="primary" onClick={onApprove}>
        Allow
      </Button>
    </div>
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={`Allow ${toolName}?`}
      footer={footer}
      size="md"
    >
      <div className={styles.content}>
        <Text color="soft">
          Claude wants to use the {toolName} tool with the following input:
        </Text>
        {richPreview ? (
          richPreview
        ) : (
          <div className={styles.inputPreview}>
            <Code>{formattedInput}</Code>
          </div>
        )}
      </div>
    </Dialog>
  );
}

PermissionDialog.displayName = 'PermissionDialog';
