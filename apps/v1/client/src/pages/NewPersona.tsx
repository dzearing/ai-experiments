import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import type { PersonaType } from '../types';

const personaTypes: { value: PersonaType; label: string; description: string }[] = [
  {
    value: 'usability-expert',
    label: 'Usability Expert',
    description: 'Focuses on user experience, accessibility, and interface design patterns',
  },
  {
    value: 'developer',
    label: 'Developer',
    description: 'Implements technical solutions and writes production-quality code',
  },
  {
    value: 'tester',
    label: 'Tester',
    description: 'Challenges designs, identifies edge cases, and ensures quality',
  },
  {
    value: 'data-scientist',
    label: 'Data Scientist',
    description: 'Analyzes data patterns and provides insights for decision making',
  },
  {
    value: 'devops',
    label: 'DevOps',
    description: 'Handles deployment, infrastructure, and operational concerns',
  },
  {
    value: 'project-manager',
    label: 'Project Manager',
    description: 'Manages timelines, resolves ambiguity, and coordinates efforts',
  },
  {
    value: 'designer',
    label: 'Designer',
    description: 'Creates visual designs and maintains design consistency',
  },
  {
    value: 'motion-designer',
    label: 'Motion Designer',
    description: 'Adds animations and micro-interactions to enhance UX',
  },
];

const defaultExpertise: Record<PersonaType, string[]> = {
  'usability-expert': [
    'User Research',
    'Accessibility',
    'Information Architecture',
    'Usability Testing',
  ],
  developer: ['Frontend Development', 'Backend Development', 'API Design', 'Code Review'],
  tester: ['Test Planning', 'Edge Case Analysis', 'Performance Testing', 'Security Testing'],
  'data-scientist': [
    'Data Analysis',
    'Machine Learning',
    'Statistical Modeling',
    'Data Visualization',
  ],
  devops: ['CI/CD', 'Infrastructure as Code', 'Monitoring', 'Cloud Platforms'],
  'project-manager': [
    'Sprint Planning',
    'Risk Management',
    'Stakeholder Communication',
    'Resource Allocation',
  ],
  designer: ['Visual Design', 'Brand Identity', 'Design Systems', 'Prototyping'],
  'motion-designer': ['Animation', 'Transitions', 'Micro-interactions', 'Motion Principles'],
};

export function NewPersona() {
  const navigate = useNavigate();
  const { createPersona } = useApp();

  const [formData, setFormData] = useState({
    name: '',
    type: 'developer' as PersonaType,
    personality: '',
    customExpertise: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const expertise = [
      ...defaultExpertise[formData.type],
      ...formData.customExpertise
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean),
    ];

    createPersona({
      name: formData.name,
      type: formData.type,
      jobTitle: formData.type
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '),
      personality: formData.personality,
      expertise,
      status: 'available',
    });

    navigate('/personas');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900">Spawn new agent</h1>
      <p className="mt-2 text-sm text-gray-700">
        Create a new Claude agent persona with specific expertise and personality.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Agent Name
          </label>
          <input
            type="text"
            id="name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="e.g., Alex the Developer"
          />
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">
            Persona Type
          </label>
          <select
            id="type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as PersonaType })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            {personaTypes.map(({ value, label, description }) => (
              <option key={value} value={value}>
                {label} - {description}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="personality" className="block text-sm font-medium text-gray-700">
            Personality Traits (Optional)
          </label>
          <textarea
            id="personality"
            rows={3}
            value={formData.personality}
            onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="e.g., Detail-oriented, pragmatic, loves clean code architecture"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Default Expertise</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {defaultExpertise[formData.type].map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="customExpertise" className="block text-sm font-medium text-gray-700">
            Additional Expertise (comma-separated)
          </label>
          <input
            type="text"
            id="customExpertise"
            value={formData.customExpertise}
            onChange={(e) => setFormData({ ...formData, customExpertise: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="e.g., React Native, GraphQL, WebSockets"
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/personas')}
            className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Spawn agent
          </button>
        </div>
      </form>
    </div>
  );
}
