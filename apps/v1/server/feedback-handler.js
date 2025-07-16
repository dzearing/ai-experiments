const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const PATHS = require('./paths');

// Use centralized paths
const FEEDBACK_DIR = PATHS.feedbackDir;
const SCREENSHOTS_DIR = PATHS.feedbackScreenshotsDir;
const REPORTS_DIR = PATHS.feedbackReportsDir;

/**
 * Saves a screenshot from base64 data
 * @param {string} imageData - Base64 encoded image data
 * @param {string} sessionId - Session ID
 * @param {string} repoName - Repository name
 * @returns {Object} Result with success status and path
 */
async function saveScreenshot(imageData, sessionId, repoName) {
  try {
    // Validate inputs
    if (!imageData || !sessionId || !repoName) {
      throw new Error('Missing required parameters');
    }

    // Remove data URL prefix if present
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    
    // Convert to buffer
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Check size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (buffer.length > maxSize) {
      throw new Error('Image size exceeds 10MB limit');
    }
    
    // Generate filename (without extension, as the function will add it)
    const timestamp = Date.now();
    const fileId = `${repoName}-${sessionId}-${timestamp}`;
    const filePath = PATHS.getFeedbackScreenshotFile(fileId);
    
    // Save file
    await fs.promises.writeFile(filePath, buffer);
    
    // Return relative path
    const filename = `${fileId}.png`;
    const relativePath = path.join('temp', 'feedback', 'screenshots', filename);
    
    logger.logEvent('FEEDBACK_SCREENSHOT_SAVED', `Screenshot saved: ${filename}`, {
      sessionId,
      repoName,
      size: buffer.length,
      path: relativePath
    });
    
    return {
      success: true,
      path: relativePath
    };
  } catch (error) {
    logger.error('Failed to save screenshot:', error);
    logger.logEvent('FEEDBACK_SCREENSHOT_ERROR', error.message, {
      sessionId,
      repoName
    });
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Extracts relevant server logs for a session
 * @param {string} sessionId - Session ID to extract logs for
 * @param {Date} startTime - Optional start time to filter logs
 * @returns {Object} Extracted log data
 */
async function extractServerLogs(sessionId, startTime) {
  const logs = {
    claudeMessages: [],
    events: [],
    errors: []
  };
  
  try {
    // Read Claude messages log
    const claudeLogPath = PATHS.logs.claude;
    if (fs.existsSync(claudeLogPath)) {
      const claudeContent = await fs.promises.readFile(claudeLogPath, 'utf8');
      const lines = claudeContent.split('\n');
      
      // Filter lines containing the sessionId
      logs.claudeMessages = lines
        .filter(line => line.includes(sessionId))
        .slice(-50); // Last 50 relevant lines
    }
    
    // Read events log
    const eventsLogPath = PATHS.logs.events;
    if (fs.existsSync(eventsLogPath)) {
      const eventsContent = await fs.promises.readFile(eventsLogPath, 'utf8');
      const lines = eventsContent.split('\n');
      
      // Filter lines containing the sessionId
      logs.events = lines
        .filter(line => line.includes(sessionId))
        .slice(-50); // Last 50 relevant lines
    }
    
    // Read errors log
    const errorsLogPath = PATHS.logs.errors;
    if (fs.existsSync(errorsLogPath)) {
      const errorsContent = await fs.promises.readFile(errorsLogPath, 'utf8');
      const lines = errorsContent.split('\n');
      
      // Filter recent errors (within last hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      logs.errors = lines
        .filter(line => {
          const match = line.match(/\[([\d-T:.Z]+)\]/);
          if (match) {
            const lineTime = new Date(match[1]);
            return lineTime > oneHourAgo;
          }
          return false;
        })
        .slice(-20); // Last 20 errors
    }
  } catch (error) {
    logger.error('Failed to extract server logs:', error);
  }
  
  return logs;
}

/**
 * Saves feedback data with server logs
 * @param {Object} feedbackData - Feedback data from client
 * @returns {Object} Result with success status and feedback ID
 */
async function saveFeedback(feedbackData) {
  try {
    // Generate feedback ID
    const feedbackId = `fb-${new Date().toISOString().split('T')[0]}-${Math.random().toString(36).substr(2, 6)}`;
    
    // Extract server logs
    const serverLogs = await extractServerLogs(
      feedbackData.sessionId,
      new Date(feedbackData.timestamp)
    );
    
    // Compile complete feedback record
    const completeRecord = {
      feedbackId,
      timestamp: feedbackData.timestamp,
      user: {
        expectedBehavior: feedbackData.expectedBehavior,
        actualBehavior: feedbackData.actualBehavior
      },
      context: {
        sessionId: feedbackData.sessionId,
        repoName: feedbackData.repoName,
        projectId: feedbackData.projectId,
        messageId: feedbackData.messageId,
        mode: feedbackData.mode,
        isConnected: feedbackData.isConnected
      },
      messages: feedbackData.messages,
      screenshotPath: feedbackData.screenshotPath,
      serverLogs
    };
    
    // Save to file
    const filePath = PATHS.getFeedbackReportFile(`${feedbackData.timestamp.replace(/[:.]/g, '-')}-${feedbackData.sessionId}`);
    
    await fs.promises.writeFile(
      filePath,
      JSON.stringify(completeRecord, null, 2)
    );
    
    logger.logEvent('FEEDBACK_SUBMITTED', `Feedback saved: ${feedbackId}`, {
      sessionId: feedbackData.sessionId,
      repoName: feedbackData.repoName,
      hasScreenshot: !!feedbackData.screenshotPath,
      messageCount: feedbackData.messages.length
    });
    
    return {
      success: true,
      feedbackId
    };
  } catch (error) {
    logger.error('Failed to save feedback:', error);
    logger.logEvent('FEEDBACK_SUBMIT_ERROR', error.message, {
      sessionId: feedbackData.sessionId
    });
    
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  saveScreenshot,
  saveFeedback,
  extractServerLogs
};