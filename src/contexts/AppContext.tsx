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
  deletePersona: (id: string) => void;
  createProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'workItems'>) => void;
  createWorkItem: (workItem: Omit<WorkItem, 'id' | 'createdAt' | 'updatedAt' | 'jamSessionIds'>) => WorkItem;
  updateWorkItem: (id: string, updates: Partial<WorkItem>) => void;
  deleteWorkItem: (id: string) => void;
  assignPersonaToWorkItem: (workItemId: string, personaId: string) => void;
  startJamSession: (workItemId: string, participantIds: string[], title: string) => string;
  addJamMessage: (sessionId: string, personaId: string, content: string, type: 'message' | 'challenge' | 'suggestion' | 'decision') => void;
  updateJamSession: (sessionId: string, updates: Partial<JamSession>) => void;
  syncWorkspaceProjects: (workspaceProjects: any[]) => void;
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

  const deletePersona = (id: string) => {
    setPersonas(personas.filter(p => p.id !== id));
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
      metadata: workItem.metadata || undefined,
    };
    setWorkItems([...workItems, newWorkItem]);
    
    // Add to project
    setProjects(projects.map(p => 
      p.id === workItem.projectId 
        ? { ...p, workItems: [...p.workItems, newWorkItem.id], updatedAt: new Date() }
        : p
    ));
    
    return newWorkItem;
  };

  const updateWorkItem = (id: string, updates: Partial<WorkItem>) => {
    setWorkItems(workItems.map(w => 
      w.id === id 
        ? { ...w, ...updates, updatedAt: new Date() } 
        : w
    ));
  };

  const deleteWorkItem = (id: string) => {
    // Remove from workItems
    setWorkItems(workItems.filter(w => w.id !== id));
    
    // Remove from project's workItems array
    const workItem = workItems.find(w => w.id === id);
    if (workItem) {
      setProjects(projects.map(p => 
        p.id === workItem.projectId 
          ? { ...p, workItems: p.workItems.filter(wId => wId !== id), updatedAt: new Date() }
          : p
      ));
    }
    
    // Remove any jam sessions associated with this work item
    setJamSessions(jamSessions.filter(js => js.workItemId !== id));
    
    // Clear any personas assigned to this work item
    setPersonas(personas.map(p => 
      p.currentTaskId === id 
        ? { ...p, currentTaskId: undefined, status: 'available' }
        : p
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
  
  const updateJamSession = (sessionId: string, updates: Partial<JamSession>) => {
    setJamSessions(jamSessions.map(session => 
      session.id === sessionId 
        ? { ...session, ...updates }
        : session
    ));
  };

  const syncWorkspaceProjects = (workspaceProjects: any[]) => {
    console.log('Syncing workspace projects:', workspaceProjects);
    console.log('Projects with plans:', workspaceProjects.filter(wp => wp.plans).map(wp => wp.name));
    console.log('Projects loading:', workspaceProjects.filter(wp => wp.isLoading).map(wp => wp.name));
    
    // First, sync work items from plans
    const allWorkItems: WorkItem[] = [];
    const projectWorkItemMap: { [projectId: string]: string[] } = {};
    
    workspaceProjects.forEach(wp => {
      // Skip projects that are still loading (don't have plans yet)
      if (wp.isLoading || !wp.plans) {
        console.log(`Skipping project ${wp.name} - still loading details`, { isLoading: wp.isLoading, hasPlans: !!wp.plans });
        return;
      }
      
      // Use the workspace path as a stable identifier (same as in project creation)
      const projectId = wp.path ? `project-${wp.path.replace(/[^a-zA-Z0-9]/g, '-')}` : uuidv4();
      projectWorkItemMap[projectId] = [];
      
      // Process all plan types
      ['ideas', 'planned', 'active', 'completed'].forEach(planType => {
        if (wp.plans[planType]) {
          wp.plans[planType].forEach((plan: any) => {
            if (plan.workItem) {
                // Use metadata workItemId if available, otherwise generate from plan name
                const workItemId = plan.workItem.metadata?.workItemId || 
                                 `${projectId}-${plan.name.replace(/\.md$/, '')}`;
                
                // Check if work item already exists by ID or markdown path
                const existingWorkItem = workItems.find(w => 
                  w.id === workItemId || 
                  (w.markdownPath && w.markdownPath === plan.path)
                );
                
                if (!existingWorkItem) {
                  console.log('Creating work item from plan:', {
                    planName: plan.name,
                    workItemTitle: plan.workItem.title,
                    tasksCount: plan.workItem.tasks ? plan.workItem.tasks.length : 0,
                    tasks: plan.workItem.tasks
                  });
                  
                  const newWorkItem: WorkItem = {
                    id: workItemId,
                    title: plan.workItem.title || plan.name.replace(/\.md$/, '').replace(/-/g, ' '),
                    description: plan.workItem.description || '',
                    priority: (plan.workItem.priority || 'medium') as WorkItem['priority'],
                    status: plan.workItem.status === 'idea' ? 'todo' :
                           plan.workItem.status === 'planned' ? 'planned' :
                           plan.workItem.status === 'active' ? 'active' :
                           plan.workItem.status === 'completed' ? 'completed' :
                           planType === 'active' ? 'active' : 
                           planType === 'completed' ? 'completed' : 
                           planType === 'planned' ? 'planned' : 'todo',
                    projectId: projectId,
                    assignedPersonaIds: [],
                    workflow: [
                      { name: 'Planning', status: planType === 'ideas' ? 'active' : 'completed' },
                      { name: 'Development', status: planType === 'active' ? 'active' : planType === 'completed' ? 'completed' : 'pending' },
                      { name: 'Testing', status: planType === 'completed' ? 'completed' : 'pending' },
                      { name: 'Review', status: planType === 'completed' ? 'completed' : 'pending' }
                    ],
                    currentWorkflowStep: planType === 'ideas' ? 0 : planType === 'planned' ? 1 : planType === 'active' ? 2 : 3,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    jamSessionIds: [],
                    markdownPath: plan.path,
                    metadata: {
                      ...(plan.workItem.metadata || {}),
                      tasks: plan.workItem.tasks || [],
                      goals: plan.workItem.goals || [],
                      acceptanceCriteria: plan.workItem.acceptanceCriteria || []
                    }
                  };
                  allWorkItems.push(newWorkItem);
                  projectWorkItemMap[projectId].push(newWorkItem.id);
                }
              }
          });
        }
      });
    });
    
    // Add new work items (avoiding duplicates)
    if (allWorkItems.length > 0) {
      setWorkItems(prevWorkItems => {
        // Create a map of existing work items by their markdown path
        const existingPaths = new Set(prevWorkItems.map(item => item.markdownPath).filter(Boolean));
        
        // Filter out work items that already exist
        const newUniqueWorkItems = allWorkItems.filter(item => 
          !item.markdownPath || !existingPaths.has(item.markdownPath)
        );
        
        console.log('Syncing work items:', {
          existingCount: prevWorkItems.length,
          newCount: allWorkItems.length,
          uniqueNewCount: newUniqueWorkItems.length,
          duplicatesSkipped: allWorkItems.length - newUniqueWorkItems.length
        });
        
        return [...prevWorkItems, ...newUniqueWorkItems];
      });
    }
    
    // Convert workspace projects to app projects
    const newProjects: Project[] = workspaceProjects.map(wp => {
      // Use the workspace path as a stable identifier
      const stableProjectId = wp.path ? `project-${wp.path.replace(/[^a-zA-Z0-9]/g, '-')}` : uuidv4();
      
      // Check if project already exists by path or name
      const existingProject = projects.find(p => p.path === wp.path || p.name === wp.name);
      const projectId = existingProject?.id || stableProjectId;
      
      if (existingProject) {
        // Update existing project with workspace data
        return {
          ...existingProject,
          id: existingProject.id, // Keep existing ID
          description: wp.purpose || existingProject.description,
          purpose: wp.purpose,
          repositories: wp.repositories || [],
          primaryRepoUrl: wp.primaryRepoUrl,
          readme: wp.readme,
          path: wp.path,
          workItems: [...new Set([...existingProject.workItems, ...(projectWorkItemMap[projectId] || [])])] // Avoid duplicate work item IDs
        };
      }
      
      // Create new project from workspace data
      return {
        id: projectId,
        name: wp.name,
        description: wp.purpose || 'No description available',
        purpose: wp.purpose,
        status: 'active' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        workItems: projectWorkItemMap[projectId] || [],
        path: wp.path,
        repositories: wp.repositories || [],
        primaryRepoUrl: wp.primaryRepoUrl,
        readme: wp.readme,
      };
    });
    
    setProjects(newProjects);
  };

  const value: AppContextType = {
    personas,
    projects,
    workItems,
    jamSessions,
    dailyReports,
    createPersona,
    updatePersona,
    deletePersona,
    createProject,
    createWorkItem,
    updateWorkItem,
    deleteWorkItem,
    assignPersonaToWorkItem,
    startJamSession,
    addJamMessage,
    updateJamSession,
    syncWorkspaceProjects,
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