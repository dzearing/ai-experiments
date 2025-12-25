import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  Button,
  Heading,
  IconButton,
  Input,
  SearchInput,
  Segmented,
  Text,
} from '@ui-kit/react';
import { ArrowUpIcon } from '@ui-kit/icons/ArrowUpIcon';
import { ChevronLeftIcon } from '@ui-kit/icons/ChevronLeftIcon';
import { ChevronRightIcon } from '@ui-kit/icons/ChevronRightIcon';
import { CloseIcon } from '@ui-kit/icons/CloseIcon';
import { DownloadIcon } from '@ui-kit/icons/DownloadIcon';
import { FileIcon } from '@ui-kit/icons/FileIcon';
import { FolderIcon } from '@ui-kit/icons/FolderIcon';
import { HomeIcon } from '@ui-kit/icons/HomeIcon';
import { ImageIcon } from '@ui-kit/icons/ImageIcon';
import { StarIcon } from '@ui-kit/icons/StarIcon';
import { TableIcon } from '@ui-kit/icons/TableIcon';
import { AddIcon } from '@ui-kit/icons/AddIcon';
import { RefreshIcon } from '@ui-kit/icons/RefreshIcon';
import styles from './FolderSelectDialog.module.css';

/**
 * # Folder Select Dialog
 *
 * A Windows-style folder selection dialog with multiple view modes,
 * navigation, and folder browsing capabilities.
 *
 * ## Features
 * - Three view modes: Details, Tiles, Large Icons
 * - Breadcrumb navigation with clickable path segments
 * - Sidebar with quick access locations
 * - Folder selection with visual feedback
 * - Search functionality
 * - New folder creation
 *
 * ## Component Gap Analysis
 *
 * Components that would improve this implementation:
 *
 * 1. **FileExplorer** - Reusable file/folder browsing component
 * 2. **Breadcrumb** - Path navigation with overflow handling
 * 3. **TreeView** - Hierarchical folder tree in sidebar
 * 4. **VirtualList** - For large directory listings
 * 5. **ContextMenu** - Right-click actions on items
 */

// ============================================
// DATA TYPES
// ============================================

type ViewMode = 'details' | 'tiles' | 'icons';

interface FolderItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  size?: number;
  modifiedAt: Date;
  icon?: 'folder' | 'file' | 'image' | 'document';
}

interface QuickAccessItem {
  id: string;
  name: string;
  icon: 'home' | 'folder' | 'download' | 'image' | 'star';
  path: string[];
}

// ============================================
// SAMPLE DATA
// ============================================

const quickAccessItems: QuickAccessItem[] = [
  { id: 'home', name: 'Home', icon: 'home', path: ['Home'] },
  { id: 'desktop', name: 'Desktop', icon: 'folder', path: ['Home', 'Desktop'] },
  { id: 'documents', name: 'Documents', icon: 'folder', path: ['Home', 'Documents'] },
  { id: 'downloads', name: 'Downloads', icon: 'download', path: ['Home', 'Downloads'] },
  { id: 'pictures', name: 'Pictures', icon: 'image', path: ['Home', 'Pictures'] },
];

const favoriteItems: QuickAccessItem[] = [
  { id: 'projects', name: 'Projects', icon: 'star', path: ['Home', 'Documents', 'Projects'] },
  { id: 'workspace', name: 'Workspace', icon: 'star', path: ['Home', 'Workspace'] },
];

const sampleFolders: Record<string, FolderItem[]> = {
  'Home': [
    { id: '1', name: 'Desktop', type: 'folder', modifiedAt: new Date(Date.now() - 86400000) },
    { id: '2', name: 'Documents', type: 'folder', modifiedAt: new Date(Date.now() - 172800000) },
    { id: '3', name: 'Downloads', type: 'folder', modifiedAt: new Date(Date.now() - 3600000) },
    { id: '4', name: 'Pictures', type: 'folder', modifiedAt: new Date(Date.now() - 259200000) },
    { id: '5', name: 'Music', type: 'folder', modifiedAt: new Date(Date.now() - 604800000) },
    { id: '6', name: 'Videos', type: 'folder', modifiedAt: new Date(Date.now() - 1209600000) },
    { id: '7', name: 'Workspace', type: 'folder', modifiedAt: new Date(Date.now() - 7200000) },
  ],
  'Home/Documents': [
    { id: '10', name: 'Projects', type: 'folder', modifiedAt: new Date(Date.now() - 86400000) },
    { id: '11', name: 'Reports', type: 'folder', modifiedAt: new Date(Date.now() - 172800000) },
    { id: '12', name: 'Templates', type: 'folder', modifiedAt: new Date(Date.now() - 259200000) },
    { id: '13', name: 'Archive', type: 'folder', modifiedAt: new Date(Date.now() - 604800000) },
  ],
  'Home/Documents/Projects': [
    { id: '20', name: 'claude-flow', type: 'folder', modifiedAt: new Date(Date.now() - 3600000) },
    { id: '21', name: 'ui-kit', type: 'folder', modifiedAt: new Date(Date.now() - 7200000) },
    { id: '22', name: 'web-app', type: 'folder', modifiedAt: new Date(Date.now() - 86400000) },
    { id: '23', name: 'mobile-app', type: 'folder', modifiedAt: new Date(Date.now() - 172800000) },
    { id: '24', name: 'api-server', type: 'folder', modifiedAt: new Date(Date.now() - 259200000) },
  ],
  'Home/Desktop': [
    { id: '30', name: 'Screenshots', type: 'folder', modifiedAt: new Date(Date.now() - 86400000) },
    { id: '31', name: 'Temp', type: 'folder', modifiedAt: new Date(Date.now() - 172800000) },
  ],
  'Home/Downloads': [
    { id: '40', name: 'Installers', type: 'folder', modifiedAt: new Date(Date.now() - 86400000) },
    { id: '41', name: 'Archives', type: 'folder', modifiedAt: new Date(Date.now() - 172800000) },
  ],
  'Home/Pictures': [
    { id: '50', name: 'Wallpapers', type: 'folder', modifiedAt: new Date(Date.now() - 86400000) },
    { id: '51', name: 'Photos', type: 'folder', modifiedAt: new Date(Date.now() - 172800000) },
    { id: '52', name: 'Screenshots', type: 'folder', modifiedAt: new Date(Date.now() - 259200000) },
  ],
  'Home/Workspace': [
    { id: '60', name: 'client-projects', type: 'folder', modifiedAt: new Date(Date.now() - 3600000) },
    { id: '61', name: 'personal', type: 'folder', modifiedAt: new Date(Date.now() - 7200000) },
    { id: '62', name: 'experiments', type: 'folder', modifiedAt: new Date(Date.now() - 86400000) },
  ],
};

// ============================================
// HELPER COMPONENTS
// ============================================

function QuickAccessIcon({ icon }: { icon: QuickAccessItem['icon'] }) {
  switch (icon) {
    case 'home': return <HomeIcon />;
    case 'download': return <DownloadIcon />;
    case 'image': return <ImageIcon />;
    case 'star': return <StarIcon />;
    default: return <FolderIcon />;
  }
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ============================================
// MAIN COMPONENT
// ============================================

interface FolderSelectDialogProps {
  title?: string;
  initialPath?: string[];
  onSelect?: (path: string[]) => void;
  onCancel?: () => void;
}

function FolderSelectDialogComponent({
  title = 'Select Folder',
  initialPath = ['Home'],
}: FolderSelectDialogProps) {
  const [currentPath, setCurrentPath] = useState<string[]>(initialPath);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('details');
  const [searchQuery, setSearchQuery] = useState('');
  const [history, setHistory] = useState<string[][]>([initialPath]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const pathKey = currentPath.join('/');
  const items = sampleFolders[pathKey] || [];
  const folders = items.filter(item => item.type === 'folder');

  const filteredFolders = searchQuery
    ? folders.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : folders;

  const navigateTo = (path: string[]) => {
    const newHistory = [...history.slice(0, historyIndex + 1), path];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setCurrentPath(path);
    setSelectedFolder(null);
  };

  const goBack = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setCurrentPath(history[historyIndex - 1]);
      setSelectedFolder(null);
    }
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setCurrentPath(history[historyIndex + 1]);
      setSelectedFolder(null);
    }
  };

  const goUp = () => {
    if (currentPath.length > 1) {
      navigateTo(currentPath.slice(0, -1));
    }
  };

  const openFolder = (folder: FolderItem) => {
    navigateTo([...currentPath, folder.name]);
  };

  const handleFolderClick = (folder: FolderItem) => {
    setSelectedFolder(folder.id);
  };

  const handleFolderDoubleClick = (folder: FolderItem) => {
    openFolder(folder);
  };

  const selectedFolderName = selectedFolder
    ? folders.find(f => f.id === selectedFolder)?.name || ''
    : '';

  const fullSelectedPath = selectedFolder
    ? [...currentPath, selectedFolderName].join('/')
    : currentPath.join('/');

  return (
    <div className={styles.dialogOverlay}>
      <div className={styles.dialog}>
        {/* Header */}
        <div className={styles.dialogHeader}>
          <span className={styles.dialogTitle}>{title}</span>
          <IconButton
            variant="ghost"
            size="sm"
            icon={<CloseIcon />}
            aria-label="Close dialog"
          />
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.navButtons}>
            <IconButton
              variant="ghost"
              size="sm"
              icon={<ChevronLeftIcon />}
              onClick={goBack}
              disabled={historyIndex === 0}
              aria-label="Go back"
            />
            <IconButton
              variant="ghost"
              size="sm"
              icon={<ChevronRightIcon />}
              onClick={goForward}
              disabled={historyIndex >= history.length - 1}
              aria-label="Go forward"
            />
            <IconButton
              variant="ghost"
              size="sm"
              icon={<ArrowUpIcon />}
              onClick={goUp}
              disabled={currentPath.length <= 1}
              aria-label="Go up"
            />
            <IconButton
              variant="ghost"
              size="sm"
              icon={<RefreshIcon />}
              aria-label="Refresh"
            />
          </div>

          <div className={styles.breadcrumbContainer}>
            <div className={styles.breadcrumb}>
              {currentPath.map((segment, index) => (
                <span key={index} className={styles.breadcrumbSegment}>
                  {index > 0 && <ChevronRightIcon className={styles.breadcrumbSeparator} />}
                  <span
                    className={styles.breadcrumbItem}
                    onClick={() => navigateTo(currentPath.slice(0, index + 1))}
                  >
                    {index === 0 && <HomeIcon />}
                    {segment}
                  </span>
                </span>
              ))}
            </div>
          </div>

          <SearchInput
            placeholder="Search folders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div className={styles.viewButtons}>
            <button
              className={`${styles.viewButton} ${viewMode === 'details' ? styles.active : ''}`}
              onClick={() => setViewMode('details')}
              aria-label="Details view"
            >
              <TableIcon />
            </button>
            <button
              className={`${styles.viewButton} ${viewMode === 'tiles' ? styles.active : ''}`}
              onClick={() => setViewMode('tiles')}
              aria-label="Tiles view"
            >
              <FolderIcon />
            </button>
            <button
              className={`${styles.viewButton} ${viewMode === 'icons' ? styles.active : ''}`}
              onClick={() => setViewMode('icons')}
              aria-label="Large icons view"
            >
              <ImageIcon />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className={styles.mainContent}>
          {/* Sidebar */}
          <div className={styles.sidebar}>
            <div className={styles.sidebarSection}>
              <div className={styles.sidebarTitle}>Quick Access</div>
              {quickAccessItems.map(item => (
                <div
                  key={item.id}
                  className={`${styles.sidebarItem} ${
                    currentPath.join('/') === item.path.join('/') ? styles.active : ''
                  }`}
                  onClick={() => navigateTo(item.path)}
                >
                  <span className={styles.sidebarIcon}>
                    <QuickAccessIcon icon={item.icon} />
                  </span>
                  <span className={styles.sidebarLabel}>{item.name}</span>
                </div>
              ))}
            </div>

            <div className={styles.sidebarSection}>
              <div className={styles.sidebarTitle}>Favorites</div>
              {favoriteItems.map(item => (
                <div
                  key={item.id}
                  className={`${styles.sidebarItem} ${
                    currentPath.join('/') === item.path.join('/') ? styles.active : ''
                  }`}
                  onClick={() => navigateTo(item.path)}
                >
                  <span className={styles.sidebarIcon}>
                    <QuickAccessIcon icon={item.icon} />
                  </span>
                  <span className={styles.sidebarLabel}>{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* File List */}
          <div className={styles.fileList}>
            {filteredFolders.length === 0 ? (
              <div className={styles.emptyState}>
                <FolderIcon className={styles.emptyIcon} />
                <Text color="secondary">No folders found</Text>
              </div>
            ) : viewMode === 'details' ? (
              <div className={styles.detailsView}>
                <div className={styles.detailsHeader}>
                  <span>Name</span>
                  <span>Date Modified</span>
                  <span>Type</span>
                </div>
                {filteredFolders.map(folder => (
                  <div
                    key={folder.id}
                    className={`${styles.detailsRow} ${selectedFolder === folder.id ? styles.selected : ''}`}
                    onClick={() => handleFolderClick(folder)}
                    onDoubleClick={() => handleFolderDoubleClick(folder)}
                  >
                    <div className={styles.detailsName}>
                      <FolderIcon className={styles.detailsIcon} />
                      <span className={styles.detailsLabel}>{folder.name}</span>
                    </div>
                    <span className={styles.detailsDate}>{formatDate(folder.modifiedAt)}</span>
                    <span className={styles.detailsSize}>Folder</span>
                  </div>
                ))}
              </div>
            ) : viewMode === 'tiles' ? (
              <div className={styles.tilesView}>
                {filteredFolders.map(folder => (
                  <div
                    key={folder.id}
                    className={`${styles.tileItem} ${selectedFolder === folder.id ? styles.selected : ''}`}
                    onClick={() => handleFolderClick(folder)}
                    onDoubleClick={() => handleFolderDoubleClick(folder)}
                  >
                    <FolderIcon className={styles.tileIcon} />
                    <div className={styles.tileInfo}>
                      <div className={styles.tileName}>{folder.name}</div>
                      <div className={styles.tileMeta}>{formatDate(folder.modifiedAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.iconsView}>
                {filteredFolders.map(folder => (
                  <div
                    key={folder.id}
                    className={`${styles.iconItem} ${selectedFolder === folder.id ? styles.selected : ''}`}
                    onClick={() => handleFolderClick(folder)}
                    onDoubleClick={() => handleFolderDoubleClick(folder)}
                  >
                    <FolderIcon className={styles.iconLarge} />
                    <span className={styles.iconName}>{folder.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Status Bar */}
        <div className={styles.statusBar}>
          <span>{filteredFolders.length} folder{filteredFolders.length !== 1 ? 's' : ''}</span>
          {selectedFolder && <span>Selected: {selectedFolderName}</span>}
        </div>

        {/* Footer */}
        <div className={styles.dialogFooter}>
          <div className={styles.folderInput}>
            <span className={styles.folderInputLabel}>Folder:</span>
            <div className={styles.folderInputField}>
              <Input
                size="sm"
                value={fullSelectedPath}
                readOnly
              />
            </div>
          </div>
          <div className={styles.dialogActions}>
            <Button variant="ghost" icon={<AddIcon />}>
              New Folder
            </Button>
            <Button variant="default">Cancel</Button>
            <Button variant="primary" disabled={!selectedFolder}>
              Select Folder
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// STORYBOOK CONFIG
// ============================================

const meta: Meta<typeof FolderSelectDialogComponent> = {
  title: 'Example Pages/Folder Select Dialog',
  component: FolderSelectDialogComponent,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof FolderSelectDialogComponent>;

export const Default: Story = {
  args: {
    title: 'Select Folder',
    initialPath: ['Home'],
  },
};

export const InDocuments: Story = {
  args: {
    title: 'Select Project Folder',
    initialPath: ['Home', 'Documents'],
  },
};

export const InProjects: Story = {
  args: {
    title: 'Choose Destination',
    initialPath: ['Home', 'Documents', 'Projects'],
  },
};

export const SaveLocation: Story = {
  args: {
    title: 'Save Files To...',
    initialPath: ['Home', 'Downloads'],
  },
};
