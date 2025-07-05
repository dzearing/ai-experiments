import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContextV2';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/ui/Button';
import { IconButton } from '../components/ui/IconButton';
import { ProjectDeleteDialog } from '../components/ProjectDeleteDialog';
import type { Project } from '../types';

export function Projects() {
  const { projects } = useApp();
  const { currentStyles } = useTheme();
  const { workspace, isLoadingWorkspace } = useWorkspace();
  const { showToast } = useToast();
  const styles = currentStyles;
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return styles.successText;
      case 'planned': return styles.textColor;
      case 'completed': return styles.mutedText;
      case 'on-hold': return styles.warningText;
      default: return styles.textColor;
    }
  };
  
  const getRepoTypeIcon = (type: 'github' | 'ado') => {
    if (type === 'github') {
      return (
        <svg className="h-4 w-4 dark:fill-white fill-black" viewBox="0 0 16 16">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
        </svg>
      );
    }
    return (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    );
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className={`text-2xl font-bold ${styles.headingColor}`}>Projects</h1>
          <p className={`mt-1 ${styles.mutedText}`}>
            Manage and track all your projects in one place.
          </p>
        </div>
        {projects.length > 0 && (
          <Button as={Link} to="/projects/new" variant="primary">
            Add project
          </Button>
        )}
      </div>
      
      {isLoadingWorkspace ? (
        <div className={`
          ${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius}
          ${styles.cardShadow} p-12 text-center
        `}>
          <div className="animate-pulse mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full mx-auto mb-4"></div>
            <div className="h-2 bg-neutral-300 dark:bg-neutral-700 rounded w-32 mx-auto mb-2"></div>
            <div className="h-2 bg-neutral-300 dark:bg-neutral-700 rounded w-24 mx-auto"></div>
          </div>
          <p className={`${styles.textColor} font-medium`}>Loading projects...</p>
          <p className={`${styles.mutedText} text-sm mt-2`}>Fetching your project information</p>
        </div>
      ) : projects.length === 0 ? (
        <div className={`
          ${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius}
          ${styles.cardShadow} p-12 text-center
        `}>
          <svg className={`mx-auto h-12 w-12 ${styles.mutedText}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <h3 className={`mt-4 text-lg font-medium ${styles.headingColor}`}>No projects yet</h3>
          <p className={`mt-2 ${styles.mutedText}`}>Get started by creating your first project.</p>
          <div className="mt-6">
            <Button as={Link} to="/projects/new" variant="primary">
              Add project
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {projects.map(project => {
            const primaryRepo = project.repositories?.find(r => r.isPrimary) || project.repositories?.[0];
            
            return (
              <div
                key={project.id}
                className={`
                  ${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius}
                  ${styles.cardShadow} p-6
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className={`text-lg font-semibold ${styles.headingColor}`}>
                        {project.name}
                      </h3>
                      <span className={`text-sm font-medium ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                    </div>
                    
                    <p className={`mt-2 ${styles.textColor}`}>{project.description}</p>
                    
                    {project.purpose && (
                      <p className={`mt-2 text-sm ${styles.mutedText}`}>
                        <span className="font-medium">Purpose:</span> {project.purpose}
                      </p>
                    )}
                    
                    {/* Repository Links */}
                    {project.repositories && project.repositories.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-3">
                        {project.repositories.map((repo, index) => {
                          // Skip local development repos
                          if (repo.url.startsWith('local://')) {
                            return (
                              <div key={index} className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm ${styles.contentBg} ${styles.contentBorder} border ${styles.borderRadius}`}>
                                {getRepoTypeIcon(repo.type)}
                                <span className={styles.mutedText}>Local development</span>
                                {repo.isPrimary && (
                                  <span className={`px-1.5 py-0.5 text-xs ${styles.primaryButton} ${styles.primaryButtonText} rounded`}>
                                    Primary
                                  </span>
                                )}
                              </div>
                            );
                          }
                          
                          return (
                            <a
                              key={index}
                              href={repo.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm ${styles.contentBg} ${styles.contentBorder} border ${styles.borderRadius} hover:opacity-80 transition-opacity`}
                            >
                              {getRepoTypeIcon(repo.type)}
                              <span className="text-blue-600 dark:text-blue-400">
                                {repo.url.split('/').slice(-2).join('/').replace(/\.git$/, '')}
                              </span>
                              {repo.visibility === 'public' && (
                                <span className={`text-xs ${styles.mutedText}`}>(Public)</span>
                              )}
                              {repo.isPrimary && (
                                <span className={`px-1.5 py-0.5 text-xs ${styles.primaryButton} ${styles.primaryButtonText} rounded`}>
                                  Primary
                                </span>
                              )}
                              <svg className="h-3 w-3 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          );
                        })}
                      </div>
                    )}
                    
                    <div className="mt-4 flex items-center gap-6 text-sm">
                      {project.workItems && project.workItems.length > 0 && (
                        <div className={`flex items-center gap-2 ${styles.mutedText}`}>
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                          </svg>
                          <span>{project.workItems.length} work items</span>
                        </div>
                      )}
                      
                      <div className={`flex items-center gap-2 ${styles.mutedText}`}>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="mt-4 flex items-center gap-3">
                      <Button 
                        as={Link} 
                        to={`/projects/${project.id}/workitems/new`}
                        variant="secondary"
                        size="sm"
                      >
                        Create workitem
                      </Button>
                      {primaryRepo && !primaryRepo.url.startsWith('local://') && (
                        <Button
                          as="a"
                          href={primaryRepo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          variant="secondary"
                          size="sm"
                        >
                          Go to GitHub
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <IconButton aria-label="Edit project" variant="secondary">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </IconButton>
                    <IconButton 
                      aria-label="Delete project" 
                      variant="secondary"
                      onClick={() => {
                        setDeleteProject(project);
                        setShowDeleteDialog(true);
                      }}
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </IconButton>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <ProjectDeleteDialog
        isOpen={showDeleteDialog}
        project={deleteProject}
        onConfirm={async (_, removeFolder) => {
          try {
            // Call the server to hide or remove the project
            const workspacePath = workspace?.config?.path;
            const endpoint = removeFolder ? 'remove' : 'hide';
            // Use the project name as the identifier for the server
            const projectName = deleteProject?.name || '';
            const response = await fetch(`http://localhost:3000/api/projects/${encodeURIComponent(projectName)}/${endpoint}?workspacePath=${encodeURIComponent(workspacePath || '')}`, {
              method: 'POST',
            });
            
            if (!response.ok) {
              throw new Error(removeFolder ? 'Failed to remove project' : 'Failed to hide project');
            }
            
            // Close dialog and refresh projects
            setShowDeleteDialog(false);
            setDeleteProject(null);
            
            showToast(
              removeFolder ? 'Project removed successfully' : 'Project hidden successfully', 
              'success'
            );
            
            // TODO: Refresh projects list or trigger workspace sync
            window.location.reload(); // Temporary solution
          } catch (error) {
            console.error('Error hiding project:', error);
            showToast(
              removeFolder ? 'Failed to remove project' : 'Failed to hide project', 
              'error'
            );
          }
        }}
        onCancel={() => {
          setShowDeleteDialog(false);
          setDeleteProject(null);
        }}
      />
    </div>
  );
}