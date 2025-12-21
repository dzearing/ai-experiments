import { FileIcon } from '@ui-kit/icons/FileIcon';
import { type DocumentMetadata } from '../../contexts/DocumentContext';
import { ResourceCard } from '../ResourceCard';

export interface DocumentCardProps {
  document: DocumentMetadata;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

export function DocumentCard({ document, onClick, onEdit, onDelete, showActions = false }: DocumentCardProps) {
  return (
    <ResourceCard
      icon={<FileIcon />}
      title={document.title}
      updatedAt={document.updatedAt}
      onClick={onClick}
      onEdit={showActions ? onEdit : undefined}
      onDelete={showActions ? onDelete : undefined}
    />
  );
}
