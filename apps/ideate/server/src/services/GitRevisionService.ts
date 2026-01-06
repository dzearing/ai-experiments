/**
 * GitRevisionService
 *
 * Service for tracking git revisions during execution.
 * Provides methods to:
 * - List commits made during execution
 * - Get files changed in a commit
 * - Get diff for a specific file
 */

import { execSync, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * File change information
 */
export interface FileChange {
  id: string;
  path: string;
  oldPath?: string;
  type: 'added' | 'modified' | 'deleted' | 'renamed';
  additions: number;
  deletions: number;
  diff?: string;
}

/**
 * Revision (commit) information
 */
export interface Revision {
  id: string;
  shortId: string;
  message: string;
  timestamp: number;
  author: string;
  files: FileChange[];
  totalAdditions: number;
  totalDeletions: number;
}

/**
 * Options for listing revisions
 */
export interface ListRevisionsOptions {
  /** Maximum number of revisions to return */
  limit?: number;
  /** Only include revisions after this commit hash */
  since?: string;
  /** Only include revisions before this commit hash */
  until?: string;
  /** Filter by author */
  author?: string;
}

/**
 * Service for git revision operations
 */
export class GitRevisionService {
  /**
   * Check if a directory is a git repository
   */
  async isGitRepository(workingDirectory: string): Promise<boolean> {
    try {
      execSync('git rev-parse --is-inside-work-tree', {
        cwd: workingDirectory,
        stdio: 'pipe',
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the current branch name
   */
  async getCurrentBranch(workingDirectory: string): Promise<string | null> {
    try {
      const result = execSync('git rev-parse --abbrev-ref HEAD', {
        cwd: workingDirectory,
        encoding: 'utf-8',
      });
      return result.trim();
    } catch {
      return null;
    }
  }

  /**
   * List revisions (commits) in the repository
   */
  async listRevisions(
    workingDirectory: string,
    options: ListRevisionsOptions = {}
  ): Promise<Revision[]> {
    const { limit = 50, since, until, author } = options;

    try {
      // Build git log command
      const args = [
        'log',
        `--max-count=${limit}`,
        '--format=%H|%h|%s|%at|%an',
        '--numstat',
      ];

      if (since) args.push(`${since}..HEAD`);
      if (until) args.push(until);
      if (author) args.push(`--author=${author}`);

      const { stdout } = await execAsync(`git ${args.join(' ')}`, {
        cwd: workingDirectory,
        maxBuffer: 10 * 1024 * 1024, // 10MB
      });

      return this.parseGitLog(stdout);
    } catch (error) {
      console.error('[GitRevisionService] Error listing revisions:', error);
      return [];
    }
  }

  /**
   * Get files changed in a specific commit
   */
  async getCommitFiles(
    workingDirectory: string,
    commitHash: string
  ): Promise<FileChange[]> {
    try {
      const { stdout } = await execAsync(
        `git diff-tree --no-commit-id --name-status -r ${commitHash}`,
        { cwd: workingDirectory }
      );

      const files: FileChange[] = [];
      const lines = stdout.trim().split('\n').filter(Boolean);

      for (const line of lines) {
        const [status, ...pathParts] = line.split('\t');
        const path = pathParts.join('\t'); // Handle paths with tabs

        let type: FileChange['type'] = 'modified';
        let oldPath: string | undefined;

        if (status.startsWith('A')) {
          type = 'added';
        } else if (status.startsWith('D')) {
          type = 'deleted';
        } else if (status.startsWith('R')) {
          type = 'renamed';
          // For renames, path format is "oldPath\tnewPath"
          const [old, newPath] = pathParts;
          oldPath = old;
          files.push({
            id: `${commitHash}-${newPath}`,
            path: newPath,
            oldPath,
            type,
            additions: 0,
            deletions: 0,
          });
          continue;
        }

        files.push({
          id: `${commitHash}-${path}`,
          path,
          type,
          additions: 0,
          deletions: 0,
        });
      }

      // Get stats for each file
      const { stdout: statsOutput } = await execAsync(
        `git diff-tree --no-commit-id --numstat -r ${commitHash}`,
        { cwd: workingDirectory }
      );

      const statsLines = statsOutput.trim().split('\n').filter(Boolean);
      for (const line of statsLines) {
        const [additions, deletions, filePath] = line.split('\t');
        const file = files.find((f) => f.path === filePath);
        if (file) {
          file.additions = additions === '-' ? 0 : parseInt(additions, 10);
          file.deletions = deletions === '-' ? 0 : parseInt(deletions, 10);
        }
      }

      return files;
    } catch (error) {
      console.error('[GitRevisionService] Error getting commit files:', error);
      return [];
    }
  }

  /**
   * Get diff for a specific file in a commit
   */
  async getFileDiff(
    workingDirectory: string,
    commitHash: string,
    filePath: string
  ): Promise<string | null> {
    try {
      const { stdout } = await execAsync(
        `git diff ${commitHash}^..${commitHash} -- "${filePath}"`,
        {
          cwd: workingDirectory,
          maxBuffer: 5 * 1024 * 1024, // 5MB for large diffs
        }
      );
      return stdout || null;
    } catch (error) {
      // For the first commit, there's no parent
      try {
        const { stdout } = await execAsync(
          `git show ${commitHash}:"${filePath}"`,
          { cwd: workingDirectory, maxBuffer: 5 * 1024 * 1024 }
        );
        // Format as a diff showing all lines as added
        const lines = stdout.split('\n');
        const diffLines = [
          `diff --git a/${filePath} b/${filePath}`,
          `new file mode 100644`,
          `--- /dev/null`,
          `+++ b/${filePath}`,
          `@@ -0,0 +1,${lines.length} @@`,
          ...lines.map((line) => `+${line}`),
        ];
        return diffLines.join('\n');
      } catch {
        console.error('[GitRevisionService] Error getting file diff:', error);
        return null;
      }
    }
  }

  /**
   * Create a commit with the current changes
   */
  async createCommit(
    workingDirectory: string,
    message: string,
    options: { addAll?: boolean } = {}
  ): Promise<string | null> {
    try {
      if (options.addAll) {
        await execAsync('git add -A', { cwd: workingDirectory });
      }

      // Check if there are changes to commit
      const { stdout: status } = await execAsync('git status --porcelain', {
        cwd: workingDirectory,
      });

      if (!status.trim()) {
        console.log('[GitRevisionService] No changes to commit');
        return null;
      }

      const { stdout } = await execAsync(
        `git commit -m "${message.replace(/"/g, '\\"')}"`,
        { cwd: workingDirectory }
      );

      // Extract commit hash from output
      const match = stdout.match(/\[[\w\-/]+ ([a-f0-9]+)\]/);
      return match ? match[1] : null;
    } catch (error) {
      console.error('[GitRevisionService] Error creating commit:', error);
      return null;
    }
  }

  /**
   * Get the hash of the most recent commit
   */
  async getLatestCommitHash(workingDirectory: string): Promise<string | null> {
    try {
      const { stdout } = await execAsync('git rev-parse HEAD', {
        cwd: workingDirectory,
      });
      return stdout.trim();
    } catch {
      return null;
    }
  }

  /**
   * Parse git log output into Revision objects
   */
  private parseGitLog(output: string): Revision[] {
    const revisions: Revision[] = [];
    const lines = output.split('\n');

    let currentRevision: Revision | null = null;

    for (const line of lines) {
      if (line.includes('|')) {
        // This is a commit header line
        if (currentRevision) {
          revisions.push(currentRevision);
        }

        const [hash, shortHash, message, timestamp, author] = line.split('|');
        currentRevision = {
          id: hash,
          shortId: shortHash,
          message,
          timestamp: parseInt(timestamp, 10) * 1000, // Convert to milliseconds
          author,
          files: [],
          totalAdditions: 0,
          totalDeletions: 0,
        };
      } else if (line.trim() && currentRevision) {
        // This is a file stats line (numstat format: additions\tdeletions\tfilename)
        const parts = line.split('\t');
        if (parts.length >= 3) {
          const additions = parts[0] === '-' ? 0 : parseInt(parts[0], 10);
          const deletions = parts[1] === '-' ? 0 : parseInt(parts[1], 10);
          const filePath = parts.slice(2).join('\t');

          currentRevision.files.push({
            id: `${currentRevision.id}-${filePath}`,
            path: filePath,
            type: 'modified', // Will be refined when getting full file info
            additions,
            deletions,
          });

          currentRevision.totalAdditions += additions;
          currentRevision.totalDeletions += deletions;
        }
      }
    }

    // Don't forget the last revision
    if (currentRevision) {
      revisions.push(currentRevision);
    }

    return revisions;
  }
}

// Singleton instance
let gitRevisionService: GitRevisionService | null = null;

export function getGitRevisionService(): GitRevisionService {
  if (!gitRevisionService) {
    gitRevisionService = new GitRevisionService();
  }
  return gitRevisionService;
}
