import { Node, mergeAttributes, type Editor } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { TopicChipNodeView } from './TopicChipNodeView';

export interface TopicChipAttributes {
  id: string;
  name: string;
  type: 'category' | 'project' | 'feature' | 'item';
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    thingChip: {
      insertTopicChip: (attrs: TopicChipAttributes) => ReturnType;
      removeTopicChip: (id: string) => ReturnType;
    };
  }
}

export const TopicChipExtension = Node.create({
  name: 'thingChip',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-id'),
        renderHTML: (attributes) => ({ 'data-id': attributes.id }),
      },
      name: {
        default: 'Thing',
        parseHTML: (element) => element.getAttribute('data-name'),
        renderHTML: (attributes) => ({ 'data-name': attributes.name }),
      },
      type: {
        default: 'item',
        parseHTML: (element) => element.getAttribute('data-type'),
        renderHTML: (attributes) => ({ 'data-type': attributes.type }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-thing-chip]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-thing-chip': '',
        contenteditable: 'false',
      }),
      `^${HTMLAttributes['data-name']}`,
    ];
  },

  // Custom markdown serialization - output as ^[DisplayName](id:uuid) format
  // This allows the LLM to see both the display name and ID in the message content
  addStorage() {
    return {
      markdown: {
        serialize(state: { write: (text: string) => void }, node: { attrs: { id: string; name: string } }) {
          // Format: ^[DisplayName](id:uuid) - similar to markdown link syntax
          // Include trailing space to separate from following text
          state.write(`^[${node.attrs.name}](id:${node.attrs.id}) `);
        },
        parse: {
          // No parsing from markdown needed
        },
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(TopicChipNodeView);
  },

  addCommands() {
    return {
      insertTopicChip:
        (attrs: TopicChipAttributes) =>
        ({ chain }) => {
          // Insert only the chip - the trailing space is handled by markdown serialization
          return chain()
            .insertContent({
              type: this.name,
              attrs,
            })
            .run();
        },
      removeTopicChip:
        (id: string) =>
        ({ tr, state }) => {
          let found = false;
          state.doc.descendants((node, pos) => {
            if (node.type.name === this.name && node.attrs.id === id) {
              tr.delete(pos, pos + node.nodeSize);
              found = true;
              return false;
            }
            return true;
          });
          return found;
        },
    };
  },
});

/**
 * Get all thing chips in document with their IDs
 */
export function getTopicChipsInOrder(editor: Editor): { id: string; name: string }[] {
  const chips: { id: string; name: string }[] = [];
  editor.state.doc.descendants((node) => {
    if (node.type.name === 'thingChip') {
      chips.push({
        id: node.attrs.id as string,
        name: node.attrs.name as string
      });
    }
  });
  return chips;
}
