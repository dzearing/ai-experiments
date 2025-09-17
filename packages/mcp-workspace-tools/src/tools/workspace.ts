import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { WorkspaceInfo, ProjectSummary, WorkItemCounts } from '../types/index.js';

export class WorkspaceTools {
  private workspacePath: string;

  constructor(workspacePath?: string) {
    this.workspacePath = workspacePath || path.join(os.homedir(), 'workspace');
  }

  async getWorkspaceInfo(): Promise<WorkspaceInfo> {
    const projectsPath = path.join(this.workspacePath, 'projects');
    const projects: ProjectSummary[] = [];

    try {
      const projectDirs = await fs.readdir(projectsPath);

      for (const projectName of projectDirs) {
        // Skip hidden folders and .template
        if (projectName.startsWith('.')) continue;

        const projectPath = path.join(projectsPath, projectName);
        const stats = await fs.stat(projectPath);

        if (!stats.isDirectory()) continue;

        const description = await this.getProjectDescription(projectPath);
        const hasRepos = await this.hasRepos(projectPath);

        projects.push({
          name: projectName,
          path: projectPath,
          description,
          hasRepos
        });
      }
    } catch (error) {
      console.error('Error reading workspace:', error);
    }

    return {
      workspacePath: this.workspacePath,
      projects
    };
  }

  async getWorkItemCounts(projectPath: string): Promise<WorkItemCounts> {
    const counts: WorkItemCounts = {
      ideas: 0,
      planned: 0,
      active: 0,
      completed: 0
    };

    const plansPath = path.join(projectPath, 'plans');

    try {
      for (const folder of Object.keys(counts) as (keyof WorkItemCounts)[]) {
        const folderPath = path.join(plansPath, folder);
        try {
          const files = await fs.readdir(folderPath);
          counts[folder] = files.filter(f => f.endsWith('.md')).length;
        } catch (err) {
          // Folder doesn't exist
        }
      }
    } catch (err) {
      // Plans folder doesn't exist
    }

    return counts;
  }

  private async getProjectDescription(projectPath: string): Promise<string> {
    try {
      const readmePath = path.join(projectPath, 'README.md');
      const content = await fs.readFile(readmePath, 'utf-8');

      // Extract description from README (first paragraph after # title)
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

  private async hasRepos(projectPath: string): Promise<boolean> {
    const reposPath = path.join(projectPath, 'repos');

    try {
      const repoDirs = await fs.readdir(reposPath);
      return repoDirs.some(dir => !dir.startsWith('.'));
    } catch (err) {
      return false;
    }
  }
}