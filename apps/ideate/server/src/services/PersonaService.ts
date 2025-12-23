import * as fs from 'fs/promises';
import * as path from 'path';
import { homedir } from 'os';

/**
 * Persona configuration loaded from markdown
 */
export interface Persona {
  name: string;
  systemPrompt: string;
  rawContent: string;
}

// Directory for persona files
const PERSONAS_DIR = path.join(homedir(), 'Ideate', 'personas');
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
If you're unsure about something, ask clarifying questions.`;

/**
 * Service for loading and managing personas.
 */
export class PersonaService {
  private personaCache: Map<string, Persona> = new Map();

  constructor() {
    this.ensureDirectoryExists();
  }

  private async ensureDirectoryExists(): Promise<void> {
    try {
      await fs.mkdir(PERSONAS_DIR, { recursive: true });
    } catch (error) {
      console.error('Failed to create personas directory:', error);
    }
  }

  private getPersonaPath(name: string): string {
    return path.join(PERSONAS_DIR, `${name}.md`);
  }

  /**
   * Load a persona from its markdown file.
   * Returns cached version if available.
   */
  async getPersona(name: string): Promise<Persona> {
    // Check cache first
    const cached = this.personaCache.get(name);
    if (cached) {
      return cached;
    }

    // Try to load from file
    try {
      const content = await fs.readFile(this.getPersonaPath(name), 'utf-8');
      const persona = this.parsePersonaMarkdown(name, content);
      this.personaCache.set(name, persona);
      return persona;
    } catch {
      // Return default persona
      const defaultPersona: Persona = {
        name: DEFAULT_FACILITATOR_NAME,
        systemPrompt: DEFAULT_FACILITATOR_PROMPT,
        rawContent: '',
      };
      return defaultPersona;
    }
  }

  /**
   * Get the facilitator persona specifically.
   */
  async getFacilitatorPersona(): Promise<Persona> {
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
   * Any additional content becomes part of rawContent.
   */
  private parsePersonaMarkdown(name: string, content: string): Persona {
    const lines = content.split('\n');
    let personaName = name;
    let systemPrompt = '';
    let inSystemPrompt = false;

    for (const line of lines) {
      // Extract name from first H1
      if (line.startsWith('# ') && personaName === name) {
        personaName = line.slice(2).trim();
        continue;
      }

      // Check for system prompt section
      if (line.toLowerCase().startsWith('## system prompt')) {
        inSystemPrompt = true;
        continue;
      }

      // Check for other H2 sections
      if (line.startsWith('## ') && inSystemPrompt) {
        inSystemPrompt = false;
        continue;
      }

      // Accumulate system prompt content
      if (inSystemPrompt) {
        systemPrompt += line + '\n';
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
    };
  }

  /**
   * Clear the persona cache (useful when persona files are updated).
   */
  clearCache(): void {
    this.personaCache.clear();
  }

  /**
   * Create a default facilitator persona file if it doesn't exist.
   */
  async createDefaultFacilitatorPersona(): Promise<void> {
    const facilitatorPath = this.getPersonaPath('facilitator');

    try {
      await fs.access(facilitatorPath);
      // File exists, don't overwrite
    } catch {
      // File doesn't exist, create it
      const defaultContent = `# ${DEFAULT_FACILITATOR_NAME}

## System Prompt

${DEFAULT_FACILITATOR_PROMPT}
`;
      await fs.writeFile(facilitatorPath, defaultContent, 'utf-8');
      console.log('[PersonaService] Created default facilitator persona');
    }
  }
}
