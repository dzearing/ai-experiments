import { useState, useEffect, memo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContextV2';
import { Button } from '../components/ui/Button';
import { IconButton } from '../components/ui/IconButton';
import { StockPhotoAvatar, getRandomName, getGenderFromSeed, hashCode } from '../components/StockPhotoAvatar';
import { InlineLoadingSpinner } from '../components/ui/LoadingSpinner';
import type { PersonaType } from '../types';

interface StepProps {
  onNext: () => void;
  onBack?: () => void;
  currentStep: number;
  totalSteps: number;
}

interface AgentSuggestion {
  type: PersonaType;
  jobTitle: string;
  name: string;
  personality?: string; // Deprecated
  expertise: string[];
  systemPrompt?: string; // Deprecated
  agentPrompt: string; // Full markdown specification
}

// Step 1: Describe Work
const DescribeWorkStep = memo(function DescribeWorkStep({ onNext, workDescription, setWorkDescription, isAnalyzing, setIsAnalyzing, setAgentSuggestion }: Omit<StepProps, 'currentStep' | 'totalSteps'> & {
  workDescription: string;
  setWorkDescription: (value: string) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (value: boolean) => void;
  setAgentSuggestion: (suggestion: AgentSuggestion) => void;
}) {
  const { currentStyles } = useTheme();
  const styles = currentStyles;
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!workDescription.trim()) {
      setError('Please describe the type of work');
      return;
    }

    setError('');
    setIsAnalyzing(true);

    try {
      // Check if mock mode is enabled
      const mockMode = localStorage.getItem('mockMode') === 'true';
      
      if (mockMode) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Generate mock suggestion based on keywords
        const lowerDesc = workDescription.toLowerCase();
        let type: PersonaType = 'developer';
        let jobTitle = 'Senior Software Engineer';
        let expertise = ['Code Review', 'Best Practices', 'Architecture'];
        
        if (lowerDesc.includes('design') || lowerDesc.includes('ui') || lowerDesc.includes('ux')) {
          type = 'designer';
          jobTitle = 'UI/UX Designer';
          expertise = ['UI Design', 'User Experience', 'Design Systems', 'Prototyping'];
        } else if (lowerDesc.includes('test') || lowerDesc.includes('qa')) {
          type = 'tester';
          jobTitle = 'Quality Assurance Engineer';
          expertise = ['Test Planning', 'Edge Cases', 'Automation', 'Quality Assurance'];
        } else if (lowerDesc.includes('data') || lowerDesc.includes('analytics')) {
          type = 'data-scientist';
          jobTitle = 'Data Scientist';
          expertise = ['Data Analysis', 'Statistical Modeling', 'Visualization', 'Machine Learning'];
        } else if (lowerDesc.includes('devops') || lowerDesc.includes('infrastructure')) {
          type = 'devops';
          jobTitle = 'DevOps Engineer';
          expertise = ['CI/CD', 'Infrastructure', 'Monitoring', 'Cloud Platforms'];
        } else if (lowerDesc.includes('manage') || lowerDesc.includes('project')) {
          type = 'project-manager';
          jobTitle = 'Project Manager';
          expertise = ['Sprint Planning', 'Risk Management', 'Stakeholder Communication', 'Resource Planning'];
        }
        
        // For mock mode, we'll generate a simple prompt
        const suggestion: AgentSuggestion = {
          type,
          jobTitle,
          name: 'Alex Chen',
          expertise,
          agentPrompt: `# Agent Specification\n\nWork requested: ${workDescription}\n\n## Overview\nAgent type: ${type}\nJob title: ${jobTitle}\n\n## Expertise\n${expertise.map(e => `- ${e}`).join('\n')}`
        };
        
        setAgentSuggestion(suggestion);
        onNext();
      } else {
        // Call Claude API to generate agent specification
        const response = await fetch('http://localhost:3000/api/claude/generate-agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workDescription })
        });

        if (!response.ok) {
          throw new Error('Failed to analyze work description');
        }

        const data = await response.json();
        console.log('Received agent specification from API:', data);
        setAgentSuggestion(data);
        // Store in sessionStorage to persist across navigation
        sessionStorage.setItem('tempAgentSuggestion', JSON.stringify(data));
        // Call onNext which should update the step
        onNext();
      }
    } catch (error) {
      console.error('Error analyzing work:', error);
      setError('Failed to analyze work description. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`text-xl font-semibold ${styles.headingColor} mb-2`}>
          What type of work are you doing?
        </h2>
        <p className={`text-sm ${styles.mutedText}`}>
          Describe the work or project you need help with, and we'll suggest the perfect agent type.
        </p>
      </div>

      <div>
        <label htmlFor="workDescription" className={`block text-sm font-medium ${styles.textColor} mb-2`}>
          Work description
        </label>
        <textarea
          id="workDescription"
          key="workDescription-textarea"
          value={workDescription}
          onChange={(e) => setWorkDescription(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              handleAnalyze();
            }
          }}
          rows={4}
          className={`
            block w-full px-3 py-2 ${styles.buttonRadius}
            ${styles.contentBg} ${styles.contentBorder} border ${styles.textColor}
            focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500
          `}
          placeholder="e.g., I need help designing a user-friendly dashboard for data visualization..."
          disabled={isAnalyzing}
        />
        {error && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleAnalyze}
          variant="primary"
          disabled={isAnalyzing || !workDescription.trim()}
        >
          {isAnalyzing ? (
            <>
              <InlineLoadingSpinner className="mr-2 inline-flex" variant="primary" />
              Analyzing...
            </>
          ) : (
            'Analyze & Continue'
          )}
        </Button>
      </div>
    </div>
  );
});

// Step 2: Review and Customize
function ReviewCustomizeStep({ onNext, onBack, agentSuggestion, setAgentSuggestion, avatarSeed, setAvatarSeed }: StepProps & {
  agentSuggestion: AgentSuggestion;
  setAgentSuggestion: (suggestion: AgentSuggestion) => void;
  avatarSeed: string;
  setAvatarSeed: (seed: string) => void;
}) {
  const { currentStyles } = useTheme();
  const styles = currentStyles;
  
  const [formData, setFormData] = useState({
    name: agentSuggestion.name,
    customExpertise: '',
    agentPrompt: agentSuggestion.agentPrompt || '',
  });

  const randomizeAvatar = () => {
    let newSeed = Date.now().toString() + Math.random();
    
    // Keep generating new seeds until we get a different avatar
    const currentPhotoIndex = hashCode(avatarSeed) % 100;
    const currentGender = getGenderFromSeed(avatarSeed);
    
    let attempts = 0;
    while (attempts < 100) {
      newSeed = Date.now().toString() + Math.random() + Math.random();
      const newPhotoIndex = hashCode(newSeed) % 100;
      const newGender = getGenderFromSeed(newSeed);
      
      // Accept if different photo (must also match gender to avoid mismatch)
      if (newPhotoIndex !== currentPhotoIndex) {
        console.log('Found new avatar - seed:', newSeed, 'gender:', newGender, 'photoIndex:', newPhotoIndex);
        break;
      }
      attempts++;
    }
    
    // Get the new gender and name for the new seed
    const newGender = getGenderFromSeed(newSeed);
    const newName = getRandomName(newSeed, newGender);
    
    console.log('Randomize clicked - old seed:', avatarSeed, 'old gender:', currentGender, 'new seed:', newSeed, 'new gender:', newGender, 'new name:', newName);
    
    // Update both avatar seed and name together
    setAvatarSeed(newSeed);
    setFormData(prev => ({ ...prev, name: newName }));
  };

  const handleNext = () => {
    // Update the parent's agentSuggestion with form data
    const updatedSuggestion = {
      ...agentSuggestion,
      name: formData.name,
      agentPrompt: formData.agentPrompt,
      expertise: [
        ...agentSuggestion.expertise,
        ...formData.customExpertise.split(',').map(e => e.trim()).filter(Boolean)
      ]
    };
    setAgentSuggestion(updatedSuggestion);
    onNext();
  };

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h2 className={`text-xl font-semibold ${styles.headingColor} mb-2`}>
          Customize your agent
        </h2>
        <p className={`text-sm ${styles.mutedText}`}>
          Review and customize the suggested agent details.
        </p>
      </div>

      <div className={`p-4 ${styles.contentBg} ${styles.contentBorder} border rounded-lg`}>
        <h3 className={`text-sm font-medium ${styles.mutedText} mb-1`}>Job title</h3>
        <p className={`${styles.headingColor} font-medium`}>
          {agentSuggestion.jobTitle}
        </p>
      </div>

      <div>
        <label htmlFor="name" className={`block text-sm font-medium ${styles.textColor} mb-2`}>
          Agent name
        </label>
        <div className="flex items-center gap-4">
          <div className="relative">
            <StockPhotoAvatar seed={avatarSeed} size={88} key={avatarSeed} />
            <IconButton
              type="button"
              onClick={randomizeAvatar}
              variant="circular"
              size="sm"
              aria-label="Randomize avatar"
              className="absolute -bottom-1 -right-1"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </IconButton>
          </div>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className={`
              flex-1 px-3 py-2 ${styles.buttonRadius}
              ${styles.contentBg} ${styles.contentBorder} border ${styles.textColor}
              focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500
            `}
          />
        </div>
      </div>


      <div>
        <label className={`block text-sm font-medium ${styles.textColor} mb-2`}>
          Core expertise
        </label>
        <ul className="flex flex-wrap gap-2" role="list" aria-label="Core expertise areas">
          {agentSuggestion.expertise.map((skill, index) => (
            <li
              key={index}
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${styles.contentBg} ${styles.contentBorder} border ${styles.textColor}`}
            >
              {skill}
            </li>
          ))}
        </ul>
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

      <div>
        <label htmlFor="agentPrompt" className={`block text-sm font-medium ${styles.textColor} mb-2`}>
          Agent specification
        </label>
        <p className={`text-xs ${styles.mutedText} mb-2`}>
          Complete markdown specification defining the agent's capabilities, inputs, outputs, and working process. Edit to customize the agent's professional role and responsibilities.
        </p>
        <textarea
          id="agentPrompt"
          value={formData.agentPrompt}
          onChange={(e) => setFormData({ ...formData, agentPrompt: e.target.value })}
          rows={20}
          className={`
            block w-full px-3 py-2 ${styles.buttonRadius}
            ${styles.contentBg} ${styles.contentBorder} border ${styles.textColor}
            focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500
            font-mono text-xs
          `}
          placeholder="# Agent Name - Job Title

## Agent Overview
- **Name**: Agent Name
- **Job Title**: Professional Title
- **Primary Role**: Description of primary responsibilities
- **Agent Type**: agent-type

## Core Capabilities
- Capability 1
- Capability 2
...

## Input Requirements
- What data/information the agent needs
- Required formats and structures
...

## Output Deliverables
- What the agent produces
- Format of deliverables
...

## Working Process
1. Step 1
2. Step 2
...

## Integration Points
- How the agent collaborates
- APIs and services used
..."
        />
      </div>

      <div className="flex justify-between">
        <Button
          onClick={onBack}
          variant="secondary"
        >
          Back
        </Button>
        <Button
          onClick={handleNext}
          variant="primary"
        >
          Spawn agent
        </Button>
      </div>
    </div>
  );
}

export function NewAgentMultiStep() {
  const navigate = useNavigate();
  const { personaId, step } = useParams<{ personaId?: string; step?: string }>();
  const { personas, createPersona, updatePersona } = useApp();
  const { currentStyles } = useTheme();
  const styles = currentStyles;

  const isEditMode = !!personaId;
  const existingPersona = isEditMode ? personas.find(p => p.id === personaId) : null;

  // Parse step from URL or default
  const stepFromUrl = step ? parseInt(step) : (isEditMode ? 2 : 1);
  const [currentStep, setCurrentStep] = useState(stepFromUrl);
  const [workDescription, setWorkDescription] = useState('');
  const [avatarSeed, setAvatarSeed] = useState(
    existingPersona?.avatarSeed || Date.now().toString()
  );
  
  // Generate a default suggestion if we're on step 2 without one
  const generateDefaultSuggestion = (): AgentSuggestion => ({
    type: 'developer',
    jobTitle: 'Software Developer',
    name: getRandomName(avatarSeed),
    expertise: ['Frontend Development', 'Backend Development', 'API Design', 'Code Review'],
    agentPrompt: `# ${getRandomName(avatarSeed)} - Software Developer

## Agent Overview
- **Name**: ${getRandomName(avatarSeed)}
- **Job Title**: Software Developer
- **Primary Role**: Full-stack development with focus on modern web technologies
- **Agent Type**: developer

## Core Capabilities
- Frontend Development
- Backend Development
- API Design
- Code Review
- Testing and Quality Assurance
- Documentation

## Input Requirements
- **Project Requirements**: User stories, technical specifications, and acceptance criteria
- **Design Assets**: UI/UX designs, wireframes, and style guides
- **Technical Context**: Existing codebase, API documentation, and architecture diagrams
- **Development Environment**: Access to version control, CI/CD pipelines, and development tools

## Output Deliverables
- Production-ready code following best practices
- Comprehensive unit and integration tests
- API documentation and technical specifications
- Code review feedback and recommendations
- Progress updates and blocker identification

## Working Process
1. **Requirement Analysis**: Review and clarify requirements with stakeholders
2. **Technical Planning**: Design solution architecture and break down into tasks
3. **Implementation**: Write clean, maintainable code following established patterns
4. **Testing**: Ensure quality through automated and manual testing
5. **Documentation**: Document code, APIs, and technical decisions
6. **Review & Iteration**: Conduct code reviews and incorporate feedback

## Integration Points
- **Version Control**: Git for source code management
- **CI/CD**: Automated build and deployment pipelines
- **Project Management**: Jira, Linear, or similar for task tracking
- **Communication**: Slack, Teams for async communication
- **Other Agents**: Collaborates with designers, QA engineers, and DevOps specialists`
  });

  // Try to restore from sessionStorage if on step 2
  const getInitialSuggestion = () => {
    if (existingPersona) {
      return {
        type: existingPersona.type,
        jobTitle: existingPersona.jobTitle || 'Agent',
        name: existingPersona.name,
        expertise: existingPersona.expertise,
        agentPrompt: existingPersona.agentPrompt || existingPersona.systemPrompt || ''
      };
    }
    
    // If we're on step 2, try to load from sessionStorage
    if (currentStep === 2 || stepFromUrl === 2) {
      const stored = sessionStorage.getItem('tempAgentSuggestion');
      if (stored) {
        try {
          console.log('Loading agent suggestion from sessionStorage');
          return JSON.parse(stored);
        } catch (e) {
          console.error('Failed to parse stored suggestion:', e);
        }
      }
    }
    
    return null;
  };
  
  const [agentSuggestion, setAgentSuggestion] = useState<AgentSuggestion | null>(getInitialSuggestion());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Update currentStep when URL changes (browser back/forward)
  useEffect(() => {
    // Only update if actually different
    if (currentStep !== stepFromUrl) {
      setCurrentStep(stepFromUrl);
    }
    // Always ensure we have an agent suggestion on step 2
    if (stepFromUrl === 2 && !agentSuggestion && !isEditMode) {
      console.log('Step 2 without suggestion, creating default');
      setAgentSuggestion(generateDefaultSuggestion());
    }
  }, [stepFromUrl, currentStep]);

  const handleNext = () => {
    if (currentStep === 2 && agentSuggestion) {
      // Create or update agent
      const agentData = {
        name: agentSuggestion.name,
        type: agentSuggestion.type,
        jobTitle: agentSuggestion.jobTitle,
        expertise: agentSuggestion.expertise,
        agentPrompt: agentSuggestion.agentPrompt,
        avatarSeed,
        avatarGender: getGenderFromSeed(avatarSeed),
      };

      if (isEditMode && personaId) {
        updatePersona(personaId, agentData);
      } else {
        createPersona({
          ...agentData,
          status: 'available',
        });
      }
      
      // Clear the temp storage
      sessionStorage.removeItem('tempAgentSuggestion');
      
      navigate('/agents');
    } else {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      // Navigate to step 2 URL
      if (!isEditMode) {
        navigate(`/agents/new/${nextStep}`);
      }
    }
  };

  const handleBack = () => {
    const prevStep = currentStep - 1;
    setCurrentStep(prevStep);
    if (isEditMode) {
      navigate(`/agents/edit/${personaId}/${prevStep}`);
    } else {
      // Don't include the step in URL for step 1, to keep clean URLs
      if (prevStep === 1) {
        navigate('/agents/new');
      } else {
        navigate(`/agents/new/${prevStep}`);
      }
    }
  };

  const steps = [
    {
      title: 'Describe work',
      description: 'Tell us what you need help with'
    },
    {
      title: 'Customize agent',
      description: 'Review and personalize your agent'
    }
  ];

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <div className="mb-8">
        <h1 className={`text-2xl font-bold ${styles.headingColor}`}>
          {isEditMode ? 'Edit agent' : 'Create new agent'}
        </h1>
        
        {/* Progress Steps */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}
              >
                <div className="flex flex-col items-center">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-medium
                      ${index + 1 <= currentStep
                        ? 'bg-blue-600 text-white'
                        : `${styles.contentBg} ${styles.contentBorder} border ${styles.mutedText}`
                      }
                    `}
                  >
                    {index + 1}
                  </div>
                  <div className="mt-2 text-center">
                    <p className={`text-sm font-medium ${index + 1 <= currentStep ? styles.headingColor : styles.mutedText}`}>
                      {step.title}
                    </p>
                    <p className={`text-xs ${styles.mutedText} mt-0.5`}>
                      {step.description}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`
                      flex-1 h-0.5 mx-4 mt-5
                      ${index + 1 < currentStep ? 'bg-blue-600' : `${styles.contentBg}`}
                    `}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="mt-8">
        {currentStep === 1 && !isEditMode && (
          <DescribeWorkStep
            onNext={handleNext}
            workDescription={workDescription}
            setWorkDescription={setWorkDescription}
            isAnalyzing={isAnalyzing}
            setIsAnalyzing={setIsAnalyzing}
            setAgentSuggestion={setAgentSuggestion}
          />
        )}
        {currentStep === 2 && agentSuggestion && (
          <ReviewCustomizeStep
            onNext={handleNext}
            onBack={isEditMode ? undefined : handleBack}
            currentStep={currentStep}
            totalSteps={2}
            agentSuggestion={agentSuggestion}
            setAgentSuggestion={setAgentSuggestion}
            avatarSeed={avatarSeed}
            setAvatarSeed={setAvatarSeed}
          />
        )}
      </div>
    </div>
  );
}