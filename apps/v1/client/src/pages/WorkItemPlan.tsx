import { useState, useEffect, useTransition, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContextV2';
import { useApp } from '../contexts/AppContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useLayout } from '../contexts/LayoutContext';
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  CreateLink,
  InsertThematicBreak,
  ListsToggle,
  BlockTypeSelect,
  Separator,
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';
import '../styles/mdx-editor.css';
import { clientLogger } from '../utils/clientLogger';

interface Task {
  id: string;
  title: string;
  description: string;
  goals: string[];
  workDescription: string;
  validationCriteria: string[];
  taskNumber?: string;
}

export function WorkItemPlan() {
  const { workItemId } = useParams<{ workItemId: string }>();
  const { currentStyles, isDarkMode } = useTheme();
  const { updateWorkItem, projects, workItems } = useApp();
  const { workspace, reloadWorkspace } = useWorkspace();
  const { setHeaderContent } = useLayout();
  const styles = currentStyles;

  const existingWorkItem = workItems.find((w) => w.id === workItemId);
  const currentProject = existingWorkItem
    ? projects.find((p) => p.id === existingWorkItem.projectId)
    : undefined;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [generalMarkdown, setGeneralMarkdown] = useState<string>('');
  const [, startTransition] = useTransition();
  const [editorKey, setEditorKey] = useState(0);
  const editorRef = useRef<any>(null);
  const [selectedSection, setSelectedSection] = useState<'general' | 'task'>('general');
  const [taskMarkdownContents, setTaskMarkdownContents] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [originalGeneralMarkdown, setOriginalGeneralMarkdown] = useState<string | undefined>(undefined);
  const isProgrammaticChange = useRef(false);
  const [originalTaskContents, setOriginalTaskContents] = useState<Record<string, string>>({});
  const isInitializing = useRef(true);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  // Update breadcrumb
  useEffect(() => {
    if (existingWorkItem) {
      const projectName = currentProject?.name || 'Unknown Project';
      setHeaderContent([
        { label: 'Work items', path: '/work-items' },
        { label: `${projectName}: ${existingWorkItem.title}` },
      ]);
    }

    return () => {
      setHeaderContent(null);
    };
  }, [existingWorkItem, currentProject, setHeaderContent]);

  // Warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    if (hasChanges) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasChanges]);

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // Function to parse markdown back into task properties
  const parseTaskFromMarkdown = (markdown: string): Partial<Task> => {
    const task: Partial<Task> = {};

    const descMatch = markdown.match(/##\s*Description\s*\n+([\s\S]*?)(?=\n##|$)/i);
    if (descMatch) {
      task.description = descMatch[1].trim();
    }

    const goalsMatch = markdown.match(/##\s*Goals\s*\n+([\s\S]*?)(?=\n##|$)/i);
    if (goalsMatch) {
      const goalLines = goalsMatch[1].trim().split('\n');
      const parsedGoals = goalLines
        .filter((line) => line.match(/^[-*]\s+/))
        .map((line) => line.replace(/^[-*]\s+/, '').trim())
        .filter((goal) => goal && goal !== 'No goals defined');
      task.goals = parsedGoals.length > 0 ? parsedGoals : [];
    }

    const workMatch = markdown.match(/##\s*Work\s*Description\s*\n+([\s\S]*?)(?=\n##|$)/i);
    if (workMatch) {
      task.workDescription = workMatch[1].trim();
    }

    const criteriaMatch = markdown.match(/##\s*Validation\s*Criteria\s*\n+([\s\S]*?)(?=\n##|$)/i);
    if (criteriaMatch) {
      const criteriaLines = criteriaMatch[1].trim().split('\n');
      const parsedCriteria = criteriaLines
        .filter((line) => line.match(/^[-*]\s+/))
        .map((line) => line.replace(/^[-*]\s+/, '').trim())
        .filter((criteria) => criteria && criteria !== 'No criteria defined');
      task.validationCriteria = parsedCriteria.length > 0 ? parsedCriteria : [];
    }

    return task;
  };

  // Format task to markdown
  const formatTaskToMarkdown = (task: Task): string => {
    const goalsSection = task.goals && task.goals.length > 0
      ? task.goals.map((goal) => `- ${goal}`).join('\n')
      : '- No goals defined';

    const criteriaSection = task.validationCriteria && task.validationCriteria.length > 0
      ? task.validationCriteria.map((criteria) => `- ${criteria}`).join('\n')
      : '- No criteria defined';

    return `## Description
${task.description || 'No description'}

## Goals
${goalsSection}

## Work Description
${task.workDescription || 'No work description'}

## Validation Criteria
${criteriaSection}`;
  };

  // Assign task numbers
  const assignTaskNumbers = (taskList: Task[]): Task[] => {
    const numberedTasks = [...taskList];
    let currentNumber = 1;

    for (let i = 0; i < numberedTasks.length; i++) {
      numberedTasks[i].taskNumber = String(currentNumber);
      currentNumber++;
    }

    return numberedTasks;
  };

  // Initialize with existing work item data
  useEffect(() => {
    // Support both metadata.tasks (new format) and root tasks (parsed from markdown)
    const rawTasks = existingWorkItem?.metadata?.tasks || existingWorkItem?.tasks;

    clientLogger.debug('WorkItemPlan', 'Initializing work item', {
      workItemId: existingWorkItem?.id,
      hasMetadataTasks: !!existingWorkItem?.metadata?.tasks,
      hasRootTasks: !!existingWorkItem?.tasks,
      taskCount: rawTasks?.length || 0,
    });

    if (existingWorkItem && rawTasks && rawTasks.length > 0) {
      const normalizedTasks = rawTasks.map((task: any) => {
        const taskId = task.id || Math.random().toString(36).substring(2, 9);
        const storedMarkdown = existingWorkItem.metadata?.taskMarkdownContents?.[taskId];

        const normalized = {
          id: taskId,
          title: task.title || '',
          description: task.description || '',
          goals: task.goals || [],
          workDescription: task.workDescription || '',
          validationCriteria: task.validationCriteria || [],
          taskNumber: task.taskNumber,
        };

        if (storedMarkdown) {
          const parsedFromMarkdown = parseTaskFromMarkdown(storedMarkdown);
          if (parsedFromMarkdown.goals !== undefined) {
            normalized.goals = parsedFromMarkdown.goals;
          }
          if (parsedFromMarkdown.validationCriteria !== undefined) {
            normalized.validationCriteria = parsedFromMarkdown.validationCriteria;
          }
        }

        return normalized;
      });

      const tasksWithNumbers = assignTaskNumbers(normalizedTasks);
      setTasks(tasksWithNumbers);
      setSelectedTaskId(null);
      setSelectedSection('general');

      let markdownForWorkItem: string;
      if (existingWorkItem.metadata?.generalMarkdown) {
        markdownForWorkItem = existingWorkItem.metadata.generalMarkdown;
      } else {
        markdownForWorkItem = `# ${existingWorkItem.title}

## Description

${existingWorkItem.description || 'No description provided'}

## Overall goals

- [ ] Complete all tasks successfully
- [ ] Meet project requirements

## Acceptance criteria

- [ ] All tasks completed according to specifications
- [ ] Code reviewed and approved
- [ ] Tests passing`;
      }
      setGeneralMarkdown(markdownForWorkItem);
      setOriginalGeneralMarkdown(markdownForWorkItem);

      if (existingWorkItem.metadata?.taskMarkdownContents) {
        setTaskMarkdownContents(existingWorkItem.metadata.taskMarkdownContents);
        setOriginalTaskContents(existingWorkItem.metadata.taskMarkdownContents);
      } else {
        setOriginalTaskContents({});
        setTaskMarkdownContents({});
      }

      setTimeout(() => {
        isInitializing.current = false;
      }, 100);
    }
  }, [workItemId, existingWorkItem]);

  // Update edited content when task selection changes
  useEffect(() => {
    if (selectedTask && selectedTaskId) {
      isProgrammaticChange.current = true;

      const savedMarkdown = taskMarkdownContents[selectedTaskId];
      const markdown = savedMarkdown || formatTaskToMarkdown(selectedTask);

      clientLogger.debug('WorkItemPlan', 'Setting task content', {
        taskId: selectedTaskId,
        taskTitle: selectedTask.title,
        hasSavedMarkdown: !!savedMarkdown,
        markdownLength: markdown.length,
      });

      setEditedContent(markdown);

      startTransition(() => {
        setEditorKey((prev) => prev + 1);
      });

      setTimeout(() => {
        isProgrammaticChange.current = false;
      }, 100);
    }
  }, [selectedTaskId]);

  const saveWorkItem = async () => {
    clientLogger.userClick('WorkItemPlan', 'Save button', {
      workItemId: existingWorkItem?.id,
      workItemTitle: existingWorkItem?.title,
    });

    if (!existingWorkItem) return;

    // Update current task from markdown
    if (selectedTaskId && editedContent) {
      const parsedTask = parseTaskFromMarkdown(editedContent);
      const updatedTasks = tasks.map((task) =>
        task.id === selectedTaskId ? { ...task, ...parsedTask } : task
      );
      setTasks(updatedTasks);
    }

    // Extract title from general markdown
    const titleMatch = generalMarkdown.match(/^#\s+(.+)$/m);
    const overallTitle = titleMatch ? titleMatch[1].trim() : existingWorkItem.title;

    const latestTasks = selectedTaskId && editedContent
      ? tasks.map((task) =>
          task.id === selectedTaskId
            ? { ...task, ...parseTaskFromMarkdown(editedContent) }
            : task
        )
      : tasks;

    const taskMarkdownMap: Record<string, string> = {};
    latestTasks.forEach(task => {
      if (taskMarkdownContents[task.id]) {
        taskMarkdownMap[task.id] = taskMarkdownContents[task.id];
      } else if (task.id === selectedTaskId && editedContent) {
        taskMarkdownMap[task.id] = editedContent;
      }
    });

    updateWorkItem(existingWorkItem.id, {
      title: overallTitle,
      description: existingWorkItem.description,
      metadata: {
        tasks: latestTasks,
        currentTaskIndex: existingWorkItem.metadata?.currentTaskIndex || 0,
        generalMarkdown: generalMarkdown,
        taskMarkdownContents: taskMarkdownMap,
      },
      updatedAt: new Date(),
    });

    if (workspace.config && currentProject && currentProject.path) {
      try {
        const requestBody = {
          workspacePath: workspace.config.path,
          projectPath: currentProject.path,
          workItem: {
            id: existingWorkItem.id,
            title: overallTitle,
            description: existingWorkItem.description,
            priority: existingWorkItem.priority,
            status: existingWorkItem.status,
          },
          generalMarkdown: generalMarkdown,
          tasks: latestTasks,
        };

        const response = await fetch('http://localhost:3000/api/workspace/update-workitem', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (response.ok) {
          const { invalidateCache } = await import('../utils/cache');
          invalidateCache(`workspace-light:${workspace.config.path}`);
          invalidateCache(`project-details:${currentProject.path}`);
          invalidateCache(`workspace:${workspace.config.path}`);
          invalidateCache(/^work-items:/);
          invalidateCache(/^work-item:/);

          await reloadWorkspace();

          setOriginalGeneralMarkdown(generalMarkdown);

          const newTaskContents: Record<string, string> = {};
          latestTasks.forEach((task) => {
            newTaskContents[task.id] = formatTaskToMarkdown(task);
          });
          setOriginalTaskContents(newTaskContents);

          setHasChanges(false);
        }
      } catch (error) {
        console.error('Error saving work item:', error);
      }
    }
  };

  return (
    <div className="h-full overflow-hidden grid grid-cols-1 lg:grid-cols-3 gap-6 p-8">
      {/* Left Panel - General Details and Task List */}
      <div
        className={`lg:col-span-1 ${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} ${styles.cardShadow} flex flex-col overflow-hidden`}
      >
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* General Details Section */}
            <button
              onClick={() => {
                isProgrammaticChange.current = true;

                if (selectedTaskId && editedContent) {
                  setTaskMarkdownContents(prev => ({
                    ...prev,
                    [selectedTaskId]: editedContent
                  }));
                }

                setSelectedSection('general');
                setSelectedTaskId(null);

                setTimeout(() => {
                  isProgrammaticChange.current = false;
                }, 100);
              }}
              className={`
                w-full text-left p-3 ${styles.buttonRadius} border
                ${
                  selectedSection === 'general' && !selectedTaskId
                    ? `${styles.primaryButton} ${styles.primaryButtonText} border-transparent`
                    : `${styles.contentBg} ${styles.contentBorder} ${styles.textColor} hover:opacity-80`
                }
                transition-none
              `}
            >
              <div className="font-medium">Work item description</div>
              <div
                className={`text-sm mt-1 ${selectedSection === 'general' && !selectedTaskId ? 'opacity-90' : styles.mutedText}`}
              >
                Overview and goals
              </div>
            </button>

            <div className={`border-t pt-3 ${styles.contentBorder}`}>
              <h2 className={`text-lg font-semibold ${styles.headingColor} mb-2`}>
                Tasks
              </h2>
            </div>

            <div className="space-y-2">
            {tasks.map((task) => (
              <button
                key={task.id}
                onClick={() => {
                  if (selectedTaskId !== task.id) {
                    isProgrammaticChange.current = true;

                    if (selectedTaskId && editedContent) {
                      setTaskMarkdownContents(prev => ({
                        ...prev,
                        [selectedTaskId]: editedContent
                      }));

                      const parsedTask = parseTaskFromMarkdown(editedContent);
                      const updatedTasks = tasks.map((t) => {
                        if (t.id === selectedTaskId) {
                          const updatedTask = { ...t };
                          if (parsedTask.description !== undefined) {
                            updatedTask.description = parsedTask.description;
                          }
                          if (parsedTask.goals !== undefined) {
                            updatedTask.goals = parsedTask.goals;
                          }
                          if (parsedTask.workDescription !== undefined) {
                            updatedTask.workDescription = parsedTask.workDescription;
                          }
                          if (parsedTask.validationCriteria !== undefined) {
                            updatedTask.validationCriteria = parsedTask.validationCriteria;
                          }
                          return updatedTask;
                        }
                        return t;
                      });
                      setTasks(updatedTasks);
                    }

                    setSelectedSection('task');
                    setSelectedTaskId(task.id);

                    setTimeout(() => {
                      isProgrammaticChange.current = false;
                    }, 100);
                  }
                }}
                className={`
                  w-full text-left p-3 ${styles.buttonRadius} border
                  ${
                    selectedTaskId === task.id
                      ? `${styles.primaryButton} ${styles.primaryButtonText} border-transparent`
                      : `${styles.contentBg} ${styles.contentBorder} ${styles.textColor} hover:opacity-80`
                  }
                  transition-none
                `}
              >
                <div className="font-medium">
                  {task.taskNumber && <span className="font-mono">{task.taskNumber}. </span>}
                  {task.title}
                </div>
                <div
                  className={`text-sm mt-1 ${selectedTaskId === task.id ? 'opacity-90' : styles.mutedText}`}
                >
                  {task.goals?.length || 0} goals • {task.validationCriteria?.length || 0} criteria
                </div>
              </button>
            ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Details View */}
        <div
          className={`lg:col-span-2 ${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} ${styles.cardShadow} flex flex-col overflow-hidden`}
        >
          {selectedSection === 'general' && !selectedTaskId ? (
            <div
              className={`flex-1 min-h-0 ${isDarkMode ? 'mdx-dark' : 'mdx-light'} mdx-edge-to-edge flex flex-col`}
            >
              {generalMarkdown ? (
                <MDXEditor
                  ref={editorRef}
                  key={`general-${editorKey}`}
                  markdown={generalMarkdown}
                  onChange={(value) => {
                    const newValue = value || '';
                    setGeneralMarkdown(newValue);
                    if (!isProgrammaticChange.current && !isInitializing.current) {
                      if (originalGeneralMarkdown !== undefined) {
                        setHasChanges(newValue !== originalGeneralMarkdown);
                      }
                    }
                  }}
                  contentEditableClassName="prose prose-neutral dark:prose-invert max-w-none py-3 pl-2 pr-3"
                  plugins={[
                    headingsPlugin(),
                    listsPlugin(),
                    quotePlugin(),
                    thematicBreakPlugin(),
                    markdownShortcutPlugin(),
                    toolbarPlugin({
                      toolbarContents: () => (
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center">
                            <UndoRedo />
                            <Separator />
                            <BoldItalicUnderlineToggles />
                            <Separator />
                            <ListsToggle />
                            <Separator />
                            <BlockTypeSelect />
                            <Separator />
                            <CreateLink />
                            <InsertThematicBreak />
                          </div>
                          <button
                            onClick={() => saveWorkItem()}
                            className={`px-3 py-1 text-sm font-medium ${styles.buttonRadius} transition-opacity ${
                              hasChanges
                                ? `opacity-100 ${styles.primaryButton} !text-white`
                                : 'opacity-0 pointer-events-none'
                            }`}
                            disabled={!hasChanges}
                          >
                            Save
                          </button>
                        </div>
                      ),
                    }),
                  ]}
                />
              ) : (
                <div className="p-4 text-center text-gray-500">Loading description...</div>
              )}
            </div>
          ) : selectedTask ? (
            <div
              className={`flex-1 min-h-0 ${isDarkMode ? 'mdx-dark' : 'mdx-light'} mdx-edge-to-edge flex flex-col`}
            >
              <MDXEditor
                ref={editorRef}
                key={editorKey}
                markdown={editedContent}
                onChange={(value) => {
                  const newValue = value || '';
                  setEditedContent(newValue);

                  if (selectedTaskId) {
                    setTaskMarkdownContents(prev => ({
                      ...prev,
                      [selectedTaskId]: newValue
                    }));
                  }

                  if (updateTimeoutRef.current) {
                    clearTimeout(updateTimeoutRef.current);
                  }

                  updateTimeoutRef.current = setTimeout(() => {
                    if (selectedTaskId && !isProgrammaticChange.current) {
                      const parsedTask = parseTaskFromMarkdown(newValue);
                      const updatedTasks = tasks.map((task) => {
                        if (task.id === selectedTaskId) {
                          const updatedTask = { ...task, ...parsedTask };

                          if (parsedTask.goals !== undefined) {
                            updatedTask.goals = parsedTask.goals;
                          }
                          if (parsedTask.validationCriteria !== undefined) {
                            updatedTask.validationCriteria = parsedTask.validationCriteria;
                          }

                          return updatedTask;
                        }
                        return task;
                      });
                      setTasks(updatedTasks);

                      if (!isInitializing.current) {
                        const originalContent = originalTaskContents[selectedTaskId];
                        const taskChanged = originalContent
                          ? newValue.trim() !== originalContent.trim()
                          : false;
                        const generalChanged = generalMarkdown !== originalGeneralMarkdown;
                        setHasChanges(taskChanged || generalChanged);
                      }
                    }
                  }, 500);
                }}
                contentEditableClassName="prose prose-neutral dark:prose-invert max-w-none p-4"
                plugins={[
                  headingsPlugin(),
                  listsPlugin(),
                  quotePlugin(),
                  thematicBreakPlugin(),
                  markdownShortcutPlugin(),
                  toolbarPlugin({
                    toolbarContents: () => (
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center">
                          <UndoRedo />
                          <Separator />
                          <BoldItalicUnderlineToggles />
                          <Separator />
                          <ListsToggle />
                          <Separator />
                          <BlockTypeSelect />
                          <Separator />
                          <CreateLink />
                          <InsertThematicBreak />
                        </div>
                        <button
                          onClick={() => saveWorkItem()}
                          className={`px-3 py-1 text-sm font-medium ${styles.buttonRadius} transition-opacity ${
                            hasChanges
                              ? `opacity-100 ${styles.primaryButton} !text-white`
                              : 'opacity-0 pointer-events-none'
                          }`}
                          disabled={!hasChanges}
                        >
                          Save
                        </button>
                      </div>
                    ),
                  }),
                ]}
              />
            </div>
          ) : (
            <div className={`text-center ${styles.mutedText} p-6`}>
              Select an item to view details
            </div>
          )}
        </div>
    </div>
  );
}
