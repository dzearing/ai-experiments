import { FileIcon } from '@ui-kit/icons/FileIcon';
import { type DocumentMetadata } from '../../contexts/DocumentContext';
import { ResourceCard } from '../ResourceCard';

export interface DocumentCardProps {
  document: DocumentMetadata;
  onClick: () => void;
  onDelete?: () => void;
  showDelete?: boolean;
}

export function DocumentCard({ document, onClick, onDelete, showDelete = false }: DocumentCardProps) {
  return (
    <ResourceCard
      icon={<FileIcon />}
      title={document.title}
      updatedAt={document.updatedAt}
      onClick={onClick}
      onDelete={showDelete ? onDelete : undefined}
    />
  );
}
