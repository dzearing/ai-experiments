import { type ReactElement, cloneElement, Children, isValidElement } from 'react';
import { type AvatarProps, type AvatarSize } from '../Avatar';
import { Tooltip } from '../Tooltip';
import styles from './AvatarGroup.module.css';

export interface AvatarGroupProps {
  /** Avatar elements to display */
  children: ReactElement<AvatarProps> | ReactElement<AvatarProps>[];
  /** Maximum number of avatars to show before overflow */
  max?: number;
  /** Size of all avatars in the group */
  size?: AvatarSize;
  /** Additional CSS class */
  className?: string;
}

export function AvatarGroup({
  children,
  max = 4,
  size = 'sm',
  className = '',
}: AvatarGroupProps) {
  const avatars = Children.toArray(children).filter(isValidElement) as ReactElement<AvatarProps>[];
  const visibleAvatars = avatars.slice(0, max);
  const overflowCount = avatars.length - max;

  return (
    <div className={`${styles.avatarGroup} ${className}`}>
      {visibleAvatars.map((avatar, index) => {
        // Get the fallback name for tooltip
        const name = typeof avatar.props.fallback === 'string' ? avatar.props.fallback : '';

        const wrappedAvatar = (
          <div key={index} className={styles.avatarWrapper}>
            {cloneElement(avatar, { size })}
          </div>
        );

        if (name) {
          return (
            <Tooltip key={index} content={name} position="bottom">
              {wrappedAvatar}
            </Tooltip>
          );
        }

        return wrappedAvatar;
      })}
      {overflowCount > 0 && (
        <Tooltip content={`${overflowCount} more`} position="bottom">
          <span className={`${styles.overflow} ${styles[size]}`}>
            +{overflowCount}
          </span>
        </Tooltip>
      )}
    </div>
  );
}

AvatarGroup.displayName = 'AvatarGroup';
