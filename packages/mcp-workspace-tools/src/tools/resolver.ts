import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { PathResolution } from '../types/index.js';
import { ProjectTools } from './project.js';

export class PathResolver {
  private workspacePath: string;
  private projectTools: ProjectTools;

  constructor(workspacePath?: string) {
    this.workspacePath = workspacePath || path.join(os.homedir(), 'workspace');
    this.projectTools = new ProjectTools(this.workspacePath);
  }

  async resolveProjectPath(reference: string): Promise<PathResolution | null> {
    // Handle different reference formats:
    // - "workspace" -> workspace root
    // - "project-name" -> project root
    // - "project-name/repo" -> first available repo
    // - "project-name/repo-1" -> specific repo clone
    // - "project-name/v1-client" -> package within project
    // - absolute path -> return as-is

    // Check if it's an absolute path
    if (path.isAbsolute(reference)) {
      return {
        path: reference,
        type: 'workspace'
      };
    }

    // Check for workspace keyword
    if (reference === 'workspace') {
      return {
        path: this.workspacePath,
        type: 'workspace'
      };
    }

    // Parse the reference
    const parts = reference.split('/');
    const projectName = parts[0];

    // Check if project exists
    const projectPath = path.join(this.workspacePath, 'projects', projectName);

    try {
      await fs.access(projectPath);
    } catch (err) {
      return null;
    }

    // If just project name, return project path
    if (parts.length === 1) {
      return {
        path: projectPath,
        type: 'project',
        project: projectName
      };
    }

    // If has more parts, could be repo or package
    const secondPart = parts[1];

    // Check if it's requesting a repo
    if (secondPart === 'repo') {
      // Get first available repo
      const availableRepo = await this.projectTools.getAvailableRepo(projectName);

      if (availableRepo) {
        return {
          path: availableRepo.path,
          type: 'repo',
          project: projectName,
          repo: `${availableRepo.name}-${availableRepo.number}`
        };
      }

      return null;
    }

    // Check if it matches a specific repo clone (e.g., "repo-name-1")
    const reposPath = path.join(projectPath, 'repos');

    try {
      const repoDirs = await fs.readdir(reposPath);

      for (const repoDir of repoDirs) {
        if (repoDir === secondPart) {
          const repoPath = path.join(reposPath, repoDir);

          return {
            path: repoPath,
            type: 'repo',
            project: projectName,
            repo: repoDir
          };
        }
      }
    } catch (err) {
      // Repos folder doesn't exist
    }

    // Check if it's a package name within the project
    const projectInfo = await this.projectTools.getProjectInfo(projectName);

    if (projectInfo) {
      for (const repo of projectInfo.repos) {
        if (repo.packages) {
          for (const pkg of repo.packages) {
            if (pkg.name === secondPart) {
              return {
                path: pkg.path,
                type: 'package',
                project: projectName,
                repo: `${repo.name}-${repo.number}`,
                package: pkg.name
              };
            }
          }
        }
      }
    }

    // If nothing matches, return null
    return null;
  }

  async resolveMultiple(references: string[]): Promise<Map<string, PathResolution | null>> {
    const results = new Map<string, PathResolution | null>();

    for (const ref of references) {
      const resolution = await this.resolveProjectPath(ref);
      results.set(ref, resolution);
    }

    return results;
  }
}