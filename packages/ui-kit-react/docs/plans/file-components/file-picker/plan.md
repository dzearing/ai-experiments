# FilePicker Component

## Overview
A comprehensive file selection component that supports multiple file types, drag-and-drop, previews, and various upload modes.

## Component Specification

### Props
```typescript
interface FilePickerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  // Selection behavior
  multiple?: boolean;
  onSelect?: (files: File[]) => void;
  onRemove?: (file: File, index: number) => void;
  
  // File constraints
  accept?: string; // MIME types or file extensions
  maxFiles?: number;
  maxSize?: number; // In bytes
  minSize?: number; // In bytes
  
  // Visual variants
  variant?: 'button' | 'dropzone' | 'inline' | 'compact';
  size?: 'sm' | 'md' | 'lg';
  
  // Content and labels
  placeholder?: string;
  buttonText?: string;
  dragText?: string;
  dropText?: string;
  
  // Features
  showPreview?: boolean;
  showProgress?: boolean;
  allowDragDrop?: boolean;
  disabled?: boolean;
  
  // Validation
  validator?: (file: File) => string | null; // Return error message or null
  onValidationError?: (errors: ValidationError[]) => void;
  
  // Upload functionality
  uploadUrl?: string;
  uploadHeaders?: Record<string, string>;
  onUploadStart?: (file: File) => void;
  onUploadProgress?: (file: File, progress: number) => void;
  onUploadComplete?: (file: File, response: any) => void;
  onUploadError?: (file: File, error: Error) => void;
  
  // Initial state
  defaultFiles?: FileWithMetadata[];
  value?: FileWithMetadata[]; // Controlled mode
  
  // Styling
  className?: string;
  dropzoneClassName?: string;
  previewClassName?: string;
}

interface FileWithMetadata extends File {
  id?: string;
  preview?: string; // Data URL for preview
  uploadProgress?: number;
  uploadStatus?: 'pending' | 'uploading' | 'complete' | 'error';
  uploadError?: string;
}

interface ValidationError {
  file: File;
  message: string;
  type: 'size' | 'type' | 'count' | 'custom';
}
```

### Usage Examples
```tsx
// Basic file picker
<FilePicker
  onSelect={(files) => setSelectedFiles(files)}
  accept="image/*"
  multiple
/>

// Dropzone variant
<FilePicker
  variant="dropzone"
  multiple
  maxFiles={5}
  maxSize={10 * 1024 * 1024} // 10MB
  onSelect={handleFileSelect}
  placeholder="Drag and drop files here or click to browse"
  allowDragDrop
  showPreview
/>

// With file validation
<FilePicker
  accept=".pdf,.doc,.docx"
  validator={(file) => {
    if (file.size > 5 * 1024 * 1024) {
      return "File size must be less than 5MB";
    }
    if (!file.name.includes('report')) {
      return "File name must contain 'report'";
    }
    return null;
  }}
  onValidationError={(errors) => {
    errors.forEach(error => {
      toast.error(`${error.file.name}: ${error.message}`);
    });
  }}
/>

// Auto-upload with progress
<FilePicker
  variant="dropzone"
  uploadUrl="/api/upload"
  uploadHeaders={{ 'Authorization': `Bearer ${token}` }}
  showProgress
  onUploadStart={(file) => console.log('Upload started:', file.name)}
  onUploadProgress={(file, progress) => 
    console.log(`${file.name}: ${progress}%`)
  }
  onUploadComplete={(file, response) => 
    console.log('Upload complete:', response)
  }
  onUploadError={(file, error) => 
    console.error('Upload failed:', error)
  }
/>

// Controlled with previews
<FilePicker
  value={files}
  onSelect={setFiles}
  onRemove={(file, index) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  }}
  accept="image/*,video/*"
  showPreview
  multiple
  maxFiles={10}
/>

// Compact button variant
<FilePicker
  variant="button"
  size="sm"
  buttonText="Choose Files"
  accept=".csv,.xlsx"
  onSelect={importData}
/>

// Inline variant for forms
<FilePicker
  variant="inline"
  placeholder="Select profile picture"
  accept="image/*"
  maxSize={2 * 1024 * 1024} // 2MB
  onSelect={(files) => setProfilePicture(files[0])}
/>
```

## Visual Design

### Variants
- **button**: Traditional file input button
- **dropzone**: Large drop area with drag-and-drop
- **inline**: Integrated into form layouts
- **compact**: Minimal space usage

### Size Options
- **sm**: Compact sizing for tight layouts
- **md**: Standard size (default)
- **lg**: Large size for prominent file selection

### Visual States
- **Default**: Ready for file selection
- **Drag Over**: Visual feedback during drag
- **Loading**: Processing or uploading
- **Error**: Validation or upload errors
- **Success**: Successful upload indication

## Technical Implementation

### Core Structure
```typescript
const FilePicker = forwardRef<HTMLDivElement, FilePickerProps>(
  ({ 
    multiple = false,
    onSelect,
    onRemove,
    accept,
    maxFiles = Infinity,
    maxSize = Infinity,
    minSize = 0,
    variant = 'dropzone',
    size = 'md',
    placeholder = 'Choose files or drag and drop',
    buttonText = 'Browse Files',
    dragText = 'Drag files here',
    dropText = 'Drop to upload',
    showPreview = false,
    showProgress = false,
    allowDragDrop = true,
    disabled = false,
    validator,
    onValidationError,
    uploadUrl,
    uploadHeaders,
    onUploadStart,
    onUploadProgress,
    onUploadComplete,
    onUploadError,
    defaultFiles = [],
    value,
    className,
    dropzoneClassName,
    previewClassName,
    ...props 
  }, ref) => {
    const [files, setFiles] = useControlledState({
      prop: value,
      defaultProp: defaultFiles,
      onChange: onSelect
    });
    
    const [isDragOver, setIsDragOver] = useState(false);
    const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const uploadQueueRef = useRef<Map<string, AbortController>>(new Map());
    
    // File validation\n    const validateFiles = useCallback((newFiles: File[]): ValidationError[] => {\n      const errors: ValidationError[] = [];\n      \n      // Check file count\n      if (files.length + newFiles.length > maxFiles) {\n        errors.push({\n          file: newFiles[0],\n          message: `Maximum ${maxFiles} files allowed`,\n          type: 'count'\n        });\n      }\n      \n      newFiles.forEach(file => {\n        // Size validation\n        if (file.size > maxSize) {\n          errors.push({\n            file,\n            message: `File size exceeds ${formatFileSize(maxSize)}`,\n            type: 'size'\n          });\n        }\n        \n        if (file.size < minSize) {\n          errors.push({\n            file,\n            message: `File size must be at least ${formatFileSize(minSize)}`,\n            type: 'size'\n          });\n        }\n        \n        // Type validation\n        if (accept && !isFileAccepted(file, accept)) {\n          errors.push({\n            file,\n            message: `File type not accepted: ${file.type || 'unknown'}`,\n            type: 'type'\n          });\n        }\n        \n        // Custom validation\n        if (validator) {\n          const customError = validator(file);\n          if (customError) {\n            errors.push({\n              file,\n              message: customError,\n              type: 'custom'\n            });\n          }\n        }\n      });\n      \n      return errors;\n    }, [files, maxFiles, maxSize, minSize, accept, validator]);\n    \n    // File processing with preview generation\n    const processFiles = useCallback(async (rawFiles: File[]) => {\n      const processedFiles: FileWithMetadata[] = [];\n      \n      for (const file of rawFiles) {\n        const fileWithMetadata: FileWithMetadata = {\n          ...file,\n          id: generateId(),\n          uploadStatus: 'pending'\n        };\n        \n        // Generate preview for images\n        if (showPreview && file.type.startsWith('image/')) {\n          try {\n            fileWithMetadata.preview = await generatePreview(file);\n          } catch (error) {\n            console.warn('Failed to generate preview:', error);\n          }\n        }\n        \n        processedFiles.push(fileWithMetadata);\n      }\n      \n      return processedFiles;\n    }, [showPreview]);\n    \n    // Upload functionality\n    const uploadFile = useCallback(async (file: FileWithMetadata) => {\n      if (!uploadUrl) return;\n      \n      const abortController = new AbortController();\n      uploadQueueRef.current.set(file.id!, abortController);\n      \n      try {\n        file.uploadStatus = 'uploading';\n        file.uploadProgress = 0;\n        onUploadStart?.(file);\n        \n        const formData = new FormData();\n        formData.append('file', file);\n        \n        const response = await fetch(uploadUrl, {\n          method: 'POST',\n          body: formData,\n          headers: uploadHeaders,\n          signal: abortController.signal\n        });\n        \n        if (!response.ok) {\n          throw new Error(`Upload failed: ${response.statusText}`);\n        }\n        \n        const result = await response.json();\n        \n        file.uploadStatus = 'complete';\n        file.uploadProgress = 100;\n        onUploadComplete?.(file, result);\n        \n      } catch (error) {\n        if (error.name !== 'AbortError') {\n          file.uploadStatus = 'error';\n          file.uploadError = error.message;\n          onUploadError?.(file, error);\n        }\n      } finally {\n        uploadQueueRef.current.delete(file.id!);\n      }\n    }, [uploadUrl, uploadHeaders, onUploadStart, onUploadComplete, onUploadError]);\n    \n    // Handle file selection\n    const handleFileSelect = useCallback(async (newFiles: File[]) => {\n      if (disabled) return;\n      \n      const errors = validateFiles(newFiles);\n      if (errors.length > 0) {\n        setValidationErrors(errors);\n        onValidationError?.(errors);\n        return;\n      }\n      \n      const processedFiles = await processFiles(newFiles);\n      const updatedFiles = multiple ? [...files, ...processedFiles] : processedFiles;\n      \n      setFiles(updatedFiles);\n      \n      // Auto-upload if URL provided\n      if (uploadUrl) {\n        processedFiles.forEach(uploadFile);\n      }\n    }, [disabled, validateFiles, processFiles, multiple, files, setFiles, uploadUrl, uploadFile]);\n    \n    // Drag and drop handlers\n    const handleDragEnter = (e: DragEvent) => {\n      e.preventDefault();\n      e.stopPropagation();\n      if (!disabled && allowDragDrop) {\n        setIsDragOver(true);\n      }\n    };\n    \n    const handleDragLeave = (e: DragEvent) => {\n      e.preventDefault();\n      e.stopPropagation();\n      if (!e.currentTarget.contains(e.relatedTarget as Node)) {\n        setIsDragOver(false);\n      }\n    };\n    \n    const handleDragOver = (e: DragEvent) => {\n      e.preventDefault();\n      e.stopPropagation();\n    };\n    \n    const handleDrop = (e: DragEvent) => {\n      e.preventDefault();\n      e.stopPropagation();\n      setIsDragOver(false);\n      \n      if (disabled || !allowDragDrop) return;\n      \n      const droppedFiles = Array.from(e.dataTransfer.files);\n      handleFileSelect(droppedFiles);\n    };\n    \n    // Input change handler\n    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {\n      const selectedFiles = Array.from(e.target.files || []);\n      handleFileSelect(selectedFiles);\n      \n      // Reset input value\n      if (fileInputRef.current) {\n        fileInputRef.current.value = '';\n      }\n    };\n    \n    // Remove file handler\n    const handleRemoveFile = (file: FileWithMetadata, index: number) => {\n      // Cancel upload if in progress\n      if (file.id && uploadQueueRef.current.has(file.id)) {\n        uploadQueueRef.current.get(file.id)!.abort();\n      }\n      \n      const newFiles = [...files];\n      newFiles.splice(index, 1);\n      setFiles(newFiles);\n      onRemove?.(file, index);\n    };\n    \n    if (variant === 'button') {\n      return (\n        <div ref={ref} className={cn(filePickerStyles.buttonContainer, className)} {...props}>\n          <input\n            ref={fileInputRef}\n            type=\"file\"\n            accept={accept}\n            multiple={multiple}\n            onChange={handleInputChange}\n            disabled={disabled}\n            className={filePickerStyles.hiddenInput}\n          />\n          \n          <Button\n            onClick={() => fileInputRef.current?.click()}\n            disabled={disabled}\n            size={size}\n            variant=\"outline\"\n          >\n            <Upload className={filePickerStyles.buttonIcon} />\n            {buttonText}\n          </Button>\n          \n          {showPreview && files.length > 0 && (\n            <FilePreviewList\n              files={files}\n              onRemove={handleRemoveFile}\n              showProgress={showProgress}\n              className={previewClassName}\n            />\n          )}\n        </div>\n      );\n    }\n    \n    return (\n      <div\n        ref={ref}\n        className={cn(\n          filePickerStyles.dropzone,\n          filePickerStyles.variant[variant],\n          filePickerStyles.size[size],\n          isDragOver && filePickerStyles.dragOver,\n          disabled && filePickerStyles.disabled,\n          dropzoneClassName,\n          className\n        )}\n        onDragEnter={handleDragEnter}\n        onDragLeave={handleDragLeave}\n        onDragOver={handleDragOver}\n        onDrop={handleDrop}\n        onClick={() => fileInputRef.current?.click()}\n        {...props}\n      >\n        <input\n          ref={fileInputRef}\n          type=\"file\"\n          accept={accept}\n          multiple={multiple}\n          onChange={handleInputChange}\n          disabled={disabled}\n          className={filePickerStyles.hiddenInput}\n        />\n        \n        <div className={filePickerStyles.content}>\n          <Upload className={filePickerStyles.icon} />\n          \n          <div className={filePickerStyles.text}>\n            <span className={filePickerStyles.primary}>\n              {isDragOver ? dropText : placeholder}\n            </span>\n            \n            {!isDragOver && (\n              <span className={filePickerStyles.secondary}>\n                {allowDragDrop ? dragText : 'Click to browse'}\n              </span>\n            )}\n          </div>\n          \n          {maxFiles !== Infinity && (\n            <span className={filePickerStyles.limit}>\n              Max {maxFiles} file{maxFiles !== 1 ? 's' : ''}\n            </span>\n          )}\n        </div>\n        \n        {showPreview && files.length > 0 && (\n          <FilePreviewList\n            files={files}\n            onRemove={handleRemoveFile}\n            showProgress={showProgress}\n            className={previewClassName}\n          />\n        )}\n        \n        {validationErrors.length > 0 && (\n          <div className={filePickerStyles.errors}>\n            {validationErrors.map((error, index) => (\n              <div key={index} className={filePickerStyles.error}>\n                {error.file.name}: {error.message}\n              </div>\n            ))}\n          </div>\n        )}\n      </div>\n    );\n  }\n);\n```\n\n### CSS Module Structure\n```css\n.dropzone {\n  position: relative;\n  border: 2px dashed var(--color-border);\n  border-radius: var(--border-radius-lg);\n  padding: var(--spacing-xl);\n  text-align: center;\n  cursor: pointer;\n  transition: all 0.2s ease;\n  background: var(--color-surface);\n}\n\n.dropzone:hover:not(.disabled) {\n  border-color: var(--color-primary);\n  background: var(--color-primary-surface);\n}\n\n.dragOver {\n  border-color: var(--color-primary);\n  background: var(--color-primary-surface);\n  transform: scale(1.02);\n}\n\n.disabled {\n  opacity: 0.5;\n  cursor: not-allowed;\n  pointer-events: none;\n}\n\n.variant {\n  &.inline {\n    padding: var(--spacing-md);\n    border-style: solid;\n    border-width: 1px;\n  }\n  \n  &.compact {\n    padding: var(--spacing-sm);\n  }\n}\n\n.size {\n  &.sm {\n    padding: var(--spacing-sm);\n    font-size: var(--font-size-sm);\n  }\n  \n  &.lg {\n    padding: var(--spacing-2xl);\n    font-size: var(--font-size-lg);\n  }\n}\n\n.hiddenInput {\n  position: absolute;\n  opacity: 0;\n  pointer-events: none;\n  width: 0;\n  height: 0;\n}\n\n.content {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  gap: var(--spacing-md);\n}\n\n.icon {\n  width: 48px;\n  height: 48px;\n  color: var(--color-text-secondary);\n}\n\n.text {\n  display: flex;\n  flex-direction: column;\n  gap: var(--spacing-xs);\n}\n\n.primary {\n  font-weight: var(--font-weight-medium);\n  color: var(--color-text-primary);\n}\n\n.secondary {\n  font-size: var(--font-size-sm);\n  color: var(--color-text-secondary);\n}\n\n.limit {\n  font-size: var(--font-size-xs);\n  color: var(--color-text-tertiary);\n}\n\n.buttonContainer {\n  display: flex;\n  flex-direction: column;\n  gap: var(--spacing-md);\n}\n\n.buttonIcon {\n  width: 16px;\n  height: 16px;\n}\n\n.errors {\n  margin-top: var(--spacing-sm);\n  padding: var(--spacing-sm);\n  background: var(--color-error-surface);\n  border-radius: var(--border-radius-md);\n}\n\n.error {\n  color: var(--color-error);\n  font-size: var(--font-size-sm);\n  margin-bottom: var(--spacing-xs);\n}\n\n.error:last-child {\n  margin-bottom: 0;\n}\n```\n\n## Accessibility Features\n- Keyboard navigation support\n- Screen reader announcements\n- Focus management\n- ARIA labels and descriptions\n- Error state communication\n\n## Dependencies\n- React (forwardRef, useState, useCallback, useRef)\n- Internal Button component\n- File utility functions\n- CSS modules\n- Utility functions (cn)\n\n## Design Tokens Used\n- **Colors**: borders, backgrounds, states\n- **Spacing**: padding, gaps, margins\n- **Typography**: text sizing and weights\n- **Border Radius**: container rounding\n- **Transitions**: hover and drag effects\n\n## Testing Considerations\n- File validation logic\n- Drag and drop behavior\n- Upload functionality\n- Preview generation\n- Error handling\n- Accessibility compliance\n- Cross-browser file API support\n\n## Related Components\n- FilePreviewList (file display)\n- Button (trigger component)\n- Progress (upload progress)\n- Alert (validation errors)\n\n## Common Use Cases\n- Document uploads\n- Image galleries\n- Profile picture selection\n- Bulk file imports\n- Attachment handling\n- Media content management\n- Form file inputs\n- Drag-and-drop interfaces