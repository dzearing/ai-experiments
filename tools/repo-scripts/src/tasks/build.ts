import { runScript } from '../utilities/runScript.js';
import fs from 'fs';
import path from 'path';
import { getPackageData } from '../utilities/getPackageData.js';
import type { Task } from '../types.js';

const build: Task = {
  command: 'build',
  description: 'Build packages with TypeScript',
  options: [
    { flag: '--clean', description: 'Clean output directory before building' }
  ],
  execute: async function build(additionalArgs = []) {
  // --pretty must be manually specified when running programmatically
  // (it's not respected from the config)
  const tsArgs = ['-b'];

  const { packageJson } = getPackageData(process.cwd());
  
  if (packageJson.name === '@claude-flow/scripts') {
    // Building the scripts package which doesn't have a src directory or emitted code
    tsArgs.push('--noEmit');
  } else {
    // For normal packages, we just use -b to build with project references
    // Clean the output directory if --clean is passed
    const cleanIndex = additionalArgs.indexOf('--clean');
    if (cleanIndex !== -1) {
      const outDir = 'lib';
      fs.rmSync(path.join(process.cwd(), outDir), { force: true, recursive: true });
      // Don't pass --clean to TS
      additionalArgs.splice(cleanIndex, 1);
    }
  }

  return runScript({
    packageName: 'typescript',
    name: 'tsc',
    args: [...tsArgs, ...additionalArgs],
  });
}
};

export { build };