import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  Button,
  Dropdown,
  IconButton,
  Input,
  SearchInput,
  Text,
} from '@ui-kit/react';
import { ArrowUpIcon } from '@ui-kit/icons/ArrowUpIcon';
import { ChevronDownIcon } from '@ui-kit/icons/ChevronDownIcon';
import { ChevronLeftIcon } from '@ui-kit/icons/ChevronLeftIcon';
import { ChevronRightIcon } from '@ui-kit/icons/ChevronRightIcon';
import { CloseIcon } from '@ui-kit/icons/CloseIcon';
import { CodeIcon } from '@ui-kit/icons/CodeIcon';
import { DownloadIcon } from '@ui-kit/icons/DownloadIcon';
import { FileIcon } from '@ui-kit/icons/FileIcon';
import { FolderIcon } from '@ui-kit/icons/FolderIcon';
import { HomeIcon } from '@ui-kit/icons/HomeIcon';
import { ImageIcon } from '@ui-kit/icons/ImageIcon';
import { RefreshIcon } from '@ui-kit/icons/RefreshIcon';
import { StarIcon } from '@ui-kit/icons/StarIcon';
import { TableIcon } from '@ui-kit/icons/TableIcon';
import styles from './FileSelectDialog.module.css';

/**
 * # File Select Dialog
 *
 * A Windows-style file selection dialog with multiple view modes,
 * file type filtering, and comprehensive navigation.
 *
 * ## Features
 * - Four view modes: Details, Tiles, Large Icons, Preview
 * - Breadcrumb navigation with clickable path segments
 * - Sidebar with quick access locations
 * - File type filtering dropdown
 * - Search functionality
 * - Single and multi-file selection modes
 * - Preview thumbnails for images
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
 * 6. **ThumbnailPreview** - Image/file preview generation
 */

// ============================================
// DATA TYPES
// ============================================

type ViewMode = 'details' | 'tiles' | 'icons' | 'preview';
type FileType = 'folder' | 'file' | 'image' | 'code' | 'document';

interface FileItem {
  id: string;
  name: string;
  type: FileType;
  extension?: string;
  size?: number;
  modifiedAt: Date;
}

interface QuickAccessItem {
  id: string;
  name: string;
  icon: 'home' | 'folder' | 'download' | 'image' | 'star';
  path: string[];
}

interface FileTypeFilter {
  value: string;
  label: string;
  extensions: string[];
}

// ============================================
// SAMPLE DATA
// ============================================

const fileTypeFilters: FileTypeFilter[] = [
  { value: 'all', label: 'All Files', extensions: ['*'] },
  { value: 'images', label: 'Images (*.png, *.jpg, *.gif)', extensions: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'] },
  { value: 'documents', label: 'Documents (*.pdf, *.doc, *.txt)', extensions: ['pdf', 'doc', 'docx', 'txt', 'md'] },
  { value: 'code', label: 'Code Files (*.ts, *.js, *.tsx)', extensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'css', 'html'] },
];

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

const sampleFiles: Record<string, FileItem[]> = {
  'Home': [
    { id: '1', name: 'Desktop', type: 'folder', modifiedAt: new Date(Date.now() - 86400000) },
    { id: '2', name: 'Documents', type: 'folder', modifiedAt: new Date(Date.now() - 172800000) },
    { id: '3', name: 'Downloads', type: 'folder', modifiedAt: new Date(Date.now() - 3600000) },
    { id: '4', name: 'Pictures', type: 'folder', modifiedAt: new Date(Date.now() - 259200000) },
    { id: '5', name: 'Workspace', type: 'folder', modifiedAt: new Date(Date.now() - 7200000) },
    { id: '6', name: 'notes.txt', type: 'document', extension: 'txt', size: 2048, modifiedAt: new Date(Date.now() - 86400000) },
    { id: '7', name: '.gitconfig', type: 'file', size: 512, modifiedAt: new Date(Date.now() - 604800000) },
  ],
  'Home/Documents': [
    { id: '10', name: 'Projects', type: 'folder', modifiedAt: new Date(Date.now() - 86400000) },
    { id: '11', name: 'Reports', type: 'folder', modifiedAt: new Date(Date.now() - 172800000) },
    { id: '12', name: 'resume.pdf', type: 'document', extension: 'pdf', size: 245760, modifiedAt: new Date(Date.now() - 604800000) },
    { id: '13', name: 'meeting-notes.md', type: 'document', extension: 'md', size: 8192, modifiedAt: new Date(Date.now() - 86400000) },
    { id: '14', name: 'budget.xlsx', type: 'document', extension: 'xlsx', size: 51200, modifiedAt: new Date(Date.now() - 172800000) },
  ],
  'Home/Documents/Projects': [
    { id: '20', name: 'claude-flow', type: 'folder', modifiedAt: new Date(Date.now() - 3600000) },
    { id: '21', name: 'ui-kit', type: 'folder', modifiedAt: new Date(Date.now() - 7200000) },
    { id: '22', name: 'README.md', type: 'document', extension: 'md', size: 4096, modifiedAt: new Date(Date.now() - 86400000) },
  ],
  'Home/Documents/Projects/claude-flow': [
    { id: '30', name: 'src', type: 'folder', modifiedAt: new Date(Date.now() - 3600000) },
    { id: '31', name: 'docs', type: 'folder', modifiedAt: new Date(Date.now() - 7200000) },
    { id: '32', name: 'package.json', type: 'code', extension: 'json', size: 2048, modifiedAt: new Date(Date.now() - 86400000) },
    { id: '33', name: 'tsconfig.json', type: 'code', extension: 'json', size: 1024, modifiedAt: new Date(Date.now() - 172800000) },
    { id: '34', name: 'README.md', type: 'document', extension: 'md', size: 8192, modifiedAt: new Date(Date.now() - 259200000) },
    { id: '35', name: 'index.ts', type: 'code', extension: 'ts', size: 512, modifiedAt: new Date(Date.now() - 3600000) },
  ],
  'Home/Pictures': [
    { id: '40', name: 'Wallpapers', type: 'folder', modifiedAt: new Date(Date.now() - 86400000) },
    { id: '41', name: 'Screenshots', type: 'folder', modifiedAt: new Date(Date.now() - 172800000) },
    { id: '42', name: 'vacation.jpg', type: 'image', extension: 'jpg', size: 2457600, modifiedAt: new Date(Date.now() - 604800000) },
    { id: '43', name: 'profile.png', type: 'image', extension: 'png', size: 102400, modifiedAt: new Date(Date.now() - 259200000) },
    { id: '44', name: 'logo.svg', type: 'image', extension: 'svg', size: 8192, modifiedAt: new Date(Date.now() - 86400000) },
  ],
  'Home/Downloads': [
    { id: '50', name: 'installer.exe', type: 'file', extension: 'exe', size: 52428800, modifiedAt: new Date(Date.now() - 86400000) },
    { id: '51', name: 'report.pdf', type: 'document', extension: 'pdf', size: 1048576, modifiedAt: new Date(Date.now() - 172800000) },
    { id: '52', name: 'archive.zip', type: 'file', extension: 'zip', size: 10485760, modifiedAt: new Date(Date.now() - 259200000) },
    { id: '53', name: 'photo.jpg', type: 'image', extension: 'jpg', size: 3145728, modifiedAt: new Date(Date.now() - 3600000) },
  ],
  'Home/Workspace': [
    { id: '60', name: 'client-projects', type: 'folder', modifiedAt: new Date(Date.now() - 3600000) },
    { id: '61', name: 'personal', type: 'folder', modifiedAt: new Date(Date.now() - 7200000) },
    { id: '62', name: 'todo.md', type: 'document', extension: 'md', size: 1024, modifiedAt: new Date(Date.now() - 86400000) },
    { id: '63', name: 'scratch.ts', type: 'code', extension: 'ts', size: 2048, modifiedAt: new Date(Date.now() - 172800000) },
  ],
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function getFileIcon(type: FileType) {
  switch (type) {
    case 'folder': return <FolderIcon />;
    case 'image': return <ImageIcon />;
    case 'code': return <CodeIcon />;
    default: return <FileIcon />;
  }
}

function QuickAccessIcon({ icon }: { icon: QuickAccessItem['icon'] }) {
  switch (icon) {
    case 'home': return <HomeIcon />;
    case 'download': return <DownloadIcon />;
    case 'image': return <ImageIcon />;
    case 'star': return <StarIcon />;
    default: return <FolderIcon />;
  }
}

function formatFileSize(bytes?: number): string {
  if (bytes === undefined) return '--';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(1)} GB`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getFileTypeLabel(item: FileItem): string {
  if (item.type === 'folder') return 'Folder';
  if (item.extension) {
    const ext = item.extension.toUpperCase();
    switch (item.type) {
      case 'image': return `${ext} Image`;
      case 'code': return `${ext} File`;
      case 'document': return `${ext} Document`;
      default: return `${ext} File`;
    }
  }
  return 'File';
}

// ============================================
// MAIN COMPONENT
// ============================================

interface FileSelectDialogProps {
  title?: string;
  initialPath?: string[];
  fileTypeFilter?: string;
  multiSelect?: boolean;
  onSelect?: (files: FileItem[]) => void;
  onCancel?: () => void;
}

function FileSelectDialogComponent({
  title = 'Open File',
  initialPath = ['Home'],
  fileTypeFilter: initialFilter = 'all',
  multiSelect = false,
}: FileSelectDialogProps) {
  const [currentPath, setCurrentPath] = useState<string[]>(initialPath);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('details');
  const [searchQuery, setSearchQuery] = useState('');
  const [fileFilter, setFileFilter] = useState(initialFilter);
  const [history, setHistory] = useState<string[][]>([initialPath]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const pathKey = currentPath.join('/');
  const items = sampleFiles[pathKey] || [];

  // Filter items based on file type and search
  const filteredItems = items.filter(item => {
    // Search filter
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    // File type filter - always show folders
    if (item.type === 'folder') return true;
    if (fileFilter === 'all') return true;

    const filter = fileTypeFilters.find(f => f.value === fileFilter);
    if (!filter) return true;

    return filter.extensions.some(ext =>
      ext === '*' || item.extension?.toLowerCase() === ext.toLowerCase()
    );
  });

  // Sort: folders first, then alphabetically
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (a.type === 'folder' && b.type !== 'folder') return -1;
    if (a.type !== 'folder' && b.type === 'folder') return 1;
    return a.name.localeCompare(b.name);
  });

  const navigateTo = (path: string[]) => {
    const newHistory = [...history.slice(0, historyIndex + 1), path];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setCurrentPath(path);
    setSelectedItems(new Set());
  };

  const goBack = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setCurrentPath(history[historyIndex - 1]);
      setSelectedItems(new Set());
    }
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setCurrentPath(history[historyIndex + 1]);
      setSelectedItems(new Set());
    }
  };

  const goUp = () => {
    if (currentPath.length > 1) {
      navigateTo(currentPath.slice(0, -1));
    }
  };

  const handleItemClick = (item: FileItem, event: React.MouseEvent) => {
    if (item.type === 'folder') {
      // Single click on folder just selects it
      if (multiSelect && event.ctrlKey) {
        const newSelection = new Set(selectedItems);
        if (newSelection.has(item.id)) {
          newSelection.delete(item.id);
        } else {
          newSelection.add(item.id);
        }
        setSelectedItems(newSelection);
      } else {
        setSelectedItems(new Set([item.id]));
      }
    } else {
      // File selection
      if (multiSelect && event.ctrlKey) {
        const newSelection = new Set(selectedItems);
        if (newSelection.has(item.id)) {
          newSelection.delete(item.id);
        } else {
          newSelection.add(item.id);
        }
        setSelectedItems(newSelection);
      } else {
        setSelectedItems(new Set([item.id]));
      }
    }
  };

  const handleItemDoubleClick = (item: FileItem) => {
    if (item.type === 'folder') {
      navigateTo([...currentPath, item.name]);
    }
    // For files, double-click would trigger selection/open
  };

  const selectedFiles = sortedItems.filter(item => selectedItems.has(item.id) && item.type !== 'folder');
  const selectedFileName = selectedFiles.length === 1
    ? selectedFiles[0].name
    : selectedFiles.length > 1
      ? `${selectedFiles.length} files selected`
      : '';

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
            placeholder="Search..."
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
            <button
              className={`${styles.viewButton} ${viewMode === 'preview' ? styles.active : ''}`}
              onClick={() => setViewMode('preview')}
              aria-label="Preview view"
            >
              <FileIcon />
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
            {sortedItems.length === 0 ? (
              <div className={styles.emptyState}>
                <FolderIcon className={styles.emptyIcon} />
                <Text color="secondary">No files found</Text>
              </div>
            ) : viewMode === 'details' ? (
              <div className={styles.detailsView}>
                <div className={styles.detailsHeader}>
                  <span className={styles.detailsHeaderItem}>Name <ChevronDownIcon className={styles.sortIcon} /></span>
                  <span className={styles.detailsHeaderItem}>Size</span>
                  <span className={styles.detailsHeaderItem}>Type</span>
                  <span className={styles.detailsHeaderItem}>Date Modified</span>
                </div>
                {sortedItems.map(item => (
                  <div
                    key={item.id}
                    className={`${styles.detailsRow} ${selectedItems.has(item.id) ? styles.selected : ''} ${item.type === 'folder' ? styles.folder : ''}`}
                    onClick={(e) => handleItemClick(item, e)}
                    onDoubleClick={() => handleItemDoubleClick(item)}
                  >
                    <div className={styles.detailsName}>
                      <span className={`${styles.detailsIcon} ${styles[item.type]}`}>
                        {getFileIcon(item.type)}
                      </span>
                      <span className={styles.detailsLabel}>{item.name}</span>
                    </div>
                    <span className={styles.detailsSize}>{formatFileSize(item.size)}</span>
                    <span className={styles.detailsType}>{getFileTypeLabel(item)}</span>
                    <span className={styles.detailsDate}>{formatDate(item.modifiedAt)}</span>
                  </div>
                ))}
              </div>
            ) : viewMode === 'tiles' ? (
              <div className={styles.tilesView}>
                {sortedItems.map(item => (
                  <div
                    key={item.id}
                    className={`${styles.tileItem} ${selectedItems.has(item.id) ? styles.selected : ''}`}
                    onClick={(e) => handleItemClick(item, e)}
                    onDoubleClick={() => handleItemDoubleClick(item)}
                  >
                    <span className={`${styles.tileIcon} ${styles[item.type]}`}>
                      {getFileIcon(item.type)}
                    </span>
                    <div className={styles.tileInfo}>
                      <div className={styles.tileName}>{item.name}</div>
                      <div className={styles.tileMeta}>
                        {item.type === 'folder' ? 'Folder' : formatFileSize(item.size)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : viewMode === 'icons' ? (
              <div className={styles.iconsView}>
                {sortedItems.map(item => (
                  <div
                    key={item.id}
                    className={`${styles.iconItem} ${selectedItems.has(item.id) ? styles.selected : ''}`}
                    onClick={(e) => handleItemClick(item, e)}
                    onDoubleClick={() => handleItemDoubleClick(item)}
                  >
                    <span className={`${styles.iconLarge} ${styles[item.type]}`}>
                      {getFileIcon(item.type)}
                    </span>
                    <span className={styles.iconName}>{item.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.previewView}>
                {sortedItems.map(item => (
                  <div
                    key={item.id}
                    className={`${styles.previewItem} ${selectedItems.has(item.id) ? styles.selected : ''}`}
                    onClick={(e) => handleItemClick(item, e)}
                    onDoubleClick={() => handleItemDoubleClick(item)}
                  >
                    <div className={`${styles.previewThumbnail} ${styles[item.type]}`}>
                      <span className={styles.previewIcon}>
                        {getFileIcon(item.type)}
                      </span>
                    </div>
                    <div className={styles.previewInfo}>
                      <div className={styles.previewName}>{item.name}</div>
                      <div className={styles.previewMeta}>
                        {item.type === 'folder' ? 'Folder' : formatFileSize(item.size)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Status Bar */}
        <div className={styles.statusBar}>
          <span>{sortedItems.length} item{sortedItems.length !== 1 ? 's' : ''}</span>
          {selectedItems.size > 0 && (
            <span>{selectedItems.size} selected</span>
          )}
        </div>

        {/* Footer */}
        <div className={styles.dialogFooter}>
          <div className={styles.fileInputRow}>
            <span className={styles.fileInputLabel}>File name:</span>
            <div className={styles.fileInputField}>
              <Input
                size="sm"
                value={selectedFileName}
                placeholder="Enter file name or select a file"
              />
            </div>
          </div>
          <div className={styles.fileInputRow}>
            <span className={styles.fileInputLabel}>File type:</span>
            <div className={styles.fileTypeDropdown}>
              <Dropdown
                options={fileTypeFilters.map(f => ({ value: f.value, label: f.label }))}
                value={fileFilter}
                onChange={(value) => setFileFilter(value as string)}
              />
            </div>
            <div className={styles.dialogActions}>
              <Button variant="default">Cancel</Button>
              <Button variant="primary" disabled={selectedFiles.length === 0}>
                Open
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// STORYBOOK CONFIG
// ============================================

const meta: Meta<typeof FileSelectDialogComponent> = {
  title: 'Example Pages/File Select Dialog',
  component: FileSelectDialogComponent,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof FileSelectDialogComponent>;

export const Default: Story = {
  args: {
    title: 'Open File',
    initialPath: ['Home'],
    fileTypeFilter: 'all',
  },
};

export const OpenImage: Story = {
  args: {
    title: 'Select Image',
    initialPath: ['Home', 'Pictures'],
    fileTypeFilter: 'images',
  },
};

export const OpenCodeFile: Story = {
  args: {
    title: 'Open Source File',
    initialPath: ['Home', 'Documents', 'Projects', 'claude-flow'],
    fileTypeFilter: 'code',
  },
};

export const MultiSelect: Story = {
  args: {
    title: 'Select Files',
    initialPath: ['Home', 'Downloads'],
    multiSelect: true,
  },
};

export const SaveAs: Story = {
  args: {
    title: 'Save As',
    initialPath: ['Home', 'Documents'],
    fileTypeFilter: 'documents',
  },
};
