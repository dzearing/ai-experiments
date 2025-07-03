import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContextV2';
import { StockPhotoAvatar, getRandomName, getGenderFromSeed, hashCode } from '../components/StockPhotoAvatar';
import type { PersonaType } from '../types';

const personaTypes: { value: PersonaType; label: string; description: string }[] = [
  { 
    value: 'usability-expert', 
    label: 'Usability Expert',
    description: 'Focuses on user experience, accessibility, and interface design patterns'
  },
  { 
    value: 'developer', 
    label: 'Developer',
    description: 'Implements technical solutions and writes production-quality code'
  },
  { 
    value: 'tester', 
    label: 'Tester',
    description: 'Challenges designs, identifies edge cases, and ensures quality'
  },
  { 
    value: 'data-scientist', 
    label: 'Data Scientist',
    description: 'Analyzes data patterns and provides insights for decision making'
  },
  { 
    value: 'devops', 
    label: 'DevOps',
    description: 'Handles deployment, infrastructure, and operational concerns'
  },
  { 
    value: 'project-manager', 
    label: 'Project Manager',
    description: 'Manages timelines, resolves ambiguity, and coordinates efforts'
  },
  { 
    value: 'designer', 
    label: 'Designer',
    description: 'Creates visual designs and maintains design consistency'
  },
  { 
    value: 'motion-designer', 
    label: 'Motion Designer',
    description: 'Adds animations and micro-interactions to enhance UX'
  },
];

const defaultExpertise: Record<PersonaType, string[]> = {
  'usability-expert': ['User Research', 'Accessibility', 'Information Architecture', 'Usability Testing'],
  'developer': ['Frontend Development', 'Backend Development', 'API Design', 'Code Review'],
  'tester': ['Test Planning', 'Edge Case Analysis', 'Performance Testing', 'Security Testing'],
  'data-scientist': ['Data Analysis', 'Machine Learning', 'Statistical Modeling', 'Data Visualization'],
  'devops': ['CI/CD', 'Infrastructure as Code', 'Monitoring', 'Cloud Platforms'],
  'project-manager': ['Sprint Planning', 'Risk Management', 'Stakeholder Communication', 'Resource Allocation'],
  'designer': ['Visual Design', 'Brand Identity', 'Design Systems', 'Prototyping'],
  'motion-designer': ['Animation', 'Transitions', 'Micro-interactions', 'Motion Principles'],
};

export function ThemedNewPersona() {
  const navigate = useNavigate();
  const { createPersona } = useApp();
  const { currentStyles } = useTheme();
  const styles = currentStyles;
  
  // Generate random seed for avatar
  const [avatarSeed, setAvatarSeed] = useState(() => Date.now().toString());
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'developer' as PersonaType,
    personality: '',
    customExpertise: '',
  });
  
  // Set random name on mount and when avatar changes
  useEffect(() => {
    const gender = getGenderFromSeed(avatarSeed);
    setFormData(prev => ({
      ...prev,
      name: getRandomName(avatarSeed, gender)
    }));
  }, [avatarSeed]);
  
  const randomizeAvatar = () => {
    console.log('Randomize avatar clicked');
    let newSeed = Date.now().toString() + Math.random();
    
    // Keep generating new seeds until we get a different avatar
    // The photoIndex is determined by hashCode(seed) % 100
    while (hashCode(newSeed) % 100 === hashCode(avatarSeed) % 100) {
      newSeed = Date.now().toString() + Math.random() + Math.random();
    }
    
    setAvatarSeed(newSeed);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const expertise = [
      ...defaultExpertise[formData.type],
      ...formData.customExpertise.split(',').map(e => e.trim()).filter(Boolean)
    ];
    
    createPersona({
      name: formData.name,
      type: formData.type,
      personality: formData.personality,
      expertise,
      status: 'available',
    });
    
    navigate('/personas');
  };
  
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className={`text-2xl font-semibold ${styles.headingColor}`}>Spawn new agent</h1>
      <p className={`mt-2 text-sm ${styles.mutedText}`}>
        Create a new Claude agent persona with specific expertise and personality.
      </p>
      
      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div>
          <label htmlFor="name" className={`block text-sm font-medium ${styles.textColor} mb-2`}>
            Agent name
          </label>
          <div className="flex items-center gap-4">
            <div className="relative">
              <StockPhotoAvatar seed={avatarSeed} size={88} />
              <button
                type="button"
                onClick={randomizeAvatar}
                className={`
                  absolute -bottom-1 -right-1 p-1.5 rounded-full z-10
                  ${styles.contentBg} ${styles.contentBorder} border ${styles.textColor}
                  hover:opacity-80 transition-opacity shadow-sm
                `}
                title="Randomize avatar"
              >
                <svg className="h-4 w-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            <input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`
                flex-1 px-3 py-2 ${styles.buttonRadius}
                ${styles.contentBg} ${styles.contentBorder} border ${styles.textColor}
                focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500
              `}
              placeholder="e.g., Alex the Developer"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="type" className={`block text-sm font-medium ${styles.textColor} mb-1`}>
            Persona type
          </label>
          <select
            id="type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as PersonaType })}
            className={`
              block w-full px-3 py-2 ${styles.buttonRadius}
              ${styles.contentBg} ${styles.contentBorder} border ${styles.textColor}
              focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500
            `}
          >
            {personaTypes.map(({ value, label, description }) => (
              <option key={value} value={value}>
                {label} - {description}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="personality" className={`block text-sm font-medium ${styles.textColor} mb-1`}>
            Personality traits (optional)
          </label>
          <textarea
            id="personality"
            rows={3}
            value={formData.personality}
            onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
            className={`
              block w-full px-3 py-2 ${styles.buttonRadius}
              ${styles.contentBg} ${styles.contentBorder} border ${styles.textColor}
              focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500
            `}
            placeholder="e.g., Detail-oriented, pragmatic, loves clean code architecture"
          />
        </div>
        
        <div>
          <label className={`block text-sm font-medium ${styles.textColor} mb-2`}>
            Default expertise
          </label>
          <div className="flex flex-wrap gap-2">
            {defaultExpertise[formData.type].map((skill) => (
              <span
                key={skill}
                className={`
                  inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                  ${styles.contentBg} ${styles.contentBorder} border ${styles.textColor}
                `}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
        
        <div>
          <label htmlFor="customExpertise" className={`block text-sm font-medium ${styles.textColor} mb-1`}>
            Additional expertise (comma-separated)
          </label>
          <input
            type="text"
            id="customExpertise"
            value={formData.customExpertise}
            onChange={(e) => setFormData({ ...formData, customExpertise: e.target.value })}
            className={`
              block w-full px-3 py-2 ${styles.buttonRadius}
              ${styles.contentBg} ${styles.contentBorder} border ${styles.textColor}
              focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500
            `}
            placeholder="e.g., React Native, GraphQL, WebSockets"
          />
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/personas')}
            className={`
              px-4 py-2 ${styles.buttonRadius}
              ${styles.contentBg} ${styles.contentBorder} border ${styles.textColor}
              hover:opacity-80 transition-opacity
            `}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`
              px-4 py-2 ${styles.buttonRadius}
              ${styles.primaryButton} ${styles.primaryButtonText}
              ${styles.primaryButtonHover} transition-colors
            `}
          >
            Spawn agent
          </button>
        </div>
      </form>
    </div>
  );
}