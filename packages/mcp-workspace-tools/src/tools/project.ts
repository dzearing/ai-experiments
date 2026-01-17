import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { ProjectInfo, RepoInfo, PackageInfo, WorkItemInfo } from '../types/index.js';
import { WorkspaceTools } from './workspace.js';

export class ProjectTools {
  private workspacePath: string;
  private workspaceTools: WorkspaceTools;

  constructor(workspacePath?: string) {
    this.workspacePath = workspacePath || path.join(os.homedir(), 'workspace');
    this.workspaceTools = new WorkspaceTools(this.workspacePath);
  }

  async getProjectInfo(projectName: string): Promise<ProjectInfo | null> {
    const projectPath = path.join(this.workspacePath, 'projects', projectName);

    try {
      await fs.access(projectPath);
    } catch (err) {
      return null;
    }

    const description = await this.getProjectDescription(projectPath);
    const repos = await this.getRepos(projectPath);
    const workItems = await this.workspaceTools.getWorkItemCounts(projectPath);

    return {
      name: projectName,
      path: projectPath,
      description,
      repos,
      workItems
    };
  }

  async getAvailableRepo(projectName: string): Promise<RepoInfo | null> {
    const projectInfo = await this.getProjectInfo(projectName);
    if (!projectInfo) return null;

    // Find first available repo
    const availableRepo = projectInfo.repos.find(repo => repo.isAvailable);
    return availableRepo || null;
  }

  async getWorkItemInfo(projectName: string, workItemName: string): Promise<WorkItemInfo | null> {
    const projectPath = path.join(this.workspacePath, 'projects', projectName);
    const statuses: Array<'ideas' | 'planned' | 'active' | 'completed'> = ['ideas', 'planned', 'active', 'completed'];

    for (const status of statuses) {
      const workItemPath = path.join(projectPath, 'plans', status, `${workItemName}.md`);

      try {
        const content = await fs.readFile(workItemPath, 'utf-8');
        return {
          name: workItemName,
          path: workItemPath,
          status,
          project: projectName,
          content
        };
      } catch (err) {
        // File doesn't exist in this status folder
      }
    }

    return null;
  }

  private async getProjectDescription(projectPath: string): Promise<string> {
    try {
      const readmePath = path.join(projectPath, 'README.md');
      const content = await fs.readFile(readmePath, 'utf-8');

      // Extract description from README
      const lines = content.split('\\n');
      const descStart = lines.findIndex(line => line.trim() && !line.startsWith('#'));

      if (descStart !== -1) {
        return lines[descStart].trim();
      }
    } catch (err) {
      // No README or couldn't read it
    }

    return '';
  }

  private async getRepos(projectPath: string): Promise<RepoInfo[]> {
    const repos: RepoInfo[] = [];
    const reposPath = path.join(projectPath, 'repos');

    try {
      const repoDirs = await fs.readdir(reposPath);

      for (const repoDir of repoDirs) {
        if (repoDir.startsWith('.')) continue;

        const repoPath = path.join(reposPath, repoDir);
        const stats = await fs.stat(repoPath);

        if (stats.isDirectory()) {
          // Parse repo name and number (format: repo-name-1)
          const lastDashIndex = repoDir.lastIndexOf('-');
          const repoName = repoDir.substring(0, lastDashIndex);
          const repoNumber = parseInt(repoDir.substring(lastDashIndex + 1));

          const packages = await this.getPackages(repoPath);
          const isAvailable = await this.checkRepoAvailability(projectPath, repoDir);

          repos.push({
            name: repoName,
            number: repoNumber,
            path: repoPath,
            isAvailable,
            packages: packages.length > 0 ? packages : undefined
          });
        }
      }
    } catch (err) {
      // Repos folder doesn't exist
    }

    return repos;
  }

  private async getPackages(repoPath: string): Promise<PackageInfo[]> {
    const packages: PackageInfo[] = [];
    const possiblePkgDirs = ['packages', 'apps', 'tools'];

    for (const dir of possiblePkgDirs) {
      const pkgPath = path.join(repoPath, dir);

      try {
        const pkgDirs = await fs.readdir(pkgPath);

        for (const pkg of pkgDirs) {
          if (pkg.startsWith('.')) continue;

          const fullPkgPath = path.join(pkgPath, pkg);
          const stats = await fs.stat(fullPkgPath);

          if (stats.isDirectory()) {
            // For apps directory, check for nested structure (e.g., apps/v1/client)
            if (dir === 'apps') {
              // Check if it has subdirectories with package.json
              try {
                const subDirs = await fs.readdir(fullPkgPath);
                for (const subDir of subDirs) {
                  if (subDir.startsWith('.')) continue;

                  const subPath = path.join(fullPkgPath, subDir);
                  const subStats = await fs.stat(subPath);

                  if (subStats.isDirectory()) {
                    try {
                      await fs.access(path.join(subPath, 'package.json'));
                      packages.push({
                        name: `${pkg}-${subDir}`,
                        path: subPath,
                        type: 'app'
                      });
                    } catch (err) {
                      // No package.json in subdirectory
                    }
                  }
                }
              } catch (err) {
                // Error reading subdirectories
              }

              // Also check if the app directory itself has a package.json
              try {
                await fs.access(path.join(fullPkgPath, 'package.json'));
                packages.push({
                  name: pkg,
                  path: fullPkgPath,
                  type: 'app'
                });
              } catch (err) {
                // No package.json at app level
              }
            } else {
              // For packages and tools, just check for package.json
              try {
                await fs.access(path.join(fullPkgPath, 'package.json'));

                packages.push({
                  name: pkg,
                  path: fullPkgPath,
                  type: dir === 'tools' ? 'tool' : 'package'
                });
              } catch (err) {
                // No package.json, skip
              }
            }
          }
        }
      } catch (err) {
        // Directory doesn't exist
      }
    }

    return packages;
  }

  private async checkRepoAvailability(projectPath: string, repoDir: string): Promise<boolean> {
    // Check REPOS.md for availability status
    const reposMdPath = path.join(projectPath, 'REPOS.md');

    try {
      const content = await fs.readFile(reposMdPath, 'utf-8');
      const lines = content.split('\\n');

      for (const line of lines) {
        if (line.includes(repoDir)) {
          if (line.toLowerCase().includes('available')) {
            return true;
          } else if (line.toLowerCase().includes('in use') || line.toLowerCase().includes('reserved')) {
            return false;
          }
        }
      }
    } catch (err) {
      // No REPOS.md file, assume available
    }

    // Also check claudeflow.settings.json if it exists
    const settingsPath = path.join(projectPath, 'claudeflow.settings.json');

    try {
      const content = await fs.readFile(settingsPath, 'utf-8');
      const settings = JSON.parse(content);

      if (settings.repositories && settings.repositories[repoDir]) {
        const repo = settings.repositories[repoDir];
        return repo.status === 'available';
      }
    } catch (err) {
      // No settings file or error reading it
    }

    // Default to available if no status found
    return true;
  }
}