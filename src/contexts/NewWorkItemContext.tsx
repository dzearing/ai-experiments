import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';

interface Task {
  id: string;
  title: string;
  description: string;
  goals: string[];
  workDescription: string;
  validationCriteria: string[];
  taskNumber?: string;
}

interface NewWorkItemContextType {
  // Step management
  step: 'input' | 'review';
  setStep: (step: 'input' | 'review') => void;
  
  // Form state
  ideaText: string;
  setIdeaText: (text: string) => void;
  savedIdea: string;
  setSavedIdea: (text: string) => void;
  
  // Tasks
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  editedContent: string;
  setEditedContent: (content: string) => void;
  
  // Processing state
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  
  // Utility functions
  resetToInput: () => void;
}

const NewWorkItemContext = createContext<NewWorkItemContextType | undefined>(undefined);

const STORAGE_KEY = 'newWorkItemState';

export function NewWorkItemProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get initial step from URL
  const stepFromUrl = searchParams.get('step') as 'input' | 'review' | null;
  
  // Load persisted state
  const loadPersistedState = () => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  };
  
  const persistedState = loadPersistedState();
  
  const [step, setStepState] = useState<'input' | 'review'>(stepFromUrl || 'input');
  
  // Form state - initialize from persisted state if available
  const [ideaText, setIdeaText] = useState(persistedState?.ideaText || '');
  const [savedIdea, setSavedIdea] = useState(persistedState?.savedIdea || '');
  
  // Tasks state
  const [tasks, setTasks] = useState<Task[]>(persistedState?.tasks || []);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(persistedState?.selectedTaskId || null);
  const [editedContent, setEditedContent] = useState(persistedState?.editedContent || '');
  
  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Persist state on changes
  useEffect(() => {
    const stateToSave = {
      ideaText,
      savedIdea,
      tasks,
      selectedTaskId,
      editedContent,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }, [ideaText, savedIdea, tasks, selectedTaskId, editedContent]);
  
  // Update URL when step changes
  const setStep = (newStep: 'input' | 'review') => {
    setStepState(newStep);
    if (newStep === 'input') {
      searchParams.delete('step');
      // Restore saved idea when going back to input
      if (savedIdea) {
        setIdeaText(savedIdea);
      }
    } else {
      searchParams.set('step', newStep);
      // Clear idea text when moving to review (for refinements)
      setIdeaText('');
    }
    setSearchParams(searchParams);
  };
  
  // Handle browser back/forward
  useEffect(() => {
    const urlStep = searchParams.get('step') as 'input' | 'review' | null;
    const currentStep = urlStep || 'input';
    
    if (currentStep !== step) {
      setStepState(currentStep);
      // If going back to input, restore the saved idea
      if (currentStep === 'input' && savedIdea) {
        setIdeaText(savedIdea);
      }
    }
  }, [searchParams, step, savedIdea]);
  
  // Reset to input step with saved idea
  const resetToInput = () => {
    setStep('input');
    setIdeaText(savedIdea);
    setError(null);
  };
  
  const value: NewWorkItemContextType = {
    step,
    setStep,
    ideaText,
    setIdeaText,
    savedIdea,
    setSavedIdea,
    tasks,
    setTasks,
    selectedTaskId,
    setSelectedTaskId,
    editedContent,
    setEditedContent,
    isProcessing,
    setIsProcessing,
    error,
    setError,
    resetToInput,
  };
  
  return (
    <NewWorkItemContext.Provider value={value}>
      {children}
    </NewWorkItemContext.Provider>
  );
}

export function useNewWorkItem() {
  const context = useContext(NewWorkItemContext);
  if (!context) {
    throw new Error('useNewWorkItem must be used within NewWorkItemProvider');
  }
  return context;
}