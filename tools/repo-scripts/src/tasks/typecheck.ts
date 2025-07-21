import { runScript } from '../utilities/runScript.js';
import { detectPackageType } from '../utilities/detectPackageType.js';
import { runTcm } from '../utilities/runTcm.js';
import type { Task } from '../types.js';

const typecheck: Task = {
  command: 'typecheck',
  description: 'Run TypeScript type checking',
  execute: async (additionalArgs = []) => {
    const packageType = detectPackageType();
    
    // Run tcm first for packages with CSS modules
    if (packageType === 'react-app' || packageType === 'component-library') {
      await runTcm();
    }
    
    // Run TypeScript with --noEmit to just check types
    return runScript({
      packageName: 'typescript',
      name: 'tsc',
      args: ['--noEmit', ...additionalArgs],
    });
  }
};

export { typecheck };