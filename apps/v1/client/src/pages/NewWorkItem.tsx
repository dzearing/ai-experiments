import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContextV2';
import { useApp } from '../contexts/AppContext';
import { Button } from '../components/ui/Button';
import { IconButton } from '../components/ui/IconButton';
import type { WorkItem } from '../types';

export function NewWorkItem() {
  const navigate = useNavigate();
  const { currentStyles } = useTheme();
  const { projects, personas } = useApp();
  const styles = currentStyles;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as WorkItem['priority'],
    status: 'planned' as WorkItem['status'],
    projectId: '',
    assigneeId: '',
    dueDate: '',
    estimatedEffort: '',
    tags: [] as string[],
    problems: [''],
    goals: [''],
    technicalApproach: '',
    dependencies: [''],
    acceptanceCriteria: [''],
    healthMetrics: [''],
    notes: '',
  });

  const [newTag, setNewTag] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Actually create the work item
    navigate('/work-items');
  };

  const addArrayItem = (
    field: 'problems' | 'goals' | 'dependencies' | 'acceptanceCriteria' | 'healthMetrics'
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], ''],
    }));
  };

  const updateArrayItem = (
    field: 'problems' | 'goals' | 'dependencies' | 'acceptanceCriteria' | 'healthMetrics',
    index: number,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item)),
    }));
  };

  const removeArrayItem = (
    field: 'problems' | 'goals' | 'dependencies' | 'acceptanceCriteria' | 'healthMetrics',
    index: number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className={`text-2xl font-bold ${styles.headingColor} mb-6`}>Create work item</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div
          className={`${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} ${styles.cardShadow} p-6`}
        >
          <h2 className={`text-lg font-semibold ${styles.headingColor} mb-4`}>Basic information</h2>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="title"
                className={`block text-sm font-medium ${styles.textColor} mb-1`}
              >
                Title
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                className={`
                  w-full px-3 py-2 ${styles.buttonRadius}
                  ${styles.contentBg} ${styles.contentBorder} border ${styles.textColor}
                  focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500
                `}
                placeholder="Brief descriptive title"
                required
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className={`block text-sm font-medium ${styles.textColor} mb-1`}
              >
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                rows={4}
                className={`
                  w-full px-3 py-2 ${styles.buttonRadius}
                  ${styles.contentBg} ${styles.contentBorder} border ${styles.textColor}
                  focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500
                `}
                placeholder="Detailed description of what needs to be done"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="priority"
                  className={`block text-sm font-medium ${styles.textColor} mb-1`}
                >
                  Priority
                </label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      priority: e.target.value as WorkItem['priority'],
                    }))
                  }
                  className={`
                    w-full px-3 py-2 ${styles.buttonRadius}
                    ${styles.contentBg} ${styles.contentBorder} border ${styles.textColor}
                    focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500
                  `}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="status"
                  className={`block text-sm font-medium ${styles.textColor} mb-1`}
                >
                  Status
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      status: e.target.value as WorkItem['status'],
                    }))
                  }
                  className={`
                    w-full px-3 py-2 ${styles.buttonRadius}
                    ${styles.contentBg} ${styles.contentBorder} border ${styles.textColor}
                    focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500
                  `}
                >
                  <option value="planned">Planned</option>
                  <option value="active">Active</option>
                  <option value="review">Review</option>
                  <option value="blocked">Blocked</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Assignment */}
        <div
          className={`${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} ${styles.cardShadow} p-6`}
        >
          <h2 className={`text-lg font-semibold ${styles.headingColor} mb-4`}>Assignment</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="project"
                className={`block text-sm font-medium ${styles.textColor} mb-1`}
              >
                Project
              </label>
              <select
                id="project"
                value={formData.projectId}
                onChange={(e) => setFormData((prev) => ({ ...prev, projectId: e.target.value }))}
                className={`
                  w-full px-3 py-2 ${styles.buttonRadius}
                  ${styles.contentBg} ${styles.contentBorder} border ${styles.textColor}
                  focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500
                `}
              >
                <option value="">Select a project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="assignee"
                className={`block text-sm font-medium ${styles.textColor} mb-1`}
              >
                Assignee
              </label>
              <select
                id="assignee"
                value={formData.assigneeId}
                onChange={(e) => setFormData((prev) => ({ ...prev, assigneeId: e.target.value }))}
                className={`
                  w-full px-3 py-2 ${styles.buttonRadius}
                  ${styles.contentBg} ${styles.contentBorder} border ${styles.textColor}
                  focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500
                `}
              >
                <option value="">Unassigned</option>
                {personas.map((persona) => (
                  <option key={persona.id} value={persona.id}>
                    {persona.name} ({persona.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="dueDate"
                className={`block text-sm font-medium ${styles.textColor} mb-1`}
              >
                Due date
              </label>
              <input
                type="date"
                id="dueDate"
                value={formData.dueDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
                className={`
                  w-full px-3 py-2 ${styles.buttonRadius}
                  ${styles.contentBg} ${styles.contentBorder} border ${styles.textColor}
                  focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500
                `}
              />
            </div>

            <div>
              <label
                htmlFor="effort"
                className={`block text-sm font-medium ${styles.textColor} mb-1`}
              >
                Estimated effort
              </label>
              <input
                type="text"
                id="effort"
                value={formData.estimatedEffort}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, estimatedEffort: e.target.value }))
                }
                className={`
                  w-full px-3 py-2 ${styles.buttonRadius}
                  ${styles.contentBg} ${styles.contentBorder} border ${styles.textColor}
                  focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500
                `}
                placeholder="e.g., 2 days, 1 week"
              />
            </div>
          </div>
        </div>

        {/* Problems */}
        <div
          className={`${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} ${styles.cardShadow} p-6`}
        >
          <h2 className={`text-lg font-semibold ${styles.headingColor} mb-4`}>Problems</h2>
          <p className={`text-sm ${styles.mutedText} mb-4`}>
            List the problems this work item aims to solve
          </p>

          <div className="space-y-2">
            {formData.problems.map((problem, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={problem}
                  onChange={(e) => updateArrayItem('problems', index, e.target.value)}
                  className={`
                    flex-1 px-3 py-2 ${styles.buttonRadius}
                    ${styles.contentBg} ${styles.contentBorder} border ${styles.textColor}
                    focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500
                  `}
                  placeholder={`Problem ${index + 1}`}
                />
                {formData.problems.length > 1 && (
                  <IconButton
                    type="button"
                    onClick={() => removeArrayItem('problems', index)}
                    variant="secondary"
                    size="sm"
                    aria-label="Remove problem"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </IconButton>
                )}
              </div>
            ))}
            <Button
              type="button"
              onClick={() => addArrayItem('problems')}
              variant="secondary"
              size="sm"
            >
              Add problem
            </Button>
          </div>
        </div>

        {/* Goals */}
        <div
          className={`${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} ${styles.cardShadow} p-6`}
        >
          <h2 className={`text-lg font-semibold ${styles.headingColor} mb-4`}>Goals</h2>
          <p className={`text-sm ${styles.mutedText} mb-4`}>
            Define specific goals for this work item
          </p>

          <div className="space-y-2">
            {formData.goals.map((goal, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => updateArrayItem('goals', index, e.target.value)}
                  className={`
                    flex-1 px-3 py-2 ${styles.buttonRadius}
                    ${styles.contentBg} ${styles.contentBorder} border ${styles.textColor}
                    focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500
                  `}
                  placeholder={`Goal ${index + 1}`}
                />
                {formData.goals.length > 1 && (
                  <IconButton
                    type="button"
                    onClick={() => removeArrayItem('goals', index)}
                    variant="secondary"
                    size="sm"
                    aria-label="Remove goal"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </IconButton>
                )}
              </div>
            ))}
            <Button
              type="button"
              onClick={() => addArrayItem('goals')}
              variant="secondary"
              size="sm"
            >
              Add goal
            </Button>
          </div>
        </div>

        {/* Technical Details */}
        <div
          className={`${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} ${styles.cardShadow} p-6`}
        >
          <h2 className={`text-lg font-semibold ${styles.headingColor} mb-4`}>Technical details</h2>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="approach"
                className={`block text-sm font-medium ${styles.textColor} mb-1`}
              >
                Technical approach
              </label>
              <textarea
                id="approach"
                value={formData.technicalApproach}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, technicalApproach: e.target.value }))
                }
                rows={3}
                className={`
                  w-full px-3 py-2 ${styles.buttonRadius}
                  ${styles.contentBg} ${styles.contentBorder} border ${styles.textColor}
                  focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500
                `}
                placeholder="Outline the technical approach or solution strategy"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${styles.textColor} mb-1`}>
                Dependencies
              </label>
              <div className="space-y-2">
                {formData.dependencies.map((dep, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={dep}
                      onChange={(e) => updateArrayItem('dependencies', index, e.target.value)}
                      className={`
                        flex-1 px-3 py-2 ${styles.buttonRadius}
                        ${styles.contentBg} ${styles.contentBorder} border ${styles.textColor}
                        focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500
                      `}
                      placeholder="Dependency or prerequisite"
                    />
                    {formData.dependencies.length > 1 && (
                      <IconButton
                        type="button"
                        onClick={() => removeArrayItem('dependencies', index)}
                        variant="secondary"
                        size="sm"
                        aria-label="Remove dependency"
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </IconButton>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  onClick={() => addArrayItem('dependencies')}
                  variant="secondary"
                  size="sm"
                >
                  Add dependency
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Acceptance Criteria */}
        <div
          className={`${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} ${styles.cardShadow} p-6`}
        >
          <h2 className={`text-lg font-semibold ${styles.headingColor} mb-4`}>
            Acceptance criteria
          </h2>

          <div className="space-y-2">
            {formData.acceptanceCriteria.map((criterion, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={criterion}
                  onChange={(e) => updateArrayItem('acceptanceCriteria', index, e.target.value)}
                  className={`
                    flex-1 px-3 py-2 ${styles.buttonRadius}
                    ${styles.contentBg} ${styles.contentBorder} border ${styles.textColor}
                    focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500
                  `}
                  placeholder="Success criterion"
                />
                {formData.acceptanceCriteria.length > 1 && (
                  <IconButton
                    type="button"
                    onClick={() => removeArrayItem('acceptanceCriteria', index)}
                    variant="secondary"
                    size="sm"
                    aria-label="Remove criterion"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </IconButton>
                )}
              </div>
            ))}
            <Button
              type="button"
              onClick={() => addArrayItem('acceptanceCriteria')}
              variant="secondary"
              size="sm"
            >
              Add criterion
            </Button>
          </div>
        </div>

        {/* Health Metrics */}
        <div
          className={`${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} ${styles.cardShadow} p-6`}
        >
          <h2 className={`text-lg font-semibold ${styles.headingColor} mb-4`}>Health metrics</h2>
          <p className={`text-sm ${styles.mutedText} mb-4`}>
            Define what telemetry/metrics indicate healthy functionality
          </p>

          <div className="space-y-2">
            {formData.healthMetrics.map((metric, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={metric}
                  onChange={(e) => updateArrayItem('healthMetrics', index, e.target.value)}
                  className={`
                    flex-1 px-3 py-2 ${styles.buttonRadius}
                    ${styles.contentBg} ${styles.contentBorder} border ${styles.textColor}
                    focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500
                  `}
                  placeholder="Metric description and expected values"
                />
                {formData.healthMetrics.length > 1 && (
                  <IconButton
                    type="button"
                    onClick={() => removeArrayItem('healthMetrics', index)}
                    variant="secondary"
                    size="sm"
                    aria-label="Remove metric"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </IconButton>
                )}
              </div>
            ))}
            <Button
              type="button"
              onClick={() => addArrayItem('healthMetrics')}
              variant="secondary"
              size="sm"
            >
              Add metric
            </Button>
          </div>
        </div>

        {/* Tags and Notes */}
        <div
          className={`${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} ${styles.cardShadow} p-6`}
        >
          <h2 className={`text-lg font-semibold ${styles.headingColor} mb-4`}>
            Additional information
          </h2>

          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium ${styles.textColor} mb-1`}>Tags</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className={`
                    flex-1 px-3 py-2 ${styles.buttonRadius}
                    ${styles.contentBg} ${styles.contentBorder} border ${styles.textColor}
                    focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500
                  `}
                  placeholder="Add a tag"
                />
                <Button type="button" onClick={addTag} variant="primary">
                  Add
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`
                        inline-flex items-center gap-1 px-3 py-1 text-sm ${styles.buttonRadius}
                        ${styles.contentBg} ${styles.contentBorder} border ${styles.textColor}
                      `}
                    >
                      {tag}
                      <IconButton
                        type="button"
                        onClick={() => removeTag(tag)}
                        variant="ghost"
                        size="sm"
                        aria-label={`Remove tag ${tag}`}
                        className="ml-1"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </IconButton>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="notes"
                className={`block text-sm font-medium ${styles.textColor} mb-1`}
              >
                Notes
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className={`
                  w-full px-3 py-2 ${styles.buttonRadius}
                  ${styles.contentBg} ${styles.contentBorder} border ${styles.textColor}
                  focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500
                `}
                placeholder="Any additional notes, considerations, or context"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" onClick={() => navigate('/work-items')} variant="secondary">
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Create work item
          </Button>
        </div>
      </form>
    </div>
  );
}
