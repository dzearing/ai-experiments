import { createDataBus, type DataBus } from '@claude-flow/data-bus';
import { createWorkspaceDataProvider } from './WorkspaceDataProvider.js';

/**
 * Global data bus instance for the ideate client.
 * This is the single source of truth for real-time resource state.
 */
export const dataBus: DataBus = createDataBus();

/**
 * Track active workspace provider instance.
 * The provider's onDeactivate will be called when paths are unsubscribed.
 */
let currentProvider: ReturnType<typeof createWorkspaceDataProvider> | null = null;
let isProviderActive = false;

/**
 * Initialize the workspace data provider for real-time updates.
 * This connects to the WebSocket server and subscribes to resource updates.
 *
 * Returns a cleanup function to disconnect the provider.
 */
export function initializeWorkspaceProvider(
  workspaceId: string,
  userId: string,
): () => void {
  // Deactivate any existing provider
  if (currentProvider && isProviderActive) {
    currentProvider.onDeactivate?.({ path: [], bus: dataBus });
    isProviderActive = false;
  }

  // Create the new provider
  currentProvider = createWorkspaceDataProvider({
    workspaceId,
    userId,
  });

  // Add the provider to the data bus
  dataBus.addProvider(currentProvider);

  // Manually activate since we're setting up immediately
  currentProvider.onActivate?.({ path: [], bus: dataBus });
  isProviderActive = true;

  // Return a cleanup function
  return () => {
    if (currentProvider && isProviderActive) {
      currentProvider.onDeactivate?.({ path: [], bus: dataBus });
      isProviderActive = false;
      currentProvider = null;
    }
  };
}
