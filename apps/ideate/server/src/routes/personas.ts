import { Router, type Request, type Response } from 'express';
import { PersonaService, type PresetInfo, type Persona } from '../services/PersonaService.js';

export const personasRouter = Router();
const personaService = new PersonaService();

// In-memory settings storage (in production, this would be persisted)
const facilitatorSettings = {
  name: 'Facilitator',
  avatar: 'robot',
  selectedPreset: null as string | null,
};

// Flag to indicate persona needs reloading when facilitator opens
let personaReloadNeeded = false;

/**
 * Get the current facilitator settings.
 * Exported so other modules can access the display name.
 */
export function getFacilitatorSettings() {
  return { ...facilitatorSettings };
}

/**
 * GET /api/personas/presets
 * List all available personality presets
 */
personasRouter.get('/presets', (_req: Request, res: Response) => {
  try {
    const presets: PresetInfo[] = personaService.listPresets();
    res.json(presets);
  } catch (error) {
    console.error('[Personas] Error listing presets:', error);
    res.status(500).json({ error: 'Failed to list presets' });
  }
});

/**
 * GET /api/personas/presets/:name
 * Get a specific preset by ID
 */
personasRouter.get('/presets/:name', (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const preset: Persona | null = personaService.getPreset(name);

    if (!preset) {
      res.status(404).json({ error: `Preset not found: ${name}` });
      return;
    }

    res.json(preset);
  } catch (error) {
    console.error('[Personas] Error getting preset:', error);
    res.status(500).json({ error: 'Failed to get preset' });
  }
});

/**
 * GET /api/personas/current
 * Get the current active persona (user override or default)
 */
personasRouter.get('/current', (_req: Request, res: Response) => {
  try {
    const persona: Persona = personaService.getFacilitatorPersona();
    res.json({
      ...persona,
      hasUserOverride: personaService.hasUserPersona(),
    });
  } catch (error) {
    console.error('[Personas] Error getting current persona:', error);
    res.status(500).json({ error: 'Failed to get current persona' });
  }
});

/**
 * POST /api/personas/customize
 * Create a user persona from a preset (copies to ~/Ideate/personas/)
 */
personasRouter.post('/customize', (req: Request, res: Response) => {
  try {
    const { presetId } = req.body;

    if (!presetId) {
      res.status(400).json({ error: 'presetId is required' });
      return;
    }

    const persona: Persona = personaService.createUserPersona(presetId);
    res.json({
      success: true,
      persona,
      path: personaService.getUserPersonaPath(),
    });
  } catch (error) {
    console.error('[Personas] Error customizing persona:', error);
    const message = error instanceof Error ? error.message : 'Failed to customize persona';
    res.status(500).json({ error: message });
  }
});

/**
 * POST /api/personas/reload
 * Reload the persona from disk (used after editing)
 * Returns the new persona and can trigger recalibration message
 */
personasRouter.post('/reload', (_req: Request, res: Response) => {
  try {
    const persona: Persona = personaService.reloadPersona();
    res.json({
      success: true,
      persona,
      message: 'Facilitator recalibrated with prompt changes.',
    });
  } catch (error) {
    console.error('[Personas] Error reloading persona:', error);
    res.status(500).json({ error: 'Failed to reload persona' });
  }
});

/**
 * DELETE /api/personas/user
 * Delete the user's custom persona, reverting to default
 */
personasRouter.delete('/user', (_req: Request, res: Response) => {
  try {
    personaService.deleteUserPersona();
    const persona: Persona = personaService.getFacilitatorPersona();
    res.json({
      success: true,
      persona,
    });
  } catch (error) {
    console.error('[Personas] Error deleting user persona:', error);
    res.status(500).json({ error: 'Failed to delete user persona' });
  }
});

/**
 * GET /api/personas/settings
 * Get facilitator display settings (name, avatar)
 */
personasRouter.get('/settings', (_req: Request, res: Response) => {
  res.json(facilitatorSettings);
});

/**
 * PUT /api/personas/settings
 * Update facilitator display settings
 */
personasRouter.put('/settings', (req: Request, res: Response) => {
  try {
    const { name, avatar, selectedPreset } = req.body;

    if (name !== undefined) {
      facilitatorSettings.name = name;
    }
    if (avatar !== undefined) {
      facilitatorSettings.avatar = avatar;
    }
    if (selectedPreset !== undefined) {
      facilitatorSettings.selectedPreset = selectedPreset;
    }

    res.json(facilitatorSettings);
  } catch (error) {
    console.error('[Personas] Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

/**
 * POST /api/personas/mark-reload
 * Mark that the persona needs to be reloaded when facilitator opens
 */
personasRouter.post('/mark-reload', (_req: Request, res: Response) => {
  personaReloadNeeded = true;
  console.log('[Personas] Marked persona for reload');
  res.json({ success: true });
});

/**
 * GET /api/personas/check-reload
 * Check if persona needs reloading and clear the flag
 */
personasRouter.get('/check-reload', (_req: Request, res: Response) => {
  const needsReload = personaReloadNeeded;
  if (needsReload) {
    personaReloadNeeded = false;
    personaService.reloadPersona();
    console.log('[Personas] Persona reload flag consumed');
  }
  res.json({ needsReload });
});

/**
 * GET /api/personas/user-path
 * Get the path to the user persona file
 */
personasRouter.get('/user-path', (_req: Request, res: Response) => {
  res.json({
    path: personaService.getUserPersonaPath(),
    exists: personaService.hasUserPersona(),
  });
});

/**
 * GET /api/personas/content
 * Get the raw content of the current persona file
 */
personasRouter.get('/content', (_req: Request, res: Response) => {
  try {
    const persona = personaService.getFacilitatorPersona();
    res.json({
      content: persona.rawContent,
      source: persona.source,
    });
  } catch (error) {
    console.error('[Personas] Error getting persona content:', error);
    res.status(500).json({ error: 'Failed to get persona content' });
  }
});

/**
 * PUT /api/personas/content
 * Update the user persona file content
 */
personasRouter.put('/content', (req: Request, res: Response) => {
  try {
    const { content } = req.body;

    if (typeof content !== 'string') {
      res.status(400).json({ error: 'content must be a string' });
      return;
    }

    const fs = require('fs');
    const userPath = personaService.getUserPersonaPath();

    // Ensure directory exists
    const dir = require('path').dirname(userPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write the content
    fs.writeFileSync(userPath, content, 'utf-8');
    console.log(`[Personas] Updated user persona content at ${userPath}`);

    // Reload and return the new persona
    const persona = personaService.reloadPersona();
    res.json({
      success: true,
      persona,
    });
  } catch (error) {
    console.error('[Personas] Error updating persona content:', error);
    res.status(500).json({ error: 'Failed to update persona content' });
  }
});
