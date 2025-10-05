import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContextV2';
import { useApp } from '../contexts/AppContext';
import { Button } from '../components/ui/Button';
import { InlineLoadingSpinner } from '../components/ui/LoadingSpinner';

export function NewWorkItemIdea() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId?: string }>();
  const { currentStyles } = useTheme();
  const { projects, createWorkItem } = useApp();
  const styles = currentStyles;

  const [ideaText, setIdeaText] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    projectId || (projects.length === 1 ? projects[0].id : '')
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentProject = projectId
    ? projects.find((p) => p.id === projectId)
    : selectedProjectId
      ? projects.find((p) => p.id === selectedProjectId)
      : undefined;

  const [mockMode] = useState(() => {
    const saved = localStorage.getItem('mockMode');
    return saved ? JSON.parse(saved) : false;
  });

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
          const errorMessage =
            errorData.details ||
            errorData.error ||
            `Server responded with ${response.status}: ${response.statusText}`;
          const suggestion = errorData.suggestion;

          if (suggestion) {
            throw new Error(`${errorMessage}\n\n${suggestion}`);
          } else {
            throw new Error(errorMessage);
          }
        } catch {
          throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
        }
      }

      const data = await response.json();

      // Create a temporary work item with the processed data
      const workItem = createWorkItem({
        title: data.generalMarkdown?.match(/^#\s+(.+)$/m)?.[1] || 'New Work Item',
        description: ideaText,
        priority: 'high',
        status: 'planned',
        projectId: projectId || selectedProjectId,
        assignedPersonaIds: [],
        workflow: [
          { name: 'Planning', status: 'completed' },
          { name: 'Development', status: 'pending' },
          { name: 'Testing', status: 'pending' },
          { name: 'Review', status: 'pending' },
        ],
        currentWorkflowStep: 0,
        metadata: {
          tasks: data.tasks,
          currentTaskIndex: 0,
          generalMarkdown: data.generalMarkdown,
          taskMarkdownContents: {},
        },
      });

      // Navigate to the plan page with the work item ID
      navigate(`/work-items/${workItem.id}/plan`);
    } catch (err) {
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        setError(
          'Cannot connect to server. Please ensure the server is running on port 3000.'
        );
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-full flex items-center justify-center">
      <div className="w-full max-w-2xl px-8">
        <div
          className={`${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} ${styles.cardShadow} p-8`}
        >
          <h2 className={`text-2xl font-bold ${styles.headingColor} mb-2`}>
            Create work item
          </h2>
          <p className={`mb-6 ${styles.mutedText}`}>
            Describe your idea and let Claude help break it down into actionable tasks
          </p>

          {/* Project selector or display */}
          <div className="mb-4">
            <label
              htmlFor="project-select"
              className={`block text-sm font-medium ${styles.textColor} mb-2`}
            >
              Project
            </label>
            {projectId || projects.length === 1 ? (
              <div
                className={`
                  w-full px-3 py-2 ${styles.buttonRadius}
                  ${styles.contentBg} ${styles.contentBorder} border ${styles.textColor}
                  opacity-75 cursor-not-allowed
                `}
              >
                {currentProject?.name || projects[0]?.name || 'Unknown project'}
              </div>
            ) : (
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
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="mb-4">
            <label
              htmlFor="idea-input"
              className={`block text-sm font-medium ${styles.textColor} mb-2`}
            >
              What would you like to work on?
            </label>
            <textarea
              id="idea-input"
              value={ideaText}
              onChange={(e) => setIdeaText(e.target.value)}
              className={`
                w-full px-4 py-3 ${styles.buttonRadius}
                ${styles.contentBg} ${styles.contentBorder} border ${styles.textColor}
                focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500
                resize-none
              `}
              rows={8}
              placeholder="Describe your idea in detail. For example: 'I need a feature that allows users to export their work items as PDF reports with custom formatting options...'"
              autoFocus
            />
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-md">
              <div className="text-red-800 dark:text-red-200 whitespace-pre-wrap">{error}</div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              onClick={() => navigate(projectId ? `/projects/${projectId}` : '/work-items')}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={processIdea}
              disabled={
                !ideaText.trim() ||
                isProcessing ||
                (!projectId && !selectedProjectId)
              }
              variant="primary"
              className="min-w-[180px]"
            >
              {isProcessing ? (
                <>
                  <InlineLoadingSpinner className="mr-2 inline-flex" variant="primary" />
                  Processing...
                </>
              ) : (
                'Create plan'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
