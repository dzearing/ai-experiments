import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { useRef, useState, useEffect, useCallback } from 'react';
import {
  CollaborativeEditor,
  type CollaborativeEditorRef,
} from './CollaborativeEditor';
import type { Collaborator } from '../../types/collaborator';
import { getCollaboratorColor } from '../../types/collaborator';

const meta = {
  title: 'Components/CollaborativeEditor',
  component: CollaborativeEditor,
  tags: ['autodocs'],
  args: {
    onChange: fn(),
    onEditorReady: () => {},
  },
  parameters: {
    docs: {
      description: {
        component: `
A markdown editor with real-time collaboration support.

## Features
- Multiple virtual cursors with name labels
- Streaming text insertion (character-by-character)
- Non-disruptive editing (your cursor stays in place)
- Visual presence indicators
- AI agent support with special styling

## Usage
\`\`\`tsx
import { CollaborativeEditor, type CollaborativeEditorRef } from '@ui-kit/react-markdown';

const editorRef = useRef<CollaborativeEditorRef>(null);

// Add a collaborator
editorRef.current?.addCollaborator({
  id: 'ai-1',
  name: 'Claude',
  color: '#E91E63',
  isAI: true,
  status: 'idle',
});

// Stream an edit
editorRef.current?.streamEdit({
  collaboratorId: 'ai-1',
  type: 'insert',
  position: 10,
  content: 'Hello from Claude!',
  stream: true,
  streamSpeed: 30,
});
\`\`\`
        `,
      },
    },
  },
} satisfies Meta<typeof CollaborativeEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default story with interactive controls to add collaborators
const DefaultDemo = () => {
  const editorRef = useRef<CollaborativeEditorRef>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const nextColorIndex = useRef(0);

  const addHumanCollaborator = () => {
    if (!editorRef.current) return;
    const names = ['Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank'];
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

    // Position the new collaborator's cursor
    const editor = editorRef.current.getEditor();
    if (editor) {
      const pos = Math.min(20 + collaborators.length * 30, editor.state.doc.content.size - 1);
      editorRef.current.setCursorPosition(collaborator.id, pos);
    }
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

    // Position the AI cursor and have it type something
    const editor = editorRef.current.getEditor();
    if (editor) {
      const docSize = editor.state.doc.content.size;
      editorRef.current.setCursorPosition(collaborator.id, Math.max(1, docSize - 1));

      // Have the AI add a contribution
      setTimeout(() => {
        editorRef.current?.streamEdit({
          collaboratorId: collaborator.id,
          type: 'insert',
          position: Math.max(1, docSize - 1),
          content: `\n\n**${name}**: Hello! I'm here to help collaborate on this document.`,
          stream: true,
          streamSpeed: 25,
        });
      }, 500);
    }
  };

  const removeCollaborator = (id: string) => {
    editorRef.current?.removeCollaborator(id);
    setCollaborators((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
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
          ✨ Add AI Agent
        </button>
        {collaborators.length > 0 && (
          <span style={{ fontSize: '14px', color: '#666', marginLeft: '8px' }}>
            {collaborators.length} collaborator{collaborators.length !== 1 ? 's' : ''} active
          </span>
        )}
      </div>

      {collaborators.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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

      <CollaborativeEditor
        ref={editorRef}
        value={`# Collaborative Editor

Start typing here. Use the buttons above to add collaborators!

Each collaborator gets their own colored cursor. AI agents will automatically contribute when added.`}
        height="400px"
        showToolbar
      />
    </div>
  );
};

export const Default: Story = {
  render: () => <DefaultDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo where you can add human and AI collaborators to see real-time editing.',
      },
    },
  },
};

// Multi-agent collaboration demo - agents work sequentially to avoid conflicts
const MultiAgentDemo = () => {
  const editorRef = useRef<CollaborativeEditorRef>(null);
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

    // Add all AI agents (so their cursors are visible)
    aiAgents.forEach((agent) => {
      editorRef.current?.addCollaborator(agent);
    });

    // Wait helper
    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    // Sequential edits - each agent types after the previous one finishes
    // This avoids conflicts from concurrent streaming
    // Using slower speed to observe the typing behavior
    const edits = [
      {
        collaboratorId: 'claude',
        content: '\n\n## Claude\'s Section\n\nI specialize in thoughtful analysis and careful reasoning. Happy to help!',
        streamSpeed: 18,
      },
      {
        collaboratorId: 'gpt',
        content: '\n\n## GPT-4\'s Analysis\n\nI bring broad knowledge and creative problem-solving to the team!',
        streamSpeed: 18,
      },
      {
        collaboratorId: 'gemini',
        content: '\n\n## Gemini\'s Contribution\n\nI excel at multimodal understanding and code generation.',
        streamSpeed: 18,
      },
    ];

    // Run edits sequentially - each agent waits for the previous to finish
    for (const edit of edits) {
      if (!editorRef.current) break;

      // Get current document end for positioning
      const editor = editorRef.current.getEditor();
      const position = editor ? Math.max(1, editor.state.doc.content.size - 1) : 1;

      editorRef.current.streamEdit({
        collaboratorId: edit.collaboratorId,
        type: 'insert',
        position,
        content: edit.content,
        stream: true,
        streamSpeed: edit.streamSpeed,
      });

      // Wait for this agent to finish typing
      await wait(edit.content.length * edit.streamSpeed + 800);
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
    editorRef.current.setMarkdown(`# Multi-Agent Collaboration Demo

Click "Start Collaboration" to watch three AI agents take turns contributing to this document!

Each agent adds their own section while the others wait. You can type alongside them.`);
    setIsRunning(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
          {isRunning ? '🤖 Agents Working...' : '✨ Start Collaboration'}
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

      <CollaborativeEditor
        ref={editorRef}
        value={`# Multi-Agent Collaboration Demo

Click "Start Collaboration" to watch three AI agents take turns contributing to this document!

Each agent adds their own section while the others wait. You can type alongside them.`}
        height="500px"
        showToolbar
      />
    </div>
  );
};

export const MultiAgentCollaboration: Story = {
  render: () => <MultiAgentDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Watch multiple AI agents edit different paragraphs simultaneously without conflicts.',
      },
    },
  },
};

// Single agent typing demo - fixed cursor cleanup
const SingleAgentDemo = () => {
  const editorRef = useRef<CollaborativeEditorRef>(null);
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

    // Set initial position
    editorRef.current.setCursorPosition('claude', 1);

    // Start typing after a short delay
    setTimeout(() => {
      // Note: Content avoids words that look like URLs (no "real-time" which can trigger link detection)
      const content = `Hello! I'm Claude, and I'm typing this message character by character.

Watch as my cursor moves through the document. You can see exactly where I'm writing.

This collaborative editing experience lets us work together seamlessly!`;

      editorRef.current?.streamEdit({
        collaboratorId: 'claude',
        type: 'insert',
        position: 1,
        content,
        stream: true,
        streamSpeed: 35,
      });
    }, 500);

    // Calculate typing duration and clean up properly
    const typingDuration = 170 * 35 + 1000; // content length * speed + buffer
    setTimeout(() => {
      editorRef.current?.removeCollaborator('claude');
      setIsTyping(false);
    }, typingDuration);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <button
        onClick={startTyping}
        disabled={isTyping}
        style={{
          padding: '8px 16px',
          cursor: isTyping ? 'not-allowed' : 'pointer',
          opacity: isTyping ? 0.7 : 1,
          alignSelf: 'flex-start',
          background: '#E91E63',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
        }}
      >
        {isTyping ? '✨ Claude is typing...' : 'Let Claude Type'}
      </button>

      <CollaborativeEditor
        ref={editorRef}
        value=""
        placeholder="Click the button to see Claude start typing..."
        height="300px"
        showToolbar
      />
    </div>
  );
};

export const SingleAgentTyping: Story = {
  render: () => <SingleAgentDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Watch a single AI agent type a message character by character. The cursor is removed when typing completes.',
      },
    },
  },
};

// Interactive cursor positioning
const CursorPositioningDemo = () => {
  const editorRef = useRef<CollaborativeEditorRef>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    // Add some collaborators
    editorRef.current.addCollaborator({
      id: 'user-1',
      name: 'Alice',
      color: getCollaboratorColor(0),
      isAI: false,
      status: 'idle',
    });

    editorRef.current.addCollaborator({
      id: 'user-2',
      name: 'Bob',
      color: getCollaboratorColor(2),
      isAI: false,
      status: 'idle',
    });

    editorRef.current.addCollaborator({
      id: 'ai-1',
      name: 'Claude',
      color: getCollaboratorColor(4),
      isAI: true,
      status: 'idle',
    });

    // Set initial positions
    editorRef.current.setCursorPosition('user-1', 20);
    editorRef.current.setCursorPosition('user-2', 50);
    editorRef.current.setCursorPosition('ai-1', 80);

    // Animate cursor movements
    let frame = 0;
    const interval = setInterval(() => {
      frame++;
      const positions = [
        20 + Math.sin(frame * 0.05) * 15,
        50 + Math.cos(frame * 0.03) * 20,
        80 + Math.sin(frame * 0.04 + 1) * 25,
      ];

      editorRef.current?.setCursorPosition('user-1', Math.max(1, Math.round(positions[0])));
      editorRef.current?.setCursorPosition('user-2', Math.max(1, Math.round(positions[1])));
      editorRef.current?.setCursorPosition('ai-1', Math.max(1, Math.round(positions[2])));
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <CollaborativeEditor
      ref={editorRef}
      value={`# Cursor Positioning Demo

Watch the cursors move around the document! Each collaborator has their own colored cursor with a name label.

Alice (pink), Bob (purple), and Claude (blue) are all here.`}
      height="300px"
      showToolbar={false}
    />
  );
};

export const CursorPositioning: Story = {
  render: () => <CursorPositioningDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates cursor positioning for multiple collaborators.',
      },
    },
  },
};

// Sequential editing with configurable agent count
const ParallelEditingDemo = () => {
  const editorRef = useRef<CollaborativeEditorRef>(null);
  const [agentCount, setAgentCount] = useState(3);
  const [isRunning, setIsRunning] = useState(false);

  const runParallelEdits = async () => {
    if (!editorRef.current || isRunning) return;
    setIsRunning(true);

    // Reset document
    editorRef.current.setMarkdown(`# Sequential Editing Test

Watch as ${agentCount} agents take turns adding their sections below.
`);

    // Wait for content to be set
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Add all agents first (so their presence is visible)
    for (let i = 0; i < agentCount; i++) {
      editorRef.current.addCollaborator({
        id: `agent-${i}`,
        name: `Agent ${i + 1}`,
        color: getCollaboratorColor(i),
        isAI: true,
        status: 'idle',
      });
    }

    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    // Run agents sequentially - each waits for the previous to finish
    for (let i = 0; i < agentCount; i++) {
      const editor = editorRef.current.getEditor();
      if (!editor) break;

      const position = Math.max(1, editor.state.doc.content.size - 1);
      const content = `\n\n**Agent ${i + 1}**: Hello! I'm contributing my section to this collaborative document.`;

      editorRef.current.streamEdit({
        collaboratorId: `agent-${i}`,
        type: 'insert',
        position,
        content,
        stream: true,
        streamSpeed: 18,
      });

      // Wait for this agent to finish
      await wait(content.length * 18 + 600);
    }

    // Cleanup after all agents finish
    await wait(1000);
    for (let i = 0; i < agentCount; i++) {
      editorRef.current?.removeCollaborator(`agent-${i}`);
    }
    setIsRunning(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          Agents:
          <input
            type="range"
            min="2"
            max="6"
            value={agentCount}
            onChange={(e) => setAgentCount(Number(e.target.value))}
            disabled={isRunning}
          />
          <span>{agentCount}</span>
        </label>
        <button
          onClick={runParallelEdits}
          disabled={isRunning}
          style={{
            padding: '8px 16px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            background: '#673AB7',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          {isRunning ? 'Running...' : 'Start Sequential Edits'}
        </button>
      </div>

      <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
        Agents take turns - each one waits for the previous to finish typing.
      </p>

      <CollaborativeEditor
        ref={editorRef}
        value={`# Sequential Editing Test

Adjust the slider and click 'Start' to see multiple agents take turns editing.`}
        height="400px"
        showToolbar
      />
    </div>
  );
};

export const ParallelEditing: Story = {
  render: () => <ParallelEditingDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Configurable number of agents take turns editing the document sequentially.',
      },
    },
  },
};

// Code review scenario - fixed positioning
const CodeReviewDemo = () => {
  const editorRef = useRef<CollaborativeEditorRef>(null);
  const [phase, setPhase] = useState<'idle' | 'reviewing' | 'done'>('idle');

  const startCodeReview = async () => {
    if (!editorRef.current || phase !== 'idle') return;
    setPhase('reviewing');

    // Add reviewers
    const reviewers: Collaborator[] = [
      { id: 'senior', name: 'Senior Dev', color: '#2196F3', isAI: true, status: 'idle' },
      { id: 'security', name: 'Security Bot', color: '#F44336', isAI: true, status: 'idle' },
    ];

    reviewers.forEach((r) => editorRef.current?.addCollaborator(r));

    const editor = editorRef.current.getEditor();
    if (!editor) return;

    // Find the code block and specific lines within it using ProseMirror positions
    let codeBlockStart = -1;
    let codeBlockEnd = -1;

    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'codeBlock' && codeBlockStart === -1) {
        codeBlockStart = pos + 1; // Start of code block content
        codeBlockEnd = pos + node.nodeSize - 1;
      }
      return true;
    });

    // Senior dev adds a comment before the function
    setTimeout(() => {
      if (codeBlockStart > 0) {
        editorRef.current?.streamEdit({
          collaboratorId: 'senior',
          type: 'insert',
          position: codeBlockStart,
          content: '// TODO: Add input validation\n// Consider edge cases for negative numbers\n',
          stream: true,
          streamSpeed: 25,
        });
      }
    }, 1000);

    // Security bot adds a comment before the return statement
    // Need to find the position after first edit completes
    setTimeout(() => {
      const currentEditor = editorRef.current?.getEditor();
      if (!currentEditor) return;

      // Find 'return result' in the updated document
      let returnPos = -1;
      currentEditor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'codeBlock') {
          const text = node.textContent;
          const returnIndex = text.indexOf('return result');
          if (returnIndex !== -1) {
            returnPos = pos + 1 + returnIndex;
          }
        }
        return true;
      });

      if (returnPos > 0) {
        editorRef.current?.streamEdit({
          collaboratorId: 'security',
          type: 'insert',
          position: returnPos,
          content: '// SECURITY: Sanitize before returning\n  ',
          stream: true,
          streamSpeed: 20,
        });
      }
    }, 4000);

    setTimeout(() => {
      reviewers.forEach((r) => editorRef.current?.removeCollaborator(r.id));
      setPhase('done');
    }, 8000);
  };

  const resetDemo = () => {
    if (!editorRef.current) return;
    editorRef.current.setMarkdown(`# Code Review Example

\`\`\`typescript
function calculate(a: number, b: number): number {
  const result = a * b + Math.pow(a, 2);
  return result;
}

export function processData(input: string) {
  const parsed = JSON.parse(input);
  return calculate(parsed.x, parsed.y);
}
\`\`\`

Click "Start Code Review" to see AI reviewers add comments inside the code!`);
    setPhase('idle');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={startCodeReview}
          disabled={phase !== 'idle'}
          style={{
            padding: '8px 16px',
            cursor: phase !== 'idle' ? 'not-allowed' : 'pointer',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          {phase === 'reviewing'
            ? '🔍 Reviewing...'
            : phase === 'done'
              ? '✅ Review Complete'
              : 'Start Code Review'}
        </button>
        {phase === 'done' && (
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
        )}
      </div>

      <CollaborativeEditor
        ref={editorRef}
        value={`# Code Review Example

\`\`\`typescript
function calculate(a: number, b: number): number {
  const result = a * b + Math.pow(a, 2);
  return result;
}

export function processData(input: string) {
  const parsed = JSON.parse(input);
  return calculate(parsed.x, parsed.y);
}
\`\`\`

Click "Start Code Review" to see AI reviewers add comments inside the code!`}
        height="400px"
        showToolbar
      />
    </div>
  );
};

export const CodeReviewScenario: Story = {
  render: () => <CodeReviewDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Simulates an AI-assisted code review with reviewers adding comments inside the code block.',
      },
    },
  },
};

// Markdown formatting test - demonstrates proper Enter key behavior
const MarkdownFormattingDemo = () => {
  const editorRef = useRef<CollaborativeEditorRef>(null);
  const [isTyping, setIsTyping] = useState(false);

  const startTyping = () => {
    if (!editorRef.current || isTyping) return;
    setIsTyping(true);

    // Clear the editor
    editorRef.current.setMarkdown('');

    // Add Claude as collaborator
    editorRef.current.addCollaborator({
      id: 'claude',
      name: 'Claude',
      color: '#E91E63',
      isAI: true,
      status: 'idle',
    });

    // Helper to stream content sequentially
    const streamSequentially = async () => {
      const sections = [
        { content: '# Hello World', delay: 500 },
        { content: '\n\nThis is **bold** and *italic* text.', delay: 1500 },
        { content: '\n\n## Features List', delay: 2000 },
        { content: '\n\n- First item with `inline code`', delay: 1500 },
        { content: '\n- Second item', delay: 800 },
        { content: '\n- Third item', delay: 800 },
        { content: '\n\n### Code Example', delay: 1500 },
        {
          content: '\n\n```typescript\nconst greeting = "Hello!";\nconsole.log(greeting);\n```',
          delay: 2500,
        },
        { content: '\n\n> This is a blockquote.', delay: 1500 },
        { content: '\n\nAnd a [link](https://example.com) for good measure!', delay: 2000 },
      ];

      const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

      // Start typing position
      let currentPos = 1;

      for (const section of sections) {
        const editor = editorRef.current?.getEditor();
        if (!editor) break;

        // Get current document end
        currentPos = Math.max(1, editor.state.doc.content.size - 1);

        editorRef.current?.streamEdit({
          collaboratorId: 'claude',
          type: 'insert',
          position: currentPos,
          content: section.content,
          stream: true,
          streamSpeed: 15,
        });

        // Wait for this section to complete
        await wait(section.content.length * 15 + section.delay);
      }

      // Cleanup
      await wait(1000);
      editorRef.current?.removeCollaborator('claude');
      setIsTyping(false);
    };

    // Start after initial delay
    setTimeout(streamSequentially, 500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <button
          onClick={startTyping}
          disabled={isTyping}
          style={{
            padding: '8px 16px',
            cursor: isTyping ? 'not-allowed' : 'pointer',
            opacity: isTyping ? 0.7 : 1,
            background: '#E91E63',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          {isTyping ? 'Typing markdown...' : 'Type Markdown'}
        </button>
        <span style={{ fontSize: '14px', color: 'var(--page-text-soft)' }}>
          Watch as markdown sections are typed sequentially with proper formatting!
        </span>
      </div>

      <CollaborativeEditor
        ref={editorRef}
        value=""
        placeholder="Click the button to see Claude type markdown..."
        height="500px"
        showToolbar
      />
    </div>
  );
};

export const MarkdownFormatting: Story = {
  render: () => <MarkdownFormattingDemo />,
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates markdown being typed section by section. Each section completes before the next begins, showing proper Enter/newline behavior.',
      },
    },
  },
};
