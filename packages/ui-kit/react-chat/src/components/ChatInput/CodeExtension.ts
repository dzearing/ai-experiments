/**
 * Custom Code extension that exits the code mark when typing a backtick at the end
 */

import Code from '@tiptap/extension-code';

export const CodeExtension = Code.extend({
  addKeyboardShortcuts() {
    return {
      ...this.parent?.(),
      // Exit code mark when pressing backtick at the end
      '`': ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        const { $from, empty } = selection;

        // Only handle if selection is empty (cursor, not selection)
        if (!empty) {
          return false;
        }

        // Check if we're in a code mark
        const codeMark = this.type;
        const isInCode = $from.marks().some(mark => mark.type === codeMark);

        if (!isInCode) {
          return false;
        }

        // Check if the character before cursor has code mark
        // and the position is at the boundary
        if (isInCode) {
          // Remove the code mark and place cursor outside
          editor.chain()
            .unsetCode()
            .insertContent(' ')
            .run();
          return true;
        }

        return false;
      },
      // Also handle ArrowRight at end to exit code mark
      'ArrowRight': ({ editor }) => {
        const { state } = editor;
        const { selection, doc } = state;
        const { $from, empty } = selection;

        if (!empty) {
          return false;
        }

        const codeMark = this.type;
        const isInCode = $from.marks().some(mark => mark.type === codeMark);

        if (!isInCode) {
          return false;
        }

        // Check if we're at the end of the code mark by looking at what's after
        const posAfter = $from.pos;
        const nodeAfter = doc.nodeAt(posAfter);

        // If there's text after without the code mark, just move normally
        if (nodeAfter) {
          const marksAfter = nodeAfter.marks;
          const hasCodeAfter = marksAfter.some(mark => mark.type === codeMark);
          if (hasCodeAfter) {
            // Still in code, let default handle it
            return false;
          }
        }

        // Check if we're at the end of the current text node with code mark
        const parentOffset = $from.parentOffset;
        const parentSize = $from.parent.content.size;

        if (parentOffset >= parentSize - 1 || !nodeAfter) {
          // At the end of code mark - insert a zero-width space and move cursor there
          // This gives the cursor a clear visual position outside the code
          editor.chain()
            .unsetCode()
            .insertContent('\u200B') // Zero-width space
            .run();
          return true;
        }

        // Let default behavior handle it
        return false;
      },
    };
  },
});

export default CodeExtension;
