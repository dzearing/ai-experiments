import { detectPackageType } from '../utilities/detectPackageType.js';
import { runTcm } from '../utilities/runTcm.js';
import { runConcurrently } from '../utilities/runConcurrently.js';
import { runScript } from '../utilities/runScript.js';
import type { Task } from '../types.js';

const devWsl: Task = {
  command: 'dev-wsl',
  description: 'Start development server with host binding for WSL',
  execute: async (additionalArgs = []) => {
    const packageType = detectPackageType();
    
    switch (packageType) {
      case 'react-app':
        // Run tcm first
        await runTcm();
        
        // Then run vite and tcm watch concurrently
        return runConcurrently({
          commands: [
            { name: 'vite', command: 'vite --host' },
            { name: 'tcm', command: 'tcm src --watch' },
          ],
        });
        
      case 'component-library':
        // For libraries, run tsc and tcm in watch mode
        return runConcurrently({
          commands: [
            { name: 'tsc', command: 'tsc -b --watch' },
            { name: 'tcm', command: 'tcm src --watch' },
          ],
        });
        
      case 'node-app':
        // For node apps, just run tsc in watch mode
        return runScript({
          packageName: 'typescript',
          name: 'tsc',
          args: ['-b', '--watch', ...additionalArgs],
        });
        
      default:
        console.error('Unable to determine package type for dev mode');
        process.exit(1);
    }
  },
};

export { devWsl };