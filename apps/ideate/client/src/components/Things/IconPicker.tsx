import { useState, useRef, useEffect, type ReactNode } from 'react';
import { Button } from '@ui-kit/react';
import { FolderIcon } from '@ui-kit/icons/FolderIcon';
import { FileIcon } from '@ui-kit/icons/FileIcon';
import { CodeIcon } from '@ui-kit/icons/CodeIcon';
import { GearIcon } from '@ui-kit/icons/GearIcon';
import { StarIcon } from '@ui-kit/icons/StarIcon';
import { HeartIcon } from '@ui-kit/icons/HeartIcon';
import { HomeIcon } from '@ui-kit/icons/HomeIcon';
import { CalendarIcon } from '@ui-kit/icons/CalendarIcon';
import { ChatIcon } from '@ui-kit/icons/ChatIcon';
import { UserIcon } from '@ui-kit/icons/UserIcon';
import { UsersIcon } from '@ui-kit/icons/UsersIcon';
import { BellIcon } from '@ui-kit/icons/BellIcon';
import { LinkIcon } from '@ui-kit/icons/LinkIcon';
import { ImageIcon } from '@ui-kit/icons/ImageIcon';
import { ClockIcon } from '@ui-kit/icons/ClockIcon';
import { CheckCircleIcon } from '@ui-kit/icons/CheckCircleIcon';
import { WarningIcon } from '@ui-kit/icons/WarningIcon';
import { InfoIcon } from '@ui-kit/icons/InfoIcon';
import { TableIcon } from '@ui-kit/icons/TableIcon';
import { ListTaskIcon } from '@ui-kit/icons/ListTaskIcon';
import { PackageIcon } from '@ui-kit/icons/PackageIcon';
import { GlobeIcon } from '@ui-kit/icons/GlobeIcon';
import type { ThingIcon } from '../../types/thing';
import styles from './IconPicker.module.css';

interface IconPickerProps {
  value?: ThingIcon;
  onChange: (icon: ThingIcon | null) => void;
  size?: 'sm' | 'md';
}

// Map icon names to components
const ICON_MAP: Record<ThingIcon, ReactNode> = {
  folder: <FolderIcon />,
  file: <FileIcon />,
  code: <CodeIcon />,
  gear: <GearIcon />,
  star: <StarIcon />,
  heart: <HeartIcon />,
  home: <HomeIcon />,
  calendar: <CalendarIcon />,
  chat: <ChatIcon />,
  user: <UserIcon />,
  users: <UsersIcon />,
  bell: <BellIcon />,
  link: <LinkIcon />,
  image: <ImageIcon />,
  clock: <ClockIcon />,
  'check-circle': <CheckCircleIcon />,
  warning: <WarningIcon />,
  info: <InfoIcon />,
  table: <TableIcon />,
  'list-task': <ListTaskIcon />,
  package: <PackageIcon />,
  globe: <GlobeIcon />,
};

const ICON_NAMES = Object.keys(ICON_MAP) as ThingIcon[];

export function IconPicker({ value, onChange, size = 'md' }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelect = (icon: ThingIcon) => {
    onChange(icon === value ? null : icon);
    setIsOpen(false);
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <Button
        variant="ghost"
        size={size}
        onClick={() => setIsOpen(!isOpen)}
        className={styles.trigger}
        aria-label="Pick icon"
        aria-expanded={isOpen}
      >
        {value ? ICON_MAP[value] : <span className={styles.placeholder}>+</span>}
      </Button>

      {isOpen && (
        <div className={styles.popover}>
          <div className={styles.grid}>
            {ICON_NAMES.map((iconName) => (
              <button
                key={iconName}
                type="button"
                className={`${styles.iconButton} ${value === iconName ? styles.selected : ''}`}
                onClick={() => handleSelect(iconName)}
                title={iconName}
              >
                {ICON_MAP[iconName]}
              </button>
            ))}
          </div>
          {value && (
            <button
              type="button"
              className={styles.clearButton}
              onClick={() => {
                onChange(null);
                setIsOpen(false);
              }}
            >
              Clear icon
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Export icon component getter for use elsewhere
export function getThingIcon(icon: ThingIcon): ReactNode {
  return ICON_MAP[icon] || null;
}
