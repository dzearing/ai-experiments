import * as fs from 'fs/promises';
import * as path from 'path';
import { homedir } from 'os';
import { v4 as uuidv4 } from 'uuid';

/**
 * A remembered fact about the user
 */
export interface Fact {
  id: string;
  subject: string;
  detail: string;
  createdAt: number;
  updatedAt?: number;
  source: 'user' | 'inferred';
}

/**
 * Facts storage format
 */
interface FactsData {
  facts: Fact[];
}

// User data directory
const USER_DATA_DIR = path.join(homedir(), 'Ideate', 'users');

/**
 * Service for managing user facts (memory).
 *
 * Facts are persisted per-user in:
 * ~/Ideate/users/{userId}/facts.json
 */
export class FactsService {
  /**
   * Get the facts file path for a user
   */
  private getFactsPath(userId: string): string {
    return path.join(USER_DATA_DIR, userId, 'facts.json');
  }

  /**
   * Ensure the user directory exists
   */
  private async ensureUserDir(userId: string): Promise<void> {
    const userDir = path.join(USER_DATA_DIR, userId);

    try {
      await fs.mkdir(userDir, { recursive: true });
    } catch (error) {
      // Directory may already exist
    }
  }

  /**
   * Load all facts for a user
   */
  async getFacts(userId: string): Promise<Fact[]> {
    const factsPath = this.getFactsPath(userId);

    try {
      const content = await fs.readFile(factsPath, 'utf-8');
      const data: FactsData = JSON.parse(content);

      return data.facts || [];
    } catch (error) {
      // File doesn't exist or is invalid - return empty array
      return [];
    }
  }

  /**
   * Save all facts for a user
   */
  private async saveFacts(userId: string, facts: Fact[]): Promise<void> {
    await this.ensureUserDir(userId);
    const factsPath = this.getFactsPath(userId);
    const data: FactsData = { facts };

    await fs.writeFile(factsPath, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * Add a new fact for a user
   */
  async addFact(
    userId: string,
    subject: string,
    detail: string,
    source: 'user' | 'inferred' = 'inferred'
  ): Promise<Fact> {
    const facts = await this.getFacts(userId);

    // Check if a fact with the same subject already exists
    const existingIndex = facts.findIndex(
      f => f.subject.toLowerCase() === subject.toLowerCase()
    );

    const now = Date.now();

    if (existingIndex >= 0) {
      // Update existing fact
      const existing = facts[existingIndex];
      const updated: Fact = {
        ...existing,
        detail,
        updatedAt: now,
        source,
      };
      facts[existingIndex] = updated;
      await this.saveFacts(userId, facts);
      console.log(`[FactsService] Updated fact for user ${userId}: "${subject}"`);

      return updated;
    }

    // Create new fact
    const fact: Fact = {
      id: uuidv4(),
      subject,
      detail,
      createdAt: now,
      source,
    };

    facts.push(fact);
    await this.saveFacts(userId, facts);
    console.log(`[FactsService] Added fact for user ${userId}: "${subject}"`);

    return fact;
  }

  /**
   * Update an existing fact
   */
  async updateFact(
    userId: string,
    factId: string,
    updates: { subject?: string; detail?: string }
  ): Promise<Fact | null> {
    const facts = await this.getFacts(userId);
    const index = facts.findIndex(f => f.id === factId);

    if (index < 0) {
      return null;
    }

    const updated: Fact = {
      ...facts[index],
      ...updates,
      updatedAt: Date.now(),
    };
    facts[index] = updated;
    await this.saveFacts(userId, facts);
    console.log(`[FactsService] Updated fact ${factId} for user ${userId}`);

    return updated;
  }

  /**
   * Delete a fact
   */
  async deleteFact(userId: string, factId: string): Promise<boolean> {
    const facts = await this.getFacts(userId);
    const index = facts.findIndex(f => f.id === factId);

    if (index < 0) {
      return false;
    }

    facts.splice(index, 1);
    await this.saveFacts(userId, facts);
    console.log(`[FactsService] Deleted fact ${factId} for user ${userId}`);

    return true;
  }

  /**
   * Format facts as a string for system prompt injection
   */
  async formatFactsForPrompt(userId: string): Promise<string | null> {
    const facts = await this.getFacts(userId);

    if (facts.length === 0) {
      return null;
    }

    const factLines = facts.map(f => `- **${f.subject}**: ${f.detail}`);

    return `## Remembered Facts About This User

The following facts have been remembered from previous conversations:

${factLines.join('\n')}

Use this knowledge to provide personalized assistance. When the user shares new important information about themselves, their preferences, or their workflow, use the remember_fact tool to save it for future conversations.`;
  }
}

// Singleton instance
export const factsService = new FactsService();
