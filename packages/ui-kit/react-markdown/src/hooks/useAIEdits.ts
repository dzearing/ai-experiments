/**
 * useAIEdits hook
 *
 * Manages AI-generated edits for co-authoring functionality.
 * Works with the TipTap editor to apply programmatic changes.
 */

import { useState, useCallback } from 'react';
import type { Editor } from '@tiptap/react';
import type { AIEdit, EditBatch, AIEditState, ConflictReport } from '../types/aiEdit';

export interface UseAIEditsReturn extends AIEditState {
  /** Apply a single edit */
  applyEdit: (edit: AIEdit) => Promise<boolean>;
  /** Apply a batch of edits */
  applyEditBatch: (batch: EditBatch) => Promise<boolean>;
  /** Cancel current edit operation */
  cancelEdit: () => void;
  /** Check for conflicts in edit batch */
  detectConflicts: (edits: AIEdit[]) => ConflictReport;
}

export function useAIEdits(editor: Editor | null): UseAIEditsReturn {
  const [isApplying, setIsApplying] = useState(false);
  const [currentEdit, setCurrentEdit] = useState<AIEdit | null>(null);
  const [progress, setProgress] = useState(0);

  // Detect conflicts between edits
  const detectConflicts = useCallback((edits: AIEdit[]): ConflictReport => {
    const conflicts: ConflictReport['conflicts'] = [];

    // Sort edits by position (we need to resolve positions first for proper comparison)
    // For now, simple line-based conflict detection
    const sortedEdits = [...edits].sort((a, b) => {
      const aStart = a.target.lineStart ?? a.target.position?.from ?? 0;
      const bStart = b.target.lineStart ?? b.target.position?.from ?? 0;
      return aStart - bStart;
    });

    for (let i = 0; i < sortedEdits.length - 1; i++) {
      const current = sortedEdits[i];
      const next = sortedEdits[i + 1];

      const currentEnd = current.target.lineEnd ?? current.target.position?.to ??
        (current.target.lineStart ?? current.target.position?.from ?? 0);
      const nextStart = next.target.lineStart ?? next.target.position?.from ?? 0;

      if (currentEnd > nextStart) {
        conflicts.push({
          editA: current,
          editB: next,
          type: 'overlap',
        });
      }
    }

    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
      resolution: conflicts.length > 0 ? 'sequential' : 'merge',
    };
  }, []);

  // Apply a single edit
  const applyEdit = useCallback(async (edit: AIEdit): Promise<boolean> => {
    if (!editor) return false;

    setIsApplying(true);
    setCurrentEdit(edit);

    try {
      const { type, target, content, marks } = edit;

      // Resolve target to document position
      let from: number;
      let to: number;

      if (target.position) {
        from = target.position.from;
        to = target.position.to;
      } else if (target.lineStart !== undefined) {
        // TODO: Implement line-to-position conversion using LineNumberExtension
        // For now, use approximate calculation
        const doc = editor.state.doc;
        let currentLine = 1;
        let lineFrom = 0;
        let lineTo = doc.content.size;

        doc.descendants((node, pos) => {
          if (node.isBlock) {
            if (currentLine === target.lineStart) {
              lineFrom = pos;
            }
            if (currentLine === (target.lineEnd ?? target.lineStart)) {
              lineTo = pos + node.nodeSize;
              return false;
            }
            currentLine++;
          }
        });

        from = lineFrom;
        to = lineTo;
      } else if (target.selector) {
        // TODO: Implement selector-based targeting
        console.warn('Selector-based targeting not yet implemented');
        return false;
      } else {
        console.error('Invalid edit target');
        return false;
      }

      // Apply the edit based on type
      switch (type) {
        case 'insert':
          if (content) {
            editor.chain().focus().insertContentAt(from, content).run();
          }
          break;

        case 'replace':
          if (content) {
            editor
              .chain()
              .focus()
              .deleteRange({ from, to })
              .insertContentAt(from, content)
              .run();
          }
          break;

        case 'delete':
          editor.chain().focus().deleteRange({ from, to }).run();
          break;

        case 'format':
          if (marks && marks.length > 0) {
            editor.chain().focus().setTextSelection({ from, to });
            for (const mark of marks) {
              const markType = editor.schema.marks[mark];
              if (markType) {
                editor.chain().focus().setMark(mark).run();
              }
            }
          }
          break;
      }

      return true;
    } catch (error) {
      console.error('Failed to apply edit:', error);
      return false;
    } finally {
      setIsApplying(false);
      setCurrentEdit(null);
    }
  }, [editor]);

  // Apply a batch of edits
  const applyEditBatch = useCallback(async (batch: EditBatch): Promise<boolean> => {
    if (!editor) return false;

    const { edits, animate = false, animationDuration = 500 } = batch;

    // Check for conflicts
    const conflictReport = detectConflicts(edits);
    if (conflictReport.hasConflicts) {
      console.warn('Edit conflicts detected:', conflictReport.conflicts);
      // Continue with sequential application
    }

    // Sort edits from end to start (to maintain positions)
    const sortedEdits = [...edits].sort((a, b) => {
      const aStart = a.target.lineStart ?? a.target.position?.from ?? 0;
      const bStart = b.target.lineStart ?? b.target.position?.from ?? 0;
      return bStart - aStart; // Reverse order
    });

    setIsApplying(true);
    setProgress(0);

    try {
      for (let i = 0; i < sortedEdits.length; i++) {
        const edit = sortedEdits[i];
        setCurrentEdit(edit);
        setProgress((i + 1) / sortedEdits.length);

        const success = await applyEdit(edit);
        if (!success) {
          console.warn(`Edit ${i + 1} failed, continuing with batch`);
        }

        // Add delay between edits if animating
        if (animate && i < sortedEdits.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, animationDuration));
        }
      }

      return true;
    } finally {
      setIsApplying(false);
      setCurrentEdit(null);
      setProgress(0);
    }
  }, [editor, applyEdit, detectConflicts]);

  // Cancel current edit operation
  const cancelEdit = useCallback(() => {
    setIsApplying(false);
    setCurrentEdit(null);
    setProgress(0);
  }, []);

  return {
    isApplying,
    currentEdit,
    progress,
    applyEdit,
    applyEditBatch,
    cancelEdit,
    detectConflicts,
  };
}

export default useAIEdits;
