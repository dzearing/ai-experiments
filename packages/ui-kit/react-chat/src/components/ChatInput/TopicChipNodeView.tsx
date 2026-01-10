import { NodeViewWrapper } from '@tiptap/react';
import { Chip } from '@ui-kit/react';
import type { NodeViewProps } from '@tiptap/react';
import type { TopicChipAttributes } from './TopicChipExtension';

/**
 * Get color variant for thing type
 */
function getThingColor(type: TopicChipAttributes['type']): 'default' | 'primary' | 'success' | 'warning' | 'info' {
  switch (type) {
    case 'category':
      return 'primary';
    case 'project':
      return 'success';
    case 'feature':
      return 'warning';
    case 'item':
    default:
      return 'info';
  }
}

export function TopicChipNodeView({ node, deleteNode, selected }: NodeViewProps) {
  const { name, type } = node.attrs as TopicChipAttributes;

  return (
    <NodeViewWrapper as="span" style={{ display: 'inline' }}>
      <Chip
        size="sm"
        variant={getThingColor(type)}
        selected={selected}
        onRemove={() => {
          deleteNode();
        }}
      >
        ^{name}
      </Chip>
    </NodeViewWrapper>
  );
}
