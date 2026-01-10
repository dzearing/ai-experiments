import { useState, useEffect, type ReactNode } from 'react';
import { Dialog } from '@ui-kit/react';
import { generateSurfaceFromPreset, type SurfaceColors } from '@ui-kit/core';
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
import type { TopicIcon, TopicColor } from '../../types/topic';
import styles from './TopicStylePicker.module.css';

interface TopicStylePickerProps {
  icon?: TopicIcon | null;
  color?: TopicColor | null;
  onIconChange: (icon: TopicIcon | null) => void;
  onColorChange: (color: TopicColor | null) => void;
}

// Map TopicIcon to React components
const ICON_MAP: Record<TopicIcon, ReactNode> = {
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

const ICON_NAMES = Object.keys(ICON_MAP) as TopicIcon[];

// Map TopicColor to surface preset names
const COLOR_TO_PRESET: Record<TopicColor, string> = {
  default: 'steel',
  blue: 'sky',
  green: 'emerald',
  purple: 'grape',
  orange: 'tangerine',
  red: 'crimson',
  teal: 'teal',
  pink: 'rose',
  yellow: 'gold',
  gray: 'steel',
};

const COLOR_NAMES = Object.keys(COLOR_TO_PRESET) as TopicColor[];

// Get surface colors for a TopicColor
function getSurfaceColors(color: TopicColor, mode: 'light' | 'dark' = 'light'): SurfaceColors | null {
  const presetName = COLOR_TO_PRESET[color];
  return generateSurfaceFromPreset(presetName, mode);
}

export function TopicStylePicker({
  icon,
  color,
  onIconChange,
  onColorChange,
}: TopicStylePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const currentSurfaceColors = color ? getSurfaceColors(color, isDark ? 'dark' : 'light') : null;
  const currentIcon = icon ? ICON_MAP[icon] : <FolderIcon />;

  const triggerStyle = currentSurfaceColors ? {
    backgroundColor: currentSurfaceColors.bg,
    color: currentSurfaceColors.icon,
    borderColor: currentSurfaceColors.border,
  } : undefined;

  const handleIconSelect = (iconName: TopicIcon) => {
    onIconChange(iconName === icon ? null : iconName);
  };

  const handleColorSelect = (colorName: TopicColor) => {
    onColorChange(colorName === color ? null : colorName);
  };

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        style={triggerStyle}
        onClick={() => setIsOpen(true)}
        aria-label="Change icon and color"
      >
        <span className={styles.iconWrapper}>
          {currentIcon}
        </span>
      </button>

      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title="Icon & Color"
        size="sm"
      >
        <div className={styles.content}>
          {/* Color section */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Color</h3>
            <div className={styles.colorGrid}>
              {COLOR_NAMES.map((colorName) => {
                const surfaceColors = getSurfaceColors(colorName, isDark ? 'dark' : 'light');
                const isSelected = color === colorName;

                return (
                  <button
                    key={colorName}
                    type="button"
                    className={`${styles.colorButton} ${isSelected ? styles.selected : ''}`}
                    style={surfaceColors ? {
                      backgroundColor: surfaceColors.bg,
                      borderColor: surfaceColors.border,
                    } : undefined}
                    onClick={() => handleColorSelect(colorName)}
                    title={colorName.charAt(0).toUpperCase() + colorName.slice(1)}
                  >
                    {isSelected && <span className={styles.checkmark}>✓</span>}
                  </button>
                );
              })}
            </div>
            {color && (
              <button
                type="button"
                className={styles.clearButton}
                onClick={() => onColorChange(null)}
              >
                Clear color
              </button>
            )}
          </div>

          {/* Icon section */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Icon</h3>
            <div className={styles.iconGrid}>
              {ICON_NAMES.map((iconName) => {
                const isSelected = icon === iconName;
                const surfaceColors = color ? getSurfaceColors(color, isDark ? 'dark' : 'light') : null;

                return (
                  <button
                    key={iconName}
                    type="button"
                    className={`${styles.iconButton} ${isSelected ? styles.selected : ''}`}
                    style={isSelected && surfaceColors ? {
                      backgroundColor: surfaceColors.bg,
                      color: surfaceColors.icon,
                      borderColor: surfaceColors.border,
                    } : undefined}
                    onClick={() => handleIconSelect(iconName)}
                    title={iconName}
                  >
                    {ICON_MAP[iconName]}
                  </button>
                );
              })}
            </div>
            {icon && (
              <button
                type="button"
                className={styles.clearButton}
                onClick={() => onIconChange(null)}
              >
                Clear icon
              </button>
            )}
          </div>
        </div>
      </Dialog>
    </>
  );
}

// Export helper for getting icon element
export function getTopicIcon(icon: TopicIcon): ReactNode {
  return ICON_MAP[icon] || null;
}

// Export helper for getting surface colors
export { getSurfaceColors };
