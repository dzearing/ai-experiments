import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { useRef, useState } from 'react';
import { MarkdownCoEditor, type MarkdownCoEditorRef } from './MarkdownCoEditor';
import type { Collaborator } from '../../types/collaborator';
import { getCollaboratorColor } from '../../types/collaborator';

const meta = {
  title: 'Components/MarkdownCoEditor',
  component: MarkdownCoEditor,
  tags: ['autodocs'],
  args: {
    onChange: fn(),
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
A split-pane collaborative markdown editor inspired by HackMD.

## Features
- **Left pane**: Raw markdown text editing with collaborator cursors
- **Right pane**: Live rendered preview
- **Simple collaboration**: Cursors are just character offsets in plain text
- **Streaming edits**: AI agents can type character-by-character
- **No WYSIWYG complexity**: Markdown syntax like \`##\` just works

## Usage
\`\`\`tsx
import { MarkdownCoEditor, type MarkdownCoEditorRef } from '@ui-kit/react-markdown';

const editorRef = useRef<MarkdownCoEditorRef>(null);

// Add a collaborator
editorRef.current?.addCollaborator({
  id: 'ai-1',
  name: 'Claude',
  color: '#E91E63',
  isAI: true,
  status: 'idle',
});

// Stream an edit at end of document
const markdown = editorRef.current?.getMarkdown() || '';
editorRef.current?.streamEdit({
  collaboratorId: 'ai-1',
  type: 'insert',
  position: markdown.length,
  content: '\\n\\n## New Section\\n\\nHello from Claude!',
  stream: true,
  streamSpeed: 25,
});
\`\`\`
        `,
      },
    },
  },
} satisfies Meta<typeof MarkdownCoEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

// Interactive demo with controls - defined first so it can be used by Default
const InteractiveDemo = () => {
  const editorRef = useRef<MarkdownCoEditorRef>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const nextColorIndex = useRef(0);
  const cursorAnimationRef = useRef<NodeJS.Timeout | null>(null);

  const addHumanCollaborator = () => {
    if (!editorRef.current) return;
    const names = ['Alice', 'Bob', 'Carol', 'Dave', 'Eve'];
    const name = names[collaborators.length % names.length];
    const collaborator: Collaborator = {
      id: `user-${Date.now()}`,
      name,
      color: getCollaboratorColor(nextColorIndex.current++),
      isAI: false,
      status: 'idle',
    };
    editorRef.current.addCollaborator(collaborator);
    setCollaborators((prev) => [...prev, collaborator]);

    // Helper to get lines with their word ranges
    const getLinesWithWords = () => {
      const markdown = editorRef.current?.getMarkdown() || '';
      const lines: { lineStart: number; words: { start: number; end: number }[] }[] = [];

      // Split into lines, tracking positions
      let pos = 0;
      const lineTexts = markdown.split('\n');

      for (const lineText of lineTexts) {
        const lineStart = pos;
        const words: { start: number; end: number }[] = [];

        // Find words in this line
        let wordStart = -1;
        for (let i = 0; i <= lineText.length; i++) {
          const isWordChar = i < lineText.length && /\S/.test(lineText[i]);

          if (isWordChar && wordStart === -1) {
            wordStart = lineStart + i;
          } else if (!isWordChar && wordStart !== -1) {
            words.push({ start: wordStart, end: lineStart + i });
            wordStart = -1;
          }
        }

        if (words.length > 0) {
          lines.push({ lineStart, words });
        }

        pos += lineText.length + 1; // +1 for newline
      }

      return lines;
    };

    // Animate line by line - selection grows word by word, then pauses at end of line
    let currentLineIndex = 0;
    let currentWordInLine = 0;
    let isPausing = false;

    const animateReading = () => {
      if (!editorRef.current) return;

      // Recalculate lines and words from current document state
      const lines = getLinesWithWords();
      if (lines.length === 0) {
        cursorAnimationRef.current = setTimeout(animateReading, 400);
        return;
      }

      // Wrap line index if needed
      const lineIndex = currentLineIndex % lines.length;
      const line = lines[lineIndex];

      if (isPausing) {
        // Done pausing, move to next line
        isPausing = false;
        currentLineIndex++;
        currentWordInLine = 0;
        cursorAnimationRef.current = setTimeout(animateReading, 200);
        return;
      }

      if (currentWordInLine >= line.words.length) {
        // Reached end of line - pause as if reading/comprehending
        isPausing = true;
        cursorAnimationRef.current = setTimeout(animateReading, 800);
        return;
      }

      // Grow selection from line start to current word end
      const lineStart = line.words[0].start;
      const currentWordEnd = line.words[currentWordInLine].end;

      editorRef.current.setSelection(collaborator.id, lineStart, currentWordEnd);

      currentWordInLine++;

      // Continue animation - move to next word
      cursorAnimationRef.current = setTimeout(animateReading, 350);
    };

    // Start animation
    animateReading();
  };

  const addAICollaborator = () => {
    if (!editorRef.current) return;
    const names = ['Claude', 'GPT-4', 'Gemini', 'Copilot'];
    const aiCount = collaborators.filter((c) => c.isAI).length;
    const name = names[aiCount % names.length];
    const collaborator: Collaborator = {
      id: `ai-${Date.now()}`,
      name,
      color: getCollaboratorColor(nextColorIndex.current++),
      isAI: true,
      status: 'idle',
    };
    editorRef.current.addCollaborator(collaborator);
    setCollaborators((prev) => [...prev, collaborator]);

    // Have the AI add something
    const markdown = editorRef.current.getMarkdown();
    setTimeout(() => {
      editorRef.current?.streamEdit({
        collaboratorId: collaborator.id,
        type: 'insert',
        position: markdown.length,
        content: `\n\n**${name}**: Hello! Happy to collaborate!`,
        stream: true,
        streamSpeed: 25,
      });
    }, 300);
  };

  const removeCollaborator = (id: string) => {
    // Clear animation if this collaborator was animating
    if (cursorAnimationRef.current) {
      clearTimeout(cursorAnimationRef.current);
      cursorAnimationRef.current = null;
    }
    editorRef.current?.removeCollaborator(id);
    setCollaborators((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '16px', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
        <button
          onClick={addHumanCollaborator}
          style={{
            padding: '8px 16px',
            cursor: 'pointer',
            background: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontWeight: 500,
          }}
        >
          + Add Human
        </button>
        <button
          onClick={addAICollaborator}
          style={{
            padding: '8px 16px',
            cursor: 'pointer',
            background: '#E91E63',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontWeight: 500,
          }}
        >
          + Add AI Agent
        </button>
        {collaborators.length > 0 && (
          <span style={{ fontSize: '14px', color: '#666', marginLeft: '8px' }}>
            {collaborators.length} collaborator{collaborators.length !== 1 ? 's' : ''} active
          </span>
        )}
      </div>

      {collaborators.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {collaborators.map((c) => (
            <div
              key={c.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 8px',
                background: '#f5f5f5',
                borderRadius: '4px',
                fontSize: '13px',
              }}
            >
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: c.color,
                }}
              />
              <span>{c.isAI ? '✨ ' : ''}{c.name}</span>
              <button
                onClick={() => removeCollaborator(c.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  fontSize: '12px',
                  color: '#999',
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <MarkdownCoEditor
        ref={editorRef}
        value={`# Interactive Demo

Add collaborators using the buttons above!

- Human collaborators will have their cursors positioned in the document
- AI collaborators will automatically type a greeting

Try editing this text yourself while collaborators are active.`}
        height="100%"
        showPreview
      />
    </div>
  );
};

// Default story - uses the Interactive demo so users can add agents
export const Default: Story = {
  render: () => <InteractiveDemo />,
  parameters: {
    docs: {
      description: {
        story: 'The default interactive demo. Add human or AI collaborators using the buttons, and watch them edit the document in real-time.',
      },
    },
  },
};

// Multi-agent collaboration demo
const MultiAgentDemo = () => {
  const editorRef = useRef<MarkdownCoEditorRef>(null);
  const [isRunning, setIsRunning] = useState(false);

  const aiAgents: Collaborator[] = [
    {
      id: 'claude',
      name: 'Claude',
      color: getCollaboratorColor(0),
      isAI: true,
      status: 'idle',
    },
    {
      id: 'gpt',
      name: 'GPT-4',
      color: getCollaboratorColor(2),
      isAI: true,
      status: 'idle',
    },
    {
      id: 'gemini',
      name: 'Gemini',
      color: getCollaboratorColor(4),
      isAI: true,
      status: 'idle',
    },
  ];

  const startCollaboration = async () => {
    if (!editorRef.current || isRunning) return;
    setIsRunning(true);

    // Add all AI agents
    aiAgents.forEach((agent) => {
      editorRef.current?.addCollaborator(agent);
    });

    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    // Wait for React state to update with collaborators
    await wait(100);

    // Sequential edits - each agent types after the previous one finishes
    const edits = [
      {
        collaboratorId: 'claude',
        content: '\n\n## Claude\'s Section\n\nI specialize in thoughtful analysis and careful reasoning. Happy to help with complex problems!',
        streamSpeed: 18,
      },
      {
        collaboratorId: 'gpt',
        content: '\n\n## GPT-4\'s Analysis\n\nI bring broad knowledge and creative problem-solving to the team. Let\'s tackle this together!',
        streamSpeed: 18,
      },
      {
        collaboratorId: 'gemini',
        content: '\n\n## Gemini\'s Contribution\n\nI excel at multimodal understanding and code generation. Here to assist!',
        streamSpeed: 18,
      },
    ];

    // Run edits sequentially
    for (const edit of edits) {
      if (!editorRef.current) break;

      // Get current document end for positioning
      const markdown = editorRef.current.getMarkdown();
      const position = markdown.length;

      editorRef.current.streamEdit({
        collaboratorId: edit.collaboratorId,
        type: 'insert',
        position,
        content: edit.content,
        stream: true,
        streamSpeed: edit.streamSpeed,
      });

      // Wait for this agent to finish typing
      await wait(edit.content.length * edit.streamSpeed + 500);
    }

    // Remove collaborators after a brief pause
    await wait(1500);
    aiAgents.forEach((agent) => {
      editorRef.current?.removeCollaborator(agent.id);
    });
    setIsRunning(false);
  };

  const resetDemo = () => {
    if (!editorRef.current) return;
    aiAgents.forEach((agent) => {
      editorRef.current?.removeCollaborator(agent.id);
    });
    editorRef.current.setMarkdown(`# Multi-Agent Collaboration

Click "Start Collaboration" to watch three AI agents take turns adding their sections!

Each agent adds content below the previous one. Watch the markdown on the left and the preview on the right update in real-time.`);
    setIsRunning(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '16px', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
        <button
          onClick={startCollaboration}
          disabled={isRunning}
          style={{
            padding: '8px 16px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            opacity: isRunning ? 0.7 : 1,
            background: '#E91E63',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontWeight: 500,
          }}
        >
          {isRunning ? 'Agents Working...' : 'Start Collaboration'}
        </button>
        <button
          onClick={resetDemo}
          style={{
            padding: '8px 16px',
            cursor: 'pointer',
            background: '#f5f5f5',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}
        >
          Reset
        </button>
        <span style={{ fontSize: '14px', color: '#666' }}>
          Agents take turns adding sections to the document
        </span>
      </div>

      <MarkdownCoEditor
        ref={editorRef}
        value={`# Multi-Agent Collaboration

Click "Start Collaboration" to watch three AI agents take turns adding their sections!

Each agent adds content below the previous one. Watch the markdown on the left and the preview on the right update in real-time.`}
        height="100%"
        showPreview
      />
    </div>
  );
};

export const MultiAgentCollaboration: Story = {
  render: () => <MultiAgentDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Watch multiple AI agents sequentially add their sections. The key difference from WYSIWYG: markdown syntax like `##` naturally starts on new lines because we\'re editing plain text!',
      },
    },
  },
};

// Single agent typing demo
const SingleAgentDemo = () => {
  const editorRef = useRef<MarkdownCoEditorRef>(null);
  const [isTyping, setIsTyping] = useState(false);

  const startTyping = () => {
    if (!editorRef.current || isTyping) return;
    setIsTyping(true);

    // Clear the editor first
    editorRef.current.setMarkdown('');

    // Add Claude
    editorRef.current.addCollaborator({
      id: 'claude',
      name: 'Claude',
      color: '#E91E63',
      isAI: true,
      status: 'idle',
    });

    // Set initial cursor position
    editorRef.current.setCursorPosition('claude', 0);

    // Start typing after a short delay
    setTimeout(() => {
      const content = `# Hello from Claude!

I'm typing this message **character by character** in the markdown editor.

## Features I'm Demonstrating

- Real-time cursor tracking
- Streaming text insertion
- Live preview updates

\`\`\`typescript
const message = "This is so much simpler than WYSIWYG!";
console.log(message);
\`\`\`

> The key insight: by editing raw markdown text, we avoid all the complexity of rich text editing nodes.

That's it! Simple and effective.`;

      editorRef.current?.streamEdit({
        collaboratorId: 'claude',
        type: 'insert',
        position: 0,
        content,
        stream: true,
        streamSpeed: 20,
      });

      // Clean up after typing completes
      const typingDuration = content.length * 20 + 1000;
      setTimeout(() => {
        editorRef.current?.removeCollaborator('claude');
        setIsTyping(false);
      }, typingDuration);
    }, 500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '16px', boxSizing: 'border-box' }}>
      <button
        onClick={startTyping}
        disabled={isTyping}
        style={{
          padding: '8px 16px',
          cursor: isTyping ? 'not-allowed' : 'pointer',
          opacity: isTyping ? 0.7 : 1,
          alignSelf: 'flex-start',
          marginBottom: '16px',
          background: '#E91E63',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
        }}
      >
        {isTyping ? 'Claude is typing...' : 'Let Claude Type'}
      </button>

      <MarkdownCoEditor
        ref={editorRef}
        value=""
        placeholder="Click the button to see Claude start typing..."
        height="100%"
        showPreview
      />
    </div>
  );
};

export const SingleAgentTyping: Story = {
  render: () => <SingleAgentDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Watch a single AI agent type a complete markdown document. Notice how headings, code blocks, and formatting just work because we\'re editing plain text.',
      },
    },
  },
};

// Preview position demo
export const VerticalLayout: Story = {
  render: () => (
    <div style={{ height: '100vh', padding: '16px', boxSizing: 'border-box' }}>
      <MarkdownCoEditor
        value={`# Vertical Layout

The preview can be positioned **below** the editor instead of beside it.

This is useful for:
- Narrower screens
- Mobile devices
- When you want more horizontal space for editing

## Code Example

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`
`}
        height="100%"
        showPreview
        previewPosition="bottom"
      />
    </div>
  ),
};

// Editor only (no preview)
export const EditorOnly: Story = {
  render: () => (
    <div style={{ height: '100vh', padding: '16px', boxSizing: 'border-box' }}>
      <MarkdownCoEditor
        value={`# Editor Only Mode

When \`showPreview={false}\`, you get just the markdown editor.

This is useful for:
- Focused writing
- When preview isn't needed
- Embedding in other UIs
`}
        height="100%"
        showPreview={false}
      />
    </div>
  ),
};

// Renamed the export to avoid duplicate
export const Interactive: Story = {
  render: () => <InteractiveDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo where you can add and remove collaborators dynamically.',
      },
    },
  },
};
