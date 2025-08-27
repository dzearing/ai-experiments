import React from 'react';
import { Button } from '@claude-flow/ui-kit-react';
import {
  UndoIcon,
  RedoIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  ListBulletIcon,
  ListOrderedIcon,
  LinkIcon,
  CodeBlockIcon,
} from '@claude-flow/ui-kit-icons';
import styles from './PlanEditor.module.css';

interface PlanEditorProps {
  planContent: string;
  onPlanContentChange: (content: string) => void;
}

export const PlanEditor: React.FC<PlanEditorProps> = ({
  planContent,
  onPlanContentChange,
}) => {
  const formatContent = (content: string) => {
    return content
      .split('\n')
      .map(line => {
        // Headers
        if (line.startsWith('### ')) {
          return `<h3>${line.slice(4)}</h3>`;
        } else if (line.startsWith('## ')) {
          return `<h2>${line.slice(3)}</h2>`;
        } else if (line.startsWith('# ')) {
          return `<h1>${line.slice(2)}</h1>`;
        }
        // Lists
        else if (line.match(/^\d+\.\s/)) {
          return `<div style="margin-left: 20px">${line}</div>`;
        } else if (line.startsWith('- ')) {
          return `<div>• ${line.slice(2)}</div>`;
        }
        // Bold text
        else if (line.includes('**')) {
          return `<div>${line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</div>`;
        }
        // Empty lines
        else if (line.trim() === '') {
          return '<br>';
        }
        // Regular text
        else {
          return `<div>${line}</div>`;
        }
      })
      .join('');
  };

  return (
    <div className={styles.editorPane}>
      <div className={styles.editorToolbar}>
        <div className={styles.toolbarGroup}>
          <Button
            variant="inline"
            shape="square"
            size="small"
            aria-label="Undo"
            className={styles.toolbarButton}
          >
            <UndoIcon />
          </Button>
          <Button
            variant="inline"
            shape="square"
            size="small"
            aria-label="Redo"
            className={styles.toolbarButton}
          >
            <RedoIcon />
          </Button>
        </div>
        <div className={styles.toolbarSeparator} />
        <div className={styles.toolbarGroup}>
          <Button
            variant="inline"
            shape="square"
            size="small"
            aria-label="Heading 1"
            className={styles.toolbarButton}
          >
            <Heading1Icon />
          </Button>
          <Button
            variant="inline"
            shape="square"
            size="small"
            aria-label="Heading 2"
            className={styles.toolbarButton}
          >
            <Heading2Icon />
          </Button>
          <Button
            variant="inline"
            shape="square"
            size="small"
            aria-label="Heading 3"
            className={styles.toolbarButton}
          >
            <Heading3Icon />
          </Button>
        </div>
        <div className={styles.toolbarSeparator} />
        <div className={styles.toolbarGroup}>
          <Button
            variant="inline"
            shape="square"
            size="small"
            aria-label="Bold"
            className={styles.toolbarButton}
          >
            <BoldIcon />
          </Button>
          <Button
            variant="inline"
            shape="square"
            size="small"
            aria-label="Italic"
            className={styles.toolbarButton}
          >
            <ItalicIcon />
          </Button>
          <Button
            variant="inline"
            shape="square"
            size="small"
            aria-label="Underline"
            className={styles.toolbarButton}
          >
            <UnderlineIcon />
          </Button>
        </div>
        <div className={styles.toolbarSeparator} />
        <div className={styles.toolbarGroup}>
          <Button
            variant="inline"
            shape="square"
            size="small"
            aria-label="Bullet List"
            className={styles.toolbarButton}
          >
            <ListBulletIcon />
          </Button>
          <Button
            variant="inline"
            shape="square"
            size="small"
            aria-label="Numbered List"
            className={styles.toolbarButton}
          >
            <ListOrderedIcon />
          </Button>
        </div>
        <div className={styles.toolbarSeparator} />
        <div className={styles.toolbarGroup}>
          <Button
            variant="inline"
            shape="square"
            size="small"
            aria-label="Insert Link"
            className={styles.toolbarButton}
          >
            <LinkIcon />
          </Button>
          <Button
            variant="inline"
            shape="square"
            size="small"
            aria-label="Code Block"
            className={styles.toolbarButton}
          >
            <CodeBlockIcon />
          </Button>
        </div>
      </div>
      <div className={styles.editorContent}>
        <div 
          className={styles.editorDocument}
          contentEditable
          suppressContentEditableWarning
          onInput={(e) => {
            const target = e.currentTarget;
            onPlanContentChange(target.innerText);
          }}
          dangerouslySetInnerHTML={{ 
            __html: formatContent(planContent)
          }}
        />
      </div>
    </div>
  );
};