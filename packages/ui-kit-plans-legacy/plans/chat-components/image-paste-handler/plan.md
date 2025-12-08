# ImagePasteHandler Plan

## Overview

### Description
ImagePasteHandler manages clipboard image paste events, providing image preview, processing, and upload functionality. It handles various image formats, resizing, and validation before adding images to chat messages.

### Visual Design Mockups
- [Default State](./mockups/image-paste-handler-default.html)

### Key Features
- Clipboard image paste detection
- Image preview and thumbnail generation
- Image format validation and conversion
- Automatic resizing and optimization
- Upload progress indication
- Error handling for unsupported formats
- Drag and drop support integration

### Use Cases
- Pasting screenshots into chat
- Adding copied images from other applications
- Quick image sharing in conversations
- Image preprocessing before upload

## API Design

### Props Interface

| Prop Name | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| **Required Props** |
| onImagePaste | `(image: ImageData) => void` | ✓ | - | Handler for successful image paste |
| **Optional Props** |
| acceptedFormats | `string[]` | - | `['png', 'jpg', 'gif']` | Accepted image formats |
| maxFileSize | `number` | - | `10485760` | Maximum file size in bytes |
| autoResize | `boolean` | - | `true` | Automatically resize large images |
| maxWidth | `number` | - | `1920` | Maximum image width |
| maxHeight | `number` | - | `1080` | Maximum image height |
| quality | `number` | - | `0.8` | JPEG compression quality |
| **Event Handlers** |
| onError | `(error: Error) => void` | - | - | Handler for paste errors |
| onProgress | `(progress: number) => void` | - | - | Handler for processing progress |