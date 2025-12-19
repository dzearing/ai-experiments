import { Card, IconButton, Menu } from '@ui-kit/react';
import { MoreHorizontalIcon } from '@ui-kit/icons/MoreHorizontalIcon';
import { EditIcon } from '@ui-kit/icons/EditIcon';
import { TrashIcon } from '@ui-kit/icons/TrashIcon';
import { getTimeAgo } from '../../utils/timeAgo';
import styles from './ResourceCard.module.css';

export interface ResourceCardProps {
  /** Icon to display */
  icon: React.ReactNode;
  /** Title of the resource */
  title: string;
  /** Optional description */
  description?: string;
  /** Last updated date */
  updatedAt: string | Date;
  /** Click handler */
  onClick: () => void;
  /** Edit handler (shows edit option in menu if provided) */
  onEdit?: () => void;
  /** Delete handler (shows delete option in menu if provided) */
  onDelete?: () => void;
}

export function ResourceCard({
  icon,
  title,
  description,
  updatedAt,
  onClick,
  onEdit,
  onDelete,
}: ResourceCardProps) {
  const updatedDate = typeof updatedAt === 'string' ? new Date(updatedAt) : updatedAt;
  const timeAgo = getTimeAgo(updatedDate);

  // Build menu items based on available actions
  const menuItems = [];
  if (onEdit) {
    menuItems.push({ value: 'edit', label: 'Edit', icon: <EditIcon /> });
  }
  if (onDelete) {
    menuItems.push({ value: 'delete', label: 'Delete', icon: <TrashIcon /> });
  }

  const handleMenuSelect = (value: string) => {
    if (value === 'edit' && onEdit) {
      onEdit();
    } else if (value === 'delete' && onDelete) {
      onDelete();
    }
  };

  return (
    <Card className={styles.resourceCard} onClick={onClick}>
      <div className={styles.cardHeader}>
        <div className={styles.resourceIcon}>
          {icon}
        </div>
        {menuItems.length > 0 && (
          <div className={styles.cardActions} onClick={(e) => e.stopPropagation()}>
            <Menu
              items={menuItems}
              onSelect={handleMenuSelect}
              position="bottom-end"
            >
              <IconButton
                icon={<MoreHorizontalIcon />}
                variant="ghost"
                aria-label="More options"
              />
            </Menu>
          </div>
        )}
      </div>
      <h3 className={styles.resourceTitle}>{title}</h3>
      {description && (
        <p className={styles.resourceDescription}>{description}</p>
      )}
      <p className={styles.resourceMeta}>Updated {timeAgo}</p>
    </Card>
  );
}
