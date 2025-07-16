const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

class SubscriptionManager {
  constructor() {
    this.subscriptions = new Map(); // clientId -> Set of resource IDs
    this.clients = new Map(); // clientId -> SSE response object
    this.monitors = new Map(); // resourceId -> { interval, lastStatus, subscribers }
    this.checkInterval = 20000; // 20 seconds
  }

  // Register a new SSE client
  registerClient(clientId, res) {
    this.clients.set(clientId, res);
    this.subscriptions.set(clientId, new Set());
    console.log(`Client registered: ${clientId}`);
  }

  // Unregister a client (on disconnect)
  unregisterClient(clientId) {
    const resources = this.subscriptions.get(clientId) || new Set();
    
    // Remove client from all monitor subscriber lists
    resources.forEach(resourceId => {
      const monitor = this.monitors.get(resourceId);
      if (monitor) {
        monitor.subscribers.delete(clientId);
        
        // Stop monitoring if no subscribers left
        if (monitor.subscribers.size === 0) {
          clearInterval(monitor.interval);
          this.monitors.delete(resourceId);
          console.log(`Stopped monitoring: ${resourceId}`);
        }
      }
    });
    
    this.subscriptions.delete(clientId);
    this.clients.delete(clientId);
    console.log(`Client unregistered: ${clientId}`);
  }

  // Subscribe client to resources (idempotent)
  subscribe(clientId, resources) {
    if (!this.clients.has(clientId)) {
      console.warn(`Client ${clientId} not registered`);
      return false;
    }

    const clientSubs = this.subscriptions.get(clientId) || new Set();
    
    resources.forEach(resourceId => {
      // Add to client's subscriptions
      clientSubs.add(resourceId);
      
      // Start monitoring if not already
      if (!this.monitors.has(resourceId)) {
        this.startMonitoring(resourceId);
      }
      
      // Add client to monitor's subscribers
      const monitor = this.monitors.get(resourceId);
      if (monitor) {
        monitor.subscribers.add(clientId);
      }
    });
    
    this.subscriptions.set(clientId, clientSubs);
    console.log(`Client ${clientId} subscribed to:`, resources);
    
    // Send initial status for all subscribed resources
    resources.forEach(resourceId => {
      this.checkResource(resourceId, true); // force initial update
    });
    
    return true;
  }

  // Unsubscribe client from resources
  unsubscribe(clientId, resources) {
    const clientSubs = this.subscriptions.get(clientId);
    if (!clientSubs) return false;
    
    resources.forEach(resourceId => {
      clientSubs.delete(resourceId);
      
      const monitor = this.monitors.get(resourceId);
      if (monitor) {
        monitor.subscribers.delete(clientId);
        
        // Stop monitoring if no subscribers left
        if (monitor.subscribers.size === 0) {
          clearInterval(monitor.interval);
          this.monitors.delete(resourceId);
          console.log(`Stopped monitoring: ${resourceId}`);
        }
      }
    });
    
    return true;
  }

  // Start monitoring a resource
  startMonitoring(resourceId) {
    console.log(`Starting monitoring: ${resourceId}`);
    
    const interval = setInterval(() => {
      this.checkResource(resourceId);
    }, this.checkInterval);
    
    this.monitors.set(resourceId, {
      interval,
      lastStatus: null,
      subscribers: new Set()
    });
  }

  // Parse resource ID into type and path
  parseResourceId(resourceId) {
    const [type, ...pathParts] = resourceId.split(':');
    return { type, path: pathParts.join(':') };
  }

  // Check resource and notify subscribers if changed
  async checkResource(resourceId, forceUpdate = false) {
    try {
      const { type, path: resourcePath } = this.parseResourceId(resourceId);
      const monitor = this.monitors.get(resourceId);
      
      if (!monitor) return;
      
      let newStatus = null;
      
      if (type === 'repo-status') {
        newStatus = await this.getRepoStatus(resourcePath);
      }
      
      // Compare with last status
      const statusChanged = forceUpdate || 
        JSON.stringify(newStatus) !== JSON.stringify(monitor.lastStatus);
      
      if (statusChanged && newStatus) {
        monitor.lastStatus = newStatus;
        this.notifySubscribers(resourceId, newStatus);
      }
    } catch (error) {
      console.error(`Error checking resource ${resourceId}:`, error.message);
    }
  }

  // Get git repository status
  async getRepoStatus(repoPath) {
    try {
      // Parse project path and repo name
      const parts = repoPath.split('/');
      const repoName = parts.pop();
      const projectPath = parts.join('/');
      
      // Construct full repo path
      const fullRepoPath = path.join(projectPath, 'repos', repoName);
      
      // Check if directory exists
      try {
        await fs.access(fullRepoPath);
      } catch {
        return { error: 'Repository not found' };
      }
      
      // Get current branch
      let branch = 'unknown';
      try {
        branch = execSync('git rev-parse --abbrev-ref HEAD', {
          cwd: fullRepoPath,
          encoding: 'utf-8'
        }).trim();
      } catch (err) {
        console.error('Error getting branch:', err);
      }
      
      // Check if working directory is clean
      let isDirty = false;
      let changes = { modified: 0, added: 0, deleted: 0, untracked: 0 };
      try {
        const status = execSync('git status --porcelain', {
          cwd: fullRepoPath,
          encoding: 'utf-8'
        });
        
        isDirty = status.trim().length > 0;
        
        if (isDirty) {
          const lines = status.trim().split('\n');
          lines.forEach(line => {
            const prefix = line.substring(0, 2);
            if (prefix.includes('M')) changes.modified++;
            else if (prefix.includes('A')) changes.added++;
            else if (prefix.includes('D')) changes.deleted++;
            else if (prefix === '??') changes.untracked++;
          });
        }
      } catch (err) {
        console.error('Error getting status:', err);
      }
      
      // Get ahead/behind status vs main
      let ahead = 0;
      let behind = 0;
      try {
        if (branch !== 'main') {
          const aheadBehind = execSync('git rev-list --left-right --count main...HEAD', {
            cwd: fullRepoPath,
            encoding: 'utf-8'
          }).trim();
          
          const [behindStr, aheadStr] = aheadBehind.split('\t');
          behind = parseInt(behindStr) || 0;
          ahead = parseInt(aheadStr) || 0;
        }
      } catch (err) {
        // Main branch might not exist or other error
      }
      
      // Get last commit info
      let lastCommit = null;
      try {
        const commitInfo = execSync('git log -1 --format="%H|%s|%an|%ar"', {
          cwd: fullRepoPath,
          encoding: 'utf-8'
        }).trim();
        
        const [hash, subject, author, relativeTime] = commitInfo.split('|');
        lastCommit = { hash, subject, author, relativeTime };
      } catch (err) {
        console.error('Error getting last commit:', err);
      }
      
      return {
        resourceId: `repo-status:${repoPath}`,
        repoPath,
        branch,
        isDirty,
        changes,
        ahead,
        behind,
        lastCommit,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error getting repo status for ${repoPath}:`, error);
      return {
        resourceId: `repo-status:${repoPath}`,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Notify all subscribers of a resource update
  notifySubscribers(resourceId, data) {
    const monitor = this.monitors.get(resourceId);
    if (!monitor) return;
    
    const { type } = this.parseResourceId(resourceId);
    const event = {
      type,
      id: resourceId,
      payload: data,
      timestamp: new Date().toISOString()
    };
    
    monitor.subscribers.forEach(clientId => {
      const client = this.clients.get(clientId);
      if (client) {
        try {
          client.write(`event: update\ndata: ${JSON.stringify(event)}\n\n`);
        } catch (err) {
          console.error(`Error sending to client ${clientId}:`, err);
          // Client might be disconnected, will be cleaned up by close event
        }
      }
    });
  }

  // Send a message to a specific client
  sendToClient(clientId, eventType, data) {
    const client = this.clients.get(clientId);
    if (client) {
      try {
        client.write(`event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`);
      } catch (err) {
        console.error(`Error sending to client ${clientId}:`, err);
      }
    }
  }

  // Force check all subscribed resources (useful after git operations)
  forceCheckResources(resourceIds) {
    resourceIds.forEach(resourceId => {
      if (this.monitors.has(resourceId)) {
        this.checkResource(resourceId, true);
      }
    });
  }
}

module.exports = new SubscriptionManager();