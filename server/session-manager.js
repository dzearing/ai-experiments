const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const logger = require('./logger');

class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.sessionsDir = path.join(__dirname, 'sessions');
    this.saveQueue = new Set();
    this.saving = false;
  }

  async initialize() {
    // Create sessions directory if it doesn't exist
    if (!fs.existsSync(this.sessionsDir)) {
      fs.mkdirSync(this.sessionsDir, { recursive: true });
    }

    // Load existing sessions from disk
    try {
      const sessionFiles = fs.readdirSync(this.sessionsDir).filter(file => file.endsWith('.json'));
      
      for (const file of sessionFiles) {
        try {
          const sessionData = JSON.parse(fs.readFileSync(path.join(this.sessionsDir, file), 'utf8'));
          
          // Migrate old sessions: extract repoName from sessionId if missing
          if (!sessionData.repoName && sessionData.sessionId) {
            const parts = sessionData.sessionId.split('-');
            if (parts.length >= 3) {
              // SessionId format: projectId-repoName-uuid
              // Find where the UUID starts (last 5 parts are UUID)
              const uuidStartIndex = parts.length - 5;
              sessionData.repoName = parts.slice(1, uuidStartIndex).join('-');
              logger.debug(`Migrated session ${sessionData.sessionId}, extracted repoName: ${sessionData.repoName}`);
            }
          }
          
          this.sessions.set(sessionData.sessionId, sessionData);
          logger.debug(`Loaded session from disk: ${sessionData.sessionId}`);
        } catch (error) {
          logger.error(`Failed to load session file ${file}:`, error);
        }
      }
      
      logger.debug(`Loaded ${this.sessions.size} sessions from disk`);
    } catch (error) {
      logger.error('Failed to load sessions from disk:', error);
    }
  }

  createSession({ sessionId, projectId, repoName, userName, projectPath }) {
    const session = {
      sessionId,
      projectId,
      repoName,
      userName,
      projectPath,
      messages: [],
      greetingShown: false,
      greetingInProgress: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      maxTokens: 200000, // Claude's context window
      contextTokens: 0,
      tokenUsage: {
        input: 0,
        output: 0
      }
    };

    this.sessions.set(sessionId, session);
    this.saveSession(sessionId);
    return session;
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  updateSession(sessionId, updates) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    Object.assign(session, updates, { updatedAt: new Date().toISOString() });
    this.saveSession(sessionId);
    return session;
  }

  deleteSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      logger.debug(`Session not found in memory for deletion: ${sessionId}`);
      return false;
    }

    logger.debug(`Deleting session: ${sessionId}`);
    this.sessions.delete(sessionId);
    
    // Delete session file from disk
    const sessionFile = path.join(this.sessionsDir, `${sessionId}.json`);
    try {
      if (fs.existsSync(sessionFile)) {
        logger.debug(`Deleting session file: ${sessionFile}`);
        fs.unlinkSync(sessionFile);
        logger.debug(`Session file deleted successfully: ${sessionFile}`);
      } else {
        logger.debug(`Session file does not exist: ${sessionFile}`);
      }
    } catch (error) {
      logger.error(`Failed to delete session file ${sessionFile}:`, error);
    }

    logger.debug(`Session deleted successfully: ${sessionId}`);
    return true;
  }

  setGreetingShown(sessionId, shown = true) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    session.greetingShown = shown;
    session.updatedAt = new Date().toISOString();
    this.saveSession(sessionId);
    return true;
  }

  setGreetingInProgress(sessionId, inProgress = true) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    session.greetingInProgress = inProgress;
    session.updatedAt = new Date().toISOString();
    this.saveSession(sessionId);
    return true;
  }

  addMessage(sessionId, message) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    // Ensure message has an ID
    const messageWithId = {
      ...message,
      id: message.id || crypto.randomUUID(),
      timestamp: message.timestamp || new Date().toISOString()
    };

    session.messages.push(messageWithId);
    session.updatedAt = new Date().toISOString();
    this.saveSession(sessionId);
    return true;
  }

  updateTokenUsage(sessionId, inputTokens, outputTokens) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    session.tokenUsage.input += inputTokens || 0;
    session.tokenUsage.output += outputTokens || 0;
    session.updatedAt = new Date().toISOString();
    this.saveSession(sessionId);
    return true;
  }

  updateContextTokens(sessionId, contextTokens) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    session.contextTokens = contextTokens;
    session.updatedAt = new Date().toISOString();
    this.saveSession(sessionId);
    return true;
  }

  getAllSessionIds() {
    return this.sessions.keys();
  }

  getAllSessions() {
    return Array.from(this.sessions.values());
  }

  getSessionCount() {
    return this.sessions.size;
  }

  async saveSession(sessionId) {
    // Add to save queue
    this.saveQueue.add(sessionId);
    
    // If already saving, return
    if (this.saving) {
      return;
    }

    // Process save queue
    this.saving = true;
    while (this.saveQueue.size > 0) {
      const sessionIds = Array.from(this.saveQueue);
      this.saveQueue.clear();

      for (const id of sessionIds) {
        const session = this.sessions.get(id);
        if (session) {
          try {
            const sessionFile = path.join(this.sessionsDir, `${id}.json`);
            await fs.promises.writeFile(sessionFile, JSON.stringify(session, null, 2));
          } catch (error) {
            logger.error(`Failed to save session ${id}:`, error);
          }
        }
      }
    }
    this.saving = false;
  }

  // Cleanup old sessions (optional maintenance method)
  cleanupOldSessions(maxAgeMs = 7 * 24 * 60 * 60 * 1000) { // 7 days
    const now = Date.now();
    const sessionsToDelete = [];

    for (const [sessionId, session] of this.sessions) {
      const sessionAge = now - new Date(session.createdAt).getTime();
      if (sessionAge > maxAgeMs) {
        sessionsToDelete.push(sessionId);
      }
    }

    for (const sessionId of sessionsToDelete) {
      this.deleteSession(sessionId);
      logger.debug(`Cleaned up old session: ${sessionId}`);
    }

    return sessionsToDelete.length;
  }
}

// Export singleton instance
module.exports = new SessionManager();