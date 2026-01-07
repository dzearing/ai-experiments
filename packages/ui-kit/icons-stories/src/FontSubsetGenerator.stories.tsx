import type { Meta, StoryObj } from '@storybook/react';
import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Input,
  Button,
  Card,
  Heading,
  Text,
  Stack,
  Code,
  Segmented,
  BidirectionalFocusZone,
  Spinner,
} from '@ui-kit/react';
import styles from './FontSubsetGenerator.module.css';

// Import metadata for icon list
import iconsMetadata from '@ui-kit/icons/metadata/icons.json';

interface IconData {
  name: string;
  componentName: string;
  Component: React.ComponentType<{ size?: number; className?: string }> | null;
}

type ExportFormat = 'woff2' | 'dataUri' | 'css';

const formatOptions = [
  { value: 'css', label: 'CSS' },
  { value: 'dataUri', label: 'Data URI' },
  { value: 'woff2', label: 'WOFF2' },
];

function FontSubsetGenerator() {
  const [selectedIcons, setSelectedIcons] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('css');
  const [fontFamily, setFontFamily] = useState('ui-kit-icons-subset');
  const [generatedOutput, setGeneratedOutput] = useState<string | null>(null);
  const [iconData, setIconData] = useState<IconData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dynamically import all icons on mount
  useEffect(() => {
    async function loadIcons() {
      const icons: IconData[] = [];

      for (const iconMeta of iconsMetadata.icons) {
        try {
          // Dynamic import for each icon
          const module = await import(`@ui-kit/icons/${iconMeta.componentName}.js`);
          const Component = module[iconMeta.componentName];

          icons.push({
            name: iconMeta.name,
            componentName: iconMeta.componentName,
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
    if (!search) return iconData;
    const searchLower = search.toLowerCase();
    return iconData.filter(
      (icon) =>
        icon.name.includes(searchLower) || icon.componentName.toLowerCase().includes(searchLower)
    );
  }, [search, iconData]);

  const toggleIcon = useCallback((name: string) => {
    setSelectedIcons((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIcons(new Set(filteredIcons.map((i) => i.name)));
  }, [filteredIcons]);

  const clearAll = useCallback(() => {
    setSelectedIcons(new Set());
  }, []);

  const generateCSS = useCallback(() => {
    const iconList = Array.from(selectedIcons).sort();
    const unicodeStart = 0xe001;

    const cssClasses = iconList
      .map((name, index) => {
        const unicode = (unicodeStart + index).toString(16);
        return `.icon-${name}::before { content: "\\\\${unicode}"; }`;
      })
      .join('\n');

    return `/* Font Subset: ${iconList.length} icons */
/* Generated from @ui-kit/icons */

@font-face {
  font-family: '${fontFamily}';
  src: url('./icons-subset.woff2') format('woff2');
  font-weight: normal;
  font-style: normal;
  font-display: block;
}

.icon {
  font-family: '${fontFamily}' !important;
  speak: never;
  font-style: normal;
  font-weight: normal;
  font-variant: normal;
  text-transform: none;
  line-height: 1;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Icon classes */
${cssClasses}

/* Selected icons: ${iconList.join(', ')} */
`;
  }, [selectedIcons, fontFamily]);

  const generateDataUri = useCallback(() => {
    // Note: In a real implementation, this would generate an actual WOFF2 font
    // For now, we provide a placeholder and instructions
    const iconList = Array.from(selectedIcons).sort();

    return `/* Data URI Placeholder */
/* To generate a real WOFF2 data URI, run the build script with your icon selection */

/*
Selected icons (${iconList.length}):
${iconList.map((name) => `  - ${name}`).join('\n')}

To generate a real subset:
1. Save this icon list
2. Run: pnpm build:font --subset="${iconList.join(',')}"
3. The output will include a base64-encoded WOFF2 data URI
*/

@font-face {
  font-family: '${fontFamily}';
  src: url('data:font/woff2;base64,YOUR_BASE64_DATA_HERE') format('woff2');
  font-weight: normal;
  font-style: normal;
}
`;
  }, [selectedIcons, fontFamily]);

  const handleGenerate = useCallback(() => {
    if (selectedIcons.size === 0) {
      setGeneratedOutput('// Please select at least one icon');
      return;
    }

    switch (exportFormat) {
      case 'css':
        setGeneratedOutput(generateCSS());
        break;
      case 'dataUri':
        setGeneratedOutput(generateDataUri());
        break;
      case 'woff2':
        setGeneratedOutput(
          `// WOFF2 Download\n// Selected ${selectedIcons.size} icons: ${Array.from(selectedIcons).join(', ')}\n\n// In a production build, clicking "Download" would trigger a WOFF2 file download.\n// For now, use the CSS export option to get the class definitions.`
        );
        break;
    }
  }, [exportFormat, selectedIcons, generateCSS, generateDataUri]);

  const copyToClipboard = useCallback(async () => {
    if (generatedOutput) {
      await navigator.clipboard.writeText(generatedOutput);
    }
  }, [generatedOutput]);

  if (isLoading) {
    return (
      <div className={styles.generator}>
        <Stack gap={2} align="center" style={{ padding: '4rem' }}>
          <Spinner size="lg" />
          <Text color="soft">Loading icons...</Text>
        </Stack>
      </div>
    );
  }

  return (
    <div className={styles.generator}>
      <Stack gap="lg">
        <Stack gap="sm">
          <Heading level={1}>Font Subset Generator</Heading>
          <Text color="soft">
            Select icons to create a custom WOFF2 font subset. Only the icons you select will be
            included, reducing file size.
          </Text>
        </Stack>

        <div className={styles.layout}>
          <Card className={styles.iconSelector}>
            <div className={styles.selectorHeader}>
              <Input
                type="search"
                placeholder="Search icons..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={styles.searchInput}
              />
              <Stack direction="horizontal" gap="sm">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Select All
                </Button>
                <Button variant="ghost" size="sm" onClick={clearAll}>
                  Clear
                </Button>
              </Stack>
            </div>

            <div className={styles.selectedCount}>
              <Text size="sm" color="soft">{selectedIcons.size} icons selected</Text>
            </div>

            <BidirectionalFocusZone className={styles.iconGrid}>
              {filteredIcons.map(({ name, Component }) => (
                <button
                  key={name}
                  className={`${styles.iconCard} ${selectedIcons.has(name) ? styles.selected : ''}`}
                  onClick={() => toggleIcon(name)}
                  title={name}
                >
                  <div className={styles.iconWrapper}>
                    {Component && <Component size={24} />}
                  </div>
                  <span className={styles.iconName}>{name}</span>
                </button>
              ))}
            </BidirectionalFocusZone>
          </Card>

          <Card className={styles.outputPanel}>
            <div className={styles.outputHeader}>
              <Heading level={3}>Export Options</Heading>
            </div>

            <Stack gap="md" className={styles.options}>
              <Stack gap="xs">
                <Text size="sm" weight="medium">Font Family Name</Text>
                <Input
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  fullWidth
                />
              </Stack>

              <Stack gap="xs">
                <Text size="sm" weight="medium">Export Format</Text>
                <Segmented
                  options={formatOptions}
                  value={exportFormat}
                  onChange={(v) => setExportFormat(v as ExportFormat)}
                  fullWidth
                />
              </Stack>

              <Button
                variant="primary"
                onClick={handleGenerate}
                disabled={selectedIcons.size === 0}
              >
                Generate {exportFormat.toUpperCase()}
              </Button>
            </Stack>

            {generatedOutput && (
              <div className={styles.output}>
                <div className={styles.outputActions}>
                  <Button variant="outline" size="sm" onClick={copyToClipboard}>
                    Copy to Clipboard
                  </Button>
                </div>
                <Code language="css" className={styles.code}>
                  {generatedOutput}
                </Code>
              </div>
            )}
          </Card>
        </div>
      </Stack>
    </div>
  );
}

const meta: Meta<typeof FontSubsetGenerator> = {
  title: 'Font Subset Generator',
  component: FontSubsetGenerator,
  parameters: {
    layout: 'fullscreen',
    options: {
      showPanel: false,
    },
  },
};

export default meta;
type Story = StoryObj<typeof FontSubsetGenerator>;

export const FontSubsetGenerator_: Story = {
  name: 'Font Subset Generator',
};
