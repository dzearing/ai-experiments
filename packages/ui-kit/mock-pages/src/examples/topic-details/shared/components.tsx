/**
 * Shared components for Topic Details pages
 */
import { ReactNode } from 'react';
import {
  Button,
  Heading,
  IconButton,
  Tabs,
} from '@ui-kit/react';
import { ChatIcon } from '@ui-kit/icons/ChatIcon';
import { EditIcon } from '@ui-kit/icons/EditIcon';
import { ImageIcon } from '@ui-kit/icons/ImageIcon';
import { ShareIcon } from '@ui-kit/icons/ShareIcon';
import styles from './styles.module.css';

interface HeroSectionProps {
  title: string;
  heroImage?: string;
  tags?: string[];
  children?: ReactNode;
  actions?: ReactNode;
}

export function HeroSection({ title, heroImage, tags, children, actions }: HeroSectionProps) {
  return (
    <div className={styles.heroSection}>
      {heroImage ? (
        <div className={styles.heroImage} style={{ backgroundImage: `url(${heroImage})` }}>
          <div className={styles.heroActions}>
            {actions || (
              <>
                <Button variant="primary" icon={<ChatIcon />} className={`${styles.heroActionButton} ${styles.askButton}`}>
                  Chat about this
                </Button>
                <IconButton variant="ghost" icon={<EditIcon />} aria-label="Edit topic" className={styles.heroActionButton} />
                <IconButton variant="ghost" icon={<ShareIcon />} aria-label="Share" className={styles.heroActionButton} />
              </>
            )}
          </div>
          <div className={styles.heroOverlay}>
            {tags && tags.length > 0 && (
              <div className={styles.heroTags}>
                {tags.map(tag => (
                  <span key={tag} className={styles.heroTag}>#{tag}</span>
                ))}
              </div>
            )}
            <Heading level={1} size={1} className={styles.heroTitle}>{title}</Heading>
            {children}
          </div>
        </div>
      ) : (
        <div className={styles.heroPlaceholder}>
          <ImageIcon className={styles.heroPlaceholderIcon} />
          <Heading level={1} size={2}>{title}</Heading>
        </div>
      )}
    </div>
  );
}

interface QuickStatsProps {
  children: ReactNode;
  className?: string;
}

export function QuickStats({ children, className }: QuickStatsProps) {
  return (
    <div className={`${styles.quickStats} ${className || ''}`}>
      {children}
    </div>
  );
}

interface StatItemProps {
  icon?: ReactNode;
  value: string | number;
  label: string;
}

export function StatItem({ icon, value, label }: StatItemProps) {
  return (
    <div className={styles.statItem}>
      {icon && <span className={styles.statIcon}>{icon}</span>}
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}

interface TabLayoutProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: { value: string; label: string; content: null }[];
  children: ReactNode;
}

export function TabLayout({ activeTab, onTabChange, tabs, children }: TabLayoutProps) {
  return (
    <>
      <Tabs
        value={activeTab}
        onChange={onTabChange}
        variant="underline"
        items={tabs}
        className={styles.tabs}
      />
      <div className={styles.tabContent}>
        {children}
      </div>
    </>
  );
}

interface TopicContainerProps {
  children: ReactNode;
}

export function TopicContainer({ children }: TopicContainerProps) {
  return <div className={styles.container}>{children}</div>;
}

interface ActionButtonsProps {
  children: ReactNode;
}

export function ActionButtons({ children }: ActionButtonsProps) {
  return <div className={styles.actionButtons}>{children}</div>;
}

interface OverviewColumnsProps {
  left: ReactNode;
  right: ReactNode;
  className?: string;
}

export function OverviewColumns({ left, right, className }: OverviewColumnsProps) {
  return (
    <div className={`${styles.productOverviewColumns} ${className || ''}`}>
      <div className={styles.productOverviewLeft}>{left}</div>
      <div className={styles.productOverviewRight}>{right}</div>
    </div>
  );
}

interface SidebarCardProps {
  children: ReactNode;
  className?: string;
}

export function SidebarCard({ children, className }: SidebarCardProps) {
  return (
    <div className={`${styles.actionsCard} ${className || ''}`}>
      {children}
    </div>
  );
}
