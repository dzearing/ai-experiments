/**
 * CollaborationCursorExtension
 *
 * A TipTap extension that manages and renders remote collaborator cursors.
 * This creates a decoration layer that shows cursor positions for all
 * connected collaborators.
 */

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { Collaborator, CollaboratorCursor } from '../types/collaborator';

export interface CollaborationCursorOptions {
  /** Map of collaborator IDs to cursor positions */
  cursors: Map<string, CollaboratorCursor>;
  /** Map of collaborator IDs to collaborator data */
  collaborators: Map<string, Collaborator>;
  /** Callback when cursor position is calculated for rendering */
  onCursorRender?: (
    collaboratorId: string,
    coords: { top: number; left: number }
  ) => void;
}

export const CollaborationCursorPluginKey = new PluginKey('collaborationCursor');

export const CollaborationCursorExtension = Extension.create<CollaborationCursorOptions>({
  name: 'collaborationCursor',

  addOptions() {
    return {
      cursors: new Map(),
      collaborators: new Map(),
      onCursorRender: undefined,
    };
  },

  addProseMirrorPlugins() {
    const { cursors, collaborators } = this.options;

    return [
      new Plugin({
        key: CollaborationCursorPluginKey,
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, _oldState) {
            // Build decorations for each cursor
            const decorations: Decoration[] = [];

            cursors.forEach((cursor, collaboratorId) => {
              const collaborator = collaborators.get(collaboratorId);
              if (!collaborator) return;

              const pos = cursor.position;
              if (pos < 0 || pos > tr.doc.content.size) return;

              // Create a widget decoration for the cursor
              const cursorWidget = Decoration.widget(
                pos,
                () => {
                  const span = document.createElement('span');
                  span.className = 'collaboration-cursor';
                  span.setAttribute('data-collaborator-id', collaboratorId);
                  span.setAttribute('data-collaborator-name', collaborator.name);
                  span.style.setProperty('--cursor-color', collaborator.color);

                  // Cursor line
                  const line = document.createElement('span');
                  line.className = 'collaboration-cursor-line';
                  line.style.backgroundColor = collaborator.color;
                  span.appendChild(line);

                  // Label
                  const label = document.createElement('span');
                  label.className = 'collaboration-cursor-label';
                  label.style.backgroundColor = collaborator.color;

                  if (collaborator.isAI) {
                    const aiIcon = document.createElement('span');
                    aiIcon.className = 'collaboration-cursor-ai-icon';
                    aiIcon.textContent = '✨';
                    label.appendChild(aiIcon);
                  }

                  const name = document.createElement('span');
                  name.className = 'collaboration-cursor-name';
                  name.textContent = collaborator.name;
                  label.appendChild(name);

                  // Typing indicator
                  if (collaborator.status === 'typing') {
                    const typing = document.createElement('span');
                    typing.className = 'collaboration-cursor-typing';
                    for (let i = 0; i < 3; i++) {
                      const dot = document.createElement('span');
                      dot.className = 'collaboration-cursor-dot';
                      typing.appendChild(dot);
                    }
                    label.appendChild(typing);
                  }

                  span.appendChild(label);
                  return span;
                },
                {
                  side: 1, // Cursor appears after the position
                  key: `cursor-${collaboratorId}`,
                }
              );

              decorations.push(cursorWidget);

              // If there's a selection, add a highlight decoration
              if (
                cursor.selectionAnchor !== undefined &&
                cursor.selectionHead !== undefined &&
                cursor.selectionAnchor !== cursor.selectionHead
              ) {
                const from = Math.min(cursor.selectionAnchor, cursor.selectionHead);
                const to = Math.max(cursor.selectionAnchor, cursor.selectionHead);

                if (from >= 0 && to <= tr.doc.content.size) {
                  const selectionDecoration = Decoration.inline(from, to, {
                    class: 'collaboration-selection',
                    style: `background-color: ${collaborator.color}33;`, // 20% opacity
                  });
                  decorations.push(selectionDecoration);
                }
              }
            });

            return DecorationSet.create(tr.doc, decorations);
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },
});

export default CollaborationCursorExtension;
