/**
 * File icon resolver for TreeView component.
 * Maps file types and extensions to appropriate icons.
 */

import type { ReactNode } from 'react';
import { FileIcon } from '@ui-kit/icons/FileIcon';
import { FolderIcon } from '@ui-kit/icons/FolderIcon';
import { CodeIcon } from '@ui-kit/icons/CodeIcon';
import type { TreeNode } from '@ui-kit/react';

/**
 * Icon resolver function type matching TreeView's iconResolver prop.
 */
export type IconResolver = (type: string, node: TreeNode) => ReactNode | null;

/**
 * Set of file extensions that represent code files.
 */
const CODE_EXTENSIONS = new Set([
  // JavaScript/TypeScript
  'js',
  'jsx',
  'ts',
  'tsx',
  'mjs',
  'cjs',
  // Web
  'html',
  'htm',
  'css',
  'scss',
  'sass',
  'less',
  // Backend
  'py',
  'rb',
  'go',
  'rs',
  'java',
  'kt',
  'c',
  'cpp',
  'cc',
  'h',
  'hpp',
  'cs',
  'swift',
  'php',
  // Shell
  'sh',
  'bash',
  'zsh',
  'ps1',
  // Data/Query
  'sql',
  'graphql',
  'gql',
]);

/**
 * Extracts the file extension from a path or filename.
 *
 * @param path - File path or filename
 * @returns Lowercase extension without the dot, or empty string if none
 */
function getExtension(path: string): string {
  const lastDot = path.lastIndexOf('.');
  const lastSlash = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));

  // No extension or extension before path separator
  if (lastDot <= lastSlash) {
    return '';
  }

  return path.slice(lastDot + 1).toLowerCase();
}

/**
 * Checks if a file path represents a code file based on its extension.
 *
 * @param path - File path to check
 * @returns True if the file is a code file
 */
function isCodeFile(path: string): boolean {
  const ext = getExtension(path);

  return CODE_EXTENSIONS.has(ext);
}

/**
 * Icon resolver for file browser TreeView.
 * Returns appropriate icons based on file type and extension.
 *
 * @param type - Node type ('folder', 'file', 'directory', etc.)
 * @param node - TreeNode with id (path) and other metadata
 * @returns React node for the icon, or null for default
 *
 * @example
 * ```tsx
 * <TreeView
 *   data={treeData}
 *   iconResolver={fileIconResolver}
 * />
 * ```
 */
export const fileIconResolver: IconResolver = (type: string, node: TreeNode): ReactNode => {
  // Directories get folder icon
  if (type === 'folder' || type === 'directory') {
    return <FolderIcon size={16} />;
  }

  // For files, check if it's a code file
  const path = node.id;

  if (isCodeFile(path)) {
    return <CodeIcon size={16} />;
  }

  // Default file icon
  return <FileIcon size={16} />;
};
