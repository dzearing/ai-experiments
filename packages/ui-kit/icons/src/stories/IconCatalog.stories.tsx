import type { Meta, StoryObj } from '@storybook/react';
import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Input,
  Button,
  Card,
  Heading,
  Text,
  Stack,
  FocusZone,
  BidirectionalFocusZone,
  Spinner,
} from '@ui-kit/react';
import styles from './IconCatalog.module.css';

// Import metadata for search keywords and icon list
import iconsMetadata from '../../dist/metadata/icons.json';

interface IconData {
  name: string;
  componentName: string;
  category: string;
  keywords: string[];
  Component: React.ComponentType<{ size?: number; title?: string; className?: string }> | null;
}

const categories = ['all', 'actions', 'navigation', 'status', 'editor', 'misc'];

interface IconCatalogProps {
  size?: number;
  showNames?: boolean;
  columns?: number;
}

function IconCatalog({ size = 24, showNames = true, columns = 8 }: IconCatalogProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [copiedIcon, setCopiedIcon] = useState<string | null>(null);
  const [iconData, setIconData] = useState<IconData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dynamically import all icons on mount
  useEffect(() => {
    async function loadIcons() {
      const icons: IconData[] = [];

      for (const iconMeta of iconsMetadata.icons) {
        try {
          // Dynamic import for each icon
          const module = await import(`../components/${iconMeta.componentName}.tsx`);
          const Component = module[iconMeta.componentName];

          icons.push({
            name: iconMeta.name,
            componentName: iconMeta.componentName,
            category: iconMeta.category,
            keywords: iconMeta.keywords,
            Component,
          });
        } catch (error) {
          console.warn(`Failed to load icon: ${iconMeta.componentName}`, error);
        }
      }

      setIconData(icons.sort((a, b) => a.name.localeCompare(b.name)));
      setIsLoading(false);
    }

    loadIcons();
  }, []);

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

  if (isLoading) {
    return (
      <div className={styles.catalog}>
        <Stack gap={2} align="center" style={{ padding: '4rem' }}>
          <Spinner size="lg" />
          <Text color="soft">Loading icons...</Text>
        </Stack>
      </div>
    );
  }

  if (iconData.length === 0) {
    return (
      <div className={styles.catalog}>
        <Stack gap={2}>
          <Heading level={1}>Icon Catalog</Heading>
          <Text color="soft">
            No icons found. Run <code>pnpm build</code> first.
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
                {Component && <Component size={size} />}
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
