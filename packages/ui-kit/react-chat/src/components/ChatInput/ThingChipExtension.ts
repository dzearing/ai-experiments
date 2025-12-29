import { Node, mergeAttributes, type Editor } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ThingChipNodeView } from './ThingChipNodeView';

export interface ThingChipAttributes {
  id: string;
  name: string;
  type: 'category' | 'project' | 'feature' | 'item';
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    thingChip: {
      insertThingChip: (attrs: ThingChipAttributes) => ReturnType;
      removeThingChip: (id: string) => ReturnType;
    };
  }
}

export const ThingChipExtension = Node.create({
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

  addNodeView() {
    return ReactNodeViewRenderer(ThingChipNodeView);
  },

  addCommands() {
    return {
      insertThingChip:
        (attrs: ThingChipAttributes) =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: this.name,
              attrs,
            })
            .insertContent(' ')
            .run();
        },
      removeThingChip:
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
export function getThingChipsInOrder(editor: Editor): { id: string; name: string }[] {
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
