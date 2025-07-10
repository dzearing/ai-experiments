import domtoimage from 'dom-to-image';
import { API_BASE_URL } from '../config/api';

interface ScreenshotUploadResponse {
  success: boolean;
  path?: string;
  error?: string;
}

interface FeedbackSubmitResponse {
  success: boolean;
  feedbackId?: string;
  error?: string;
}

export interface FeedbackData {
  expectedBehavior: string;
  actualBehavior: string;
  sessionId: string;
  repoName: string;
  projectId: string;
  messageId?: string;
  timestamp: string;
  messages: any[];
  mode: string;
  isConnected: boolean;
  screenshotPath?: string;
}

class FeedbackService {
  /**
   * Captures a screenshot of the current page
   * @returns Base64 encoded image data or null if capture fails
   */
  async captureScreenshot(): Promise<string | null> {
    try {
      console.log('Starting screenshot capture...');
      
      const dataUrl = await domtoimage.toPng(document.body, {
        quality: 0.95,
        bgcolor: '#ffffff',
        width: document.body.scrollWidth,
        height: document.body.scrollHeight,
        // Filter out any sensitive elements if needed
        filter: (node: Node) => {
          // Skip any elements with sensitive data attributes
          if (node instanceof Element && node.getAttribute('data-sensitive')) {
            return false;
          }
          return true;
        }
      });
      
      console.log('Screenshot captured successfully');
      return dataUrl;
    } catch (error) {
      console.error('Screenshot capture failed:', error);
      return null;
    }
  }

  /**
   * Uploads a screenshot to the server
   * @param imageData Base64 encoded image data
   * @param sessionId Current session ID
   * @param repoName Repository name
   * @returns Path to saved screenshot or null if upload fails
   */
  async uploadScreenshot(
    imageData: string,
    sessionId: string,
    repoName: string
  ): Promise<string | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/feedback/screenshot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData,
          sessionId,
          repoName
        })
      });

      const data: ScreenshotUploadResponse = await response.json();
      
      if (!response.ok || !data.success) {
        console.error('Screenshot upload failed:', data.error);
        return null;
      }

      return data.path || null;
    } catch (error) {
      console.error('Screenshot upload error:', error);
      return null;
    }
  }

  /**
   * Submits feedback with all collected data
   * @param feedbackData Complete feedback data
   * @returns Feedback ID if successful
   */
  async submitFeedback(feedbackData: FeedbackData): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/feedback/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData)
      });

      const data: FeedbackSubmitResponse = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit feedback');
      }

      if (!data.feedbackId) {
        throw new Error('No feedback ID returned');
      }

      return data.feedbackId;
    } catch (error) {
      console.error('Feedback submission error:', error);
      throw error;
    }
  }

  /**
   * Complete feedback flow: capture screenshot, upload, and submit
   * @param feedbackData Partial feedback data (without screenshot)
   * @returns Feedback ID if successful
   */
  async submitFeedbackWithScreenshot(
    feedbackData: Omit<FeedbackData, 'screenshotPath' | 'timestamp'>
  ): Promise<string> {
    let screenshotPath: string | null = null;

    // Capture and upload screenshot (non-blocking for feedback submission)
    try {
      const screenshot = await this.captureScreenshot();
      if (screenshot) {
        screenshotPath = await this.uploadScreenshot(
          screenshot,
          feedbackData.sessionId,
          feedbackData.repoName
        );
      }
    } catch (error) {
      console.warn('Screenshot processing failed, continuing without it:', error);
    }

    // Submit feedback with or without screenshot
    const completeData: FeedbackData = {
      ...feedbackData,
      screenshotPath: screenshotPath || undefined,
      timestamp: new Date().toISOString()
    };

    return this.submitFeedback(completeData);
  }
}

// Export singleton instance
export const feedbackService = new FeedbackService();