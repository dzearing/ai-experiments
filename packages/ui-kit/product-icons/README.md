# @ui-kit/react-product-icons

Multi-color product icons for Microsoft apps and AI agents. Unlike UI icons that use `currentColor`, product icons preserve their original multi-color fills for brand recognition.

## Installation

```bash
pnpm add @ui-kit/react-product-icons
```

## Usage

Import icons individually for optimal tree-shaking:

```tsx
import { WordIcon } from '@ui-kit/react-product-icons/WordIcon';
import { ExcelIcon } from '@ui-kit/react-product-icons/ExcelIcon';
import { AnalystAgentIcon } from '@ui-kit/react-product-icons/AnalystAgentIcon';

function App() {
  return (
    <div>
      <WordIcon size={32} />
      <ExcelIcon size={24} />
      <AnalystAgentIcon size={48} title="Analyst Agent" />
    </div>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `16 \| 24 \| 32 \| 48 \| number` | `24` | Icon size in pixels. Discrete sizes (16, 24, 32, 48) use pixel-perfect SVGs when available. |
| `title` | `string` | - | Accessible title. When provided, icon has `role="img"`. When omitted, icon is decorative (`aria-hidden`). |
| `className` | `string` | - | CSS class name |
| `style` | `CSSProperties` | - | Inline styles |

All standard SVG props are also supported.

## Categories

### Microsoft Product Icons

Application icons for Microsoft 365 products:
- Word, Excel, PowerPoint, Outlook, Teams
- OneDrive, OneNote, SharePoint
- And more...

### Agent Icons

AI agent personas with distinctive visual identities:
- AnalystAgent, ResearcherAgent, WriterAgent
- CoderAgent, DesignerAgent
- And more...

## Size Variants

Product icons support multiple discrete sizes for pixel-perfect rendering:

- **16px**: Compact UI, inline text
- **24px**: Default, most common
- **32px**: Larger buttons, headers
- **48px**: Feature callouts, avatars

When a size variant SVG exists (e.g., `word-16.svg`, `word-24.svg`), that specific size is used. If only a single SVG exists, it scales to the requested size.

## Accessibility

- Provide a `title` prop for meaningful icons (buttons, standalone indicators)
- Omit `title` for decorative icons (icons next to text labels)

```tsx
// Decorative - text label provides context
<button>
  <WordIcon />
  Open in Word
</button>

// Meaningful - icon is the only indicator
<IconButton aria-label="Open in Word">
  <WordIcon title="Open in Word" />
</IconButton>
```

## Development

### Adding New Icons

1. Place SVG files in `src/svgs/{category}/`:
   - `src/svgs/microsoft/word.svg` (or `word-16.svg`, `word-24.svg` for size variants)
   - `src/svgs/agents/analyst.svg`

2. Optionally add metadata JSON:
   ```json
   // word.json
   {
     "name": "word",
     "category": "microsoft",
     "keywords": ["document", "text", "office"]
   }
   ```

3. Build to generate components:
   ```bash
   pnpm build
   ```

### Build Scripts

```bash
pnpm build           # Full build (generate + compile)
pnpm build:components # Generate components only
pnpm clean           # Remove dist folder
pnpm typecheck       # Type checking
pnpm lint            # Lint source files
```
