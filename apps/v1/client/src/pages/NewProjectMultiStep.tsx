import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContextV2';
import { useApp } from '../contexts/AppContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/ui/Button';
import { AnimatedTransition } from '../components/AnimatedTransition';
import type { Project } from '../types';

type ProjectType = 'new' | 'github';

interface ProjectFormData {
  type: ProjectType;
  name: string;
  description: string;
  purpose: string;
  status: Project['status'];
  githubUrl?: string;
  repositories: {
    url: string;
    type: 'github' | 'ado';
    visibility: 'public' | 'private';
    isPrimary: boolean;
  }[];
}

export function NewProjectMultiStep() {
  const navigate = useNavigate();
  const { currentStyles } = useTheme();
  const { createProject } = useApp();
  const { workspace } = useWorkspace();
  const { showToast } = useToast();
  const styles = currentStyles;
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<ProjectFormData>({
    type: 'new',
    name: '',
    description: '',
    purpose: '',
    status: 'active',
    githubUrl: '',
    repositories: [{
      url: '',
      type: 'github',
      visibility: 'private',
      isPrimary: true
    }]
  });
  
  const handleTypeSelection = (type: ProjectType) => {
    setFormData({ ...formData, type });
    setCurrentStep(2);
  };
  
  const handleGitHubImport = async () => {
    if (!formData.githubUrl) {
      showToast('Please enter a GitHub URL', 'error');
      return;
    }
    
    setIsCreating(true);
    
    try {
      // Extract repo name from URL
      const urlParts = formData.githubUrl.split('/');
      const repoName = urlParts[urlParts.length - 1].replace('.git', '');
      const projectName = formData.name || repoName;
      
      // Create project folder structure
      const createResponse = await fetch('http://localhost:3000/api/workspace/create-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspacePath: workspace.config?.path,
          projectName
        })
      });
      
      if (!createResponse.ok) {
        throw new Error('Failed to create project folder');
      }
      
      const { path: projectPath } = await createResponse.json();
      
      // Clone the repository
      showToast('Cloning repository...', 'info');
      const cloneResponse = await fetch('http://localhost:3000/api/workspace/clone-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectPath,
          repoUrl: formData.githubUrl,
          repoName
        })
      });
      
      if (!cloneResponse.ok) {
        throw new Error('Failed to clone repository');
      }
      
      const cloneResult = await cloneResponse.json();
      
      // Extract project details from cloned repo
      showToast('Extracting project details...', 'info');
      const detailsResponse = await fetch('http://localhost:3000/api/workspace/extract-repo-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoPath: cloneResult.repoPath
        })
      });
      
      if (detailsResponse.ok) {
        const details = await detailsResponse.json();
        
        // Update project README with extracted details
        showToast('Updating project documentation...', 'info');
        await fetch('http://localhost:3000/api/workspace/update-project-readme', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectPath,
            projectName,
            description: details.description || formData.description || 'Imported from GitHub',
            purpose: details.purpose || formData.purpose || '',
            repositories: [{
              url: formData.githubUrl,
              type: 'github',
              visibility: details.isPrivate ? 'private' : 'public',
              isPrimary: true
            }],
            technologies: details.technologies || [],
            scripts: details.scripts || {}
          })
        });
        
        // Create project with extracted details
        createProject({
          name: projectName,
          description: details.description || formData.description || 'Imported from GitHub',
          purpose: details.purpose || formData.purpose || '',
          status: 'active',
          repositories: [{
            url: formData.githubUrl,
            type: 'github',
            visibility: details.isPrivate ? 'private' : 'public',
            isPrimary: true
          }],
          primaryRepoUrl: formData.githubUrl,
          path: projectPath
        });
        
        showToast('Project imported successfully!', 'success');
        navigate('/projects');
      } else {
        // Create project with basic info if extraction fails
        createProject({
          name: projectName,
          description: formData.description || 'Imported from GitHub',
          purpose: formData.purpose || '',
          status: 'active',
          repositories: [{
            url: formData.githubUrl,
            type: 'github',
            visibility: 'private',
            isPrimary: true
          }],
          primaryRepoUrl: formData.githubUrl,
          path: projectPath
        });
        
        showToast('Project imported (some details could not be extracted)', 'warning');
        navigate('/projects');
      }
    } catch (error) {
      console.error('Error importing project:', error);
      showToast('Failed to import project from GitHub', 'error');
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.type === 'github') {
      await handleGitHubImport();
      return;
    }
    
    // Create new project from scratch
    setIsCreating(true);
    
    try {
      let projectPath = '';
      if (workspace.config) {
        const response = await fetch('http://localhost:3000/api/workspace/create-project', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspacePath: workspace.config.path,
            projectName: formData.name
          })
        });

        if (response.ok) {
          const result = await response.json();
          projectPath = result.path;
        }
      }
      
      createProject({
        name: formData.name,
        description: formData.description,
        purpose: formData.purpose,
        status: formData.status,
        repositories: formData.repositories.filter(r => r.url),
        primaryRepoUrl: formData.repositories[0]?.url || '',
        path: projectPath
      });
      
      showToast('Project created successfully!', 'success');
      navigate('/projects');
    } catch (error) {
      console.error('Error creating project:', error);
      showToast('Failed to create project', 'error');
    } finally {
      setIsCreating(false);
    }
  };
  
  const updateRepository = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      repositories: prev.repositories.map((repo, i) => 
        i === index ? { ...repo, [field]: value } : repo
      )
    }));
  };
  
  const addRepository = () => {
    setFormData(prev => ({
      ...prev,
      repositories: [...prev.repositories, {
        url: '',
        type: 'github' as 'github' | 'ado',
        visibility: 'private' as 'public' | 'private',
        isPrimary: false
      }]
    }));
  };
  
  const removeRepository = (index: number) => {
    if (formData.repositories.length > 1) {
      setFormData(prev => ({
        ...prev,
        repositories: prev.repositories.filter((_, i) => i !== index)
      }));
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${styles.headingColor}`}>Add project</h1>
        <p className={`mt-2 ${styles.mutedText}`}>
          {currentStep === 1 ? 'Choose how you want to add your project' : 
           formData.type === 'github' ? 'Import a project from GitHub' : 
           'Define a new project with its purpose and repository information'}
        </p>
      </div>
      
      {/* Step 1: Choose Project Type */}
      {currentStep === 1 && (
        <AnimatedTransition transitionKey="step-1" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => handleTypeSelection('new')}
              className={`p-6 ${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} ${styles.cardShadow} hover:opacity-90 transition-opacity text-left`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 ${styles.primaryButton} ${styles.borderRadius}`}>
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className={`text-lg font-semibold ${styles.headingColor} mb-2`}>Create new project</h3>
                  <p className={`${styles.textColor}`}>
                    Start a new project from scratch with custom configuration
                  </p>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => handleTypeSelection('github')}
              className={`p-6 ${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} ${styles.cardShadow} hover:opacity-90 transition-opacity text-left`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 ${styles.primaryButton} ${styles.borderRadius}`}>
                  <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className={`text-lg font-semibold ${styles.headingColor} mb-2`}>Import from GitHub</h3>
                  <p className={`${styles.textColor}`}>
                    Import an existing GitHub repository and extract project details
                  </p>
                </div>
              </div>
            </button>
          </div>
          
          <div className="flex justify-end mt-8">
            <Button onClick={() => navigate('/projects')} variant="secondary">
              Cancel
            </Button>
          </div>
        </AnimatedTransition>
      )}
      
      {/* Step 2: GitHub Import */}
      {currentStep === 2 && formData.type === 'github' && (
        <AnimatedTransition transitionKey="step-2-github">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className={`${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} ${styles.cardShadow} p-6`}>
              <h2 className={`text-lg font-semibold ${styles.headingColor} mb-4`}>GitHub Repository</h2>
              
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${styles.textColor} mb-1`}>
                    GitHub Repository URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.githubUrl}
                    onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                    className={`w-full px-3 py-2 ${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} ${styles.textColor} focus:ring-2 focus:ring-gray-500 focus:border-gray-500`}
                    placeholder="https://github.com/username/repository"
                    disabled={isCreating}
                  />
                  <p className={`mt-1 text-sm ${styles.mutedText}`}>
                    The repository will be cloned and project details will be extracted from package.json and README.md
                  </p>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${styles.textColor} mb-1`}>
                    Project Name (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-3 py-2 ${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} ${styles.textColor} focus:ring-2 focus:ring-gray-500 focus:border-gray-500`}
                    placeholder="Leave empty to use repository name"
                    disabled={isCreating}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${styles.textColor} mb-1`}>
                    Additional Notes (optional)
                  </label>
                  <textarea
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    rows={3}
                    className={`w-full px-3 py-2 ${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} ${styles.textColor} focus:ring-2 focus:ring-gray-500 focus:border-gray-500`}
                    placeholder="Any additional context or purpose for this project"
                    disabled={isCreating}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button 
                type="button" 
                onClick={() => setCurrentStep(1)} 
                variant="secondary"
                disabled={isCreating}
              >
                Back
              </Button>
              <div className="flex gap-4">
                <Button 
                  type="button" 
                  onClick={() => navigate('/projects')} 
                  variant="secondary"
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary"
                  disabled={isCreating}
                >
                  {isCreating ? 'Importing...' : 'Import project'}
                </Button>
              </div>
            </div>
          </form>
        </AnimatedTransition>
      )}
      
      {/* Step 2: New Project Form */}
      {currentStep === 2 && formData.type === 'new' && (
        <AnimatedTransition transitionKey="step-2-new">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className={`${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} ${styles.cardShadow} p-6`}>
              <h2 className={`text-lg font-semibold ${styles.headingColor} mb-4`}>Basic Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${styles.textColor} mb-1`}>
                    Project Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-3 py-2 ${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} ${styles.textColor} focus:ring-2 focus:ring-gray-500 focus:border-gray-500`}
                    placeholder="My Awesome Project"
                    disabled={isCreating}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${styles.textColor} mb-1`}>
                    Description *
                  </label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className={`w-full px-3 py-2 ${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} ${styles.textColor} focus:ring-2 focus:ring-gray-500 focus:border-gray-500`}
                    placeholder="Brief description of the project..."
                    disabled={isCreating}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${styles.textColor} mb-1`}>
                    Purpose
                  </label>
                  <textarea
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    rows={3}
                    className={`w-full px-3 py-2 ${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} ${styles.textColor} focus:ring-2 focus:ring-gray-500 focus:border-gray-500`}
                    placeholder="What is the main purpose or goal of this project?"
                    disabled={isCreating}
                  />
                </div>
              </div>
            </div>
            
            {/* Repository Information */}
            <div className={`${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} ${styles.cardShadow} p-6`}>
              <h2 className={`text-lg font-semibold ${styles.headingColor} mb-4`}>Repository Information (Optional)</h2>
              
              <div className="space-y-4">
                {formData.repositories.map((repo, index) => (
                  <div key={index} className={`p-4 ${styles.contentBg} ${styles.contentBorder} border ${styles.borderRadius}`}>
                    <div className="space-y-4">
                      <div>
                        <label className={`block text-sm font-medium ${styles.textColor} mb-1`}>
                          Repository URL
                        </label>
                        <input
                          type="url"
                          value={repo.url}
                          onChange={(e) => updateRepository(index, 'url', e.target.value)}
                          className={`w-full px-3 py-2 ${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} ${styles.textColor} focus:ring-2 focus:ring-gray-500 focus:border-gray-500`}
                          placeholder="https://github.com/org/repo"
                          disabled={isCreating}
                        />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className={`block text-sm font-medium ${styles.textColor} mb-1`}>
                            Type
                          </label>
                          <select
                            value={repo.type}
                            onChange={(e) => updateRepository(index, 'type', e.target.value)}
                            className={`w-full px-3 py-2 ${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} ${styles.textColor} focus:ring-2 focus:ring-gray-500 focus:border-gray-500`}
                            disabled={isCreating}
                          >
                            <option value="github">GitHub</option>
                            <option value="ado">Azure DevOps</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className={`block text-sm font-medium ${styles.textColor} mb-1`}>
                            Visibility
                          </label>
                          <select
                            value={repo.visibility}
                            onChange={(e) => updateRepository(index, 'visibility', e.target.value)}
                            className={`w-full px-3 py-2 ${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} ${styles.textColor} focus:ring-2 focus:ring-gray-500 focus:border-gray-500`}
                            disabled={isCreating}
                          >
                            <option value="public">Public</option>
                            <option value="private">Private</option>
                          </select>
                        </div>
                        
                        <div className="flex items-end">
                          <label className={`flex items-center ${styles.textColor}`}>
                            <input
                              type="checkbox"
                              checked={repo.isPrimary}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData(prev => ({
                                    ...prev,
                                    repositories: prev.repositories.map((r, i) => ({
                                      ...r,
                                      isPrimary: i === index
                                    }))
                                  }));
                                } else {
                                  updateRepository(index, 'isPrimary', false);
                                }
                              }}
                              className="mr-2"
                              disabled={isCreating}
                            />
                            Primary repo
                          </label>
                          
                          {formData.repositories.length > 1 && (
                            <Button
                              type="button"
                              onClick={() => removeRepository(index)}
                              variant="ghost"
                              size="sm"
                              className="ml-auto"
                              disabled={isCreating}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                <Button
                  type="button"
                  onClick={addRepository}
                  variant="secondary"
                  size="sm"
                  disabled={isCreating}
                >
                  Add repository
                </Button>
              </div>
            </div>
            
            {/* Form Actions */}
            <div className="flex justify-between">
              <Button 
                type="button" 
                onClick={() => setCurrentStep(1)} 
                variant="secondary"
                disabled={isCreating}
              >
                Back
              </Button>
              <div className="flex gap-4">
                <Button
                  type="button"
                  onClick={() => navigate('/projects')}
                  variant="secondary"
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isCreating}
                >
                  {isCreating ? 'Creating...' : 'Create project'}
                </Button>
              </div>
            </div>
          </form>
        </AnimatedTransition>
      )}
    </div>
  );
}