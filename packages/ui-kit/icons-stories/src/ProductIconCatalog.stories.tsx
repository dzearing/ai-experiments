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
import type { ProductIconProps } from '@ui-kit/product-icons/types';
import styles from './ProductIconCatalog.module.css';

// Import metadata for search keywords and icon list
import productIconsMetadata from '@ui-kit/product-icons/metadata/icons.json';

interface ProductIconData {
  name: string;
  displayName: string;
  componentName: string;
  category: string;
  keywords: string[];
  availableSizes: number[];
  Component: React.ComponentType<ProductIconProps> | null;
}

const categories = ['all', 'microsoft', 'agents'];

interface ProductIconCatalogProps {
  size?: number;
  showNames?: boolean;
  columns?: number;
}

function ProductIconCatalog({ size = 32, showNames = true, columns = 6 }: ProductIconCatalogProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [copiedIcon, setCopiedIcon] = useState<string | null>(null);
  const [iconData, setIconData] = useState<ProductIconData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dynamically import all product icons on mount
  useEffect(() => {
    async function loadIcons() {
      const icons: ProductIconData[] = [];

      for (const iconMeta of productIconsMetadata.icons) {
        try {
          // Dynamic import for each icon
          const module = await import(`@ui-kit/product-icons/${iconMeta.componentName}.js`);
          const Component = module[iconMeta.componentName];

          icons.push({
            name: iconMeta.name,
            displayName: iconMeta.displayName,
            componentName: iconMeta.componentName,
            category: iconMeta.category,
            keywords: iconMeta.keywords,
            availableSizes: iconMeta.availableSizes,
            Component,
          });
        } catch (error) {
          console.warn(`Failed to load product icon: ${iconMeta.componentName}`, error);
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
          icon.displayName.toLowerCase().includes(searchLower) ||
          icon.componentName.toLowerCase().includes(searchLower) ||
          icon.keywords.some((k) => k.includes(searchLower))
      );
    }

    return filtered;
  }, [search, selectedCategory, iconData]);

  const copyImport = useCallback(async (componentName: string) => {
    const importStatement = `import { ${componentName} } from '@ui-kit/product-icons/${componentName}';`;

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

  const categoryLabels: Record<string, string> = {
    all: 'All',
    microsoft: 'Microsoft',
    agents: 'Agents',
  };

  if (isLoading) {
    return (
      <div className={styles.catalog}>
        <Stack gap={2} align="center" style={{ padding: '4rem' }}>
          <Spinner size="lg" />
          <Text color="soft">Loading product icons...</Text>
        </Stack>
      </div>
    );
  }

  if (iconData.length === 0) {
    return (
      <div className={styles.catalog}>
        <Stack gap={2}>
          <Heading level={1}>Product Icon Catalog</Heading>
          <Text color="soft">
            No product icons found. Run <code>pnpm build</code> in the product-icons package first.
          </Text>
        </Stack>
      </div>
    );
  }

  return (
    <div className={styles.catalog}>
      <Stack gap="lg">
        <Stack gap="sm">
          <Heading level={1}>Product Icon Catalog</Heading>
          <Text color="soft">
            {iconData.length} product icons available. Click any icon to copy its import statement.
          </Text>
          <Text size="sm" color="soft">
            Product icons preserve multi-color fills and support sizes: 16, 24, 32, 48px
          </Text>
        </Stack>

        <Stack gap="md">
          <Input
            type="search"
            placeholder="Search product icons..."
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
                  shape="pill"
                  onClick={() => setSelectedCategory(cat)}
                >
                  {categoryLabels[cat]} ({categoryCounts[cat] || 0})
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
          {filteredIcons.map(({ name, displayName, componentName, Component, category }) => (
            <button
              key={componentName}
              data-focus-id={componentName}
              className={styles.iconCard}
              onClick={() => copyImport(componentName)}
              title={`Click to copy: import { ${componentName} } from '@ui-kit/product-icons/${componentName}';`}
            >
              <div className={styles.iconWrapper}>
                {Component && <Component size={size} />}
              </div>
              {showNames && (
                <span className={styles.iconName}>
                  {copiedIcon === componentName ? 'Copied!' : displayName}
                </span>
              )}
              <span className={styles.categoryBadge} data-category={category}>
                {category}
              </span>
            </button>
          ))}
        </BidirectionalFocusZone>

        {filteredIcons.length === 0 && (
          <Card>
            <Text color="soft">No product icons found matching "{search}"</Text>
          </Card>
        )}
      </Stack>
    </div>
  );
}

const meta: Meta<typeof ProductIconCatalog> = {
  title: 'Product Icon Catalog',
  component: ProductIconCatalog,
  parameters: {
    layout: 'fullscreen',
    options: {
      showPanel: false,
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProductIconCatalog>;

export const ProductIconCatalog_: Story = {
  name: 'Product Icon Catalog',
  args: {
    size: 32,
    showNames: true,
    columns: 6,
  },
};
