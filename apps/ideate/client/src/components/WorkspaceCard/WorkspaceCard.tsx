import { FolderIcon } from '@ui-kit/icons/FolderIcon';
import { type WorkspaceMetadata } from '../../contexts/WorkspaceContext';
import { ResourceCard } from '../ResourceCard';

export interface WorkspaceCardProps {
  workspace: WorkspaceMetadata;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

export function WorkspaceCard({ workspace, onClick, onEdit, onDelete, showActions = false }: WorkspaceCardProps) {
  return (
    <ResourceCard
      icon={<FolderIcon />}
      title={workspace.name}
      description={workspace.description}
      updatedAt={workspace.updatedAt}
      onClick={onClick}
      onEdit={showActions ? onEdit : undefined}
      onDelete={showActions ? onDelete : undefined}
    />
  );
}
