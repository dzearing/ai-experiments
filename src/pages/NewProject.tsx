import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContextV2';
import { useApp } from '../contexts/AppContext';
import { v4 as uuidv4 } from 'uuid';
import type { Project } from '../types';

export function NewProject() {
  const navigate = useNavigate();
  const { currentStyles } = useTheme();
  const { createProject, personas } = useApp();
  const styles = currentStyles;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active' as Project['status'],
    techStack: [] as string[],
    teamPersonaIds: [] as string[],
    category: 'fullstack' as Project['category'],
    estimatedEffort: '',
    deadline: '',
    dependencies: ''
  });
  
  const techStackOptions = [
    'React', 'TypeScript', 'Node.js', 'Python', 'Go', 
    'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes',
    'AWS', 'Azure', 'GraphQL', 'REST API', 'WebSockets'
  ];
  
  const categoryOptions: Project['category'][] = [
    'frontend', 'backend', 'fullstack', 'mobile', 
    'devops', 'data', 'research', 'prototype'
  ];
  
  const availablePersonas = personas.filter(p => p.status === 'available');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    createProject({
      name: formData.name,
      description: formData.description,
      status: formData.status,
      techStack: formData.techStack,
      teamPersonaIds: formData.teamPersonaIds,
      category: formData.category
    });
    
    navigate('/projects');
  };
  
  const toggleTechStack = (tech: string) => {
    setFormData(prev => ({
      ...prev,
      techStack: prev.techStack.includes(tech)
        ? prev.techStack.filter(t => t !== tech)
        : [...prev.techStack, tech]
    }));
  };
  
  const toggleTeamMember = (personaId: string) => {
    setFormData(prev => ({
      ...prev,
      teamPersonaIds: prev.teamPersonaIds.includes(personaId)
        ? prev.teamPersonaIds.filter(id => id !== personaId)
        : [...prev.teamPersonaIds, personaId]
    }));
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${styles.headingColor}`}>Create new project</h1>
        <p className={`mt-2 ${styles.mutedText}`}>
          Define a new project with its team, technology stack, and timeline.
        </p>
      </div>
      
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
                rows={4}
                className={`w-full px-3 py-2 ${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} ${styles.textColor} focus:ring-2 focus:ring-gray-500 focus:border-gray-500`}
                placeholder="Describe the project goals, scope, and expected outcomes..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium ${styles.textColor} mb-1`}>
                  Category *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={`w-full px-3 py-2 ${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} ${styles.textColor} focus:ring-2 focus:ring-gray-500 focus:border-gray-500`}
                >
                  <option value="">Select category</option>
                  {categoryOptions.map(cat => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${styles.textColor} mb-1`}>
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as Project['priority'] })}
                  className={`w-full px-3 py-2 ${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} ${styles.textColor} focus:ring-2 focus:ring-gray-500 focus:border-gray-500`}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className={`block text-sm font-medium ${styles.textColor} mb-1`}>
                Repository URL
              </label>
              <input
                type="url"
                value={formData.repository}
                onChange={(e) => setFormData({ ...formData, repository: e.target.value })}
                className={`w-full px-3 py-2 ${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} ${styles.textColor} focus:ring-2 focus:ring-gray-500 focus:border-gray-500`}
                placeholder="https://github.com/org/repo"
              />
            </div>
          </div>
        </div>
        
        {/* Team Assignment */}
        <div className={`${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} ${styles.cardShadow} p-6`}>
          <h2 className={`text-lg font-semibold ${styles.headingColor} mb-4`}>Team Assignment</h2>
          
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium ${styles.textColor} mb-1`}>
                Project Lead
              </label>
              <select
                value={formData.leadPersonaId}
                onChange={(e) => setFormData({ ...formData, leadPersonaId: e.target.value })}
                className={`w-full px-3 py-2 ${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} ${styles.textColor} focus:ring-2 focus:ring-gray-500 focus:border-gray-500`}
              >
                <option value="">Select lead persona</option>
                {availablePersonas.map(persona => (
                  <option key={persona.id} value={persona.id}>
                    {persona.name} - {persona.expertise.join(', ')}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className={`block text-sm font-medium ${styles.textColor} mb-2`}>
                Team Members
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {availablePersonas.map(persona => (
                  <label
                    key={persona.id}
                    className={`flex items-center p-3 ${styles.contentBg} ${styles.contentBorder} border ${styles.borderRadius} cursor-pointer hover:opacity-80`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.teamPersonaIds.includes(persona.id)}
                      onChange={() => toggleTeamMember(persona.id)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className={`font-medium ${styles.textColor}`}>{persona.name}</div>
                      <div className={`text-sm ${styles.mutedText}`}>
                        {persona.expertise.join(', ')}
                      </div>
                    </div>
                  </label>
                ))}
                {availablePersonas.length === 0 && (
                  <p className={`text-sm ${styles.mutedText} text-center py-4`}>
                    No available personas. Create some personas first.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Technical Details */}
        <div className={`${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} ${styles.cardShadow} p-6`}>
          <h2 className={`text-lg font-semibold ${styles.headingColor} mb-4`}>Technical Details</h2>
          
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium ${styles.textColor} mb-2`}>
                Technology Stack
              </label>
              <div className="flex flex-wrap gap-2">
                {techStackOptions.map(tech => (
                  <button
                    key={tech}
                    type="button"
                    onClick={() => toggleTechStack(tech)}
                    className={`
                      px-3 py-1 ${styles.buttonRadius} border transition-colors
                      ${formData.techStack.includes(tech)
                        ? `${styles.primaryButton} ${styles.primaryButtonText}`
                        : `${styles.cardBg} ${styles.cardBorder} ${styles.textColor} hover:opacity-80`
                      }
                    `}
                  >
                    {tech}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className={`block text-sm font-medium ${styles.textColor} mb-1`}>
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className={`w-full px-3 py-2 ${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} ${styles.textColor} focus:ring-2 focus:ring-gray-500 focus:border-gray-500`}
                placeholder="api, microservices, cloud"
              />
            </div>
            
            <div>
              <label className={`block text-sm font-medium ${styles.textColor} mb-1`}>
                Dependencies
              </label>
              <textarea
                value={formData.dependencies}
                onChange={(e) => setFormData({ ...formData, dependencies: e.target.value })}
                rows={2}
                className={`w-full px-3 py-2 ${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} ${styles.textColor} focus:ring-2 focus:ring-gray-500 focus:border-gray-500`}
                placeholder="List any project dependencies or prerequisites..."
              />
            </div>
          </div>
        </div>
        
        {/* Timeline & Effort */}
        <div className={`${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} ${styles.cardShadow} p-6`}>
          <h2 className={`text-lg font-semibold ${styles.headingColor} mb-4`}>Timeline & Effort</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium ${styles.textColor} mb-1`}>
                Estimated Effort
              </label>
              <input
                type="text"
                value={formData.estimatedEffort}
                onChange={(e) => setFormData({ ...formData, estimatedEffort: e.target.value })}
                className={`w-full px-3 py-2 ${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} ${styles.textColor} focus:ring-2 focus:ring-gray-500 focus:border-gray-500`}
                placeholder="e.g., 2 weeks, 40 hours"
              />
            </div>
            
            <div>
              <label className={`block text-sm font-medium ${styles.textColor} mb-1`}>
                Deadline
              </label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className={`w-full px-3 py-2 ${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} ${styles.textColor} focus:ring-2 focus:ring-gray-500 focus:border-gray-500`}
              />
            </div>
          </div>
        </div>
        
        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/projects')}
            className={`
              px-6 py-2 ${styles.buttonRadius} ${styles.cardBg} 
              ${styles.cardBorder} border ${styles.textColor}
              hover:opacity-80 transition-opacity
            `}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`
              px-6 py-2 ${styles.buttonRadius} 
              ${styles.primaryButton} ${styles.primaryButtonText}
              ${styles.primaryButtonHover} transition-colors
            `}
          >
            Create project
          </button>
        </div>
      </form>
    </div>
  );
}