import { runScript } from '../utilities/runScript.js';
import fs from 'fs';
import path from 'path';
import { getPackageData } from '../utilities/getPackageData.js';
import { detectPackageType } from '../utilities/detectPackageType.js';
import { runTcm } from '../utilities/runTcm.js';
import { runVite } from '../utilities/runVite.js';
import { copyFiles } from '../utilities/copyFiles.js';
import type { Task } from '../types.js';

const build: Task = {
  command: 'build',
  description: 'Build packages with TypeScript',
  options: [
    { flag: '--clean', description: 'Clean output directory before building' }
  ],
  execute: async function build(additionalArgs = []) {
    const { packageJson } = getPackageData(process.cwd());
    const packageType = detectPackageType();
    
    // Handle --clean flag
    const cleanIndex = additionalArgs.indexOf('--clean');
    if (cleanIndex !== -1) {
      const outDir = 'lib';
      fs.rmSync(path.join(process.cwd(), outDir), { force: true, recursive: true });
      // Don't pass --clean to downstream tools
      additionalArgs.splice(cleanIndex, 1);
    }
    
    // Special case for scripts package
    if (packageJson.name === '@claude-flow/repo-scripts') {
      return runScript({
        packageName: 'typescript',
        name: 'tsc',
        args: ['-b', '--noEmit', ...additionalArgs],
      });
    }
    
    // Run tcm for packages with CSS modules
    if (packageType === 'react-app' || packageType === 'component-library') {
      await runTcm();
    }
    
    // Run TypeScript build
    await runScript({
      packageName: 'typescript',
      name: 'tsc',
      args: ['-b', ...additionalArgs],
    });
    
    // Post-build steps based on package type
    switch (packageType) {
      case 'react-app':
        // Run vite build for react apps
        await runVite({
          command: 'build',
          additionalArgs,
        });
        break;
        
      case 'component-library':
        // Copy CSS files to lib directory
        copyFiles({
          pattern: '**/*.css',
          srcDir: 'src',
          destDir: 'lib',
        });
        break;
    }
  }
};

export { build };