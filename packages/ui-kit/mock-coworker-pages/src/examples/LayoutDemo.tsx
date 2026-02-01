import { useState } from 'react';
import {
  TitleBar,
  PageHeader,
  SidePanel,
  ContentLayout,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@ui-kit/react';
import { HomeIcon } from '@ui-kit/icons/HomeIcon';
import { FileIcon } from '@ui-kit/icons/FileIcon';
import { GearIcon } from '@ui-kit/icons/GearIcon';
import { UsersIcon } from '@ui-kit/icons/UsersIcon';
import { ChevronLeftIcon } from '@ui-kit/icons/ChevronLeftIcon';
import { BellIcon } from '@ui-kit/icons/BellIcon';
import { MenuIcon } from '@ui-kit/icons/MenuIcon';
import styles from './LayoutDemo.module.css';

/**
 * LayoutDemo - Integration example showing all layout components together
 *
 * This demo mirrors a realistic coworker application structure with:
 * - TitleBar: App-level navigation with logo, tabs, and user actions
 * - SidePanel: Collapsible navigation in push mode
 * - ContentLayout: Page structure with PageHeader and content
 * - PageHeader: Page-level navigation with breadcrumbs and actions
 */

// Simple logo placeholder
function AppLogo() {
  return (
    <div className={styles.logo}>
      <span className={styles.logoIcon}>C</span>
    </div>
  );
}

// Profile avatar button
function ProfileButton() {
  return (
    <div className={styles.profileArea}>
      <IconButton
        variant="ghost"
        size="sm"
        icon={<BellIcon />}
        aria-label="Notifications"
      />
      <div className={styles.avatar}>JD</div>
    </div>
  );
}

// Navigation items for the side panel
interface NavItem {
  icon: React.ReactNode;
  label: string;
  value: string;
}

const navItems: NavItem[] = [
  { icon: <HomeIcon />, label: 'Dashboard', value: 'dashboard' },
  { icon: <FileIcon />, label: 'Projects', value: 'projects' },
  { icon: <UsersIcon />, label: 'Team', value: 'team' },
  { icon: <GearIcon />, label: 'Settings', value: 'settings' },
];

// Side panel header with title and collapse button
function SidePanelHeader({ onCollapse }: { onCollapse: () => void }) {
  return (
    <div className={styles.sidePanelHeader}>
      <span className={styles.sidePanelTitle}>Navigation</span>
      <IconButton
        variant="ghost"
        size="sm"
        icon={<ChevronLeftIcon />}
        aria-label="Collapse sidebar"
        onClick={onCollapse}
      />
    </div>
  );
}

// Navigation list for side panel
function NavigationList({
  activeItem,
  onItemClick,
}: {
  activeItem: string;
  onItemClick: (value: string) => void;
}) {
  return (
    <List
      density="comfortable"
      selectable
      value={activeItem}
      onSelectionChange={(value) => {
        if (typeof value === 'string') {
          onItemClick(value);
        }
      }}
    >
      {navItems.map((item) => (
        <ListItem
          key={item.value}
          value={item.value}
          leading={item.icon}
        >
          <ListItemText primary={item.label} />
        </ListItem>
      ))}
    </List>
  );
}

// Demo content showing actual page content
function DemoContent({ page }: { page: string }) {
  const pageContent: Record<string, { title: string; description: string }> = {
    dashboard: {
      title: 'Welcome to the Dashboard',
      description: 'Your workspace overview shows recent activity, quick actions, and important metrics.',
    },
    projects: {
      title: 'Your Projects',
      description: 'Manage and track all your projects in one place.',
    },
    team: {
      title: 'Team Members',
      description: 'View and manage your team collaborators.',
    },
    settings: {
      title: 'Settings',
      description: 'Configure your workspace preferences and account settings.',
    },
  };

  const content = pageContent[page] || pageContent.dashboard;

  return (
    <div className={styles.demoContent}>
      <div className={styles.contentCard}>
        <h2 className={styles.contentTitle}>{content.title}</h2>
        <p className={styles.contentDescription}>{content.description}</p>

        <Divider />

        <div className={styles.placeholderGrid}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={styles.placeholderCard}>
              <div className={styles.placeholderIcon} />
              <div className={styles.placeholderText}>
                <div className={styles.placeholderLine} />
                <div className={styles.placeholderLineShort} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Page titles for breadcrumbs
const pageTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  projects: 'Projects',
  team: 'Team',
  settings: 'Settings',
};

export function LayoutDemo() {
  const [activeTab, setActiveTab] = useState('work');
  const [sidePanelOpen, setSidePanelOpen] = useState(true);
  const [activePage, setActivePage] = useState('dashboard');

  const handleNavItemClick = (value: string) => {
    setActivePage(value);
  };

  return (
    <div className={styles.app}>
      {/* App-level TitleBar */}
      <TitleBar
        logo={<AppLogo />}
        title="Coworker"
        tabs={[
          { value: 'work', label: 'Work' },
          { value: 'web', label: 'Web' },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={<ProfileButton />}
      />

      {/* Main area with SidePanel and ContentLayout */}
      <div className={styles.mainArea}>
        {/* SidePanel in push mode */}
        <SidePanel
          open={sidePanelOpen}
          onClose={() => setSidePanelOpen(false)}
          mode="push"
          position="left"
          size="sm"
          header={<SidePanelHeader onCollapse={() => setSidePanelOpen(false)} />}
        >
          <NavigationList
            activeItem={activePage}
            onItemClick={handleNavItemClick}
          />
        </SidePanel>

        {/* Content area */}
        <ContentLayout
          header={
            <PageHeader
              breadcrumbs={[
                { label: 'Home', href: '#' },
                { label: pageTitles[activePage] },
              ]}
              title={pageTitles[activePage]}
              description={`Manage your ${activePage} workspace`}
              actions={
                <div className={styles.headerActions}>
                  {!sidePanelOpen && (
                    <IconButton
                      variant="ghost"
                      icon={<MenuIcon />}
                      aria-label="Open sidebar"
                      onClick={() => setSidePanelOpen(true)}
                    />
                  )}
                  <Button variant="outline">Export</Button>
                  <Button variant="primary">New Item</Button>
                </div>
              }
            />
          }
          maxWidth="xl"
          padding="lg"
        >
          <DemoContent page={activePage} />
        </ContentLayout>
      </div>
    </div>
  );
}

LayoutDemo.displayName = 'LayoutDemo';
