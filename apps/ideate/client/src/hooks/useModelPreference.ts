import { useState, useCallback, useEffect } from 'react';

/**
 * Available Claude models for the agents
 */
export const AVAILABLE_MODELS = [
  { id: 'claude-sonnet-4-5-20250929', name: 'Sonnet 4.5', shortName: 'sonnet', description: 'Fast and capable (default)' },
  { id: 'claude-opus-4-5-20251101', name: 'Opus 4.5', shortName: 'opus', description: 'Most capable, thoughtful' },
  { id: 'claude-3-5-haiku-20241022', name: 'Haiku 3.5', shortName: 'haiku', description: 'Fastest, most economical' },
] as const;

export type ModelId = typeof AVAILABLE_MODELS[number]['id'];
export type ModelShortName = typeof AVAILABLE_MODELS[number]['shortName'];

const STORAGE_KEY = 'ideate-model-preference';
const DEFAULT_MODEL: ModelId = 'claude-sonnet-4-5-20250929';

/**
 * Get the model ID from a short name or full ID
 */
export function resolveModelId(input: string): ModelId | null {
  const normalized = input.toLowerCase().trim();

  // Check short names first
  const byShortName = AVAILABLE_MODELS.find(m => m.shortName === normalized);
  if (byShortName) return byShortName.id;

  // Check full IDs
  const byId = AVAILABLE_MODELS.find(m => m.id === normalized);
  if (byId) return byId.id;

  // Check partial matches (e.g., "sonnet-4" matches "claude-sonnet-4-5-...")
  const byPartial = AVAILABLE_MODELS.find(m =>
    m.id.includes(normalized) || m.name.toLowerCase().includes(normalized)
  );
  if (byPartial) return byPartial.id;

  return null;
}

/**
 * Get display info for a model ID
 */
export function getModelInfo(modelId: ModelId) {
  return AVAILABLE_MODELS.find(m => m.id === modelId) || AVAILABLE_MODELS[0];
}

/**
 * Hook for managing model preference with localStorage persistence
 */
export function useModelPreference() {
  const [modelId, setModelIdState] = useState<ModelId>(() => {
    if (typeof window === 'undefined') return DEFAULT_MODEL;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && AVAILABLE_MODELS.some(m => m.id === stored)) {
      return stored as ModelId;
    }
    return DEFAULT_MODEL;
  });

  // Sync to localStorage when model changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, modelId);
  }, [modelId]);

  const setModelId = useCallback((id: ModelId) => {
    setModelIdState(id);
  }, []);

  const modelInfo = getModelInfo(modelId);

  return {
    modelId,
    setModelId,
    modelInfo,
    availableModels: AVAILABLE_MODELS,
  };
}

export default useModelPreference;
