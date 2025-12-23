import { NodeViewWrapper } from '@tiptap/react';
import { Chip } from '@ui-kit/react';
import type { NodeViewProps } from '@tiptap/react';

export function ImageChipNodeView({ node, deleteNode, selected }: NodeViewProps) {
  const { name } = node.attrs;

  return (
    <NodeViewWrapper as="span" style={{ display: 'inline' }}>
      <Chip
        size="sm"
        selected={selected}
        onRemove={() => {
          deleteNode();
        }}
      >
        {name}
      </Chip>
    </NodeViewWrapper>
  );
}
