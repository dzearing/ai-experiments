import { FileIcon } from '@ui-kit/icons/FileIcon';
import { type DocumentMetadata } from '../../contexts/DocumentContext';
import { ResourceCard } from '../ResourceCard';
import type { ResourcePresence } from '../../hooks/useWorkspaceSocket';

export interface DocumentCardProps {
  document: DocumentMetadata;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
  /** Presence info for users viewing this document */
  presence?: ResourcePresence[];
}

export function DocumentCard({ document, onClick, onEdit, onDelete, showActions = false, presence }: DocumentCardProps) {
  return (
    <ResourceCard
      icon={<FileIcon />}
      title={document.title}
      updatedAt={document.updatedAt}
      onClick={onClick}
      onEdit={showActions ? onEdit : undefined}
      onDelete={showActions ? onDelete : undefined}
      presence={presence}
    />
  );
}
