const path = require('path');
const fs = require('fs');

// Base directory for the server
const SERVER_DIR = __dirname;
const PROJECT_ROOT = path.join(SERVER_DIR, '..');

// Temp directory for all temporary files (logs, sessions, feedback)
const TEMP_DIR = path.join(PROJECT_ROOT, 'temp');

// Subdirectories within temp
const PATHS = {
  // Root directories
  serverDir: SERVER_DIR,
  projectRoot: PROJECT_ROOT,
  tempDir: TEMP_DIR,
  
  // Logs directory and files
  logsDir: path.join(TEMP_DIR, 'logs'),
  logs: {
    client: path.join(TEMP_DIR, 'logs', 'client-messages.log'),
    claude: path.join(TEMP_DIR, 'logs', 'claude-messages.log'),
    events: path.join(TEMP_DIR, 'logs', 'events.log'),
    debug: path.join(TEMP_DIR, 'logs', 'debug.log'),
    errors: path.join(TEMP_DIR, 'logs', 'errors.log'),
    toolExecutions: path.join(TEMP_DIR, 'logs', 'tool-executions.log')
  },
  
  // Sessions directory
  sessionsDir: path.join(TEMP_DIR, 'sessions'),
  
  // Feedback directory and subdirectories
  feedbackDir: path.join(TEMP_DIR, 'feedback'),
  feedbackReportsDir: path.join(TEMP_DIR, 'feedback', 'reports'),
  feedbackScreenshotsDir: path.join(TEMP_DIR, 'feedback', 'screenshots'),
  
  // Function to get session file path
  getSessionFile: (sessionId) => path.join(TEMP_DIR, 'sessions', `${sessionId}.json`),
  
  // Function to get feedback file paths
  getFeedbackReportFile: (feedbackId) => path.join(TEMP_DIR, 'feedback', 'reports', `${feedbackId}.json`),
  getFeedbackScreenshotFile: (feedbackId) => path.join(TEMP_DIR, 'feedback', 'screenshots', `${feedbackId}.png`)
};

// Ensure all directories exist
function ensureDirectories() {
  const directories = [
    PATHS.tempDir,
    PATHS.logsDir,
    PATHS.sessionsDir,
    PATHS.feedbackDir,
    PATHS.feedbackReportsDir,
    PATHS.feedbackScreenshotsDir
  ];
  
  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  }
}

// Cleanup function to remove all sessions (useful for tests)
async function cleanupSessions() {
  const sessionsDir = PATHS.sessionsDir;
  if (fs.existsSync(sessionsDir)) {
    const files = fs.readdirSync(sessionsDir);
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          fs.unlinkSync(path.join(sessionsDir, file));
        } catch (error) {
          console.error(`Failed to delete session file ${file}:`, error);
        }
      }
    }
  }
}

// Initialize directories on module load
ensureDirectories();

module.exports = {
  ...PATHS,
  ensureDirectories,
  cleanupSessions
};