import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContextV2';
import { useApp } from '../contexts/AppContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { Button } from '../components/ui/Button';
import type { Project } from '../types';

export function NewProject() {
  const navigate = useNavigate();
  const { currentStyles } = useTheme();
  const { createProject } = useApp();
  const { workspace } = useWorkspace();
  const styles = currentStyles;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    purpose: '',
    status: 'active' as Project['status'],
    repositories: [
      {
        url: '',
        type: 'github' as 'github' | 'ado',
        visibility: 'private' as 'public' | 'private',
        isPrimary: true,
      },
    ],
  });

  const repoTypeOptions = [
    { value: 'github', label: 'GitHub' },
    { value: 'ado', label: 'Azure DevOps' },
  ];

  const visibilityOptions = [
    { value: 'public', label: 'Public' },
    { value: 'private', label: 'Private' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Create project folder in workspace if workspace is configured
    let projectPath = '';
    if (workspace.config) {
      try {
        const response = await fetch('http://localhost:3000/api/workspace/create-project', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workspacePath: workspace.config.path,
            projectName: formData.name,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          projectPath = result.path;
          console.log('Project folder created at:', projectPath);
        } else {
          console.error('Failed to create project folder');
        }
      } catch (error) {
        console.error('Error creating project folder:', error);
      }
    }

    createProject({
      name: formData.name,
      description: formData.description,
      purpose: formData.purpose,
      status: formData.status,
      repositories: formData.repositories,
      primaryRepoUrl: formData.repositories[0]?.url || '',
      path: projectPath, // Add the path to the project
    });

    navigate('/projects');
  };

  const updateRepository = (index: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      repositories: prev.repositories.map((repo, i) =>
        i === index ? { ...repo, [field]: value } : repo
      ),
    }));
  };

  const addRepository = () => {
    setFormData((prev) => ({
      ...prev,
      repositories: [
        ...prev.repositories,
        {
          url: '',
          type: 'github' as 'github' | 'ado',
          visibility: 'private' as 'public' | 'private',
          isPrimary: false,
        },
      ],
    }));
  };

  const removeRepository = (index: number) => {
    if (formData.repositories.length > 1) {
      setFormData((prev) => ({
        ...prev,
        repositories: prev.repositories.filter((_, i) => i !== index),
      }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${styles.headingColor}`}>Create new project</h1>
        <p className={`mt-2 ${styles.mutedText}`}>
          Define a new project with its purpose and repository information.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div
          className={`${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} ${styles.cardShadow} p-6`}
        >
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
              />
            </div>
          </div>
        </div>

        {/* Repository Information */}
        <div
          className={`${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} ${styles.cardShadow} p-6`}
        >
          <h2 className={`text-lg font-semibold ${styles.headingColor} mb-4`}>
            Repository Information
          </h2>

          <div className="space-y-4">
            {formData.repositories.map((repo, index) => (
              <div
                key={index}
                className={`p-4 ${styles.contentBg} ${styles.contentBorder} border ${styles.borderRadius}`}
              >
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium ${styles.textColor} mb-1`}>
                      Repository URL {index === 0 && '*'}
                    </label>
                    <input
                      type="url"
                      required={index === 0}
                      value={repo.url}
                      onChange={(e) => updateRepository(index, 'url', e.target.value)}
                      className={`w-full px-3 py-2 ${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} ${styles.textColor} focus:ring-2 focus:ring-gray-500 focus:border-gray-500`}
                      placeholder="https://github.com/org/repo"
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
                      >
                        {repoTypeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
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
                      >
                        {visibilityOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-end">
                      <label className={`flex items-center ${styles.textColor}`}>
                        <input
                          type="checkbox"
                          checked={repo.isPrimary}
                          onChange={(e) => {
                            // If setting as primary, unset others
                            if (e.target.checked) {
                              setFormData((prev) => ({
                                ...prev,
                                repositories: prev.repositories.map((r, i) => ({
                                  ...r,
                                  isPrimary: i === index,
                                })),
                              }));
                            } else {
                              updateRepository(index, 'isPrimary', false);
                            }
                          }}
                          className="mr-2"
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
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <Button type="button" onClick={addRepository} variant="secondary" size="sm">
              Add repository
            </Button>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" onClick={() => navigate('/projects')} variant="secondary">
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Create project
          </Button>
        </div>
      </form>
    </div>
  );
}
