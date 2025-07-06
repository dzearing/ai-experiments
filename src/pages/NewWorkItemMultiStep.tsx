import { useState, useEffect, useTransition } from 'react';
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
  const { setHeaderTitle } = useLayout();
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
    isProcessing,
    setIsProcessing,
    error,
    setError,
    resetToInput,
  } = useNewWorkItem();
  
  // Add local state for immediate UI response
  const [_isPending, startTransition] = useTransition();
  const [editorKey, setEditorKey] = useState(0);
  
  // State for what's selected in review step
  const [selectedSection, setSelectedSection] = useState<'general' | 'task'>('general');
  
  // State for general markdown content
  const [generalMarkdown, setGeneralMarkdown] = useState<string>('');
  
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

  // Update header title when project changes
  useEffect(() => {
    if (currentProject) {
      setHeaderTitle(currentProject.name);
    } else {
      setHeaderTitle(null); // Let the layout use default logic
    }
    
    // Clean up on unmount
    return () => {
      setHeaderTitle(null);
    };
  }, [currentProject, setHeaderTitle]);

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
  const updateTaskFromMarkdown = () => {
    if (selectedTaskId && editedContent) {
      const parsedTask = parseTaskFromMarkdown(editedContent);
      setTasks(tasks.map(task => 
        task.id === selectedTaskId 
          ? { ...task, ...parsedTask }
          : task
      ));
    }
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
      tasksLength: existingWorkItem?.metadata?.tasks?.length
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
      if (existingWorkItem.metadata?.generalMarkdown) {
        setGeneralMarkdown(existingWorkItem.metadata.generalMarkdown);
      } else {
        // Create default general markdown from existing data
        const defaultMarkdown = `### Description

${existingWorkItem.description || 'No description provided'}

### Overall goals

- [ ] Complete all tasks successfully
- [ ] Meet project requirements`;
        setGeneralMarkdown(defaultMarkdown);
      }
      
      // Start at review step for editing
      setStep('review');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workItemId]); // Only re-run when the work item ID changes

  // Update edited content when task selection changes
  useEffect(() => {
    if (selectedTask) {
      // Format the task as markdown immediately
      const markdown = `## Description
${selectedTask.description || 'No description'}

## Goals
${(selectedTask.goals || []).map(goal => `- ${goal}`).join('\n') || '- No goals defined'}

## Work Description
${selectedTask.workDescription || 'No work description'}

## Validation Criteria
${(selectedTask.validationCriteria || []).map(criteria => `- ${criteria}`).join('\n') || '- No criteria defined'}`;
      
      setEditedContent(markdown);
      
      // Force MDXEditor to recreate with new content
      startTransition(() => {
        setEditorKey(prev => prev + 1);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTaskId, tasks]); // Depend on selectedTaskId and tasks since selectedTask is derived from both

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
        } catch (parseError) {
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
      updateTaskFromMarkdown();
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

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${styles.headingColor}`}>{isEditMode ? 'Edit work item' : 'Create work item'}</h1>
        <p className={`mt-2 ${styles.mutedText}`}>
          {isEditMode 
            ? `Editing: ${existingWorkItem?.title || 'Work item'}`
            : 'Describe your idea and let Claude help break it down into actionable tasks'
          }
        </p>
      </div>

      {/* Step 1: Idea Input */}
      <DropdownTransition isOpen={step === 'input'}>
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

      {/* Step 2: Review Tasks */}
      <DropdownTransition isOpen={step === 'review'}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ maxHeight: 'calc(100vh - 20rem)' }}>
          {/* Left Panel - General Details and Task List */}
          <div className={`lg:col-span-1 ${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} ${styles.cardShadow} p-4 flex flex-col`} style={{ maxHeight: 'calc(100vh - 20rem)' }}>
            {/* General Details Section */}
            <div className="mb-4">
              <button
                onClick={() => {
                  setSelectedSection('general');
                  setSelectedTaskId(null);
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
                      setSelectedSection('task');
                      setSelectedTaskId(task.id);
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

            {/* Refinement Input */}
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
          </div>

          {/* Right Panel - Details View */}
          <div className={`lg:col-span-2 ${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} ${styles.cardShadow} flex flex-col overflow-hidden`} style={{ maxHeight: 'calc(100vh - 20rem)' }}>
            {selectedSection === 'general' && !selectedTaskId ? (
              // General Details View with MDXEditor
              <>
                <div className={`px-4 py-2 border-b ${styles.contentBorder} flex-shrink-0`}>
                  <h3 className={`font-medium ${styles.headingColor}`}>
                    {tasks.length > 0 ? tasks[0].title : 'Work item'}
                  </h3>
                </div>
                <div className={`flex-1 min-h-0 ${isDarkMode ? 'mdx-dark' : 'mdx-light'} mdx-edge-to-edge flex flex-col`}>
                  <MDXEditor
                    key={`general-${editorKey}`}
                    markdown={generalMarkdown}
                    onChange={(value) => setGeneralMarkdown(value || '')}
                    contentEditableClassName="prose prose-neutral dark:prose-invert max-w-none p-4"
                    plugins={[
                      headingsPlugin(),
                      listsPlugin(),
                      quotePlugin(),
                      thematicBreakPlugin(),
                      markdownShortcutPlugin(),
                      toolbarPlugin({
                        toolbarContents: () => (
                          <>
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
                          </>
                        )
                      })
                    ]}
                  />
                </div>
              </>
            ) : selectedTask ? (
              // Task Details View
              <>
                <div className={`px-4 py-2 border-b ${styles.contentBorder} flex-shrink-0`}>
                  <h3 className={`font-medium ${styles.headingColor}`}>
                    {selectedTask.taskNumber && <span className="font-mono">{selectedTask.taskNumber}. </span>}
                    {selectedTask.title}
                  </h3>
                </div>
                <div className={`flex-1 min-h-0 ${isDarkMode ? 'mdx-dark' : 'mdx-light'} mdx-edge-to-edge flex flex-col`}>
                  <MDXEditor
                    key={editorKey}
                    markdown={editedContent}
                    onChange={(value) => setEditedContent(value || '')}
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
                          <>
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
                          </>
                        )
                      })
                    ]}
                  />
                </div>
              </>
            ) : (
              <div className={`text-center ${styles.mutedText} p-6`}>
                Select an item to view details
              </div>
            )}
          </div>
        </div>
      </DropdownTransition>

      {/* Action Buttons */}
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
            {isEditMode ? 'Update work item' : 'Create work item'}
          </Button>
        </div>
      </DropdownTransition>
    </div>
  );
}