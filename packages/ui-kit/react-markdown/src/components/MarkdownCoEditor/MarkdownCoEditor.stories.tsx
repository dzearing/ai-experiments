import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { useState, useEffect, useRef } from 'react';
import { MarkdownCoEditor, type MarkdownCoEditorRef, type ViewMode, type CoAuthor } from './MarkdownCoEditor';

const meta: Meta<typeof MarkdownCoEditor> = {
  title: 'Markdown/MarkdownCoEditor',
  component: MarkdownCoEditor,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Full-featured markdown co-editor with edit/preview/split modes.

## When to Use

- **Document editing**: Collaborative markdown document creation
- **Real-time preview**: Side-by-side editing with live preview
- **AI-assisted writing**: Co-authoring with AI cursor visibility

## View Modes

| Mode | Description |
|------|-------------|
| \`edit\` | Plain text markdown editing |
| \`preview\` | Rendered markdown output only |
| \`split\` | Side-by-side editor and preview |

## Features

- **Mode switching**: Toggle between edit/preview/split views
- **Co-authoring**: Remote cursor visibility with labels
- **Resizable split**: Drag to resize split panes
- **Line numbers**: Optional gutter with line numbers
- **Streaming mode**: Optimized for AI-generated content

## Usage

\`\`\`tsx
import { MarkdownCoEditor } from '@ui-kit/react-markdown';

<MarkdownCoEditor
  defaultValue="# Hello"
  defaultMode="split"
  onChange={(markdown) => console.log(markdown)}
/>
\`\`\`
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh', padding: '16px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    onChange: fn(),
    onModeChange: fn(),
    onSelectionChange: fn(),
    onEditorReady: undefined,
  },
  argTypes: {
    defaultMode: {
      control: 'select',
      options: ['edit', 'preview', 'split'],
      description: 'Initial view mode for the editor',
    },
    splitOrientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'Orientation of split panes in split mode',
    },
    showModeSwitch: {
      control: 'boolean',
      description: 'Show the edit/preview/split mode switcher',
    },
    showLineNumbers: {
      control: 'boolean',
      description: 'Show line numbers in the editor gutter',
    },
    readOnly: {
      control: 'boolean',
      description: 'Make the editor read-only',
    },
    streaming: {
      control: 'boolean',
      description: 'Enable streaming mode for AI-generated content',
    },
    onEditorReady: {
      table: { disable: true },
    },
    onChange: {
      table: { disable: true },
    },
    onModeChange: {
      table: { disable: true },
    },
    onSelectionChange: {
      table: { disable: true },
    },
  },
};

export default meta;
type Story = StoryObj<typeof MarkdownCoEditor>;

const sampleMarkdown = `# Welcome to MarkdownCoEditor

This is a **plain text markdown editor** with preview.

## Features

- **Edit mode**: Write raw markdown text
- **Preview mode**: See the rendered output
- **Split mode**: Side-by-side editing and preview

### Code Example

\`\`\`typescript
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

console.log(greet('World'));
\`\`\`

### Lists

1. First item
2. Second item
3. Third item

- Unordered item
- Another item

> This is a blockquote. It can contain **formatted text** and even \`inline code\`.

---

Learn more at [example.com](https://example.com).
`;

export const Default: Story = {
  args: {
    defaultValue: sampleMarkdown,
    defaultMode: 'edit',
  },
  parameters: {
    docs: {
      description: {
        story: 'Default edit mode with plain text markdown editing.',
      },
    },
  },
};

export const PreviewMode: Story = {
  args: {
    defaultValue: sampleMarkdown,
    defaultMode: 'preview',
  },
  parameters: {
    docs: {
      description: {
        story: 'Preview mode shows the rendered markdown output only.',
      },
    },
  },
};

export const SplitMode: Story = {
  args: {
    defaultValue: sampleMarkdown,
    defaultMode: 'split',
  },
  parameters: {
    docs: {
      description: {
        story: 'Split mode shows editor and preview side-by-side horizontally.',
      },
    },
  },
};

export const SplitVertical: Story = {
  args: {
    defaultValue: sampleMarkdown,
    defaultMode: 'split',
    splitOrientation: 'vertical',
  },
  parameters: {
    docs: {
      description: {
        story: 'Vertical split mode stacks editor and preview top-to-bottom.',
      },
    },
  },
};

export const WithoutModeSwitch: Story = {
  args: {
    defaultValue: sampleMarkdown,
    defaultMode: 'split',
    showModeSwitch: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Hide the mode switcher to lock users into a specific view mode.',
      },
    },
  },
};

export const WithoutLineNumbers: Story = {
  args: {
    defaultValue: sampleMarkdown,
    defaultMode: 'edit',
    showLineNumbers: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Editor without line numbers for a cleaner appearance.',
      },
    },
  },
};

export const ReadOnly: Story = {
  args: {
    defaultValue: sampleMarkdown,
    defaultMode: 'preview',
    readOnly: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Read-only mode prevents editing, useful for display-only scenarios.',
      },
    },
  },
};

export const Empty: Story = {
  args: {
    defaultValue: '',
    placeholder: 'Start writing your markdown here...',
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty editor with placeholder text.',
      },
    },
  },
};

export const Controlled: Story = {
  render: () => {
    const [markdown, setMarkdown] = useState(sampleMarkdown);
    const [mode, setMode] = useState<ViewMode>('split');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '8px' }}>
          <span>Current mode: <strong>{mode}</strong></span>
          <span>Character count: <strong>{markdown.length}</strong></span>
        </div>
        <MarkdownCoEditor
          value={markdown}
          onChange={setMarkdown}
          mode={mode}
          onModeChange={setMode}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Use `value` and `onChange` props for controlled state management. Mode can also be controlled via `mode` and `onModeChange`.',
      },
    },
  },
};

// Random human names for co-authors
const HUMAN_NAMES = [
  'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason',
  'Isabella', 'William', 'Mia', 'James', 'Charlotte', 'Oliver', 'Amelia',
  'Benjamin', 'Harper', 'Elijah', 'Evelyn', 'Lucas', 'Abigail', 'Henry',
  'Emily', 'Alexander', 'Elizabeth', 'Michael', 'Sofia', 'Daniel', 'Avery',
];

// Random words for generating content
const RANDOM_WORDS = [
  'quickly', 'slowly', 'carefully', 'boldly', 'quietly', 'loudly', 'gently',
  'running', 'jumping', 'walking', 'thinking', 'writing', 'reading', 'coding',
  'beautiful', 'amazing', 'wonderful', 'excellent', 'fantastic', 'incredible',
  'the', 'a', 'an', 'some', 'many', 'few', 'several', 'each', 'every',
  'project', 'document', 'system', 'process', 'workflow', 'method', 'approach',
  'team', 'group', 'organization', 'department', 'company', 'business',
  'develop', 'create', 'build', 'design', 'implement', 'deploy', 'test',
  'important', 'critical', 'essential', 'necessary', 'valuable', 'useful',
];

const COLORS = ['#8b5cf6', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#22c55e', '#14b8a6', '#f97316'];

// Helper functions for random content generation
const randomWords = (count: number): string => {
  const words: string[] = [];
  for (let i = 0; i < count; i++) {
    words.push(RANDOM_WORDS[Math.floor(Math.random() * RANDOM_WORDS.length)]);
  }
  return words.join(' ');
};

const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Co-authoring simulation with visible cursors - uses the applyRemoteUpdate API
const CoAuthoringStory = () => {
  const coEditorRef = useRef<MarkdownCoEditorRef>(null);
  const [activeCoAuthors, setActiveCoAuthors] = useState<Array<{ id: string; name: string; color: string }>>([]);
  const agentTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const agentCountRef = useRef(0);
  const usedNamesRef = useRef<Set<string>>(new Set());

  // Use uncontrolled mode - let CodeMirror be the source of truth
  const initialMarkdown = `# Collaborative Editing Demo

This document demonstrates multiple co-authors editing simultaneously.

Each co-author performs random editing actions every 5 seconds.

## Introduction

Welcome to the collaborative editing demonstration. This system allows multiple users to edit the same document in real-time.

## Features

The editor supports real-time cursor tracking and position mapping. All edits are applied atomically to prevent conflicts.

## Getting Started

To begin collaborating, simply add co-authors using the button above. Each co-author will perform random editing actions.

## Conclusion

This demonstrates how the applyRemoteUpdate API handles concurrent edits from multiple sources.
`;

  // CoAuthors state for rendering
  const [coAuthors, setCoAuthors] = useState<CoAuthor[]>([]);

  // Handle coAuthor position updates from the editor
  const handleCoAuthorsChange = (updatedCoAuthors: CoAuthor[]) => {
    setCoAuthors(updatedCoAuthors);
  };

  // Get the inner MarkdownEditor ref
  const getEditor = () => coEditorRef.current?.getEditor();

  // Get a random unused name
  const getRandomName = (): string => {
    const availableNames = HUMAN_NAMES.filter(n => !usedNamesRef.current.has(n));
    if (availableNames.length === 0) {
      return `User ${agentCountRef.current + 1}`;
    }
    const name = availableNames[Math.floor(Math.random() * availableNames.length)];
    usedNamesRef.current.add(name);
    return name;
  };

  // Find word boundaries in text
  const findWords = (text: string): Array<{ start: number; end: number; word: string }> => {
    const words: Array<{ start: number; end: number; word: string }> = [];
    const regex = /\b\w+\b/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      words.push({ start: match.index, end: match.index + match[0].length, word: match[0] });
    }
    return words;
  };

  // Find headers in text
  const findHeaders = (text: string): Array<{ start: number; end: number; level: number; lineEnd: number }> => {
    const headers: Array<{ start: number; end: number; level: number; lineEnd: number }> = [];
    const lines = text.split('\n');
    let pos = 0;
    for (const line of lines) {
      const match = line.match(/^(#{1,6})\s+/);
      if (match) {
        headers.push({
          start: pos,
          end: pos + line.length,
          level: match[1].length,
          lineEnd: pos + line.length,
        });
      }
      pos += line.length + 1;
    }
    return headers;
  };

  // Find paragraphs (non-header, non-empty lines)
  const findParagraphs = (text: string): Array<{ start: number; end: number }> => {
    const paragraphs: Array<{ start: number; end: number }> = [];
    const lines = text.split('\n');
    let pos = 0;
    for (const line of lines) {
      if (line.trim() && !line.startsWith('#')) {
        paragraphs.push({ start: pos, end: pos + line.length });
      }
      pos += line.length + 1;
    }
    return paragraphs;
  };

  // Stream text character by character like a human typing
  const streamText = (
    agentId: string,
    _startPos: number,
    text: string,
    onComplete: () => void
  ) => {
    let charIndex = 0;

    const typeNextChar = () => {
      const editor = getEditor();
      if (!editor || !agentTimersRef.current.has(agentId)) {
        return;
      }

      if (charIndex >= text.length) {
        onComplete();
        return;
      }

      const char = text[charIndex];
      charIndex++;

      const currentPositions = editor.getCoAuthors();
      const agent = currentPositions.find(a => a.id === agentId);
      if (!agent) return;

      const pos = agent.selectionStart;

      const updatedCoAuthors = currentPositions.map(a => {
        if (a.id === agentId) {
          return { ...a, selectionStart: pos + 1, selectionEnd: pos + 1 };
        }
        let newStart = a.selectionStart;
        let newEnd = a.selectionEnd;
        if (a.selectionStart >= pos) {
          newStart = a.selectionStart + 1;
        }
        if (a.selectionEnd >= pos) {
          newEnd = a.selectionEnd + 1;
        }
        return { ...a, selectionStart: newStart, selectionEnd: newEnd };
      });

      editor.applyRemoteUpdate(
        [{ from: pos, to: pos, insert: char }],
        updatedCoAuthors
      );

      const timerId = setTimeout(typeNextChar, 30 + Math.random() * 50);
      agentTimersRef.current.set(agentId, timerId);
    };

    typeNextChar();
  };

  // Delete text by growing a selection, then deleting it all at once
  const streamDelete = (
    agentId: string,
    _deleteStart: number,
    deleteLength: number,
    onComplete: () => void
  ) => {
    let selectionGrown = 0;

    const growSelection = () => {
      const editor = getEditor();
      if (!editor || !agentTimersRef.current.has(agentId)) {
        return;
      }

      const currentPositions = editor.getCoAuthors();
      const agent = currentPositions.find(a => a.id === agentId);
      if (!agent) return;

      if (selectionGrown >= deleteLength) {
        const timerId = setTimeout(() => {
          const ed = getEditor();
          if (!ed || !agentTimersRef.current.has(agentId)) return;

          const currentPos = ed.getCoAuthors();
          const currentAgent = currentPos.find(a => a.id === agentId);
          if (!currentAgent) return;

          const start = currentAgent.selectionStart;
          const end = currentAgent.selectionEnd;

          if (start >= end) {
            onComplete();
            return;
          }

          const delLen = end - start;
          const updatedCoAuthors = currentPos.map(a => {
            if (a.id === agentId) {
              return { ...a, selectionStart: start, selectionEnd: start };
            }
            let newStart = a.selectionStart;
            let newEnd = a.selectionEnd;
            if (a.selectionStart > end) {
              newStart = a.selectionStart - delLen;
            } else if (a.selectionStart > start) {
              newStart = start;
            }
            if (a.selectionEnd > end) {
              newEnd = a.selectionEnd - delLen;
            } else if (a.selectionEnd > start) {
              newEnd = start;
            }
            return { ...a, selectionStart: newStart, selectionEnd: newEnd };
          });

          ed.applyRemoteUpdate(
            [{ from: start, to: end, insert: '' }],
            updatedCoAuthors
          );

          onComplete();
        }, 200 + Math.random() * 200);
        agentTimersRef.current.set(agentId, timerId);
        return;
      }

      selectionGrown++;

      const newEnd = agent.selectionEnd + 1;

      const updatedCoAuthors = currentPositions.map(a => {
        if (a.id === agentId) {
          return { ...a, selectionEnd: newEnd };
        }
        return a;
      });

      editor.updateCoAuthors(updatedCoAuthors);

      const timerId = setTimeout(growSelection, 30 + Math.random() * 30);
      agentTimersRef.current.set(agentId, timerId);
    };

    growSelection();
  };

  // Perform a random editing action with streaming
  const performRandomAction = (agentId: string, onComplete: () => void) => {
    const editor = getEditor();
    if (!editor) {
      onComplete();
      return;
    }

    const doc = editor.getMarkdown();
    const currentPositions = editor.getCoAuthors();
    const agent = currentPositions.find(a => a.id === agentId);
    if (!agent) {
      onComplete();
      return;
    }

    const action = randomInt(1, 5);

    try {
      switch (action) {
        case 1: {
          const paragraphs = findParagraphs(doc);
          if (paragraphs.length === 0) {
            onComplete();
            break;
          }

          const para = paragraphs[randomInt(0, paragraphs.length - 1)];
          const paraText = doc.slice(para.start, para.end);
          const words = findWords(paraText);

          if (words.length >= 2) {
            const startIdx = randomInt(0, words.length - 2);
            const selectStart = para.start + words[startIdx].start;
            const selectEnd = para.start + words[startIdx + 1].end;
            const replacement = randomWords(3);
            const deleteLen = selectEnd - selectStart;

            const updatedCoAuthors = currentPositions.map(a => {
              if (a.id === agentId) {
                return { ...a, selectionStart: selectStart, selectionEnd: selectStart };
              }
              return a;
            });
            editor.updateCoAuthors(updatedCoAuthors);
            setCoAuthors(updatedCoAuthors);

            streamDelete(agentId, selectStart, deleteLen, () => {
              streamText(agentId, selectStart, replacement, onComplete);
            });
          } else {
            onComplete();
          }
          break;
        }

        case 2: {
          const words = findWords(doc);
          if (words.length === 0) {
            onComplete();
            break;
          }

          const word = words[randomInt(0, words.length - 1)];
          const insertPos = word.start;
          const textToInsert = randomWords(3) + ' ';

          const updatedCoAuthors = currentPositions.map(a => {
            if (a.id === agentId) {
              return { ...a, selectionStart: insertPos, selectionEnd: insertPos };
            }
            return a;
          });
          editor.updateCoAuthors(updatedCoAuthors);
          setCoAuthors(updatedCoAuthors);

          streamText(agentId, insertPos, textToInsert, onComplete);
          break;
        }

        case 3: {
          const paragraphs = findParagraphs(doc);
          if (paragraphs.length === 0) {
            onComplete();
            break;
          }

          const para = paragraphs[randomInt(0, paragraphs.length - 1)];
          const paraText = doc.slice(para.start, para.end);
          const words = findWords(paraText);

          if (words.length >= 1) {
            const numWords = Math.min(randomInt(1, 4), words.length);
            const startIdx = randomInt(0, words.length - numWords);
            const deleteStart = para.start + words[startIdx].start;
            const deleteEnd = para.start + words[startIdx + numWords - 1].end;
            const actualEnd = doc[deleteEnd] === ' ' ? deleteEnd + 1 : deleteEnd;
            const deleteLen = actualEnd - deleteStart;

            const updatedCoAuthors = currentPositions.map(a => {
              if (a.id === agentId) {
                return { ...a, selectionStart: deleteStart, selectionEnd: deleteStart };
              }
              return a;
            });
            editor.updateCoAuthors(updatedCoAuthors);
            setCoAuthors(updatedCoAuthors);

            streamDelete(agentId, deleteStart, deleteLen, onComplete);
          } else {
            onComplete();
          }
          break;
        }

        case 4: {
          const headers = findHeaders(doc).filter(h => h.level === 2);
          if (headers.length === 0) {
            onComplete();
            break;
          }

          const header = headers[randomInt(0, headers.length - 1)];
          const newHeader = `## ${randomWords(randomInt(3, 5))}`;
          const newContent = `${randomWords(5)}.`;
          const textToInsert = `${newHeader}\n\n${newContent}\n\n`;
          const insertPos = header.start;

          const updatedCoAuthors = currentPositions.map(a => {
            if (a.id === agentId) {
              return { ...a, selectionStart: insertPos, selectionEnd: insertPos };
            }
            return a;
          });
          editor.updateCoAuthors(updatedCoAuthors);
          setCoAuthors(updatedCoAuthors);

          streamText(agentId, insertPos, textToInsert, onComplete);
          break;
        }

        case 5: {
          const headers = findHeaders(doc);
          if (headers.length <= 1) {
            onComplete();
            break;
          }

          const headerIdx = randomInt(1, headers.length - 1);
          const header = headers[headerIdx];
          const nextHeader = headers[headerIdx + 1];
          const deleteEnd = nextHeader ? nextHeader.start : doc.length;

          if (deleteEnd - header.start > doc.length / 2) {
            onComplete();
            break;
          }

          const deleteLen = deleteEnd - header.start;

          const updatedCoAuthors = currentPositions.map(a => {
            if (a.id === agentId) {
              return { ...a, selectionStart: header.start, selectionEnd: header.start };
            }
            return a;
          });
          editor.updateCoAuthors(updatedCoAuthors);
          setCoAuthors(updatedCoAuthors);

          streamDelete(agentId, header.start, deleteLen, onComplete);
          break;
        }

        default:
          onComplete();
      }
    } catch (e) {
      console.warn(`Agent ${agentId} action ${action} failed:`, e);
      onComplete();
    }
  };

  // Start the action loop for an agent
  const startAgentLoop = (agentId: string) => {
    const scheduleNextAction = () => {
      if (!agentTimersRef.current.has(agentId)) return;

      const timerId = setTimeout(() => {
        if (!agentTimersRef.current.has(agentId)) return;
        performRandomAction(agentId, scheduleNextAction);
      }, 5000);
      agentTimersRef.current.set(agentId, timerId);
    };

    const timerId = setTimeout(() => {
      if (!agentTimersRef.current.has(agentId)) return;
      performRandomAction(agentId, scheduleNextAction);
    }, 500);
    agentTimersRef.current.set(agentId, timerId);
  };

  // Add a new co-author
  const addCoAuthor = () => {
    const editor = getEditor();
    if (!editor) return;

    agentCountRef.current += 1;
    const agentId = `coauthor-${agentCountRef.current}`;
    const name = getRandomName();
    const color = COLORS[(agentCountRef.current - 1) % COLORS.length];

    const doc = editor.getMarkdown();
    const insertPos = Math.floor(Math.random() * (doc.length - 10)) + 5;

    const newAgent: CoAuthor = {
      id: agentId,
      name,
      color,
      isAI: false,
      selectionStart: insertPos,
      selectionEnd: insertPos,
    };

    const currentCoAuthors = editor.getCoAuthors();
    editor.updateCoAuthors([...currentCoAuthors, newAgent]);
    setCoAuthors(prev => [...prev, newAgent]);
    setActiveCoAuthors(prev => [...prev, { id: agentId, name, color }]);

    startAgentLoop(agentId);
  };

  // Remove a co-author
  const removeCoAuthor = (agentId: string) => {
    const timerId = agentTimersRef.current.get(agentId);
    if (timerId) {
      clearTimeout(timerId);
      agentTimersRef.current.delete(agentId);
    }

    const editor = getEditor();
    if (editor) {
      const currentCoAuthors = editor.getCoAuthors();
      const filtered = currentCoAuthors.filter(a => a.id !== agentId);
      editor.updateCoAuthors(filtered);
      setCoAuthors(filtered);
    }

    setActiveCoAuthors(prev => {
      const agent = prev.find(a => a.id === agentId);
      if (agent) {
        usedNamesRef.current.delete(agent.name);
      }
      return prev.filter(a => a.id !== agentId);
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      agentTimersRef.current.forEach((timerId) => {
        clearTimeout(timerId);
      });
      agentTimersRef.current.clear();
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <button
          onClick={addCoAuthor}
          style={{
            padding: '8px 16px',
            cursor: 'pointer',
            backgroundColor: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontWeight: 500,
          }}
        >
          + Add Co-author
        </button>
        <span style={{ fontSize: '14px', color: 'var(--color-body-textSoft10)' }}>
          Each co-author performs random edits every 5 seconds
        </span>
      </div>

      {activeCoAuthors.length > 0 && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          padding: '12px',
          backgroundColor: 'var(--color-inset-background, #f5f5f5)',
          borderRadius: '8px',
          border: '1px solid var(--color-inset-border, #e0e0e0)',
        }}>
          {activeCoAuthors.map(agent => (
            <div
              key={agent.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 8px 4px 12px',
                backgroundColor: 'var(--color-panel-background, white)',
                borderRadius: '16px',
                border: `2px solid ${agent.color}`,
                fontSize: '13px',
              }}
            >
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: agent.color,
              }} />
              <span style={{ fontWeight: 500 }}>{agent.name}</span>
              <button
                onClick={() => removeCoAuthor(agent.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '20px',
                  height: '20px',
                  padding: 0,
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: 'var(--color-body-textSoft20, #999)',
                }}
                title={`Remove ${agent.name}`}
              >
                x
              </button>
            </div>
          ))}
        </div>
      )}

      <MarkdownCoEditor
        ref={coEditorRef}
        defaultValue={initialMarkdown}
        defaultMode="edit"
        coAuthors={coAuthors}
        onCoAuthorsChange={handleCoAuthorsChange}
        showLineNumbers
      />
    </div>
  );
};

export const CoAuthoringWithCursors: Story = {
  render: () => <CoAuthoringStory />,
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates multiple co-authors editing simultaneously using the applyRemoteUpdate API. Click "Add Co-author" to spawn agents that type at random locations.',
      },
    },
  },
};
