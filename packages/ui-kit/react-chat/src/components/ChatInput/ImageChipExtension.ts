import { Node, mergeAttributes, type Editor } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ImageChipNodeView } from './ImageChipNodeView';

export interface ImageChipAttributes {
  id: string;
  name: string;
  thumbnailUrl?: string;
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
      thumbnailUrl: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-thumbnail-url'),
        renderHTML: (attributes) => attributes.thumbnailUrl ? { 'data-thumbnail-url': attributes.thumbnailUrl } : {},
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

  // Custom markdown serialization - output as placeholder text
  // The actual image data is tracked separately in the images array passed to onSubmit
  addStorage() {
    return {
      markdown: {
        serialize(state: { write: (text: string) => void }, node: { attrs: { id: string; name: string } }) {
          // Output a simple placeholder - the actual image is in the separate images array
          state.write(`[Image: ${node.attrs.name}]`);
        },
        parse: {
          // No parsing from markdown needed - images are inserted via paste/drag
        },
      },
    };
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
export function getImageChipsInOrder(editor: Editor): ImageChipPosition[] {
  const chips: ImageChipPosition[] = [];
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'imageChip') {
      chips.push({ id: node.attrs.id as string, pos });
    }
  });
  return chips;
}

/**
 * Select/focus a chip by ID
 */
export function selectChipById(editor: Editor, id: string): boolean {
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
