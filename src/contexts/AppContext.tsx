import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Persona, Project, WorkItem, JamSession, DailyReport } from '../types';

interface AppContextType {
  personas: Persona[];
  projects: Project[];
  workItems: WorkItem[];
  jamSessions: JamSession[];
  dailyReports: DailyReport[];
  
  // Actions
  createPersona: (persona: Omit<Persona, 'id'>) => void;
  updatePersona: (id: string, updates: Partial<Persona>) => void;
  createProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'workItems'>) => void;
  createWorkItem: (workItem: Omit<WorkItem, 'id' | 'createdAt' | 'updatedAt' | 'jamSessionIds'>) => void;
  updateWorkItem: (id: string, updates: Partial<WorkItem>) => void;
  assignPersonaToWorkItem: (workItemId: string, personaId: string) => void;
  startJamSession: (workItemId: string, participantIds: string[], title: string) => string;
  addJamMessage: (sessionId: string, personaId: string, content: string, type: 'message' | 'challenge' | 'suggestion' | 'decision') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'project-mgmt-ux-data';

export function AppProvider({ children }: { children: ReactNode }) {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [jamSessions, setJamSessions] = useState<JamSession[]>([]);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      const data = JSON.parse(savedData);
      setPersonas(data.personas || []);
      setProjects(data.projects || []);
      setWorkItems(data.workItems || []);
      setJamSessions(data.jamSessions || []);
      setDailyReports(data.dailyReports || []);
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    const data = { personas, projects, workItems, jamSessions, dailyReports };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [personas, projects, workItems, jamSessions, dailyReports]);

  const createPersona = (persona: Omit<Persona, 'id'>) => {
    const newPersona: Persona = {
      ...persona,
      id: uuidv4(),
    };
    setPersonas([...personas, newPersona]);
  };

  const updatePersona = (id: string, updates: Partial<Persona>) => {
    setPersonas(personas.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const createProject = (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'workItems'>) => {
    const newProject: Project = {
      ...project,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
      workItems: [],
    };
    setProjects([...projects, newProject]);
  };

  const createWorkItem = (workItem: Omit<WorkItem, 'id' | 'createdAt' | 'updatedAt' | 'jamSessionIds'>) => {
    const newWorkItem: WorkItem = {
      ...workItem,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
      jamSessionIds: [],
    };
    setWorkItems([...workItems, newWorkItem]);
    
    // Add to project
    setProjects(projects.map(p => 
      p.id === workItem.projectId 
        ? { ...p, workItems: [...p.workItems, newWorkItem.id], updatedAt: new Date() }
        : p
    ));
  };

  const updateWorkItem = (id: string, updates: Partial<WorkItem>) => {
    setWorkItems(workItems.map(w => 
      w.id === id 
        ? { ...w, ...updates, updatedAt: new Date() } 
        : w
    ));
  };

  const assignPersonaToWorkItem = (workItemId: string, personaId: string) => {
    updateWorkItem(workItemId, {
      assignedPersonaIds: [...(workItems.find(w => w.id === workItemId)?.assignedPersonaIds || []), personaId]
    });
    updatePersona(personaId, { currentTaskId: workItemId, status: 'busy' });
  };

  const startJamSession = (workItemId: string, participantIds: string[], title: string) => {
    const newSession: JamSession = {
      id: uuidv4(),
      workItemId,
      title,
      participantIds,
      messages: [],
      decisions: [],
      createdAt: new Date(),
      status: 'active',
    };
    setJamSessions([...jamSessions, newSession]);
    
    // Update work item
    const workItem = workItems.find(w => w.id === workItemId);
    if (workItem) {
      updateWorkItem(workItemId, {
        jamSessionIds: [...workItem.jamSessionIds, newSession.id]
      });
    }
    
    return newSession.id;
  };

  const addJamMessage = (sessionId: string, personaId: string, content: string, type: 'message' | 'challenge' | 'suggestion' | 'decision') => {
    setJamSessions(jamSessions.map(session => 
      session.id === sessionId 
        ? {
            ...session,
            messages: [...session.messages, {
              id: uuidv4(),
              personaId,
              content,
              timestamp: new Date(),
              type,
            }]
          }
        : session
    ));
  };

  const value: AppContextType = {
    personas,
    projects,
    workItems,
    jamSessions,
    dailyReports,
    createPersona,
    updatePersona,
    createProject,
    createWorkItem,
    updateWorkItem,
    assignPersonaToWorkItem,
    startJamSession,
    addJamMessage,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}