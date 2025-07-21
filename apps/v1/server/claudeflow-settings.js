const fs = require('fs').promises;
const path = require('path');

class ClaudeFlowSettings {
  constructor() {
    this.fileName = 'claudeflow.settings.json';
    this.version = '1.0.0';
  }

  async load(projectPath) {
    const settingsPath = path.join(projectPath, this.fileName);

    try {
      const content = await fs.readFile(settingsPath, 'utf-8');

      // Check if file is empty or whitespace only
      if (!content.trim()) {
        console.log('claudeflow.settings.json is empty, creating default settings');
        const defaultSettings = this.createDefaultSettings(path.basename(projectPath));
        await this.save(projectPath, defaultSettings);
        return defaultSettings;
      }

      try {
        return JSON.parse(content);
      } catch (parseErr) {
        console.error('Failed to parse claudeflow.settings.json:', parseErr);
        console.error('File content:', content);

        // Backup the corrupted file
        const backupPath = settingsPath + '.corrupted.' + Date.now();
        await fs.writeFile(backupPath, content);
        console.log('Backed up corrupted file to:', backupPath);

        // Create new default settings
        const defaultSettings = this.createDefaultSettings(path.basename(projectPath));
        await this.save(projectPath, defaultSettings);
        return defaultSettings;
      }
    } catch (err) {
      if (err.code === 'ENOENT') {
        // File doesn't exist, create default settings
        const defaultSettings = this.createDefaultSettings(path.basename(projectPath));
        await this.save(projectPath, defaultSettings);
        return defaultSettings;
      }
      throw err;
    }
  }

  async save(projectPath, settings) {
    const settingsPath = path.join(projectPath, this.fileName);
    settings.lastUpdated = new Date().toISOString();

    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
  }

  createDefaultSettings(projectName) {
    return {
      version: this.version,
      projectName: projectName,
      repositories: {},
      lastUpdated: new Date().toISOString(),
    };
  }

  async addRepository(projectPath, repoId, info = {}) {
    const settings = await this.load(projectPath);

    settings.repositories[repoId] = {
      status: 'available',
      ...info,
      addedAt: new Date().toISOString(),
    };

    await this.save(projectPath, settings);
    return settings;
  }

  async reserveRepository(projectPath, repoId, reservedBy, workItemId = null) {
    const settings = await this.load(projectPath);

    if (!settings.repositories[repoId]) {
      throw new Error(`Repository ${repoId} not found in settings`);
    }

    if (settings.repositories[repoId].status !== 'available') {
      const repo = settings.repositories[repoId];
      throw new Error(
        `Repository ${repoId} is not available (currently ${repo.status} by ${repo.reservedBy})`
      );
    }

    settings.repositories[repoId] = {
      ...settings.repositories[repoId],
      status: 'reserved',
      reservedBy: reservedBy,
      reservedAt: new Date().toISOString(),
      workItemId: workItemId,
    };

    await this.save(projectPath, settings);
    return settings;
  }

  async releaseRepository(projectPath, repoId) {
    console.log('=== RELEASE REPOSITORY ===');
    console.log('Project path:', projectPath);
    console.log('Repo ID:', repoId);

    const settings = await this.load(projectPath);
    console.log('Current settings:', JSON.stringify(settings, null, 2));

    if (!settings.repositories[repoId]) {
      console.log('Repository not found in settings!');
      throw new Error(`Repository ${repoId} not found in settings`);
    }

    console.log('Current repo status:', settings.repositories[repoId]);

    settings.repositories[repoId] = {
      ...settings.repositories[repoId],
      status: 'available',
      reservedBy: undefined,
      reservedAt: undefined,
      workItemId: undefined,
    };

    console.log('Updated repo status:', settings.repositories[repoId]);

    await this.save(projectPath, settings);
    console.log('Settings saved successfully');

    return settings;
  }

  async getAvailableRepository(projectPath) {
    const settings = await this.load(projectPath);

    for (const [repoId, repo] of Object.entries(settings.repositories)) {
      if (repo.status === 'available') {
        return repoId;
      }
    }

    return null;
  }

  async migrateFromReposMd(projectPath) {
    const reposMdPath = path.join(projectPath, 'REPOS.md');
    const settings = await this.load(projectPath);

    try {
      const reposMdContent = await fs.readFile(reposMdPath, 'utf-8');
      const lines = reposMdContent.split('\n');

      for (const line of lines) {
        // Parse lines like "- apisurf-1: Available" or "- apisurf-1: Claude Code session"
        const match = line.match(/^-\s+([^:]+):\s*(.+)$/);
        if (match) {
          const [, repoId, status] = match;
          const isAvailable = status.toLowerCase().includes('available');

          if (!settings.repositories[repoId]) {
            settings.repositories[repoId] = {
              status: isAvailable ? 'available' : 'reserved',
              reservedBy: isAvailable ? undefined : 'claude-code',
              description: status,
            };
          }
        }
      }

      await this.save(projectPath, settings);

      // Optionally rename old REPOS.md
      await fs.rename(reposMdPath, path.join(projectPath, 'REPOS.md.backup'));

      return settings;
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.error('Error migrating from REPOS.md:', err);
      }
      return settings;
    }
  }
}

module.exports = new ClaudeFlowSettings();
