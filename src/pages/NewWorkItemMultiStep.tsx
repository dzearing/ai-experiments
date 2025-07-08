import { useState, useEffect, useTransition, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContextV2';
import { useApp } from '../contexts/AppContext';
import { NewWorkItemProvider, useNewWorkItem } from '../contexts/NewWorkItemContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useLayout } from '../contexts/LayoutContext';
import { Button } from '../components/ui/Button';
import { InlineLoadingSpinner } from '../components/ui/LoadingSpinner';
import { DropdownTransition } from '../components/DropdownTransition';
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
  Separator
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';
import '../styles/mdx-editor.css';

interface Task {
  id: string;
  title: string;
  description: string;
  goals: string[];
  workDescription: string;
  validationCriteria: string[];
  taskNumber?: string; // e.g., "1", "2a", "2b", "3"
}

// Main component that wraps content with the context provider
export function NewWorkItemMultiStep() {
  return (
    <NewWorkItemProvider>
      <NewWorkItemContent />
    </NewWorkItemProvider>
  );
}

// Inner component that uses the context
function NewWorkItemContent() {
  const navigate = useNavigate();
  const { projectId, workItemId } = useParams<{ projectId?: string; workItemId?: string }>();
  const { currentStyles, isDarkMode } = useTheme();
  const { createWorkItem, updateWorkItem, projects, workItems } = useApp();
  const { workspace, reloadWorkspace } = useWorkspace();
  const { setHeaderContent } = useLayout();
  const styles = currentStyles;
  
  // Check if we're in edit mode
  const isEditMode = !!workItemId;
  const existingWorkItem = isEditMode ? workItems.find(w => w.id === workItemId) : null;
  
  // Use context for all state management
  const {
    step,
    setStep,
    ideaText,
    setIdeaText,
    savedIdea,
    setSavedIdea,
    tasks,
    setTasks,
    selectedTaskId,
    setSelectedTaskId,
    editedContent,
    setEditedContent,
    generalMarkdown,
    setGeneralMarkdown,
    isProcessing,
    setIsProcessing,
    error,
    setError,
    resetToInput,
  } = useNewWorkItem();
  
  // Add local state for immediate UI response
  const [, startTransition] = useTransition();
  const [editorKey, setEditorKey] = useState(0);
  
  // State for what's selected in review step
  const [selectedSection, setSelectedSection] = useState<'general' | 'task'>('general');
  
  // Project selection state
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    projectId || existingWorkItem?.projectId || (projects.length === 1 ? projects[0].id : '')
  );
  
  // Get the project info if we're creating from a project context or editing
  const currentProject = projectId ? 
    projects.find(p => p.id === projectId) : 
    (existingWorkItem ? projects.find(p => p.id === existingWorkItem.projectId) : 
     (selectedProjectId ? projects.find(p => p.id === selectedProjectId) : undefined));
  
  const [mockMode, setMockMode] = useState(() => {
    const saved = localStorage.getItem('mockMode');
    return saved ? JSON.parse(saved) : false;
  });


  // Listen for mock mode changes
  useEffect(() => {
    const handleMockModeChange = (event: CustomEvent) => {
      setMockMode(event.detail);
    };

    window.addEventListener('mockModeChanged', handleMockModeChange as EventListener);
    return () => {
      window.removeEventListener('mockModeChanged', handleMockModeChange as EventListener);
    };
  }, []);

  const selectedTask = tasks.find(t => t.id === selectedTaskId);
  
  // Track if content has changed for save button visibility
  const [hasChanges, setHasChanges] = useState(false);
  const [originalGeneralMarkdown, setOriginalGeneralMarkdown] = useState<string | undefined>(undefined);
  const [originalTasks, setOriginalTasks] = useState<Task[]>([]);
  const isProgrammaticChange = useRef(false);
  const [originalTaskContents, setOriginalTaskContents] = useState<Record<string, string>>({});
  const isInitializing = useRef(true);

  // Update breadcrumb when in edit mode
  useEffect(() => {
    if (isEditMode && existingWorkItem) {
      const projectName = currentProject?.name || 'Unknown Project';
      setHeaderContent([
        { label: 'Work items', path: '/work-items' },
        { label: `${projectName}: ${existingWorkItem.title}` }
      ]);
    } else {
      setHeaderContent(null);
    }
    
    // No cleanup needed - let the next page set its own header
  }, [isEditMode, existingWorkItem, currentProject, setHeaderContent]);
  
  // Don't use useEffect for change detection - only set hasChanges from user actions
  
  // Warn about unsaved changes when leaving the page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    // Add event listener for page unload
    if (hasChanges) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasChanges]);

  // Function to parse edited markdown content back into task properties
  const parseTaskFromMarkdown = (markdown: string): Partial<Task> => {
    const task: Partial<Task> = {};
    
    // Extract description
    const descMatch = markdown.match(/##\s*Description\s*\n+([\s\S]*?)(?=\n##|$)/);
    if (descMatch) {
      task.description = descMatch[1].trim();
    }
    
    // Extract goals
    const goalsMatch = markdown.match(/##\s*Goals\s*\n+([\s\S]*?)(?=\n##|$)/);
    if (goalsMatch) {
      const goalLines = goalsMatch[1].trim().split('\n');
      task.goals = goalLines
        .filter(line => line.match(/^-\s*/))
        .map(line => line.replace(/^-\s*/, '').trim());
    }
    
    // Extract work description
    const workMatch = markdown.match(/##\s*Work\s*Description\s*\n+([\s\S]*?)(?=\n##|$)/);
    if (workMatch) {
      task.workDescription = workMatch[1].trim();
    }
    
    // Extract validation criteria
    const criteriaMatch = markdown.match(/##\s*Validation\s*Criteria\s*\n+([\s\S]*?)(?=\n##|$)/);
    if (criteriaMatch) {
      const criteriaLines = criteriaMatch[1].trim().split('\n');
      task.validationCriteria = criteriaLines
        .filter(line => line.match(/^-\s*/))
        .map(line => line.replace(/^-\s*/, '').trim());
    }
    
    return task;
  };

  // Update task when edited content changes
  const updateTaskFromMarkdown = (isUserEdit: boolean = true) => {
    if (selectedTaskId && editedContent) {
      const parsedTask = parseTaskFromMarkdown(editedContent);
      const updatedTasks = tasks.map(task => 
        task.id === selectedTaskId 
          ? { ...task, ...parsedTask }
          : task
      );
      setTasks(updatedTasks);
      
      // Check if tasks actually changed after update (only for user edits)
      if (isEditMode && originalTasks.length > 0 && isUserEdit && !isProgrammaticChange.current) {
        setHasChanges(generalMarkdown !== originalGeneralMarkdown || JSON.stringify(updatedTasks) !== JSON.stringify(originalTasks));
      }
    }
  };

  // Helper function to format task to markdown
  const formatTaskToMarkdown = (task: Task): string => {
    return `## Description
${task.description || 'No description'}

## Goals
${(task.goals || []).map(goal => `- ${goal}`).join('\n') || '- No goals defined'}

## Work Description
${task.workDescription || 'No work description'}

## Validation Criteria
${(task.validationCriteria || []).map(criteria => `- ${criteria}`).join('\n') || '- No criteria defined'}`;
  };

  // Function to assign task numbers with parallel task support
  const assignTaskNumbers = (taskList: Task[]): Task[] => {
    // Simple heuristic: tasks with similar titles or that mention similar concepts might be parallel
    const numberedTasks = [...taskList];
    let currentNumber = 1;
    let subLetter = 'a';
    
    for (let i = 0; i < numberedTasks.length; i++) {
      if (i === 0) {
        numberedTasks[i].taskNumber = '1';
      } else {
        // Check if this task might be parallel with the previous one
        const currentTitle = numberedTasks[i].title.toLowerCase();
        const prevTitle = numberedTasks[i - 1].title.toLowerCase();
        
        // Simple heuristic: if titles share common keywords or both mention similar actions
        const commonKeywords = ['implement', 'create', 'add', 'update', 'test', 'document'];
        
        // Check if both tasks are of similar type (e.g., both are "implement" tasks)
        const isParallel = commonKeywords.some(kw => 
          currentTitle.includes(kw) && prevTitle.includes(kw)
        ) || (currentTitle.includes('test') && prevTitle.includes('test'));
        
        if (isParallel && numberedTasks[i - 1].taskNumber && !numberedTasks[i - 1].taskNumber?.includes('a')) {
          // Start a new parallel group
          numberedTasks[i - 1].taskNumber = `${currentNumber}a`;
          numberedTasks[i].taskNumber = `${currentNumber}b`;
          subLetter = 'c';
        } else if (isParallel && numberedTasks[i - 1].taskNumber && numberedTasks[i - 1].taskNumber?.includes(String(currentNumber))) {
          // Continue parallel group
          numberedTasks[i].taskNumber = `${currentNumber}${subLetter}`;
          subLetter = String.fromCharCode(subLetter.charCodeAt(0) + 1);
        } else {
          // New sequential task
          currentNumber++;
          subLetter = 'a';
          numberedTasks[i].taskNumber = String(currentNumber);
        }
      }
    }
    
    return numberedTasks;
  };

  // Initialize with existing work item data if in edit mode
  useEffect(() => {
    console.log('=== Edit Mode Debug ===', {
      isEditMode,
      workItemId,
      existingWorkItem,
      hasMetadata: !!existingWorkItem?.metadata,
      hasTasks: !!existingWorkItem?.metadata?.tasks,
      tasksLength: existingWorkItem?.metadata?.tasks?.length,
      hasGeneralMarkdown: !!existingWorkItem?.metadata?.generalMarkdown,
      generalMarkdownLength: existingWorkItem?.metadata?.generalMarkdown?.length
    });
    
    if (isEditMode && existingWorkItem && existingWorkItem.metadata?.tasks) {
      // Ensure tasks have all required properties
      const normalizedTasks = existingWorkItem.metadata.tasks.map((task: any) => ({
        id: task.id || Math.random().toString(36).substring(2, 9),
        title: task.title || '',
        description: task.description || '',
        goals: task.goals || [],
        workDescription: task.workDescription || '',
        validationCriteria: task.validationCriteria || [],
        taskNumber: task.taskNumber
      }));
      
      // Set tasks from metadata
      const tasksWithNumbers = assignTaskNumbers(normalizedTasks);
      setTasks(tasksWithNumbers);
      setSelectedTaskId(tasksWithNumbers[0]?.id || null);
      // Extract original idea from description or use title
      setSavedIdea(existingWorkItem.description || existingWorkItem.title);
      
      // Initialize general markdown for existing items
      // If no general markdown exists, create a default one
      let markdownForWorkItem: string;
      if (existingWorkItem.metadata?.generalMarkdown) {
        markdownForWorkItem = existingWorkItem.metadata.generalMarkdown;
      } else {
        // Create default general markdown from existing data
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
      
      // Store original values to track changes
      setOriginalGeneralMarkdown(markdownForWorkItem);
      setOriginalTasks(tasksWithNumbers);
      
      // Store original content for each task
      const taskContents: Record<string, string> = {};
      tasksWithNumbers.forEach(task => {
        taskContents[task.id] = formatTaskToMarkdown(task);
      });
      setOriginalTaskContents(taskContents);
      
      // Mark initialization as complete after a short delay
      setTimeout(() => {
        isInitializing.current = false;
      }, 100);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workItemId]); // Only re-run when the work item ID changes

  // Update edited content when task selection changes
  useEffect(() => {
    if (selectedTask) {
      // Mark this as a programmatic change
      isProgrammaticChange.current = true;
      
      // Format the task as markdown immediately
      const markdown = formatTaskToMarkdown(selectedTask);
      
      setEditedContent(markdown);
      
      // Force MDXEditor to recreate with new content
      startTransition(() => {
        setEditorKey(prev => prev + 1);
      });
      
      // Reset the flag after a short delay to allow the editor to update
      setTimeout(() => {
        isProgrammaticChange.current = false;
      }, 100);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTaskId]); // Only depend on selectedTaskId change

  const processIdea = async () => {
    if (!ideaText.trim()) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3000/api/claude/process-idea', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idea: ideaText, mockMode }),
      });

      if (!response.ok) {
        try {
          const errorData = await response.json();
          const errorMessage = errorData.details || errorData.error || `Server responded with ${response.status}: ${response.statusText}`;
          const suggestion = errorData.suggestion;
          
          // Show both error and suggestion
          if (suggestion) {
            throw new Error(`${errorMessage}\n\n${suggestion}`);
          } else {
            throw new Error(errorMessage);
          }
        } catch {
          // If we can't parse the error response, use the basic error
          throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
        }
      }

      const data = await response.json();
      
      // Handle new response format with generalMarkdown
      if (data.generalMarkdown) {
        setGeneralMarkdown(data.generalMarkdown);
      }
      
      const numberedTasks = assignTaskNumbers(data.tasks);
      setTasks(numberedTasks);
      setSelectedTaskId(numberedTasks[0]?.id || null);
      setSavedIdea(ideaText); // Save the idea that generated these tasks
      setStep('review'); // Context will clear ideaText
    } catch (err) {
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        setError('Cannot connect to server. Please ensure the mock server is running on port 3000. Run: cd server && npm run mock');
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const refineIdea = async () => {
    if (!ideaText.trim()) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3000/api/claude/refine-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          refinement: ideaText,
          currentTasks: { tasks },  // Wrap in object to match expected format
          mockMode
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.details || errorData.error || 'Failed to refine tasks';
        const suggestion = errorData.suggestion;
        
        // Show both error and suggestion
        if (suggestion) {
          throw new Error(`${errorMessage}\n\n${suggestion}`);
        } else {
          throw new Error(errorMessage);
        }
      }

      const data = await response.json();
      const numberedTasks = assignTaskNumbers(data.tasks);
      
      // Handle selection preservation
      if (selectedTaskId && tasks.length > 0 && numberedTasks.length > 0) {
        // Find the currently selected task
        const currentSelectedIndex = tasks.findIndex(t => t.id === selectedTaskId);
        const currentSelectedTask = tasks.find(t => t.id === selectedTaskId);
        
        if (currentSelectedIndex !== -1 && currentSelectedTask) {
          // Try to find the same task in the new list by matching title
          const matchingNewTask = numberedTasks.find(t => 
            t.title === currentSelectedTask.title || 
            t.title.includes(currentSelectedTask.title) ||
            currentSelectedTask.title.includes(t.title)
          );
          
          if (matchingNewTask) {
            // Task still exists (possibly with different position), select it
            setSelectedTaskId(matchingNewTask.id);
          } else {
            // Task no longer exists, select task at same index (clamped to valid range)
            const newIndex = Math.min(currentSelectedIndex, numberedTasks.length - 1);
            setSelectedTaskId(numberedTasks[newIndex]?.id || numberedTasks[0]?.id || null);
          }
        }
      } else if (numberedTasks.length > 0) {
        // No previous selection or no tasks before, select first task
        setSelectedTaskId(numberedTasks[0].id);
      }
      
      setTasks(numberedTasks);
      setIdeaText(''); // Clear for next refinement
    } catch (err) {
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        setError('Cannot connect to server. Please ensure the mock server is running on port 3000. Run: cd server && npm run mock');
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const createOrUpdateWorkItems = async () => {
    // Track whether we successfully saved to disk
    let savedToDisk = false;
    // Make sure to update the currently selected task with the latest edited content
    if (selectedTaskId && editedContent) {
      updateTaskFromMarkdown(false); // Pass false since this is not a user edit
    }
    
    // Create a single work item with all tasks as sub-tasks
    const overallTitle = tasks.length > 0 ? tasks[0].title : 'Work Item';
    

    // Store tasks as JSON in a special field
    let workItem;
    if (isEditMode && existingWorkItem) {
      // Update existing work item
      updateWorkItem(existingWorkItem.id, {
        title: overallTitle,
        description: savedIdea || existingWorkItem.description,
        metadata: {
          tasks: tasks,
          currentTaskIndex: existingWorkItem.metadata?.currentTaskIndex || 0,
          generalMarkdown: generalMarkdown
        },
        updatedAt: new Date()
      });
      workItem = { 
        ...existingWorkItem, 
        id: existingWorkItem.id,
        title: overallTitle, 
        description: savedIdea || existingWorkItem.description,
        priority: existingWorkItem.priority || 'high',
        status: existingWorkItem.status || 'planned',
        metadata: {
          tasks: tasks,
          currentTaskIndex: existingWorkItem.metadata?.currentTaskIndex || 0
        }
      };
    } else {
      // Create new work item
      workItem = createWorkItem({
        title: overallTitle,
        description: savedIdea || 'Work item description',
        priority: 'high',
        status: 'planned',
        projectId: projectId || existingWorkItem?.projectId || selectedProjectId, // Use projectId from URL params, existing, or selected
        assignedPersonaIds: [],
        workflow: [
          { name: 'Planning', status: 'completed' },
          { name: 'Development', status: 'pending' },
          { name: 'Testing', status: 'pending' },
          { name: 'Review', status: 'pending' }
        ],
        currentWorkflowStep: 0,
        // Store the tasks data for the work items UI to display
        metadata: {
          tasks: tasks,
          currentTaskIndex: 0,
          generalMarkdown: generalMarkdown
        }
      });
    }

    // Save or update work item as markdown if we have a workspace and project with a path
    if (workspace.config && currentProject && currentProject.path) {
      console.log(`Attempting to ${isEditMode ? 'update' : 'save'} work item as markdown`);
      console.log('Workspace config:', workspace.config);
      console.log('Current project:', currentProject);
      console.log('Project path:', currentProject.path);
      
      try {
        const requestBody = {
          workspacePath: workspace.config.path,
          projectPath: currentProject.path,
          workItem: {
            id: workItem.id,
            title: workItem.title,
            description: savedIdea, // Use the original idea as description
            priority: workItem.priority,
            status: workItem.status
          },
          generalMarkdown: generalMarkdown,
          tasks: tasks
        };
        
        console.log('Request body:', requestBody);
        
        const endpoint = isEditMode ? 
          'http://localhost:3000/api/workspace/update-workitem' : 
          'http://localhost:3000/api/workspace/create-workitem';
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to save work item as markdown. Status:', response.status);
          console.error('Error response:', errorText);
        } else {
          const result = await response.json();
          console.log('Work item saved as markdown:', result.path);
          
          // Update the work item with the markdown path
          if (result.path) {
            updateWorkItem(workItem.id, { markdownPath: result.path });
          }
          
          // Invalidate client-side cache and reload workspace
          if (!isEditMode) {
            // For new items, we need to invalidate cache
            const { invalidateCache } = await import('../utils/cache');
            invalidateCache(`workspace-light:${workspace.config.path}`);
            invalidateCache(`project-details:${currentProject.path}`);
            
            // Trigger workspace reload to sync the new work item
            await reloadWorkspace();
            savedToDisk = true;
          }
        }
      } catch (error) {
        console.error('Error saving work item as markdown:', error);
      }
    } else {
      console.log('Cannot save work item as markdown:');
      console.log('- workspace.config:', workspace.config);
      console.log('- currentProject:', currentProject);
      if (currentProject && !currentProject.path) {
        console.log('- Project exists but has no path (may have been created before workspace integration)');
      }
    }

    // Navigate back to appropriate page
    // If we saved to disk and it's a new item, wait a moment for sync to complete
    if (!isEditMode && savedToDisk) {
      // Give the workspace sync a moment to complete
      setTimeout(() => {
        navigate(projectId ? `/projects` : '/work-items');
      }, 100);
    } else {
      // For edits or items not saved to disk, navigate immediately
      if (isEditMode) {
        navigate('/work-items');
      } else {
        navigate(projectId ? `/projects` : '/work-items');
      }
    }
  };

  // The review content that will be rendered either with or without transition
  const reviewContent = (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${isEditMode ? 'h-full' : ''}`}>
      {/* Left Panel - General Details and Task List */}
      <div className={`lg:col-span-1 ${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} ${styles.cardShadow} p-4 flex flex-col ${isEditMode ? 'h-full' : ''}`}>
        {/* General Details Section */}
        <div className="mb-4">
          <button
            onClick={() => {
              // Mark as programmatic change to prevent save button from appearing
              isProgrammaticChange.current = true;
              
              // Update the task from markdown before switching (pass false for isUserEdit)
              if (selectedTaskId && editedContent) {
                updateTaskFromMarkdown(false);
              }
              
              setSelectedSection('general');
              setSelectedTaskId(null);
              
              // Reset the flag after a short delay
              setTimeout(() => {
                isProgrammaticChange.current = false;
              }, 100);
            }}
            className={`
              w-full text-left p-3 ${styles.buttonRadius} border
              ${selectedSection === 'general' && !selectedTaskId
                ? `${styles.primaryButton} ${styles.primaryButtonText} border-transparent` 
                : `${styles.contentBg} ${styles.contentBorder} ${styles.textColor} hover:opacity-80`
              }
              transition-none
            `}
          >
            <div className="font-medium">Work item description</div>
            <div className={`text-sm mt-1 ${selectedSection === 'general' && !selectedTaskId ? 'opacity-90' : styles.mutedText}`}>
              Overview and goals
            </div>
          </button>
        </div>
        
        <div className={`border-t pt-4 ${styles.contentBorder}`}>
          <h2 className={`text-lg font-semibold ${styles.headingColor} mb-4 flex-shrink-0`}>Tasks</h2>
        </div>
        
        <div className="space-y-2 overflow-y-auto flex-1 min-h-0">
          {tasks.map((task) => (
            <button
              key={task.id}
              onClick={() => {
                if (selectedTaskId !== task.id) {
                  // Mark as programmatic change to prevent save button from appearing
                  isProgrammaticChange.current = true;
                  
                  // Update the current task from markdown before switching (pass false for isUserEdit)
                  if (selectedTaskId && editedContent) {
                    updateTaskFromMarkdown(false);
                  }
                  
                  setSelectedSection('task');
                  setSelectedTaskId(task.id);
                  
                  // Reset the flag after a short delay
                  setTimeout(() => {
                    isProgrammaticChange.current = false;
                  }, 100);
                }
              }}
              className={`
                w-full text-left p-3 ${styles.buttonRadius} border
                ${selectedTaskId === task.id 
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
              <div className={`text-sm mt-1 ${selectedTaskId === task.id ? 'opacity-90' : styles.mutedText}`}>
                {(task.goals?.length || 0)} goals • {(task.validationCriteria?.length || 0)} criteria
              </div>
            </button>
          ))}
        </div>

        {/* Refinement Input - Only show in create mode */}
        {!isEditMode && (
          <div className="mt-6 pt-6 border-t flex-shrink-0" style={{ borderColor: styles.contentBorder }}>
          <h3 className={`text-sm font-medium ${styles.headingColor} mb-2`}>Refine the plan</h3>
          <textarea
            value={ideaText}
            onChange={(e) => setIdeaText(e.target.value)}
            onKeyDown={(e) => {
              if (e.ctrlKey && e.key === 'Enter' && ideaText.trim() && !isProcessing) {
                e.preventDefault();
                refineIdea();
              }
            }}
            className={`
              w-full px-3 py-2 text-sm ${styles.buttonRadius}
              ${styles.contentBg} ${styles.contentBorder} border ${styles.textColor}
              focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500
              resize-none
            `}
            rows={3}
            placeholder="Add more details or adjustments..."
          />
          <Button
            onClick={refineIdea}
            disabled={!ideaText.trim() || isProcessing}
            variant="primary"
            fullWidth
            className="mt-2"
          >
            {isProcessing ? (
              <>
                <InlineLoadingSpinner className="mr-2 inline-flex" variant="primary" />
                Refining...
              </>
            ) : (
              'Refine tasks'
            )}
          </Button>
        </div>
        )}
      </div>

      {/* Right Panel - Details View */}
      <div className={`lg:col-span-2 ${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} ${styles.cardShadow} flex flex-col overflow-hidden ${isEditMode ? 'h-full' : ''}`}>
        {selectedSection === 'general' && !selectedTaskId ? (
          // General Details View with MDXEditor
          <div className={`flex-1 min-h-0 ${isDarkMode ? 'mdx-dark' : 'mdx-light'} mdx-edge-to-edge flex flex-col`}>
              {generalMarkdown ? (
                <MDXEditor
                  key={`general-${editorKey}`}
                  markdown={generalMarkdown}
                  onChange={(value) => {
                    const newValue = value || '';
                    setGeneralMarkdown(newValue);
                    // Check if content actually changed from original (only for user changes)
                    if (isEditMode && !isProgrammaticChange.current && !isInitializing.current) {
                      // Only set hasChanges if originalGeneralMarkdown has been initialized
                      // and the new value is different
                      if (originalGeneralMarkdown !== undefined) {
                        setHasChanges(newValue !== originalGeneralMarkdown);
                      }
                    }
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
                        {isEditMode && (
                          <button
                            onClick={() => createOrUpdateWorkItems()}
                            className={`px-3 py-1 text-sm font-medium rounded transition-opacity ${
                              hasChanges 
                                ? 'opacity-100 bg-blue-600 hover:bg-blue-700 text-white' 
                                : 'opacity-0 pointer-events-none'
                            }`}
                            disabled={!hasChanges}
                          >
                            Save
                          </button>
                        )}
                      </div>
                    )
                  })
                ]}
              />
              ) : (
                <div className="p-4 text-center text-gray-500">
                  Loading description...
                </div>
              )}
          </div>
        ) : selectedTask ? (
          // Task Details View
          <div className={`flex-1 min-h-0 ${isDarkMode ? 'mdx-dark' : 'mdx-light'} mdx-edge-to-edge flex flex-col`}>
              <MDXEditor
                key={editorKey}
                markdown={editedContent}
                onChange={(value) => {
                  const newValue = value || '';
                  setEditedContent(newValue);
                  
                  // Only check for changes if this is a user edit
                  if (isEditMode && !isProgrammaticChange.current && !isInitializing.current && selectedTask) {
                    // Compare against the original content for this specific task
                    const originalContent = originalTaskContents[selectedTask.id];
                    const taskChanged = originalContent ? newValue.trim() !== originalContent.trim() : false;
                    
                    // Also check if general markdown changed
                    const generalChanged = generalMarkdown !== originalGeneralMarkdown;
                    
                    setHasChanges(taskChanged || generalChanged);
                  }
                }}
                onBlur={() => updateTaskFromMarkdown()}
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
                        {isEditMode && (
                          <button
                            onClick={() => createOrUpdateWorkItems()}
                            className={`px-3 py-1 text-sm font-medium rounded transition-opacity ${
                              hasChanges 
                                ? 'opacity-100 bg-blue-600 hover:bg-blue-700 text-white' 
                                : 'opacity-0 pointer-events-none'
                            }`}
                            disabled={!hasChanges}
                          >
                            Save
                          </button>
                        )}
                      </div>
                    )
                  })
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

  return (
    <div className={isEditMode ? "h-full flex flex-col" : "max-w-6xl mx-auto"}>
      {/* Header for create mode only */}
      {!isEditMode && (
        <div className="mb-6">
          <h1 className={`text-2xl font-bold ${styles.headingColor}`}>Create work item</h1>
          <p className={`mt-2 ${styles.mutedText}`}>
            Describe your idea and let Claude help break it down into actionable tasks
          </p>
        </div>
      )}

      {/* Step 1: Idea Input - Skip in edit mode */}
      <DropdownTransition isOpen={!isEditMode && step === 'input'}>
        <div className={`${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} ${styles.cardShadow} p-8`}>
          <div className="max-w-2xl mx-auto">
            <h2 className={`text-lg font-semibold ${styles.headingColor} mb-4`}>
              What would you like to work on?
            </h2>
            
            {/* Project selector or display */}
            {!isEditMode && (
              <div className="mb-4">
                <label htmlFor="project-select" className={`block text-sm font-medium ${styles.textColor} mb-2`}>
                  Project
                </label>
                {(projectId || projects.length === 1) ? (
                  // Show project name as read-only when predetermined
                  <div className={`
                    w-full px-3 py-2 ${styles.buttonRadius}
                    ${styles.contentBg} ${styles.contentBorder} border ${styles.textColor}
                    opacity-75 cursor-not-allowed
                  `}>
                    {currentProject?.name || projects[0]?.name || 'Unknown project'}
                  </div>
                ) : (
                  // Show dropdown when user needs to select
                  <select
                    id="project-select"
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className={`
                      w-full px-3 py-2 ${styles.buttonRadius}
                      ${styles.contentBg} ${styles.contentBorder} border ${styles.textColor}
                      focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500
                    `}
                    required
                  >
                    <option value="">Choose a project...</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
            
            <textarea
              value={ideaText}
              onChange={(e) => setIdeaText(e.target.value)}
              className={`
                w-full px-4 py-3 ${styles.buttonRadius}
                ${styles.contentBg} ${styles.contentBorder} border ${styles.textColor}
                focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500
                resize-none
              `}
              rows={6}
              placeholder="Describe your idea in detail. For example: 'I need a feature that allows users to export their work items as PDF reports with custom formatting options...'"
              autoFocus
            />

            {error && (
              <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-md">
                <div className="text-red-800 dark:text-red-200 whitespace-pre-wrap">
                  {error}
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <Button
                onClick={() => navigate(projectId ? '/projects' : '/work-items')}
                variant="secondary"
              >
                Cancel
              </Button>
              <Button
                onClick={processIdea}
                disabled={!ideaText.trim() || isProcessing || (!projectId && !isEditMode && !selectedProjectId)}
                variant="primary"
                className="min-w-[180px]"
              >
                {isProcessing ? (
                  <>
                    <InlineLoadingSpinner className="mr-2 inline-flex" variant="primary" />
                    Processing...
                  </>
                ) : (
                  'Process'
                )}
              </Button>
            </div>
          </div>
        </div>
      </DropdownTransition>

      {/* Step 2: Review Tasks - Always show in edit mode */}
      {isEditMode ? (
        // No transition for edit mode - render directly
        <div className="flex-1 flex flex-col">
          {reviewContent}
        </div>
      ) : (
        // Use transition for create mode
        <DropdownTransition isOpen={step === 'review'}>
          {reviewContent}
        </DropdownTransition>
      )}

      {/* Action Buttons - only for create mode */}
      {!isEditMode && (
        <DropdownTransition isOpen={step === 'review'}>
          <div className="mt-6 flex justify-end gap-3">
            <Button
              onClick={resetToInput}
              variant="secondary"
            >
              Back
            </Button>
            <Button
              onClick={createOrUpdateWorkItems}
              variant="primary"
            >
              Create work item
            </Button>
          </div>
        </DropdownTransition>
      )}
    </div>
  );
}