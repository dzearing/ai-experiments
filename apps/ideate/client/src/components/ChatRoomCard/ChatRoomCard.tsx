import { ChatIcon } from '@ui-kit/icons/ChatIcon';
import { type ChatRoomMetadata } from '../../contexts/ChatContext';
import { ResourceCard } from '../ResourceCard';
import type { ResourcePresence } from '../../hooks/useWorkspaceSocket';

export interface ChatRoomCardProps {
  chatRoom: ChatRoomMetadata;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
  /** Presence info for users viewing this chat room */
  presence?: ResourcePresence[];
}

export function ChatRoomCard({ chatRoom, onClick, onEdit, onDelete, showActions = false, presence }: ChatRoomCardProps) {
  return (
    <ResourceCard
      icon={<ChatIcon />}
      title={chatRoom.name}
      updatedAt={chatRoom.updatedAt}
      onClick={onClick}
      onEdit={showActions ? onEdit : undefined}
      onDelete={showActions ? onDelete : undefined}
      presence={presence}
    />
  );
}
