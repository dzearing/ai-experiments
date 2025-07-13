// DataBusAdapter.ts - Bridge between existing EventSource and new DataBus pattern
import { dataBus } from '@claude-flow/data-bus';
import { useAuthStore } from '@claude-flow/stores';
import { useProjectStore } from '@claude-flow/stores';
import { useWorkItemStore } from '@claude-flow/stores';

/**
 * Adapts the existing EventSource implementation to work with the new DataBus pattern
 * This allows gradual migration from the current SSE setup to WebSockets
 */
export class DataBusAdapter {
  private eventSource: EventSource | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  
  /**
   * Connect to the existing SSE endpoint and bridge to DataBus
   */
  connect(workspaceId: string) {
    if (this.eventSource?.readyState === EventSource.OPEN) return;
    
    // Use existing SSE endpoint
    this.eventSource = new EventSource(`/api/sse?workspaceId=${workspaceId}`);
    
    // Map existing events to DataBus patterns
    this.setupEventMappings();
    
    this.eventSource.onopen = () => {
      console.log('SSE connected, bridging to DataBus');
      dataBus.emit('connected');
    };
    
    this.eventSource.onerror = () => {
      console.error('SSE error, scheduling reconnect');
      this.scheduleReconnect(workspaceId);
    };
  }
  
  /**
   * Map existing SSE events to DataBus patterns and update Zustand stores
   */
  private setupEventMappings() {
    if (!this.eventSource) return;
    
    // Project events
    this.eventSource.addEventListener('project-created', (event) => {
      const project = JSON.parse(event.data);
      
      // Update store directly
      useProjectStore.getState().addProject(project);
      
      // Also emit to DataBus for other listeners
      dataBus.emit('project:created', project);
    });
    
    this.eventSource.addEventListener('project-updated', (event) => {
      const project = JSON.parse(event.data);
      
      useProjectStore.getState().updateProject(project.id, project);
      dataBus.emit('project:updated', project);
    });
    
    this.eventSource.addEventListener('project-deleted', (event) => {
      const { id } = JSON.parse(event.data);
      
      useProjectStore.getState().removeProject(id);
      dataBus.emit('project:deleted', { id });
    });
    
    // Work item events
    this.eventSource.addEventListener('workitem-created', (event) => {
      const workItem = JSON.parse(event.data);
      
      useWorkItemStore.getState().addWorkItem(workItem);
      dataBus.emit('workitem:created', workItem);
    });
    
    this.eventSource.addEventListener('workitem-updated', (event) => {
      const workItem = JSON.parse(event.data);
      
      useWorkItemStore.getState().updateWorkItem(workItem.id, workItem);
      dataBus.emit('workitem:updated', workItem);
    });
    
    // User events
    this.eventSource.addEventListener('user-joined', (event) => {
      const user = JSON.parse(event.data);
      dataBus.emit('user:joined', user);
    });
    
    this.eventSource.addEventListener('user-left', (event) => {
      const user = JSON.parse(event.data);
      dataBus.emit('user:left', user);
    });
    
    // Claude session events
    this.eventSource.addEventListener('claude-message', (event) => {
      const message = JSON.parse(event.data);
      dataBus.emit('claude:message', message);
    });
    
    this.eventSource.addEventListener('claude-streaming', (event) => {
      const data = JSON.parse(event.data);
      dataBus.emit('claude:streaming', data);
    });
  }
  
  /**
   * Disconnect and cleanup
   */
  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    dataBus.emit('disconnected');
  }
  
  /**
   * Schedule reconnection on error
   */
  private scheduleReconnect(workspaceId: string) {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    
    this.reconnectTimeout = setTimeout(() => {
      console.log('Attempting to reconnect...');
      this.connect(workspaceId);
    }, 3000);
  }
}

// Singleton instance
export const dataBusAdapter = new DataBusAdapter();

/**
 * Hook to use DataBus adapter in React components
 */
export function useDataBusAdapter() {
  const { workspace } = useAuthStore();
  
  useEffect(() => {
    if (workspace?.id) {
      dataBusAdapter.connect(workspace.id);
    }
    
    return () => {
      dataBusAdapter.disconnect();
    };
  }, [workspace?.id]);
}

/**
 * Example: Migrating from useSubscription hook to DataBus
 * 
 * Before:
 * ```tsx
 * const { subscribe } = useSubscription();
 * useEffect(() => {
 *   const unsubscribe = subscribe('project-updated', (data) => {
 *     // Handle update
 *   });
 *   return unsubscribe;
 * }, []);
 * ```
 * 
 * After:
 * ```tsx
 * useEffect(() => {
 *   const subscription = dataBus.subscribe('project:updated', (project) => {
 *     // Handle update - store is automatically updated
 *   });
 *   return () => subscription.unsubscribe();
 * }, []);
 * ```
 * 
 * Or just use the store directly:
 * ```tsx
 * const projects = useProjectStore((state) => state.projects);
 * // Projects automatically update via DataBus
 * ```
 */