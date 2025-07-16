import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import chalk from 'chalk';
import { getPackageData } from '../utilities/getPackageData.js';
import type { Task, TaskResult } from '../types.js';

const lint: Task = {
  command: 'lint',
  description: 'Run ESLint on source files',
  quiet: true, // This task handles its own output
  execute: async function lint(additionalArgs = []): Promise<TaskResult> {
  const cwd = process.cwd();
  const configPath = [path.join(cwd, 'eslint.config.js'), path.join(cwd, 'eslint.config.mjs')].find((name) =>
    fs.existsSync(name),
  );

  if (!configPath) {
    throw new Error('Could not find eslint config relative to ' + cwd);
  }

  const srcPath = path.join(cwd, 'src');

  // Get package info for display
  const packageInfo = getPackageData(cwd);
  const packageName = packageInfo.packageJson.name || path.basename(cwd);
  
  // Display start message
  console.log(chalk.cyan(`[${chalk.bold('lint')}]`) + ' ' + packageName);
  
  // Find ESLint binary
  const { getPackageData: getPkgData } = await import('../utilities/getPackageData.js');
  const eslintPkg = getPkgData({ name: 'eslint', fromPath: cwd });
  const eslintPath = path.join(eslintPkg.packageRoot, 'bin/eslint.js');
  
  const args = [
    eslintPath,
    fs.existsSync(srcPath) ? srcPath : cwd,
    '--config',
    configPath,
    '--color',
    '--max-warnings',
    '0',
    ...additionalArgs,
  ];
  
  return new Promise((resolve, reject) => {
    let output = '';
    
    const proc = spawn('node', args, {
      cwd,
      env: process.env,
    });
    
    proc.stdout?.on('data', (data) => {
      const str = data.toString();
      output += str;
      process.stdout.write(data);
    });
    
    proc.stderr?.on('data', (data) => {
      process.stderr.write(data);
    });
    
    proc.on('close', (code) => {
      // Parse ESLint output for summary
      const problemMatch = output.match(/(\d+)\s+problems?\s+\((\d+)\s+errors?,\s+(\d+)\s+warnings?\)/);
      const fixableMatch = output.match(/(\d+)\s+errors?\s+and\s+(\d+)\s+warnings?\s+potentially\s+fixable/);
      
      if (code === 0) {
        resolve({
          success: true,
          summary: 'completed successfully',
        });
      } else if (problemMatch) {
        const [, , errors, warnings] = problemMatch;
        const errorCount = parseInt(errors || '0', 10);
        const warningCount = parseInt(warnings || '0', 10);
        
        const parts = [];
        
        if (errorCount > 0) {
          parts.push(chalk.red(`${errorCount} error${errorCount !== 1 ? 's' : ''}`) );
        }
        if (warningCount > 0) {
          parts.push(chalk.yellow(`${warningCount} warning${warningCount !== 1 ? 's' : ''}`) );
        }
        
        if (fixableMatch) {
          const [, fixableErrors, fixableWarnings] = fixableMatch;
          const totalFixable = parseInt(fixableErrors || '0', 10) + parseInt(fixableWarnings || '0', 10);
          if (totalFixable > 0) {
            parts.push(chalk.dim(`${totalFixable} fixable`));
          }
        }
        
        resolve({
          success: false,
          summary: parts.join(', '),
          details: {
            errors: errorCount,
            warnings: warningCount,
            fixable: fixableMatch ? parseInt(fixableMatch[1] || '0', 10) + parseInt(fixableMatch[2] || '0', 10) : undefined,
          },
        });
      } else {
        // Fallback for unknown format
        resolve({
          success: false,
          summary: 'failed',
        });
      }
    });
    
    proc.on('error', (err) => {
      reject(err);
    });
  });
}
};

export { lint };