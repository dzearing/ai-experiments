import type { Meta, StoryObj } from '@storybook/react';
import { useState, useMemo, useCallback } from 'react';
import {
  Input,
  Button,
  Card,
  Heading,
  Text,
  Stack,
  FocusZone,
  BidirectionalFocusZone,
} from '@ui-kit/react';
import styles from './IconCatalog.module.css';

// Import all icons - this works because Storybook runs after build
// The index.ts is generated during build
import * as AllIcons from '../index';

// Import metadata for search keywords
import iconsMetadata from '../../dist/metadata/icons.json';

interface IconData {
  name: string;
  componentName: string;
  category: string;
  keywords: string[];
  Component: React.ComponentType<{ size?: number; title?: string; className?: string }>;
}

// Build a map of icon names to their metadata keywords
const keywordsMap: Record<string, string[]> = {};
for (const icon of iconsMetadata.icons) {
  keywordsMap[icon.name] = icon.keywords;
}

// Build icon data from the imported icons
function buildIconData(): IconData[] {
  const icons: IconData[] = [];

  for (const [componentName, Component] of Object.entries(AllIcons)) {
    // Skip non-icon exports (types, etc.)
    // Note: forwardRef components have typeof 'object', not 'function'
    if (!componentName.endsWith('Icon') || !Component) {
      continue;
    }

    // Convert component name to kebab-case icon name
    const name = componentName
      .replace(/Icon$/, '')
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-/, '');

    // Determine category from name patterns
    const category = getCategory(name);

    // Use keywords from metadata, fallback to name-based keywords
    const keywords = keywordsMap[name] || [name, ...name.split('-'), componentName.toLowerCase()];

    icons.push({
      name,
      componentName,
      category,
      keywords,
      Component: Component as IconData['Component'],
    });
  }

  return icons.sort((a, b) => a.name.localeCompare(b.name));
}

function getCategory(name: string): string {
  const categoryPatterns: Record<string, string[]> = {
    navigation: ['arrow', 'chevron', 'menu', 'home', 'back', 'forward', 'expand', 'collapse', 'close'],
    status: ['check', 'error', 'warning', 'info', 'x-circle'],
    editor: ['bold', 'italic', 'underline', 'strikethrough', 'heading', 'list', 'quote', 'code', 'link', 'image', 'table', 'indent', 'outdent'],
    actions: ['save', 'edit', 'delete', 'add', 'remove', 'copy', 'cut', 'paste', 'undo', 'redo', 'search', 'filter', 'download', 'upload', 'share', 'export', 'refresh', 'sync', 'play', 'pause', 'stop', 'zoom', 'minimize', 'maximize', 'restore', 'pop', 'rewind', 'fast', 'next', 'previous'],
    misc: ['settings', 'gear', 'user', 'users', 'folder', 'file', 'calendar', 'clock', 'bell', 'star', 'heart', 'comment', 'chat', 'hourglass'],
  };

  const lowerName = name.toLowerCase();
  for (const [category, patterns] of Object.entries(categoryPatterns)) {
    if (patterns.some((p) => lowerName.includes(p))) {
      return category;
    }
  }
  return 'misc';
}

const categories = ['all', 'actions', 'navigation', 'status', 'editor', 'misc'];

interface IconCatalogProps {
  size?: number;
  showNames?: boolean;
  columns?: number;
}

// Build icon data once at module load time
const allIconData = buildIconData();

function IconCatalog({ size = 24, showNames = true, columns = 8 }: IconCatalogProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [copiedIcon, setCopiedIcon] = useState<string | null>(null);
  const iconData = allIconData;

  const filteredIcons = useMemo(() => {
    let filtered = iconData;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((icon) => icon.category === selectedCategory);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (icon) =>
          icon.name.includes(searchLower) ||
          icon.componentName.toLowerCase().includes(searchLower) ||
          icon.keywords.some((k) => k.includes(searchLower))
      );
    }

    return filtered;
  }, [search, selectedCategory, iconData]);

  const copyImport = useCallback(async (componentName: string) => {
    const importStatement = `import { ${componentName} } from '@ui-kit/icons/${componentName}';`;
    await navigator.clipboard.writeText(importStatement);
    setCopiedIcon(componentName);
    setTimeout(() => setCopiedIcon(null), 2000);
  }, []);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: iconData.length };
    for (const icon of iconData) {
      counts[icon.category] = (counts[icon.category] || 0) + 1;
    }
    return counts;
  }, [iconData]);


  if (iconData.length === 0) {
    return (
      <div className={styles.catalog}>
        <Stack gap={2}>
          <Heading level={1}>Icon Catalog</Heading>
          <Text color="soft">
            Loading icons... If this persists, run <code>pnpm build</code> first.
          </Text>
        </Stack>
      </div>
    );
  }

  return (
    <div className={styles.catalog}>
      <Stack gap="lg">
        <Stack gap="sm">
          <Heading level={1}>Icon Catalog</Heading>
          <Text color="soft">
            {iconData.length} icons available. Click any icon to copy its import statement.
          </Text>
        </Stack>

        <Stack gap="md">
          <Input
            type="search"
            placeholder="Search icons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 400 }}
          />

          <FocusZone direction="horizontal">
            <Stack direction="horizontal" gap="sm" wrap>
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? 'primary' : 'outline'}
                  size="sm"
                  pill
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)} ({categoryCounts[cat] || 0})
                </Button>
              ))}
            </Stack>
          </FocusZone>
        </Stack>

        <Text size="sm" color="soft">{filteredIcons.length} icons</Text>

        <BidirectionalFocusZone
          className={styles.grid}
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {filteredIcons.map(({ name, componentName, Component }) => (
            <button
              key={componentName}
              data-focus-id={componentName}
              className={styles.iconCard}
              onClick={() => copyImport(componentName)}
              title={`Click to copy: import { ${componentName} } from '@ui-kit/icons/${componentName}';`}
            >
              <div className={styles.iconWrapper}>
                <Component size={size} />
              </div>
              {showNames && (
                <span className={styles.iconName}>
                  {copiedIcon === componentName ? 'Copied!' : name}
                </span>
              )}
            </button>
          ))}
        </BidirectionalFocusZone>

        {filteredIcons.length === 0 && (
          <Card>
            <Text color="soft">No icons found matching "{search}"</Text>
          </Card>
        )}
      </Stack>
    </div>
  );
}

const meta: Meta<typeof IconCatalog> = {
  title: 'Icon Catalog',
  component: IconCatalog,
  parameters: {
    layout: 'fullscreen',
    options: {
      showPanel: false,
    },
  },
};

export default meta;
type Story = StoryObj<typeof IconCatalog>;

export const IconCatalog_: Story = {
  name: 'Icon Catalog',
  args: {
    size: 24,
    showNames: true,
    columns: 8,
  },
};
