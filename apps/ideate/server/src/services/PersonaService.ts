import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Persona configuration loaded from markdown
 */
export interface Persona {
  name: string;
  systemPrompt: string;
  rawContent: string;
  source: 'user' | 'default';
  description?: string;
  example?: string;
}

/**
 * Preset info for listing available presets
 */
export interface PresetInfo {
  id: string;
  name: string;
  description: string;
  example: string;
}

// User override directory (in home folder)
const USER_PERSONAS_DIR = path.join(homedir(), 'Ideate', 'personas');
// Default personas directory (in the repo)
const DEFAULT_PERSONAS_DIR = path.join(__dirname, '..', 'personas');
// Presets directory (in the repo)
const PRESETS_DIR = path.join(DEFAULT_PERSONAS_DIR, 'presets');

const DEFAULT_FACILITATOR_NAME = 'Facilitator';

// Default facilitator system prompt if no persona file exists
const DEFAULT_FACILITATOR_PROMPT = `You are a helpful AI facilitator for Ideate, a project management and ideation platform.

Your role is to:
- Help users organize their ideas and projects
- Provide suggestions for improving their work items
- Answer questions about project management best practices
- Assist with brainstorming and creative problem-solving
- Help break down complex tasks into manageable steps

Be friendly, concise, and helpful. When making suggestions, explain your reasoning.
If you're unsure about sometopic, ask clarifying questions.`;

/**
 * Service for loading and managing personas.
 *
 * Personas are loaded with the following priority:
 * 1. User override: ~/Ideate/personas/{name}.md
 * 2. Default: src/personas/{name}.md (in repo)
 * 3. Fallback: hardcoded default prompt
 */
export class PersonaService {
  private personaCache: Map<string, Persona> = new Map();

  /**
   * Load a persona from its markdown file.
   * Checks user override directory first, then falls back to defaults.
   */
  getPersona(name: string): Persona {
    // Check cache first
    const cached = this.personaCache.get(name);
    if (cached) {
      return cached;
    }

    // Try user override first
    const userPath = path.join(USER_PERSONAS_DIR, `${name}.md`);
    if (fs.existsSync(userPath)) {
      try {
        const content = fs.readFileSync(userPath, 'utf-8');
        const persona = this.parsePersonaMarkdown(name, content, 'user');
        this.personaCache.set(name, persona);
        console.log(`[PersonaService] Loaded persona "${name}" from user override: ${userPath}`);
        return persona;
      } catch (error) {
        console.error(`[PersonaService] Failed to load user persona "${name}":`, error);
      }
    }

    // Try default from repo
    const defaultPath = path.join(DEFAULT_PERSONAS_DIR, `${name}.md`);
    if (fs.existsSync(defaultPath)) {
      try {
        const content = fs.readFileSync(defaultPath, 'utf-8');
        const persona = this.parsePersonaMarkdown(name, content, 'default');
        this.personaCache.set(name, persona);
        console.log(`[PersonaService] Loaded persona "${name}" from defaults: ${defaultPath}`);
        return persona;
      } catch (error) {
        console.error(`[PersonaService] Failed to load default persona "${name}":`, error);
      }
    }

    // Return hardcoded fallback
    console.log(`[PersonaService] Using hardcoded fallback for persona "${name}"`);
    const fallbackPersona: Persona = {
      name: DEFAULT_FACILITATOR_NAME,
      systemPrompt: DEFAULT_FACILITATOR_PROMPT,
      rawContent: '',
      source: 'default',
    };
    return fallbackPersona;
  }

  /**
   * Get the facilitator persona specifically.
   */
  getFacilitatorPersona(): Persona {
    return this.getPersona('facilitator');
  }

  /**
   * Parse persona markdown content into a Persona object.
   *
   * Expected format:
   * # Persona Name
   *
   * ## System Prompt
   * The system prompt content...
   *
   * ## Description
   * Brief description for UI...
   *
   * ## Example
   * Example response snippet...
   */
  private parsePersonaMarkdown(name: string, content: string, source: 'user' | 'default'): Persona {
    const lines = content.split('\n');
    let personaName = name;
    let systemPrompt = '';
    let description = '';
    let example = '';
    let currentSection: 'none' | 'system' | 'description' | 'example' = 'none';

    for (const line of lines) {
      // Extract name from first H1
      if (line.startsWith('# ') && personaName === name) {
        personaName = line.slice(2).trim();
        continue;
      }

      // Check for section headers
      const lowerLine = line.toLowerCase();
      if (lowerLine.startsWith('## system prompt')) {
        currentSection = 'system';
        continue;
      }
      if (lowerLine.startsWith('## description')) {
        currentSection = 'description';
        continue;
      }
      if (lowerLine.startsWith('## example')) {
        currentSection = 'example';
        continue;
      }
      // Any other H2 ends the current section
      if (line.startsWith('## ')) {
        currentSection = 'none';
        continue;
      }

      // Accumulate content based on current section
      switch (currentSection) {
        case 'system':
          systemPrompt += line + '\n';
          break;
        case 'description':
          description += line + '\n';
          break;
        case 'example':
          example += line + '\n';
          break;
      }
    }

    // Use entire content as system prompt if no specific section found
    if (!systemPrompt.trim()) {
      // Remove the H1 title if present
      const titleMatch = content.match(/^# .+\n/);
      systemPrompt = titleMatch ? content.slice(titleMatch[0].length) : content;
    }

    return {
      name: personaName,
      systemPrompt: systemPrompt.trim() || DEFAULT_FACILITATOR_PROMPT,
      rawContent: content,
      source,
      description: description.trim() || undefined,
      example: example.trim() || undefined,
    };
  }

  /**
   * Clear the persona cache (useful when persona files are updated).
   */
  clearCache(): void {
    this.personaCache.clear();
  }

  /**
   * List all available personality presets.
   */
  listPresets(): PresetInfo[] {
    const presets: PresetInfo[] = [];

    if (!fs.existsSync(PRESETS_DIR)) {
      console.log(`[PersonaService] Presets directory not found: ${PRESETS_DIR}`);
      return presets;
    }

    const files = fs.readdirSync(PRESETS_DIR).filter((f) => f.endsWith('.md'));

    for (const file of files) {
      const id = file.replace('.md', '');
      const filePath = path.join(PRESETS_DIR, file);
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const parsed = this.parsePersonaMarkdown(id, content, 'default');
        presets.push({
          id,
          name: parsed.name,
          description: parsed.description || '',
          example: parsed.example || '',
        });
      } catch (error) {
        console.error(`[PersonaService] Failed to load preset ${id}:`, error);
      }
    }

    return presets;
  }

  /**
   * Get a specific preset by ID.
   */
  getPreset(presetId: string): Persona | null {
    const filePath = path.join(PRESETS_DIR, `${presetId}.md`);

    if (!fs.existsSync(filePath)) {
      console.log(`[PersonaService] Preset not found: ${presetId}`);
      return null;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return this.parsePersonaMarkdown(presetId, content, 'default');
    } catch (error) {
      console.error(`[PersonaService] Failed to load preset ${presetId}:`, error);
      return null;
    }
  }

  /**
   * Get the user's custom persona if it exists.
   */
  getUserPersona(): Persona | null {
    const userPath = path.join(USER_PERSONAS_DIR, 'facilitator.md');

    if (!fs.existsSync(userPath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(userPath, 'utf-8');
      return this.parsePersonaMarkdown('facilitator', content, 'user');
    } catch (error) {
      console.error('[PersonaService] Failed to load user persona:', error);
      return null;
    }
  }

  /**
   * Create a user persona from a preset.
   * Copies the preset content to ~/Ideate/personas/facilitator.md
   */
  createUserPersona(basePresetId: string): Persona {
    const preset = this.getPreset(basePresetId);
    if (!preset) {
      throw new Error(`Preset not found: ${basePresetId}`);
    }

    // Ensure user personas directory exists
    if (!fs.existsSync(USER_PERSONAS_DIR)) {
      fs.mkdirSync(USER_PERSONAS_DIR, { recursive: true });
    }

    const userPath = path.join(USER_PERSONAS_DIR, 'facilitator.md');
    fs.writeFileSync(userPath, preset.rawContent, 'utf-8');
    console.log(`[PersonaService] Created user persona from preset "${basePresetId}" at ${userPath}`);

    // Clear cache and return the new persona
    this.clearCache();
    return this.getFacilitatorPersona();
  }

  /**
   * Reload the persona from disk, clearing any cached version.
   * Returns the newly loaded persona.
   */
  reloadPersona(): Persona {
    this.clearCache();
    const persona = this.getFacilitatorPersona();
    console.log(`[PersonaService] Reloaded persona "${persona.name}" (source: ${persona.source})`);
    return persona;
  }

  /**
   * Check if a user persona override exists.
   */
  hasUserPersona(): boolean {
    const userPath = path.join(USER_PERSONAS_DIR, 'facilitator.md');
    return fs.existsSync(userPath);
  }

  /**
   * Delete the user's custom persona, reverting to the default.
   */
  deleteUserPersona(): void {
    const userPath = path.join(USER_PERSONAS_DIR, 'facilitator.md');
    if (fs.existsSync(userPath)) {
      fs.unlinkSync(userPath);
      console.log(`[PersonaService] Deleted user persona at ${userPath}`);
    }
    this.clearCache();
  }

  /**
   * Get the path to the user persona file.
   */
  getUserPersonaPath(): string {
    return path.join(USER_PERSONAS_DIR, 'facilitator.md');
  }
}
