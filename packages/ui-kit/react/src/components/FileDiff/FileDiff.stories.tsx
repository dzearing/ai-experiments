import type { Meta, StoryObj } from '@storybook/react';
import { FileDiff } from './FileDiff';

const meta = {
  title: 'Data Display/FileDiff',
  component: FileDiff,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    changeType: {
      control: 'select',
      options: ['added', 'modified', 'deleted', 'renamed'],
    },
    showHeader: { control: 'boolean' },
    showLineNumbers: { control: 'boolean' },
    compact: { control: 'boolean' },
  },
} satisfies Meta<typeof FileDiff>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample diff content
const sampleDiff = `@@ -1,7 +1,9 @@
 import { useState } from 'react';
+import { useCallback } from 'react';

 export function Counter() {
-  const [count, setCount] = useState(0);
+  const [count, setCount] = useState<number>(0);
+  const [step, setStep] = useState<number>(1);

-  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
+  const increment = useCallback(() => setCount(c => c + step), [step]);
+
+  return <button onClick={increment}>{count}</button>;
 }`;

const addedFileDiff = `@@ -0,0 +1,15 @@
+/**
+ * New utility function for string formatting
+ */
+export function formatString(str: string): string {
+  return str
+    .trim()
+    .toLowerCase()
+    .replace(/\\s+/g, '-');
+}
+
+export function capitalize(str: string): string {
+  if (!str) return '';
+  return str.charAt(0).toUpperCase() + str.slice(1);
+}`;

const deletedFileDiff = `@@ -1,10 +0,0 @@
-// Legacy utility - no longer needed
-export function oldFunction() {
-  console.log('deprecated');
-  return null;
-}
-
-export function anotherOldFunction() {
-  // This was never used
-  return 42;
-}`;

export const Default: Story = {
  args: {
    path: 'src/components/Counter.tsx',
    changeType: 'modified',
    diff: sampleDiff,
  },
};

export const AddedFile: Story = {
  args: {
    path: 'src/utils/string.ts',
    changeType: 'added',
    diff: addedFileDiff,
  },
};

export const DeletedFile: Story = {
  args: {
    path: 'src/utils/legacy.ts',
    changeType: 'deleted',
    diff: deletedFileDiff,
  },
};

export const RenamedFile: Story = {
  args: {
    path: 'src/utils/format.ts',
    oldPath: 'src/helpers/format.ts',
    changeType: 'renamed',
    diff: sampleDiff,
  },
};

export const WithoutHeader: Story = {
  args: {
    path: 'src/components/Counter.tsx',
    changeType: 'modified',
    diff: sampleDiff,
    showHeader: false,
  },
};

export const WithoutLineNumbers: Story = {
  args: {
    path: 'src/components/Counter.tsx',
    changeType: 'modified',
    diff: sampleDiff,
    showLineNumbers: false,
  },
};

export const Compact: Story = {
  args: {
    path: 'src/components/Counter.tsx',
    changeType: 'modified',
    diff: sampleDiff,
    compact: true,
  },
};

export const WithMaxHeight: Story = {
  args: {
    path: 'src/components/Counter.tsx',
    changeType: 'modified',
    diff: sampleDiff + '\n' + sampleDiff + '\n' + sampleDiff, // Long diff
    maxHeight: '200px',
  },
};

export const Empty: Story = {
  args: {
    path: 'src/components/Empty.tsx',
    changeType: 'modified',
    diff: '',
  },
};

export const ManualStats: Story = {
  args: {
    path: 'src/components/Counter.tsx',
    changeType: 'modified',
    diff: sampleDiff,
    additions: 42,
    deletions: 13,
  },
};
