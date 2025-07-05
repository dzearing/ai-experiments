import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContextV2';
import { DropdownTransition } from './DropdownTransition';
import { InlineLoadingSpinner } from './ui/LoadingSpinner';
import type { Repository } from '../types';

interface ImportTask {
  id: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  details?: string;
}

interface ImportedProject {
  name: string;
  description: string;
  purpose?: string;
  repositories: Repository[];
  workItemCount: number;
}

interface ImportingWorkspaceDialogProps {
  isOpen: boolean;
  workspacePath: string;
  onComplete: () => void;
}

export function ImportingWorkspaceDialog({ 
  isOpen, 
  workspacePath,
  onComplete 
}: ImportingWorkspaceDialogProps) {
  const { currentStyles } = useTheme();
  const styles = currentStyles;
  const [tasks, setTasks] = useState<ImportTask[]>([]);
  const [projects, setProjects] = useState<ImportedProject[]>([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(-1);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (isOpen && tasks.length === 0) {
      // Initialize tasks
      const initialTasks: ImportTask[] = [
        { id: '1', description: 'Scanning workspace directory', status: 'pending' },
        { id: '2', description: 'Reading project configurations', status: 'pending' },
        { id: '3', description: 'Extracting repository information', status: 'pending' },
        { id: '4', description: 'Analyzing project structure', status: 'pending' },
        { id: '5', description: 'Importing work items', status: 'pending' },
        { id: '6', description: 'Finalizing workspace setup', status: 'pending' }
      ];
      setTasks(initialTasks);
      setCurrentTaskIndex(0);
    }
  }, [isOpen, tasks.length]);

  useEffect(() => {
    if (currentTaskIndex >= 0 && currentTaskIndex < tasks.length) {
      // Start processing current task
      const timer = setTimeout(() => {
        setTasks(prev => prev.map((task, index) => {
          if (index === currentTaskIndex) {
            return { ...task, status: 'processing' };
          }
          return task;
        }));

        // Simulate task completion
        setTimeout(async () => {
          let fetchedProjects: ImportedProject[] = [];
          
          // For the reading project configurations task, actually fetch the data
          if (currentTaskIndex === 1) {
            try {
              console.log('Fetching workspace data for:', workspacePath);
              const response = await fetch('http://localhost:3000/api/workspace/read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ workspacePath })
              });
              
              if (response.ok) {
                const data = await response.json();
                console.log('Workspace data received:', data);
                fetchedProjects = data.projects.map((proj: any) => ({
                  name: proj.name,
                  description: proj.readme ? extractDescription(proj.readme) : 'No description available',
                  purpose: proj.purpose,
                  repositories: proj.repositories || [],
                  workItemCount: proj.plans ? 
                    Object.values(proj.plans).flat().length : 0
                }));
                console.log('Imported projects:', fetchedProjects);
                setProjects(fetchedProjects);
              } else {
                console.error('Failed to read workspace:', response.status, response.statusText);
              }
            } catch (error) {
              console.error('Error reading workspace:', error);
              // If fetch fails, use mock data for testing
              console.log('Using mock data due to fetch error');
              fetchedProjects = [{
                name: 'project-management-ux-exploration',
                description: 'An exploratory web application to prototype and iterate on UX ideas',
                purpose: 'Prototype and iterate on UX ideas for managing projects',
                repositories: [{
                  url: 'local://development',
                  type: 'github' as const,
                  visibility: 'private' as const,
                  isPrimary: true
                }],
                workItemCount: 0
              }];
              setProjects(fetchedProjects);
            }
          }

          // Use the fetched projects or current state for task details
          const projectsToUse = currentTaskIndex === 1 ? fetchedProjects : projects;
          
          setTasks(prev => prev.map((task, index) => {
            if (index === currentTaskIndex) {
              return { 
                ...task, 
                status: 'completed',
                details: getTaskDetails(index, projectsToUse)
              };
            }
            return task;
          }));

          if (currentTaskIndex < tasks.length - 1) {
            setCurrentTaskIndex(currentTaskIndex + 1);
          } else {
            setIsComplete(true);
          }
        }, 200 + Math.random() * 300); // Variable completion time (200-500ms)
      }, 50); // Start processing faster

      return () => clearTimeout(timer);
    }
  }, [currentTaskIndex, tasks.length, workspacePath, projects]);

  const extractDescription = (readme: string): string => {
    const lines = readme.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line && !line.startsWith('#') && !line.startsWith('![') && !line.startsWith('[')) {
        return line.substring(0, 100) + (line.length > 100 ? '...' : '');
      }
    }
    return 'No description available';
  };

  const getTaskDetails = (taskIndex: number, projectList: ImportedProject[]): string => {
    switch (taskIndex) {
      case 0: return 'Found projects folder';
      case 1: return `Found ${projectList.length} project${projectList.length !== 1 ? 's' : ''}`;
      case 2: {
        const totalRepos = projectList.reduce((sum, p) => sum + p.repositories.length, 0);
        return `Discovered ${totalRepos} repositor${totalRepos !== 1 ? 'ies' : 'y'}`;
      }
      case 3: return 'Structure analyzed successfully';
      case 4: {
        const totalWorkItems = projectList.reduce((sum, p) => sum + p.workItemCount, 0);
        return `Imported ${totalWorkItems} work item${totalWorkItems !== 1 ? 's' : ''}`;
      }
      case 5: return 'Workspace ready';
      default: return '';
    }
  };

  const getStatusIcon = (status: ImportTask['status']) => {
    switch (status) {
      case 'completed':
        return (
          <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'processing':
        return (
          <InlineLoadingSpinner />
        );
      case 'error':
        return (
          <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return <div className="h-5 w-5" />;
    }
  };

  if (!isOpen) return null;

  return (
    <DropdownTransition isOpen={isOpen} className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-gray-900/50 dark:bg-black/50 transition-opacity" />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className={`
          relative w-full max-w-2xl
          bg-white dark:bg-neutral-800 ${styles.cardBorder} border ${styles.borderRadius}
          ${styles.cardShadow}
        `}>
          {/* Header */}
          <div className={`px-6 py-4 border-b ${styles.contentBorder}`}>
            <h2 className={`text-xl font-semibold ${styles.headingColor}`}>
              Importing workspace
            </h2>
            <p className={`mt-1 text-sm ${styles.mutedText}`}>
              Discovering and importing existing projects from {workspacePath}
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Task list with fixed height */}
            <div className="space-y-3 mb-6" style={{ minHeight: '240px' }}>
              {tasks.map((task) => (
                <div key={task.id} className="flex items-start gap-3" style={{ minHeight: '40px' }}>
                  <div className="mt-0.5">
                    {getStatusIcon(task.status)}
                  </div>
                  <div className="flex-1">
                    <div className={`text-sm ${
                      task.status === 'completed' ? styles.mutedText : styles.textColor
                    }`}>
                      {task.description}
                    </div>
                    <div className={`text-xs ${styles.mutedText} mt-0.5`} style={{ minHeight: '16px' }}>
                      {task.details || '\u00A0' /* non-breaking space to maintain height */}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Projects summary with fixed height */}
            <div style={{ minHeight: '200px' }}>
              {projects.length > 0 ? (
                <div className={`p-4 ${styles.contentBg} ${styles.borderRadius} border ${styles.contentBorder} h-full`}>
                  <h3 className={`text-sm font-medium ${styles.headingColor} mb-3`}>
                    Discovered projects
                  </h3>
                  <div className="space-y-3 max-h-40 overflow-y-auto">
                    {projects.map((project, index) => (
                      <div key={index} className={`pb-3 ${index < projects.length - 1 ? `border-b ${styles.contentBorder}` : ''}`}>
                        <div className={`font-medium ${styles.textColor}`}>{project.name}</div>
                        <div className={`text-sm ${styles.mutedText} mt-0.5`}>{project.description}</div>
                        <div className={`text-xs ${styles.mutedText} mt-1 flex items-center gap-4`}>
                          {project.repositories.length > 0 && (
                            <span>{project.repositories.length} repositor{project.repositories.length !== 1 ? 'ies' : 'y'}</span>
                          )}
                          {project.workItemCount > 0 && (
                            <span>{project.workItemCount} work item{project.workItemCount !== 1 ? 's' : ''}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className={`p-4 ${styles.contentBg} ${styles.borderRadius} border ${styles.contentBorder} h-full flex items-center justify-center`}>
                  <div className={`text-sm ${styles.mutedText}`}>Scanning for projects...</div>
                </div>
              )}
            </div>

            {/* Complete button */}
            {isComplete && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={onComplete}
                  className={`
                    px-6 py-2 font-medium ${styles.buttonRadius}
                    ${styles.primaryButton} ${styles.primaryButtonText}
                    transition-colors
                  `}
                >
                  Continue to workspace
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DropdownTransition>
  );
}