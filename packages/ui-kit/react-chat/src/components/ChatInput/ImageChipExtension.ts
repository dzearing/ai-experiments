import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ImageChipNodeView } from './ImageChipNodeView';

export interface ImageChipAttributes {
  id: string;
  name: string;
}

export interface ImageChipPosition {
  id: string;
  pos: number;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageChip: {
      insertImageChip: (attrs: ImageChipAttributes) => ReturnType;
      updateImageChipName: (id: string, name: string) => ReturnType;
      removeImageChip: (id: string) => ReturnType;
    };
  }
}

export const ImageChipExtension = Node.create({
  name: 'imageChip',
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
        default: 'Image',
        parseHTML: (element) => element.getAttribute('data-name'),
        renderHTML: (attributes) => ({ 'data-name': attributes.name }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-image-chip]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-image-chip': '',
        contenteditable: 'false',
      }),
      HTMLAttributes['data-name'],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageChipNodeView);
  },

  addCommands() {
    return {
      insertImageChip:
        (attrs: ImageChipAttributes) =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: this.name,
              attrs,
            })
            .run();
        },
      updateImageChipName:
        (id: string, name: string) =>
        ({ tr, state }) => {
          let found = false;
          state.doc.descendants((node, pos) => {
            if (node.type.name === this.name && node.attrs.id === id) {
              // Only update if name actually changed to prevent infinite loops
              if (node.attrs.name !== name) {
                tr.setNodeMarkup(pos, undefined, { ...node.attrs, name });
              }
              found = true;
              return false;
            }
            return true;
          });
          return found;
        },
      removeImageChip:
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
 * Get all image chips in document order with their positions
 */
export function getImageChipsInOrder(editor: { state: { doc: { descendants: (callback: (node: { type: { name: string }; attrs: { id: string } }, pos: number) => boolean | void) => void } } }): ImageChipPosition[] {
  const chips: ImageChipPosition[] = [];
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'imageChip') {
      chips.push({ id: node.attrs.id, pos });
    }
  });
  return chips;
}

/**
 * Select/focus a chip by ID
 */
export function selectChipById(editor: { state: { doc: { descendants: (callback: (node: { type: { name: string }; attrs: { id: string }; nodeSize: number }, pos: number) => boolean | void) => void } }; chain: () => { focus: () => { setNodeSelection: (pos: number) => { run: () => boolean } } } }, id: string): boolean {
  let found = false;
  let chipPos = -1;
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'imageChip' && node.attrs.id === id) {
      chipPos = pos;
      found = true;
      return false;
    }
  });

  if (found && chipPos >= 0) {
    editor.chain().focus().setNodeSelection(chipPos).run();
  }

  return found;
}
