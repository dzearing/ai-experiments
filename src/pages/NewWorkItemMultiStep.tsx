import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContextV2';
import { useApp } from '../contexts/AppContext';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

interface Task {
  id: string;
  title: string;
  description: string;
  goals: string[];
  workDescription: string;
  validationCriteria: string[];
}

export function NewWorkItemMultiStep() {
  const navigate = useNavigate();
  const { currentStyles, isDarkMode } = useTheme();
  const { createWorkItem } = useApp();
  const styles = currentStyles;

  const [step, setStep] = useState<'input' | 'review'>('input');
  const [ideaText, setIdeaText] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mockMode, setMockMode] = useState(() => {
    const saved = localStorage.getItem('mockMode');
    return saved ? JSON.parse(saved) : true;
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
  const [editedContent, setEditedContent] = useState<string>('');

  // Update edited content when task selection changes
  useEffect(() => {
    if (selectedTask) {
      // Format the task as markdown
      const markdown = `## Description
${selectedTask.description}

## Goals
${selectedTask.goals.map(goal => `- ${goal}`).join('\n')}

## Work Description
${selectedTask.workDescription}

## Validation Criteria
${selectedTask.validationCriteria.map(criteria => `- ${criteria}`).join('\n')}`;
      
      setEditedContent(markdown);
    }
  }, [selectedTaskId, selectedTask]);

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
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setTasks(data.tasks);
      setSelectedTaskId(data.tasks[0]?.id || null);
      setStep('review');
      setIdeaText(''); // Clear for refinements
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
        throw new Error('Failed to refine tasks');
      }

      const data = await response.json();
      setTasks(data.tasks);
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

  const createWorkItems = () => {
    // Convert tasks to work items and add them
    tasks.forEach(task => {
      // If this is the selected task, use the edited content
      const isSelectedTask = task.id === selectedTaskId;
      const taskContent = isSelectedTask ? editedContent : `## Description\n${task.description}\n\n## Goals\n${task.goals.map(goal => `- ${goal}`).join('\n')}\n\n## Work Description\n${task.workDescription}\n\n## Validation Criteria\n${task.validationCriteria.map(criteria => `- ${criteria}`).join('\n')}`;

      createWorkItem({
        title: task.title,
        description: taskContent,
        priority: 'medium',
        status: 'planned',
        projectId: '', // User can assign to project later
        assignedPersonaIds: [],
        workflow: [
          { name: 'Planning', status: 'completed' },
          { name: 'Development', status: 'pending' },
          { name: 'Testing', status: 'pending' },
          { name: 'Review', status: 'pending' }
        ],
        currentWorkflowStep: 0
      });
    });

    navigate('/work-items');
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${styles.headingColor}`}>Create work items with AI</h1>
        <p className={`mt-2 ${styles.mutedText}`}>
          Describe your idea and let Claude help break it down into actionable tasks
        </p>
      </div>

      {/* Step 1: Idea Input */}
      {step === 'input' && (
        <div className={`${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} ${styles.cardShadow} p-8`}>
          <div className="max-w-2xl mx-auto">
            <h2 className={`text-lg font-semibold ${styles.headingColor} mb-4`}>
              What would you like to work on?
            </h2>
            
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
              <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded text-red-800">
                {error}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => navigate('/work-items')}
                className={`
                  px-4 py-2 ${styles.buttonRadius}
                  ${styles.contentBg} ${styles.contentBorder} border ${styles.textColor}
                  hover:opacity-80 transition-opacity
                `}
              >
                Cancel
              </button>
              <button
                onClick={processIdea}
                disabled={!ideaText.trim() || isProcessing}
                className={`
                  px-6 py-2 ${styles.buttonRadius}
                  ${styles.primaryButton} ${styles.primaryButtonText}
                  ${styles.primaryButtonHover} transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center gap-2
                `}
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle 
                        className="opacity-25" 
                        cx="12" 
                        cy="12" 
                        r="10" 
                        stroke="currentColor" 
                        strokeWidth="4"
                        fill="none"
                      />
                      <path 
                        className="opacity-75" 
                        fill="currentColor" 
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing with Claude...
                  </>
                ) : (
                  'Process with Claude'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Review Tasks */}
      {step === 'review' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Task List */}
          <div className={`lg:col-span-1 ${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} ${styles.cardShadow} p-4`}>
            <h2 className={`text-lg font-semibold ${styles.headingColor} mb-4`}>Generated Tasks</h2>
            
            <div className="space-y-2">
              {tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  className={`
                    w-full text-left p-3 ${styles.buttonRadius}
                    ${selectedTaskId === task.id 
                      ? `${styles.primaryButton} ${styles.primaryButtonText}` 
                      : `${styles.contentBg} ${styles.contentBorder} border ${styles.textColor} hover:opacity-80`
                    }
                    transition-colors
                  `}
                >
                  <div className="font-medium">{task.title}</div>
                  <div className={`text-sm mt-1 ${selectedTaskId === task.id ? 'opacity-90' : styles.mutedText}`}>
                    {task.goals.length} goals • {task.validationCriteria.length} criteria
                  </div>
                </button>
              ))}
            </div>

            {/* Refinement Input */}
            <div className="mt-6 pt-6 border-t" style={{ borderColor: styles.contentBorder }}>
              <h3 className={`text-sm font-medium ${styles.headingColor} mb-2`}>Refine the plan</h3>
              <textarea
                value={ideaText}
                onChange={(e) => setIdeaText(e.target.value)}
                className={`
                  w-full px-3 py-2 text-sm ${styles.buttonRadius}
                  ${styles.contentBg} ${styles.contentBorder} border ${styles.textColor}
                  focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500
                  resize-none
                `}
                rows={3}
                placeholder="Add more details or adjustments..."
              />
              <button
                onClick={refineIdea}
                disabled={!ideaText.trim() || isProcessing}
                className={`
                  mt-2 w-full px-3 py-1.5 text-sm ${styles.buttonRadius}
                  ${styles.contentBg} ${styles.contentBorder} border ${styles.textColor}
                  hover:opacity-80 transition-opacity
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {isProcessing ? 'Refining...' : 'Refine with Claude'}
              </button>
            </div>
          </div>

          {/* Task Details */}
          <div className={`lg:col-span-2 ${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} ${styles.cardShadow} p-6`}>
            {selectedTask ? (
              <>
                <h2 className={`text-xl font-semibold ${styles.headingColor} mb-6`}>
                  {selectedTask.title}
                </h2>
                
                <div className="h-[calc(100vh-16rem)]" data-color-mode={isDarkMode ? 'dark' : 'light'}>
                  <MDEditor
                    value={editedContent}
                    onChange={(value) => setEditedContent(value || '')}
                    height="100%"
                    preview="edit"
                    hideToolbar={false}
                    visibleDragbar={false}
                  />
                </div>
              </>
            ) : (
              <div className={`text-center ${styles.mutedText}`}>
                Select a task to view details
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {step === 'review' && (
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => setStep('input')}
            className={`
              px-4 py-2 ${styles.buttonRadius}
              ${styles.contentBg} ${styles.contentBorder} border ${styles.textColor}
              hover:opacity-80 transition-opacity
            `}
          >
            Start Over
          </button>
          <button
            onClick={createWorkItems}
            className={`
              px-6 py-2 ${styles.buttonRadius}
              ${styles.primaryButton} ${styles.primaryButtonText}
              ${styles.primaryButtonHover} transition-colors
            `}
          >
            Create {tasks.length} Work Item{tasks.length !== 1 ? 's' : ''}
          </button>
        </div>
      )}
    </div>
  );
}