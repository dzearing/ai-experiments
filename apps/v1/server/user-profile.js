const fs = require('fs');
const fsAsync = fs.promises;
const path = require('path');
const logger = require('./logger');

const USER_PROFILE_PATH = path.join(__dirname, '../temp/user-profile.json');

class UserProfileManager {
  constructor() {
    this.profile = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      // Ensure temp directory exists
      const tempDir = path.dirname(USER_PROFILE_PATH);
      await fsAsync.mkdir(tempDir, { recursive: true });

      // Try to load existing profile
      try {
        const data = await fsAsync.readFile(USER_PROFILE_PATH, 'utf8');
        this.profile = JSON.parse(data);
        logger.info('User profile loaded successfully', { profile: this.profile });
      } catch (error) {
        // Create default profile if file doesn't exist
        if (error.code === 'ENOENT') {
          this.profile = {
            workspaceRoot: null,
            lastUpdated: new Date().toISOString(),
            preferences: {}
          };
          await this.save();
          logger.info('Created new user profile');
        } else {
          throw error;
        }
      }

      this.initialized = true;
    } catch (error) {
      logger.error('Failed to initialize user profile:', error);
      throw error;
    }
  }

  async save() {
    try {
      await fsAsync.writeFile(
        USER_PROFILE_PATH,
        JSON.stringify(this.profile, null, 2),
        'utf8'
      );
      logger.info('User profile saved', { profile: this.profile });
    } catch (error) {
      logger.error('Failed to save user profile:', error);
      throw error;
    }
  }

  async setWorkspaceRoot(workspaceRoot) {
    if (!this.initialized) {
      throw new Error('User profile not initialized');
    }

    this.profile.workspaceRoot = workspaceRoot;
    this.profile.lastUpdated = new Date().toISOString();
    await this.save();
    
    logger.logEvent('WORKSPACE_CHANGED', 'Workspace root updated', { workspaceRoot });
    return this.profile;
  }

  getWorkspaceRoot() {
    if (!this.initialized) {
      throw new Error('User profile not initialized');
    }
    return this.profile.workspaceRoot;
  }

  isInitialized() {
    return this.initialized;
  }

  getProfile() {
    if (!this.initialized) {
      throw new Error('User profile not initialized');
    }
    return { ...this.profile };
  }

  async updatePreferences(preferences) {
    if (!this.initialized) {
      throw new Error('User profile not initialized');
    }

    this.profile.preferences = { ...this.profile.preferences, ...preferences };
    this.profile.lastUpdated = new Date().toISOString();
    await this.save();
    return this.profile;
  }
}

module.exports = new UserProfileManager();