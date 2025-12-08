# TextPasteHandler Plan

## Overview

### Description
TextPasteHandler manages clipboard text paste events with intelligent processing, formatting detection, and content sanitization. It handles rich text, markdown, code blocks, and provides formatting preservation options.

### Visual Design Mockups
- [Default State](./mockups/text-paste-handler-default.html)

### Key Features
- Rich text paste detection and processing
- Markdown format preservation
- Code block detection and syntax highlighting
- URL and link processing
- Content sanitization and security
- Format conversion options
- Large text handling

### Use Cases
- Pasting formatted content from documents
- Code snippet sharing
- URL and link processing
- Rich text content preservation

## API Design

### Props Interface

| Prop Name | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| **Required Props** |
| onTextPaste | `(content: PastedContent) => void` | ✓ | - | Handler for successful text paste |
| **Optional Props** |
| preserveFormatting | `boolean` | - | `true` | Preserve rich text formatting |
| maxLength | `number` | - | `10000` | Maximum text length |
| sanitizeHtml | `boolean` | - | `true` | Sanitize HTML content |
| detectCode | `boolean` | - | `true` | Auto-detect code blocks |
| **Event Handlers** |
| onError | `(error: Error) => void` | - | - | Handler for paste errors |
| onFormat | `(format: TextFormat) => void` | - | - | Handler for format detection |